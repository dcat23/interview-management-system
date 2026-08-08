'use client';

import { DASHBOARD, NavItem } from '@feature/base/server';
import { createContext, useContext, useState } from 'react';

type Nav = NavItem;

type NavContextProviderProps = {
  children: React.ReactNode;
};

type NavContextType = {
  nav: Nav;
  setNav: (nav: Nav) => void;
};

const NavContext = createContext<NavContextType | null>(null);

export default function NavContextProvider({
  children,
}: NavContextProviderProps) {
  const [nav, setNav] = useState<Nav>(DASHBOARD);

  return (
    <NavContext.Provider
      value={{
        nav,
        setNav,
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const context = useContext(NavContext);

  if (context === null) {
    throw new Error('useNav must be used within a NavContextProvider');
  }

  return context;
}
