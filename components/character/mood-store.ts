/**
 * components/character/mood-store.ts
 * Reactive store for the character mood engine and idle escalation.
 */

export type MoodType =
  | "chilling"
  | "curious"
  | "startled"
  | "restless"
  | "excited"
  | "sleepy";

interface MoodState {
  mood: MoodType;
  idleCaption: string | null;
  idleSeconds: number;
  shouldHop: boolean;
}

type Listener = () => void;

let state: MoodState = {
  mood: "chilling",
  idleCaption: null,
  idleSeconds: 0,
  shouldHop: false,
};

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export const moodStore = {
  get state() {
    return state;
  },

  setMood(mood: MoodType) {
    if (state.mood !== mood) {
      state = { ...state, mood };
      notify();
    }
  },

  setIdleState(idleSeconds: number, idleCaption: string | null, shouldHop = false) {
    state = {
      ...state,
      idleSeconds,
      idleCaption,
      shouldHop,
    };
    notify();
  },

  resetHop() {
    if (state.shouldHop) {
      state = { ...state, shouldHop: false };
      notify();
    }
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
