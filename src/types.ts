/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = "en" | "bn";

export type Theme = "light" | "dark";

export type TestState = "idle" | "typing" | "completed";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface SecondProgress {
  second: number;
  wpm: number;
  errors: number;
  accuracy: number;
}

export interface TestStats {
  wpm: number;
  cpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalTypedWords: number;
  duration: number; // usually 60s
  progressTimeline: SecondProgress[];
}
