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
  <label>Adres e-mail
    <input name="email" type="email" autocomplete="username" required>
  </label>
  <label>Hasło
    <input name="password" type="password" autocomplete="current-password" required>
  </label>
  <button class="primary" type="submit">Zaloguj się</button>
</form>

<button class="secondary" type="button" id="showRegister">
  Załóż konto
</button>

<div id="registerPanel" class="panel" hidden>
  <h2>Załóż konto MDP Warszowice</h2>

  <form id="registerForm">
    <label>Imię i nazwisko
      <input name="full_name" type="text" autocomplete="name"
        maxlength="100" required>
    </label>

    <label>Adres e-mail
      <input name="email" type="email" autocomplete="email" required>
    </label>

    <label>Hasło (minimum 8 znaków)
      <input name="password" type="password"
        autocomplete="new-password" minlength="8" required>
    </label>

    <label>Typ konta
      <select name="account_type" required>
        <option value="">Wybierz...</option>
        <option value="guardian">Rodzic / opiekun dziecka</option>
        <option value="member">Członek MDP</option>
      </select>
    </label>

    <button class="primary" type="submit">Zarejestruj się</button>
    <button class="secondary" type="button" id="cancelRegister">
      Wróć do logowania
    </button>
  </form>

  <p>Po rejestracji konto będzie oczekiwało na zatwierdzenie przez opiekuna MDP.</p>
</div>

     <p class="muted">Nie masz konta? Kliknij „Załóż konto”, aby zarejestrować się w dzienniku MDP Warszowice.</p>
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
    
document.getElementById("showRegister").addEventListener("click", () => {
  document.getElementById("registerPanel").hidden = false;
  document.getElementById("loginForm").hidden = true;
  document.getElementById("showRegister").hidden = true;
});

document.getElementById("cancelRegister").addEventListener("click", () => {
  document.getElementById("registerPanel").hidden = true;
  document.getElementById("loginForm").hidden = false;
  document.getElementById("showRegister").hidden = false;
});

document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();

  const fd = new FormData(e.currentTarget);
  const fullName = String(fd.get("full_name")).trim();
  const email = String(fd.get("email")).trim();
  const password = String(fd.get("password"));
  const accountType = String(fd.get("account_type"));

  if (!fullName || !email || password.length < 8) {
    return toast("Sprawdź dane. Hasło musi mieć co najmniej 8 znaków.");
  }

  if (!["guardian", "member"].includes(accountType)) {
    return toast("Wybierz typ konta.");
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        requested_role: accountType
      }
    }
  });

  if (error) {
    console.error(error);
    return toast("Nie udało się założyć konta. Sprawdź dane lub spróbuj później.");
  }

  toast("Rejestracja wysłana. Sprawdź e-mail i poczekaj na zatwierdzenie konta.");
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
  ["home","Start","⌂"],
  ["meetings","Zbiórki","▦"],
  ["attendance","Obecności","✓"],
  ["announcements","Komunikaty","!"],
  ["members","Członkowie","♙"],
  ["guardians","Rodzice","♧"],
  ["approval","Zatwierdzanie kont","✓"],
  ["account","Konto","⚙"]
];

