import { createRequire } from "node:module"; import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const require=createRequire(import.meta.url); const puppeteer=require("/workspace/nightly/shotkit/node_modules/puppeteer-core");
const ROOT=path.resolve('.'); const BASE=process.env.BASE;
let server;
if(!BASE){server=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';if(p.startsWith('/_shared/')){r.writeHead(200,{'Content-Type':'application/javascript'});return r.end('');}
const f=path.join(ROOT,p);if(!fs.existsSync(f)){r.writeHead(404);return r.end();}
const t={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'Content-Type':t});fs.createReadStream(f).pipe(r);});await new Promise(r=>server.listen(8899,r));}
const url=BASE||'http://127.0.0.1:8899/index.html';
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu']});
const pg=await b.newPage(); await pg.setViewport({width:390,height:844,deviceScaleFactor:2});
const errs=[];pg.on('pageerror',e=>errs.push(String(e)));
await pg.evaluateOnNewDocument(()=>localStorage.setItem('lt_tutorial_seen','1'));
await pg.goto(url,{waitUntil:'networkidle2'}); await pg.waitForFunction(()=>!!window.__lt);
const steps=JSON.parse(process.argv[2]||fs.readFileSync(new URL("./verify_battle_ui.steps.json",import.meta.url),"utf8"));
for(const [name,js,wait] of steps){ const r=await pg.evaluate(js); if(r!==undefined)console.log(name,JSON.stringify(r)); await new Promise(r=>setTimeout(r,wait||900)); if(name[0]!=='_')await pg.screenshot({path:`screenshots/v9/${name}.png`}); }
console.log('errors',errs); if(errs.length) process.exitCode=1; await b.close(); server?.close();
