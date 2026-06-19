/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lesson {
  id: number;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  keys: string[]; // Keys focused in this lesson
  drills: string[]; // Practice strings (composed of these keys)
}

export const TYPING_LESSONS: Lesson[] = [
  {
    id: 1,
    title: "Home Row Keys - Basic a,s,d,f,j,k,l,;",
    description: "Learn the foundational position of touch typing. Place your fingers on the middle keyboard row.",
    difficulty: "Beginner",
    keys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    drills: [
      "a a s s d d f f j j k k l l ; ;",
      "as df jk l;",
      "fads jall",
      "sad lad fall salad",
      "ask flask lads fads jald",
      "asdf jkl; sass fads jald sad"
    ]
  },
  {
    id: 2,
    title: "Left Hand Home Row Drill (a,s,d,f)",
    description: "Focus on building muscle memory for your left hand fingers on the home row.",
    difficulty: "Beginner",
    keys: ["a", "s", "d", "f"],
    drills: [
      "a s d f a s d f",
      "ff dd ss aa a s d f",
      "sad dad fads saff",
      "add fad sads dafs"
    ]
  },
  {
    id: 3,
    title: "Right Hand Home Row Drill (j,k,l,;)",
    description: "Train your right hand fingers to automatically rest on j, k, l, and semicolon.",
    difficulty: "Beginner",
    keys: ["j", "k", "l", ";"],
    drills: [
      "j k l ; j k l ;",
      "jj kk ll ;; j k l ;",
      "jall kahl lall lalk",
      "jak; kjk; l;lk jk;l"
    ]
  },
  {
    id: 4,
    title: "Top Row Left Hand (q,w,e,r,t)",
    description: "Learn to stretch your left hand fingers upwards from the home row safely.",
    difficulty: "Intermediate",
    keys: ["q", "w", "e", "r", "t", "a", "s", "d", "f"],
    drills: [
      "q a w s e d r f t g",
      "red wet raw tea eat art wet",
      "safe rate free dare seat star tread",
      "water waste trade tater arrest raw"
    ]
  },
  {
    id: 5,
    title: "Top Row Right Hand (y,u,i,o,p)",
    description: "Extend your right hand fingers to reach the upper keys precise.",
    difficulty: "Intermediate",
    keys: ["y", "u", "i", "o", "p", "j", "k", "l", ";"],
    drills: [
      "y j u k i l o ; p ;",
      "you up joy pop pip lip ill kill toy",
      "look pink polyp pupil pillow oily",
      "juicy lolly jolly yolk polio pull up"
    ]
  },
  {
    id: 6,
    title: "Bottom Row Left and Right Hands (z,x,c,v,b,n,m)",
    description: "Move downwards with control to standard bottom row keys.",
    difficulty: "Intermediate",
    keys: ["z", "x", "c", "v", "b", "n", "m", "a", "s", "d", "f", "j", "k", "l", ";"],
    drills: [
      "z a x s c d v f b g n h m j",
      "box can man van zip cat cow bat cab",
      "zebra climb civic beach blaze blast candy",
      "vivid voice banana mammal canvas matrix"
    ]
  },
  {
    id: 7,
    title: "Common Full Words & Spaces",
    description: "Combine all three rows with correct space bar operation.",
    difficulty: "Advanced",
    keys: [
      "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", 
      "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", " "
    ],
    drills: [
      "the quick brown fox jumps over the lazy dog",
      "pack my box with five dozen liquor jugs",
      "typing speed is built with regular practice",
      "always keep your fingers at the home row base"
    ]
  }
];

export interface FingerInfo {
  hand: "left" | "right";
  finger: "pinky" | "ring" | "middle" | "index" | "thumb";
  nameEn: string;
  nameBn: string;
}

export const getFingerForKey = (key: string): FingerInfo => {
  const normalized = key.toLowerCase();

  // Left thumb / Right thumb space bar
  if (normalized === " ") {
    return { hand: "right", finger: "thumb", nameEn: "thumb (Spacebar)", nameBn: "বৃদ্ধাঙ্গুলি (Spacebar)" };
  }

  // Left pinky
  if (["a", "q", "z", "1", "`", "~", "!", "caps", "shift", "ctrl"].includes(normalized)) {
    return { hand: "left", finger: "pinky", nameEn: "left little finger", nameBn: "বাম কনিষ্ঠ আঙুল" };
  }
  // Left ring
  if (["s", "w", "x", "2", "@"].includes(normalized)) {
    return { hand: "left", finger: "ring", nameEn: "left ring finger", nameBn: "বাম অনামিকা আঙুল" };
  }
  // Left middle
  if (["d", "e", "c", "3", "#"].includes(normalized)) {
    return { hand: "left", finger: "middle", nameEn: "left middle finger", nameBn: "বাম মধ্যমা আঙুল" };
  }
  // Left index
  if (["f", "r", "v", "g", "t", "b", "4", "5", "$", "%"].includes(normalized)) {
    return { hand: "left", finger: "index", nameEn: "left index finger", nameBn: "বাম তর্জনী আঙুল" };
  }

  // Right index
  if (["j", "u", "m", "h", "y", "n", "6", "7", "^", "&"].includes(normalized)) {
    return { hand: "right", finger: "index", nameEn: "right index finger", nameBn: "ডান তর্জনী আঙুল" };
  }
  // Right middle
  if (["k", "i", ",", "8", "*", "<"].includes(normalized)) {
    return { hand: "right", finger: "middle", nameEn: "right middle finger", nameBn: "ডান মধ্যমা আঙুল" };
  }
  // Right ring
  if (["l", "o", ".", "9", "(", ">"].includes(normalized)) {
    return { hand: "right", finger: "ring", nameEn: "right ring finger", nameBn: "ডান অনামিকা আঙুল" };
  }
  // Right pinky
  if (
    [";", ":", "l", "p", "/", "?", "0", "-", "=", "[", "]", "'", "\"", "enter", "backspace", "\\", "shift", "ctrl", "alt"].includes(normalized) || 
    normalized === ";" || normalized === ":" || normalized === "p" || normalized === "l"
  ) {
    return { hand: "right", finger: "pinky", nameEn: "right little finger", nameBn: "ডান কনিষ্ঠ আঙুল" };
  }

  // Default fallback
  return { hand: "right", finger: "index", nameEn: "index finger", nameBn: "তর্জনী আঙুল" };
};
