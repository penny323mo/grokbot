import { createRequire } from "node:module"; import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const require=createRequire(import.meta.url); const puppeteer=require("/workspace/nightly/shotkit/node_modules/puppeteer-core");
const ROOT=path.resolve('.'); const OUT='screenshots/play12';
const server=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';if(p.startsWith('/_shared/')){r.writeHead(200,{'Content-Type':'application/javascript'});return r.end('');}
const f=path.join(ROOT,decodeURIComponent(p));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
const t={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'Content-Type':t});fs.createReadStream(f).pipe(r);});
await new Promise(r=>server.listen(8941,r));
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu']});
const pg=await b.newPage(); await pg.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('http://127.0.0.1:8941/index.html',{waitUntil:'networkidle2'});
const sl=ms=>new Promise(r=>setTimeout(r,ms));
let n=0; const shot=async name=>{await pg.screenshot({path:`${OUT}/${String(++n).padStart(2,'0')}-${name}.png`});};
const vis=async sel=>pg.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none';},sel);
const tap=async sel=>{const box=await pg.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return r.width?{x:r.x+r.width/2,y:r.y+r.height/2}:null;},sel); if(!box) return false; await pg.touchscreen.tap(box.x,box.y); return true;};
const tapTile=(x,y)=>tap(`.grid-tile[data-x="${x}"][data-y="${y}"]`);
const log=(...a)=>console.log(...a);
await sl(800); await shot('title');
await tap('#btnStartCampaign'); await sl(1200); await shot('after-start');
for(let i=0;i<10 && await vis('#btnPrologueNext');i++){ await tap('#btnPrologueNext'); await sl(700); if(i===2||i===4) await shot('prologue'+i);} await sl(800);
for(let i=0;i<25 && await vis('#btnNextDialogue');i++){ if(i===0||i===3) await shot('dialogue'+i); await tap('#btnNextDialogue'); await sl(500);}
await shot('after-dialogue');
// click through to battle
for(let i=0;i<10;i++){
  if(await vis('#btnConfirmDeploy')) break;
  if(await vis('#btnNextDialogue')) {await tap('#btnNextDialogue'); await sl(400); continue;}
  if(await vis('#btnLaunchBattle')) {await shot('prebattle'); await tap('#btnLaunchBattle'); await sl(1200); continue;}
  // world map node
  const ok=await pg.evaluate(()=>{const e=[...document.querySelectorAll('.map-route-pin.available')].find(x=>x.getBoundingClientRect().width>0);if(e){e.click();return e.className;}return null;});
  log('node',ok); await sl(1200); if(!ok){await shot('stuck'+i); break;}
}
await shot('deploy');
if(await vis('#btnConfirmDeploy')){await tap('#btnConfirmDeploy'); await sl(3500);}
await shot('battle-start');
for(let i=0;i<4;i++){ if(await vis('#btnBoardTutorialAck')){await shot('tutorial'+i); await tap('#btnBoardTutorialAck'); await sl(600);} if(await vis('#btnCloseTutorialModal')){await shot('tutmodal'+i);await tap('#btnCloseTutorialModal');await sl(500);} }
await shot('battle-clean');
const st=await pg.evaluate(()=>{const b=__lt.getBattle();return {allies:b.allies.map(a=>({id:a.id,x:a.x,y:a.y,hp:a.hp,mhp:a.maxHp})),enemies:b.enemies.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp}))};});
log(JSON.stringify(st));
// select first ally by tap, move toward nearest enemy one tile, attack if possible
const a=st.allies[1]||st.allies[0];
await tapTile(a.x,a.y); await sl(700); await shot('select');
const reach=await pg.evaluate(()=>[...document.querySelectorAll('.grid-tile.move-range,.grid-tile.reachable,.grid-tile.highlight-move,.grid-tile[class*="move"]')].map(t=>[+t.dataset.x,+t.dataset.y]));
log('reach count',reach.length);
let e0=st.enemies[0]; let best=null,bd=1e9; for(const [x,y] of reach){const d=Math.abs(x-e0.x)+Math.abs(y-e0.y); if(d<bd){bd=d;best=[x,y];}}
if(best && !(best[0]===a.x&&best[1]===a.y)){ await tapTile(best[0],best[1]); await sl(300); await shot('walking'); await sl(1500); await shot('moved');}
await shot('action-menu');
// long press attack
const ab=await pg.evaluate(()=>{const e=document.getElementById('btnActionAttack');if(!e)return null;const r=e.getBoundingClientRect();return r.width?{x:r.x+r.width/2,y:r.y+r.height/2}:null;});
if(ab){await pg.mouse.move(ab.x,ab.y);await pg.mouse.down();await sl(800);await shot('longpress-attack');await pg.mouse.up();await sl(400);}
if(await vis('#btnActionWait')){await tap('#btnActionWait'); await sl(600);}
await shot('after-wait');
// end turn
if(await vis('#btnEndTurn')){await tap('#btnEndTurn'); await sl(800); if(await vis('#btnConfirmAction')){await tap('#btnConfirmAction');} await sl(1500); await shot('enemy-turn'); await sl(6000); await shot('player-turn2');}
const st2=await pg.evaluate(()=>{const b=__lt.getBattle();return {turn:b.currentTurn,phase:b.phase,allies:b.allies.map(a=>`${a.id}:${a.hp}/${a.maxHp}`),enemies:b.enemies.map(e=>`${e.id}:${e.hp}`)};});
log(JSON.stringify(st2));
log('errors',errs); await b.close(); server.close();
