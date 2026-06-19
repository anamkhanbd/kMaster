/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Gamepad2, 
  RotateCcw, 
  Play, 
  Pause, 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Settings, 
  Flame, 
  Skull, 
  Heart,
  Target,
  BookOpen,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { sounds } from "../sound";
import AdBanner from "./AdBanner";

interface TypingGameProps {
  theme: "light" | "dark";
  language: "en" | "bn";
  soundEnabled: boolean;
  onExit: () => void;
}

interface FallingItem {
  id: string;
  text: string;
  x: number; // percentage width (5% to 90%)
  y: number; // percentage height (0% to 100%)
  speed: number;
}

type GameType = "letter" | "word";
type GameDifficulty = "easy" | "medium" | "hard";

const ENGLISH_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const BANGLA_LETTERS = "কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়".split("");

const ENGLISH_WORDS = [
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "typing", "speed", 
  "keyboard", "arcades", "gamer", "focus", "swift", "champion", "rhythm", "fingers",
  "master", "stream", "practice", "pixel", "cosmic", "galaxy", "rocket", "comet"
];

const BANGLA_WORDS = [
  "ভাষা", "খবর", "বাংলা", "কম্পিউটার", "কিবোর্ড", "টাইপ", "গতি", "স্বাধীন", "দেশ", 
  "নদী", "সবুজ", "আকাশ", "কুয়াশা", "বাতাস", "বৃষ্টি", "সূর্য", "চন্দ্র", "মাটি", 
  "সোনার", "খেলা", "আনন্দ", "উৎসব", "পাহাড়", "সাগর", "বন্ধু", "হৃদয়"
];

