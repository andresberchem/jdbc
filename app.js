import { firebaseConfig } from "./config.js";
import { Q, LV } from "./questions.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, collection, setDoc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $=id=>document.getElementById(id), app=$("app");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const view=h=>{app.innerHTML=h;window.scrollTo(0,0)};
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

function showErr(e){
  console.error(e);
  const c=e.code||"";
  const tips={
    "auth/operation-not-allowed":"Falta activar el acceso anónimo: Firebase > Authentication > Método de acceso > Anónimo.",
    "auth/configuration-not-found":"Falta activar Authentication: en Firebase pulsa Authentication > Comenzar y luego activa el método Anónimo.",
    "auth/admin-restricted-operation":"Falta activar el acceso anónimo: Firebase > Authentication > Método de acceso > Anónimo.",
    "auth/invalid-api-key":"La apiKey de config.js no es válida. Cópiala de nuevo desde Firebase.",
    "auth/api-key-not-valid":"La apiKey de config.js no es válida. Cópiala de nuevo desde Firebase.",
    "permission-denied":"Firestore rechazó la operación: publica las reglas de seguridad del README.",
    "failed-precondition":"Falta crear la base de datos: Firebase > Firestore Database > Crear base de datos."
  };
  view(`<div class="card"><h2>No se pudo conectar</h2><p><b>Error:</b> ${esc(c||e.message)}</p><p>${esc(tips[c]||"Revisa los datos de config.js y que Firestore y Authentication estén creados en Firebase.")}</p></div>`);
}
const isAdmin=new URLSearchParams(location.search).has("admin");
let auth,db,uid,gid,game=null,players=[],cur="",t0=0,timer=null,answered=false,me={name:"",score:0},revealing=false;
let lastRank={},animKey=-1;
const host=()=>isAdmin&&game&&game.hostUid===uid;
const gref=()=>doc(db,"games",gid);

