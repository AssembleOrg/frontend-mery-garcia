//f9bbc4

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#f7faf8]">
      <div className="w-80 rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-[#4a4a4a]">
          Mery-Garcia
        </h1>
        <div className="space-y-4">
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-[#f9bbc4] text-white hover:bg-[#f8abb7]">
              Ir a Login
            </Button>
          </Link>
          <Link href="/dashboard" className="block w-full">
            <Button className="w-full bg-[#f9bbc4] text-white hover:bg-[#f8abb7]">
              Ir a Dashboard (post login)
            </Button>
          </Link>
        </div>
      </div>
      <p className="mt-4 text-sm text-[#4a4a4a]">
        Página de testeo - Mery-Garcia
      </p>
    </div>
  );
}
