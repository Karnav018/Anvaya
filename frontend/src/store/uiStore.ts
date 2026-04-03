import { create } from 'zustand';

interface UIState {
  activeRequests: number;
  startRequest: () => void;
  endRequest: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeRequests: 0,
  startRequest: () => set((state) => ({ activeRequests: state.activeRequests + 1 })),
  endRequest: () => set((state) => ({ activeRequests: Math.max(0, state.activeRequests - 1) })),
}));