/* ====== INICIO ====== */
async function boot(){
  if(firebaseConfig.apiKey==="PEGAR_AQUI"){view('<div class="card"><h2>Falta configurar Firebase</h2><p>Pega los datos de tu proyecto en <b>firebaseConfig</b> dentro de index.html.</p></div>');return}
  db=getFirestore(initializeApp(firebaseConfig));
  auth=getAuth(); await auth.authStateReady();
  if(isAdmin){
    if(!auth.currentUser||auth.currentUser.isAnonymous)return loginView();
    uid=auth.currentUser.uid;return startAdmin();
  }
  if(!auth.currentUser)await signInAnonymously(auth);
  uid=auth.currentUser.uid;homeView();
}
async function startAdmin(){
  const saved=localStorage.getItem("hg");
  if(saved){const s=await getDoc(doc(db,"games",saved));if(s.exists()&&s.data().hostUid===uid){gid=saved;listen();return}}
  cfgView();
}
function loginView(){
  view(`<h1>Administrador</h1><div class="card"><label for="em">Correo</label><input id="em" type="text" autocomplete="username">
  <label for="pw">Contraseña</label><input id="pw" type="password" autocomplete="current-password">
  <div class="err" id="err"></div><button id="lg">Entrar</button></div>`);
  const go=async()=>{
    try{await signInWithEmailAndPassword(auth,$("em").value.trim(),$("pw").value);uid=auth.currentUser.uid;startAdmin()}
    catch(e){const c=e.code||"";$("err").textContent=["auth/invalid-credential","auth/wrong-password","auth/user-not-found","auth/invalid-email","auth/missing-password"].includes(c)?"Correo o contraseña incorrectos.":c==="auth/operation-not-allowed"?"Activa Correo/contraseña en Firebase > Authentication > Método de acceso.":(c||e.message)}
  };
  $("lg").onclick=go;$("pw").onkeydown=e=>{if(e.key==="Enter")go()};
}
const HERO=`<svg viewBox="0 0 760 260" aria-hidden="true"><defs><path id="p1" d="M150 125C290 40 480 40 620 105"/><path id="p2" d="M620 165C480 245 290 245 150 150"/></defs><use href="#p1" fill="none" stroke="#ff7a2f" stroke-opacity=".5" stroke-width="2" stroke-dasharray="6 8"/><use href="#p2" fill="none" stroke="#3ad1c4" stroke-opacity=".5" stroke-width="2" stroke-dasharray="6 8"/><g fill="none" stroke="#f8e9d0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M42 108h86v44a43 38 0 0 1-86 0z" fill="rgba(255,122,47,.2)"/><path d="M128 118h10a17 17 0 0 1 0 34h-10"/><path d="M30 206h110"/><g class="steam" stroke="#ff7a2f"><path d="M64 92c-10-10 10-18 0-30"/><path d="M85 92c-10-10 10-18 0-30"/><path d="M106 92c-10-10 10-18 0-30"/></g></g><g stroke="#3ad1c4" stroke-width="3" fill="rgba(58,209,196,.14)"><path d="M620 85v110a50 17 0 0 0 100 0V85"/><ellipse cx="670" cy="85" rx="50" ry="17"/><path d="M620 123a50 17 0 0 0 100 0M620 159a50 17 0 0 0 100 0" fill="none"/></g><g font-family="DM Sans,sans-serif" font-size="15" fill="#c9ad8a" text-anchor="middle"><text x="85" y="238">Aplicación Java</text><text x="670" y="238">Base de datos</text></g><text x="385" y="152" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-weight="800" font-size="34" fill="#f8e9d0">JDBC</text><text x="385" y="174" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="13" fill="#c9ad8a">driver</text><g class="pk" opacity="0"><rect x="-33" y="-11" width="66" height="22" rx="11" fill="#ff7a2f"/><text text-anchor="middle" y="4" font-family="JetBrains Mono,monospace" font-size="11" font-weight="700" fill="#2a1206">SELECT</text><animateMotion dur="5.2s" begin="0s" repeatCount="indefinite"><mpath href="#p1"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.88;1" dur="5.2s" begin="0s" repeatCount="indefinite"/></g><g class="pk" opacity="0"><rect x="-33" y="-11" width="66" height="22" rx="11" fill="#ff7a2f"/><text text-anchor="middle" y="4" font-family="JetBrains Mono,monospace" font-size="11" font-weight="700" fill="#2a1206">INSERT</text><animateMotion dur="5.2s" begin="1.3s" repeatCount="indefinite"><mpath href="#p1"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.88;1" dur="5.2s" begin="1.3s" repeatCount="indefinite"/></g><g class="pk" opacity="0"><rect x="-33" y="-11" width="66" height="22" rx="11" fill="#ffd166"/><text text-anchor="middle" y="4" font-family="JetBrains Mono,monospace" font-size="11" font-weight="700" fill="#2a1206">UPDATE</text><animateMotion dur="5.2s" begin="2.6s" repeatCount="indefinite"><mpath href="#p1"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.88;1" dur="5.2s" begin="2.6s" repeatCount="indefinite"/></g><g class="pk" opacity="0"><rect x="-33" y="-11" width="66" height="22" rx="11" fill="#ff7a2f"/><text text-anchor="middle" y="4" font-family="JetBrains Mono,monospace" font-size="11" font-weight="700" fill="#2a1206">DELETE</text><animateMotion dur="5.2s" begin="3.9s" repeatCount="indefinite"><mpath href="#p1"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.88;1" dur="5.2s" begin="3.9s" repeatCount="indefinite"/></g><g class="pk" opacity="0"><rect x="-42" y="-11" width="84" height="22" rx="11" fill="#3ad1c4"/><text text-anchor="middle" y="4" font-family="JetBrains Mono,monospace" font-size="11" font-weight="700" fill="#2a1206">ResultSet</text><animateMotion dur="5.2s" begin="0.6s" repeatCount="indefinite"><mpath href="#p2"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.88;1" dur="5.2s" begin="0.6s" repeatCount="indefinite"/></g><g class="pk" opacity="0"><rect x="-42" y="-11" width="84" height="22" rx="11" fill="#3ad1c4"/><text text-anchor="middle" y="4" font-family="JetBrains Mono,monospace" font-size="11" font-weight="700" fill="#2a1206">ResultSet</text><animateMotion dur="5.2s" begin="3.2s" repeatCount="indefinite"><mpath href="#p2"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.88;1" dur="5.2s" begin="3.2s" repeatCount="indefinite"/></g></svg>`;
function homeView(){
  const g=new URLSearchParams(location.search).get("g")||"";
  view(`<section class="hero"><h1>Puente <em>JDBC</em></h1><p class="sub">Trivia en vivo: conecta Java con tu base de datos y demuestra cuánto sabes. Entra con el código que muestra el administrador.</p>${HERO}</section>
  <div class="card"><label for="code">Código de la partida</label><input id="code" type="text" inputmode="numeric" maxlength="5" value="${esc(g)}">
  <label for="nm">Tu nombre</label><input id="nm" type="text" maxlength="20" autocomplete="off">
  <div class="err" id="err"></div><button id="join">Entrar</button></div>`);
  $("join").onclick=join;
}
async function join(){
  const code=$("code").value.trim(),nm=$("nm").value.trim();
  if(!code||!nm){$("err").textContent="Escribe el código y tu nombre.";return}
  const s=await getDoc(doc(db,"games",code));
  if(!s.exists()){$("err").textContent="No existe una partida con ese código.";return}
  if(s.data().state!=="lobby"){$("err").textContent="Esa partida ya comenzó.";return}
  gid=code;me={name:nm,score:0};
  await setDoc(doc(db,"games",gid,"players",uid),{name:nm,score:0,answered:-1,ok:false,pts:0});
  listen();
}

