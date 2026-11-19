const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
let W=0,H=0,dpr=1,playing=false,finished=false,last=0,elapsed=0,roadZ=0,score=0,combo=0,bestCombo=0,shake=0;
const keys={left:false,right:false,brake:false};
const car={x:0,velocity:0,speed:0,angle:0,drift:0};
const TAU=Math.PI*2;
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function pathAt(z){return Math.sin(z*.004)*.20+Math.sin(z*.009+1.5)*.11+Math.sin(z*.0017)*.30}
function roadWidth(z){return 1.0+Math.sin(z*.007)*.05}
function project(z){const horizon=H*.37, depth=1/(z*.00082+1); return {y:horizon+(H-horizon)*depth,x:W/2+(pathAt(z)-pathAt(roadZ))*W*.40*depth,w:W*(.045+depth*.46)*roadWidth(z)} }
function draw(){
 const g=ctx; g.clearRect(0,0,W,H);
 // sky
 let sky=g.createLinearGradient(0,0,0,H*.64);sky.addColorStop(0,'#080d1e');sky.addColorStop(.52,'#17243c');sky.addColorStop(1,'#d05a73');g.fillStyle=sky;g.fillRect(0,0,W,H*.65);
 // moon and glow
 g.save();g.globalAlpha=.9;g.fillStyle='#ffe9be';g.shadowBlur=35;g.shadowColor='#f9b979';g.beginPath();g.arc(W*.77,H*.19,Math.min(W,H)*.045,0,TAU);g.fill();g.restore();
 // stars
 g.fillStyle='rgba(213,232,255,.7)';for(let i=0;i<42;i++){let x=(i*173%W),y=(i*71%(H*.3));g.fillRect(x,y, i%5?1:2, i%5?1:2)}
 // far mountain layers
 mountain('#10182c',H*.42,0.28,41);mountain('#0d1426',H*.48,.18,29);mountain('#0a101d',H*.55,.11,19);
 // distant city pinpoints
 g.fillStyle='rgba(255,175,105,.65)';for(let i=0;i<28;i++){let x=(i*97%W),y=H*.48+(i%4)*4;g.fillRect(x,y,2,2)}
 // roadside ground
 g.fillStyle='#090d16';g.fillRect(0,H*.55,W,H*.45);
 // road slices back to front
 const slices=[];for(let i=0;i<34;i++){let z=i*115+60;let p=project(z),q=project(z+115);slices.push([p,q,z])}
 slices.reverse().forEach(([p,q,z],i)=>{let stripe=Math.floor((z+roadZ)/230)%2===0;
   g.fillStyle=stripe?'#1a202b':'#171d27';g.beginPath();g.moveTo(q.x-q.w,q.y);g.lineTo(q.x+q.w,q.y);g.lineTo(p.x+p.w,p.y);g.lineTo(p.x-p.w,p.y);g.closePath();g.fill();
   // edge lines
   g.strokeStyle=stripe?'#e1c66c':'#bd9f5d';g.lineWidth=Math.max(1,p.y/360);g.beginPath();g.moveTo(q.x-q.w*.94,q.y);g.lineTo(p.x-p.w*.94,p.y);g.moveTo(q.x+q.w*.94,q.y);g.lineTo(p.x+p.w*.94,p.y);g.stroke();
   if(Math.floor((z+roadZ)/140)%2===0){g.strokeStyle='rgba(222,224,208,.72)';g.lineWidth=Math.max(1,p.y/500);g.setLineDash([p.w*.12,p.w*.13]);g.beginPath();g.moveTo(q.x,q.y);g.lineTo(p.x,p.y);g.stroke();g.setLineDash([])}
   if(i%3===0) roadside(p,q,z);
 });
 // car
 drawCar();
 if(shake>0){shake*=.9}
}
function mountain(color,base,amp,seed){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,H*.6);for(let x=0;x<=W;x+=24){let n=Math.sin(x*.012+seed)*amp*H+Math.sin(x*.031+seed*3)*amp*H*.35;ctx.lineTo(x,base-n)}ctx.lineTo(W,H*.6);ctx.fill()}
function roadside(p,q,z){let side=(Math.floor((z+roadZ)/460)%2?1:-1);let x=q.x+q.w*side*1.12,y=q.y;let x2=p.x+p.w*side*1.12,y2=p.y;let h=Math.max(3,(H-y)*.06);ctx.strokeStyle='rgba(45,52,68,.8)';ctx.lineWidth=Math.max(1,p.y/250);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-h);ctx.stroke();ctx.fillStyle=(Math.floor(z/460)%2)?'#ff557d':'#62e9dd';ctx.shadowBlur=8;ctx.shadowColor=ctx.fillStyle;ctx.fillRect(x-2,y-h-2,4,3);ctx.shadowBlur=0}
function drawCar(){let baseY=H*.83;let cx=W/2+car.x*W*.27;ctx.save();ctx.translate(cx,baseY);ctx.rotate(car.angle*.1);
 // shadow
 ctx.fillStyle='rgba(0,0,0,.65)';ctx.beginPath();ctx.ellipse(0,15,58,14,0,0,TAU);ctx.fill();
 // drift smoke
 if(car.drift>.2){for(let i=0;i<8;i++){let side=i%2?1:-1, sx=side*(26+Math.random()*18),sy=8+Math.random()*10;ctx.fillStyle=`rgba(190,205,216,${.04+Math.random()*.11})`;ctx.beginPath();ctx.arc(sx,sy,7+Math.random()*13,0,TAU);ctx.fill()}}
 // body
 ctx.shadowColor='#ff477e';ctx.shadowBlur=16;ctx.fillStyle='#e93668';ctx.beginPath();ctx.moveTo(-44,10);ctx.lineTo(-38,-12);ctx.lineTo(-22,-29);ctx.lineTo(22,-29);ctx.lineTo(39,-12);ctx.lineTo(46,10);ctx.lineTo(31,17);ctx.lineTo(-33,17);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
 ctx.fillStyle='#18283b';ctx.beginPath();ctx.moveTo(-20,-25);ctx.lineTo(20,-25);ctx.lineTo(29,-12);ctx.lineTo(-29,-12);ctx.closePath();ctx.fill();
 ctx.fillStyle='#8de4e4';ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(-18,-23);ctx.lineTo(18,-23);ctx.lineTo(22,-15);ctx.lineTo(-23,-15);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
 ctx.fillStyle='#ffedb0';ctx.shadowColor='#fff0a5';ctx.shadowBlur=9;ctx.fillRect(-37,-6,9,5);ctx.fillRect(28,-6,9,5);ctx.shadowBlur=0;ctx.fillStyle='#121722';ctx.fillRect(-43,8,15,8);ctx.fillRect(28,8,15,8);ctx.fillStyle='#ff315d';ctx.fillRect(-27,13,9,3);ctx.fillRect(18,13,9,3);ctx.restore()}
