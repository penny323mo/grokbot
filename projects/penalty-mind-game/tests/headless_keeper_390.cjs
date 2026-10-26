const puppeteer=require('puppeteer-core');const O=process.argv[3];const S=ms=>new Promise(r=>setTimeout(r,ms));(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});await p.goto(process.argv[2],{waitUntil:'networkidle0'});await S(2000);
await p.evaluate(()=>[...document.querySelectorAll('button')].find(e=>/單場/.test(e.textContent))?.click());await S(6000);
await p.mouse.move(195,780);await p.mouse.down();const t0=Date.now();for(let i=1;i<=3;i++){await p.mouse.move(195-27*i,780-110*i)}console.log("swipe ms",Date.now()-t0);await p.mouse.up();
const txt=()=>p.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').slice(0,260));
for(let i=0;i<30;i++){await S(500);if(/撲救/.test(await txt()))break}
console.log('KEEPER TURN:',await txt());await p.screenshot({path:O+'/r4-01-keeper-zones.png'});
await p.touchscreen.tap(301,390);await S(150);console.log('AFTER TAP:',await txt());await p.screenshot({path:O+'/r4-02-keeper-tap-TR.png'});
await S(2500);console.log('RESULT:',await txt());await p.screenshot({path:O+'/r4-03-keeper-result.png'});
await p.goto(process.argv[2],{waitUntil:'networkidle0'});await S(1500);await p.evaluate(()=>[...document.querySelectorAll('button')].find(e=>/世界盃/.test(e.textContent))?.click());await S(1500);await p.screenshot({path:O+'/r4-04-team-select.png'});
console.log('ERRORS:',errs.length,errs.slice(0,3));await b.close()})()
