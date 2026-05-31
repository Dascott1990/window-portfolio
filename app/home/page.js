"use client";
/**
 * home/page.js — ENGINEERING OPTIMIZATIONS (zero visual changes)
 *
 * Fixes:
 * 1. Stable flex layout: desktop area fills space above taskbar exactly
 *    via `flex-1 min-h-0` so children never overflow into taskbar.
 * 2. All state setters memoised with useCallback so child components
 *    that receive them as props won't re-render on every parent render.
 * 3. screenWidth state removed — it was only used as a prop to Taskbar
 *    but Taskbar never consumed it. Eliminates one resize listener and
 *    one state update per second (it was re-set on every resize).
 * 4. ESC handler stabilised — only added/removed when isStartMenuOpen changes.
 * 5. handleDesktopClick stabilised with useCallback.
 */

import React, { useState, useEffect, useCallback } from "react";
import DesktopItems from "../components/DesktopItems";
import Game from "../components/premium/Game";
import Education from "../components/Education";
import Impact from "../components/Impact";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Menu from "../components/Menu";
import Taskbar from "../components/Taskbar";
import MusicApp from "../components/premium/MusicApp";
import MapApp from "../components/MapApp";

const Page = () => {
  const [showModal, setShowModal]           = useState(false);
  const [experience, setexperience]         = useState(false);
  const [impact, setImpact]                 = useState(false);
  const [education, setEducation]           = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [screen, screenSet]                 = useState(false);
  const [click, isClick]                    = useState(false);
  const [info, setInfo]                     = useState(false);
  const [game, setGame]                     = useState(false);
  const [musicOpen, setMusicOpen]           = useState(false);
  const [mapOpen, setMapOpen]               = useState(false);

  // ── Stable setters passed as props ──────────────────────────────────────────
  const openModal   = useCallback(() => setShowModal(true),   []);
  const openGame    = useCallback(() => setGame(true),        []);
  const openMusic   = useCallback(() => setMusicOpen(true),   []);
  const openMap     = useCallback(() => setMapOpen(true),     []);

  // ── Keyboard: ESC closes start menu ─────────────────────────────────────────
  useEffect(() => {
    if (!isStartMenuOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") {
        setIsStartMenuOpen(false);
        screenSet(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isStartMenuOpen]);

  // ── Click outside start menu ─────────────────────────────────────────────────
  const handleDesktopClick = useCallback(() => {
    if (isStartMenuOpen) {
      setIsStartMenuOpen(false);
      screenSet(false);
    }
  }, [isStartMenuOpen]);

  return (
    /*
     * Layout: column flex with exact heights.
     *   - `flex-1 min-h-0` on the desktop area prevents it from overflowing
     *     into the taskbar. min-h-0 is required in flex children to allow
     *     shrinking below their natural content height.
     *   - `flex-shrink-0` on the taskbar locks it to --taskbar-height (52px).
     *   - All fixed-position overlays inside DesktopItems / premium apps use
     *     `inset: 0 0 var(--taskbar-height) 0` (via .app-overlay in globals.css)
     *     so they never bleed beneath the bar.
     */
    <main
      className="flex fixed flex-col h-full w-full items-stretch justify-between bg-slate-950 homepage overflow-hidden"
      onClick={handleDesktopClick}
    >
      {/* Desktop area — exactly fills space between top and taskbar */}
      <div
        className="flex-1 min-h-0 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <DesktopItems
          isStartMenuOpen={isStartMenuOpen}
          setShowModal={openModal}
          setGame={openGame}
          setMusicOpen={openMusic}
          setMapOpen={openMap}
        />
      </div>

      {/* Overlays — rendered in portal-like pattern but still in DOM tree */}
      <Game       game={game}           setGame={setGame} />
      <Education  education={education} setEducation={setEducation} />
      <Impact     impact={impact}       setImpact={setImpact} />
      <Experience experience={experience} setexperience={setexperience} />
      <Projects   showModal={showModal} setShowModal={setShowModal} />
      <MusicApp   musicOpen={musicOpen} setMusicOpen={setMusicOpen} />
      <MapApp     mapOpen={mapOpen}     setMapOpen={setMapOpen} />

      {/* Start menu — renders above desktop, below taskbar in z-order */}
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
        />
      </div>

      {/* Taskbar — always anchored to bottom, never overlapped */}
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