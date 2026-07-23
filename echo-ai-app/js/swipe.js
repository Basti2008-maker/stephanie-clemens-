// Tinder-style swipe discovery: swipe right = like (nudges Music DNA up),
// swipe left = skip (small negative nudge) — a live, visible feedback loop.

let swipeQueue = [];
let swipeSeen = [];
let swipeLikeCount = 0;
let swipeDragState = null;

function swipeGenreNudge(genreId, delta) {
  const { dna } = store.get();
  const current = dna.genreWeights[genreId] ?? 0.15;
  const next = Math.max(0.05, Math.min(1, current + delta));
  const genreWeights = { ...dna.genreWeights, [genreId]: next };
  store.set({ dna: { ...dna, genreWeights } });
}

function refillSwipeQueue() {
  const { dna, liked } = store.get();
  const boosted = { ...dna, discovery: Math.min(1, dna.discovery + 0.25) };
  const fresh = getRecommendations(boosted, { limit: 30, likedIds: liked, excludeIds: swipeSeen });
  swipeQueue.push(...fresh);
  if (!fresh.length) {
    // Everything has been seen this session — allow revisits.
    swipeSeen = [];
    swipeQueue.push(...getRecommendations(boosted, { limit: 15, likedIds: liked }));
  }
}

function currentSwipeCard() {
  return document.querySelector(".swipe-card-el[data-top='true']");
}

function renderSwipeStack() {
  const stack = document.getElementById("swipe-stack");
  stack.innerHTML = "";
  if (swipeQueue.length < 3) refillSwipeQueue();

  const visible = swipeQueue.slice(0, 3);
  visible.forEach((track, i) => {
    const el = document.createElement("div");
    el.className = "swipe-card-el";
    el.dataset.trackId = track.id;
    const depth = visible.length - 1 - i;
    el.style.zIndex = String(10 - i);
    el.style.transform = `translateY(${i * 10}px) scale(${1 - i * 0.04})`;
    el.style.opacity = i === 2 ? "0.6" : "1";
    if (i === 0) el.dataset.top = "true";
    el.innerHTML = `
      <div class="swipe-stamp like">LIKE</div>
      <div class="swipe-stamp nope">NOPE</div>
      <span class="swipe-tag">${genreLabel(track.genre)} · ${track.tempoBpm} BPM</span>
      <h3>${track.title}</h3>
      <p>${track.artist} · ${Math.round(track.energy * 100)}% Energie</p>
    `;
    if (i === 0) wireSwipeDrag(el, track);
    stack.appendChild(el);
  });

  document.getElementById("swipe-stats").textContent = `${swipeLikeCount} geliked`;
}

function commitSwipe(direction, animate = true) {
  const el = currentSwipeCard();
  if (!el) return;
  const trackId = el.dataset.trackId;
  const track = getTrack(trackId);
  const idx = swipeQueue.findIndex((t) => t.id === trackId);
  if (idx !== -1) swipeQueue.splice(idx, 1);
  swipeSeen.push(trackId);

  if (direction === "like") {
    const { liked } = store.get();
    if (!liked.includes(trackId)) store.set({ liked: [...liked, trackId] });
    swipeGenreNudge(track.genre, 0.05);
    swipeLikeCount++;
  } else {
    swipeGenreNudge(track.genre, -0.02);
  }

  if (animate) {
    const flyX = direction === "like" ? 600 : -600;
    el.style.transition = "transform .35s ease, opacity .35s ease";
    el.style.transform = `translateX(${flyX}px) rotate(${direction === "like" ? 25 : -25}deg)`;
    el.style.opacity = "0";
    setTimeout(renderSwipeStack, 220);
  } else {
    renderSwipeStack();
  }
}

function wireSwipeDrag(el, track) {
  const onDown = (e) => {
    const point = e.touches ? e.touches[0] : e;
    swipeDragState = { startX: point.clientX, startY: point.clientY, dx: 0 };
    el.classList.add("dragging");
  };
  const onMove = (e) => {
    if (!swipeDragState) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - swipeDragState.startX;
    const dy = point.clientY - swipeDragState.startY;
    swipeDragState.dx = dx;
    const rot = dx / 18;
    el.style.transform = `translate(${dx}px, ${dy * 0.4}px) rotate(${rot}deg)`;
    const likeStamp = el.querySelector(".swipe-stamp.like");
    const nopeStamp = el.querySelector(".swipe-stamp.nope");
    likeStamp.style.opacity = String(Math.max(0, Math.min(1, dx / 100)));
    nopeStamp.style.opacity = String(Math.max(0, Math.min(1, -dx / 100)));
  };
  const onUp = () => {
    if (!swipeDragState) return;
    el.classList.remove("dragging");
    const dx = swipeDragState.dx;
    swipeDragState = null;
    if (dx > 90) commitSwipe("like");
    else if (dx < -90) commitSwipe("skip");
    else {
      el.style.transition = "transform .25s ease";
      el.style.transform = "translate(0,0) rotate(0)";
    }
  };

  el.addEventListener("pointerdown", (e) => { el.setPointerCapture(e.pointerId); onDown(e); });
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
}

function initSwipe() {
  document.querySelector('[data-action="open-swipe"]').addEventListener("click", () => {
    openOverlay("screen-swipe");
    renderSwipeStack();
  });
  document.querySelector('[data-action="swipe-like"]').addEventListener("click", () => commitSwipe("like"));
  document.querySelector('[data-action="swipe-skip"]').addEventListener("click", () => commitSwipe("skip"));
  document.querySelector('[data-action="swipe-why"]').addEventListener("click", () => {
    const el = currentSwipeCard();
    if (!el) return;
    const track = getTrack(el.dataset.trackId);
    const { dna } = store.get();
    alert(explainRecommendation(track, dna, store.get().currentMood));
  });
}
