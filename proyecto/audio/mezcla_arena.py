# Mezcla del short de la arena: voz al frente + efectos sintetizados (sin bibliotecas con licencia), -14 LUFS.
# Viento del desierto de fondo, whoosh en cada cambio de toma, chorro de agua cuando se ve el cántaro, golpe sordo
# cuando el trineo se atora, cuerda tensa, swell lento en la cámara lenta del látigo, olas en la playa, eco de tumba.
# uso: python mezcla_arena.py ../public/voz/voz.wav ../out/final/mezcla.wav
import sys, numpy as np
from dsp import SR, ns, rng, lp, hp, bp, colored, smooth_noise, fades, pan, place, read_wav, write_wav, integrated, dbg, make_ir, convolve_st
L = 38.2; N = ns(L); F = lambda f: f / 30
out = np.zeros((2, N)); r = rng(7)
voz, sr = read_wav(sys.argv[1]); assert sr == SR or True
if sr != SR:
    import subprocess; raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", str(SR), "-f", "f64le", "-"], capture_output=True).stdout
    voz = np.frombuffer(raw, np.float64)[None, :]
v = voz.mean(0)[:N]; V = np.zeros(N); V[:len(v)] = v
def env(pts):  # [(t, gain)] -> per-sample curve
    return np.interp(np.arange(N) / SR, [p[0] for p in pts], [p[1] for p in pts])
# viento: ruido rosa filtrado con ráfagas, más bajo en la tumba
wind = np.stack([lp(colored(N, r, 1.2), 900, 2) * (0.6 + 0.4 * smooth_noise(N, r, 0.25)) for _ in range(2)])
wind += 0.3 * np.stack([bp(colored(N, r, 0.4), 2500, 6000, 1) * (0.5 + 0.5 * smooth_noise(N, r, 0.4)) ** 2 for _ in range(2)])
wenv = env([(0, 0), (0.4, 1), (F(569), 1), (F(575), 0.25), (F(743), 0.25), (F(749), 1), (F(923), 1), (F(929), 0.08), (F(1091), 0.08), (F(1097), 1), (L - 0.3, 1), (L, 0)])
out += wind * wenv * 0.05
# olas en la playa
waves = np.stack([lp(colored(N, r, 0.8), 1800, 2) for _ in range(2)]) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.16 * np.arange(N) / SR)) ** 2
out += waves * env([(0, 0), (F(569), 0), (F(580), 1), (F(735), 1), (F(749), 0), (L, 0)]) * 0.07
# tumba: tono grave y crepitar de antorchas
t = np.arange(N) / SR
drone = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.5 * t)) * 0.5
crack = np.zeros(N)
for t0 in np.sort(r.uniform(F(923), F(1091), 90)):
    i = ns(t0); m = ns(r.uniform(0.004, 0.02)); crack[i:i + m] += r.normal(0, 1, len(crack[i:i + m])) * np.exp(-np.arange(len(crack[i:i + m])) / (m / 4)) * r.uniform(0.2, 1)
tomb_env = env([(0, 0), (F(923), 0), (F(935), 1), (F(1085), 1), (F(1097), 0), (L, 0)])
out += (drone * 0.05 + hp(crack, 1500) * 0.12) * tomb_env
# chorro de agua (ruido con burbujas) mientras se ve el cántaro
water = np.stack([bp(colored(N, r, 0.3), 700, 5000, 2) * (0.7 + 0.3 * smooth_noise(N, r, 6)) for _ in range(2)])
out += water * env([(0, 0), (F(139), 0), (F(143), 1), (F(205), 1), (F(209), 0), (F(286), 0), (F(290), 0.8), (F(352), 0.8), (F(356), 0), (F(496), 0), (F(500), 1.4), (F(567), 1.4), (F(571), 0), (L, 0)]) * 0.035
def whoosh(tp, dur=0.6, g=0.2, lo=300, hi=2200):
    n = ns(dur); x = colored(n, r, 0.6); tt = np.arange(n) / SR; pk = dur * 0.45
    e = np.where(tt < pk, (tt / pk) ** 2, np.exp(-(tt - pk) / (dur * 0.25)))
    y = bp(x, lo, hi, 2) * e
    place(out, pan(fades(y, 0.005, 0.05), r.uniform(-0.3, 0.3)) * g, tp - pk)
for f in [139, 206, 286, 354, 440, 496, 569, 743, 923, 1091]: whoosh(F(f), g=0.16)
whoosh(F(80), 1.2, 0.12, 200, 1400)  # la cámara sube a la estatua
whoosh(F(850), 1.1, 0.12, 200, 1400)  # se abre al final del deslizamiento
def thud(tp, g=0.5, f0=60):
    n = ns(0.9); tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * f0 * tt * (1 + 0.3 * np.exp(-tt / 0.03))) * np.exp(-tt / 0.18) + lp(r.normal(0, 1, n), 500, 2) * np.exp(-tt / 0.05) * 0.6
    place(out, pan(y, 0) * g, tp)
thud(F(375), 0.45)   # el trineo se atora
thud(F(404), 0.25, 75); thud(F(414), 0.2, 80)  # rodillas en la arena
# cuerda tensa (crujido) cuando se atora
creak = np.zeros(ns(1.2)); k = 0.0
while k < 1.15: i = ns(k); creak[i:i + 40] += np.hanning(40) * r.uniform(0.3, 1); k += 1 / r.uniform(40, 70)
creak = bp(creak, 300, 2500, 2) * np.hanning(len(creak))
place(out, pan(creak, -0.2) * 0.5, F(362))
# cámara lenta del látigo: swell grave y lento
n = ns(1.6); tt = np.arange(n) / SR
swell = lp(colored(n, r, 1.5), 300, 2) * np.sin(np.pi * tt / 1.6) ** 2 + np.sin(2 * np.pi * 45 * tt) * np.sin(np.pi * tt / 1.6) ** 2 * 0.4
place(out, pan(swell, 0) * 0.35, F(450))
# deslizamiento sobre arena mojada: siseo suave
hiss = np.stack([bp(colored(N, r, 0.2), 1500, 7000, 2) for _ in range(2)])
out += hiss * env([(0, 0), (F(760), 0), (F(800), 1), (F(918), 1), (F(926), 0), (L, 0)]) * 0.025
# el castillo seco se desmorona
n = ns(0.9); y = bp(r.normal(0, 1, n), 800, 6000, 2) * np.exp(-np.arange(n) / SR / 0.3) * (1 - np.exp(-np.arange(n) / SR / 0.05))
place(out, pan(y, -0.3) * 0.18, F(664))
# remate: un golpe seco en la última palabra y silencio
thud(F(1132), 0.2, 90)
# reverb ligera para unir
ir = make_ir(0.8, 3, pre=0.01)
out = out + 0.15 * convolve_st(out.mean(0), ir)
# voz al frente: efectos 8 dB por debajo de la voz (integrado)
Lv, Lf = integrated(np.stack([V, V])), integrated(out)
out *= dbg(Lv - 8 - Lf)
mix = out + np.stack([V, V])
mix = fades(mix, 0.0, 0.05)
g = dbg(-14 - integrated(mix)); mix *= g
pk = np.abs(mix).max()
if pk > dbg(-1.2): mix *= dbg(-1.2) / pk
write_wav(sys.argv[2], mix)
print(f"voz {Lv:.1f} LUFS, efectos {Lf:.1f} -> mezcla {integrated(mix):.1f} LUFS, pico {20*np.log10(np.abs(mix).max()):.1f} dBFS")
