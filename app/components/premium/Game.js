"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdOutlineClose, MdPause, MdPlayArrow, MdReplay, MdVolumeUp, MdVolumeOff, MdShuffle, MdTimer, MdStars } from "react-icons/md";
import { FaTrophy, FaStar, FaLightbulb, FaFire, FaBolt, FaCrown, FaRocket } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";

// ─── Enhanced Card definitions ──────────────────────────────────────────────
const CARD_SYMBOLS = [
  { value: "A", emoji: "🦊", label: "Fox", coinValue: 10, rarity: "common" },
  { value: "B", emoji: "🐬", label: "Dolphin", coinValue: 15, rarity: "common" },
  { value: "C", emoji: "🦋", label: "Butterfly", coinValue: 20, rarity: "uncommon" },
  { value: "D", emoji: "🐉", label: "Dragon", coinValue: 25, rarity: "rare" },
  { value: "E", emoji: "🦄", label: "Unicorn", coinValue: 30, rarity: "rare" },
  { value: "F", emoji: "🌙", label: "Moon", coinValue: 20, rarity: "uncommon" },
  { value: "G", emoji: "⚡", label: "Lightning", coinValue: 15, rarity: "common" },
  { value: "H", emoji: "🎯", label: "Target", coinValue: 10, rarity: "common" },
  { value: "I", emoji: "🎆", label: "Fireworks", coinValue: 35, rarity: "legendary" },
  { value: "J", emoji: "🌈", label: "Rainbow", coinValue: 40, rarity: "legendary" },
];

const DIFFICULTIES = {
  easy: {
    label: "Easy",
    pairs: 6,
    timeLimit: 0,
    moveLimit: 0,
    cols: "grid-cols-3 sm:grid-cols-4",
    color: "emerald",
    bonusMultiplier: 1
  },
  medium: {
    label: "Medium",
    pairs: 8,
    timeLimit: 120,
    moveLimit: 0,
    cols: "grid-cols-4",
    color: "blue",
    bonusMultiplier: 1.5
  },
  hard: {
    label: "Hard",
    pairs: 10,
    timeLimit: 60,
    moveLimit: 25,
    cols: "grid-cols-4 sm:grid-cols-5",
    color: "rose",
    bonusMultiplier: 2
  },
  expert: {
    label: "Expert",
    pairs: 12,
    timeLimit: 45,
    moveLimit: 20,
    cols: "grid-cols-4 sm:grid-cols-6",
    color: "purple",
    bonusMultiplier: 2.5
  }
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
  const symbols = shuffle(CARD_SYMBOLS).slice(0, pairCount);
  const pairs = symbols.flatMap((s, i) => [
    { uid: i * 2, value: s.value, emoji: s.emoji, label: s.label, coinValue: s.coinValue, rarity: s.rarity },
    { uid: i * 2 + 1, value: s.value, emoji: s.emoji, label: s.label, coinValue: s.coinValue, rarity: s.rarity },
  ]);
  return shuffle(pairs);
};

const playSound = (src) => {
  try {
    const audio = new Audio(src);
    audio.volume = 0.3;
    audio.play();
  } catch {}
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
      return true;
    }
  } catch {}
  return false;
};