function update(dt){if(!playing)return;elapsed+=dt;let steer=(keys.right?1:0)-(keys.left?1:0);let braking=keys.brake;
 car.speed+=((braking?-55:135)-car.speed)*dt*(braking?3:1.15);car.speed=Math.max(0,Math.min(260,car.speed));
 let turn=steer*(.72+car.speed/450);car.velocity+=turn*dt*2.7;car.velocity*=Math.pow(.08,dt);car.x+=car.velocity*dt;car.x=Math.max(-1.22,Math.min(1.22,car.x));car.angle+=(steer*.8-car.angle)*dt*7;car.drift=braking||Math.abs(car.velocity)>0.18?1:0;
 roadZ+=car.speed*dt*1.9;let off=Math.abs(car.x);if(off>.98){car.speed*=.965;shake=Math.min(5,shake+dt*10)}
 if(car.drift&&Math.abs(car.velocity)>.12&&car.speed>80){combo=Math.min(9.9,combo+dt*.72);score+=Math.floor(car.speed*combo*dt*1.8);bestCombo=Math.max(bestCombo,combo)}else combo=Math.max(0,combo-dt*1.8);
 if(roadZ>10000){playing=false;finished=true;showFinish()}
 updateHud();}
function updateHud(){ $('score').textContent=String(score).padStart(6,'0');$('speed').textContent=String(Math.round(car.speed)).padStart(3,'0');$('timer').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${(elapsed%60).toFixed(1).padStart(4,'0')}`;$('combo').textContent=combo>.1?`x${combo.toFixed(1)}  //  LINKED`:'NO COMBO';$('gear').textContent=car.speed<8?'N':car.speed<75?'2':car.speed<145?'3':'4';$('progressFill').style.width=Math.min(100,roadZ/100)+'%';}
function reset(){elapsed=0;roadZ=0;score=0;combo=0;bestCombo=0;car.x=0;car.velocity=0;car.speed=0;car.angle=0;playing=true;finished=false;$('startPanel').classList.add('hidden');$('finishPanel').classList.add('hidden');$('statusText').textContent='LIVE // SECTOR 01';setTimeout(()=>$('tip').style.opacity=0,5000)}
function showFinish(){$('statusText').textContent='RUN COMPLETE';$('finalScore').textContent=String(score).padStart(6,'0');$('finalCombo').textContent='x'+bestCombo.toFixed(1);$('finishPanel').classList.remove('hidden')}
function loop(t){let dt=Math.min(.04,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
function setKey(k,v){keys[k]=v}
addEventListener('keydown',e=>{if(['ArrowLeft','a','A'].includes(e.key))setKey('left',true);if(['ArrowRight','d','D'].includes(e.key))setKey('right',true);if(e.code==='Space'){e.preventDefault();setKey('brake',true)}if(e.key==='Enter'&&!playing)reset()});addEventListener('keyup',e=>{if(['ArrowLeft','a','A'].includes(e.key))setKey('left',false);if(['ArrowRight','d','D'].includes(e.key))setKey('right',false);if(e.code==='Space')setKey('brake',false)});
document.querySelectorAll('.touch-controls button').forEach(b=>{let k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();setKey(k,true)});['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>setKey(k,false)))})
$('startBtn').onclick=reset;$('againBtn').onclick=reset;$('soundBtn').onclick=()=>{$('soundBtn').textContent=$('soundBtn').textContent==='♪'?'×':'♪'};
requestAnimationFrame(loop);
