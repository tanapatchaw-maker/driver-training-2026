// Synthesises the soundtrack (light background music + UI sound effects) from the cue list in index.html.
// Usage: node tools/audio.cjs cues.json duration out.wav
const fs=require('fs');
const [cuesPath,durS,out]=process.argv.slice(2);
const cues=JSON.parse(fs.readFileSync(cuesPath,'utf8'));const DUR=+durS;
const SR=48000,N=Math.ceil(DUR*SR);
const L=new Float32Array(N),R=new Float32Array(N);
let seed=12345;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const add=(t0,buf,gain=1,pan=0)=>{const i0=Math.round(t0*SR);const gl=gain*Math.min(1,1-pan),gr=gain*Math.min(1,1+pan);
  for(let i=0;i<buf.length;i++){const j=i0+i;if(j<0||j>=N)continue;L[j]+=buf[i]*gl;R[j]+=buf[i]*gr}};
const mk=(sec,f)=>{const n=Math.round(sec*SR),b=new Float32Array(n);for(let i=0;i<n;i++)b[i]=f(i/SR,i);return b};
const TAU=Math.PI*2;
const bell=(freq,dec=.6,len=1)=>mk(len,t=>Math.exp(-t/dec*3)*(Math.sin(TAU*freq*t)+.35*Math.sin(TAU*freq*2.76*t)*Math.exp(-t*8)+.2*Math.sin(TAU*freq*5.4*t)*Math.exp(-t*14))*Math.min(1,t*400));
const noise=()=>rnd()*2-1;
function lp(buf,cut){let y=0;const a=1-Math.exp(-TAU*cut/SR);for(let i=0;i<buf.length;i++){y+=a*(buf[i]-y);buf[i]=y}return buf}
function hp(buf,cut){let y=0,xp=0;const a=Math.exp(-TAU*cut/SR);for(let i=0;i<buf.length;i++){const x=buf[i];y=a*(y+x-xp);xp=x;buf[i]=y}return buf}

const SFX={
  send:()=>{let ph=0;return mk(.12,t=>{const f=520+900*Math.min(1,t/.07);ph+=TAU*f/SR;return Math.sin(ph)*Math.exp(-t*30)*.55})},
  ding:()=>{const a=bell(1567.98,.35,.7),b=bell(2093,.45,.9),o=new Float32Array(a.length+Math.round(.1*SR)+b.length);
    a.forEach((v,i)=>o[i]+=v*.45);b.forEach((v,i)=>o[i+Math.round(.1*SR)]+=v*.42);return o},
  pop:()=>{let ph=0;return mk(.09,t=>{const f=900-450*t/.09;ph+=TAU*f/SR;return Math.sin(ph)*Math.exp(-t*35)*.5})},
  tick:()=>mk(.03,t=>Math.sin(TAU*2600*t)*Math.exp(-t*160)*.4),
  type:()=>hp(mk(.025,t=>noise()*Math.exp(-t*220)*(.5+rnd()*.5)),1500),
  tap:()=>{const b=mk(.05,t=>(Math.sin(TAU*1300*t)*.6+noise()*.4)*Math.exp(-t*120)*.6);return b},
  chime:()=>{const o=new Float32Array(Math.round(1.2*SR));[1046.5,1318.5,1568].forEach((f,k)=>{const b=bell(f,.5,.9);b.forEach((v,i)=>{const j=i+Math.round(k*.07*SR);if(j<o.length)o[j]+=v*.3})});return o},
  success:()=>{const o=new Float32Array(Math.round(2.2*SR));[523.25,659.25,783.99,1046.5,1318.5].forEach((f,k)=>{const b=bell(f,.9,1.6);b.forEach((v,i)=>{const j=i+Math.round(k*.09*SR);if(j<o.length)o[j]+=v*.28})});return o},
  whoosh:()=>{const n=Math.round(.55*SR),o=new Float32Array(n);let y=0;for(let i=0;i<n;i++){const t=i/SR,c=300+3000*Math.sin(Math.PI*t/.55);const a=1-Math.exp(-TAU*c/SR);y+=a*(noise()-y);o[i]=y*Math.sin(Math.PI*t/.55)**2*.6}return o},
  paper:()=>hp(mk(.35,t=>noise()*(rnd()<.3?1:.3)*Math.exp(-t*8)*.35),2000),
  sizzle:()=>hp(mk(2.9,t=>noise()*(rnd()<.05?1:.25)*Math.min(1,t*3)*Math.min(1,(2.9-t)*2)*.22),3000),
  scooter:()=>{let ph=0;return lp(mk(2.6,t=>{const f=55+70*Math.min(1,t/1.2);ph+=f/SR;const saw=2*(ph%1)-1;return saw*(.7+.3*Math.sin(TAU*18*t))*Math.min(1,t*6)*Math.exp(-Math.max(0,t-1.1)*1.6)*.5}),900)},
  scooter2:()=>{let ph=0;return lp(mk(1.4,t=>{const f=110-55*Math.min(1,t/1.0);ph+=f/SR;const saw=2*(ph%1)-1;return saw*(.7+.3*Math.sin(TAU*16*t))*Math.min(1,t*3)*Math.min(1,(1.4-t)*3)*.45}),900)},
  cash:()=>{const o=new Float32Array(Math.round(1.1*SR));const c=hp(mk(.08,t=>noise()*Math.exp(-t*60)*.5),2500);c.forEach((v,i)=>o[i]+=v);
    [2637,3136].forEach((f,k)=>{const b=bell(f,.35,.8);b.forEach((v,i)=>{const j=i+Math.round((.06+k*.09)*SR);if(j<o.length)o[j]+=v*.3})});return o},
  sparkle:()=>{const o=new Float32Array(Math.round(1.2*SR));for(let k=0;k<7;k++){const f=[2093,2349,2637,3136,3520][Math.floor(rnd()*5)];const b=bell(f,.2,.4);b.forEach((v,i)=>{const j=i+Math.round(k*.06*SR);if(j<o.length)o[j]+=v*.14})}return o},
};
for(const c of cues){const f=SFX[c.k];if(!f){console.error('unknown sfx',c.k);continue}add(c.t,f(),c.v??1,c.k==='send'?.15:c.k==='ding'?-.1:0)}

