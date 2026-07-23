function backdropClick(e) {
  if (e.target.id === "modal-root") closeModal();
}

function openModal(renderFn) {
  const root = document.getElementById("modal-root");
  root.innerHTML = "";
  root.hidden = false;
  const sheet = document.createElement("div");
  sheet.className = "modal-sheet";
  const closeRow = document.createElement("div");
  closeRow.className = "modal-close-row";
  const closeBtn = document.createElement("button");
  closeBtn.className = "icon-btn";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", closeModal);
  closeRow.appendChild(closeBtn);
  sheet.appendChild(closeRow);
  renderFn(sheet);
  root.appendChild(sheet);
  root.addEventListener("click", backdropClick);
}

function closeModal() {
  const root = document.getElementById("modal-root");
  root.hidden = true;
  root.innerHTML = "";
  root.removeEventListener("click", backdropClick);
}

function openDecadeModal({ dna, likedIds, onPlay }) {
  openModal((sheet) => {
    const h2 = document.createElement("h2");
    h2.textContent = "🕰️ Zeitreise-Playlist";
    const p = document.createElement("p");
    p.textContent = "Wähle eine Ära — Echo baut dir eine Playlist aus dem, was du dort am meisten hörst und magst.";
    sheet.appendChild(h2); sheet.appendChild(p);

    const grid = document.createElement("div");
    grid.className = "chip-grid";
    grid.style.margin = "14px 0";
    DECADES.forEach((d) => {
      const chip = document.createElement("button");
      chip.className = "chip"; chip.type = "button"; chip.textContent = d;
      chip.addEventListener("click", () => {
        const tracks = getDecadePlaylist(dna, d, likedIds, 10);
        onPlay(tracks, d);
        closeModal();
      });
      grid.appendChild(chip);
    });
    sheet.appendChild(grid);
  });
}

function openPaywallModal() {
  openModal((sheet) => {
    const h2 = document.createElement("h2");
    h2.textContent = "✨ Echo Premium";
    const p = document.createElement("p");
    p.textContent = "Freemium mit Werbung oder werbefrei mit exklusiven KI-Funktionen — dein Business-Modell in Aktion.";
    sheet.appendChild(h2); sheet.appendChild(p);

    const table = document.createElement("table");
    table.className = "paywall-table";
    table.innerHTML = `
      <tr><td>Werbefrei</td><td>—</td><td>✓</td></tr>
      <tr><td>Echtzeit-Stimmungserkennung</td><td>—</td><td>✓</td></tr>
      <tr><td>Unbegrenzter AI DJ</td><td>3 Sets/Tag</td><td>✓</td></tr>
      <tr><td>Musik-Biofeedback</td><td>—</td><td>✓</td></tr>
      <tr><td>Exklusive Release-Events</td><td>—</td><td>✓</td></tr>
    `;
    const headRow = document.createElement("div");
    headRow.style.cssText = "display:flex;justify-content:flex-end;gap:32px;font-size:11px;color:var(--text-dim);margin-top:14px";
    headRow.innerHTML = `<span style="margin-right:52px">Free</span><span>Premium</span>`;
    sheet.appendChild(headRow);
    sheet.appendChild(table);

    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.style.marginTop = "14px";
    btn.textContent = "Premium aktivieren (Demo)";
    btn.addEventListener("click", () => {
      store.set({ isPremium: true });
      closeModal();
      openModal((s2) => {
        const h = document.createElement("h2"); h.textContent = "Willkommen bei Premium 🎉";
        const pp = document.createElement("p");
        pp.textContent = "Dies ist eine Prototyp-Demo: Es wurde keine echte Zahlung verarbeitet, dein lokaler Demo-Account wurde nur auf „Premium“ gesetzt.";
        s2.appendChild(h); s2.appendChild(pp);
      });
    });
    sheet.appendChild(btn);

    const note = document.createElement("p");
    note.style.cssText = "font-size:11px;margin-top:10px;opacity:.7";
    note.textContent = "Demo-Hinweis: Es findet keine echte Zahlungsabwicklung statt.";
    sheet.appendChild(note);
  });
}

const NUDGES = [
  { title: "🎛️ Probier den AI DJ", text: "Lass die KI nahtlose Übergänge für dich mixen — perfekt für die nächste Party oder dein Workout.", cta: "AI DJ öffnen", nav: "dj" },
  { title: "💓 Musik-Biofeedback", text: "Verbinde ein Wearable und lass deine Musik in Echtzeit mit deinem Puls mitgehen.", cta: "Jetzt ausprobieren", action: "open-biofeedback" },
  { title: "🕰️ Zeitreise-Playlist", text: "Lass dir eine Playlist aus deinen liebsten Jahrzehnten zusammenstellen.", cta: "Ausprobieren", action: "open-decade-modal" },
  { title: "🧬 Vergleiche deine Musik-DNA", text: "Sieh, wie ähnlich dein Musikgeschmack dem deiner Freunde ist — und entdecke Neues über sie.", cta: "Freunde ansehen", nav: "discover" },
  { title: "💬 Frag deinen Musik-Assistenten", text: "„Mach mir eine Playlist für einen stressigen Tag“ — probier's einfach aus.", cta: "Assistent öffnen", nav: "assistant" },
];

function maybeShowNudge(dispatch) {
  const shown = Number(sessionStorage.getItem("echo-nudge-count") || "0");
  if (shown >= NUDGES.length) return;
  const nudge = NUDGES[shown];
  sessionStorage.setItem("echo-nudge-count", String(shown + 1));
  openModal((sheet) => {
    const h2 = document.createElement("h2"); h2.textContent = nudge.title;
    const p = document.createElement("p"); p.textContent = nudge.text;
    const btn = document.createElement("button");
    btn.className = "btn btn-primary"; btn.style.marginTop = "16px"; btn.textContent = nudge.cta;
    btn.addEventListener("click", () => { closeModal(); dispatch(nudge); });
    sheet.appendChild(h2); sheet.appendChild(p); sheet.appendChild(btn);
  });
}
