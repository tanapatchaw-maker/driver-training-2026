// Usage: node tools/snap.cjs outdir t1 t2 ...   -> outdir/f_<t>.png
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
(async()=>{
  const [out,...ts]=process.argv.slice(2);
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
  p.on('console',m=>console.log('console:',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+path.resolve(__dirname,'../index.html')+'?render');
  await p.evaluate(()=>window.ready);
  for(const t of ts){await p.evaluate(t=>seek(t),+t);await p.screenshot({path:`${out}/f_${t}.png`});}
  await b.close();
})();
