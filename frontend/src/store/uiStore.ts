import { create } from 'zustand';

interface UIState {
  activeRequests: number;
  startRequest: () => void;
  endRequest: () => void;

  // Soft-paywall upgrade modal
  upgradeOpen: boolean;
  upgradeReason: string | null;
  openUpgrade: (reason?: string) => void;
  closeUpgrade: () => void;

  // Editor: block palette expanded/highlighted state. Used by the empty-state
  // CTA to draw attention to where new nodes can be added.
  blockPaletteOpen: boolean;
  setBlockPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeRequests: 0,
  startRequest: () => set((state) => ({ activeRequests: state.activeRequests + 1 })),
  endRequest: () => set((state) => ({ activeRequests: Math.max(0, state.activeRequests - 1) })),

  upgradeOpen: false,
  upgradeReason: null,
  openUpgrade: (reason) => set({ upgradeOpen: true, upgradeReason: reason ?? null }),
  closeUpgrade: () => set({ upgradeOpen: false, upgradeReason: null }),

  blockPaletteOpen: false,
  setBlockPaletteOpen: (open) => set({ blockPaletteOpen: open }),
}));