function renderNav() {
  nav.hidden = false;

  const visibleItems = profile.role === "supervisor"
    ? navItems
    : navItems.filter(([id]) =>
    !["attendance", "members", "guardians", "approval"].includes(id)
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
        shell("Czołem!", `
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
  
 ${profile.role === "guardian" ? `
    <button class="stat panel" data-go="childAttendance">
      <span>Obecności dziecka</span>
    </button>
  ` : ""}
  
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
        app.querySelectorAll("[data-go]").forEach(button => {
  button.onclick = () => {
    currentView = button.dataset.go;
    renderView();
  };
});
              } else if (currentView === "childAttendance") {
        if (profile.role !== "guardian") {
          currentView = "home";
          return renderView();
        }

        const { data: links, error: linksError } =
          await supabaseClient
            .from("guardian_members")
            .select("member_id")
            .eq("guardian_id", currentUser.id);

        if (linksError) throw linksError;

        const memberIds = (links || []).map(link => link.member_id);

        if (!memberIds.length) {
          shell("Obecności dziecka", `
            <div class="panel">
              <p>Twoje konto nie ma jeszcze przypisanego dziecka. Skontaktuj się z opiekunem MDP.</p>
            </div>
          `);
        } else {
          const { data: attendanceRows, error: attendanceError } =
            await supabaseClient
              .from("attendance")
              .select("meeting_id,member_id,status,notes,marked_at")
              .in("member_id", memberIds)
              .order("marked_at", { ascending: false });

          if (attendanceError) throw attendanceError;

          const meetings = await loadRows("meetings", "meeting_date", false);

          const children = await supabaseClient
            .from("members")
            .select("id,full_name")
            .in("id", memberIds);

          if (children.error) throw children.error;

          shell("Obecności dziecka", `
            ${children.data.map(child => `
              <div class="panel">
                <h2>${esc(child.full_name)}</h2>
                ${(attendanceRows || [])
                  .filter(row => row.member_id === child.id)
                  .map(row => {
                    const meeting = meetings.find(m => m.id === row.meeting_id);
                    const status = {
                      present: "Obecny",
                      absent: "Nieobecny",
                      late: "Spóźniony"
                    }[row.status] || row.status;

                    return `<article class="list-item">
                      <strong>${esc(meeting?.title || "Zbiórka")}</strong>
                      <p>${meeting ? esc(new Date(meeting.meeting_date).toLocaleString("pl-PL")) : ""}</p>
                      <p>Status: ${esc(status)}</p>
                      ${row.notes ? `<p>Uwagi: ${esc(row.notes)}</p>` : ""}
                    </article>`;
                  }).join("") || "<p>Brak zapisanych obecności.</p>"}
              </div>
            `).join("")}
          `);
        }
     
      } else if (currentView === "meetings") {
        if (profile.role !== "supervisor") {
          const rows = await loadRows("meetings", "meeting_date", false);
          shell("Zbiórki", `
            <div class="panel">
              ${rows.map(m => `
                <article class="list-item">
                  <h3>${esc(m.title)}</h3>
                  <p>${esc(new Date(m.meeting_date).toLocaleString("pl-PL"))}${m.location ? " · " + esc(m.location) : ""}</p>
                  ${m.notes ? `<p>${esc(m.notes)}</p>` : ""}
                </article>
              `).join("") || "<p>Brak zbiórek.</p>"}
            </div>
          `);
          return;
        }

        const rows = await loadRows("meetings", "meeting_date", false);

        shell("Zbiórki", `
          <div class="panel">
            <h2>Dodaj zbiórkę</h2>
            <form id="meetingForm">
              <label>Nazwa<input name="title" required maxlength="120"></label>
              <label>Data i godzina<input name="meeting_date" type="datetime-local" required></label>
              <label>Miejsce<input name="location" maxlength="120"></label>
              <label>Informacje<textarea name="notes" rows="3"></textarea></label>
              <button class="primary">Zapisz zbiórkę</button>
            </form>
          </div>

          <div class="panel">
            <h2>Zaplanowane zbiórki</h2>
            ${rows.map(m => `
              <article class="list-item">
                <h3>${esc(m.title)}</h3>
                <p>${esc(new Date(m.meeting_date).toLocaleString("pl-PL"))}${m.location ? " · " + esc(m.location) : ""}</p>
                ${m.notes ? `<p>${esc(m.notes)}</p>` : ""}
               
<button class="secondary" type="button" data-edit-meeting="${esc(m.id)}">Edytuj</button>
<button class="secondary" type="button" data-delete-meeting="${esc(m.id)}">Usuń</button>

                <div id="meeting-edit-${esc(m.id)}"></div>
              </article>
            `).join("") || "<p>Brak zbiórek.</p>"}
          </div>
        `);

        const form = document.getElementById("meetingForm");

        form.addEventListener("submit", async e => {
          e.preventDefault();
          const fd = new FormData(form);

          const { error } = await supabaseClient.from("meetings").insert({
            title: fd.get("title"),
            meeting_date: new Date(fd.get("meeting_date")).toISOString(),
            location: fd.get("location") || null,
            notes: fd.get("notes") || null,
            created_by: currentUser.id
          });

          if (error) return toast("Nie zapisano zbiórki. Sprawdź uprawnienia.");

          toast("Zbiórka zapisana.");
          renderView();
        });

        app.querySelectorAll("[data-edit-meeting]").forEach(button => {
          button.addEventListener("click", () => {
            const meeting = rows.find(m => m.id === button.dataset.editMeeting);
            if (!meeting) return;

            const date = new Date(meeting.meeting_date);
            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
              .toISOString().slice(0, 16);

            const editor = document.getElementById(`meeting-edit-${meeting.id}`);

            editor.innerHTML = `
              <form class="meeting-edit-form">
                <label>Nazwa<input name="title" required maxlength="120" value="${esc(meeting.title)}"></label>
                <label>Data i godzina<input name="meeting_date" type="datetime-local" required value="${localDate}"></label>
                <label>Miejsce<input name="location" maxlength="120" value="${esc(meeting.location || "")}"></label>
                <label>Informacje<textarea name="notes" rows="3">${esc(meeting.notes || "")}</textarea></label>
                <button class="primary" type="submit">Zapisz zmiany</button>
                <button class="secondary cancel-edit" type="button">Anuluj</button>
              </form>
            `;

            const editForm = editor.querySelector("form");

            editForm.addEventListener("submit", async e => {
              e.preventDefault();
              const fd = new FormData(editForm);

              const { error } = await supabaseClient.from("meetings").update({
                title: fd.get("title"),
                meeting_date: new Date(fd.get("meeting_date")).toISOString(),
                location: fd.get("location") || null,
                notes: fd.get("notes") || null
              }).eq("id", meeting.id);

              if (error) {
                console.error(error);
                return toast("Nie zapisano zmian. Sprawdź uprawnienia edycji zbiórek w bazie.");
              }

              toast("Zbiórka została zaktualizowana.");
              renderView();
            });

            editForm.querySelector(".cancel-edit").addEventListener("click", () => {
              editor.innerHTML = "";
            });
          });
        });

        app.querySelectorAll("[data-delete-meeting]").forEach(button => {
          button.addEventListener("click", async () => {
            if (profile.role !== "supervisor") {
              return toast("Tylko opiekun może usunąć zbiórkę.");
            }

            const meetingId = button.dataset.deleteMeeting;

            if (!confirm("Czy na pewno chcesz usunąć tę zbiórkę? Tej operacji nie można cofnąć.")) {
              return;
            }

            const { error } = await supabaseClient
              .from("meetings")
              .delete()
              .eq("id", meetingId);

            if (error) {
              console.error(error);
              return toast("Nie udało się usunąć zbiórki. Sprawdź uprawnienia w Supabase.");
            }

            toast("Zbiórka została usunięta.");
            renderView();
          });
        });

   
} else if (currentView === "announcements") {
  const rows = await loadRows("announcements", "created_at", false);

  const { data: readRows, error: readError } = await supabaseClient
    .from("announcement_reads")
    .select("announcement_id,user_id,read_at");

  if (readError) {
    console.error("Błąd pobierania odczytów:", readError);
    toast("Nie udało się pobrać potwierdzeń odczytu.");
  }

  const reads = readRows || [];

  shell("Komunikaty", `
    ${profile.role === "supervisor" ? `
      <div class="panel">
        <h2>Nowy komunikat</h2>
        <form id="announcementForm">
          <label>Tytuł<input name="title" required maxlength="160"></label>
          <label>Treść<textarea name="body" required rows="4"></textarea></label>
          <button class="primary">Opublikuj</button>
        </form>
      </div>
    ` : ""}

    <div class="panel">
      ${rows.map(a => {
        const myRead = reads.find(
          r => r.announcement_id === a.id && r.user_id === currentUser.id
        );
        const readCount = reads.filter(
          r => r.announcement_id === a.id
        ).length;

        return `
          <article class="list-item">
            <h3>${esc(a.title)}</h3>
            <p>${esc(a.body)}</p>
            <small>${esc(new Date(a.created_at).toLocaleString("pl-PL"))}</small>

            ${profile.role === "supervisor" ? `
              <p><strong>Potwierdzenia odczytu: ${readCount}</strong></p>
              <button class="secondary" type="button"
                data-edit-announcement="${esc(a.id)}">Edytuj</button>
              <button class="secondary" type="button"
                data-delete-announcement="${esc(a.id)}">Usuń</button>
            ` : `
              ${myRead
                ? `<p class="status">Potwierdzono odczyt</p>`
                : `<button class="primary" type="button"
                    data-read-announcement="${esc(a.id)}">
                    Potwierdzam odczyt
                  </button>`
              }
            `}
          </article>
        `;
      }).join("") || "<p>Brak komunikatów.</p>"}
    </div>
  `);

  const form = document.getElementById("announcementForm");

  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(form);

      const { error } = await supabaseClient
        .from("announcements")
        .insert({
          title: fd.get("title"),
          body: fd.get("body"),
          created_by: currentUser.id
        });

      if (error) {
        console.error(error);
        return toast("Nie opublikowano. Sprawdź uprawnienia.");
      }

      toast("Komunikat opublikowany.");
      renderView();
    });
  }

  app.querySelectorAll("[data-read-announcement]").forEach(button => {
    button.addEventListener("click", async () => {
      const { error } = await supabaseClient
        .from("announcement_reads")
        .insert({
          announcement_id: button.dataset.readAnnouncement,
          user_id: currentUser.id
        });

      if (error) {
        console.error(error);
        return toast("Nie udało się potwierdzić odczytu.");
      }

      toast("Potwierdzono odczyt komunikatu.");
      renderView();
    });
  });

  app.querySelectorAll("[data-edit-announcement]").forEach(button => {
    button.addEventListener("click", async () => {
      const a = rows.find(x => x.id === button.dataset.editAnnouncement);
      if (!a || profile.role !== "supervisor") return;

      const title = prompt("Tytuł komunikatu:", a.title);
      if (title === null) return;

      const body = prompt("Treść komunikatu:", a.body);
      if (body === null) return;

      if (!title.trim() || !body.trim()) {
        return toast("Tytuł i treść nie mogą być puste.");
      }

      const { error } = await supabaseClient
        .from("announcements")
        .update({ title: title.trim(), body: body.trim() })
        .eq("id", a.id);

      if (error) {
        console.error(error);
        return toast("Nie udało się edytować komunikatu.");
      }

      toast("Komunikat został zmieniony.");
      renderView();
    });
  });

  app.querySelectorAll("[data-delete-announcement]").forEach(button => {
    button.addEventListener("click", async () => {
      if (profile.role !== "supervisor") return;

      if (!confirm("Czy na pewno usunąć ten komunikat?")) return;

      const { error } = await supabaseClient
        .from("announcements")
        .delete()
        .eq("id", button.dataset.deleteAnnouncement);

      if (error) {
        console.error(error);
        return toast("Nie udało się usunąć komunikatu.");
      }

      toast("Komunikat został usunięty.");
      renderView();
      });
  });

} else if (currentView === "members") {
        if (profile.role !== "supervisor") {
          shell("Członkowie", `<div class="panel"><p>Lista członków jest dostępna tylko w panelu opiekuna.</p></div>`);
          return;
        }

        const rows = await loadRows("members", "full_name", true);

        shell("Członkowie", `
          <div class="panel">
            <h2>Dodaj członka</h2>
            <form id="memberForm">
              <label>Imię i nazwisko
                <input name="full_name" required maxlength="160">
              </label>
              <button class="primary">Dodaj członka</button>
            </form>
          </div>

          <div class="panel">
            <h2>Lista członków</h2>
            ${rows.map(m => `
              <article class="list-item">
                <strong>${esc(m.full_name)}</strong>
                <span class="status">${m.active ? "Aktywny" : "Nieaktywny"}</span>
                <p>
                  
<button class="secondary" type="button" data-edit-member="${esc(m.id)}">Edytuj</button>
<button class="secondary" type="button" data-delete-member="${esc(m.id)}">Usuń</button>

                </p>
                <div id="member-edit-${esc(m.id)}"></div>
              </article>
            `).join("") || "<p>Brak członków.</p>"}
          </div>
        `);

        document.getElementById("memberForm").addEventListener("submit", async e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);

          const { error } = await supabaseClient.from("members").insert({
            full_name: String(fd.get("full_name")).trim()
          });

          if (error) return toast("Nie dodano członka. Sprawdź uprawnienia.");

          toast("Dodano członka.");
          renderView();
        });

       
        app.querySelectorAll("[data-delete-member]").forEach(button => {
    
          
          button.addEventListener("click", async () => {
            if (profile.role !== "supervisor") {
              return toast("Tylko opiekun może usunąć członka.");
            }

            const memberId = button.dataset.deleteMember;
            const member = rows.find(m => m.id === memberId);
            if (!member) return;

            const confirmed = confirm(
              `Czy na pewno chcesz usunąć członka: ${member.full_name}?`
              + "\n\nUsunięcie może być niemożliwe, jeśli ma zapisane obecności lub przypisanego rodzica."
            );

            if (!confirmed) return;

            const { error } = await supabaseClient
              .from("members")
              .delete()
              .eq("id", memberId);

         if (error) {
  console.error("Błąd usuwania członka:", error);
  alert("Błąd Supabase:\n" + error.message);
  return;
}

            toast("Członek został usunięty.");
            renderView();
          });
        });


      } else if (currentView === "attendance") {
        if(profile.role!=="supervisor"){shell("Obecności",`<div class="panel"><p>Historia obecności zostanie pokazana po przypisaniu Twojego konta do dziecka przez opiekuna.</p></div>`);return;}
        const [members,meetings,rows]=await Promise.all([loadRows("members","full_name",true),loadRows("meetings","meeting_date",false),loadRows("attendance","marked_at",false)]);
        shell("Obecności",`<div class="panel"><h2>Zaznacz obecność</h2>${!meetings.length||!members.length?"Najpierw dodaj członka i zbiórkę.":`<form id="attendanceForm"><label>Zbiórka<select name="meeting_id" required>${meetings.map(m=>`<option value="${esc(m.id)}">${esc(m.title)} — ${esc(new Date(m.meeting_date).toLocaleString("pl-PL"))}</option>`).join("")}</select></label><label>Członek<select name="member_id" required>${members.map(m=>`<option value="${esc(m.id)}">${esc(m.full_name)}</option>`).join("")}</select></label><label>Status<select name="status"><option value="present">Obecny</option><option value="absent">Nieobecny</option><option value="late">Spóźniony</option></select></label><label>Uwagi<textarea name="notes" rows="2"></textarea></label><button class="primary">Zapisz obecność</button></form>`}</div><div class="panel"><h2>Ostatnie wpisy</h2>${rows.slice(0,30).map(r=>{const m=members.find(x=>x.id===r.member_id);const mt=meetings.find(x=>x.id===r.meeting_id);return `<article class="list-item"><strong>${esc(m?.full_name||"Członek")}</strong><p>${esc(mt?.title||"Zbiórka")} · ${({present:"Obecny",absent:"Nieobecny",late:"Spóźniony"})[r.status]}</p></article>`}).join("")||"<p>Brak wpisów.</p>"}</div>`);
        const form=document.getElementById("attendanceForm");
        if(form)form.addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(form);const row={meeting_id:fd.get("meeting_id"),member_id:fd.get("member_id"),status:fd.get("status"),notes:fd.get("notes")||null,marked_by:currentUser.id,marked_at:new Date().toISOString()};const {error}=await supabaseClient.from("attendance").upsert(row,{onConflict:"meeting_id,member_id"});if(error)return toast("Nie zapisano obecności. Sprawdź uprawnienia.");toast("Obecność zapisana.");renderView();});
      
      } else if (currentView === "guardians") {
        if (profile.role !== "supervisor") {
          currentView = "home";
          return renderView();
        }

        const { data: guardians, error: guardianError } =
          await supabaseClient.from("profiles")
            .select("id,full_name")
            .eq("role", "guardian")
            .order("full_name");

        if (guardianError) throw guardianError;

        const members = await loadRows("members", "full_name", true);

        const { data: links, error: linksError } =
          await supabaseClient.from("guardian_members")
            .select("guardian_id,member_id");

        if (linksError) throw linksError;

        shell("Rodzice", `
          <div class="panel">
            <h2>Przypisz rodzica do dziecka</h2>
            ${!guardians?.length
              ? "<p>Brak kont rodziców. Najpierw utwórz konto rodzica.</p>"
              : !members.length
              ? "<p>Najpierw dodaj członka drużyny.</p>"
              : `
                <form id="guardianLinkForm">
                  <label>Rodzic
                    <select name="guardian_id" required>
                      ${guardians.map(g => `
                        <option value="${esc(g.id)}">
                          ${esc(g.full_name || "Rodzic bez nazwy")}
                        </option>
                      `).join("")}
                    </select>
                  </label>
                  <label>Dziecko
                    <select name="member_id" required>
                      ${members.map(m => `
                        <option value="${esc(m.id)}">
                          ${esc(m.full_name)}
                        </option>
                      `).join("")}
                    </select>
                  </label>
                  <button class="primary">Przypisz rodzica</button>
                </form>
              `}
          </div>

          <div class="panel">
            <h2>Obecne przypisania</h2>
            ${(links || []).map(link => {
              const g = guardians?.find(x => x.id === link.guardian_id);
              const m = members.find(x => x.id === link.member_id);
              return `<article class="list-item">
                <strong>${esc(g?.full_name || "Rodzic")}</strong>
                <p>${esc(m?.full_name || "Członek")}</p>
              </article>`;
            }).join("") || "<p>Brak przypisań.</p>"}
          </div>
        `);

        const form = document.getElementById("guardianLinkForm");

        if (form) form.addEventListener("submit", async e => {
          e.preventDefault();

          const fd = new FormData(form);
          const guardian_id = fd.get("guardian_id");
          const member_id = fd.get("member_id");

          const { data: existing, error: checkError } =
            await supabaseClient.from("guardian_members")
              .select("guardian_id")
              .eq("guardian_id", guardian_id)
              .eq("member_id", member_id)
              .maybeSingle();

          if (checkError) {
            return toast("Nie udało się sprawdzić przypisania.");
          }

          if (existing) {
            return toast("Ten rodzic jest już przypisany do tego dziecka.");
          }

          const { error } = await supabaseClient
            .from("guardian_members")
            .insert({ guardian_id, member_id });

          if (error) {
            return toast("Nie udało się przypisać rodzica. Sprawdź uprawnienia.");
          }

          toast("Rodzic został przypisany.");
          renderView();
        });

      

} else if (currentView === "account") {
  shell("Konto", `
    <div class="panel">
      <h2>Dane użytkownika</h2>
      <p><strong>Imię i nazwisko:</strong> ${esc(profile.full_name || "Nie podano")}</p>
      <p><strong>Rola:</strong> ${esc(profile.role || "Nieznana")}</p>
      <button type="button" id="logoutButton">Wyloguj się</button>
    </div>
  `);

  app.querySelector("#logoutButton")?.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      toast("Nie udało się wylogować.");
      return;
    }

    await loadSession();
  });

} else if (currentView === "approval") {

  if (profile.role !== "supervisor") {
    currentView = "home";
    return renderView();
  }

  const { data: pending, error } = await supabaseClient
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("approved", false)
    .order("created_at", { ascending: true });

  if (error) throw error;

  shell("Zatwierdzanie kont", `
    <div class="panel">
      <h2>Konta oczekujące na zatwierdzenie</h2>
      ${
        pending.length
          ? pending.map(p => `
            <article class="list-item">
              <h3>${esc(p.full_name || "Bez imienia i nazwiska")}</h3>
              <p>Typ konta: ${esc(roleName(p.role))}</p>
              <p>Data rejestracji: ${esc(
                new Date(p.created_at).toLocaleDateString("pl-PL")
              )}</p>
              <button
                class="primary"
                type="button"
                data-approve-profile="${esc(p.id)}">
                Zatwierdź konto
              </button>
            </article>
          `).join("")
          : "<p>Brak kont oczekujących na zatwierdzenie.</p>"
      }
    </div>
  `);

  app.querySelectorAll("[data-approve-profile]").forEach(button => {
    button.addEventListener("click", async () => {
      const profileId = button.dataset.approveProfile;

      if (!confirm("Czy na pewno zatwierdzić to konto?")) return;

      button.disabled = true;

      const { error } = await supabaseClient.rpc("approve_profile", {
        target_profile_id: profileId
      });

      if (error) {
        console.error(error);
        button.disabled = false;
        return toast("Nie udało się zatwierdzić konta.");
      }

      toast("Konto zostało zatwierdzone.");
      renderView();
    });
  });

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
