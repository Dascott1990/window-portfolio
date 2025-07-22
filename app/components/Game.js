import React, { useState, useEffect } from "react";
import { MdOutlineClose } from "react-icons/md";
import AnimatedItem from "../components/AnimatedItem";
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
        className={`basis-2/12 flex items-center justify-center w-[100px] h-[100px] text-center font-medium text-3xl cursor-pointer rounded-sm border border-gray-300 ${
          isFlipped ? "bg-white" : "bg-blue-600 hover:bg-blue-500"
        }`}
        onClick={() => handleCardClick(index)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          transformStyle: "preserve-3d"
        }}
      >
        <div className="flex items-center justify-center w-full h-full" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          {isFlipped ? (
            <Image
              src={`../../${card.imageUrl}`}
              alt={card.value}
              width={80}
              height={80}
              className="object-contain"
            />
          ) : (
            <span className="text-white">?</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-100 w-[900px] h-auto rounded-sm shadow-xl border border-gray-300 overflow-hidden"
            style={{
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Windows Title Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-white font-medium text-sm">Memory Match Game</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-blue-700 px-2 py-1 rounded-sm">
                  <Image 
                    src="/coin.svg" 
                    width={16} 
                    height={16} 
                    alt="Coins" 
                    className="mr-1"
                  />
                  <span className="text-white text-sm font-medium">{coins}</span>
                </div>
                <button 
                  className="text-white p-1 hover:bg-blue-700 transition-colors duration-150"
                  onClick={() => {
                    const audio = new Audio("click.wav");
                    audio.play();
                    setGame(false);
                  }}
                >
                  <MdOutlineClose className="text-lg" />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="flex flex-col items-start justify-start p-4 bg-gray-100">
              <AnimatedItem animationConfig={{ delay: 0.1 }}>
                <div className="flex flex-col w-full">
                  <div className="flex justify-between items-center mb-4">
                    <div className="bg-white px-3 py-1 rounded-sm border border-gray-300">
                      <span className="text-gray-800 font-medium">Moves: {moveCount}</span>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-sm border border-gray-300">
                      <span className="text-gray-800 font-medium">
                        Matches: {solved.length / 2} / {cardData.length}
                      </span>
                    </div>
                  </div>

                  {/* Coin Animation */}
                  <AnimatePresence>
                    {showCoinAnimation && (
                      <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: -20 }}
                        exit={{ opacity: 0, y: -40 }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
                      >
                        <div className="flex flex-col items-center">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.5, 1],
                              rotate: [0, 360]
                            }}
                            transition={{ duration: 1 }}
                          >
                            <Image 
                              src="/coin.svg" 
                              width={40} 
                              height={40} 
                              alt="Coin" 
                            />
                          </motion.div>
                          <span className="text-yellow-600 font-bold mt-1">+{currentCoinValue}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <section className="mt-2">
                    <div className="flex justify-center items-center">
                      <div className="memory-match-game">
                        <div className="grid grid-cols-4 gap-3 p-4 bg-white rounded-sm border border-gray-300">
                          {cards.map((card, index) => renderCard(card, index))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Completion Message */}
                  {solved.length === cardData.length * 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 p-4 bg-green-100 border border-green-300 rounded-sm text-center"
                    >
                      <h3 className="text-green-800 font-bold text-lg">Congratulations!</h3>
                      <p className="text-green-700">You've earned {coins} coins!</p>
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