import { create } from "zustand";

interface FocusModeState {
  isFullscreen: boolean;
  setFullscreen: (value: boolean) => void;
}

export const useFocusModeStore = create<FocusModeState>((set) => ({
  isFullscreen: false,
  setFullscreen: (value: boolean) => set({ isFullscreen: value }),
}));
