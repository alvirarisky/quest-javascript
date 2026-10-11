"""Original facility sound effects: deterministic PCM synthesis, no recordings."""
import math, random, struct, wave
from pathlib import Path
RATE = 22050
random.seed(707)
def noise(): return random.uniform(-1, 1)
def sine(f,t): return math.sin(2*math.pi*f*t)
def emit(name, duration, sample):
    values=[sample(n/RATE) for n in range(int(RATE*duration))]
    peak=max(abs(v) for v in values) or 1
    with wave.open(str(Path('public/audio')/f'null07-{name}.wav'),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE)
        f.writeframes(b''.join(struct.pack('<h',round(v/peak*.55*32767)) for v in values))
    print(name)
emit('step',.32,lambda t:(noise()*.6+sine(82,t)*.25)*math.exp(-t*24)*min(1,t*700))
emit('door',2.2,lambda t:(noise()*.15+sine(70+t*25,t)*.3+sine(180,t)*.1)*math.sin(math.pi*t/2.2)**2 + noise()*.35*math.exp(-abs(t-1.9)*90))
emit('machine',3.0,lambda t:(sine(46,t)+sine(93,t)*.28+noise()*.06)*.25*math.sin(math.pi*t/3)**2)
emit('radio',1.6,lambda t:(noise()*.3+sine(940+80*sine(3,t),t)*.08)*(0.4+0.6*abs(sine(7,t)))*math.sin(math.pi*t/1.6)**2)
emit('knock',1.8,lambda t:sum((sine(110,t)+noise()*.4)*math.exp(-(t-hit)*32) if t>=hit else 0 for hit in [.06,.53,1.25]))
emit('pipe',2.6,lambda t:sum(sine(freq,t)*math.exp(-t*decay) for freq,decay in [(220,2),(587,4),(916,6)])*.35*min(1,t*600))
emit('steam',2.0,lambda t:noise()*.35*math.sin(math.pi*t/2)**2)
emit('robot',1.9,lambda t:(sine(150+30*sine(4,t),t)*.3+noise()*.08)*math.sin(math.pi*t/1.9)**2)
emit('scan',1.0,lambda t:(sine(650,t)*.2+sine(1300,t)*.08)*sum(math.exp(-(t-hit)*30) if t>=hit else 0 for hit in [.05,.24,.43,.7]))
emit('whisper',2.8,lambda t:noise()*.22*(.4+.6*abs(sine(2.8,t)))*math.sin(math.pi*t/2.8)**2)
