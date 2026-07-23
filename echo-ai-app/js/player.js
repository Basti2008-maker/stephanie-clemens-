let progressTimer = null;

function restartProgressTimer() {
  if (progressTimer) clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    const np = store.get().nowPlaying;
    if (!np || !np.isPlaying) return;
    const track = getTrack(np.trackId);
    if (!track) return;
    const duration = np.virtualDuration || track.durationSec;
    const elapsed = np.elapsed + 1;
    if (elapsed >= duration && !store.get().djActive) {
      goNext();
    } else {
      store.set({ nowPlaying: { ...store.get().nowPlaying, elapsed: Math.min(elapsed, duration) } });
    }
  }, 1000);
}

function recordHistory(trackId) {
  const { playHistory } = store.get();
  store.set({ playHistory: [...playHistory, { trackId, ts: Date.now() }].slice(-300) });
}

function playPlaylist(tracks, startIndex = 0, opts = {}) {
  if (!tracks || !tracks.length) return;
  const playlist = tracks.map((t) => t.id);
  startTrackAtIndex(playlist, startIndex, opts);
}

function startTrackAtIndex(playlist, index, opts = {}) {
  const trackId = playlist[index];
  const track = getTrack(trackId);
  if (!track) return;
  audioEngine.playTrack(track, { crossfadeSec: opts.crossfadeSec ?? 1.1 });
  store.set({
    nowPlaying: {
      trackId, playlist, index, isPlaying: true, elapsed: 0,
      playlistTitle: opts.title || null, virtualDuration: opts.virtualDuration || null,
    },
  });
  recordHistory(trackId);
  restartProgressTimer();
}

function togglePlay() {
  const np = store.get().nowPlaying;
  if (!np) return;
  if (np.isPlaying) {
    audioEngine.pauseAll();
    store.set({ nowPlaying: { ...np, isPlaying: false } });
  } else {
    audioEngine.resumeAll();
    store.set({ nowPlaying: { ...np, isPlaying: true } });
  }
}

function goNext() {
  const np = store.get().nowPlaying;
  if (!np) return;
  const nextIndex = (np.index + 1) % np.playlist.length;
  startTrackAtIndex(np.playlist, nextIndex, { crossfadeSec: 1.1, title: np.playlistTitle });
}

function goPrev() {
  const np = store.get().nowPlaying;
  if (!np) return;
  const prevIndex = (np.index - 1 + np.playlist.length) % np.playlist.length;
  startTrackAtIndex(np.playlist, prevIndex, { crossfadeSec: 1.1, title: np.playlistTitle });
}

function toggleLike(trackId) {
  const { liked } = store.get();
  const has = liked.includes(trackId);
  const next = has ? liked.filter((id) => id !== trackId) : [...liked, trackId];
  store.set({ liked: next });
  return !has;
}

function stopPlayback() {
  audioEngine.stopAll();
  if (progressTimer) clearInterval(progressTimer);
  store.set({ nowPlaying: null });
}
