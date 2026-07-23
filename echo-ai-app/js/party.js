// Party host mode: host creates a session (QR + short code), guests join by
// scanning/typing the code, their Music-DNA profiles get blended, and the
// host can start a single playlist tuned for the whole group.
//
// Real-time sync tries the local server's /api/party/* endpoints first (this
// works across multiple browser tabs/windows on this machine right now, and
// across devices too if the host's PC and guests are on the same network and
// can reach the server — see README). If the server is unreachable for any
// reason, it transparently falls back to a localStorage mirror, which still
// lets you demo host+guest across two tabs on this one browser.

let partyPollTimer = null;

function localPartyKey(code) { return `echo-party-${code}`; }
function localPartyRead(code) {
  try { return JSON.parse(localStorage.getItem(localPartyKey(code)) || "null"); } catch (e) { return null; }
}
function localPartyWrite(code, party) {
  try { localStorage.setItem(localPartyKey(code), JSON.stringify(party)); } catch (e) { /* ignore quota errors */ }
}

async function partyApiCall(path, options) {
  const res = await fetch(path, options);
  return res.json();
}

async function partyCreate(hostName, hostDna) {
  try {
    const data = await partyApiCall("/api/party/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostName, hostDna }),
    });
    if (data.ok) {
      localPartyWrite(data.code, { code: data.code, host: { name: hostName, dna: hostDna }, guests: [] });
      return data.code;
    }
  } catch (e) { /* fall through to local-only party */ }
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  localPartyWrite(code, { code, host: { name: hostName, dna: hostDna }, guests: [] });
  return code;
}

async function partyJoin(code, name, dna) {
  code = code.toUpperCase().trim();
  try {
    const data = await partyApiCall("/api/party/join", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, dna }),
    });
    if (data.ok) return { ok: true };
    if (data.error) return { ok: false, error: data.error };
  } catch (e) { /* fall through to local fallback below */ }

  const party = localPartyRead(code);
  if (party) {
    party.guests.push({ name, dna, joinedAt: Date.now() });
    localPartyWrite(code, party);
    return { ok: true };
  }
  return { ok: false, error: "Party-Code nicht gefunden (weder auf dem Server noch lokal)." };
}

async function partyFetchState(code) {
  try {
    const data = await partyApiCall(`/api/party/state?code=${encodeURIComponent(code)}`, {});
    if (data.ok) { localPartyWrite(code, data.party); return data.party; }
  } catch (e) { /* fall through */ }
  return localPartyRead(code);
}

