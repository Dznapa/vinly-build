/* =========================================================================
   VINLY local prototype — shared behavior
   Header / ticker / footer are injected here so one edit updates every page.
   To change wording/links, edit the strings in this file.
   ========================================================================= */

/* ---- sample data (placeholder, not real inventory) ---- */
const TICKER = [
  {name:"DOMAINE DES…", region:"Burgundy", sub:"Pinot Noir 2019", left:6},
  {name:"SONOMA-CUTRER…", region:"California", sub:"Chardonnay 2021", left:4},
  {name:"ARKAS CABERNET…", region:"California", sub:"Cabernet Sauvignon…", left:6},
  {name:"BEAU VIGNE CABB…", region:"California", sub:"Cabernet Sauvignon…", left:3},
  {name:"BEAU VIGNE JULIE…", region:"California", sub:"Cabernet Sauvignon…", left:5},
  {name:"NAPA VALLEY CABBY", region:"California", sub:"Cabernet Sauvignon…", left:2},
];

const SHOP = [
  {name:"Cool Pack", maker:"Cabernet Sauvignon", country:"United States", region:"", size:"Size (nullml)", price:13.00, off:0, msrp:0, qty:6, stock:true},
  {name:"BOATIQUE MALBEC | 2016", maker:"BOAT? | $BOAT…", country:"Malbec\nUnited States\nCalifornia", region:"", size:"Size (750ml)", price:13.00, off:56.67, msrp:30.00, qty:0, stock:false},
  {name:"RUSSIAN RIVER ROYALE PANTOMI…", maker:"Sit Down | $RRPM…", country:"Pinot Noir\nUnited States\nCalifornia", region:"", size:"Size (750ml)", price:14.00, off:74.55, msrp:55.00, qty:6, stock:true},
  {name:"JUSTIN ISOSCELES | 2021", maker:"Bordeaux Blend", country:"United States\nCalifornia", region:"", size:"Size (750ml)", price:42.00, off:50.59, msrp:85.00, qty:6, stock:true},
  {name:"SONOMA-CUTRER CHARDONNAY", maker:"Chardonnay", country:"United States\nCalifornia", region:"", size:"Size (750ml)", price:18.00, off:40.00, msrp:30.00, qty:6, stock:true},
  {name:"BEAU VIGNE CABERNET", maker:"Cabernet Sauvignon", country:"United States\nCalifornia", region:"", size:"Size (750ml)", price:55.00, off:31.25, msrp:80.00, qty:6, stock:true},
];

const BOTTLE = "assets/bottle.svg";   // generic placeholder bottle
const PACK   = "assets/pack.svg";

/* ---- inline icons ---- */
const I = {
  chart:`<svg viewBox="0 0 24 24"><polyline points="3 17 9 11 13 15 21 6"/><polyline points="16 6 21 6 21 11"/></svg>`,
  bottles:`<svg viewBox="0 0 24 24"><path d="M9 3h2v4l1 2v11H8V9l1-2z"/><path d="M14 3h2v4l1 2v11h-4V9l1-2z"/></svg>`,
  star:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polygon points="12 7 13.5 10.5 17 11 14.5 13.5 15 17 12 15.2 9 17 9.5 13.5 7 11 10.5 10.5"/></svg>`,
  cart:`<svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.2 12.5h11L21 7H6"/></svg>`,
  user:`<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4"/><path d="M4 20c1.5-4 14.5-4 16 0"/></svg>`,
};

/* ---- header ---- */
function renderHeader(cart=0){
  const el = document.getElementById('header'); if(!el) return;
  el.innerHTML = `
  <header class="site-header"><div class="wrap">
    <a class="logo" href="index.html">vinly</a>
    <div class="header-center">NEW TO VINLY? <span class="start">START HERE</span></div>
    <nav class="header-icons">
      <a class="icon" href="sesh.html" title="SESH">${I.chart}</a>
      <a class="icon" href="index.html" title="Shop">${I.bottles}</a>
      <span class="icon" title="Winemaker">${I.star}</span>
      <a class="icon" href="#" title="Cart">${I.cart}<span class="cart-badge">${cart}</span></a>
      <span class="divider-v"></span>
      <a class="icon" href="signup.html" title="Account">${I.user}</a>
    </nav>
  </div></header>`;
}

