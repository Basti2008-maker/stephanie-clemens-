const TABS = ["home", "discover", "dj", "assistant", "profile"];
const AD_MESSAGES = [
  "Neue Kopfhörer von SonicWave — jetzt entdecken",
  "Konzert-Tickets für deine Top-Artists verfügbar",
  "Flexify Fitness-Tracker — synchronisiere deinen Puls mit Echo",
];
const RELEASE_TARGET = Date.now() + 1000 * 60 * 60 * 51 + 1000 * 60 * 23;

function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60), r = sec % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function trackCard(track, onPlay) {
  const tpl = document.getElementById("tpl-track-card");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector(".track-card-title").textContent = track.title;
  node.querySelector(".track-card-artist").textContent = track.artist;
  node.addEventListener("click", () => onPlay());
  return node;
}

function trackRow(track, extraText, onPlay) {
  const tpl = document.getElementById("tpl-track-row");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector(".track-row-title").textContent = track.title;
  node.querySelector(".track-row-artist").textContent = track.artist;
  node.querySelector(".track-row-extra").textContent = extraText || "";
  node.addEventListener("click", () => onPlay());
  return node;
}

function fillHscroll(containerId, tracks) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  tracks.forEach((t, i) => {
    el.appendChild(trackCard(t, () => {
      playPlaylist(tracks, i, {});
      openOverlay("screen-nowplaying");
    }));
  });
}

/* ============================= ROUTER ============================= */

function showTab(name) {
  TABS.forEach((n) => { document.getElementById("screen-" + n).hidden = n !== name; });
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.nav === name));
  if (name === "home") renderHome();
  else if (name === "discover") renderDiscover();
  else if (name === "dj") renderDj();
  else if (name === "profile") renderProfile();
}

function openOverlay(id) {
  document.getElementById(id).hidden = false;
  if (id === "screen-biofeedback") renderBiofeedbackScreen();
  if (id === "screen-creator") renderCreator();
}

function closeAnyOverlay() {
  document.querySelectorAll(".screen-overlay").forEach((el) => { if (!el.hidden) el.hidden = true; });
}

/* ============================= HOME ============================= */

function renderAdBanner(isPremium) {
  const slot = document.getElementById("ad-banner-slot");
  slot.innerHTML = "";
  if (isPremium) return;
  const idx = Math.floor(Date.now() / 60000) % AD_MESSAGES.length;
  const div = document.createElement("div");
  div.className = "ad-banner";
  div.innerHTML = `<div><div class="ad-label">Anzeige</div><p>${AD_MESSAGES[idx]}</p></div>`;
  slot.appendChild(div);
}

function renderMoodContextPickers() {
  const { currentMood, currentContext } = store.get();
  const moodEl = document.getElementById("mood-picker");
  moodEl.innerHTML = "";
  MOODS.forEach((m) => {
    const chip = document.createElement("button");
    chip.className = "chip"; chip.type = "button";
    chip.textContent = `${m.emoji} ${m.label}`;
    if (currentMood === m.id) chip.classList.add("selected");
    chip.addEventListener("click", () => {
      store.set({ currentMood: currentMood === m.id ? null : m.id });
      renderHome();
    });
    moodEl.appendChild(chip);
  });

  const ctxEl = document.getElementById("context-picker");
  ctxEl.innerHTML = "";
  CONTEXTS.forEach((c) => {
    const chip = document.createElement("button");
    chip.className = "chip"; chip.type = "button";
    chip.textContent = `${c.emoji} ${c.label}`;
    if (currentContext === c.id) chip.classList.add("selected");
    chip.addEventListener("click", () => {
      store.set({ currentContext: currentContext === c.id ? null : c.id });
      renderHome();
    });
    ctxEl.appendChild(chip);
  });
}

function renderHome() {
  const { dna, liked, currentMood, currentContext, isPremium, userName } = store.get();
  const hour = new Date().getHours();
  const timeLabel = hour < 5 ? "Gute Nacht" : hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
  document.getElementById("home-greeting-time").textContent = timeLabel;
  document.getElementById("home-greeting-name").textContent = `Hey, ${userName}`;

  renderAdBanner(isPremium);
  renderMoodContextPickers();

  const madeForYou = getRecommendations(dna, { mood: currentMood, context: currentContext, limit: 10, likedIds: liked });
  fillHscroll("made-for-you", madeForYou);

  const top = topGenres(dna, 1)[0];
  document.getElementById("top-genre-label").textContent = genreLabel(top);
  const genreRow = TRACKS.filter((t) => t.genre === top && !madeForYou.some((m) => m.id === t.id)).slice(0, 10);
  fillHscroll("genre-row", genreRow);

  const friendsSorted = FRIENDS.map((f) => ({ ...f, sim: friendSimilarity(dna, f) })).sort((a, b) => b.sim - a.sim);
  const topFriendGenre = friendsSorted.length ? friendTopGenre(friendsSorted[0]) : null;
  const communityRow = topFriendGenre ? TRACKS.filter((t) => t.genre === topFriendGenre).slice(0, 10) : [];
  fillHscroll("community-row", communityRow);
}

