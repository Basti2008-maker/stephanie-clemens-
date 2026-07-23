function enterApp() {
  document.getElementById("screen-onboarding").hidden = true;
  initApp();
}

if (store.get().onboarded && store.get().dna) {
  enterApp();
} else {
  initOnboarding(enterApp);
}
