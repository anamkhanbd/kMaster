/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Award, 
  HelpCircle,
  Play,
  ArrowLeft,
  Volume2,
  Sparkles
} from "lucide-react";
import { TYPING_LESSONS, Lesson, getFingerForKey, FingerInfo } from "../data/lessonsData";
import { sounds } from "../sound";
import AdBanner from "./AdBanner";

interface TypingLessonsProps {
  theme: "light" | "dark";
  language: "en" | "bn";
  soundEnabled: boolean;
  onExit: () => void;
}

export default function TypingLessons({ theme, language, soundEnabled, onExit }: TypingLessonsProps) {
  // Navigation states
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentDrillIndex, setCurrentDrillIndex] = useState<number>(0);
  
  // Lesson play states
  const [drillText, setDrillText] = useState<string>("");
  const [typedText, setTypedText] = useState<string>("");
  const [errorCount, setErrorCount] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [wrongStreak, setWrongStreak] = useState<boolean>(false);
  const [lastKeyStatus, setLastKeyStatus] = useState<"correct" | "incorrect" | "none">("none");

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Keyboard focus helper
  const containerRef = useRef<HTMLDivElement>(null);

  // Load a drill
  useEffect(() => {
    if (selectedLesson) {
      const drill = selectedLesson.drills[currentDrillIndex] || "";
      setDrillText(drill);
      setTypedText("");
      setErrorCount(0);
      setStartTime(null);
      setElapsedSeconds(0);
      setIsCompleted(false);
      setWrongStreak(false);
      setLastKeyStatus("none");
    }
  }, [selectedLesson, currentDrillIndex]);

  // Handle active lesson timer
  useEffect(() => {
    if (startTime && !isCompleted) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isCompleted]);

  // Keep focus on the interactive panel
  useEffect(() => {
    if (selectedLesson && containerRef.current) {
      containerRef.current.focus();
    }
  }, [selectedLesson, currentDrillIndex]);

  // Current target character to type next
  const targetChar = drillText[typedText.length] || "";
  const targetFinger: FingerInfo = targetChar ? getFingerForKey(targetChar) : {
    hand: "left",
    finger: "thumb",
    nameEn: "Spacebar",
    nameBn: "Spacebar"
  };

  // Keyboard layout map for rendering interactive keyboard
  const keyboardRows = [
    [
      { label: "`", val: "`", width: "w-10" },
      { label: "1", val: "1", width: "w-10" },
      { label: "2", val: "2", width: "w-10" },
      { label: "3", val: "3", width: "w-10" },
      { label: "4", val: "4", width: "w-10" },
      { label: "5", val: "5", width: "w-10" },
      { label: "6", val: "6", width: "w-10" },
      { label: "7", val: "7", width: "w-10" },
      { label: "8", val: "8", width: "w-10" },
      { label: "9", val: "9", width: "w-10" },
      { label: "0", val: "0", width: "w-10" },
      { label: "-", val: "-", width: "w-10" },
      { label: "=", val: "=", width: "w-10" },
      { label: "Backspace", val: "backspace", width: "flex-grow" },
    ],
    [
      { label: "Tab", val: "tab", width: "w-14 text-left px-2" },
      { label: "Q", val: "q", width: "w-10" },
      { label: "W", val: "w", width: "w-10" },
      { label: "E", val: "e", width: "w-10" },
      { label: "R", val: "r", width: "w-10" },
      { label: "T", val: "t", width: "w-10" },
      { label: "Y", val: "y", width: "w-10" },
      { label: "U", val: "u", width: "w-10" },
      { label: "I", val: "i", width: "w-10" },
      { label: "O", val: "o", width: "w-10" },
      { label: "P", val: "p", width: "w-10" },
      { label: "[", val: "[", width: "w-10" },
      { label: "]", val: "]", width: "w-10" },
      { label: "\\", val: "\\", width: "w-10" },
    ],
    [
      { label: "Caps", val: "caps", width: "w-16 text-left px-2" },
      { label: "A", val: "a", width: "w-10" },
      { label: "S", val: "s", width: "w-10" },
      { label: "D", val: "d", width: "w-10" },
      { label: "F", val: "f", width: "w-10" },
      { label: "G", val: "g", width: "w-10" },
      { label: "H", val: "h", width: "w-10" },
      { label: "J", val: "j", width: "w-10" },
      { label: "K", val: "k", width: "w-10" },
      { label: "L", val: "l", width: "w-10" },
      { label: ";", val: ";", width: "w-10" },
      { label: "'", val: "'", width: "w-10" },
      { label: "Enter", val: "enter", width: "flex-grow" },
    ],
    [
      { label: "Shift", val: "shiftName", width: "w-20 text-left px-2" },
      { label: "Z", val: "z", width: "w-10" },
      { label: "X", val: "x", width: "w-10" },
      { label: "C", val: "c", width: "w-10" },
      { label: "V", val: "v", width: "w-10" },
      { label: "B", val: "b", width: "w-10" },
      { label: "N", val: "n", width: "w-10" },
      { label: "M", val: "m", width: "w-10" },
      { label: ",", val: ",", width: "w-10" },
      { label: ".", val: ".", width: "w-10" },
      { label: "/", val: "/", width: "w-10" },
      { label: "Shift", val: "shiftName2", width: "flex-grow" },
    ],
    [
      { label: "Ctrl", val: "ctrl", width: "w-12 text-center" },
      { label: "Alt", val: "alt", width: "w-12 text-center" },
      { label: "Spacebar", val: " ", width: "flex-grow max-w-[420px]" },
      { label: "Alt", val: "alt2", width: "w-12 text-center" },
      { label: "Ctrl", val: "ctrl2", width: "w-12 text-center" },
    ]
  ];

  // Map each finger to positive color accents
  const getFingerStyles = (finger: string, isActive: boolean) => {
    if (!isActive) return "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
    
    switch (finger) {
      case "pinky":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500 ring-2 ring-blue-500/30 scale-[1.05] shadow-md z-10 font-bold";
      case "ring":
        return "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500 ring-2 ring-rose-500/30 scale-[1.05] shadow-md z-10 font-bold";
      case "middle":
        return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.05] shadow-md z-10 font-bold";
      case "index":
        return "bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500 ring-2 ring-violet-500/30 scale-[1.05] shadow-md z-10 font-bold";
      case "thumb":
        return "bg-amber-500/30 text-amber-600 dark:text-amber-400 border-amber-500 ring-2 ring-amber-500/35 scale-[1.03] shadow-md z-10 font-bold";
      default:
        return "bg-blue-600 text-white border-blue-600";
    }
  };

  const getFingerColorHex = (finger: string) => {
    switch (finger) {
      case "pinky": return "#3b82f6"; // Blue
      case "ring": return "#f43f5e"; // Rose
      case "middle": return "#10b981"; // Emerald
      case "index": return "#8b5cf6"; // Violet
      case "thumb": return "#f59e0b"; // Amber
      default: return "#3b82f6";
    }
  };

  // Keyboard event handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isCompleted || !targetChar) return;

    // Direct character comparison
    const key = e.key;

    // Prevent scrolling / default actions for Spacebar
    if (key === " ") {
      e.preventDefault();
    }

    // Ignore modification keys globally
    if (key.length > 1 && key !== "Enter" && key !== "Backspace" && key !== "Spacebar") {
      return;
    }

    // Initialize timer on first keypress
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Compare pressed character with current target
    // Convert target ' ' to 'Spacebar' check if pressed key is ' '
    const isCorrect = key === targetChar;

    if (isCorrect) {
      setTypedText(prev => prev + targetChar);
      setLastKeyStatus("correct");
      setWrongStreak(false);
      sounds.playKeyPress();

      // Check if entire drill is completed
      if (typedText.length + 1 >= drillText.length) {
        setIsCompleted(true);
        sounds.playComplete();
      }
    } else {
      setErrorCount(prev => prev + 1);
      setLastKeyStatus("incorrect");
      setWrongStreak(true);
      sounds.playError();
    }
  };

  // Calculate current drill accuracy
  const totalAttempts = typedText.length + errorCount;
  const currentAccuracy = totalAttempts > 0 ? Math.round((typedText.length / totalAttempts) * 100) : 100;
  
  // Speed metrics
  const minutes = elapsedSeconds / 60;
  const currentCPM = minutes > 0 ? Math.round(typedText.length / minutes) : 0;
  const currentWPM = Math.round(currentCPM / 5);

  const handleResetDrill = () => {
    setTypedText("");
    setErrorCount(0);
    setStartTime(null);
    setElapsedSeconds(0);
    setIsCompleted(false);
    setWrongStreak(false);
    setLastKeyStatus("none");
    if (containerRef.current) containerRef.current.focus();
  };

  const handleNextDrill = () => {
    if (selectedLesson && currentDrillIndex < selectedLesson.drills.length - 1) {
      setCurrentDrillIndex(prev => prev + 1);
    } else {
      // Completed last drill of this lesson! Return to lesson list or selection
      setSelectedLesson(null);
    }
  };

  const handlePrevDrill = () => {
    if (currentDrillIndex > 0) {
      setCurrentDrillIndex(prev => prev - 1);
    }
  };

  // Human descriptive key guide
  const getKeyDescriptor = () => {
    if (!targetChar) return "";
    if (targetChar === " ") return language === "en" ? "Spacebar" : "স্পেসবার (Spacebar)";
    return `'${targetChar}'`;
  };

  // Human finger guide
  const getFingerDescriptor = () => {
    return language === "en" ? targetFinger.nameEn : targetFinger.nameBn;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <AnimatePresence mode="wait">
        {!selectedLesson ? (
          
          /* =========================================================
             1. LESSON SELECTOR SCREEN
             ========================================================= */
          <motion.div
            key="lesson-selector"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-4xl flex flex-col gap-6"
          >
            {/* Header Title section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
              <div>
                <h1 className="text-2xl font-black tracking-tight font-display flex items-center gap-2 text-slate-800 dark:text-slate-150">
                  <BookOpen className="text-blue-500" size={24} />
                  {language === "en" ? "Interactive Keyboard Typing School" : "ইন্টারেক্টিভ কিবোর্ড টাইপিং স্কুল"}
                </h1>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  {language === "en" 
                    ? "Go from a beginner home row user to advanced touch typist step-by-step with zero fatigue."
                    : "ধাপে ধাপে কিবোর্ড টাইপিং শিখুন একদম শুরু থেকে প্রফেশনাল টাইপিস্ট হওয়ার জন্য।"}
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

            {/* Beginner Home Row Callout Promo Card */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/[0.04] to-indigo-500/[0.04] p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm select-none">
              <span className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-300/30">
                    {language === "en" ? "Step 1: Foundational Keys" : "ধাপ ১: মৌলিক কিবোর্ড পজিশন"}
                  </span>
                  <span className="text-yellow-500 flex items-center"><Sparkles size={11} className="animate-pulse" /></span>
                </div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {language === "en" ? "Learn Home Row Keys: [ a,s,d,f,j,k,l,; ]" : "হোম রো কি পজিশন শিখুন: [ a,s,d,f,j,k,l,; ]"}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                  {language === "en"
                    ? "In touch typing, your fingers always rest on the home row keys. Master this, and your muscles will automatically remember where other keys are!"
                    : "টাচ টাইপিং শিখতে হলে আপনার আঙুলগুলোকে সবসময় হোম রোতে রাখতে হবে। মুখস্থ করা ছাড়াই বাকি বাটনগুলোর সঠিক স্পট মনে রাখার সেরা উপায়!"}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedLesson(TYPING_LESSONS[0]);
                  setCurrentDrillIndex(0);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all active:scale-95 cursor-pointer self-start sm:self-center"
              >
                <Play size={14} className="fill-white" />
                {language === "en" ? "Start Lesson 1" : "১ম লেসন শুরু করুন"}
              </button>
            </div>

            {/* List of lessons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TYPING_LESSONS.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className={`p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${
                    theme === "dark" 
                      ? "bg-slate-800/40 border-slate-700/50 hover:border-slate-600" 
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono tracking-wider text-blue-600 dark:text-blue-400 font-bold">
                        {language === "en" ? `LESSON 0${idx + 1}` : `লেসন 0${idx + 1}`}
                      </span>

                      <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${
                        lesson.difficulty === "Beginner" 
                          ? "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20" 
                          : lesson.difficulty === "Intermediate"
                            ? "bg-amber-500/10 text-amber-650 dark:text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-650 dark:text-rose-400 border border-rose-500/20"
                      }`}>
                        {lesson.difficulty}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1.5">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {lesson.description}
                    </p>

                    {/* Focused Keys Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-5">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {language === "en" ? "Practice:" : "অনুশীলন:"}
                      </span>
                      {lesson.keys.map((k) => (
                        <span 
                          key={k} 
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400"
                        >
                          {k === " " ? "Space" : k}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setCurrentDrillIndex(0);
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-750 dark:text-slate-250 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer bg-slate-50/30 dark:bg-slate-900/10"
                  >
                    <span>{language === "en" ? "Enter Training Unit" : "অনুশীলনে প্রবেশ করুন"}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          
          /* =========================================================
             2. ACTIVE LESSON PRACTICE SCREEN (Interactive Sandbox)
             ========================================================= */
          <motion.div
            key="lesson-sandbox"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-4xl flex flex-col gap-5 outline-none"
            tabIndex={0}
            ref={containerRef}
            onKeyDown={handleKeyDown}
          >
            {/* Top Navigation Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-450 transition-all cursor-pointer"
                  title="Back to Lesson Selection"
                >
                  <ChevronLeft size={16} />
                </button>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-blue-500 block">
                    {language === "en" 
                      ? `Lesson ${selectedLesson.id} • Practice Drill ${currentDrillIndex + 1} of ${selectedLesson.drills.length}`
                      : `লেসন ${selectedLesson.id} • অনুশীলন ${currentDrillIndex + 1}/${selectedLesson.drills.length}`
                    }
                  </span>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 max-w-lg line-clamp-1">
                    {selectedLesson.title}
                  </h2>
                </div>
              </div>

              {/* Step navigations */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  disabled={currentDrillIndex === 0}
                  onClick={handlePrevDrill}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 select-none ${
                    currentDrillIndex === 0 
                      ? "opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400" 
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                  }`}
                >
                  <ChevronLeft size={12} />
                  {language === "en" ? "Prev" : "পূর্ববর্তী"}
                </button>

                <button
                  disabled={currentDrillIndex === selectedLesson.drills.length - 1}
                  onClick={handleNextDrill}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 select-none ${
                    currentDrillIndex === selectedLesson.drills.length - 1 
                      ? "opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400" 
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                  }`}
                >
                  {language === "en" ? "Skip/Next" : "পরবর্তী"}
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Ad Banner placement above instruction banner */}
            <AdBanner theme={theme} />

            {/* Instruction Banner like the custom target image */}
            <div className={`p-4 rounded-xl text-center shadow-inner border select-none transition-all duration-300 ${
              wrongStreak
                ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                : "bg-blue-500/[0.03] border-blue-500/15 text-blue-600 dark:text-blue-400"
            }`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`w-2 h-2 rounded-full ${wrongStreak ? "bg-rose-500 animate-ping" : "bg-blue-500 animate-pulse"}`} />
                <h3 className="text-sm md:text-base font-extrabold tracking-wide">
                  {wrongStreak ? (
                    language === "en"
                      ? `Oops! Type ${getKeyDescriptor()} with your ${getFingerDescriptor()}`
                      : `ভুল হয়েছে! অনুগ্রহ করে '${targetChar === " " ? "Spacebar" : targetChar}' বাটনটি ${getFingerDescriptor()} দিয়ে টাইপ করুন`
                  ) : (
                    language === "en"
                      ? `Now try typing ${getKeyDescriptor()} with ${getFingerDescriptor()}`
                      : `এখন আপনার ${getFingerDescriptor()} দিয়ে ${getKeyDescriptor()} টাইপ করুন`
                  )}
                </h3>
              </div>
            </div>

            {/* Core interactive text panel */}
            <div className={`relative p-6 md:p-8 rounded-2xl border transition-all overflow-hidden ${
              theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}>
              {/* Blur focus shield when state is not selected or focused */}
              <div className="absolute right-3 top-3 flex items-center gap-1.5 z-10 text-[10px] font-mono select-none px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {language === "en" ? "ACTIVE DRILL CHAMBER" : "সক্রিয় অনুশীলন চেম্বার"}
              </div>

              {/* Progress Bar indicator */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-100 dark:bg-slate-800">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(typedText.length / drillText.length) * 100}%` }}
                />
              </div>

              {/* Drill Typing Stream block */}
              <div className="text-xl md:text-2xl font-mono tracking-wide leading-relaxed mt-4 mb-6 select-none relative whitespace-pre-wrap break-all pr-12 min-h-[64px]">
                {/* Visual rendering of characters with colors */}
                {drillText.split("").map((char, index) => {
                  let charClass = "text-slate-400 dark:text-slate-600";
                  let isCurrent = index === typedText.length;

                  if (index < typedText.length) {
                    charClass = "text-emerald-500 dark:text-emerald-400 border-b border-emerald-500/20";
                  } else if (isCurrent) {
                    charClass = wrongStreak 
                      ? "text-white bg-rose-500 px-1.5 py-0.5 rounded-md border-b-2 border-rose-600 animate-pulse font-bold" 
                      : "text-blue-600 dark:text-blue-400 bg-blue-500/15 dark:bg-blue-500/10 px-1 py-0.5 rounded-md font-bold " + (theme === "dark" ? "ring-2 ring-blue-500/20" : "ring-2 ring-blue-500/10");
                  }

                  return (
                    <span key={index} className={`font-mono transition-all duration-150 ${charClass}`}>
                      {index === typedText.length && (
                        <span className="pointer-events-none text-blue-500 absolute -translate-y-4 text-[10px] font-bold font-sans tracking-tight uppercase animate-bounce">
                          ▼
                        </span>
                      )}
                      {char}
                    </span>
                  );
                })}
              </div>

              {/* Stats telemetry subline */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-4 text-xs font-mono select-none">
                <div className="flex items-center gap-4 text-slate-400">
                  <span>
                    {language === "en" ? "Accuracy:" : "সঠিকতা:"}{" "}
                    <strong className={`font-bold ${currentAccuracy >= 90 ? "text-emerald-500" : "text-amber-500"}`}>
                      {currentAccuracy}%
                    </strong>
                  </span>
                  <span>
                    {language === "en" ? "WPM:" : "ডব্লিউপিএম:"}{" "}
                    <strong className="text-blue-500 font-bold">{currentWPM}</strong>
                  </span>
                  <span>
                    {language === "en" ? "CPM:" : "সিপিএম:"}{" "}
                    <strong className="text-slate-600 dark:text-slate-300 font-bold">{currentCPM}</strong>
                  </span>
                  <span>
                    {language === "en" ? "Errors:" : "ভুল:"}{" "}
                    <strong className={`font-bold ${errorCount > 0 ? "text-rose-500" : "text-slate-500"}`}>
                      {errorCount}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleResetDrill}
                    className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    {language === "en" ? "Reset Drill" : "পুনরায় শুরু"}
                  </button>
                  <span className="text-slate-400 text-[10px]">
                    ⏱️ {elapsedSeconds}s
                  </span>
                </div>
              </div>
            </div>

            {/* =========================================================
               Interactive Keyboard Placement (Virtual Layout)
               ========================================================= */}
            <div className={`p-4 md:p-5 rounded-2xl border flex flex-col gap-1.5 shadow-sm select-none select-none ${
              theme === "dark" 
                ? "bg-slate-900/50 border-slate-800/80 backdrop-blur-sm" 
                : "bg-slate-50 border-slate-200/85"
            }`}>
              {keyboardRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1.5 w-full">
                  {row.map((keyObj, kIndex) => {
                    // Match key label or value to identify active key
                    const isTargetKey = 
                      targetChar.toLowerCase() === keyObj.val || 
                      (targetChar === " " && keyObj.val === " ");

                    return (
                      <div
                        key={kIndex}
                        className={`h-9 md:h-10 text-xs md:text-sm font-semibold rounded-lg border flex items-center justify-center transition-all duration-200 uppercase font-mono ${
                          keyObj.width
                        } ${getFingerStyles(targetFinger.finger, isTargetKey)}`}
                      >
                        {keyObj.label}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* =========================================================
               VIRUTAL HANDS PLACEMENT (Left Hand & Right Hand Canvas)
               ========================================================= */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4 px-6 border border-slate-200/40 dark:border-slate-800/40 bg-slate-500/[0.02] dark:bg-slate-500/[0.01] rounded-2xl select-none relative overflow-hidden">
              <span className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-slate-550/5 dark:bg-slate-400/5 blur-xl" />
              
              {/* Left Hand Vector Block */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400">
                  {language === "en" ? "Left Hand (বাম হাত)" : "বাম হাত (Left Hand)"}
                </span>
                
                <div className="relative w-[180px] h-[155px] border border-slate-200/20 rounded-xl bg-slate-100/10 dark:bg-slate-900/10 p-2 flex items-end justify-center">
                  <svg className="w-[160px] h-[140px]" viewBox="0 0 160 140">
                    <g transform="translate(160, 0) scale(-1, 1)"> {/* Flip for symmetry if wanted, or direct plotting */}
                      {/* Left Hand Hand-Shape Base */}
                      <path 
                        d="M 25,130 C 25,80 35,80 35,60 C 35,50 40,50 40,110 C 45,90 50,90 50,45 C 50,35 55,35 55,110 C 60,90 65,90 65,35 C 65,25 70,25 70,110 C 75,90 80,90 80,40 C 80,30 85,30 85,110 C 90,110 110,105 130,130 Z" 
                        fill={theme === "dark" ? "#1e293b" : "#e2e8f0"} 
                        stroke={theme === "dark" ? "#475569" : "#cbd5e1"} 
                        strokeWidth="1.5" 
                      />

                      {/* Finger Tips Circles with interactive glows */}
                      {/* Pinky (Left Outer) */}
                      <g className="cursor-help">
                        <circle 
                          cx="27" 
                          cy="92" 
                          r={targetFinger.hand === "left" && targetFinger.finger === "pinky" ? "10" : "6"} 
                          fill={targetFinger.hand === "left" && targetFinger.finger === "pinky" ? getFingerColorHex("pinky") : (theme === "dark" ? "#334155" : "#94a3b8")} 
                          className={targetFinger.hand === "left" && targetFinger.finger === "pinky" ? "animate-pulse" : ""}
                          fillOpacity={targetFinger.hand === "left" && targetFinger.finger === "pinky" ? "0.85" : "0.5"}
                        />
                        {targetFinger.hand === "left" && targetFinger.finger === "pinky" && (
                          <circle cx="27" cy="92" r="16" fill="none" stroke={getFingerColorHex("pinky")} strokeWidth="2" className="animate-ping" strokeDasharray="3 3" />
                        )}
                        <text x="27" y="120" textAnchor="middle" fill="#64748b" className="text-[10px] uppercase font-bold font-sans">P</text>
                      </g>

                      {/* Ring */}
                      <g>
                        <circle 
                          cx="46" 
                          cy="65" 
                          r={targetFinger.hand === "left" && targetFinger.finger === "ring" ? "10" : "6"} 
                          fill={targetFinger.hand === "left" && targetFinger.finger === "ring" ? getFingerColorHex("ring") : (theme === "dark" ? "#334155" : "#94a3b8")} 
                          className={targetFinger.hand === "left" && targetFinger.finger === "ring" ? "animate-pulse" : ""}
                          fillOpacity={targetFinger.hand === "left" && targetFinger.finger === "ring" ? "0.85" : "0.5"}
                        />
                        {targetFinger.hand === "left" && targetFinger.finger === "ring" && (
                          <circle cx="46" cy="65" r="16" fill="none" stroke={getFingerColorHex("ring")} strokeWidth="2" className="animate-ping" strokeDasharray="3 3" />
                        )}
                        <text x="46" y="120" textAnchor="middle" fill="#64748b" className="text-[10px] uppercase font-bold font-sans">R</text>
                      </g>

                      {/* Middle */}
                      <g>
                        <circle 
                          cx="65" 
                          cy="55" 
                          r={targetFinger.hand === "left" && targetFinger.finger === "middle" ? "10" : "6"} 
                          fill={targetFinger.hand === "left" && targetFinger.finger === "middle" ? getFingerColorHex("middle") : (theme === "dark" ? "#334155" : "#94a3b8")} 
                          className={targetFinger.hand === "left" && targetFinger.finger === "middle" ? "animate-pulse" : ""}
                          fillOpacity={targetFinger.hand === "left" && targetFinger.finger === "middle" ? "0.85" : "0.5"}
                        />
                        {targetFinger.hand === "left" && targetFinger.finger === "middle" && (
                          <circle cx="65" cy="55" r="16" fill="none" stroke={getFingerColorHex("middle")} strokeWidth="2" className="animate-ping" strokeDasharray="3 3" />
                        )}
                        <text x="65" y="120" textAnchor="middle" fill="#64748b" className="text-[10px] uppercase font-bold font-sans">M</text>
                      </g>

                      {/* Index */}
                      <g>
                        <circle 
                          cx="84" 
                          cy="60" 
                          r={targetFinger.hand === "left" && targetFinger.finger === "index" ? "10" : "6"} 
                          fill={targetFinger.hand === "left" && targetFinger.finger === "index" ? getFingerColorHex("index") : (theme === "dark" ? "#334155" : "#94a3b8")} 
                          className={targetFinger.hand === "left" && targetFinger.finger === "index" ? "animate-pulse" : ""}
                          fillOpacity={targetFinger.hand === "left" && targetFinger.finger === "index" ? "0.85" : "0.5"}
                        />
                        {targetFinger.hand === "left" && targetFinger.finger === "index" && (
                          <circle cx="84" cy="60" r="16" fill="none" stroke={getFingerColorHex("index")} strokeWidth="2" className="animate-ping" strokeDasharray="3 3" />
                        )}
                        <text x="84" y="120" textAnchor="middle" fill="#64748b" className="text-[10px] uppercase font-bold font-sans">I</text>
                      </g>

                      {/* Thumb */}
                      <g>
                        <circle 
                          cx="110" 
                          cy="110" 
                          r={targetFinger.hand === "left" && targetFinger.finger === "thumb" ? "10" : "6"} 
                          fill={targetFinger.hand === "left" && targetFinger.finger === "thumb" ? getFingerColorHex("thumb") : (theme === "dark" ? "#334155" : "#94a3b8")} 
                          className={targetFinger.hand === "left" && targetFinger.finger === "thumb" ? "animate-pulse" : ""}
                          fillOpacity={targetFinger.hand === "left" && targetFinger.finger === "thumb" ? "0.85" : "0.5"}
                        />
                        {targetFinger.hand === "left" && targetFinger.finger === "thumb" && (
                          <circle cx="110" cy="110" r="16" fill="none" stroke={getFingerColorHex("thumb")} strokeWidth="2" className="animate-ping" strokeDasharray="3 3" />
                        )}
                        <text x="110" y="132" textAnchor="middle" fill="#64748b" className="text-[10px] uppercase font-bold font-sans">T</text>
                      </g>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Space divider block */}
              <div className="hidden sm:block w-[1px] h-24 bg-slate-200 dark:bg-slate-800 self-center" />

              {/* Right Hand Vector Block */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400">
                  {language === "en" ? "Right Hand (ডান হাত)" : "ডান হাত (Right Hand)"}
                </span>

                <div className="relative w-[180px] h-[155px] border border-slate-200/20 rounded-xl bg-slate-100/10 dark:bg-slate-900/10 p-2 flex items-end justify-center">
                  <svg className="w-[160px] h-[140px]" viewBox="0 0 160 140">
                    <g>
                      {/* Right Hand Hand-Shape Base */}
                      <path 
                        d="M 25,130 C 25,80 35,80 35,60 C 35,50 40,50 40,110 C 45,90 50,90 50,45 C 50,35 55,35 55,110 C 60,90 65,90 65,35 C 65,25 70,25 70,110 C 75,90 80,90 80,40 C 80,30 85,30 85,110 C 90,110 110,105 130,130 Z" 
                        fill={theme === "dark" ? "#1e293b" : "#e2e8f0"} 
                        stroke={theme === "dark" ? "#475569" : "#cbd5e1"} 
                        strokeWidth="1.5" 
                      />

                      {/* Finger Tips Circles */}
                      {/* Pinky (Right Outer) */}
                      <g>
                        <circle 
                          cx="27" 
                          cy="92" 
                          r={targetFinger.hand === "right" && targetFinger.finger === "pinky" ? "10" : "6"} 
                          fill={targetFinger.hand === "right" && targetFinger.finger === "pinky" ? getFingerColorHex("pinky") : (theme === "dark" ? "#334155" : "#94a3b8")} 
                          className={targetFinger.hand === "right" && targetFinger.finger === "pinky" ? "animate-pulse" : ""}
                          fillOpacity={targetFinger.hand === "right" && targetFinger.finger === "pinky" ? "0.85" : "0.5"}
                        />
                        {targetFinger.hand === "right" && targetFinger.finger === "pinky" && (
                          <circle cx="27" cy="92" r="16" fill="none" stroke={getFingerColorHex("pinky")} strokeWidth="2" className="animate-ping" strokeDasharray="3 3" />
                        )}
                        <text x="27" y="120" textAnchor="middle" fill="#64748b" className="text-[10px] uppercase font-bold font-sans">P</text>
                      </g>

                      {/* Ring */}
                      <g>
                        <circle 
                          cx="46" 
                          cy="65" 
                          r={targetFinger.hand === "right" && targetFinger.finger === "ring" ? "10" : "6"} 
                          fill={targetFinger.hand === "right" && targetFinger.finger === "ring" ? getFingerColorHex("ring") : (theme === "dark" ? "#334155" : "#94a3b8")} 
                          className={targetFinger.hand === "right" && targetFinger.finger === "ring" ? "animate-pulse" : ""}
                          fillOpacity={targetFinger.hand === "right" && targetFinger.finger === "ring" ? "0.85" : "0.5"}
                        />
                        {targetFinger.hand === "right" && targetFinger.finger === "ring" && (
                          <circle cx="46" cy="65" r="16" fill="none" stroke={getFingerColorHex("ring")} strokeWidth="2" className="animate-ping" strokeDasharray="3 3" />
                        )}
                        <text x="46" y="120" textAnchor="middle" fill="#64748b" className="text-[10px] uppercase font-bold font-sans">R</text>
                      </g>

                      {/* Middle */}
                      <g>
                        <circle 
                          cx="65" 
                          cy="55" 
                          r={targetFinger.hand === "right" && targetFinger.finger === "middle" ? "10" : "6"} 
                          fill={targetFinger.hand === "right" && targetFinger.finger === "middle" ? getFingerColorHex("middle") : (theme === "dark" ? "#334155" : "#94a3b8")} 
                          className={targetFinger.hand === "right" && targetFinger.finger === "middle" ? "animate-pulse" : ""}
                          fillOpacity={targetFinger.hand === "right" && targetFinger.finger === "middle" ? "0.85" : "0.5"}
                        />
                        {targetFinger.hand === "right" && targetFinger.finger === "middle" && (
                          <circle cx="65" cy="55" r="16" fill="none" stroke={getFingerColorHex("middle")} strokeWidth="2" className="animate-ping" strokeDasharray="3 3" />
                        )}
                        <text x="65" y="120" textAnchor="middle" fill="#64748b" className="text-[10px] uppercase font-bold font-sans">M</text>
                      </g>

                      {/* Index */}
                      <g>
                        <circle 
                          cx="84" 
                          cy="60" 
                          r={targetFinger.hand === "right" && targetFinger.finger === "index" ? "10" : "6"} 
                          fill={targetFinger.hand === "right" && targetFinger.finger === "index" ? getFingerColorHex("index") : (theme === "dark" ? "#334155" : "#94a3b8")} 
                          className={targetFinger.hand === "right" && targetFinger.finger === "index" ? "animate-pulse" : ""}
                          fillOpacity={targetFinger.hand === "right" && targetFinger.finger === "index" ? "0.85" : "0.5"}
                        />
                        {targetFinger.hand === "right" && targetFinger.finger === "index" && (
                          <circle cx="84" cy="60" r="16" fill="none" stroke={getFingerColorHex("index")} strokeWidth="2" className="animate-ping" strokeDasharray="3 3" />
                        )}
                        <text x="84" y="120" textAnchor="middle" fill="#64748b" className="text-[10px] uppercase font-bold font-sans">I</text>
                      </g>

                      {/* Thumb */}
                      <g>
                        <circle 
                          cx="110" 
                          cy="110" 
                          r={targetFinger.hand === "right" && targetFinger.finger === "thumb" ? "10" : "6"} 
                          fill={targetFinger.hand === "right" && targetFinger.finger === "thumb" ? getFingerColorHex("thumb") : (theme === "dark" ? "#334155" : "#94a3b8")} 
                          className={targetFinger.hand === "right" && targetFinger.finger === "thumb" ? "animate-pulse" : ""}
                          fillOpacity={targetFinger.hand === "right" && targetFinger.finger === "thumb" ? "0.85" : "0.5"}
                        />
                        {targetFinger.hand === "right" && targetFinger.finger === "thumb" && (
                          <circle cx="110" cy="110" r="16" fill="none" stroke={getFingerColorHex("thumb")} strokeWidth="2" className="animate-ping" strokeDasharray="3 3" />
                        )}
                        <text x="110" y="132" textAnchor="middle" fill="#64748b" className="text-[10px] uppercase font-bold font-sans">T</text>
                      </g>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick tips panel */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs select-none ${
              theme === "dark" 
                ? "bg-slate-900/40 border-slate-800 text-slate-400" 
                : "bg-white border-slate-200 text-slate-500"
            }`}>
              <HelpCircle size={15} className="mt-0.5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === "en" ? "Interactive Hand Guide Instruction" : "ইন্টারেক্টিভ হ্যান্ড গাইড নির্দেশনা"}
                </p>
                <p className="leading-relaxed">
                  {language === "en" 
                    ? "Place your left fingers on A, S, D, F and your right fingers on J, K, L, ;. Do not look down at your real physical keyboard. Try using your muscle memory matching the virtual keyboard finger recommendations represented in color-coded bubbles."
                    : "আপনার বাম হাতের আঙুলগুলো A, S, D, F এবং আপনার ডান হাতের আঙুলগুলো J, K, L, ; বাটনের উপর স্বাভাবিকভাবে রাখুন। নিচের কিবোর্ডে তাকাবেন না। হোম রোর পজিশন মনে রাখতে স্ক্রিনের কালার-কোডেড গাইড ফলো করুন।"}
                </p>
              </div>
            </div>

            {/* =========================================================
               3. DRILL COMPLETED MODAL
               ========================================================= */}
            <AnimatePresence>
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm select-none"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 15 }}
                    className={`w-full max-w-md p-6 rounded-3xl border text-center shadow-xl ${
                      theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <Award size={36} className="text-emerald-500" />
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-150 mb-1">
                      {language === "en" ? "Drill Completed Successfully!" : "অনুশীলন সফলভাবে সমাপ্ত!"}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
                      {language === "en" ? "You are building excellent mechanical finger accuracy!" : "আপনার কিবোর্ড টাচ অ্যাকুরেসি দ্রুত বাড়ছে!"}
                    </p>

                    {/* Stats summary board */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
                          {language === "en" ? "Accuracy" : "সঠিকতা"}
                        </span>
                        <span className="text-lg font-mono font-bold text-emerald-500">{currentAccuracy}%</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
                          {language === "en" ? "Speed" : "গতি"}
                        </span>
                        <span className="text-lg font-mono font-bold text-blue-500">{currentWPM} <span className="text-[9px]">WPM</span></span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
                          {language === "en" ? "Errors" : "ভুলসমূহ"}
                        </span>
                        <span className="text-lg font-mono font-bold text-rose-500">{errorCount}</span>
                      </div>
                    </div>

                    {/* Footer Actions buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleNextDrill}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/15 active:scale-95 transition-all cursor-pointer"
                      >
                        {currentDrillIndex < selectedLesson.drills.length - 1 
                          ? (language === "en" ? "Go to Next Exercise" : "পরবর্তী অনুশীলনে যান")
                          : (language === "en" ? "Complete & Back to Selection" : "সমাপ্ত ও সূচিতে ফিরে যান")
                        }
                      </button>
                      
                      <button
                        onClick={handleResetDrill}
                        className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-all cursor-pointer"
                      >
                        {language === "en" ? "Try Again (Retry Drill)" : "আবার চেষ্টা করুন (রি-ডাউন)"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