/* ============================= DISCOVER ============================= */

function renderDiscover() {
  const { dna, liked } = store.get();
  const friendsSorted = FRIENDS.map((f) => ({ ...f, sim: friendSimilarity(dna, f) })).sort((a, b) => b.sim - a.sim);

  const labels = GENRES.map((g) => g.label);
  const datasets = [{ values: GENRES.map((g) => dna.genreWeights[g.id]), color: "rgba(180,107,255,1)" }];
  if (friendsSorted[0]) {
    datasets.push({ values: GENRES.map((g) => friendsSorted[0].genreWeights[g.id] ?? 0.1), color: "rgba(79,216,232,1)", fill: "rgba(79,216,232,.14)" });
  }
  drawRadar(document.getElementById("dna-radar-social"), labels, datasets);

  const listEl = document.getElementById("friend-list");
  listEl.innerHTML = "";
  friendsSorted.forEach((f) => {
    const div = document.createElement("div");
    div.className = "friend-item";
    div.innerHTML = `<div class="friend-avatar">${f.avatar}</div><div class="friend-meta"><div class="friend-name">${f.name}</div><div class="friend-match">${f.sim}% DNA-Match</div></div>`;
    listEl.appendChild(div);
  });

  const activityEl = document.getElementById("friend-activity");
  activityEl.innerHTML = "";
  friendsSorted.forEach((f, i) => {
    const genre = friendTopGenre(f);
    const pool = TRACKS.filter((t) => t.genre === genre);
    const track = pool[i % Math.max(pool.length, 1)];
    if (!track) return;
    const div = document.createElement("div");
    div.className = "friend-activity-item";
    div.style.cursor = "pointer";
    div.innerHTML = `<div class="cover-art small"></div><div class="friend-activity-text"><b>${f.name}</b> hört gerade<span>${track.title} — ${track.artist}</span></div>`;
    div.addEventListener("click", () => {
      playPlaylist([track], 0, { title: `${f.name}s Pick` });
      openOverlay("screen-nowplaying");
    });
    activityEl.appendChild(div);
  });

  const top = new Set(topGenres(dna, 1));
  const count = liked.map((id) => getTrack(id)).filter(Boolean).filter((t) => !top.has(t.genre)).length;
  const progressCount = Math.min(count, 3);
  document.getElementById("challenge-progress").style.width = `${(progressCount / 3) * 100}%`;
  document.getElementById("challenge-status").textContent = `${progressCount} / 3`;
}

/* ============================= AI DJ ============================= */

let selectedVibe = null, selectedPersona = null;

function renderDjChips() {
  const vibesEl = document.getElementById("dj-vibes");
  vibesEl.innerHTML = "";
  VIBES.forEach((v) => {
    const chip = document.createElement("button");
    chip.className = "chip"; chip.type = "button";
    chip.textContent = `${v.emoji} ${v.label}`;
    if (selectedVibe === v.id) chip.classList.add("selected");
    chip.addEventListener("click", () => { selectedVibe = v.id; renderDjChips(); });
    vibesEl.appendChild(chip);
  });

  const personasEl = document.getElementById("dj-personas");
  personasEl.innerHTML = "";
  DJ_PERSONAS.forEach((p) => {
    const chip = document.createElement("button");
    chip.className = "chip"; chip.type = "button";
    chip.textContent = p.name;
    chip.title = p.style;
    if (selectedPersona === p.id) chip.classList.add("selected");
    chip.addEventListener("click", () => { selectedPersona = p.id; renderDjChips(); });
    personasEl.appendChild(chip);
  });
}

function updateDjNowNext() {
  const { djNow, djNext } = store.get();
  document.getElementById("dj-current-track").textContent = djNow ? `${djNow.title} — ${djNow.artist}` : "–";
  document.getElementById("dj-next-track").textContent = djNext ? `${djNext.title} — ${djNext.artist}` : "wird berechnet…";
}

