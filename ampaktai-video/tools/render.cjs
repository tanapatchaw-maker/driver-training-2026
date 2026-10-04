// Renders index.html frame-by-frame with headless Chromium and encodes the MP4 (1920x1080 or 1080x1920, 30fps, AAC audio).
// Usage: node tools/render.cjs [out.mp4] [workers] [v]   (v = vertical 1080x1920 for TikTok/Reels)
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const {spawn,execFileSync}=require('child_process');
const path=require('path'),fs=require('fs'),os=require('os');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.resolve(process.argv[2]||path.join(ROOT,'ampaktai-line-order.mp4'));
const W=+(process.argv[3]||4),FPS=30;
const VERT=process.argv[4]==='v';const VW=VERT?1080:1920,VH=VERT?1920:1080;
const TMP=fs.mkdtempSync(path.join(process.env.TMPDIR||os.tmpdir(),'ampaktai-'));
(async()=>{
  const browser=await chromium.launch();
  const open=async()=>{const p=await browser.newPage({viewport:{width:VW,height:VH}});p.on('pageerror',e=>console.error('page error:',e.message));
    await p.goto('file://'+path.join(ROOT,'index.html')+'?render'+(VERT?'&v':''));await p.evaluate(()=>window.ready);return p};
  const p0=await open();
  const {dur,sfx}=await p0.evaluate(()=>({dur:window.DURATION,sfx:window.SFX}));
  fs.writeFileSync(path.join(TMP,'cues.json'),JSON.stringify(sfx));
  execFileSync('node',[path.join(__dirname,'audio.cjs'),path.join(TMP,'cues.json'),String(dur),path.join(TMP,'audio.wav')],{stdio:'inherit'});
  const total=Math.round(dur*FPS),per=Math.ceil(total/W);
  console.log(`rendering ${total} frames with ${W} workers`);
  const t0=Date.now();let done=0;
  await Promise.all(Array.from({length:W},async(_,w)=>{
    const a=w*per,b=Math.min(total,a+per);if(a>=b)return;
    const p=w===0?p0:await open();
    const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r',String(FPS),path.join(TMP,`seg${w}.mp4`)],{stdio:['pipe','inherit','inherit']});
    for(let f=a;f<b;f++){
      await p.evaluate(t=>seek(t),f/FPS);
      const img=await p.screenshot({type:'jpeg',quality:94});
      if(!ff.stdin.write(img))await new Promise(r=>ff.stdin.once('drain',r));
      if(++done%150===0)console.log(`${done}/${total} frames (${((Date.now()-t0)/1000).toFixed(0)}s)`);
    }
    ff.stdin.end();await new Promise(r=>ff.on('close',r));
  }));
  await browser.close();
  fs.writeFileSync(path.join(TMP,'list.txt'),Array.from({length:W},(_,w)=>`file 'seg${w}.mp4'`).filter((_,w)=>fs.existsSync(path.join(TMP,`seg${w}.mp4`))).join('\n'));
  execFileSync('ffmpeg',['-v','error','-y','-f','concat','-safe','0','-i',path.join(TMP,'list.txt'),'-i',path.join(TMP,'audio.wav'),
    '-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',OUT],{stdio:'inherit'});
  fs.rmSync(TMP,{recursive:true,force:true});
  console.log('wrote',OUT,`in ${((Date.now()-t0)/1000).toFixed(0)}s`);
})();
