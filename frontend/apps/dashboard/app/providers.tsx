import React, { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import ReactQueryProvider from "../lib/providers/react-query-provider";
import { ThemeProvider } from "../lib/providers/theme-provider";
import { TooltipProvider } from "../components/ui/common/tooltip";


interface Props {
  children: ReactNode;
}

const Providers = ({ children }: Props) => {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ReactQueryProvider>
          <TooltipProvider>
            <Toaster position="bottom-right" />
            {children}
          </TooltipProvider>
        </ReactQueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default Providers;