/* ---- ticker ---- */
let tickerOffset = 0, tickerPaused = false, tickerRAF = null;
function renderTicker(){
  const el = document.getElementById('ticker'); if(!el) return;
  const card = w => `
    <div class="ticker-card">
      <img src="${BOTTLE}" alt="">
      <div class="tc-body">
        <div class="tc-name">${w.name}</div>
        <div class="tc-sub">${w.region}<br>${w.sub}</div>
        <div class="tc-foot">
          <span class="tc-left">Bottles Left: <b>${w.left}</b></span>
          <span class="tc-add">+</span>
        </div>
      </div>
    </div>`;
  const cards = [...TICKER, ...TICKER].map(card).join('');   // doubled for seamless loop
  el.innerHTML = `
    <div class="ticker">
      <span class="ticker-chevron left">&#8249;</span>
      <div class="ticker-track" id="tickerTrack" style="padding:0 40px">${cards}</div>
      <span class="ticker-chevron right">&#8250;</span>
    </div>`;
  const track = document.getElementById('tickerTrack');
  const half = () => track.scrollWidth / 2;
  function step(){
    if(!tickerPaused){ tickerOffset -= 0.5; if(Math.abs(tickerOffset) >= half()) tickerOffset = 0;
      track.style.transform = `translateX(${tickerOffset}px)`; }
    tickerRAF = requestAnimationFrame(step);
  }
  cancelAnimationFrame(tickerRAF); step();
  el.querySelector('.left').onclick = () => { tickerOffset += 300; track.style.transform=`translateX(${tickerOffset}px)`; };
  el.querySelector('.right').onclick = () => { tickerOffset -= 300; track.style.transform=`translateX(${tickerOffset}px)`; };
}
function setTickerPaused(p){ tickerPaused = p; }

/* ---- footer ---- */
function renderFooter(){
  const el = document.getElementById('footer'); if(!el) return;
  const tt=`<svg viewBox="0 0 24 24"><path d="M16 3c.4 2.2 1.8 3.8 4 4v3c-1.6 0-3-.5-4-1.3V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3h3z"/></svg>`;
  const ig=`<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#F26A35" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="#F26A35" stroke-width="2"/><circle cx="17" cy="7" r="1.3"/></svg>`;
  const fb=`<svg viewBox="0 0 24 24"><path d="M14 8h2V5h-2c-2 0-3 1.2-3 3v2H9v3h2v6h3v-6h2l.5-3H14V8.5c0-.3.2-.5.6-.5z"/></svg>`;
  el.innerHTML = `
  <footer class="site-footer"><div class="wrap">
    <a class="logo" href="index.html">vinly</a>
    <div class="foot-links">
      <div><a href="signup.html">Log in</a><a href="#">Customer Service</a></div>
      <div><a href="#">FAQ</a><a href="#">Shipping &amp; Returns</a><a href="#">About Vinly</a></div>
      <div><a href="#">Privacy &amp; Legal</a><a href="#">ADA</a><a href="#">Terms and Conditions</a></div>
    </div>
    <div class="foot-social">
      <span class="icon">${tt}</span><span class="icon">${ig}</span><span class="icon">${fb}</span>
    </div>
  </div></footer>`;
}

/* ---- shop grid ---- */
function renderShop(){
  const grid = document.getElementById('shopGrid'); if(!grid) return;
  grid.innerHTML = SHOP.map(w => `
    <div class="wine-card">
      <div class="bottle"><img src="${w.name==='Cool Pack'?PACK:BOTTLE}" alt=""></div>
      <div class="info">
        <h3>${w.name}</h3>
        <div class="meta">${w.maker}<br>${(w.country||'').replace(/\n/g,'<br>')}<br>${w.size}</div>
        <div class="price">$${w.price.toFixed(2)}</div>
        <div class="msrp">( ${w.off.toFixed(2)}% Off MSRP ) <s>$${w.msrp.toFixed(2)}</s></div>
        ${w.stock ? `<div class="controls">
            <div class="stepper"><button>&minus;</button><span class="qty">${w.qty}</span><button>+</button></div>
            <button class="btn-cart">ADD TO CART</button>
          </div>` : `<div class="out-of-stock">OUT OF STOCK</div>`}
      </div>
    </div>`).join('');
}