/* ====== CONFIGURACIÓN (ADMIN) ====== */
function cfgView(){
  view(`<h1>Nueva partida</h1><div class="card"><label for="tl"><b>Tiempo por pregunta</b></label>
  <select id="tl"><option>10</option><option>15</option><option selected>20</option><option>30</option></select>
  <p><b>Niveles que se incluyen</b></p>${LV.map((l,i)=>`<label class="chk"><input type="checkbox" class="lv" value="${i}" checked> ${l}</label>`).join("")}
  <div class="err" id="err"></div><button id="mk">Crear partida</button><p class="note"><a href="#" id="out">Cerrar sesión</a></p></div>`);
  $("out").onclick=async e=>{e.preventDefault();await signOut(auth);location.reload()};
  $("mk").onclick=async()=>{
    const on=[...document.querySelectorAll(".lv:checked")].map(x=>+x.value);
    const order=Q.map((q,i)=>i).filter(i=>on.includes(LV.indexOf(Q[i][0]))).sort((a,b)=>LV.indexOf(Q[a][0])-LV.indexOf(Q[b][0])||Math.random()-.5);
    if(!order.length){$("err").textContent="Elige al menos un nivel.";return}
    gid=String(Math.floor(10000+Math.random()*90000));
    try{
      await setDoc(gref(),{hostUid:uid,state:"lobby",q:0,time:+$("tl").value,order,seed:Math.floor(Math.random()*1e9),created:Date.now()});
      localStorage.setItem("hg",gid);listen();
    }catch(e){
      console.error(e);
      $("err").textContent=e.code==="permission-denied"?"Firebase rechazó crear la partida. Revisa que las reglas estén publicadas y que el correo de las reglas sea exactamente el tuyo, en minúsculas.":(e.code||e.message);
    }
  };
}

/* ====== TIEMPO REAL ====== */
function listen(){
  onSnapshot(gref(),s=>{game=s.data();render()},showErr);
  onSnapshot(collection(db,"games",gid,"players"),s=>{players=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.score-a.score);render()},showErr);
}
function opts(){
  const o=Q[game.order[game.q]][2].map((t,i)=>({t,ok:i===0})),r=rng(game.seed+game.q);
  for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]]}
  return o;
}
function enter(key,fn){if(cur!==key){cur=key;fn()}}
function render(){
  if(!game)return;
  if(game.state==="lobby"){enter("lobby",drawLobby);$("plist").innerHTML=players.map(p=>`<span>${esc(p.name)}</span>`).join("")||"Esperando jugadores…";$("pc").textContent=players.length;if($("st"))$("st").disabled=!players.length}
  else if(game.state==="question"){enter("q"+game.q,drawQ);const n=players.filter(p=>p.answered===game.q).length;$("ans").textContent=`${n} / ${players.length}`;if(host()&&players.length&&n===players.length)reveal()}
  else if(game.state==="reveal"){cur="r"+game.q;drawReveal()}
  else enter("final",drawFinal)
}