// ─── Sub-components ────────────────────────────────────────────────────────────────
const ScorePopup = ({ value, id, type = "coin" }) => (
  <motion.div
    key={id}
    initial={{ opacity: 1, y: 0, scale: 0.5 }}
    animate={{ opacity: 0, y: -80, scale: 1.5 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[200]"
  >
    <span className={`font-black text-4xl drop-shadow-lg ${
      type === "bonus" ? "text-purple-400" : 
      type === "combo" ? "text-orange-400" : 
      "text-yellow-400"
    }`}>
      {type === "bonus" && "⭐"}
      {type === "combo" && "🔥"}
      +{value}
    </span>
  </motion.div>
);

const ComboIndicator = ({ combo }) => (
  <AnimatePresence>
    {combo > 1 && (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 rounded-full text-white font-bold text-sm shadow-lg z-10"
      >
        <FaFire className="inline mr-1" /> {combo}x Combo!
      </motion.div>
    )}
  </AnimatePresence>
);

const AchievementUnlock = ({ achievement, onComplete }) => (
  <motion.div
    initial={{ x: 100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 100, opacity: 0 }}
    className="fixed bottom-20 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-xl shadow-2xl z-50 max-w-xs"
  >
    <div className="flex items-center gap-3">
      <FaCrown className="text-white text-2xl" />
      <div>
        <p className="text-white font-bold text-sm">Achievement Unlocked!</p>
        <p className="text-white/90 text-xs">{achievement}</p>
      </div>
    </div>
  </motion.div>
);

const Card = ({ card, isFlipped, isMatched, isWrong, onClick, index }) => {
  const rarityColors = {
    common: "from-gray-600 to-gray-800",
    uncommon: "from-green-600 to-green-800",
    rare: "from-blue-600 to-blue-800",
    legendary: "from-purple-600 to-pink-600"
  };

  return (
    <motion.div
      className="relative aspect-square cursor-pointer select-none"
      style={{ perspective: 800 }}
      whileHover={!isFlipped && !isMatched ? { scale: 1.06, rotateY: 5 } : {}}
      whileTap={!isFlipped && !isMatched ? { scale: 0.94 } : {}}
      onClick={onClick}
      layout
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateY: isFlipped || isMatched ? 180 : 0,
        }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
          type: "spring",
          damping: 15,
          stiffness: 200
        }}
      >
        {/* Back face */}
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            background: "linear-gradient(135deg, #1e3a5f 0%, #0f2442 100%)",
            border: "1px solid rgba(99,179,237,0.25)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,179,237,0.3)_0%,_transparent_70%)]" />
          </div>
          <span className="text-blue-400/60 text-2xl font-black select-none">
            {isMatched ? "✨" : "?"}
          </span>
        </div>
        {/* Front face */}
        <div
          className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-1
            ${isMatched
              ? `ring-2 ring-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)] bg-gradient-to-br from-emerald-900/50 to-emerald-700/50`
              : isWrong
              ? "ring-2 ring-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              : "ring-1 ring-white/10"
            }`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: isMatched
              ? "linear-gradient(135deg, rgba(6,78,59,0.9) 0%, rgba(6,95,70,0.9) 100%)"
              : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          }}
        >
          <span className="text-3xl sm:text-4xl leading-none relative">
            {card.emoji}
            {isMatched && (
              <motion.span
                className="absolute -top-2 -right-2 text-xs"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                ✨
              </motion.span>
            )}
          </span>
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest mt-1 hidden sm:block">
            {card.label}
          </span>
          {!isMatched && (
            <span className={`text-[8px] px-2 py-0.5 rounded-full bg-gradient-to-r ${rarityColors[card.rarity]} text-white/60 uppercase`}>
              {card.rarity}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Screens ──────────────────────────────────────────────────────────────────
const StartScreen = ({ onPlay, onInstructions, highScores }) => {
  const [hoveredDiff, setHoveredDiff] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-6 px-6 py-8 text-center"
    >
      <div className="flex flex-col items-center gap-2">
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl"
        >🧠</motion.div>
        <h1 className="text-4xl font-black text-white tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Memory Match
        </h1>
        <p className="text-blue-300/70 text-sm max-w-xs">
          Match pairs, earn combos, and set new records!
        </p>
      </div>

      <div className="w-full max-w-xs bg-white/5 rounded-2xl p-4 border border-white/8">
        <div className="flex items-center gap-2 mb-3">
          <FaTrophy className="text-yellow-400 text-sm" />
          <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Best Scores</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(DIFFICULTIES).map(([key, d]) => (
            <motion.div
              key={key}
              className="flex flex-col items-center bg-white/5 rounded-xl p-2"
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <span className="text-white/40 text-[8px] uppercase tracking-wider">{d.label}</span>
              <span className="text-yellow-400 font-black text-lg">
                {highScores[key] ?? "—"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {Object.entries(DIFFICULTIES).map(([key, d]) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.03, x: 5 }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setHoveredDiff(key)}
            onHoverEnd={() => setHoveredDiff(null)}
            onClick={() => onPlay(key)}
            className={`w-full py-3 rounded-2xl font-bold text-sm transition-all relative overflow-hidden
              ${key === "easy" ? "bg-emerald-600 hover:bg-emerald-500 text-white" :
                key === "medium" ? "bg-blue-600 hover:bg-blue-500 text-white" :
                key === "hard" ? "bg-rose-700 hover:bg-rose-600 text-white" :
                "bg-purple-700 hover:bg-purple-600 text-white"}`}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: hoveredDiff === key ? "100%" : "-100%" }}
              transition={{ duration: 0.5 }}
            />
            <div className="flex items-center justify-center gap-2">
              {d.label}
              {d.timeLimit > 0 && (
                <span className="text-xs font-normal opacity-70 flex items-center gap-1">
                  <MdTimer /> {d.timeLimit}s
                </span>
              )}
              {d.moveLimit > 0 && (
                <span className="text-xs font-normal opacity-70 flex items-center gap-1">
                  <MdShuffle /> {d.moveLimit}
                </span>
              )}
            </div>
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
};

const InstructionsScreen = ({ onBack }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
    className="flex flex-col gap-5 px-6 py-8"
  >
    <h2 className="text-xl font-black text-white text-center">How to Play</h2>
    <div className="space-y-3">
      {[
        ["🎯", "Objective", "Find all matching pairs of cards before time or moves run out. Match rare cards for bonus points!"],
        ["👆", "Controls", "Tap or click a card to flip it. Flip two cards — if they match, they stay revealed."],
        ["🔥", "Combos", "Match cards in a row to build a combo! Each consecutive match adds bonus points to your score."],
        ["⭐", "Scoring", "Each match earns coins. Combos add bonus points. Complete the game fast with few moves for a massive score bonus!"],
        ["⏱️", "Difficulty", "Easy: unlimited. Medium: 120s timer. Hard: 60s timer + 25 move limit. Expert: 45s timer + 20 move limit."],
        ["🏆", "Achievements", "Unlock special achievements as you play! Can you collect them all?"],
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
      className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm"
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

const ResultScreen = ({ won, score, isNewRecord, moves, timeLeft, difficulty, combo, matchStreak, onRestart, onExit }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
    className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 rounded-2xl px-6 text-center"
    style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
  >
    <motion.div
      initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", damping: 12, delay: 0.1 }}
      className="text-7xl"
    >
      {won ? "🏆" : "💀"}
    </motion.div>
    <div>
      <h2 className={`text-3xl font-black ${won ? "text-yellow-400" : "text-red-400"}`}>
        {won ? "You Won!" : "Game Over"}
      </h2>
      <p className="text-white/40 text-sm mt-1">
        {won
          ? `Completed in ${moves} moves`
          : `Better luck next time on ${DIFFICULTIES[difficulty]?.label}`}
      </p>
    </div>

    {won && (
      <>
        <div className="bg-white/8 rounded-2xl px-8 py-4 border border-white/10 flex flex-col items-center">
          <span className="text-white/40 text-xs uppercase tracking-widest mb-1">Final Score</span>
          <span className="text-yellow-400 font-black text-5xl">{score}</span>
          {isNewRecord && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold"
            >
              <HiSparkles /> New Record!
            </motion.div>
          )}
        </div>

        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-white/40 text-xs">Best Combo</div>
            <div className="text-orange-400 font-bold text-lg">{combo}x</div>
          </div>
          <div className="text-center">
            <div className="text-white/40 text-xs">Longest Streak</div>
            <div className="text-purple-400 font-bold text-lg">{matchStreak}</div>
          </div>
          <div className="text-center">
            <div className="text-white/40 text-xs">Difficulty</div>
            <div className="text-blue-400 font-bold text-lg">{DIFFICULTIES[difficulty]?.label}</div>
          </div>
        </div>
      </>
    )}

    <div className="flex gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold flex items-center gap-2"
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
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [screen, setScreen] = useState("start");
  const [difficulty, setDifficulty] = useState("easy");
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [muted, setMuted] = useState(false);
  const [popups, setPopups] = useState([]);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [highScores, setHighScores] = useState({});
  const [canFlip, setCanFlip] = useState(true);
  const [combo, setCombo] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [matchStreak, setMatchStreak] = useState(0);
  const [currentAchievement, setCurrentAchievement] = useState(null);

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

  // Achievement popup effect
  useEffect(() => {
    if (achievements.length > 0) {
      const lastAch = achievements[achievements.length - 1];
      setCurrentAchievement(lastAch);
      const timer = setTimeout(() => setCurrentAchievement(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [achievements]);

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
    setCombo(0);
    setBestCombo(0);
    setTotalMatches(0);
    setMatchStreak(0);
    setAchievements([]);
    setCurrentAchievement(null);
    setScreen("playing");
  }, [sfx]);

  const resetToStart = useCallback(() => {
    clearInterval(timerRef.current);
    setScreen("start");
    setHighScores(getHighScores());
  }, []);

  // Check achievements
  const checkAchievements = useCallback((newScore, newMatches, newCombo) => {
    const newAchievements = [];

    if (newMatches >= 5 && !achievements.includes("first_5")) {
      newAchievements.push("Match 5 pairs!");
    }
    if (newMatches >= 10 && !achievements.includes("first_10")) {
      newAchievements.push("Match 10 pairs!");
    }
    if (newScore >= 100 && !achievements.includes("score_100")) {
      newAchievements.push("Score 100 points!");
    }
    if (newScore >= 200 && !achievements.includes("score_200")) {
      newAchievements.push("Score 200 points!");
    }
    if (newCombo >= 3 && !achievements.includes("combo_3")) {
      newAchievements.push("3x Combo!");
    }
    if (newCombo >= 5 && !achievements.includes("combo_5")) {
      newAchievements.push("5x Combo!");
    }

    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
    }
  }, [achievements]);

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
        const newCombo = combo + 1;
        const comboBonus = Math.floor(newCombo * 5);
        const totalReward = reward + comboBonus;

        sfx("/coin.wav");
        const newMatched = [...matched, c1.uid, c2.uid];
        const newScore = score + totalReward;
        const newMatches = totalMatches + 1;
        const newMatchStreak = matchStreak + 1;

        // Add popup
        const pid = Date.now();
        setPopups((p) => [...p, { id: pid, value: totalReward, type: newCombo > 1 ? "combo" : "coin" }]);
        setTimeout(() => setPopups((p) => p.filter((x) => x.id !== pid)), 1000);

        setTimeout(() => {
          setMatched(newMatched);
          setFlipped([]);
          setScore(newScore);
          setCombo(newCombo);
          setTotalMatches(newMatches);
          setMatchStreak(newMatchStreak);
          if (newCombo > bestCombo) setBestCombo(newCombo);
          setCanFlip(true);

          // Check achievements
          checkAchievements(newScore, newMatches, newCombo);

          // Check win
          const cfg = DIFFICULTIES[difficulty];
          if (newMatched.length === cfg.pairs * 2) {
            clearInterval(timerRef.current);
            // Enhanced bonus calculation
            const timeBonus = cfg.timeLimit ? Math.floor(timeLeft * 3) : 0;
            const moveBonus = cfg.moveLimit
              ? Math.max(0, (cfg.moveLimit - moves) * 10)
              : Math.max(0, (40 - moves) * 5);
            const comboBonus = bestCombo * 10;
            const streakBonus = matchStreak * 15;
            const finalScore = newScore + timeBonus + moveBonus + comboBonus + streakBonus;

            setScore(finalScore);
            const newRec = saveHighScore(difficulty, finalScore);
            setIsNewRecord(newRec);
            sfx("/coin.wav");
            setHighScores(getHighScores());

            // Show bonus popups
            const bonuses = [
              { value: timeBonus, label: "Time Bonus" },
              { value: moveBonus, label: "Move Bonus" },
              { value: comboBonus, label: "Combo Bonus" },
              { value: streakBonus, label: "Streak Bonus" }
            ];
            bonuses.forEach((bonus, i) => {
              if (bonus.value > 0) {
                setTimeout(() => {
                  setPopups((p) => [...p, { id: Date.now() + i, value: bonus.value, type: "bonus" }]);
                  setTimeout(() => setPopups((p) => p.filter((x) => x.id !== Date.now() + i)), 1000);
                }, i * 300);
              }
            });

            setTimeout(() => setScreen("won"), 1000);
          }
        }, 400);
      } else {
        // No match
        setCombo(0);
        setMatchStreak(0);
        setWrongPair(newFlipped);
        sfx("/close.wav");
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
  }, [canFlip, screen, flipped, matched, cards, sfx, score, difficulty, timeLeft, moves, combo, totalMatches, matchStreak, bestCombo, checkAchievements]);

  const togglePause = useCallback(() => {
    sfx("/click.wav");
    setScreen((s) => s === "playing" ? "paused" : "playing");
  }, [sfx]);

  // NOW we can do the conditional return
  if (!game) return null;

  const cfg = DIFFICULTIES[difficulty];
  const totalPairs = cfg?.pairs ?? 6;
  const matchedPairs = matched.length / 2;
  const progress = matchedPairs / totalPairs;

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const timerColor = timeLeft <= 10 && cfg?.timeLimit ? "text-red-400 animate-pulse" : "text-white";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(30,58,138,0.4) 0%, rgba(0,0,0,0.95) 100%)",
          backdropFilter: "blur(20px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.92, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 16, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="relative w-full max-w-3xl max-h-[95vh] rounded-2xl overflow-hidden flex flex-col"
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
              <button
                onClick={() => setMuted((m) => !m)}
                className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"
                aria-label="Toggle sound"
              >
                {muted ? <MdVolumeOff size={16} /> : <MdVolumeUp size={16} />}
              </button>
              {screen === "playing" && (
                <button
                  onClick={togglePause}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"
                  aria-label="Pause"
                >
                  <MdPause size={16} />
                </button>
              )}
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
              {popups.map((p) => <ScorePopup key={p.id} value={p.value} id={p.id} type={p.type} />)}
            </AnimatePresence>

            {/* Achievement popup */}
            <AnimatePresence>
              {currentAchievement && (
                <AchievementUnlock
                  achievement={currentAchievement}
                  onComplete={() => setCurrentAchievement(null)}
                />
              )}
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
                  {/* Stats bar with combo indicator */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 relative">
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
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400"
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

                    {/* Combo indicator */}
                    <ComboIndicator combo={combo} />
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
                          index={i}
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
                    combo={bestCombo}
                    matchStreak={matchStreak}
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