async function partyEndRemote(code) {
  try {
    await partyApiCall("/api/party/end", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch (e) { /* ignore */ }
  localStorage.removeItem(localPartyKey(code));
}

function blendDnaProfiles(dnaList) {
  const genreWeights = {};
  GENRES.forEach((g) => {
    const vals = dnaList.map((d) => d.genreWeights?.[g.id] ?? 0.15);
    genreWeights[g.id] = vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  const energy = dnaList.reduce((a, d) => a + (d.energy ?? 0.5), 0) / dnaList.length;
  const discovery = dnaList.reduce((a, d) => a + (d.discovery ?? 0.4), 0) / dnaList.length;
  const decades = Array.from(new Set(dnaList.flatMap((d) => d.decades || [])));
  return { genreWeights, energy, discovery, decades: decades.length ? decades : ["2020s"] };
}

function renderPartyHostView(party) {
  if (!party) return;
  const guestList = document.getElementById("party-guest-list");
  document.getElementById("party-guest-count").textContent = String(party.guests.length);
  guestList.innerHTML = "";
  if (!party.guests.length) {
    guestList.innerHTML = `<p class="party-empty">Noch niemand beigetreten — zeig den QR-Code deinen Gästen.</p>`;
  } else {
    party.guests.forEach((g) => {
      const div = document.createElement("div");
      div.className = "party-guest-item";
      div.innerHTML = `<div class="friend-avatar">🎧</div><span>${g.name || "Gast"}</span>`;
      guestList.appendChild(div);
    });
  }
  const allDna = [party.host.dna, ...party.guests.map((g) => g.dna)].filter(Boolean);
  const blended = blendDnaProfiles(allDna);
  const labels = GENRES.map((g) => g.label);
  drawRadar(document.getElementById("dna-radar-party"), labels, [
    { values: GENRES.map((g) => blended.genreWeights[g.id]), color: "rgba(79,216,232,1)" },
  ]);
  window.__partyBlendedDna = blended;
}

function startPartyPolling(code) {
  stopPartyPolling();
  partyPollTimer = setInterval(async () => {
    const party = await partyFetchState(code);
    renderPartyHostView(party);
  }, 2500);
}
function stopPartyPolling() {
  if (partyPollTimer) clearInterval(partyPollTimer);
  partyPollTimer = null;
}

function showPartyView(view) {
  document.getElementById("party-intro").hidden = view !== "intro";
  document.getElementById("party-host-view").hidden = view !== "host";
  document.getElementById("party-guest-view").hidden = view !== "guest";
}

function checkPartyJoinLink() {
  const params = new URLSearchParams(location.search);
  const code = params.get("join");
  if (code) {
    openOverlay("screen-party");
    showPartyView("intro");
    const input = document.getElementById("party-join-code-input");
    input.value = code.toUpperCase();
    document.getElementById("party-join-status").textContent = "Code aus Link übernommen — auf „Beitreten“ tippen.";
    document.getElementById("party-join-status").className = "join-status";
  }
}

function initParty() {
  document.querySelector('[data-action="open-party"]').addEventListener("click", () => {
    openOverlay("screen-party");
    const { partyRole } = store.get();
    showPartyView(partyRole === "host" ? "host" : partyRole === "guest" ? "guest" : "intro");
  });

  document.querySelector('[data-action="party-host-start"]').addEventListener("click", async () => {
    const { dna, userName } = store.get();
    const code = await partyCreate(userName, dna);
    store.set({ partyRole: "host", partyCode: code });
    showPartyView("host");
    document.getElementById("party-code-display").textContent = code;
    qrRenderToCanvas(document.getElementById("party-qr-canvas"), code, 8);
    const joinUrl = `${location.origin}${location.pathname}?join=${code}`;
    document.getElementById("party-link-hint").textContent = `Link zum Teilen: ${joinUrl}`;
    renderPartyHostView({ code, host: { name: userName, dna }, guests: [] });
    startPartyPolling(code);
  });

  document.querySelector('[data-action="party-join-submit"]').addEventListener("click", async () => {
    const codeInput = document.getElementById("party-join-code-input");
    const statusEl = document.getElementById("party-join-status");
    const code = codeInput.value.trim();
    if (code.length < 4) {
      statusEl.textContent = "Bitte gültigen Code eingeben.";
      statusEl.className = "join-status error";
      return;
    }
    const { dna, userName } = store.get();
    const result = await partyJoin(code, userName, dna);
    if (result.ok) {
      store.set({ partyRole: "guest", partyCode: code.toUpperCase() });
      statusEl.textContent = "";
      showPartyView("guest");
    } else {
      statusEl.textContent = result.error || "Beitritt fehlgeschlagen.";
      statusEl.className = "join-status error";
    }
  });

  document.querySelector('[data-action="party-play-blended"]').addEventListener("click", async () => {
    const { partyCode, liked } = store.get();
    const party = await partyFetchState(partyCode);
    const allDna = party ? [party.host.dna, ...party.guests.map((g) => g.dna)].filter(Boolean) : [store.get().dna];
    const blended = blendDnaProfiles(allDna);
    const tracks = getRecommendations(blended, { limit: 14, likedIds: liked });
    playPlaylist(tracks, 0, { title: "Party-Mix für alle" });
    openOverlay("screen-nowplaying");
  });

  document.querySelector('[data-action="party-end"]').addEventListener("click", async () => {
    const { partyCode } = store.get();
    stopPartyPolling();
    if (partyCode) await partyEndRemote(partyCode);
    store.set({ partyRole: null, partyCode: null });
    showPartyView("intro");
  });

  document.querySelector('[data-action="party-leave"]').addEventListener("click", () => {
    store.set({ partyRole: null, partyCode: null });
    showPartyView("intro");
  });
}