function renderDj() {
  const active = store.get().djActive;
  if (active) { selectedVibe = active.vibeId; selectedPersona = active.personaId; }
  renderDjChips();
  document.getElementById("dj-stage").hidden = !active;
  document.getElementById("dj-start-btn").hidden = !!active;
  updateDjNowNext();
}

/* ============================= ASSISTANT ============================= */

function appendChatBubble(role, text) {
  const area = document.getElementById("chat-area");
  const tpl = document.getElementById("tpl-chat-bubble");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  node.textContent = text;
  area.appendChild(node);
  area.scrollTop = area.scrollHeight;
}

function appendPlaylistPreview(tracks, title) {
  const area = document.getElementById("chat-area");
  const wrap = document.createElement("div");
  wrap.className = "chat-bubble ai";
  wrap.style.maxWidth = "90%";
  const strong = document.createElement("div");
  strong.style.cssText = "font-weight:700;margin-bottom:6px";
  strong.textContent = `▶ ${title || "Playlist"} gestartet`;
  wrap.appendChild(strong);
  tracks.slice(0, 5).forEach((t, i) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;justify-content:space-between;font-size:12px;padding:3px 0;cursor:pointer;opacity:.9";
    row.textContent = `${t.title} — ${t.artist}`;
    row.addEventListener("click", () => { playPlaylist(tracks, i, { title }); openOverlay("screen-nowplaying"); });
    wrap.appendChild(row);
  });
  area.appendChild(wrap);
  area.scrollTop = area.scrollHeight;
}

function sendMessage(text) {
  if (!text.trim()) return;
  appendChatBubble("user", text);
  store.update((s) => ({ chatHistory: [...s.chatHistory, { role: "user", text }] }));

  const { dna, liked } = store.get();
  const res = respond(text, { dna, likedIds: liked });
  appendChatBubble("ai", res.text);
  store.update((s) => ({ chatHistory: [...s.chatHistory, { role: "ai", text: res.text }] }));

  if (res.action?.type === "playlist") {
    playPlaylist(res.action.tracks, 0, { title: res.action.title });
    appendPlaylistPreview(res.action.tracks, res.action.title);
  } else if (res.action?.type === "open-dj") {
    setTimeout(() => showTab("dj"), 500);
  }
}

function initAssistant() {
  const chips = document.getElementById("chat-suggestions");
  initialSuggestions().forEach((s) => {
    const chip = document.createElement("button");
    chip.className = "chip"; chip.type = "button"; chip.textContent = s;
    chip.addEventListener("click", () => sendMessage(s));
    chips.appendChild(chip);
  });

  const history = store.get().chatHistory;
  if (history.length) {
    history.forEach((m) => appendChatBubble(m.role, m.text));
  } else {
    const greeting = "Hey! Ich bin dein Musik-Assistent. Ich kenne deine Musik-DNA und kann dir Playlists bauen, Stimmungen treffen oder neue Musik vorschlagen.";
    appendChatBubble("ai", greeting);
    store.update((s) => ({ chatHistory: [...s.chatHistory, { role: "ai", text: greeting }] }));
  }

  document.getElementById("chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const text = input.value;
    input.value = "";
    sendMessage(text);
  });
}

/* ============================= PROFILE ============================= */

function renderProfile() {
  const { dna, isPremium, isCreator } = store.get();
  const planEl = document.getElementById("profile-plan");
  planEl.textContent = isPremium ? "Premium" : "Free";
  planEl.classList.toggle("premium", isPremium);
  document.getElementById("premium-upsell").hidden = isPremium;
  document.getElementById("creator-toggle").checked = isCreator;
  document.getElementById("creator-nav-card").hidden = !isCreator;

  const labels = GENRES.map((g) => g.label);
  const values = GENRES.map((g) => dna.genreWeights[g.id]);
  drawRadar(document.getElementById("dna-radar-profile"), labels, [{ values, color: "rgba(180,107,255,1)" }]);
}

/* ============================= BIOFEEDBACK ============================= */

function updateHrDisplay() {
  const connected = store.get().bioConnected;
  document.getElementById("hr-display").innerHTML = connected ? `${getCurrentHr()} <span>BPM</span>` : `– <span>BPM</span>`;
  drawSparkline(document.getElementById("hr-sparkline"), connected ? getHrHistory() : []);
}

