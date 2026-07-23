// All content below is procedurally generated placeholder data.
// No real songs, artists, or audio recordings are used anywhere in this app.

const GENRES = [
  { id: "pop", label: "Pop", emoji: "✨" },
  { id: "electronic", label: "Electronic", emoji: "🎛️" },
  { id: "hiphop", label: "Hip-Hop", emoji: "🎤" },
  { id: "indie", label: "Indie", emoji: "🌇" },
  { id: "rnb", label: "R&B", emoji: "💜" },
  { id: "rock", label: "Rock", emoji: "🎸" },
  { id: "house", label: "House/Dance", emoji: "🪩" },
  { id: "lofi", label: "Lo-fi/Chill", emoji: "☕" },
  { id: "ambient", label: "Ambient", emoji: "🌌" },
  { id: "latin", label: "Latin", emoji: "🔥" },
];

const MOODS = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "energetic", label: "Energetic", emoji: "⚡" },
  { id: "chill", label: "Chill", emoji: "🌊" },
  { id: "focus", label: "Focus", emoji: "🎯" },
  { id: "melancholy", label: "Melancholy", emoji: "🌧️" },
  { id: "party", label: "Party", emoji: "🎉" },
  { id: "sleep", label: "Wind-down", emoji: "🌙" },
  { id: "stressed", label: "Stressed", emoji: "😮‍💨" },
];

const CONTEXTS = [
  { id: "commute", label: "Pendeln", emoji: "🚆" },
  { id: "workout", label: "Workout", emoji: "🏋️" },
  { id: "work", label: "Fokus-Arbeit", emoji: "💻" },
  { id: "party", label: "Party", emoji: "🎊" },
  { id: "sleep", label: "Schlafen", emoji: "😴" },
  { id: "home", label: "Zuhause", emoji: "🏡" },
];

const DECADES = ["1980s", "1990s", "2000s", "2010s", "2020s"];

const DJ_PERSONAS = [
  { id: "nova", name: "DJ Nova", style: "Fließende, harmonische Übergänge mit langem Blend", transition: 6, taste: "house" },
  { id: "kilo", name: "Kilo Drift", style: "Schnelle Beat-Drops, energiegeladene Cuts", transition: 2.5, taste: "electronic" },
  { id: "wren", name: "Wren Sol", style: "Warme Lo-fi Übergänge, sanftes Ausklingen", transition: 8, taste: "lofi" },
];

const VIBES = [
  { id: "party", label: "Party", emoji: "🎉", moods: ["party", "energetic"] },
  { id: "workout", label: "Workout", emoji: "🏋️", moods: ["energetic"] },
  { id: "focus", label: "Focus", emoji: "🎯", moods: ["focus", "chill"] },
  { id: "chill", label: "Chill Evening", emoji: "🌆", moods: ["chill", "melancholy"] },
];

const FRIENDS = [
  { id: "f1", name: "Mara", avatar: "🌊", genreWeights: { electronic: .9, house: .8, pop: .4, indie: .3 } },
  { id: "f2", name: "Tomás", avatar: "🔥", genreWeights: { latin: .9, hiphop: .7, pop: .5 } },
  { id: "f3", name: "Julia", avatar: "🌙", genreWeights: { lofi: .9, ambient: .7, indie: .5 } },
  { id: "f4", name: "Ben", avatar: "🎸", genreWeights: { rock: .9, indie: .8, electronic: .2 } },
];

// ---- Deterministic seeded RNG so demo data is stable across reloads ----
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(1337);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

