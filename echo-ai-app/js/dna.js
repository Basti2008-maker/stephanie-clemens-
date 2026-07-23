const CONTEXT_PROFILE = {
  commute: { energy: 0.55, moods: ["chill", "energetic"] },
  workout: { energy: 0.9, moods: ["energetic", "party"] },
  work: { energy: 0.3, moods: ["focus"] },
  party: { energy: 0.85, moods: ["party", "happy"] },
  sleep: { energy: 0.08, moods: ["sleep"] },
  home: { energy: 0.35, moods: ["chill", "happy"] },
};

function buildDnaFromQuiz({ genreIds, energy, discovery, decades, contexts }) {
  const genreWeights = {};
  GENRES.forEach((g) => { genreWeights[g.id] = genreIds.includes(g.id) ? 1 : 0.15; });
  // Give a little extra variety among the chosen genres so the radar chart isn't flat.
  genreIds.forEach((id, i) => { genreWeights[id] = 1 - i * 0.05; });
  return {
    genreWeights,
    energy: energy / 100,
    discovery: discovery / 100,
    decades: decades.length ? decades : ["2020s"],
    contexts,
    createdAt: Date.now(),
  };
}

function topGenres(dna, n = 3) {
  return Object.entries(dna.genreWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id);
}

function genreLabel(id) {
  return GENRES.find((g) => g.id === id)?.label || id;
}

function seededNoise(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 1000;
}

function scoreTrack(track, dna, { mood, context, likedIds = [] } = {}) {
  const genreW = dna.genreWeights[track.genre] ?? 0.15;
  const energyMatch = 1 - Math.abs(track.energy - dna.energy);
  const decadeMatch = dna.decades.includes(track.decade) ? 1 : 0.4;
  const moodMatch = mood ? (track.moods.includes(mood) ? 1 : 0.15) : 0.6;
  let contextMatch = 0.6;
  if (context && CONTEXT_PROFILE[context]) {
    const cp = CONTEXT_PROFILE[context];
    const ctxEnergy = 1 - Math.abs(track.energy - cp.energy);
    const ctxMood = track.moods.some((m) => cp.moods.includes(m)) ? 1 : 0.3;
    contextMatch = ctxEnergy * 0.5 + ctxMood * 0.5;
  }
  const likedBonus = likedIds.includes(track.id) ? 0.15 : 0;
  const discoveryFactor = dna.discovery ?? 0.4;
  const noise = (seededNoise(track.id) - 0.5) * (0.1 + discoveryFactor * 0.35);

  return genreW * 0.34 + energyMatch * 0.22 + moodMatch * 0.2 + decadeMatch * 0.09 + contextMatch * 0.12 + likedBonus + noise;
}

function getRecommendations(dna, { mood, context, limit = 10, excludeIds = [], tracks = TRACKS, likedIds = [] } = {}) {
  return tracks
    .filter((t) => !excludeIds.includes(t.id))
    .map((t) => ({ track: t, score: scoreTrack(t, dna, { mood, context, likedIds }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.track);
}

function getDecadePlaylist(dna, decade, likedIds, limit = 10) {
  const pool = TRACKS.filter((t) => t.decade === decade);
  return pool
    .map((t) => ({ track: t, score: scoreTrack(t, dna, { likedIds }) + (likedIds.includes(t.id) ? 0.3 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.track);
}

function explainRecommendation(track, dna, mood) {
  const top = topGenres(dna, 1)[0];
  const bits = [];
  if (track.genre === top) {
    bits.push(`passt zu deiner Vorliebe für ${genreLabel(track.genre)} (Top-Genre deiner Musik-DNA)`);
  } else {
    bits.push(`bringt dir etwas ${genreLabel(track.genre)} als Entdeckung, basierend auf deiner Discovery-Einstellung`);
  }
  if (mood) {
    const moodLabel = MOODS.find((m) => m.id === mood)?.label;
    if (track.moods.includes(mood)) bits.push(`trifft deine aktuelle Stimmung „${moodLabel}“`);
  }
  bits.push(`Energie-Level ${Math.round(track.energy * 100)}% bei ${track.tempoBpm} BPM`);
  if (dna.decades.includes(track.decade)) bits.push(`aus deiner bevorzugten Ära (${track.decade})`);
  return `Echo hat „${track.title}“ ausgewählt: ${bits.join(", ")}.`;
}

function friendSimilarity(dna, friend) {
  const ids = new Set([...Object.keys(dna.genreWeights), ...Object.keys(friend.genreWeights)]);
  let dot = 0, magA = 0, magB = 0;
  ids.forEach((id) => {
    const a = dna.genreWeights[id] ?? 0.1;
    const b = friend.genreWeights[id] ?? 0.1;
    dot += a * b; magA += a * a; magB += b * b;
  });
  const cos = dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
  return Math.round(cos * 100);
}

function friendTopGenre(friend) {
  return Object.entries(friend.genreWeights).sort((a, b) => b[1] - a[1])[0]?.[0];
}
