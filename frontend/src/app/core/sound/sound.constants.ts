export const MUTED_STORAGE_KEY = 'quizverse.muted';

// The game never shouts: every sound plays at one of these quiet volumes. Square waves sound
// sharper than sine and triangle waves, so they mostly use the lower ones.
export const FULL_VOLUME = 0.07;
export const SOFT_VOLUME = 0.05;
export const FAINT_VOLUME = 0.03;
// An exponential fade cannot reach 0, so every sound fades to this instead.
export const SILENT_VOLUME = 0.0001;

// Seconds from one note of a jingle to the next.
export const NOTE_GAP_SECONDS = 0.13;

export const CORRECT_NOTES = [660, 880];
export const WRONG_NOTES = [330, 247];
export const COIN_NOTES = [988, 1319];
export const LEVEL_UP_NOTES = [523, 659, 784, 1047];
export const CHEST_NOTES = [784, 988, 1175, 1568, 1976];
export const POWER_UP_NOTES = [1047, 1319, 1568];
// Someone else answered the party round first.
export const ROUND_LOST_NOTES = [392, 330];
export const ALMOST_NOTES = [523, 494];

export const COUNTDOWN_BEEP = { frequency: 523, seconds: 0.09 };
export const GO = { notes: [784, 1047], gapSeconds: 0.09 };
// The clock of the last seconds ticks higher when only a few are left.
export const TICK = { frequency: 1000, urgentFrequency: 1250, seconds: 0.045 };
export const TIME_UP = { frequencies: [330, 220], seconds: 0.25 };
export const ANSWER_CLICK = { frequency: 700, seconds: 0.04 };
export const OTHER_ANSWERED = { frequency: 1500, seconds: 0.03 };
// Three quick notes up, then the top note rings a little longer.
export const VICTORY = {
  notes: [659, 784, 1047],
  gapSeconds: 0.11,
  lastNote: 1319,
  lastSeconds: 0.4,
};
// One plink for each of the three stars, a step higher every time.
export const STAR = { notes: [1568, 1760, 2093], seconds: 0.07 };
// Two notes that clash, rung together, sound like metal.
export const SHIELD_CLANG = { notes: [1397, 1976], seconds: 0.15 };

// The sabotages that land on me. A wobble is how many times a second the volume swings.
export const INK_SPLAT = { frequency: 1500, seconds: 0.18 };
export const FREEZE_SHIMMER = { frequencies: [1500, 3000], seconds: 0.3, wobbles: 25 };
export const SCRAMBLE_BLIPS = { notes: [880, 1175, 988, 1319], gapSeconds: 0.05 };
export const FOG_WHOOSH = { frequency: 1200, seconds: 0.4 };
export const QUAKE_RUMBLE = { frequencies: [70], seconds: 0.5, wobbles: 12 };
export const MIRROR_BOING = { frequencies: [400, 900, 400], seconds: 0.3 };
