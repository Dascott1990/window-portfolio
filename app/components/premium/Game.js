"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdOutlineClose, MdPause, MdPlayArrow, MdReplay, MdVolumeUp, MdVolumeOff } from "react-icons/md";
import { FaTrophy, FaStar, FaLightbulb } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";

// ─── Card definitions ────────────────────────────────────────────────────────
// Each unique symbol appears exactly once; we'll duplicate the array to form pairs.
const CARD_SYMBOLS = [
  { value: "A", emoji: "🦊", label: "Fox",    coinValue: 10 },
  { value: "B", emoji: "🐬", label: "Dolphin", coinValue: 15 },
  { value: "C", emoji: "🦋", label: "Butterfly",coinValue: 20 },
  { value: "D", emoji: "🐉", label: "Dragon", coinValue: 25 },
  { value: "E", emoji: "🦄", label: "Unicorn", coinValue: 30 },
  { value: "F", emoji: "🌙", label: "Moon",   coinValue: 20 },
  { value: "G", emoji: "⚡", label: "Lightning",coinValue: 15 },
  { value: "H", emoji: "🎯", label: "Target", coinValue: 10 },
];

const DIFFICULTIES = {
  easy:   { label: "Easy",   pairs: 6,  timeLimit: 0,   moveLimit: 0,   cols: "grid-cols-3 sm:grid-cols-4" },
  medium: { label: "Medium", pairs: 8,  timeLimit: 120, moveLimit: 0,   cols: "grid-cols-4" },
  hard:   { label: "Hard",   pairs: 8,  timeLimit: 60,  moveLimit: 20,  cols: "grid-cols-4" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildDeck = (pairCount) => {
  const symbols = CARD_SYMBOLS.slice(0, pairCount);
  const pairs = symbols.flatMap((s, i) => [
    { uid: i * 2,     value: s.value, emoji: s.emoji, label: s.label, coinValue: s.coinValue },
    { uid: i * 2 + 1, value: s.value, emoji: s.emoji, label: s.label, coinValue: s.coinValue },
  ]);
  return shuffle(pairs);
};

const playSound = (src) => {
  try { new Audio(src).play(); } catch {}
};

const getHighScores = () => {
  try { return JSON.parse(localStorage.getItem("memoryHighScores") || "{}"); } catch { return {}; }
};

const saveHighScore = (difficulty, score) => {
  try {
    const hs = getHighScores();
    if (!hs[difficulty] || score > hs[difficulty]) {
      hs[difficulty] = score;
      localStorage.setItem("memoryHighScores", JSON.stringify(hs));
      return true; // new record
    }
  } catch {}
  return false;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const ScorePopup = ({ value, id }) => (
  <motion.div
    key={id}
    initial={{ opacity: 1, y: 0, scale: 1 }}
    animate={{ opacity: 0, y: -60, scale: 1.4 }}
    transition={{ duration: 1, ease: "easeOut" }}
    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[200]"
  >
    <span className="text-yellow-400 font-black text-3xl drop-shadow-lg">+{value}</span>
  </motion.div>
);

const Card = ({ card, isFlipped, isMatched, isWrong, onClick }) => {
  return (
    <motion.div
      className="relative aspect-square cursor-pointer select-none"
      style={{ perspective: 800 }}
      whileHover={!isFlipped && !isMatched ? { scale: 1.06 } : {}}
      whileTap={!isFlipped && !isMatched ? { scale: 0.94 } : {}}
      onClick={onClick}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Back face */}
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center"
          style={{ backfaceVisibility: "hidden",
            background: "linear-gradient(135deg, #1e3a5f 0%, #0f2442 100%)",
            border: "1px solid rgba(99,179,237,0.25)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
          }}
        >
          <span className="text-blue-400/60 text-2xl font-black select-none">?</span>
        </div>
        {/* Front face */}
        <div
          className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-1
            ${isMatched
              ? "ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
              : isWrong
              ? "ring-2 ring-red-400"
              : "ring-1 ring-white/10"
            }`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: isMatched
              ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
              : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          }}
        >
          <span className="text-3xl sm:text-4xl leading-none">{card.emoji}</span>
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest mt-1 hidden sm:block">
            {card.label}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── SCREENS ──────────────────────────────────────────────────────────────────
const StartScreen = ({ onPlay, onInstructions, highScores }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center gap-6 px-6 py-8 text-center"
  >
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-5xl"
      >🧠</motion.div>
      <h1 className="text-3xl font-black text-white tracking-tight">Memory Match</h1>
      <p className="text-blue-300/70 text-sm max-w-xs">
        Flip cards to find matching pairs. The faster and fewer moves — the higher your score.
      </p>
    </div>

    {/* High Scores */}
    <div className="w-full max-w-xs bg-white/5 rounded-2xl p-4 border border-white/8">
      <div className="flex items-center gap-2 mb-3">
        <FaTrophy className="text-yellow-400 text-sm" />
        <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Best Scores</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(DIFFICULTIES).map(([key, d]) => (
          <div key={key} className="flex flex-col items-center bg-white/5 rounded-xl p-2">
            <span className="text-white/40 text-[10px] uppercase tracking-wider">{d.label}</span>
            <span className="text-yellow-400 font-black text-lg">
              {highScores[key] ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>

    <div className="flex flex-col gap-3 w-full max-w-xs">
      {Object.entries(DIFFICULTIES).map(([key, d]) => (
        <motion.button
          key={key}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => onPlay(key)}
          className={`w-full py-3 rounded-2xl font-bold text-sm transition-all
            ${key === "easy"   ? "bg-emerald-600 hover:bg-emerald-500 text-white" :
              key === "medium" ? "bg-blue-600 hover:bg-blue-500 text-white" :
                                 "bg-rose-700 hover:bg-rose-600 text-white"}`}
        >
          {d.label}
          {d.timeLimit > 0 && <span className="text-xs font-normal ml-2 opacity-70">{d.timeLimit}s</span>}
          {d.moveLimit > 0 && <span className="text-xs font-normal ml-1 opacity-70">· {d.moveLimit} moves max</span>}
        </motion.button>
      ))}
      <button
        onClick={onInstructions}
        className="text-blue-300/60 text-xs hover:text-blue-300 transition-colors flex items-center justify-center gap-1 mt-1"
      >
        <FaLightbulb size={10} /> How to play
      </button>
    </div>
  </motion.div>
);

const InstructionsScreen = ({ onBack }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
    className="flex flex-col gap-5 px-6 py-8"
  >
    <h2 className="text-xl font-black text-white text-center">How to Play</h2>
    <div className="space-y-3">
      {[
        ["🎯", "Objective", "Find all matching pairs of cards before time or moves run out."],
        ["👆", "Controls", "Tap or click a card to flip it. Flip two cards — if they match, they stay revealed."],
        ["⭐", "Scoring", "Each match earns coins. Fewer moves & faster time = higher score. Bonus for completing!"],
        ["⏱️", "Difficulty", "Easy: unlimited. Medium: 120s timer. Hard: 60s timer + 20 move limit."],
        ["🏆", "High Score", "Your best score per difficulty is saved even after you close the game."],
      ].map(([icon, title, desc]) => (
        <div key={title} className="flex gap-3 items-start bg-white/5 rounded-xl p-3 border border-white/8">
          <span className="text-2xl flex-shrink-0">{icon}</span>
          <div>
            <p className="text-white font-semibold text-sm">{title}</p>
            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{desc}</p>
          </div>
        </div>
      ))}
    </div>
    <motion.button
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={onBack}
      className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
    >
      Got it!
    </motion.button>
  </motion.div>
);

const PauseOverlay = ({ onResume, onRestart, onExit }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 rounded-2xl"
    style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
  >
    <MdPause className="text-white/20" size={64} />
    <h2 className="text-2xl font-black text-white">Paused</h2>
    <div className="flex flex-col gap-3 w-48">
      <button onClick={onResume} className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2">
        <MdPlayArrow /> Resume
      </button>
      <button onClick={onRestart} className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center gap-2">
        <MdReplay /> Restart
      </button>
      <button onClick={onExit} className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-bold">
        Exit Game
      </button>
    </div>
  </motion.div>
);

const ResultScreen = ({ won, score, isNewRecord, moves, timeLeft, difficulty, onRestart, onExit }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
    className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 rounded-2xl px-6 text-center"
    style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
  >
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: "spring", damping: 12, delay: 0.1 }}
      className="text-6xl"
    >
      {won ? "🏆" : "💀"}
    </motion.div>
    <div>
      <h2 className="text-2xl font-black text-white">{won ? "You Won!" : "Game Over"}</h2>
      <p className="text-white/40 text-sm mt-1">
        {won
          ? `Completed in ${moves} moves`
          : `Better luck next time on ${DIFFICULTIES[difficulty]?.label}`}
      </p>
    </div>

    {won && (
      <div className="bg-white/8 rounded-2xl px-8 py-4 border border-white/10 flex flex-col items-center">
        <span className="text-white/40 text-xs uppercase tracking-widest mb-1">Score</span>
        <span className="text-yellow-400 font-black text-4xl">{score}</span>
        {isNewRecord && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold"
          >
            <HiSparkles /> New Record!
          </motion.div>
        )}
      </div>
    )}

    <div className="flex gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2"
      >
        <MdReplay /> Play Again
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onExit}
        className="px-6 py-3 rounded-2xl bg-white/8 hover:bg-white/15 text-white font-bold"
      >
        Exit
      </motion.button>
    </div>
  </motion.div>
);

// ─── MAIN GAME COMPONENT ──────────────────────────────────────────────────────
const Game = ({ game, setGame }) => {
  const [screen, setScreen] = useState("start"); // start | instructions | playing | paused | won | lost
  const [difficulty, setDifficulty] = useState("easy");
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);   // indices of currently face-up (unmatched) cards
  const [matched, setMatched] = useState([]);   // uids of matched cards
  const [wrongPair, setWrongPair] = useState([]); // indices of wrong pair briefly highlighted
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [muted, setMuted] = useState(false);
  const [popups, setPopups] = useState([]);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [highScores, setHighScores] = useState({});
  const [canFlip, setCanFlip] = useState(true);

  const timerRef = useRef(null);

  const sfx = useCallback((src) => { if (!muted) playSound(src); }, [muted]);

  // Load high scores on mount
  useEffect(() => { setHighScores(getHighScores()); }, []);

  // Timer
  useEffect(() => {
    if (screen !== "playing") { clearInterval(timerRef.current); return; }
    const cfg = DIFFICULTIES[difficulty];
    if (!cfg.timeLimit) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          sfx("/close.wav");
          setScreen("lost");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, difficulty, sfx]);

  const startGame = useCallback((diff) => {
    sfx("/start.mp3");
    const cfg = DIFFICULTIES[diff];
    setDifficulty(diff);
    setCards(buildDeck(cfg.pairs));
    setFlipped([]);
    setMatched([]);
    setWrongPair([]);
    setMoves(0);
    setScore(0);
    setCanFlip(true);
    setTimeLeft(cfg.timeLimit);
    setIsNewRecord(false);
    setScreen("playing");
  }, [sfx]);

  const resetToStart = useCallback(() => {
    clearInterval(timerRef.current);
    setScreen("start");
    setHighScores(getHighScores());
  }, []);

  // Card flip logic
  const handleCardClick = useCallback((index) => {
    if (!canFlip) return;
    if (screen !== "playing") return;
    if (flipped.includes(index)) return;
    if (matched.includes(cards[index].uid)) return;
    if (flipped.length >= 2) return;

    sfx("/click.wav");
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [i1, i2] = newFlipped;
      const c1 = cards[i1], c2 = cards[i2];
      setMoves((m) => m + 1);
      setCanFlip(false);

      if (c1.value === c2.value) {
        // Match!
        const reward = c1.coinValue;
        sfx("/coin.wav");
        const newMatched = [...matched, c1.uid, c2.uid];
        const newScore = score + reward;

        // Add popup
        const pid = Date.now();
        setPopups((p) => [...p, { id: pid, value: reward }]);
        setTimeout(() => setPopups((p) => p.filter((x) => x.id !== pid)), 1000);

        setTimeout(() => {
          setMatched(newMatched);
          setFlipped([]);
          setScore(newScore);
          setCanFlip(true);

          // Check win
          const cfg = DIFFICULTIES[difficulty];
          if (newMatched.length === cfg.pairs * 2) {
            clearInterval(timerRef.current);
            // Bonus: remaining time + move efficiency
            const timeBonus = cfg.timeLimit ? timeLeft * 2 : 0;
            const moveBonus = cfg.moveLimit
              ? Math.max(0, (cfg.moveLimit - moves) * 5)
              : Math.max(0, (30 - moves) * 3);
            const finalScore = newScore + timeBonus + moveBonus;
            setScore(finalScore);
            const newRec = saveHighScore(difficulty, finalScore);
            setIsNewRecord(newRec);
            sfx("/coin.wav");
            setHighScores(getHighScores());
            setTimeout(() => setScreen("won"), 500);
          }
        }, 400);
      } else {
        // No match
        setWrongPair(newFlipped);
        setTimeout(() => {
          setFlipped([]);
          setWrongPair([]);
          setCanFlip(true);

          // Check move limit
          const cfg = DIFFICULTIES[difficulty];
          if (cfg.moveLimit && moves + 1 >= cfg.moveLimit) {
            sfx("/close.wav");
            setScreen("lost");
          }
        }, 900);
      }
    }
  }, [canFlip, screen, flipped, matched, cards, sfx, score, difficulty, timeLeft, moves]);

  const togglePause = useCallback(() => {
    sfx("/click.wav");
    setScreen((s) => s === "playing" ? "paused" : "playing");
  }, [sfx]);

  const cfg = DIFFICULTIES[difficulty];
  const totalPairs = cfg?.pairs ?? 6;
  const matchedPairs = matched.length / 2;
  const progress = matchedPairs / totalPairs;

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const timerColor = timeLeft <= 10 && cfg?.timeLimit ? "text-red-400 animate-pulse" : "text-white";

  if (!game) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="safe-overlay-backdrop"
        style={{ bottom: "var(--taskbar-height, 52px)" }}
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(30,58,138,0.4) 0%, rgba(0,0,0,0.85) 100%)",
          backdropFilter: "blur(20px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.92, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 16, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[95vh] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(160deg, #0f1c35 0%, #060d1a 100%)",
            border: "1px solid rgba(99,179,237,0.15)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* ── HEADER ── */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 flex-shrink-0"
               style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <span className="text-white font-black text-sm tracking-tight">Memory Match</span>
              {screen === "playing" && (
                <span className="text-white/30 text-xs ml-1 capitalize">· {difficulty}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Mute */}
              <button
                onClick={() => setMuted((m) => !m)}
                className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"
                aria-label="Toggle sound"
              >
                {muted ? <MdVolumeOff size={16} /> : <MdVolumeUp size={16} />}
              </button>
              {/* Pause (only during gameplay) */}
              {screen === "playing" && (
                <button
                  onClick={togglePause}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"
                  aria-label="Pause"
                >
                  <MdPause size={16} />
                </button>
              )}
              {/* Close */}
              <button
                onClick={() => { sfx("/click.wav"); setGame(false); }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                aria-label="Close"
              >
                <MdOutlineClose size={18} />
              </button>
            </div>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div className="flex-1 overflow-y-auto relative">

            {/* Score popups */}
            <AnimatePresence>
              {popups.map((p) => <ScorePopup key={p.id} value={p.value} id={p.id} />)}
            </AnimatePresence>

            {/* ── START SCREEN ── */}
            <AnimatePresence mode="wait">
              {screen === "start" && (
                <StartScreen
                  key="start"
                  onPlay={startGame}
                  onInstructions={() => setScreen("instructions")}
                  highScores={highScores}
                />
              )}

              {/* ── INSTRUCTIONS ── */}
              {screen === "instructions" && (
                <InstructionsScreen
                  key="instructions"
                  onBack={() => setScreen("start")}
                />
              )}

              {/* ── PLAYING ── */}
              {(screen === "playing" || screen === "paused") && (
                <motion.div
                  key="gameplay"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="relative"
                >
                  {/* Stats bar */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                    {/* Moves */}
                    <div className="flex flex-col items-center min-w-[60px]">
                      <span className="text-white/30 text-[10px] uppercase tracking-widest">Moves</span>
                      <span className="text-white font-black text-lg leading-none">
                        {moves}
                        {cfg?.moveLimit > 0 && (
                          <span className="text-white/30 font-normal text-xs">/{cfg.moveLimit}</span>
                        )}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex-1 mx-4 flex flex-col items-center gap-1">
                      <div className="w-full bg-white/8 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                          animate={{ width: `${progress * 100}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <span className="text-white/30 text-[10px]">{matchedPairs}/{totalPairs} pairs</span>
                    </div>

                    {/* Timer / Score */}
                    <div className="flex flex-col items-center min-w-[60px]">
                      {cfg?.timeLimit > 0 ? (
                        <>
                          <span className="text-white/30 text-[10px] uppercase tracking-widest">Time</span>
                          <span className={`font-black text-lg leading-none ${timerColor}`}>
                            {formatTime(timeLeft)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-white/30 text-[10px] uppercase tracking-widest">Score</span>
                          <span className="text-yellow-400 font-black text-lg leading-none">{score}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card grid */}
                  <div className="p-4 sm:p-5">
                    <div className={`grid ${cfg.cols} gap-2.5 sm:gap-3`}>
                      {cards.map((card, i) => (
                        <Card
                          key={card.uid}
                          card={card}
                          isFlipped={flipped.includes(i)}
                          isMatched={matched.includes(card.uid)}
                          isWrong={wrongPair.includes(i)}
                          onClick={() => handleCardClick(i)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pause overlay */}
                  <AnimatePresence>
                    {screen === "paused" && (
                      <PauseOverlay
                        onResume={togglePause}
                        onRestart={() => startGame(difficulty)}
                        onExit={resetToStart}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── WIN / LOSE ── */}
              {(screen === "won" || screen === "lost") && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="relative min-h-[400px]"
                >
                  {/* Keep the board visible behind the overlay */}
                  <div className="opacity-20 pointer-events-none p-4">
                    <div className={`grid ${cfg.cols} gap-2.5`}>
                      {cards.map((card, i) => (
                        <Card key={card.uid} card={card} isFlipped isMatched={matched.includes(card.uid)} isWrong={false} onClick={() => {}} />
                      ))}
                    </div>
                  </div>
                  <ResultScreen
                    won={screen === "won"}
                    score={score}
                    isNewRecord={isNewRecord}
                    moves={moves}
                    timeLeft={timeLeft}
                    difficulty={difficulty}
                    onRestart={() => startGame(difficulty)}
                    onExit={resetToStart}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Game;