export default function TypingGame({ theme, language, soundEnabled, onExit }: TypingGameProps) {
  // Game state engines
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("medium");
  const [score, setScore] = useState<number>(0);
  const [wrongPresses, setWrongPresses] = useState<number>(0);
  const [fallenEscapes, setFallenEscapes] = useState<number>(0);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [highScore, setHighScore] = useState<number>(0);
  
  // Typed buffer for word game matches
  const [inputBuffer, setInputBuffer] = useState<string>("");

  // Animation frame loop referrers
  const requestRef = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Load high score from local client storage
  useEffect(() => {
    if (selectedGameType) {
      const storageKey = `kfaster_highscore_${selectedGameType}_${language}_${difficulty}`;
      const saved = localStorage.getItem(storageKey);
      setHighScore(saved ? parseInt(saved, 10) : 0);
    }
  }, [selectedGameType, language, difficulty]);

  // Determine game speed multiplier based on difficulty selected
  const getSpeedMultiplier = () => {
    switch (difficulty) {
      case "easy": return 0.25;
      case "medium": return 0.45;
      case "hard": return 0.75;
    }
  };

  // Determine game speed multiplier based on difficulty selected
  const getSpawnInterval = () => {
    switch (difficulty) {
      case "easy": return 2500;
      case "medium": return 1800;
      case "hard": return 1100;
    }
  };

  // Generate random item corresponding to language and game type
  const generateRandomItem = (): FallingItem => {
    let text = "";
    if (selectedGameType === "letter") {
      const charSet = language === "en" ? ENGLISH_LETTERS : BANGLA_LETTERS;
      text = charSet[Math.floor(Math.random() * charSet.length)];
    } else {
      const wordSet = language === "en" ? ENGLISH_WORDS : BANGLA_WORDS;
      text = wordSet[Math.floor(Math.random() * wordSet.length)];
    }

    const randomX = 5 + Math.random() * 80; // keep within 5% to 85% range
    // Base speed plus random variation
    const baseVal = selectedGameType === "letter" ? 1.0 : 0.8;
    const computedSpeed = (baseVal + Math.random() * 0.5) * getSpeedMultiplier();

    return {
      id: Math.random().toString(36).substring(2, 9),
      text,
      x: randomX,
      y: -5, // start slightly above sight
      speed: computedSpeed
    };
  };

  // Physics animation update frame loop
  const updateGameFrame = (time: number) => {
    if (!isPlaying || !selectedGameType) return;

    // Handle initial spawn tracking reference
    if (lastSpawnTimeRef.current === 0) {
      lastSpawnTimeRef.current = time;
    }
    if (lastFrameTimeRef.current === 0) {
      lastFrameTimeRef.current = time;
    }

    const deltaTime = time - lastFrameTimeRef.current;
    lastFrameTimeRef.current = time;

    // Scale physics updates based on delta time (target 60fps where 1 frame = 16.67ms)
    // Avoid extreme leaps if browser tab is set to background or temporarily freezes
    const fpsScale = Math.min(deltaTime / 16.67, 3.0);

    // Spawn falling objects based on timer threshold interval
    const elapsedSinceLastSpawn = time - lastSpawnTimeRef.current;
    if (elapsedSinceLastSpawn > getSpawnInterval()) {
      setItems(prev => [...prev, generateRandomItem()]);
      lastSpawnTimeRef.current = time;
    }

    // Update positions and handle exits at the bottom line
    setItems(prev => {
      let nextEscaped = 0;
      const filtered = prev.map(item => {
        const nextY = item.y + (item.speed * fpsScale);
        if (nextY >= 95) {
          nextEscaped++;
          if (soundEnabled) sounds.playError();
          return null;
        }
        return { ...item, y: nextY };
      }).filter((item): item is FallingItem => item !== null);

      if (nextEscaped > 0) {
        setFallenEscapes(prevEscapes => {
          const totalEscaped = prevEscapes + nextEscaped;
          if (totalEscaped >= 3) {
            handleGameOver();
          }
          return totalEscaped;
        });
      }

      return filtered;
    });

    requestRef.current = requestAnimationFrame(updateGameFrame);
  };

  // Handle Game Over
  const handleGameOver = () => {
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (soundEnabled) sounds.playComplete();

    // Persist new highscore if current score exceeds it
    const storageKey = `kfaster_highscore_${selectedGameType}_${language}_${difficulty}`;
    const currentHigh = localStorage.getItem(storageKey);
    const existingNum = currentHigh ? parseInt(currentHigh, 10) : 0;
    
    if (score > existingNum) {
      localStorage.setItem(storageKey, score.toString());
      setHighScore(score);
    }
  };

  // Keep frame update loop stateful with canvas triggers
  useEffect(() => {
    if (isPlaying && selectedGameType) {
      requestRef.current = requestAnimationFrame(updateGameFrame);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, selectedGameType, difficulty]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || !selectedGameType) return;

      const pressedKey = e.key.toLowerCase();

      if (selectedGameType === "letter") {
        // Look for exact single letter matches in the queue
        // Prioritize matching items closest to the bottom of the screen (largest y coordinate)
        const matchable = [...items].sort((a, b) => b.y - a.y);
        const match = matchable.find(item => item.text.toLowerCase() === pressedKey);

        if (match) {
          // Vanish match and update score
          setItems(prev => prev.filter(item => item.id !== match.id));
          setScore(prev => prev + 1);
          if (soundEnabled) sounds.playKeyPress();
        } else {
          // Incorrect button press count
          setWrongPresses(prev => {
            const nextWrong = prev + 1;
            if (nextWrong >= 3) {
              handleGameOver();
            }
            return nextWrong;
          });
          if (soundEnabled) sounds.playError();
        }
      } else {
        // Word Game logic: Buffer characters or handle whole word comparisons
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const trimmedInput = inputBuffer.trim().toLowerCase();
          
          // Match in items list
          const matchable = [...items].sort((a, b) => b.y - a.y);
          const match = matchable.find(item => item.text.toLowerCase() === trimmedInput);

          if (match) {
            setItems(prev => prev.filter(item => item.id !== match.id));
            setScore(prev => prev + 1);
            if (soundEnabled) sounds.playKeyPress();
          } else {
            setWrongPresses(prev => {
              const nextWrong = prev + 1;
              if (nextWrong >= 3) {
                handleGameOver();
              }
              return nextWrong;
            });
            if (soundEnabled) sounds.playError();
          }

          // Reset buffer
          setInputBuffer("");
        } else if (e.key === "Backspace") {
          setInputBuffer(prev => prev.slice(0, -1));
        } else if (e.key.length === 1) {
          setInputBuffer(prev => prev + e.key);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyPress);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyPress);
    };
  }, [isPlaying, selectedGameType, items, inputBuffer, soundEnabled]);

  const handleStartGame = (type: GameType) => {
    setSelectedGameType(type);
    setScore(0);
    setWrongPresses(0);
    setFallenEscapes(0);
    setItems([]);
    setInputBuffer("");
    setIsPlaying(true);
    lastSpawnTimeRef.current = 0;
    lastFrameTimeRef.current = 0;
  };

  const handleRestart = () => {
    if (selectedGameType) {
      handleStartGame(selectedGameType);
    }
  };

  const handleBackToGameSelection = () => {
    setIsPlaying(false);
    setSelectedGameType(null);
    setItems([]);
    setInputBuffer("");
  };

  // Hearts remaining counter visual indicators
  const remainingLife = 3 - (wrongPresses + fallenEscapes);

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6 select-none">
      
      {/* 1. Header with title and quick actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight font-display flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Gamepad2 className="text-indigo-500 animate-bounce" size={24} />
            {language === "en" ? "Kfaster Typing Arcade Arena" : "কে-ফাস্টার টাইপিং আর্কেড এরিনা"}
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            {language === "en" 
              ? "Vanish falling targets, guard the bottom line safely, and build supreme finger reflexes!"
              : "নিচে নামার আগে অক্ষর বা শব্দ টাইপ করে ধ্বংস করুন এবং আপনার আঙুলের নির্ভুলতা বৃদ্ধি করুন!"}
          </p>
        </div>

        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer max-w-fit"
        >
          <ArrowLeft size={14} />
          {language === "en" ? "Back to Typing Speed Test" : "স্পিড টেস্টে ফিরে যান"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!selectedGameType ? (
          
          /* =========================================================
             A. GAME MODE SELECTION MENU
             ========================================================= */
          <motion.div
            key="game-selection-menu"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-6"
          >
            {/* Main Sponsor Banner inside Arcade view */}
            <AdBanner theme={theme} />

            {/* Difficulty Settings Segment Selector */}
            <div className="p-4 md:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <Settings size={14} className="text-indigo-500" />
                {language === "en" ? "Arcade Ingress Configuration" : "আর্কেড প্রবেশ কনফিগারেশন"}
              </h3>
              
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs font-medium text-slate-400">
                  {language === "en" ? "Game Velocity Multiplier:" : "খেলার গতিবেগ মাল্টিপ্লায়ার:"}
                </span>

                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  {(["easy", "medium", "hard"] as GameDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all active:scale-95 cursor-pointer ${
                        difficulty === diff
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/15"
                          : "text-slate-600 dark:text-slate-450 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                      }`}
                    >
                      {language === "en" ? diff : (diff === "easy" ? "সহজ" : diff === "medium" ? "মধ্যম" : "কঠিন")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Game Options Grid cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Letter falling game */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-lg ${
                theme === "dark" ? "bg-slate-800/40 border-slate-700/50 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300"
              }`}>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500 border border-indigo-500/20">
                    <Target size={24} className="animate-pulse" />
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-150 mb-1.5">
                    {language === "en" ? "Letter Falling Blitz" : "লেটার ফলিং ব্লিৎজ"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed mb-5">
                    {language === "en"
                      ? "Individual letters fall progressively faster. Press the matching key corresponding to the falling targets. Guard your hearts with maximum fast precision!"
                      : "আলাদা আলাদা অক্ষরগুলো পর্যায়ক্রমে নিচে পড়তে থাকবে। পড়ার আগেই সঠিক বাটনে চাপুন। ৩টি ভুল বা ফেইল হলে গেম শেষ হবে!"}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* High score indicator */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-3">
                    <span>🏆 {language === "en" ? "Personal Best:" : "সর্বোত্তম স্কোর:"}</span>
                    <strong className="text-indigo-500">
                      {localStorage.getItem(`kfaster_highscore_letter_${language}_${difficulty}`) || "0"} pts
                    </strong>
                  </div>

                  <button
                    onClick={() => handleStartGame("letter")}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 hover:shadow-lg hover:shadow-indigo-500/15 transition-all cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    {language === "en" ? "Launch Letter Game" : "লেটার গেম চালু করুন"}
                  </button>
                </div>
              </div>

              {/* Card 2: Word falling game */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-lg ${
                theme === "dark" ? "bg-slate-800/40 border-slate-700/50 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300"
              }`}>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 text-violet-500 border border-violet-500/20">
                    <BookOpen size={24} className="animate-bounce" />
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-150 mb-1.5">
                    {language === "en" ? "Word Blast Arena" : "ওয়ার্ড ব্লাস্ট এরিনা"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed mb-5">
                    {language === "en"
                      ? "Entire falling dictionary vocabularies! Type the entire word completely and press SPACEBAR or ENTER to detonate them perfectly!"
                      : "সম্পূর্ণ শব্দ নিচে পড়তে থাকবে। পুরো শব্দটি একদম নিখুঁতভাবে টাইপ করে স্পেসবার অথবা এন্টার বাটনে ক্লিক করে ধ্বংস করুন!"}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* High score indicator */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-3">
                    <span>🏆 {language === "en" ? "Personal Best:" : "সর্বোত্তম স্কোর:"}</span>
                    <strong className="text-violet-500">
                      {localStorage.getItem(`kfaster_highscore_word_${language}_${difficulty}`) || "0"} pts
                    </strong>
                  </div>

                  <button
                    onClick={() => handleStartGame("word")}
                    className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 hover:shadow-lg hover:shadow-violet-500/15 transition-all cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    {language === "en" ? "Launch Word Game" : "ওয়ার্ড গেম চালু করুন"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          
          /* =========================================================
             B. ACTIVE ARCADE PLAY SCREEN (Falling Canvas Simulation)
             ========================================================= */
          <motion.div
            key="game-active-play"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col gap-4"
          >
            {/* Stats tracking panel overlay inside game */}
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 select-none ${
              theme === "dark" ? "bg-slate-800/80 border-slate-700/80" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToGameSelection}
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-450 cursor-pointer"
                >
                  <ChevronLeft size={12} />
                  {language === "en" ? "End Session" : "শেষ করুন"}
                </button>
                
                <span className="text-xs font-mono capitalize px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {selectedGameType} : {difficulty}
                </span>
              </div>

              {/* Heart Lives Bar (3 total lives maximum) */}
              <div className="flex items-center gap-4 font-mono text-sm">
                <div className="flex items-center gap-1 bg-rose-500/5 dark:bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/10">
                  <span className="text-xs text-rose-500 font-bold uppercase tracking-wider mr-1">
                    {language === "en" ? "Shield:" : "লাইভস:"}
                  </span>
                  {[0, 1, 2].map((heartIdx) => (
                    <Heart 
                      key={heartIdx} 
                      size={14} 
                      className={`transition-all duration-300 ${
                        heartIdx < remainingLife 
                          ? "text-rose-500 fill-rose-500 scale-100" 
                          : "text-slate-300 dark:text-slate-700 scale-90"
                      }`} 
                    />
                  ))}
                </div>

                {/* Score Count */}
                <div className="flex items-center gap-1.5 bg-indigo-500/5 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10">
                  <Flame size={14} className="text-amber-500 animate-pulse" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mr-1">
                    {language === "en" ? "Score:" : "স্কোর:"}
                  </span>
                  <strong className="text-indigo-600 dark:text-indigo-400 text-sm font-black">{score}</strong>
                </div>
              </div>
            </div>

            {/* Complete falling canvas core play sandbox */}
            <div 
              ref={gameAreaRef}
              className={`relative w-full h-[360px] md:h-[420px] rounded-2xl border overflow-hidden select-none select-none flex flex-col justify-end ${
                theme === "dark" 
                  ? "bg-slate-950 border-slate-800" 
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              {/* Game state HUD displays */}
              {!remainingLife && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-all">
                  <div className="w-16 h-16 rounded-full bg-rose-600/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-500">
                    <Skull size={32} className="animate-spin" />
                  </div>
                  
                  <h3 className="text-xl font-black text-rose-500 uppercase tracking-widest font-sans mb-1 select-none">
                    {language === "en" ? "GAME OVER" : "গেম ওভার"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mb-6 select-none">
                    {language === "en" 
                      ? `Fantastic efforts! You earned ${score} points.` 
                      : `অসাধারণ খেলেছেন! আপনার মোট স্কোর ${score} পয়েন্ট।`}
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRestart}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      {language === "en" ? "Try Again" : "আবার খেলুন"}
                    </button>
                    <button
                      onClick={handleBackToGameSelection}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-800/10 text-slate-700 dark:text-slate-300 active:scale-95 transition-all cursor-pointer"
                    >
                      {language === "en" ? "Choose Level" : "লেভেল পরিবর্তন"}
                    </button>
                  </div>
                </div>
              )}

              {/* Pause Menu Shield overlay */}
              {!isPlaying && remainingLife > 0 && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm transition-all">
                  <div className="w-14 h-14 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-500">
                    <Pause size={24} />
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-200 tracking-wide mb-5">
                    {language === "en" ? "Game Paused" : "খেলা স্থগিত করা হয়েছে"}
                  </h3>

                  <button
                    onClick={() => {
                      lastFrameTimeRef.current = 0;
                      setIsPlaying(true);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    {language === "en" ? "Resume Battle" : "খেলা চালু করুন"}
                  </button>
                </div>
              )}

              {/* Falling items viewport display */}
              <div className="absolute inset-x-0 top-0 bottom-16 overflow-hidden pointer-events-none">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="absolute select-none will-change-[top]"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                    }}
                  >
                    <div className={`px-3 py-1.5 rounded-xl border shadow-md font-mono font-bold tracking-wide transition-all ${
                      theme === "dark"
                        ? "bg-slate-900 border-indigo-500/40 text-slate-100"
                        : "bg-white border-indigo-500/30 text-slate-800"
                    }`}>
                      {/* Highlight the letters in word game representing active input buffer matches */}
                      {selectedGameType === "word" && inputBuffer && item.text.startsWith(inputBuffer.trim().toLowerCase()) ? (
                        <span>
                          <span className="text-indigo-500 text-sm">{item.text.slice(0, inputBuffer.trim().length)}</span>
                          <span className="text-sm">{item.text.slice(inputBuffer.trim().length)}</span>
                        </span>
                      ) : (
                        <span className="text-sm">{item.text}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Laser Base warning red line at bottom of play fields */}
              <div className="absolute bottom-16 inset-x-0 h-[1.5px] bg-rose-500/40 border-b border-rose-500/20 select-none flex items-center justify-center">
                <span className="px-3 bg-slate-950 text-rose-500/80 font-mono text-[9px] uppercase tracking-widest font-bold">
                  ⚠️ {language === "en" ? "DAMAGE DESTRUCTION WALL" : "প্রতিরক্ষা প্রাচীর দেয়াল"} ⚠️
                </span>
              </div>

              {/* Bottom control row housing the Word game buffer inputs */}
              <div className={`w-full h-16 border-t px-4 flex items-center justify-between select-none ${
                theme === "dark" ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                {/* Active pause toggler tool */}
                <button
                  disabled={!remainingLife}
                  onClick={() => {
                    if (!isPlaying) {
                      lastFrameTimeRef.current = 0;
                    }
                    setIsPlaying(!isPlaying);
                  }}
                  className="p-2 border border-slate-250 dark:border-slate-850 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 cursor-pointer disabled:opacity-20"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>

                {/* Main typing center console input widget */}
                <div className="flex-1 max-w-sm mx-auto">
                  {selectedGameType === "word" ? (
                    <div className="relative">
                      <input
                        disabled={!isPlaying}
                        type="text"
                        value={inputBuffer}
                        onChange={(e) => setInputBuffer(e.target.value)}
                        placeholder={language === "en" ? "Type word followed by SPACEBAR..." : "শব্দ টাইপ করুন..."}
                        className={`w-full text-center py-2 px-4 rounded-xl border text-sm font-mono tracking-wide outline-none transition-all ${
                          theme === "dark"
                            ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-indigo-500"
                            : "bg-white border-slate-300 text-slate-800 focus:border-indigo-500"
                        }`}
                      />
                      {inputBuffer && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono select-none px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                          SPACE
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-400 font-mono tracking-tight animate-pulse py-2">
                       ⚡ {language === "en" ? "Directly press single matching key on physical keyboard" : "কিবোর্ডের বাটনটি সরাসরি প্রেস করুন"}
                    </div>
                  )}
                </div>

                <div className="w-10" />
              </div>
            </div>

            {/* Pro tip summary block explaining game modes */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs select-none ${
              theme === "dark" 
                ? "bg-slate-900/40 border-slate-800 text-slate-400" 
                : "bg-white border-slate-200 text-slate-500"
            }`}>
              <Sparkles size={15} className="mt-0.5 text-indigo-500 flex-shrink-0 animate-spin" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === "en" ? "Type Battle Arcades Game Guide" : "টাইপ ব্যাটল আর্কেডস গেম গাইড"}
                </p>
                <p className="leading-relaxed">
                  {selectedGameType === "letter" ? (
                    language === "en" 
                      ? "Keep your fingers resting perfectly at the home row. Type the exact target falling characters immediately. Pressing the wrong letters or letting letters escape results in lost life points!"
                      : "আপনার হাতগুলো কিবোর্ডের হোম রোতে রেখেই স্ক্রিনের অক্ষরগুলো খেয়াল করুন এবং সঠিক অক্ষর বাটনে চাপুন। ভুল চাপলে বা অক্ষর নিচে ডুবে স্পর্শ করলে লাইভ কাটা যাবে।"
                  ) : (
                    language === "en"
                      ? "Spell the vocabulary words carefully inside the active input widget. Once fully written, execute SPACEBAR or ENTER immediate to destroy them cleanly!"
                      : "টাইপিং ইনপুট বক্সে পুরো শব্দটি টাইপ করুন, তারপর স্পেসবার (Spacebar) বা এন্টার (Enter) বাটন চাপুন। সফলভাবে শব্দটি বিলুপ্ত হবে ও ১ পয়েন্ট পাবেন।"
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
