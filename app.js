(() => {
  const app = document.getElementById("app");
  const nav = document.getElementById("nav");
  const roleBadge = document.getElementById("roleBadge");
  const toastEl = document.getElementById("toast");
  let supabaseClient = null;
  let currentUser = null;
  let profile = null;
  let currentView = "home";
  let toastTimer;

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3500);
  }
  function configured() {
    return window.MDP_SUPABASE_URL &&
      !window.MDP_SUPABASE_URL.includes("WKLEJ_TUTAJ") &&
      window.MDP_SUPABASE_PUBLISHABLE_KEY &&
      !window.MDP_SUPABASE_PUBLISHABLE_KEY.includes("WKLEJ_TUTAJ");
  }
  function roleName(role) {
    return ({supervisor:"Opiekun", guardian:"Rodzic", member:"Członek MDP"})[role] || "Użytkownik";
  }
  function shell(title, body) {
    app.innerHTML = `<section class="page-head"><div><p class="eyebrow">MDP WARSZOWICE</p><h1>${esc(title)}</h1></div></section>${body}`;
  }
  function renderSetupError() {
    roleBadge.textContent = "Konfiguracja";
    nav.hidden = true;
    shell("Konfiguracja połączenia", `
      <div class="panel">
        <h2>Brakuje ustawień Supabase</h2>
        <p>Otwórz plik <code>config.js</code> na komputerze i wpisz prawdziwy Project URL oraz Publishable key z panelu Supabase.</p>
        <p>Nie używaj klucza <code>secret</code> ani <code>service_role</code>. Zapisz plik, wgraj go do głównego katalogu repozytorium GitHub i odśwież tę stronę.</p>
      </div>`);
  }
  function renderAuth() {
    roleBadge.textContent = "Niezalogowany";
    nav.hidden = true;
    shell("Witaj w dzienniku", `
      <div class="panel auth-panel">
        <h2>Logowanie</h2>
        <p>Użyj konta utworzonego przez opiekuna MDP Warszowice.</p>
        <form id="loginForm">
          <label>Adres e-mail<input name="email" type="email" autocomplete="username" required></label>
          <label>Hasło<input name="password" type="password" autocomplete="current-password" required></label>
          <button class="primary" type="submit">Zaloguj się</button>
        </form>
        <p class="muted">Nie masz konta? Poproś opiekuna o jego utworzenie. Rejestracja publiczna jest wyłączona.</p>
        <button id="resetPassword" class="secondary" type="button">Nie pamiętam hasła</button>
      </div>`);
    document.getElementById("loginForm").addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const {error} = await supabaseClient.auth.signInWithPassword({
        email: String(fd.get("email")).trim(),
        password: String(fd.get("password"))
      });
      if (error) return toast("Nie udało się zalogować. Sprawdź e-mail i hasło.");
      await loadSession();
    });
    document.getElementById("resetPassword").addEventListener("click", async () => {
      const email = document.querySelector('[name="email"]').value.trim();
      if (!email) return toast("Najpierw wpisz adres e-mail.");
      const {error} = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + location.pathname
      });
      toast(error ? "Nie udało się wysłać wiadomości." : "Jeśli konto istnieje, wysłaliśmy instrukcję resetu hasła.");
    });
  }
  const navItems = [
    ["home","Start","⌂"],["meetings","Zbiórki","▦"],["attendance","Obecności","✓"],
    ["announcements","Komunikaty","!"],["members","Członkowie","♙"],["account","Konto","⚙"]
  ];

