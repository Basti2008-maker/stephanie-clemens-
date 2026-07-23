function renderChips(container, items, { multi = true, getLabel, getId } = {}) {
  container.innerHTML = "";
  const selected = new Set();
  items.forEach((item) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = getLabel(item);
    chip.addEventListener("click", () => {
      const id = getId(item);
      if (selected.has(id)) {
        selected.delete(id);
        chip.classList.remove("selected");
      } else {
        selected.add(id);
        chip.classList.add("selected");
      }
    });
    container.appendChild(chip);
  });
  return selected;
}

function initOnboarding(onEnter) {
  const root = document.getElementById("screen-onboarding");
  const steps = Array.from(root.querySelectorAll(".onboarding-step"));
  const goTo = (name) => steps.forEach((s) => { s.hidden = s.dataset.step !== name; });

  const genreSelected = renderChips(document.getElementById("ob-genres"), GENRES, {
    getLabel: (g) => `${g.emoji} ${g.label}`, getId: (g) => g.id,
  });
  const decadeSelected = renderChips(document.getElementById("ob-decades"), DECADES, {
    getLabel: (d) => d, getId: (d) => d,
  });
  const contextSelected = renderChips(document.getElementById("ob-context"), CONTEXTS, {
    getLabel: (c) => `${c.emoji} ${c.label}`, getId: (c) => c.id,
  });

  root.querySelector('[data-action="ob-start"]').addEventListener("click", () => goTo("genres"));

  root.querySelector('[data-action="ob-skip"]').addEventListener("click", () => {
    const dna = buildDnaFromQuiz({
      genreIds: ["electronic", "pop", "indie"],
      energy: 60, discovery: 45,
      decades: ["2020s", "2010s"],
      contexts: ["home", "commute"],
    });
    store.set({ dna, onboarded: true });
    onEnter();
  });

  root.querySelector('[data-action="ob-next-genres"]').addEventListener("click", () => {
    if (genreSelected.size < 3) {
      alert("Bitte wähle mindestens 3 Genres, damit Echo deine Musik-DNA berechnen kann.");
      return;
    }
    goTo("energy");
  });
  root.querySelector('[data-action="ob-next-energy"]').addEventListener("click", () => goTo("discovery"));
  root.querySelector('[data-action="ob-next-discovery"]').addEventListener("click", () => goTo("decades"));
  root.querySelector('[data-action="ob-next-decades"]').addEventListener("click", () => goTo("context"));

  root.querySelector('[data-action="ob-finish"]').addEventListener("click", () => {
    const dna = buildDnaFromQuiz({
      genreIds: Array.from(genreSelected),
      energy: Number(document.getElementById("ob-energy").value),
      discovery: Number(document.getElementById("ob-discovery").value),
      decades: Array.from(decadeSelected),
      contexts: Array.from(contextSelected),
    });
    store.set({ dna, onboarded: true });

    const labels = GENRES.map((g) => g.label);
    const values = GENRES.map((g) => dna.genreWeights[g.id]);
    drawRadar(document.getElementById("dna-radar"), labels, [
      { values, color: "rgba(180,107,255,1)" },
    ]);
    const top = topGenres(dna, 3).map(genreLabel).join(", ");
    document.getElementById("dna-summary").textContent =
      `Deine Top-Genres: ${top}. Energie-Level ${Math.round(dna.energy * 100)}%, Discovery-Offenheit ${Math.round(dna.discovery * 100)}%.`;
    goTo("result");
  });

  root.querySelector('[data-action="ob-enter"]').addEventListener("click", onEnter);
}
