import { ReactNode } from "react";
import { Navigation } from "./Navigation";

interface CrmLayoutProps {
  children: ReactNode;
}

export function CrmLayout({ children }: CrmLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}