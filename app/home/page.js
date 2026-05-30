"use client";
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
  const [screenWidth, setScreenWidth] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [experience, setexperience] = useState(false);
  const [impact, setImpact] = useState(false);
  const [education, setEducation] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [screen, screenSet] = useState(false);
  const [click, isClick] = useState(false);
  const [info, setInfo] = useState(false);
  const [game, setGame] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    const update = () => setScreenWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Close start menu on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (isStartMenuOpen) {
          setIsStartMenuOpen(false);
          screenSet(false);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isStartMenuOpen]);

  // Close start menu when clicking outside it
  const handleDesktopClick = useCallback(() => {
    if (isStartMenuOpen) {
      setIsStartMenuOpen(false);
      screenSet(false);
    }
  }, [isStartMenuOpen]);

  return (
    <main
      className="flex fixed flex-col h-full w-full items-stretch justify-between bg-slate-950 homepage overflow-hidden"
      onClick={handleDesktopClick}
    >
      {/* Desktop area — fills remaining space above taskbar */}
      <div className="flex-1 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <DesktopItems
          isStartMenuOpen={isStartMenuOpen}
          setShowModal={setShowModal}
          setGame={setGame}
          setMusicOpen={setMusicOpen}
          setMapOpen={setMapOpen}
        />
      </div>

      {/* Game, Education, Impact, Experience, Projects, Music, Map */}
      <Game game={game} setGame={setGame} />
      <Education education={education} setEducation={setEducation} />
      <Impact impact={impact} setImpact={setImpact} />
      <Experience experience={experience} setexperience={setexperience} />
      <Projects showModal={showModal} setShowModal={setShowModal} />
      <MusicApp musicOpen={musicOpen} setMusicOpen={setMusicOpen} />
      <MapApp mapOpen={mapOpen} setMapOpen={setMapOpen} />

      {/* Menu sits above desktop, below taskbar */}
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

      {/* Taskbar — always on bottom */}
      <div className="relative z-50 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Taskbar
          isStartMenuOpen={isStartMenuOpen}
          setIsStartMenuOpen={setIsStartMenuOpen}
          screenWidth={screenWidth}
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