const ADJ = ["Neon","Velvet","Midnight","Golden","Electric","Fading","Silent","Crystal","Broken","Wild","Hollow","Amber","Paper","Glass","Static","Violet","Rusty","Lonely","Endless","Solar","Faded","Quiet","Burning","Distant","Painted"];
const NOUN = ["Skyline","Heartbeat","Horizon","Static","Echoes","Tides","Fever","Bloom","Shadows","Circuit","Reverie","Wildfire","Mirage","Aftermath","Parade","Wavelength","Gravity","Afterglow","Daydream","Nightdrive","Halo","Current","Embers","Lowlight","Windows"];
const FIRST = ["Kilo","Nova","Rae","Jax","Vela","Soren","Mira","Dex","Lux","Iris","Kato","Zade","Wren","Onyx","Talia","Rome","Sable","Juno","Cass","Ezra"];
const LAST = ["Drift","Voss","Marlowe","Sol","Reyes","Knox","Vale","Storm","Frey","Bishop","Quinn","Sterling","Cruz","Ashford","Blackwood"];

const GENRE_PROFILE = {
  pop:        { tempo: [98, 128],  energy: [.45, .8],  moods: ["happy", "party"],        pattern: "fourfloor-light", mode: "major" },
  electronic: { tempo: [118, 132], energy: [.65, 1],   moods: ["energetic", "party", "focus"], pattern: "fourfloor",       mode: "minor" },
  hiphop:     { tempo: [78, 100],  energy: [.45, .8],  moods: ["focus", "energetic", "chill"], pattern: "boombap",         mode: "minor" },
  indie:      { tempo: [88, 118],  energy: [.35, .65], moods: ["chill", "melancholy"],   pattern: "rockbeat-soft",   mode: "major" },
  rnb:        { tempo: [68, 94],   energy: [.25, .55], moods: ["chill", "melancholy", "sleep"], pattern: "boombap-soft",    mode: "minor" },
  rock:       { tempo: [108, 150], energy: [.65, 1],   moods: ["energetic", "party"],    pattern: "rockbeat",        mode: "minor" },
  house:      { tempo: [120, 128], energy: [.7, 1],    moods: ["party", "energetic"],    pattern: "fourfloor",       mode: "major" },
  lofi:       { tempo: [60, 85],   energy: [.1, .35],  moods: ["focus", "sleep", "chill"], pattern: "chill-lofi",      mode: "major" },
  ambient:    { tempo: [50, 68],   energy: [.05, .2],  moods: ["sleep", "focus", "melancholy"], pattern: "ambient-none",   mode: "minor" },
  latin:      { tempo: [95, 115],  energy: [.55, .9],  moods: ["party", "happy"],        pattern: "fourfloor-light", mode: "major" },
};

const NOTE_FREQS = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.0, A: 440.0, B: 493.88 };
const NOTES = Object.keys(NOTE_FREQS);

function randRange([lo, hi]) { return lo + rng() * (hi - lo); }

function generateTracks(count) {
  const genreIds = Object.keys(GENRE_PROFILE);
  const tracks = [];
  for (let i = 0; i < count; i++) {
    const genre = genreIds[i % genreIds.length];
    const profile = GENRE_PROFILE[genre];
    const energy = Math.round(randRange(profile.energy) * 100) / 100;
    const tempoBpm = Math.round(randRange(profile.tempo));
    const decade = DECADES[i % DECADES.length];
    const moods = new Set(profile.moods);
    if (energy > 0.82) moods.add("energetic");
    if (energy < 0.18) moods.add("sleep");
    if (energy >= 0.18 && energy < 0.4) moods.add("chill");
    if (rng() > 0.7) moods.add(pick(MOODS.map(m => m.id)));
    const key = pick(NOTES);
    tracks.push({
      id: `t${i + 1}`,
      title: `${pick(ADJ)} ${pick(NOUN)}`,
      artist: `${pick(FIRST)} ${pick(LAST)}`,
      genre,
      moods: Array.from(moods),
      energy,
      tempoBpm,
      decade,
      key,
      mode: profile.mode,
      rootFreq: NOTE_FREQS[key],
      pattern: profile.pattern,
      durationSec: 150 + Math.floor(rng() * 90),
      liked: false,
    });
  }
  return tracks;
}

const TRACKS = generateTracks(70);

function getTrack(id) {
  return TRACKS.find((t) => t.id === id);
}
