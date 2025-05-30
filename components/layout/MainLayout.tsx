// /components/layout/MainLayout.tsx
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="dark:via-gray-850 flex min-h-screen flex-col bg-gradient-to-br from-[#fdf6f7] via-[#fefcff] to-[#fdf0f3] dark:from-gray-900 dark:to-[#2a2225]">
      {/* sidebar? */}
      <div className="flex-grow">{children}</div>
    </div>
  );
}
