/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Keyboard, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  RotateCcw, 
  Globe, 
  Award, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Zap,
  Share2,
  Copy,
  Check,
  BookOpen,
  Gamepad2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { englishParagraphs, banglaParagraphs, Paragraph } from "./paragraphs";
import { Language, Theme, TestState, Difficulty, TestStats, SecondProgress } from "./types";
import { sounds } from "./sound";
import PerformanceChart from "./components/PerformanceChart";
import AdBanner from "./components/AdBanner";
import TypingLessons from "./components/TypingLessons";
import TypingGame from "./components/TypingGame";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("kfaster_theme");
    return (saved as Theme) || "dark";
  });

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("kfaster_sound");
    return saved !== "false";
  });

  // Test setup states
  const [mode, setMode] = useState<"test" | "lessons" | "game">("test");
  const [language, setLanguage] = useState<Language>("en");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [testState, setTestState] = useState<TestState>("idle");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  
  // Paragraph matching states
  const [targetParagraph, setTargetParagraph] = useState<string>("");
  const [typedText, setTypedText] = useState<string>("");
  const [loadedIds, setLoadedIds] = useState<number[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(true);

  // Stats timeline state for the chart
  const [progressTimeline, setProgressTimeline] = useState<SecondProgress[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // DOM Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingContainerRef = useRef<HTMLDivElement>(null);

  // Sync state to sound manager
  useEffect(() => {
    sounds.setEnabled(soundEnabled);
    localStorage.setItem("kfaster_sound", String(soundEnabled));
  }, [soundEnabled]);

  // Sync theme to localStorage
  useEffect(() => {
    localStorage.setItem("kfaster_theme", theme);
  }, [theme]);

  // Handle random paragraph loading based on language and difficulty
  const loadNewParagraph = (lang: Language, diff: Difficulty, isReset: boolean = false) => {
    const database = lang === "en" ? englishParagraphs : banglaParagraphs;
    const filtered = database.filter(p => p.difficulty === diff);
    const pool = filtered.length > 0 ? filtered : database;

    let available = pool;
    if (!isReset && loadedIds.length > 0 && loadedIds.length < pool.length) {
      available = pool.filter(p => !loadedIds.includes(p.id));
    }

    const randomParagraph = available[Math.floor(Math.random() * available.length)] || pool[0];
    
    if (isReset) {
      setTargetParagraph(randomParagraph.text);
      setLoadedIds([randomParagraph.id]);
    } else {
      setTargetParagraph(prev => prev + " " + randomParagraph.text);
      setLoadedIds(prev => [...prev, randomParagraph.id]);
    }
  };

  // Initialize first paragraph
  useEffect(() => {
    loadNewParagraph(language, difficulty, true);
    handleReset();
  }, [language, difficulty]);

  // Multi-line typing container auto-scrolling
  useEffect(() => {
    if (typingContainerRef.current) {
      const activeChar = document.getElementById(`char-${typedText.length}`);
      const container = typingContainerRef.current;
      if (activeChar) {
        const offsetTop = activeChar.offsetTop;
        const containerPaddingY = 16;
        
        // Scroll container to center the typing line
        if (offsetTop > container.clientHeight - 60) {
          container.scrollTo({
            top: offsetTop - container.clientHeight / 2 + 12,
            behavior: "smooth"
          });
        } else if (offsetTop < 32) {
          container.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
      }
    }
  }, [typedText.length]);

  // Tracking keystrokes and timing
  const typedTextRef = useRef(typedText);
  const targetParagraphRef = useRef(targetParagraph);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    typedTextRef.current = typedText;
  }, [typedText]);

  useEffect(() => {
    targetParagraphRef.current = targetParagraph;
  }, [targetParagraph]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // 60-second Timer Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (testState === "typing") {
      interval = setInterval(() => {
        const nextTime = timeLeftRef.current - 1;
        const elapsed = 60 - nextTime;

        // Calculate real-time metrics for this specific second to record
        let correctLocal = 0;
        let incorrectLocal = 0;
        const currentTyped = typedTextRef.current;
        const currentTarget = targetParagraphRef.current;

        for (let i = 0; i < currentTyped.length; i++) {
          if (currentTyped[i] === currentTarget[i]) {
            correctLocal++;
          } else {
            incorrectLocal++;
          }
        }

        const elapsedMinutes = elapsed / 60;
        const currentWpm = elapsedMinutes > 0 ? Math.round((correctLocal / 5) / elapsedMinutes) : 0;
        const currentAcc = currentTyped.length === 0 ? 100 : Math.round((correctLocal / currentTyped.length) * 100);

        setProgressTimeline(prev => [
          ...prev,
          {
            second: elapsed,
            wpm: currentWpm,
            errors: incorrectLocal,
            accuracy: currentAcc
          }
        ]);

        if (nextTime <= 0) {
          setTestState("completed");
          sounds.playComplete();
          if (interval) clearInterval(interval);
          setTimeLeft(0);
        } else {
          setTimeLeft(nextTime);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testState]);

  // Key stats computations
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    const typedLng = typedText.length;

    for (let i = 0; i < typedLng; i++) {
      if (typedText[i] === targetParagraph[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }

    const elapsedSeconds = 60 - timeLeft;
    const elapsedMinutes = elapsedSeconds === 0 ? (1 / 60) : (elapsedSeconds / 60);

    const wpm = Math.round((correct / 5) / elapsedMinutes);
    const cpm = Math.round(correct / elapsedMinutes);
    const accuracy = typedLng === 0 ? 100 : Math.round((correct / typedLng) * 100);
    
    // Calculate total typed words based on spaces
    const totalTypedWords = typedText.trim().split(/\s+/).filter(w => w.length > 0).length;

    return {
      wpm,
      cpm,
      accuracy,
      correctChars: correct,
      incorrectChars: incorrect,
      totalTypedWords
    };
  }, [typedText, targetParagraph, timeLeft]);

  // Change input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (testState === "completed") return;

    const oldLen = typedText.length;
    const newLen = value.length;

    if (newLen > oldLen) {
      // Key typed
      const lastCharIndex = oldLen;
      const isCorrect = value[lastCharIndex] === targetParagraph[lastCharIndex];

      if (isCorrect) {
        sounds.playKeyPress();
      } else {
        sounds.playError();
      }

      // Automatically transition idle to active typing
      if (testState === "idle") {
        setTestState("typing");
        setProgressTimeline([]);
      }

      // Auto-load matching text append before reaching the end ( Monkeytype infinite loop )
      if (newLen >= targetParagraph.length - 20) {
        loadNewParagraph(language, difficulty, false);
      }

    } else if (newLen < oldLen) {
      // Backspace or deletion
      sounds.playKeyPress();
    }

    setTypedText(value);
  };

  // Reset test variables
  const handleReset = () => {
    setTypedText("");
    setTimeLeft(60);
    setTestState("idle");
    setProgressTimeline([]);
    
    // Freshly shuffle the paragraph
    const database = language === "en" ? englishParagraphs : banglaParagraphs;
    const filtered = database.filter(p => p.difficulty === difficulty);
    const pool = filtered.length > 0 ? filtered : database;
    const randomParagraph = pool[Math.floor(Math.random() * pool.length)] || pool[0];
    
    setTargetParagraph(randomParagraph.text);
    setLoadedIds([randomParagraph.id]);

    // Re-focus standard text box
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        setIsFocused(true);
      }
    }, 50);
  };

  const handleContainerClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const getShareText = () => {
    const langLabel = language === "en" ? "English" : "বাংলা";
    const appUrl = window.location.origin + window.location.pathname;
    return `⌨️ Kfaster Typing Test Result

🚀 Speed: ${stats.wpm} WPM (Words Per Minute)
📈 Characters: ${stats.cpm} CPM
🎯 Accuracy: ${stats.accuracy}%
⚡ Difficulty: ${difficulty} (${langLabel})
🏆 Rating Tier: ${ratingDetails.tier}
⏱️ Duration: 60 seconds

Software built by UTTAR TECH • Powered by Google AI Studio
Test your speed here: ${appUrl}`;
  };

  const handleCopyResults = () => {
    const text = getShareText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error("Failed to copy results: ", err);
    });
  };

  const handleNativeShare = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Kfaster Typing Test Results",
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.warn("Shared cancelled or failed:", err);
      }
    } else {
      handleCopyResults();
    }
  };

  // Keyboard shortcut listener for Esc
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [language, difficulty]);

  // Performance classification based on standard typing ranges
  const ratingDetails = useMemo(() => {
    const wpm = stats.wpm;
    if (wpm < 30) {
      return {
        tier: "Beginner",
        color: "from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500",
        bg: "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400",
        advice: "Great start! Focus intensely on accuracy first; speed naturally builds up once muscle memory is established. Try typing on Easy difficulty."
      };
    } else if (wpm < 60) {
      return {
        tier: "Intermediate",
        color: "from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500",
        bg: "bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400",
        advice: "Fantastic rhythm! You type faster than the global average. Practice maintaining a steady tempo without looking down at the keyboard."
      };
    } else if (wpm < 90) {
      return {
        tier: "Advanced",
        color: "from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500",
        bg: "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400",
        advice: "Phenomenal! Your typing speeds are highly competitive. Work on scanning ahead to the upcoming words to further minimize pauses."
      };
    } else {
      return {
        tier: "Expert",
        color: "from-purple-500 to-violet-600 dark:from-purple-400 dark:to-violet-500",
        bg: "bg-purple-100 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400",
        advice: "Supreme speed! You are at the top elite tier of expert keyboard practitioners. Push your boundaries on Hard difficulty classes."
      };
    }
  }, [stats.wpm]);

  // Render character string
  const charactersRender = useMemo(() => {
    return targetParagraph.split("").map((char, index) => {
      const isTyped = index < typedText.length;
      const isCurrent = index === typedText.length;
      let textClass = "";

      if (isTyped) {
        if (typedText[index] === char) {
          textClass = "text-emerald-500 dark:text-emerald-400 font-medium";
        } else {
          // Mistypes
          textClass = char === " " 
            ? "text-rose-500 dark:text-rose-400 bg-rose-500/10 border-b-2 border-rose-500 rounded-sm"
            : "text-rose-500 dark:text-rose-400 bg-rose-500/15 font-semibold rounded-sm";
        }
      } else if (isCurrent) {
        textClass = "text-blue-600 dark:text-blue-400 font-semibold relative";
      } else {
        textClass = "text-slate-400/80 dark:text-slate-500/85";
      }

      return (
        <span
          key={`char-${index}`}
          id={`char-${index}`}
          className={`inline transition-all duration-75 text-xl md:text-2xl font-mono tracking-wide ${textClass}`}
        >
          {isCurrent && (
            <span className="absolute -left-[1px] top-[10%] bottom-[10%] w-[2.5px] bg-blue-600 dark:bg-blue-400 caret-blink rounded-full" />
          )}
          {char}
        </span>
      );
    });
  }, [targetParagraph, typedText]);

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
      theme === "dark" 
        ? "bg-[#0F172A] text-slate-100 selection:bg-blue-500/30 selection:text-blue-300" 
        : "bg-[#F8FAFC] text-slate-800 selection:bg-blue-600/20 selection:text-blue-800"
    }`}>
      {/* Header element */}
      <header className={`border-b ${theme === "dark" ? "border-slate-800 bg-[#1E293B]/45" : "border-slate-200 bg-white/70"} backdrop-blur-md sticky top-0 z-40 transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row gap-3.5 justify-between items-center">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-tr ${theme === 'dark' ? 'from-blue-600 to-indigo-500 text-white' : 'from-blue-500 to-indigo-600 text-white'}`}>
              <Keyboard size={22} className="stroke-[2]" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span id="logo-branding" className="text-2xl font-extrabold font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-blue-300 dark:to-indigo-400">
                  Kfaster
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400">
                  v1.2
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Software made by <span className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all">UTTAR TECH</span> &bull; Made by Google AI Studio
              </p>
            </div>
          </div>

          {/* Quick controls bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Mode Switch (Test vs Lessons vs Games) */}
            <div className={`p-1 rounded-lg flex items-center gap-1 ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
              <button
                onClick={() => setMode("test")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold tracking-wide transition-all ${
                  mode === "test"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                }`}
              >
                <Zap size={12} />
                {language === "en" ? "Speed Test" : "স্পিড টেস্ট"}
              </button>
              <button
                onClick={() => setMode("lessons")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold tracking-wide transition-all ${
                  mode === "lessons"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                }`}
              >
                <BookOpen size={12} />
                {language === "en" ? "Lessons" : "লেসনসমূহ"}
              </button>
              <button
                onClick={() => setMode("game")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold tracking-wide transition-all ${
                  mode === "game"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                }`}
              >
                <Gamepad2 size={12} />
                {language === "en" ? "Arcade Game" : "আর্কেড গেম"}
              </button>
            </div>

            {/* Language toggle buttons */}
            <div className={`p-1 rounded-lg flex items-center gap-1 ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
              <button
                onClick={() => setLanguage("en")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  language === "en"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <Globe size={13} />
                English
              </button>
              <button
                onClick={() => setLanguage("bn")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  language === "bn"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <Globe size={13} />
                বাংলা
              </button>
            </div>

            {/* Sound Switch */}
            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              aria-label="Toggle sound"
              className={`p-2 rounded-lg border text-sm transition-all shadow-sm ${
                theme === "dark"
                  ? "bg-slate-800/80 border-slate-700/60 hover:bg-slate-700 text-slate-300"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className={`p-2 rounded-lg border text-sm transition-all shadow-sm ${
                theme === "dark"
                  ? "bg-slate-800/80 border-slate-700/60 hover:bg-slate-700 text-yellow-400"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Manual Reset button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all text-center cursor-pointer"
            >
              <RotateCcw size={13} />
              Reset
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-grow flex flex-col justify-center">
        
        <AnimatePresence mode="wait">
          {mode === "lessons" ? (
            <motion.div
              key="lessons-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full flex justify-center"
            >
              <TypingLessons 
                theme={theme}
                language={language}
                soundEnabled={soundEnabled}
                onExit={() => setMode("test")}
              />
            </motion.div>
          ) : mode === "game" ? (
            <motion.div
              key="game-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full flex justify-center"
            >
              <TypingGame 
                theme={theme}
                language={language}
                soundEnabled={soundEnabled}
                onExit={() => setMode("test")}
              />
            </motion.div>
          ) : testState !== "completed" ? (
            
            // Testing Interface Screen
            <motion.div
              key="typing-interface"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {/* Header and selection tools */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                {/* Paragraph info and difficulty selector */}
                <div className="flex flex-col gap-1">
                  <h1 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
                    <Zap className="text-yellow-500 fill-yellow-500/20" size={18} />
                    {language === "en" ? "Interactive Speed test" : "ইন্টারেক্টিভ টাইপিং স্পিড টেস্ট"}
                  </h1>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {language === "en" 
                      ? "Select your target vocabulary level" 
                      : "আপনার স্তরের জন্য সঠিক শব্দাবলী নির্ধারণ করুন"}
                  </p>
                </div>

                {/* Difficulty tabs dynamic */}
                <div className={`p-1.5 rounded-xl flex items-center gap-1.5 ${theme === "dark" ? "bg-slate-800/80 border border-slate-700/40" : "bg-slate-100 border border-slate-200"}`}>
                  {(["Easy", "Medium", "Hard"] as Difficulty[]).map((diff) => (
                    <button
                      key={diff}
                      disabled={testState === "typing"}
                      onClick={() => setDifficulty(diff)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        difficulty === diff
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                          : testState === "typing"
                            ? "opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {language === "en" ? diff : (diff === "Easy" ? "সহজ" : diff === "Medium" ? "মাঝারি" : "কঠিন")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time stats display rail */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                
                {/* WPM container */}
                <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 transition-all ${
                  stats.wpm > 0 && testState === "typing"
                    ? "border-blue-500/40 bg-blue-500/[0.03] dark:bg-blue-500/[0.01]"
                    : theme === "dark" ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
                }`}>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <TrendingUp size={11} className="text-blue-500" />
                    WPM
                  </span>
                  <span className="text-2xl md:text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
                    {stats.wpm}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Words Per Minute
                  </span>
                </div>

                {/* CPM container */}
                <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 transition-all ${
                  theme === "dark" ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
                }`}>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                    CPM
                  </span>
                  <span className="text-2xl md:text-3xl font-black font-mono tracking-tight">
                    {stats.cpm}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Characters Per Min
                  </span>
                </div>

                {/* Accuracy container */}
                <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 transition-all ${
                  stats.accuracy < 90 && stats.accuracy > 0 && typedText.length > 5
                    ? "border-rose-500/30 bg-rose-500/5"
                    : stats.accuracy >= 90 && typedText.length > 5
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : theme === "dark" ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
                }`}>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <CheckCircle2 size={11} className={stats.accuracy >= 90 ? "text-emerald-500" : "text-amber-500"} />
                    Accuracy
                  </span>
                  <span className={`text-2xl md:text-3xl font-black font-mono tracking-tight ${
                    stats.accuracy >= 90 ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500"
                  }`}>
                    {stats.accuracy}%
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Correct Keys Ratio
                  </span>
                </div>

                {/* Correct keystrokes counter */}
                <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 transition-all ${
                  theme === "dark" ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
                }`}>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 dark:text-emerald-400">
                    Correct Keys
                  </span>
                  <span className="text-2xl md:text-3xl font-black font-mono tracking-tight text-emerald-500 dark:text-emerald-400">
                    {stats.correctChars}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Matching glyphs
                  </span>
                </div>

                {/* Incorrect keystrokes counter */}
                <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 transition-all ${
                  theme === "dark" ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
                }`}>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-rose-500">
                    Mistakes
                  </span>
                  <span className="text-2xl md:text-3xl font-black font-mono tracking-tight text-rose-500">
                    {stats.incorrectChars}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Wrong keycaps typed
                  </span>
                </div>

                {/* Timer Countdown Gauge */}
                <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 transition-all ${
                  timeLeft <= 10 && testState === "typing"
                    ? "border-rose-500 bg-rose-500/10 animate-pulse text-rose-500"
                    : "border-blue-500/50 bg-blue-500/10 dark:bg-blue-950/20"
                }`}>
                  <span className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                    <Clock size={11} className={timeLeft <= 10 ? "text-rose-500" : "text-blue-500"} />
                    Time Remaining
                  </span>
                  <span className="text-2xl md:text-3xl font-black font-mono tracking-tight">
                    {timeLeft}s
                  </span>
                  <span className="text-[10px] font-medium opacity-80">
                    Out of 60 seconds
                  </span>
                </div>

              </div>

              {/* Progress bar container */}
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <motion.div 
                  className={`h-full bg-gradient-to-r ${timeLeft <= 10 ? 'from-rose-500 to-red-600' : 'from-blue-500 to-indigo-600'}`}
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / 60) * 100}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* Ad Banner placement up side of typing panel */}
              <AdBanner theme={theme} />

              {/* Core typing container card */}
              <div 
                ref={typingContainerRef}
                onClick={handleContainerClick}
                className={`relative p-6 md:p-8 rounded-3xl border-2 transition-all min-h-[160px] max-h-[260px] overflow-y-auto cursor-text ${
                  isFocused 
                    ? theme === "dark" 
                      ? "border-blue-500/40 bg-slate-900/60 shadow-lg shadow-blue-500/[0.02]" 
                      : "border-blue-600/30 bg-white shadow-lg shadow-blue-600/[0.02]"
                    : "border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50"
                }`}
              >
                {/* Hidden Textarea integration */}
                <textarea
                  id="target-input-field"
                  ref={textareaRef}
                  value={typedText}
                  onChange={handleInputChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="absolute opacity-0 pointer-events-none left-0 top-0 h-0 w-0 select-none outline-none resize-none"
                />

                {/* Character list representation */}
                <div className="leading-relaxed select-none text-left break-words">
                  {charactersRender}
                </div>

                {/* Focus Overlay Warning */}
                {!isFocused && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 rounded-3xl z-10"
                  >
                    <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-1 cursor-pointer">
                      <AlertCircle size={18} />
                      <span className="text-sm tracking-wide font-display">Test Paused due to lost focus</span>
                    </div>
                    <p className="text-xs text-slate-300 max-w-sm mb-3">
                      Clicks or key presses are ignored when you switch tabs or click away.
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContainerClick();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      Click here to focus and resume
                    </button>
                  </motion.div>
                )}

              </div>

              {/* Helpful utility keyboard reminders and ESC banner */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5 text-xs text-slate-400 dark:text-slate-500 font-medium bg-slate-100/50 dark:bg-slate-800/20 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800/40">
                <div className="flex items-center gap-1.5 px-1 py-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm font-semibold font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    ESC
                  </span>
                  <span>{language === "en" ? "= Restart typing test" : "= পরীক্ষা পুনরায় শুরু করতে চাপুন"}</span>
                </div>
                {language === "bn" && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-[11px]">
                    <Lightbulb size={13} />
                    <span>বাংলা টাইপিংয়ের জন্য অভ্র (Avro) বা সাধারণ ফোনেটিক কিবোর্ড ব্যবহার করুন।</span>
                  </div>
                )}
                <div className="text-[10px] uppercase font-mono tracking-wider opacity-85">
                  {testState === "typing" ? "● Recording active typing telemetry" : "⌨ Idle - press any key to launch clock"}
                </div>
              </div>

            </motion.div>

          ) : (

            // Test Results Completed Output Modal
            <motion.div
              key="test-results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className={`p-6 md:p-8 rounded-3xl border ${
                theme === "dark" 
                  ? "bg-slate-900/80 border-slate-800/70 shadow-2xl shadow-blue-500/[0.03]" 
                  : "bg-white border-slate-200 shadow-2xl"
              }`}
            >
              
              {/* Top Summary Banner */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-5 mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${ratingDetails.bg} flex items-center justify-center`}>
                    <Award size={26} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                      Performance Card
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-400">
                      Calculated on 60 seconds of persistent typing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Rating Tier:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide bg-gradient-to-r text-white shadow-sm ${ratingDetails.color}`}>
                    {ratingDetails.tier}
                  </span>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                
                {/* WPM */}
                <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    WPM
                  </span>
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    {stats.wpm}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Words Per Minute
                  </span>
                </div>

                {/* CPM */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    CPM
                  </span>
                  <span className="text-4xl font-black font-mono">
                    {stats.cpm}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Characters Per Min
                  </span>
                </div>

                {/* Accuracy */}
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Accuracy
                  </span>
                  <span className="text-4xl font-black text-emerald-500 dark:text-emerald-400 font-mono">
                    {stats.accuracy}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Correct key ratio
                  </span>
                </div>

                {/* Total words */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    Total Words
                  </span>
                  <span className="text-4xl font-black font-mono">
                    {stats.totalTypedWords}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Aggregated count
                  </span>
                </div>

              </div>

              {/* Sub-grid of key counts and recommendation advice */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                
                {/* Numeric breakdown counts */}
                <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/5 flex flex-col justify-between gap-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Match Diagnostics
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Correct Strokes:
                      </span>
                      <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400 text-sm">
                        {stats.correctChars}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 font-medium">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        Incorrect Strokes:
                      </span>
                      <span className="font-mono font-bold text-rose-500 text-sm">
                        {stats.incorrectChars}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 font-medium">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        Total Input Keys:
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">
                        {typedText.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400/90 p-3 rounded-xl border border-indigo-100 dark:border-indigo-950/40 leading-relaxed font-medium">
                    🏆 Performance equivalent to a professional <strong>{ratingDetails.tier}</strong> practitioner!
                  </div>
                </div>

                {/* Advice column */}
                <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/5 flex flex-col justify-start gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Professional Recommendation
                  </h3>
                  
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                    <div className="p-2 bg-gradient-to-tr from-yellow-500 to-amber-500 text-white rounded-lg shadow-sm flex items-center justify-center">
                      <Lightbulb size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Recommendation Tip</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 leading-relaxed">
                        {ratingDetails.advice}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mt-1">
                    Studies show typing speed improves significantly by practicing for just 10 minutes a day. Minimize keyboard scanning and try to rely entirely on feeling each keycap with your fingers.
                  </div>
                </div>

              </div>

              {/* Share Results Widget */}
              <div className="p-5 md:p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
                <div className="flex-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Share2 size={16} className="text-indigo-500" />
                    Share Your Typing Achievement
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Show off your typing prowess of <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{stats.wpm} WPM</strong> with <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{stats.accuracy}%</strong> accuracy on your favorite platforms!
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* System Share (Native API If Available) */}
                  {typeof navigator !== "undefined" && navigator.share && (
                    <button
                      onClick={handleNativeShare}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Share2 size={14} />
                      Share to Apps
                    </button>
                  )}

                  {/* Copy Link/Score */}
                  <button
                    onClick={handleCopyResults}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                      copied 
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400" 
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copied ? "Copied Results!" : "Copy Full Report"}
                  </button>

                  {/* Twitter Share */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1DA1F2] hover:bg-[#1a91da] text-white active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <span className="font-extrabold text-[11px] font-mono">X</span>
                    <span>Tweet</span>
                  </a>

                  {/* WhatsApp Share */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getShareText())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <span className="font-bold text-[11px]">WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Graphical representation telemetry chart */}
              <div className="p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/5 mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-indigo-500" />
                  Speed Progression (Second-by-Second Telemetry)
                </h3>
                <div className="h-44 w-full">
                  <PerformanceChart data={progressTimeline} theme={theme} />
                </div>
              </div>

              {/* Call to action reset/try options */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end items-center border-t border-slate-200 dark:border-slate-800 pt-5 mt-4">
                <button
                  onClick={() => {
                    const nextLang = language === "en" ? "bn" : "en";
                    setLanguage(nextLang);
                    handleReset();
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Globe size={14} />
                  {language === "en" ? "Switch to বাংলা Test" : "Switch to English Test"}
                </button>

                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/10 hover:shadow-blue-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Restart New Practice (Esc)
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer Element */}
      <footer className={`border-t text-xs py-4 text-center select-none font-medium ${
        theme === "dark" ? "border-slate-800 bg-[#0A0F1D] text-slate-500" : "border-slate-200 bg-slate-100 text-slate-400"
      }`}>
        <p className="tracking-wide">
          <span className="font-bold text-slate-400 dark:text-slate-400">Kfaster</span> &copy; 2026 - Fast Keyboard Typing Test. Software made by <span className="font-bold text-blue-600 dark:text-blue-400 hover:underline">UTTAR TECH</span> &bull; Powered by Google AI Studio.
        </p>
      </footer>
    </div>
  );
}
