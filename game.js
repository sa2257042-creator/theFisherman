(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const W = canvas.width, H = canvas.height;
  const waterTop = 235, seabed = 530;
  let score = 0, swimUntil = 0, lastTime = 0;
  let hookState = 'idle', hookY = 285, hookSpeed = 230;
  let caught = [];
  const fishColors = ['#ff7b72','#ffd166','#7bdff2','#b2f7a1','#c7a5ff','#ff9ec4','#ffb86b'];
  const rand = (a,b) => a + Math.random() * (b-a);
  const fish = [];
  function makeFish() {
    const size = rand(13, 24);
    return {
      x: rand(35, W-35), y: rand(waterTop+35, seabed-24), size,
      dir: Math.random() < .5 ? -1 : 1, speed: rand(35, 90),
      color: fishColors[Math.floor(Math.random()*fishColors.length)],
      phase: rand(0, Math.PI*2), caught: false
    };
  }
  for (let i=0; i<10; i++) fish.push(makeFish());

  function roundedRect(x,y,w,h,r,fill) {
    ctx.fillStyle=fill; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill();
  }
  function drawFish(f, now) {
    if (f.caught) return;
    const wiggle = Math.sin(now/120 + f.phase) * 2;
    ctx.save(); ctx.translate(f.x, f.y + wiggle);
    if (f.dir < 0) ctx.scale(-1,1);
    // tail
    ctx.fillStyle=f.color; ctx.beginPath();
    ctx.moveTo(-f.size*.55,0); ctx.lineTo(-f.size*1.05,-f.size*.48);
    ctx.lineTo(-f.size*1.02,f.size*.48); ctx.closePath(); ctx.fill();
    // body
    ctx.beginPath(); ctx.ellipse(0,0,f.size*.72,f.size*.43,0,0,Math.PI*2); ctx.fill();
    // fin
    ctx.globalAlpha=.8; ctx.beginPath(); ctx.moveTo(-2,-2); ctx.lineTo(3,-f.size*.42); ctx.lineTo(9,-1); ctx.closePath(); ctx.fill(); ctx.globalAlpha=1;
    // eye
    ctx.fillStyle='#17324d'; ctx.beginPath(); ctx.arc(f.size*.38,-f.size*.08,2.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(f.size*.42,-f.size*.14,.8,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  function drawBackground(now) {
    // sky
    const sky=ctx.createLinearGradient(0,0,0,waterTop);
    sky.addColorStop(0,'#a9eaff'); sky.addColorStop(1,'#e3fbff');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,waterTop);
    // sun and clouds
    ctx.fillStyle='#ffe58a'; ctx.beginPath(); ctx.arc(770,65,28,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; [[120,70],[350,48],[600,105]].forEach(([x,y])=>{
      ctx.beginPath(); ctx.arc(x,y,18,0,Math.PI*2); ctx.arc(x+20,y-8,24,0,Math.PI*2); ctx.arc(x+43,y,17,0,Math.PI*2); ctx.fill();
    });
    // water
    const sea=ctx.createLinearGradient(0,waterTop,0,H);
    sea.addColorStop(0,'#37bde7'); sea.addColorStop(.55,'#168fc8'); sea.addColorStop(1,'#075b91');
    ctx.fillStyle=sea; ctx.fillRect(0,waterTop,W,H-waterTop);
    ctx.strokeStyle='#b6f3ff'; ctx.lineWidth=3;
    for(let i=0;i<11;i++){
      const x=((i*103 + now*.025)%(W+100))-50, y=waterTop+12+(i%3)*10;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+20,y-5,x+42,y); ctx.stroke();
    }
    // seaweed and rocks
    for(let i=0;i<8;i++){
      const x=25+i*122;
      ctx.strokeStyle=i%2?'#39b980':'#2eaa78'; ctx.lineWidth=6; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(x,seabed+12); ctx.quadraticCurveTo(x-10,seabed-8,x+3,seabed-27); ctx.moveTo(x+5,seabed+12); ctx.quadraticCurveTo(x+18,seabed-3,x+15,seabed-19); ctx.stroke();
    }
    ctx.fillStyle='#e8d39b'; ctx.fillRect(0,seabed+14,W,H-seabed);
    ctx.fillStyle='#c7ad72';
    for(let i=0;i<80;i++){ ctx.beginPath(); ctx.arc((i*71)%W,seabed+20+(i%4)*7,1.5,0,Math.PI*2); ctx.fill(); }
  }
  function drawBoatAndFisherman() {
    // fishing rod from fisherman's hand
    ctx.strokeStyle='#68452c'; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(475,174); ctx.lineTo(530,117); ctx.lineTo(584,126); ctx.stroke();
    // boat hull
    ctx.fillStyle='#9b572f'; ctx.beginPath(); ctx.moveTo(335,197); ctx.lineTo(560,197); ctx.lineTo(526,238); ctx.quadraticCurveTo(450,257,369,235); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#d98a45'; ctx.beginPath(); ctx.moveTo(355,201); ctx.lineTo(544,201); ctx.lineTo(525,218); ctx.lineTo(375,218); ctx.closePath(); ctx.fill();
    // fisherman legs and body
    ctx.strokeStyle='#254b78'; ctx.lineWidth=13; ctx.beginPath(); ctx.moveTo(438,185); ctx.lineTo(427,202); ctx.moveTo(455,185); ctx.lineTo(463,202); ctx.stroke();
    roundedRect(425,145,44,43,12,'#4388df');
    // neck and head
    roundedRect(442,134,13,16,5,'#d99264');
    ctx.fillStyle='#f2bd91'; ctx.beginPath(); ctx.arc(449,121,22,0,Math.PI*2); ctx.fill();
    // hair
    ctx.fillStyle='#68452c'; ctx.beginPath(); ctx.arc(449,115,22,Math.PI,Math.PI*2); ctx.lineTo(470,122); ctx.lineTo(461,120); ctx.closePath(); ctx.fill();
    // face
    ctx.fillStyle='#17324d'; ctx.beginPath(); ctx.arc(456,123,2,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#a65e43'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(459,129,5,.1,1.4); ctx.stroke();
    // hat
    ctx.fillStyle='#f5c451'; ctx.beginPath(); ctx.ellipse(449,104,31,7,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffdb70'; roundedRect(431,88,36,17,8,'#ffdb70');
    // arm reaching rod
    ctx.strokeStyle='#d99264'; ctx.lineWidth=9; ctx.beginPath(); ctx.moveTo(461,156); ctx.lineTo(479,172); ctx.stroke();
  }
  function drawHook() {
    // line follows rod tip down to hook
    ctx.strokeStyle='#f5f8ff'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(584,126); ctx.lineTo(584,hookY); ctx.stroke();
    // hook
    ctx.strokeStyle='#f4f6f8'; ctx.lineWidth=4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(584,hookY-8); ctx.lineTo(584,hookY+8); ctx.quadraticCurveTo(584,hookY+20,596,hookY+15); ctx.quadraticCurveTo(602,hookY+12,598,hookY+8); ctx.stroke();
    // caught fish hang near hook
    caught.forEach((f,i)=>{
      const x=600+(i%3)*23, y=hookY-8-Math.floor(i/3)*23;
      ctx.save(); ctx.translate(x,y); ctx.rotate(-.15);
      ctx.fillStyle=f.color; ctx.beginPath(); ctx.ellipse(0,0,f.size*.65,f.size*.36,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-f.size*.5,0); ctx.lineTo(-f.size,-f.size*.4); ctx.lineTo(-f.size,f.size*.4); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#17324d'; ctx.beginPath(); ctx.arc(f.size*.3,-2,2,0,Math.PI*2); ctx.fill(); ctx.restore();
    });
  }
  function drawStatus() {
    if (hookState !== 'idle') {
      roundedRect(20,18,190,38,12,'#ffffffd9');
      ctx.fillStyle='#23516b'; ctx.font='bold 16px system-ui'; ctx.fillText(hookState==='down'?'Hook going down…':'Bringing in the catch…',32,42);
    }
    if (performance.now() < swimUntil) {
      roundedRect(20,64,145,34,11,'#ffffffd9');
      ctx.fillStyle='#23516b'; ctx.font='bold 15px system-ui'; ctx.fillText('Fish are swimming!',31,86);
    }
  }
  function startFishing() {
    if (hookState !== 'idle') return;
    caught = [];
    hookY = 285;
    hookState = 'down';
  }
  function swim() {
    swimUntil = performance.now() + 3000;
    fish.forEach(f => { if(!f.caught) { f.dir = Math.random()<.5 ? -1 : 1; f.speed=rand(45,115); } });
  }
  function update(dt, now) {
    const swimming = now < swimUntil;
    fish.forEach(f=>{
      if(f.caught) return;
      if(swimming) {
        f.x += f.dir*f.speed*dt;
        if(f.x < f.size+8) { f.x=f.size+8; f.dir=1; }
        if(f.x > W-f.size-8) { f.x=W-f.size-8; f.dir=-1; }
        f.y += Math.sin(now/250+f.phase)*8*dt;
        f.y = Math.max(waterTop+28,Math.min(seabed-25,f.y));
      }
    });
    if(hookState==='down') {
      hookY += hookSpeed*dt;
      // catch every fish the hook touches
      fish.forEach(f=>{
        if(!f.caught && Math.abs(f.x-584)<f.size+8 && Math.abs(f.y-hookY)<f.size+12) {
          f.caught=true; caught.push(f); score++; scoreEl.textContent=score;
        }
      });
      if(hookY >= seabed-8) { hookY=seabed-8; hookState='up'; }
    } else if(hookState==='up') {
      hookY -= hookSpeed*dt;
      if(hookY <= 126) {
        hookY=126; hookState='idle';
        // Replace each caught fish so there are always exactly 10 fish in the sea.
        while(fish.filter(f=>!f.caught).length < 10) fish.push(makeFish());
        caught=[];
      }
    }
  }
  function frame(now) {
    const dt = Math.min((now-lastTime)/1000 || 0, .04); lastTime=now;
    update(dt,now);
    drawBackground(now);
    fish.forEach(f=>drawFish(f,now));
    drawBoatAndFisherman();
    drawHook();
    drawStatus();
    requestAnimationFrame(frame);
  }
  document.getElementById('btnA').addEventListener('click',swim);
  document.getElementById('btnB').addEventListener('click',startFishing);
  window.addEventListener('keydown',e=>{
    if(e.repeat) return;
    if(e.key.toLowerCase()==='a') swim();
    if(e.key.toLowerCase()==='b' || e.code==='Space') startFishing();
  });
  requestAnimationFrame(frame);
})();
