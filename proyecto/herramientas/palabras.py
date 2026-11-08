# Saca los tiempos de cada palabra de una voz: python palabras.py voz.wav palabras.json
import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = m.transcribe(sys.argv[1], language="es", word_timestamps=True, beam_size=5)
out = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(out), "palabras")
for x in out: print(f'{x["s"]:6.2f} {x["e"]:6.2f} f{round(x["s"]*30):4d}  {x["w"]}')