function renderNav() {
  nav.hidden = false;

  const visibleItems = profile.role === "supervisor"
    ? navItems
    : navItems.filter(([id]) =>
        !["attendance", "members"].includes(id)
      );

  nav.innerHTML = visibleItems.map(([id, label, icon]) =>
    `<button type="button" class="${currentView === id ? "active" : ""}" data-view="${id}"><span>${icon}</span>${label}</button>`
  ).join("");

  nav.querySelectorAll("[data-view]").forEach(b =>
    b.addEventListener("click", () => {
      currentView = b.dataset.view;
      renderView();
    })
  );
}
  }
  async function loadRows(table, orderColumn, ascending=false) {
    const {data,error} = await supabaseClient.from(table).select("*").order(orderColumn,{ascending});
    if (error) throw error;
    return data || [];
  }
  async function renderView() {
    if (!currentUser || !profile) return;
    roleBadge.textContent = roleName(profile.role);
    renderNav();
    try {
      if (currentView === "home") {
        const meetings = await loadRows("meetings","meeting_date",false);
        const announcements = await loadRows("announcements","created_at",false);
        shell("Cześć!", `
          <div class="hero panel"><p class="eyebrow">PANEL UŻYTKOWNIKA</p><h2>Witaj w MDP Warszowice</h2><p>Jesteś zalogowany jako ${esc(roleName(profile.role))}.</p></div>
        <div class="stats-grid">
  <button class="stat panel" data-go="meetings">
    <span>Zbiórki</span>
    <strong>${meetings.length}</strong>
  </button>
  <button class="stat panel" data-go="announcements">
    <span>Komunikaty</span>
    <strong>${announcements.length}</strong>
  </button>
  ${profile.role === "supervisor" ? `
    <button class="stat panel" data-go="attendance">
      <span>Obecności</span>
    </button>
    <button class="stat panel" data-go="members">
      <span>Członkowie</span>
    </button>
  ` : ""}
</div>
<div class="panel"><h2>Ostatnie komunikaty</h2>${announcements.slice(0,3).map(a=>`<article class="list-item"><h3>${esc(a.title)}</h3><p>${esc(a.body)}</p><small>${esc(new Date(a.created_at).toLocaleString("pl-PL"))}</small></article>`).join("") || "<p>Brak komunikatów.</p>"}</div>`);
        app.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{currentView=b.dataset.go;renderView();}));
      } else if (currentView === "meetings") {
        const rows = await loadRows("meetings","meeting_date",false);
        shell("Zbiórki", `${profile.role==="supervisor"?`<div class="panel"><h2>Dodaj zbiórkę</h2><form id="meetingForm"><label>Nazwa<input name="title" required maxlength="120"></label><label>Data i godzina<input name="meeting_date" type="datetime-local" required></label><label>Miejsce<input name="location" maxlength="120"></label><label>Informacje<textarea name="notes" rows="3"></textarea></label><button class="primary">Zapisz zbiórkę</button></form></div>`:""}
          <div class="panel">${rows.map(m=>`<article class="list-item"><h3>${esc(m.title)}</h3><p>${esc(new Date(m.meeting_date).toLocaleString("pl-PL"))}${m.location?" · "+esc(m.location):""}</p>${m.notes?`<p>${esc(m.notes)}</p>`:""}</article>`).join("")||"<p>Brak zbiórek.</p>"}</div>`);
        const form=document.getElementById("meetingForm");
        if(form) form.addEventListener("submit",async e=>{
          e.preventDefault();const fd=new FormData(form);
          const {error}=await supabaseClient.from("meetings").insert({title:fd.get("title"),meeting_date:new Date(fd.get("meeting_date")).toISOString(),location:fd.get("location")||null,notes:fd.get("notes")||null,created_by:currentUser.id});
          if(error)return toast("Nie zapisano zbiórki. Sprawdź uprawnienia.");
          toast("Zbiórka zapisana.");renderView();
        });
      } else if (currentView === "announcements") {
        const rows = await loadRows("announcements","created_at",false);
        shell("Komunikaty", `${profile.role==="supervisor"?`<div class="panel"><h2>Nowy komunikat</h2><form id="announcementForm"><label>Tytuł<input name="title" required maxlength="160"></label><label>Treść<textarea name="body" required rows="4"></textarea></label><button class="primary">Opublikuj</button></form></div>`:""}
          <div class="panel">${rows.map(a=>`<article class="list-item"><h3>${esc(a.title)}</h3><p>${esc(a.body)}</p><small>${esc(new Date(a.created_at).toLocaleString("pl-PL"))}</small></article>`).join("")||"<p>Brak komunikatów.</p>"}</div>`);
        const form=document.getElementById("announcementForm");
        if(form)form.addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(form);const {error}=await supabaseClient.from("announcements").insert({title:fd.get("title"),body:fd.get("body"),created_by:currentUser.id});if(error)return toast("Nie opublikowano. Sprawdź uprawnienia.");toast("Komunikat opublikowany.");renderView();});
      } else if (currentView === "members") {
        if(profile.role!=="supervisor"){shell("Członkowie",`<div class="panel"><p>Lista członków jest dostępna tylko w panelu opiekuna. Jeśli potrzebujesz dostępu, skontaktuj się z opiekunem.</p></div>`);return;}
        const rows=await loadRows("members","full_name",true);
        shell("Członkowie",`<div class="panel"><h2>Dodaj członka</h2><form id="memberForm"><label>Imię i nazwisko<input name="full_name" required maxlength="160"></label><button class="primary">Dodaj członka</button></form></div><div class="panel">${rows.map(m=>`<article class="list-item"><strong>${esc(m.full_name)}</strong><span class="status">${m.active?"Aktywny":"Nieaktywny"}</span></article>`).join("")||"<p>Brak członków.</p>"}</div>`);
        document.getElementById("memberForm").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await supabaseClient.from("members").insert({full_name:fd.get("full_name")});if(error)return toast("Nie dodano członka. Sprawdź uprawnienia.");toast("Dodano członka.");renderView();});
      } else if (currentView === "attendance") {
        if(profile.role!=="supervisor"){shell("Obecności",`<div class="panel"><p>Historia obecności zostanie pokazana po przypisaniu Twojego konta do dziecka przez opiekuna.</p></div>`);return;}
        const [members,meetings,rows]=await Promise.all([loadRows("members","full_name",true),loadRows("meetings","meeting_date",false),loadRows("attendance","marked_at",false)]);
        shell("Obecności",`<div class="panel"><h2>Zaznacz obecność</h2>${!meetings.length||!members.length?"Najpierw dodaj członka i zbiórkę.":`<form id="attendanceForm"><label>Zbiórka<select name="meeting_id" required>${meetings.map(m=>`<option value="${esc(m.id)}">${esc(m.title)} — ${esc(new Date(m.meeting_date).toLocaleString("pl-PL"))}</option>`).join("")}</select></label><label>Członek<select name="member_id" required>${members.map(m=>`<option value="${esc(m.id)}">${esc(m.full_name)}</option>`).join("")}</select></label><label>Status<select name="status"><option value="present">Obecny</option><option value="absent">Nieobecny</option><option value="late">Spóźniony</option></select></label><label>Uwagi<textarea name="notes" rows="2"></textarea></label><button class="primary">Zapisz obecność</button></form>`}</div><div class="panel"><h2>Ostatnie wpisy</h2>${rows.slice(0,30).map(r=>{const m=members.find(x=>x.id===r.member_id);const mt=meetings.find(x=>x.id===r.meeting_id);return `<article class="list-item"><strong>${esc(m?.full_name||"Członek")}</strong><p>${esc(mt?.title||"Zbiórka")} · ${({present:"Obecny",absent:"Nieobecny",late:"Spóźniony"})[r.status]}</p></article>`}).join("")||"<p>Brak wpisów.</p>"}</div>`);
        const form=document.getElementById("attendanceForm");
        if(form)form.addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(form);const row={meeting_id:fd.get("meeting_id"),member_id:fd.get("member_id"),status:fd.get("status"),notes:fd.get("notes")||null,marked_by:currentUser.id,marked_at:new Date().toISOString()};const {error}=await supabaseClient.from("attendance").upsert(row,{onConflict:"meeting_id,member_id"});if(error)return toast("Nie zapisano obecności. Sprawdź uprawnienia.");toast("Obecność zapisana.");renderView();});
      } else if (currentView === "account") {
        shell("Konto",`<div class="panel"><p><strong>E-mail:</strong> ${esc(currentUser.email)}</p><p><strong>Rola:</strong> ${esc(roleName(profile.role))}</p><button id="logout" class="secondary">Wyloguj się</button></div>`);
        document.getElementById("logout").addEventListener("click",async()=>{await supabaseClient.auth.signOut();currentUser=null;profile=null;renderAuth();});
      }
    } catch (e) {
      console.error(e);
      shell("Nie udało się wczytać danych",`<div class="panel"><p>Nie udało się pobrać danych z bazy. Sprawdź połączenie oraz reguły dostępu RLS.</p><button id="retry" class="primary">Spróbuj ponownie</button></div>`);
      document.getElementById("retry").addEventListener("click",renderView);
    }
  }
  async function loadSession() {
    const {data,error}=await supabaseClient.auth.getSession();
    if(error||!data.session){currentUser=null;profile=null;return renderAuth();}
    currentUser=data.session.user;
    const {data:row,error:profileError}=await supabaseClient.from("profiles").select("id,full_name,role").eq("id",currentUser.id).maybeSingle();
    if(profileError||!row){currentUser=null;profile=null;return renderAuth();}
    profile=row;
    currentView="home";
    await renderView();
  }
  async function start() {
    if(!configured() || !window.supabase?.createClient) return renderSetupError();
    supabaseClient=window.supabase.createClient(window.MDP_SUPABASE_URL,window.MDP_SUPABASE_PUBLISHABLE_KEY);
    await loadSession();
    supabaseClient.auth.onAuthStateChange((_event) => { setTimeout(loadSession,0); });
  }
  start();
})();
