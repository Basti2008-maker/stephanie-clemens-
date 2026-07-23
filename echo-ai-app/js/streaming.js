// Streaming-service "connect" UI. This is a clearly-labeled simulation:
// there is no real OAuth flow here. A genuine Spotify/Apple Music/SoundCloud
// integration needs a registered developer app (client ID/secret) with each
// platform and a backend to handle the token exchange — none of which can be
// set up autonomously since it requires the user's own developer accounts.

const STREAMING_SERVICES = [
  { id: "spotify", name: "Spotify", color: "#1DB954", logo: "♫" },
  { id: "apple", name: "Apple Music", color: "#fa2d48", logo: "♪" },
  { id: "soundcloud", name: "SoundCloud", color: "#ff7700", logo: "☁" },
];

function renderStreamingList() {
  const container = document.getElementById("streaming-connect-list");
  if (!container) return;
  container.innerHTML = "";
  const { connectedServices } = store.get();
  STREAMING_SERVICES.forEach((svc) => {
    const connected = !!connectedServices[svc.id];
    const row = document.createElement("div");
    row.className = "stream-row";
    row.innerHTML = `
      <div class="stream-logo" style="background:${svc.color}">${svc.logo}</div>
      <div class="stream-meta">
        <div class="stream-name">${svc.name}</div>
        <div class="stream-status ${connected ? "connected" : ""}">${connected ? "Verbunden (Demo)" : "Nicht verbunden"}</div>
      </div>
    `;
    const btn = document.createElement("button");
    btn.className = `stream-connect-btn ${connected ? "connected" : ""}`;
    btn.textContent = connected ? "Trennen" : "Verbinden";
    btn.addEventListener("click", () => toggleStreamingService(svc));
    row.appendChild(btn);
    container.appendChild(row);
  });
}

function toggleStreamingService(svc) {
  const { connectedServices } = store.get();
  const isConnected = !!connectedServices[svc.id];

  if (isConnected) {
    store.set({ connectedServices: { ...connectedServices, [svc.id]: false } });
    renderStreamingList();
    return;
  }

  openModal((sheet) => {
    const h2 = document.createElement("h2");
    h2.textContent = `${svc.name} verbinden`;
    const p = document.createElement("p");
    p.textContent = `Demo-Hinweis: Das aktiviert nur lokal einen „verbunden“-Zustand. Eine echte Anbindung an ${svc.name} braucht einen bei ${svc.name} registrierten OAuth-Client (Client-ID/Secret) und einen Backend-Server für den Token-Austausch — das kann ich nicht eigenständig einrichten, weil dafür dein eigener Entwickler-Account bei ${svc.name} nötig ist.`;
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.style.marginTop = "14px";
    btn.textContent = "Demo-Verbindung aktivieren";
    btn.addEventListener("click", () => {
      store.set({ connectedServices: { ...store.get().connectedServices, [svc.id]: true } });
      closeModal();
      renderStreamingList();
    });
    sheet.appendChild(h2); sheet.appendChild(p); sheet.appendChild(btn);
  });
}

function initStreaming() {
  renderStreamingList();
}
