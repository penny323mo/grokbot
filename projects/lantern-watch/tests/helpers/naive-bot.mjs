import { CHAPTERS } from '../../js/data/maps.js';
import { GUARDIAN_PROTOS } from '../../js/data/units.js';
import { Battle } from '../../js/engine/battle.js';
import { CampaignManager } from '../../js/engine/campaign.js';
import { RNG } from '../../js/engine/rng.js';
import { Board } from '../../js/engine/board.js';
import { calculateCombat } from '../../js/engine/combat.js';
export function naiveTurn(b){
  for(const a of b.allies.filter(u=>u.hp>0&&!u.acted&&u.role!=='objective'&&u.id!=='lantern_cart')){
    if(b.status.finished)break;
    const en=b.enemies.filter(e=>e.hp>0); if(!en.length)break;
    const tiles=[...b.getReachableFor(a).values()];
    const rng=Array.isArray(a.range)?a.range:[1,a.range||1];
    let best=null;
    for(const m of tiles)for(const e of en){const d=Board.manhattan(m.x,m.y,e.x,e.y);if(d>=rng[0]&&d<=rng[1]){best={m,e};break;}} 
    if(best){b.moveUnit(a,best.m.x,best.m.y);b.confirmAction(a,'attack',best.e);continue;}
    en.sort((p,q)=>Board.manhattan(a.x,a.y,p.x,p.y)-Board.manhattan(a.x,a.y,q.x,q.y));
    tiles.sort((p,q)=>Board.manhattan(p.x,p.y,en[0].x,en[0].y)-Board.manhattan(q.x,q.y,en[0].x,en[0].y));
    if(tiles[0])b.moveUnit(a,tiles[0].x,tiles[0].y);
    b.confirmAction(a,'wait');
  }
  for(const n of b.allies.filter(u=>u.hp>0&&!u.acted))b.confirmAction(n,'wait');
}
export function play(ch,seed,log=false){
  const camp=new CampaignManager(); const r=new RNG(seed);
  const squad=Object.keys(GUARDIAN_PROTOS).slice(0,ch.squadLimit).map(id=>camp.getUnitInstance(id));
  const b=new Battle(ch,squad,null,camp,r);
  let firstDeaths=null;
  for(let t=0;t<40&&!b.status?.finished&&b.phase!=='finished';t++){
    naiveTurn(b); if(b.phase==='finished')break;
    const hp0=b.allies.map(a=>a.hp);
    b.endTurn();
    if(t===0){firstDeaths=b.allies.filter(a=>a.hp<=0).map(a=>a.id);if(log)console.log('after enemy1',b.allies.map((a,i)=>`${a.id}:${hp0[i]}->${a.hp}`).join(' '));}
  }
  return {status:b.status,firstDeaths,turn:b.currentTurn};
}
if(process.argv[2]){const ch=CHAPTERS[+process.argv[2]];let w=0;for(let s=1;s<=50;s++){const r=play(ch,s,s<3);if(r.status?.victory)w++;if(s<3)console.log(JSON.stringify(r));}console.log('wins',w,'/50');}
