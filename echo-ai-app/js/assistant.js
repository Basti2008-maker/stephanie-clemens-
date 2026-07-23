function initialSuggestions() {
  return [
    "Mach mir etwas Energiegeladenes",
    "Ich will entspannen",
    "Playlist aus den 2000ern",
    "Empfiehl mir etwas Neues",
    "Wie ist meine Musik-DNA?",
    "Starte den AI DJ",
  ];
}

function decadeFromText(text) {
  const m = text.match(/(19|20)(\d0)s?er?/i);
  if (!m) return null;
  const d = `${m[1]}${m[2]}s`;
  return DECADES.includes(d) ? d : null;
}

/**
 * Very small rule-based intent engine standing in for a real conversational
 * model — good enough to demo "AI music assistant" behaviour end-to-end.
 */
function respond(text, { dna, likedIds }) {
  const t = text.toLowerCase();

  const decade = decadeFromText(t);
  if (decade) {
    const tracks = getDecadePlaylist(dna, decade, likedIds, 8);
    return {
      text: `Alles klar — hier ist ein Mix aus deinen liebsten ${decade}-Vibes, zusammengestellt aus dem, was du am meisten hörst und magst. 🎶`,
      action: { type: "playlist", tracks, title: `Deine ${decade}` },
    };
  }

  if (/energ|hype|workout|sport|pump|motivat|antrieb/.test(t)) {
    const tracks = getRecommendations(dna, { mood: "energetic", context: "workout", limit: 8, likedIds });
    return {
      text: "Hier kommt ein High-Energy-Mix, perfekt zum Pushen. Sag Bescheid, wenn ich noch eine Schippe drauflegen soll. ⚡",
      action: { type: "playlist", tracks, title: "Energy Boost" },
    };
  }

  if (/chill|entspann|ruhe|relax|schlaf|müde|stress/.test(t)) {
    const mood = /schlaf|müde/.test(t) ? "sleep" : "chill";
    const tracks = getRecommendations(dna, { mood, context: mood === "sleep" ? "sleep" : "home", limit: 8, likedIds });
    return {
      text: mood === "sleep"
        ? "Ich habe einen ruhigen Wind-down-Mix für dich zusammengestellt — gute Nacht. 🌙"
        : "Hier ist etwas Ruhigeres, um runterzukommen. 🌊",
      action: { type: "playlist", tracks, title: mood === "sleep" ? "Wind-down" : "Chill Mode" },
    };
  }

  if (/dj|mix(en)?|party|feiern/.test(t)) {
    return {
      text: "Für nahtlose KI-Mixe schau in den AI-DJ-Tab — dort kannst du einen Vibe und einen DJ-Stil wählen, und ich mixe live weiter. 🎛️",
      action: { type: "open-dj" },
    };
  }

  if (/entdeck|neu(e|es)?\b|empfehl|artist|recommend|discover/.test(t)) {
    const top = topGenres(dna, 2);
    const tracks = getRecommendations(dna, { limit: 8, likedIds }).filter((tr) => !top.includes(tr.genre)).slice(0, 6);
    const fallback = tracks.length ? tracks : getRecommendations(dna, { limit: 6, likedIds });
    return {
      text: `Basierend auf deiner Discovery-Einstellung dachte ich, du probierst mal etwas außerhalb von ${genreLabel(top[0])}. Hier sind ein paar neue Acts für dich. 🧭`,
      action: { type: "playlist", tracks: fallback, title: "Neu für dich" },
    };
  }

  if (/dna|geschmack|stimmung|fühl|profil/.test(t)) {
    const top = topGenres(dna, 3).map(genreLabel).join(", ");
    return {
      text: `Deine Musik-DNA zeigt aktuell eine starke Neigung zu ${top}, mit einem Energie-Level von ${Math.round(dna.energy * 100)}% und einer Discovery-Offenheit von ${Math.round(dna.discovery * 100)}%. Schau dir das Radar-Diagramm in deinem Profil an!`,
    };
  }

  if (/^(hi|hey|hallo|servus|moin)\b/.test(t)) {
    return { text: "Hey! Womit kann ich dir gerade helfen — Stimmung treffen, eine Ära-Playlist bauen oder etwas Neues entdecken?" };
  }

  if (/danke/.test(t)) {
    return { text: "Gerne! Ich lerne bei jedem Feedback dazu. 🎧" };
  }

  const top = topGenres(dna, 1)[0];
  const tracks = getRecommendations(dna, { limit: 6, likedIds });
  return {
    text: `Ich bin noch eine einfache Demo-KI, aber probier's mit „spiel etwas Energiegeladenes“, „mach mir eine 2000er-Playlist“ oder „empfiehl mir etwas Neues“. Hier ist erstmal ein Mix aus deinem Lieblingsgenre ${genreLabel(top)}.`,
    action: { type: "playlist", tracks, title: "Für dich" },
  };
}
