const BASELINES = { rest: 68, commute: 82, workout: 138, stress: 112, sleep: 56 };

let bioTimer = null;
let hr = 70;
let history = [];

function bioActivities() {
  return [
    { id: "rest", label: "Ruhe", emoji: "🧘" },
    { id: "commute", label: "Unterwegs", emoji: "🚶" },
    { id: "workout", label: "Workout", emoji: "🏃" },
    { id: "stress", label: "Gestresst", emoji: "😮‍💨" },
    { id: "sleep", label: "Einschlafen", emoji: "🌙" },
  ];
}

function getHrHistory() { return history; }
function getCurrentHr() { return Math.round(hr); }

function startBio(activityId) {
  stopBio();
  const baseline = BASELINES[activityId] ?? 70;
  hr = baseline;
  history = [hr];
  store.set({ bioConnected: true, bioActivity: activityId });

  bioTimer = setInterval(() => {
    const drift = (Math.random() - 0.5) * 8;
    const pull = (baseline - hr) * 0.35;
    hr = Math.max(45, Math.min(180, hr + pull + drift));
    history.push(hr);
    if (history.length > 40) history.shift();

    const energyMod = Math.max(0, Math.min(1, (hr - 50) / 110));
    const tempoScale = Math.max(0.85, Math.min(1.18, 1 + (hr - 95) / 420));
    audioEngine.setEnergyMod(energyMod);
    audioEngine.setTempoScale(tempoScale);

    store.set({ bioTick: Date.now() });
  }, 1800);
}

function setBioActivity(activityId) {
  if (!store.get().bioConnected) return;
  startBio(activityId);
}

function stopBio() {
  if (bioTimer) clearInterval(bioTimer);
  bioTimer = null;
  store.set({ bioConnected: false });
}