function renderBiofeedbackScreen() {
  const current = store.get().bioActivity;
  const el = document.getElementById("bio-activity-picker");
  el.innerHTML = "";
  bioActivities().forEach((a) => {
    const chip = document.createElement("button");
    chip.className = "chip"; chip.type = "button";
    chip.textContent = `${a.emoji} ${a.label}`;
    if (current === a.id) chip.classList.add("selected");
    chip.addEventListener("click", () => {
      setBioActivity(a.id);
      renderBiofeedbackScreen();
    });
    el.appendChild(chip);
  });
  document.getElementById("bio-connect-btn").textContent = store.get().bioConnected ? "Wearable trennen" : "Wearable verbinden";
  updateHrDisplay();
}

/* ============================= CREATOR HUB ============================= */

let countdownTimer = null;

function updateCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  const tick = () => {
    const remain = RELEASE_TARGET - Date.now();
    const el = document.getElementById("release-countdown");
    if (remain <= 0) { el.textContent = "Live jetzt!"; clearInterval(countdownTimer); return; }
    const h = Math.floor(remain / 3.6e6), m = Math.floor((remain % 3.6e6) / 6e4), s = Math.floor((remain % 6e4) / 1000);
    el.textContent = `${h}h ${m}m ${s}s`;
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function generateCoachingTips() {
  const { liked } = store.get();
  const tips = [
    { title: "Energie-Balance", body: "Deine letzten Sets springen oft von ruhigen zu intensiven Tracks. Baue Übergangstracks um 100–110 BPM ein, um die Energie sanfter zu steigern." },
    { title: "Genre-Vielfalt", body: "Dein Publikum reagiert gut, wenn du alle 4–5 Tracks das Genre leicht wechselst — probier mehr Cross-Genre-Blends." },
  ];
  const tracks = liked.map((id) => getTrack(id)).filter(Boolean);
  if (tracks.length >= 2) {
    const avgEnergy = tracks.reduce((a, t) => a + t.energy, 0) / tracks.length;
    tips.push({ title: "Dein Sound", body: `Deine gelikten Tracks liegen im Schnitt bei ${Math.round(avgEnergy * 100)}% Energie — dein Publikum mag ${avgEnergy > 0.6 ? "druckvolle" : "entspannte"} Sets.` });
  }
  return tips;
}

function renderCreator() {
  updateCountdown();
  const wrap = document.getElementById("coaching-insights");
  wrap.innerHTML = "";
  generateCoachingTips().forEach((t) => {
    const div = document.createElement("div");
    div.className = "coach-tip";
    div.innerHTML = `<b>${t.title}</b>${t.body}`;
    wrap.appendChild(div);
  });
  const rsvped = store.get().releaseRSVP;
  const btn = document.querySelector('#screen-creator [data-action="rsvp-release"]');
  btn.textContent = rsvped ? "Zugesagt ✓" : "Zusagen";
  btn.disabled = rsvped;
}

/* ============================= PLAYER (mini + now playing) ============================= */

function renderPlayerBits() {
  const { nowPlaying, djActive, liked } = store.get();
  const miniPlayer = document.getElementById("mini-player");

  if (!nowPlaying) {
    miniPlayer.hidden = true;
  } else {
    const track = getTrack(nowPlaying.trackId);
    if (track) {
      miniPlayer.hidden = false;
      document.getElementById("mini-title").textContent = track.title;
      document.getElementById("mini-artist").textContent = track.artist;
      document.getElementById("mini-play-btn").textContent = nowPlaying.isPlaying ? "⏸" : "▶";

      document.getElementById("np-title").textContent = track.title;
      document.getElementById("np-artist").textContent = track.artist;
      const duration = nowPlaying.virtualDuration || track.durationSec;
      const pct = Math.min(100, (nowPlaying.elapsed / duration) * 100);
      document.getElementById("np-progress-fill").style.width = `${pct}%`;
      document.getElementById("np-time-cur").textContent = formatTime(nowPlaying.elapsed);
      document.getElementById("np-time-total").textContent = formatTime(duration);
      document.getElementById("np-play-btn").textContent = nowPlaying.isPlaying ? "⏸" : "▶";
      document.getElementById("np-genre-tag").textContent = `${genreLabel(track.genre)} · ${track.tempoBpm} BPM · ${Math.round(track.energy * 100)}% Energie`;
      const isLiked = liked.includes(track.id);
      const likeBtn = document.getElementById("np-like-btn");
      likeBtn.textContent = isLiked ? "♥" : "♡";
      likeBtn.classList.toggle("liked", isLiked);
    }
  }

  const djTag = document.getElementById("np-dj-tag");
  djTag.hidden = !djActive;
  document.getElementById("np-controls").hidden = !!djActive;
  document.getElementById("np-dj-stop").hidden = !djActive;
  if (djActive) {
    const persona = DJ_PERSONAS.find((p) => p.id === djActive.personaId);
    djTag.textContent = `🎛️ Live DJ-Mix — ${persona?.name || ""}`;
  }

  if (!document.getElementById("screen-dj").hidden) updateDjNowNext();
  if (!document.getElementById("screen-biofeedback").hidden) updateHrDisplay();
  if (!document.getElementById("screen-profile").hidden) renderProfile();
}

/* ============================= NUDGES ============================= */

function handleNudge(nudge) {
  if (nudge.nav) showTab(nudge.nav);
  else if (nudge.action === "open-biofeedback") openOverlay("screen-biofeedback");
  else if (nudge.action === "open-decade-modal") document.querySelector('[data-action="open-decade-modal"]').click();
}

/* ============================= INIT ============================= */

function initApp() {
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.addEventListener("click", () => showTab(btn.dataset.nav)));

  document.querySelector('[data-action="open-profile"]').addEventListener("click", () => showTab("profile"));
  document.querySelector('[data-action="open-decade-modal"]').addEventListener("click", () => {
    const { dna, liked } = store.get();
    openDecadeModal({
      dna, likedIds: liked,
      onPlay: (tracks, decade) => { playPlaylist(tracks, 0, { title: `Deine ${decade}` }); openOverlay("screen-nowplaying"); },
    });
  });
  document.querySelector('[data-action="open-paywall"]').addEventListener("click", openPaywallModal);
  document.querySelector('[data-action="open-biofeedback"]').addEventListener("click", () => openOverlay("screen-biofeedback"));
  document.querySelector('[data-action="open-creator"]').addEventListener("click", () => openOverlay("screen-creator"));
  document.querySelectorAll('[data-action="close-overlay"]').forEach((btn) => btn.addEventListener("click", closeAnyOverlay));

  document.getElementById("creator-toggle").addEventListener("change", (e) => {
    store.set({ isCreator: e.target.checked });
    renderProfile();
  });

  document.getElementById("dj-start-btn").addEventListener("click", () => {
    if (!selectedVibe || !selectedPersona) { alert("Bitte wähle einen Vibe und einen DJ-Stil."); return; }
    const vibe = VIBES.find((v) => v.id === selectedVibe);
    const persona = DJ_PERSONAS.find((p) => p.id === selectedPersona);
    const { dna, liked } = store.get();
    startDj(vibe, persona, dna, liked);
    renderDj();
  });
  document.querySelector('#dj-stage [data-action="dj-stop"]').addEventListener("click", () => { stopDj(); renderDj(); });

  document.getElementById("bio-connect-btn").addEventListener("click", () => {
    if (store.get().bioConnected) stopBio();
    else startBio(store.get().bioActivity || "rest");
    renderBiofeedbackScreen();
  });

  document.querySelector('#screen-creator [data-action="rsvp-release"]').addEventListener("click", () => {
    store.set({ releaseRSVP: true });
    renderCreator();
  });

  document.querySelector('[data-action="np-toggle"]').addEventListener("click", togglePlay);
  document.querySelector('[data-action="np-next"]').addEventListener("click", goNext);
  document.querySelector('[data-action="np-prev"]').addEventListener("click", goPrev);
  document.querySelector('[data-action="np-like"]').addEventListener("click", () => {
    const { nowPlaying } = store.get();
    if (nowPlaying) toggleLike(nowPlaying.trackId);
  });
  document.querySelector('[data-action="np-dj-stop"]').addEventListener("click", () => {
    stopDj();
    document.getElementById("screen-nowplaying").hidden = true;
  });
  document.querySelector('[data-action="np-why"]').addEventListener("click", () => {
    const { nowPlaying, dna, currentMood } = store.get();
    if (!nowPlaying) return;
    const track = getTrack(nowPlaying.trackId);
    const el = document.getElementById("np-explain");
    el.textContent = explainRecommendation(track, dna, currentMood);
    el.hidden = !el.hidden;
  });

  document.getElementById("mini-play-btn").addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
  document.getElementById("mini-player").addEventListener("click", () => openOverlay("screen-nowplaying"));

  initAssistant();
  initSwipe();
  initParty();
  initStreaming();
  store.subscribe(renderPlayerBits);
  renderPlayerBits();

  document.getElementById("bottom-nav").hidden = false;
  showTab("home");
  checkPartyJoinLink();

  setTimeout(() => maybeShowNudge(handleNudge), 9000);
}
