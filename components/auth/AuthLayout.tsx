// /components/layout/AuthLayout.tsx
import { ReactNode } from 'react';
import LoginBackground from '@/components/auth/LoginBackground';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <LoginBackground />
      <main className="z-10">{children}</main>
    </div>
  );
}
