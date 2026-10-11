import math,random,wave,array
from pathlib import Path
rng=random.Random(7); rate=22050; duration=48; data=array.array('h'); wind=0.; rumble=0.
events=[(6,173),(17,211),(29,149),(40,193)]
for n in range(rate*duration):
 t=n/rate; noise=rng.uniform(-1,1); wind=.96*wind+.04*noise; rumble=.997*rumble+.003*noise
 slow=.7+.3*math.sin(2*math.pi*t/16)
 value=.16*math.sin(2*math.pi*37.5*t)+.075*math.sin(2*math.pi*(55.4166667*t+.07*math.sin(2*math.pi*t/12)))
 value+=.05*math.sin(2*math.pi*110.8333333*t)+.025*math.sin(2*math.pi*220.8333333*t)
 value+=wind*.32*slow+rumble*.7
 for when,freq in events:
  age=t-when
  if 0<age<5: value+=.036*math.exp(-age*.9)*min(age*12,1)*(math.sin(2*math.pi*freq*age)+.35*math.sin(2*math.pi*freq*1.417*age))
 edge=min(1,t/.15,(duration-t)/.15); data.append(round(max(-.9,min(.9,value*edge))*32767))
with wave.open('public/audio/null07-ambience.wav','wb') as f:
 f.setnchannels(1); f.setsampwidth(2); f.setframerate(rate); f.writeframes(data.tobytes())
print('Original 48-second ambient loop generated.')
