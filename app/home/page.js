"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, Suspense } from "react";
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
import Calendar     from "../components/premium/Calendar";
import Health       from "../components/premium/Health";
import ProjectAI    from "../components/premium/ProjectAI";
import Camera       from "../components/premium/Camera";
import AssetNews    from "../components/premium/AssetNews";
import Contact      from "../components/premium/Contact";
import Resume       from "../components/premium/Resume";

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
function usePersistedBool(key, defaultVal = false) {
  const session = loadSession();
  const [value, setRaw] = useState(session[key] ?? defaultVal);
  const set = useCallback((v) => {
    const resolved = typeof v === "function" ? v(false) : v;
    setRaw(resolved);
    patchSession(key, resolved);
  }, [key]);
  return [value, set];
}

const Page = () => {
  // ── All overlay states ────────────────────────────────────────────
  const [showModal,     setShowModal]     = usePersistedBool("showModal");
  const [experience,    setexperience]    = usePersistedBool("experience");
  const [impact,        setImpact]        = usePersistedBool("impact");
  const [education,     setEducation]     = usePersistedBool("education");
  const [game,          setGame]          = usePersistedBool("game");
  const [musicOpen,     setMusicOpen]     = usePersistedBool("musicOpen");
  const [mapOpen,       setMapOpen]       = usePersistedBool("mapOpen");
  const [showFintech,   setShowFintech]   = usePersistedBool("showFintech");
  const [showCalendar,  setShowCalendar]  = usePersistedBool("showCalendar");
  const [showHealth,    setShowHealth]    = usePersistedBool("showHealth");
  const [showAI,        setShowAI]        = usePersistedBool("showAI");
  const [showCamera,    setShowCamera]    = usePersistedBool("showCamera");
  const [showAssets,    setShowAssets]    = usePersistedBool("showAssets");
  const [showContact,   setShowContact]   = usePersistedBool("showContact");
  const [showResume,    setShowResume]    = usePersistedBool("showResume");

  // ── Non-persisted UI ─────────────────────────────────────────────
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [screen,          screenSet]          = useState(false);
  const [click,           isClick]            = useState(false);
  const [info,            setInfo]            = useState(false);

  // ── ESC closes start menu ─────────────────────────────────────────
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
      {/* Desktop icon grid */}
      <div className="flex-1 min-h-0 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <DesktopItems
          isStartMenuOpen={isStartMenuOpen}
          setShowModal={setShowModal}
          setGame={setGame}
          setMusicOpen={setMusicOpen}
          setMapOpen={setMapOpen}
          setShowFintech={setShowFintech}
        />
      </div>

      {/* ── All app overlays ────────────────────────────────────────── */}
      <Game        game={game}             setGame={setGame} />
      <Education   education={education}   setEducation={setEducation} />
      <Impact      impact={impact}         setImpact={setImpact} />
      <Experience  experience={experience} setexperience={setexperience} />
      <Projects    showModal={showModal}   setShowModal={setShowModal} />
      <MusicApp    musicOpen={musicOpen}   setMusicOpen={setMusicOpen} />
      <MapApp      mapOpen={mapOpen}       setMapOpen={setMapOpen} />

      {showFintech  && <Fintech   onClose={() => setShowFintech(false)} />}
      {showCalendar && <Calendar  onClose={() => setShowCalendar(false)} />}
      {showHealth   && <Health    onClose={() => setShowHealth(false)} />}
      {showAI       && <ProjectAI onClose={() => setShowAI(false)} />}
      {showCamera   && <Camera    onClose={() => setShowCamera(false)} />}
      {showAssets   && (
        <AssetNews
          onClose={() => setShowAssets(false)}
          glassEffect="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80"
          borderEffect="border border-gray-200 dark:border-gray-700"
          shadowEffect="shadow-lg"
        />
      )}
      {showContact  && <Contact  onClose={() => setShowContact(false)} />}
      {showResume   && <Resume   onClose={() => setShowResume(false)} />}

      {/* Start menu — stopPropagation so desktop click doesn't immediately close it */}
      <div onClick={(e) => e.stopPropagation()} className="relative z-40">
        <Menu
          isStartMenuOpen={isStartMenuOpen}
          setIsStartMenuOpen={setIsStartMenuOpen}
          screen={screen}
          setShowModal={setShowModal}
          setexperience={setexperience}
          setImpact={setImpact}
          setEducation={setEducation}
          setInfo={setInfo}
          info={info}
          setShowFintech={setShowFintech}
          setGame={setGame}
          setMusicOpen={setMusicOpen}
          setMapOpen={setMapOpen}
          setShowCalendar={setShowCalendar}
          setShowHealth={setShowHealth}
          setShowAI={setShowAI}
          setShowCamera={setShowCamera}
          setShowAssetNews={setShowAssets}
          setShowContact={setShowContact}
          setShowResume={setShowResume}
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