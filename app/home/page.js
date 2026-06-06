"use client";
/**
 * app/home/page.js
 *
 * Fixes applied:
 * 1. STATE PERSISTENCE — all open-app flags are stored in sessionStorage so
 *    the exact screen the user was on is restored after a hot-reload or refresh.
 *    Only explicit close actions (onClose / Back) clear a flag.
 * 2. FINTECH IN MENU — Fintech (NovaPay) was wired in DesktopItems but the
 *    home page never declared the state flag or threaded it through.  Added
 *    showFintech state + stable openFintech callback + overlay render.
 * 3. STABLE CALLBACKS — persist() was recreated on every render (stale closure
 *    bug). Replaced with a single patchSession() helper that reads fresh state.
 */

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useRef } from "react";
import DesktopItems from "../components/DesktopItems";
import Game         from "../components/premium/Game";
import Education    from "../components/Education";
import Impact       from "../components/Impact";
import Experience   from "../components/Experience";
import Projects     from "../components/Projects";
import Menu         from "../components/Menu";
import Taskbar      from "../components/Taskbar";
import MusicApp     from "../components/premium/MusicApp";
import MapApp       from "../components/MapApp";
import Fintech      from "../components/premium/Fintech";

// ─── sessionStorage helpers ──────────────────────────────────────────────────
const SESSION_KEY = "dascott_open_app";

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}"); } catch { return {}; }
}

function patchSession(key, val) {
  try {
    const prev = loadSession();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...prev, [key]: val }));
  } catch {}
}

// ─── Persisted boolean state factory ────────────────────────────────────────
// Returns [value, setter] where setter also writes to sessionStorage.
function usePersistedBool(key, defaultVal = false) {
  const session = loadSession();
  const [value, setRaw] = useState(session[key] ?? defaultVal);
  const set = useCallback((v) => {
    const resolved = typeof v === "function" ? v(false) : v; // avoid stale closure
    setRaw(resolved);
    patchSession(key, resolved);
  }, [key]);
  return [value, set];
}

const Page = () => {
  // ── Persisted overlays ───────────────────────────────────────────────
  const [showModal,   setShowModal]   = usePersistedBool("showModal");
  const [experience,  setexperience]  = usePersistedBool("experience");
  const [impact,      setImpact]      = usePersistedBool("impact");
  const [education,   setEducation]   = usePersistedBool("education");
  const [game,        setGame]        = usePersistedBool("game");
  const [musicOpen,   setMusicOpen]   = usePersistedBool("musicOpen");
  const [mapOpen,     setMapOpen]     = usePersistedBool("mapOpen");
  const [showFintech, setShowFintech] = usePersistedBool("showFintech");

  // ── Non-persisted UI state ───────────────────────────────────────────
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [screen,          screenSet]          = useState(false);
  const [click,           isClick]            = useState(false);
  const [info,            setInfo]            = useState(false);

  // ── Stable open-callbacks for DesktopItems ───────────────────────────
  const openModal   = useCallback(() => setShowModal(true),   [setShowModal]);
  const openGame    = useCallback(() => setGame(true),        [setGame]);
  const openMusic   = useCallback(() => setMusicOpen(true),   [setMusicOpen]);
  const openMap     = useCallback(() => setMapOpen(true),     [setMapOpen]);
  const openFintech = useCallback(() => setShowFintech(true), [setShowFintech]);

  // ── ESC closes start menu ────────────────────────────────────────────
  useEffect(() => {
    if (!isStartMenuOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") { setIsStartMenuOpen(false); screenSet(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isStartMenuOpen]);

  const handleDesktopClick = useCallback(() => {
    if (isStartMenuOpen) { setIsStartMenuOpen(false); screenSet(false); }
  }, [isStartMenuOpen]);

  return (
    <main
      className="flex fixed flex-col h-full w-full items-stretch justify-between bg-slate-950 homepage overflow-hidden"
      onClick={handleDesktopClick}
    >
      {/* Desktop area */}
      <div className="flex-1 min-h-0 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <DesktopItems
          isStartMenuOpen={isStartMenuOpen}
          setShowModal={openModal}
          setGame={openGame}
          setMusicOpen={openMusic}
          setMapOpen={openMap}
          setShowFintech={openFintech}
        />
      </div>

      {/* Overlays */}
      <Game       game={game}             setGame={setGame} />
      <Education  education={education}   setEducation={setEducation} />
      <Impact     impact={impact}         setImpact={setImpact} />
      <Experience experience={experience} setexperience={setexperience} />
      <Projects   showModal={showModal}   setShowModal={setShowModal} />
      <MusicApp   musicOpen={musicOpen}   setMusicOpen={setMusicOpen} />
      <MapApp     mapOpen={mapOpen}       setMapOpen={setMapOpen} />
      {showFintech && <Fintech onClose={() => setShowFintech(false)} />}

      {/* Start menu */}
      <div onClick={(e) => e.stopPropagation()} className="relative z-40">
        <Menu
          isStartMenuOpen={isStartMenuOpen}
          setShowModal={setShowModal}
          setIsStartMenuOpen={setIsStartMenuOpen}
          screen={screen}
          setEducation={setEducation}
          setexperience={setexperience}
          setImpact={setImpact}
          setInfo={setInfo}
          info={info}
          setShowFintech={openFintech}
        />
      </div>

      {/* Taskbar */}
      <div
        className="relative z-50 flex-shrink-0"
        style={{ height: "var(--taskbar-height)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Taskbar
          isStartMenuOpen={isStartMenuOpen}
          setIsStartMenuOpen={setIsStartMenuOpen}
          click={click}
          isClick={isClick}
          screenSet={screenSet}
          setShowModal={setShowModal}
          screen={screen}
        />
      </div>
    </main>
  );
};

export default Page;