/* ====== SALA DE ESPERA ====== */
function drawLobby(){
  const url=location.origin+location.pathname+"?g="+gid;
  view(host()?`<div class="card"><h2>Entra con este código</h2><div class="code">${gid.split("").map(d=>`<span>${d}</span>`).join("")}</div><p class="note">${esc(url)}</p><div id="qr"></div>
  <h2 style="margin-top:22px"><span id="pc">0</span> jugadores</h2><div class="chips" id="plist"></div>
  <div class="row"><button id="st">Empezar partida</button></div></div>`
  :`<div class="card"><h2>¡Estás dentro, ${esc(me.name)}!</h2><p>Espera a que el administrador inicie la partida.</p><h2><span id="pc">0</span> jugadores</h2><div class="chips" id="plist"></div></div>`);
  if(host()){new QRCode($("qr"),{text:url,width:200,height:200});$("st").onclick=()=>updateDoc(gref(),{state:"question",q:0})}
}

/* ====== PREGUNTA ====== */
function drawQ(){
  const [lvl,text]=Q[game.order[game.q]],o=opts();answered=false;revealing=false;
  lastRank={};players.forEach((p,i)=>lastRank[p.id]=i+1);
  view(`<div class="card ${host()?"host":""}"><div class="dots">${game.order.map((_,i)=>`<i class="${i<game.q?"done":i===game.q?"now":""}"></i>`).join("")}</div>
  <div class="hud"><span class="lvl">${lvl}</span><span id="ans">0 / 0</span><span class="sec" id="sec"></span></div>
  <div class="timer"><i id="tbar"></i></div><p class="q">${esc(text)}</p>
  <div class="opts">${o.map((x,i)=>`<button class="opt" data-i="${i}" style="animation-delay:${i*80}ms"><span class="ltr">${"ABCD"[i]}</span><span>${esc(x.t)}</span></button>`).join("")}</div>
  <div class="err" id="fb"></div>${host()?'<div class="row"><button id="rv" class="alt">Mostrar resultados</button></div>':""}</div>`);
  if(host())$("rv").onclick=reveal;
  else document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>answer(+b.dataset.i,o));
  t0=Date.now();clearInterval(timer);timer=setInterval(tick,200);tick();
}
function tick(){
  const left=Math.max(0,game.time-(Date.now()-t0)/1000),b=$("tbar");if(!b)return;
  b.style.width=left/game.time*100+"%";b.classList.toggle("low",left<6);$("sec").textContent=Math.ceil(left);
  if(left<=0){clearInterval(timer);if(host())reveal();else if(!answered){answered=true;$("fb").textContent="Se acabó el tiempo."}}
}
async function answer(i,o){
  if(answered)return;answered=true;
  const left=Math.max(0,game.time-(Date.now()-t0)/1000),ok=o[i].ok,pts=ok?100+Math.round(left/game.time*50):0;
  me.score+=pts;
  document.querySelectorAll(".opt").forEach((b,k)=>b.classList.add(k===i?"sel":"dim"));
  $("fb").style.color="var(--ink)";$("fb").textContent="Respuesta enviada. Espera los resultados.";
  await setDoc(doc(db,"games",gid,"players",uid),{name:me.name,score:me.score,answered:game.q,ok,pts});
}
function reveal(){if(revealing)return;revealing=true;clearInterval(timer);updateDoc(gref(),{state:"reveal"})}

