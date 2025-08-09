import React, { useState, useEffect } from "react";
import { MdOutlineClose } from "react-icons/md";
import AnimatedItem from "../AnimatedItem";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const cardData = [
  { id: 1, value: "A", imageUrl: "g1.svg", coinValue: 5 },
  { id: 2, value: "B", imageUrl: "g2.svg", coinValue: 10 },
  { id: 3, value: "C", imageUrl: "g3.svg", coinValue: 15 },
  { id: 4, value: "D", imageUrl: "g4.svg", coinValue: 20 },
  { id: 5, value: "E", imageUrl: "g5.svg", coinValue: 25 },
  { id: 6, value: "F", imageUrl: "g6.svg", coinValue: 30 },
  { id: 7, value: "A", imageUrl: "g1.svg", coinValue: 5 },
  { id: 8, value: "B", imageUrl: "g2.svg", coinValue: 10 },
  { id: 9, value: "C", imageUrl: "g3.svg", coinValue: 15 },
  { id: 10, value: "D", imageUrl: "g4.svg", coinValue: 20 },
  { id: 11, value: "E", imageUrl: "g5.svg", coinValue: 25 },
  { id: 12, value: "F", imageUrl: "g6.svg", coinValue: 30 },
];

const Game = ({ game, setGame }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [coins, setCoins] = useState(0);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [currentCoinValue, setCurrentCoinValue] = useState(0);

  useEffect(() => {
    const shuffledCards = shuffleArray([...cardData, ...cardData]);
    setCards(shuffledCards);
  }, []);

  useEffect(() => {
    if (flipped.length === 2) {
      if (cards[flipped[0]].value === cards[flipped[1]].value) {
        const coinReward = cards[flipped[0]].coinValue;
        setSolved([...solved, cards[flipped[0]].id, cards[flipped[1]].id]);
        setCoins(coins + coinReward);
        setCurrentCoinValue(coinReward);
        setShowCoinAnimation(true);
        const winAudio = new Audio("coin.wav");
        winAudio.play();
        setTimeout(() => setShowCoinAnimation(false), 1500);
      }
      setTimeout(() => setFlipped([]), 1000);
    }
  }, [flipped]);

  const handleCardClick = (index) => {
    if (
      flipped.length < 2 &&
      !flipped.includes(index) &&
      !solved.includes(cards[index].id)
    ) {
      setFlipped([...flipped, index]);
      setMoveCount(moveCount + 1);
      const clickAudio = new Audio("click.wav");
      clickAudio.play();
    }
  };

  const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  };

  const renderCard = (card, index) => {
    const isFlipped = flipped.includes(index) || solved.includes(card.id);

    return (
      <motion.div
        key={index}
        className={`aspect-square flex items-center justify-center cursor-pointer rounded-xl ${
          isFlipped ? "bg-white" : "bg-gradient-to-br from-blue-500 to-blue-600"
        }`}
        onClick={() => handleCardClick(index)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ 
          duration: 0.4,
          ease: [0.2, 0.8, 0.4, 1]
        }}
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px",
          boxShadow: isFlipped 
            ? "0 6px 20px rgba(0, 0, 0, 0.1)" 
            : "0 8px 25px -5px rgba(0, 90, 200, 0.3)",
          WebkitTapHighlightColor: "transparent"
        }}
      >
        <div 
          className="flex items-center justify-center w-full h-full rounded-xl overflow-hidden"
          style={{ 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            backfaceVisibility: "hidden"
          }}
        >
          {isFlipped ? (
            <motion.div
              className="w-full h-full flex items-center justify-center p-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Image
                src={`../../${card.imageUrl}`}
                alt={card.value}
                width={80}
                height={80}
                className="object-contain"
              />
            </motion.div>
          ) : (
            <motion.span 
              className="text-white text-4xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              ?
            </motion.span>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {game && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "radial-gradient(circle at center, rgba(0,50,120,0.2) 0%, rgba(0,0,0,0.7) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)"
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              mass: 0.5
            }}
            className="w-full max-w-4xl h-auto max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(248, 250, 252, 0.95)"
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium text-lg tracking-tight">Memory Match</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-white bg-opacity-20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Image 
                    src="/coin.svg" 
                    width={20} 
                    height={20} 
                    alt="Coins" 
                    className="mr-1.5"
                  />
                  <span className="text-white text-sm font-semibold tracking-wide">{coins}</span>
                </div>
                <motion.button 
                  className="text-white p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
                  onClick={() => {
                    const audio = new Audio("click.wav");
                    audio.play();
                    setGame(false);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <MdOutlineClose className="text-xl" />
                </motion.button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatedItem animationConfig={{ delay: 0.1 }}>
                <div className="flex flex-col w-full h-full">
                  {/* Stats Bar */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                      <span className="text-gray-700 font-medium text-sm">Moves: <span className="font-bold">{moveCount}</span></span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                      <span className="text-gray-700 font-medium text-sm">
                        Matches: <span className="font-bold">{solved.length / 2}</span> / {cardData.length}
                      </span>
                    </div>
                  </div>

                  {/* Coin Animation */}
                  <AnimatePresence>
                    {showCoinAnimation && (
                      <motion.div
                        initial={{ opacity: 0, y: 0, scale: 0.8 }}
                        animate={{ opacity: 1, y: -40, scale: 1.2 }}
                        exit={{ opacity: 0, y: -80, scale: 0.8 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                      >
                        <div className="flex flex-col items-center">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.5, 1],
                              rotate: [0, 360],
                              y: [0, -20, 0]
                            }}
                            transition={{ 
                              duration: 1.2,
                              ease: "easeInOut"
                            }}
                            className="relative"
                          >
                            <Image 
                              src="/coin.svg" 
                              width={48} 
                              height={48} 
                              alt="Coin" 
                              className="drop-shadow-lg"
                            />
                          </motion.div>
                          <motion.span 
                            className="text-yellow-600 font-bold text-lg mt-1 drop-shadow-md"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            +{currentCoinValue}
                          </motion.span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Game Board */}
                  <section className="mt-2 flex-1 flex items-center justify-center">
                    <div className="w-full max-w-3xl">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-white bg-opacity-50 rounded-xl backdrop-blur-sm border border-gray-100">
                        {cards.map((card, index) => renderCard(card, index))}
                      </div>
                    </div>
                  </section>

                  {/* Completion Message */}
                  {solved.length === cardData.length * 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring" }}
                      className="mt-6 p-6 bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 rounded-xl text-center shadow-sm"
                    >
                      <h3 className="text-green-800 font-bold text-xl mb-2">Congratulations! 🎉</h3>
                      <p className="text-green-700 text-lg">You've completed the game with {moveCount} moves!</p>
                      <div className="mt-3 flex items-center justify-center space-x-2">
                        <Image 
                          src="/coin.svg" 
                          width={24} 
                          height={24} 
                          alt="Coins" 
                        />
                        <span className="text-yellow-600 font-bold text-lg">{coins} coins earned</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </AnimatedItem>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Game;