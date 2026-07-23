const STORAGE_KEY = "echo-ai-demo-state-v1";

const defaultState = {
  onboarded: false,
  userName: "Du",
  dna: null, // { genreWeights, energy, discovery, decades: [], contexts: [] }
  liked: [],
  playHistory: [], // { trackId, ts }
  isPremium: false,
  isCreator: false,
  currentMood: null,
  currentContext: null,
  nowPlaying: null, // { trackId, playlist: [ids], index, isPlaying, elapsed, startedAtMs }
  challengeProgress: 0,
  releaseRSVP: false,
  chatHistory: [],
  djActive: null, // { vibeId, personaId }
  bioConnected: false,
  bioActivity: "rest",
  partyRole: null, // null | "host" | "guest"
  partyCode: null,
  connectedServices: {}, // { spotify: true, ... } — simulated streaming connections
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (e) {
    return { ...defaultState };
  }
}

class Store {
  constructor() {
    this.state = load();
    this.listeners = new Set();
  }
  get() { return this.state; }
  set(patch) {
    this.state = { ...this.state, ...patch };
    this._persist();
    this.listeners.forEach((fn) => fn(this.state));
  }
  update(fn) {
    this.set(fn(this.state) || {});
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  _persist() {
    try {
      const { nowPlaying, ...rest } = this.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, nowPlaying: nowPlaying ? { ...nowPlaying, isPlaying: false } : null }));
    } catch (e) { /* ignore quota errors in demo */ }
  }
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = { ...defaultState };
    this.listeners.forEach((fn) => fn(this.state));
  }
}

const store = new Store();
