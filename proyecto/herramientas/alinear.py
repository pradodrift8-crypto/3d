# Tiempos aproximados por palabra SIN modelo de voz: usa el texto exacto del guion + las pausas del audio.
# 1) reparte las palabras por sílabas sobre el tiempo con voz, 2) pega cada signo de puntuación a la pausa más
# cercana, 3) vuelve a repartir entre esas anclas. Precisión típica 0.1-0.2 s: revisa a mano las palabras clave.
# uso: python alinear.py voz.wav guion.txt palabras.json
import json, re, subprocess, sys
wav, txt, out = sys.argv[1:4]
text = open(txt, encoding="utf-8").read()
words = re.findall(r"[^\s]+", text)
def syl(w):
    w = re.sub(r"[^a-záéíóúüñ]", "", w.lower())
    return max(1, len(re.findall(r"[aeiouáéíóúü]+", w)))
S = [syl(w) for w in words]
punct = [bool(re.search(r"[.,:;!?»]$", w)) for w in words]
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], capture_output=True, text=True).stdout)
log = subprocess.run(["ffmpeg", "-i", wav, "-af", "silencedetect=n=-38dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
sil = list(zip(st, en + [dur] * (len(st) - len(en))))
t0 = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
t1 = sil[-1][0] if sil and sil[-1][1] >= dur - 0.05 else dur
pauses = [(a, b) for a, b in sil if a > t0 + 0.05 and b < t1 - 0.05]
def spread(i0, i1, a, b):  # words i0..i1-1 between a and b, by syllables, over speech time only
    inner = [(max(p, a), min(q, b)) for p, q in pauses if q > a and p < b]
    speech = (b - a) - sum(q - p for p, q in inner)
    tot = sum(S[i0:i1]); res = []
    def at(u):  # speech-time offset u -> real time
        t = a
        for p, q in inner:
            if t + u <= p: return t + u
            u -= p - t; t = q
        return t + u
    c = 0
    for i in range(i0, i1):
        s = at(speech * c / tot); c += S[i]; e = at(speech * c / tot)
        res.append([s, e])
    return res
T = spread(0, len(words), t0, t1)
anchors = [(0, (t0, t0))]
used = set()
for i, p in enumerate(punct[:-1]):
    if not p: continue
    e = T[i][1]
    best = min((abs((a + b) / 2 - e), k) for k, (a, b) in enumerate(pauses) if k not in used) if len(used) < len(pauses) else (9, -1)
    if best[0] < 0.8 and pauses[best[1]][0] > anchors[-1][1][1]:
        used.add(best[1]); anchors.append((i + 1, pauses[best[1]]))
res = []
prev_i, prev_t = 0, t0
for i, (a, b) in anchors[1:]:
    res += spread(prev_i, i, prev_t, a); prev_i, prev_t = i, b
res += spread(prev_i, len(words), prev_t, t1)
data = [{"w": w, "s": round(s, 3), "e": round(e, 3)} for w, (s, e) in zip(words, res)]
json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"{len(words)} palabras, voz {t0:.2f}-{t1:.2f} s, {len(anchors)-1}/{len(pauses)} pausas usadas como anclas")
for x in data: print(f'{x["s"]:6.2f} f{round(x["s"]*30):4d}  {x["w"]}')
