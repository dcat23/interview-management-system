'use client';

import { NavItem, Role, ROLE_NAV } from '@feature/base/server';
import { create } from 'zustand';

interface NavState {
  activeNav: NavItem | null;
  isLoading: boolean;
}

interface NavActions {
  initializeNav: (role: Role) => void;
  setNav: (nav: NavItem) => void;
  toggleLoading: () => void;
  reset: () => void;
}

export type NavStore = NavState & NavActions;

const initialState: NavState = {
  activeNav: null,
  isLoading: false,
};

export const useNavStore = create<NavStore>((set, get) => ({
  ...initialState,

  initializeNav: (role: Role) => {
    const nav = ROLE_NAV[role][0];
    set({
      activeNav: nav,
    });
  },

  setNav: (nav: NavItem) => {
    set({ activeNav: nav });
  },

  toggleLoading: () => {
    set(({ isLoading }) => ({ isLoading: !isLoading }));
  },

  reset: () => {
    set(initialState);
  },
}));
