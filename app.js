const sampleMembers = [
  {id:"1",name:"Anna Kowalska",status:"Nieoznaczono"},
  {id:"2",name:"Jakub Nowak",status:"Nieoznaczono"},
  {id:"3",name:"Oliwia Wiśniewska",status:"Nieoznaczono"},
  {id:"4",name:"Mateusz Wójcik",status:"Nieoznaczono"},
  {id:"5",name:"Zuzanna Kaczmarek",status:"Nieoznaczono"}
];
const initialMeetings = [
  {id:"m1",title:"Pierwsza pomoc",date:"2026-10-24",time:"16:00",note:"Ćwiczenia praktyczne",members:sampleMembers.map(m=>({...m}))},
  {id:"m2",title:"Wiedza pożarnicza",date:"2026-10-17",time:"16:00",note:"Przygotowanie do testu",members:sampleMembers.map(m=>({...m,status:m.id==="2"?"Obecny":"Nieoznaczono"}))}
];
const announcements = [
  {id:"a1",title:"Zbiórka w sobotę",date:"2026-10-20",body:"Pamiętajcie o zbiórce o godzinie 16:00. Zabierzcie ubranie do ćwiczeń."},
  {id:"a2",title:"Ćwiczenia z pierwszej pomocy",date:"2026-10-16",body:"Na najbliższej zbiórce będziemy ćwiczyć podstawowe czynności ratownicze."}
];
let role = "guardian", tab = "home", selectedMeeting = "m1", meetings = initialMeetings;
const app = document.querySelector("#app"), nav = document.querySelector("#nav"), roleBadge = document.querySelector("#roleBadge");
const roleNames = {guardian:"Opiekun",member:"Członek MDP",parent:"Rodzic"};
const navs = {
 guardian:[["home","Start","⌂"],["attendance","Dziennik","☑"],["new","Dodaj","+"],["announcements","Komunikaty","▣"],["stats","Raporty","▥"]],
 member:[["home","Start","⌂"],["attendance","Zbiórki","☑"],["announcements","Komunikaty","▣"]],
 parent:[["home","Start","⌂"],["attendance","Obecność","☑"],["announcements","Komunikaty","▣"]]
};
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){const el=document.querySelector("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),3500)}
function currentMeeting(){return meetings.find(m=>m.id===selectedMeeting)||meetings[0]}
function counts(m){const ms=m?.members||[];return {present:ms.filter(x=>x.status==="Obecny").length,absent:ms.filter(x=>x.status==="Nieobecny").length,late:ms.filter(x=>x.status==="Spóźniony").length}}
function card(content){return `<section class="card">${content}</section>`}
function btn(label,action,secondary=false){return `<button class="btn ${secondary?"secondary":""}" data-action="${action}">${label}</button>`}
function meetingSummary(m){return `<strong>${esc(m.title)}</strong><div class="muted">${esc(m.date)} · ${esc(m.time)}</div>${m.note?`<p class="note">${esc(m.note)}</p>`:""}`}
function home(){
 const m=meetings[0];
 if(role==="guardian") return `<h1 class="greeting">Cześć! 👋</h1><div class="muted">Panel opiekuna</div>
 <div class="stats"><section class="card"><div class="stat-number">${sampleMembers.length}</div><div class="stat-label">Członków MDP</div></section><section class="card"><div class="stat-number">${meetings.length}</div><div class="stat-label">Zbiórek w dzienniku</div></section></div>
 <button class="summon" data-action="summon"><span class="big">🚨</span><strong>ZWOŁAJ MDP</strong><span>Powiadomienie z dźwiękiem syreny · demo</span></button>
 <h2 class="section-title">Zarządzanie drużyną</h2><div class="grid">
 <button class="quick" data-tab="attendance"><span>☑️</span>Dziennik zbiórek</button><button class="quick" data-tab="members"><span>👥</span>Członkowie</button>
 <button class="quick" data-tab="new"><span>➕</span>Dodaj zbiórkę</button><button class="quick" data-tab="stats"><span>📊</span>Frekwencja</button>
 <button class="quick" data-tab="announcements"><span>📣</span>Komunikaty</button></div>
 <h2 class="section-title">Najbliższa zbiórka</h2>${card(`${meetingSummary(m)}${btn("Otwórz dziennik obecności","open-meeting",true)}`)}
 <p class="notice">To jest prototyp. Dane przykładowe są przechowywane w tej sesji i nie synchronizują się między telefonami.</p>`;
 if(role==="parent") return `<h1 class="greeting">Dzień dobry 👋</h1><div class="muted">Panel rodzica · konto demonstracyjne</div>${card(`<strong>Historia obecności dziecka</strong><p class="note">W pełnej wersji rodzic zobaczy wyłącznie dziecko przypisane przez opiekuna.</p>${meetings.map(m=>{const ch=m.members.find(x=>x.id==="2");return `<div class="history"><div><strong>${esc(m.title)}</strong><div class="muted">${esc(m.date)}</div></div><span class="status">${esc(ch?.status||"Nieoznaczono")}</span></div>`}).join("")}`)}<h2 class="section-title">Ostatnie komunikaty</h2>${announcementCards()}`;
 return `<h1 class="greeting">Cześć! 👋</h1><div class="muted">Panel członka MDP · konto demonstracyjne</div>${card(`<strong>Witaj w MDP Warszowice</strong><p class="note">Tutaj sprawdzisz terminy zbiórek i komunikaty. Obecność w dzienniku zatwierdza opiekun.</p>`)}<h2 class="section-title">Najbliższa zbiórka</h2>${card(meetingSummary(m))}<h2 class="section-title">Ostatnie komunikaty</h2>${announcementCards()}`;
}
function attendance(){
 const m=currentMeeting(), c=counts(m);
 let list = role==="parent" ? m.members.filter(x=>x.id==="2") : m.members;
 return `<h1 class="page-title">${role==="guardian"?"Dziennik obecności":"Zbiórki i obecność"}</h1><div class="muted">${role==="guardian"?"Obecność oznacza i zatwierdza opiekun.":"Podgląd tylko do odczytu."}</div>
 <div class="chips">${meetings.map(x=>`<button class="chip ${x.id===m.id?"active":""}" data-meeting="${x.id}"><strong>${esc(x.title)}</strong><div class="muted">${esc(x.date)}</div></button>`).join("")}</div>
 ${card(`${meetingSummary(m)}<div class="counts"><span class="green">Obecni: ${c.present}</span><span class="red">Nieobecni: ${c.absent}</span><span class="gray">Spóźnieni: ${c.late}</span></div>`)}
 ${list.map(member=>card(`<div class="member-name">${role==="parent"?"Jakub Nowak":esc(member.name)}</div><div class="status">Status: ${esc(member.status)}</div>${role==="guardian"?`<div class="status-row">${["Obecny","Nieobecny","Spóźniony"].map(s=>`<button class="status-btn ${member.status===s?"active":""}" data-status="${s}" data-member="${member.id}">${s}</button>`).join("")}</div>`:`<p class="muted">Podgląd tylko do odczytu</p>`}`)).join("")}
 ${role==="guardian"?btn("Zapisz oznaczenia (demo)","save-attendance"):""}
 <p class="notice">W prototypie zmiany nie są zapisywane na serwerze. Nie używaj go jeszcze jako oficjalnego dziennika.</p>`;
}
function newMeeting(){
 if(role!=="guardian") return `<h1 class="page-title">Nowa zbiórka</h1>${card("Tylko opiekun może tworzyć zbiórki.")}`;
 return `<h1 class="page-title">Nowa zbiórka</h1><div class="muted">Dodaj termin i temat zajęć.</div>${card(`<form id="meetingForm">
 <label class="field">Temat zbiórki *</label><input class="input" name="title" required placeholder="Np. Pierwsza pomoc">
 <label class="field">Data</label><input class="input" type="date" name="date" value="2026-10-31" required>
 <label class="field">Godzina</label><input class="input" type="time" name="time" value="16:00" required>
 <label class="field">Notatki / przebieg zajęć</label><textarea class="input" name="note" placeholder="Plan zajęć, materiały, uwagi..."></textarea>
 <button class="btn" type="submit">Dodaj zbiórkę</button></form>`)}`;
}
function members(){
 if(role!=="guardian") return `<h1 class="page-title">Członkowie MDP</h1>${card("Lista członków jest dostępna wyłącznie opiekunowi.")}`;
 return `<h1 class="page-title">Członkowie MDP</h1><div class="muted">Lista demonstracyjna — dane nie są prawdziwe.</div>${sampleMembers.map(m=>card(`<strong>${esc(m.name)}</strong><div class="muted">Członek MDP · konto demo</div>`)).join("")}${btn("Dodaj członka (kolejny etap)","coming-soon",true)}`;
}
function stats(){
 if(role!=="guardian") return `<h1 class="page-title">Frekwencja</h1>${card(role==="parent"?"Rodzic widzi historię przypisanego dziecka.":"Raporty całej drużyny są dostępne dla opiekuna.")}`;
 return `<h1 class="page-title">Frekwencja</h1>${meetings.map(m=>{let c=counts(m),pct=m.members.length?Math.round(c.present/m.members.length*100):0;return card(`<strong>${esc(m.title)}</strong><div class="muted">${esc(m.date)} · ${m.members.length} osób</div><div class="progress"><span style="width:${pct}%"></span></div><p class="note">Obecni: ${c.present} · Nieobecni: ${c.absent} · Spóźnieni: ${c.late}</p>`) }).join("")}`;
}
function announcementCards(){return announcements.map(a=>card(`<strong>${esc(a.title)}</strong><div class="muted">${esc(a.date)}</div><p class="note">${esc(a.body)}</p>`)).join("")}
function announcementScreen(){return `<h1 class="page-title">Komunikaty</h1><div class="muted">Widok demonstracyjny dla wszystkich ról.</div>${role==="guardian"?btn("Dodaj komunikat (kolejny etap)","coming-soon",true):""}${announcementCards()}<p class="notice">Wysyłka push i SMS nie jest jeszcze podłączona.</p>`}
function render(){
 roleBadge.textContent=roleNames[role];
 const pages={home,attendance,new:newMeeting,members,stats,announcements:announcementScreen};
 app.innerHTML=(pages[tab]||home)();
 nav.innerHTML=navs[role].map(([id,label,ico])=>`<button class="nav-item ${tab===id?"active":""}" data-tab="${id}"><span class="ico">${ico}</span>${label}</button>`).join("");
}
document.addEventListener("click",e=>{
 const t=e.target.closest("button"); if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab;render();return}
 if(t.dataset.meeting){selectedMeeting=t.dataset.meeting;render();return}
 if(t.dataset.status){if(role!=="guardian"){toast("Tylko opiekun może zmieniać obecność.");return}
 const m=currentMeeting();m.members=m.members.map(x=>x.id===t.dataset.member?{...x,status:t.dataset.status}:x);render();return}
 switch(t.dataset.action){
  case "summon": if(role!=="guardian"){toast("Tylko opiekun może zwoływać MDP.");break} alert("DEMO: nie wysłano powiadomienia ani SMS-a. W kolejnej wersji podłączymy powiadomienia push z dźwiękiem syreny.");break;
  case "open-meeting": selectedMeeting=meetings[0].id;tab="attendance";render();break;
  case "save-attendance": toast("Oznaczenia są widoczne tylko w tej sesji demonstracyjnej.");break;
  case "coming-soon": toast("Funkcja zostanie dodana w kolejnym etapie.");break;
 }
});
document.addEventListener("submit",e=>{
 if(e.target.id!=="meetingForm")return;
 e.preventDefault();if(role!=="guardian")return;
 const data=new FormData(e.target);
 const m={id:"m"+Date.now(),title:String(data.get("title")).trim(),date:String(data.get("date")),time:String(data.get("time")),note:String(data.get("note")||""),members:sampleMembers.map(x=>({...x,status:"Nieoznaczono"}))};
 meetings.unshift(m);selectedMeeting=m.id;tab="attendance";render();toast("Dodano zbiórkę do prototypu.");
});
roleBadge.addEventListener("click",()=>{role=role==="guardian"?"member":role==="member"?"parent":"guardian";tab="home";render();toast("Tryb demonstracyjny: "+roleNames[role]);});
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
render();