"""Original mechanical impact and distorted breath, no third-party recordings."""
import math, random, wave, struct
from pathlib import Path
random.seed(7)
rate = 22050
samples = []
filtered = 0
for n in range(int(rate * 1.3)):
    t = n / rate
    noise = random.uniform(-1, 1)
    filtered = filtered * .82 + noise * .18
    hit = (math.sin(2*math.pi*(76*t-18*t*t)) + filtered*2.5) * math.exp(-t*13)
    scrape = (noise-filtered) * .32 * math.exp(-t*3) * min(1,t*70)
    breath = math.sin(2*math.pi*(430*t-120*t*t)) * .16 * math.exp(-t*3)
    samples.append((hit*.5 + scrape + breath) * min(1,t*1200))
peak = max(abs(v) for v in samples)
path = Path('public/audio/null07-impact.wav')
with wave.open(str(path),'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(rate)
    f.writeframes(b''.join(struct.pack('<h',round(v/peak*.72*32767)) for v in samples))
print(path)