/* ---- SESH price chart (canvas) ---- */
function drawSeshChart(canvas){
  if(!canvas) return;
  const dpr = window.devicePixelRatio||1;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  canvas.width = W*dpr; canvas.height = H*dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr);
  const padL=40, padR=20, padT=14, padB=20;
  const max=99, min=0;
  const y = v => padT + (1-(v-min)/(max-min))*(H-padT-padB);
  let pts = Array.from({length:34},()=>20+Math.random()*35);
  function frame(){
    ctx.clearRect(0,0,W,H);
    // axis labels
    ctx.fillStyle="#cfe0ef"; ctx.font="11px 'League Spartan',sans-serif"; ctx.textAlign="right";
    [0,10,20,30,40,50,60,70,80,90,99].forEach(v=>ctx.fillText("$"+v,padL-6,y(v)+3));
    // dashed reference lines
    ctx.setLineDash([5,4]); ctx.lineWidth=1;
    ctx.strokeStyle="rgba(255,255,255,.55)";
    ctx.beginPath(); ctx.moveTo(padL,y(85)); ctx.lineTo(W-padR,y(85)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL,y(60)); ctx.lineTo(W-padR,y(60)); ctx.stroke();
    ctx.setLineDash([]);
    // labels for reference lines
    ctx.fillStyle="#0E2647"; const lbl=(t,yy)=>{ctx.save();ctx.textAlign="center";ctx.fillStyle="#0E2647";
      const w=ctx.measureText(t).width+14; const cx=(padL+W-padR)/2;
      ctx.fillStyle="rgba(10,25,45,.9)"; roundRect(ctx,cx-w/2,yy-9,w,18,4); ctx.fill();
      ctx.fillStyle="#fff"; ctx.fillText(t,cx,yy+3); ctx.restore();};
    // green live line
    ctx.strokeStyle="#36e05a"; ctx.lineWidth=2; ctx.beginPath();
    const stepX=(W-padL-padR)/(pts.length-1);
    pts.forEach((p,i)=>{const xx=padL+i*stepX; i?ctx.lineTo(xx,y(p)):ctx.moveTo(xx,y(p));});
    ctx.stroke();
    // last point dot
    const lx=padL+(pts.length-1)*stepX, ly=y(pts[pts.length-1]);
    ctx.fillStyle="#36e05a"; ctx.beginPath(); ctx.arc(lx,ly,4,0,7); ctx.fill();
    // place ref labels on top
    ctx.font="11px 'League Spartan',sans-serif";
    lbl("$85 MSRP", y(85)); lbl("$60 STREET PRICE", y(60));
  }
  function roundRect(c,x,yy,w,h,r){c.beginPath();c.moveTo(x+r,yy);c.arcTo(x+w,yy,x+w,yy+h,r);c.arcTo(x+w,yy+h,x,yy+h,r);c.arcTo(x,yy+h,x,yy,r);c.arcTo(x,yy,x+w,yy,r);c.closePath();}
  drawSeshChart._timer && clearInterval(drawSeshChart._timer);
  frame();
  drawSeshChart._timer = setInterval(()=>{ pts.push(20+Math.random()*35); pts.shift(); frame(); }, 1200);
}

/* ---- inventory gauge (svg) ---- */
function drawGauge(container, pct=0.5){
  if(!container) return;
  const w=300,h=170,cx=150,cy=150,r=110;
  const a0=Math.PI, a1=0;                 // 180deg -> 0deg
  const arc=(s,e,col)=>{
    const x1=cx+r*Math.cos(s),y1=cy+r*Math.sin(s),x2=cx+r*Math.cos(e),y2=cy+r*Math.sin(e);
    return `<path d="M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}" stroke="${col}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  };
  const seg=(Math.PI)/3;
  const needleA = a0 - (a0-a1)*pct;
  const nx=cx+(r-22)*Math.cos(needleA), ny=cy+(r-22)*Math.sin(needleA);
  container.innerHTML = `
  <svg viewBox="0 0 ${w} ${h}" width="300">
    ${arc(a0, a0-seg, '#e23b3b')}
    ${arc(a0-seg, a0-2*seg, '#f1c40f')}
    ${arc(a0-2*seg, a1, '#2ecc40')}
    <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="#2e86c1" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="#2e86c1"/>
    <text x="22" y="165" fill="#e23b3b" font-size="13" font-family="League Spartan">EMPTY</text>
    <text x="252" y="165" fill="#2ecc40" font-size="13" font-family="League Spartan">FULL</text>
  </svg>`;
}

/* ---- SESH gated <-> qualified state ---- */
function setSeshState(state){           // 'gated' | 'qualified'
  const root = document.getElementById('seshRoot'); if(!root) return;
  root.classList.toggle('gated', state==='gated');
  root.classList.toggle('qualified', state==='qualified');
  document.querySelectorAll('[data-proto-state]').forEach(b=>
    b.classList.toggle('on', b.dataset.protoState===state));
}

/* ---- boot ---- */
document.addEventListener('DOMContentLoaded', ()=>{
  renderHeader(0); renderTicker(); renderFooter(); renderShop();
  const cv=document.getElementById('seshChart'); if(cv) drawSeshChart(cv);
  const g=document.getElementById('gauge'); if(g) drawGauge(g,0.5);
  const root=document.getElementById('seshRoot'); if(root) setSeshState('gated');
});
