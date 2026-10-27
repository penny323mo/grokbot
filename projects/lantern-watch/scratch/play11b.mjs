import { createRequire } from "node:module"; import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const require=createRequire(import.meta.url); const puppeteer=require("/workspace/nightly/shotkit/node_modules/puppeteer-core");
const ROOT=path.resolve('.');
const server=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(ROOT,decodeURIComponent(p));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(p.startsWith('/_shared/')?200:404);return r.end();}
const t={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'Content-Type':t});fs.createReadStream(f).pipe(r);});
await new Promise(r=>server.listen(8932,r));
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu']});
const pg=await b.newPage(); await pg.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
await pg.goto('http://127.0.0.1:8932/index.html',{waitUntil:'networkidle2'});
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const tap=async sel=>{const box=await pg.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return r.width?{x:r.x+r.width/2,y:r.y+r.height/2}:null;},sel); if(!box) return false; await pg.touchscreen.tap(box.x,box.y); return true;};
const st=()=>pg.evaluate(()=>{const b=__lt.getBattle();return b?b.allies.map(a=>`${a.id}@${a.x},${a.y} moved=${a.hasMoved??a.moved} acted=${a.hasActed??a.acted}`):null;});
await tap('#btnStartCampaign'); await sl(1000); await tap('.map-route-pin.available'); await sl(1000);
for(let i=0;i<30;i++){ if(await tap('#btnNextDialogue')) await sl(300); else break;}
await tap('#btnLaunchBattle'); await sl(1200); 
for(let i=0;i<30;i++){ if(await tap('#btnNextDialogue')) await sl(300); else break;}
await tap('#btnConfirmDeploy'); await sl(3500);
console.log('start',await st());
const tut=await pg.evaluate(()=>document.getElementById('tutorialBoardCard')?.innerText);
console.log('tut',tut);
// Now play tutorial by doing what it says: tap bear
await tap('.grid-tile[data-x="1"][data-y="8"]'); await sl(800);
console.log('after tap bear', await pg.evaluate(()=>({sel:__lt.app.selectedUnit?.id, cls:[...document.querySelectorAll('.grid-tile')].filter(t=>/move|reach/.test(t.className)).length, sample:[...document.querySelectorAll('.grid-tile')].map(t=>t.className).filter(c=>c!=='grid-tile').slice(0,5), tut:document.getElementById('tutorialBoardCard')?.innerText})));
await pg.screenshot({path:'screenshots/play11/20-real-select.png'});
await tap('#btnBoardTutorialAck'); await sl(1500);
console.log('after ack', await st(), await pg.evaluate(()=>document.getElementById('tutorialBoardCard')?.innerText));
await b.close(); server.close();
