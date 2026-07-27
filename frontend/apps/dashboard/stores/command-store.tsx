'use client';

import { create } from 'zustand';

interface CommandState {
  isOpen: boolean;
}

interface CommandActions {
  setIsOpen: (isOpen: boolean) => void;
  open: () => void;
  reset: () => void;
}

export type CommandStore = CommandState & CommandActions;

const initialState: CommandState = {
  isOpen: false,
};

export const useCommandStore = create<CommandStore>((set, get) => ({
  ...initialState,

  setIsOpen: (isOpen: boolean) => {
    set({ isOpen });
  },

  open: () => {
    set(() => ({ isOpen: true }));
  },

  reset: () => {
    set(initialState);
  },
}));
