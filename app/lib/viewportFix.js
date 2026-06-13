// app/lib/viewportFix.js
// Call this once in your root layout or _app.js
// Sets --vh CSS variable to the true visible viewport height,
// updating whenever the browser chrome resizes (URL bar show/hide).

export function initViewportFix() {
  if (typeof window === "undefined") return;

  const set = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  set();
  window.addEventListener("resize", set);
  // Also fire on orientationchange for older iOS
  window.addEventListener("orientationchange", () => setTimeout(set, 300));
}