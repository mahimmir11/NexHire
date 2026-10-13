import React from 'react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#EAF6F0] flex flex-col text-[#143026] selection:bg-[#2E9D74] selection:text-white">
      <PublicNavbar />
      <main className="flex-1 pt-18 sm:pt-20">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
};