/* ====== CONFETI ====== */
function confetti(power=1){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const c=document.createElement("canvas");c.className="confetti";document.body.appendChild(c);
  const x=c.getContext("2d");c.width=innerWidth;c.height=innerHeight;
  const cols=["#ff7a2f","#3ad1c4","#f8e9d0","#ff5c7a","#ffd166"];
  const ps=Array.from({length:Math.round(110*power)},()=>({x:innerWidth/2,y:innerHeight*.4,vx:(Math.random()-.5)*18*power,vy:-Math.random()*15-4,s:5+Math.random()*7,c:cols[Math.random()*5|0],r:Math.random()*6}));
  let f=0;(function loop(){x.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.r+=.2;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);x.restore()});if(++f<160)requestAnimationFrame(loop);else c.remove()})();
}
/* ====== RANKING DESPUÉS DE CADA PREGUNTA ====== */
function board(n,mv){
  const max=Math.max(1,...players.map(p=>p.score));
  return `<ol class="board">${players.slice(0,n).map((p,i)=>{const d=mv&&lastRank[p.id]?lastRank[p.id]-(i+1):0;
    return `<li class="r${i+1} ${p.id===uid?"me":""}" style="animation-delay:${i*60}ms"><span class="bar" style="width:${p.score/max*100}%"></span><span class="rk">${i+1}</span><span class="nm">${esc(p.name)}</span><span class="mv ${d>0?"up":d<0?"dn":""}">${d>0?"▲"+d:d<0?"▼"+(-d):""}</span><span class="sc">${p.score}</span></li>`}).join("")}</ol>`;
}
function drawReveal(){
  clearInterval(timer);
  const o=opts(),last=game.q===game.order.length-1,fresh=animKey!==game.q;animKey=game.q;
  const m=players.find(p=>p.id===uid),pos=players.findIndex(p=>p.id===uid)+1;
  const list=`<div class="opts host">${o.map((x,i)=>`<div class="opt ${x.ok?"right":"dim"}"><span class="ltr">${x.ok?"✓":"ABCD"[i]}</span><span>${esc(x.t)}</span></div>`).join("")}</div>`;
  let head="",good=false;
  if(!host()){const got=m&&m.answered===game.q;good=got&&m.ok;head=`<div class="big ${good?"win":"lose"}">${got?(m.ok?"¡Correcto!":"Incorrecto"):"Sin respuesta"}</div>
  <p class="sub" style="margin:0 0 18px">${good?"+"+m.pts+" puntos.":"Sin puntos esta vez."}</p>`}
  view(`<div class="card ${fresh?"fresh":""}">${head}${list}${last?"":`<h2 style="margin:28px 0 14px">Ranking</h2>${board(host()?10:5,true)}`}
  ${host()?`<div class="row"><button id="nx">${last?"Revelar al campeón":"Siguiente pregunta"}</button></div>`:""}</div>`);
  if(fresh&&good)confetti(.6);
  if(host())$("nx").onclick=()=>updateDoc(gref(),last?{state:"final"}:{state:"question",q:game.q+1});
}

/* ====== PODIO CON SUSPENSO ====== */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function drawFinal(){
  const ps=players.slice(),pos=players.findIndex(p=>p.id===uid)+1;
  view(`<div class="card fresh"><h2>Resultado final</h2><div id="stage"></div><div id="rest" class="hidden"></div></div>`);
  const rest=()=>{
    $("rest").innerHTML=`${host()?"":`<p class="sub" style="margin:0"><b>${pos===1?"¡Eres el campeón!":`Terminaste en el lugar ${pos} de ${ps.length} con ${me.score} puntos.`}</b></p>`}<h2 style="margin:20px 0 14px">Tabla final</h2>${board(15)}${host()?'<div class="row"><button id="nw">Nueva partida</button></div>':""}`;
    $("rest").classList.remove("hidden");
    if(host())$("nw").onclick=()=>{localStorage.removeItem("hg");location.reload()};
  };
  if(!ps.length){rest();return}
  const slot=i=>ps[i]?`<div class="slot s${i+1}" id="sl${i}"><div class="who">?</div><div class="blk"><b>${i+1}</b></div></div>`:"";
  $("stage").innerHTML=`<p class="drum" id="drum">Contando los puntos…</p><div class="podium">${slot(1)}${slot(0)}${slot(2)}</div>`;
  const say=t=>{if($("drum"))$("drum").innerHTML=t};
  const up=i=>{const e=$("sl"+i);if(!e)return;e.classList.add("up");e.querySelector(".who").innerHTML=`${esc(ps[i].name)}<small>${ps[i].score} puntos</small>`};
  (async()=>{
    await sleep(2500);
    if(ps[2]){say("En tercer lugar…");await sleep(2200);up(2);await sleep(2600)}
    if(ps[1]){say("En segundo lugar…");await sleep(2200);up(1);await sleep(2800)}
    say("¿Y el campeón es…?");await sleep(1800);
    for(let n=5;n>0;n--){say(`<span class="count">${n}</span>`);await sleep(1000)}
    say("¡Tenemos campeón!");up(0);confetti(1.6);await sleep(900);confetti(1);await sleep(1300);
    rest();
  })();
}
boot().catch(showErr);