/* ---- background music: cheerful pentatonic marimba groove, 112 bpm ---- */
const bpm=112,beat=60/bpm,bar=beat*4;
const note=m=>440*Math.pow(2,(m-69)/12);
const marimba=(f,len=.5)=>mk(len,t=>(Math.sin(TAU*f*t)+.25*Math.sin(TAU*f*4*t)*Math.exp(-t*30))*Math.exp(-t*7)*Math.min(1,t*600));
const chords=[[60,64,67],[57,60,64],[53,57,60],[55,59,62]]; // C Am F G
const bassN=[36,33,29,31];
const scale=[72,74,76,79,81,84,86,88];
const M=new Float32Array(N),M2=new Float32Array(N);
const madd=(t0,b,g,arr)=>{const i0=Math.round(t0*SR);for(let i=0;i<b.length;i++){const j=i0+i;if(j<N)arr[j]+=b[i]*g}};
let pos=0;const nb=Math.ceil(DUR/bar);
for(let k=0;k<nb;k++){
  const t0=k*bar,ch=chords[k%4];
  // pad
  madd(t0,mk(bar,t=>ch.reduce((s,m)=>s+Math.sin(TAU*note(m)*t)+.3*Math.sin(TAU*note(m)*2*t),0)*Math.min(1,t*2)*Math.min(1,(bar-t)*4)*.035),1,M);
  // bass on 1 and 3 (+ pickup)
  [[0,1],[2,1],[3.5,.6]].forEach(([b,g])=>madd(t0+b*beat,mk(beat*.9,t=>Math.sin(TAU*note(bassN[k%4]+12)*t)*Math.exp(-t*3)*Math.min(1,t*200)*.22*g),1,M));
  // marimba melody: 8th notes, chord tones from pentatonic, deterministic pattern
  for(let s=0;s<8;s++){ if(rnd()<.28)continue; const m=scale[Math.floor(rnd()*scale.length)]; madd(t0+s*beat/2,marimba(note(m),.45),.09,M2); }
  // soft shaker on 8ths, light kick on 1 & 3
  for(let s=0;s<8;s++)madd(t0+s*beat/2,hp(mk(.05,t=>noise()*Math.exp(-t*90)*(s%2?.05:.03)),5000),1,M);
  [0,2].forEach(b=>{let ph=0;madd(t0+b*beat,mk(.25,t=>{ph+=(50+90*Math.exp(-t*30))/SR;return Math.sin(TAU*ph)*Math.exp(-t*14)*.22}),1,M)});
}
for(let i=0;i<N;i++){const t=i/SR;const env=Math.min(1,t/1.2)*Math.min(1,(DUR-t)/2.0);const m=(M[i]+M2[i])*env*.85;L[i]+=m*1.0+M2[i]*env*.12;R[i]+=m*1.0-M2[i]*env*.12}
// normalise + soft clip
let pk=0;for(let i=0;i<N;i++)pk=Math.max(pk,Math.abs(L[i]),Math.abs(R[i]));
const g=.89/Math.max(pk,1e-6);
const buf=Buffer.alloc(44+N*4);
buf.write('RIFF',0);buf.writeUInt32LE(36+N*4,4);buf.write('WAVE',8);buf.write('fmt ',12);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(2,22);
buf.writeUInt32LE(SR,24);buf.writeUInt32LE(SR*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*4,40);
for(let i=0;i<N;i++){buf.writeInt16LE(Math.round(Math.tanh(L[i]*g)*32767),44+i*4);buf.writeInt16LE(Math.round(Math.tanh(R[i]*g)*32767),46+i*4)}
fs.writeFileSync(out,buf);console.log('audio peak',pk.toFixed(3),'->',out);
