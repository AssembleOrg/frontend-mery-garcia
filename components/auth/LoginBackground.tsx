// /components/auth/LoginBackground.tsx
import Image from 'next/image';

interface LoginBackgroundProps {
  imageUrl?: string;
}

export default function LoginBackground({}: LoginBackgroundProps) {
  const mainImageUrl = '/png/imagen1portal.png';

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      <Image
        src={mainImageUrl}
        alt="Fondo decorativo del portal de Mery García"
        layout="fill"
        objectFit="cover"
        quality={90}
        priority
        className="scale-105 blur-sm"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#f9bbc4]/60 via-[#fcdce3]/40 to-[#ec9cab]/70"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#f9bbc4]/30 via-transparent to-[#fcdce3]/20"></div>

      <div className="absolute top-0 left-0 h-96 w-96 animate-pulse rounded-full bg-[#f9bbc4]/40 opacity-60 blur-3xl"></div>
      <div
        className="absolute right-0 bottom-0 h-96 w-96 animate-pulse rounded-full bg-[#ec9cab]/40 opacity-60 blur-3xl"
        style={{ animationDelay: '1s' }}
      ></div>
      <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-[#fcdce3]/20 opacity-80 blur-3xl"></div>

      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_25%_25%,_#f9bbc4_0%,_transparent_40%)]"></div>
        <div className="absolute right-0 bottom-0 h-full w-full bg-[radial-gradient(circle_at_75%_75%,_#ec9cab_0%,_transparent_40%)]"></div>
        <div className="absolute top-1/2 left-0 h-full w-full bg-[radial-gradient(circle_at_0%_50%,_#fcdce3_0%,_transparent_30%)]"></div>
        <div className="absolute top-1/2 right-0 h-full w-full bg-[radial-gradient(circle_at_100%_50%,_#f9bbc4_0%,_transparent_30%)]"></div>
      </div>

      {/* burbujas */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 h-4 w-4 animate-bounce rounded-full bg-[#f9bbc4] opacity-70 shadow-lg"
          style={{
            animationDelay: '0s',
            animationDuration: '3s',
            filter: 'blur(0.5px)',
          }}
        ></div>
        <div
          className="absolute top-3/4 left-1/3 h-3 w-3 animate-bounce rounded-full bg-[#ec9cab] opacity-60 shadow-md"
          style={{
            animationDelay: '1s',
            animationDuration: '4s',
            filter: 'blur(0.3px)',
          }}
        ></div>
        <div
          className="absolute top-1/2 right-1/4 h-5 w-5 animate-bounce rounded-full bg-[#fcdce3] opacity-65 shadow-lg"
          style={{
            animationDelay: '2s',
            animationDuration: '3.5s',
            filter: 'blur(0.4px)',
          }}
        ></div>
        <div
          className="absolute top-1/6 right-1/3 h-3 w-3 animate-bounce rounded-full bg-[#f9bbc4] opacity-80 shadow-md"
          style={{
            animationDelay: '0.5s',
            animationDuration: '4.5s',
            filter: 'blur(0.2px)',
          }}
        ></div>

        {/* burbujas medianas */}
        <div
          className="absolute top-1/5 left-3/4 h-3 w-3 animate-bounce rounded-full bg-[#ec9cab] opacity-55 shadow-md"
          style={{
            animationDelay: '1.5s',
            animationDuration: '3.8s',
            filter: 'blur(0.3px)',
          }}
        ></div>
        <div
          className="absolute top-2/3 left-1/5 h-4 w-4 animate-bounce rounded-full bg-[#fcdce3] opacity-60 shadow-lg"
          style={{
            animationDelay: '2.5s',
            animationDuration: '4.2s',
            filter: 'blur(0.4px)',
          }}
        ></div>
        <div
          className="absolute top-1/3 right-1/6 h-2 w-2 animate-bounce rounded-full bg-[#f9bbc4] opacity-75 shadow-sm"
          style={{
            animationDelay: '3s',
            animationDuration: '3.2s',
            filter: 'blur(0.1px)',
          }}
        ></div>

        {/* burbujas pequeñas*/}
        <div
          className="absolute top-1/8 left-1/2 h-2 w-2 animate-bounce rounded-full bg-[#ec9cab] opacity-65 shadow-sm"
          style={{
            animationDelay: '0.8s',
            animationDuration: '5s',
            filter: 'blur(0.2px)',
          }}
        ></div>
        <div
          className="absolute top-7/8 right-1/2 h-2 w-2 animate-bounce rounded-full bg-[#fcdce3] opacity-50 shadow-sm"
          style={{
            animationDelay: '1.8s',
            animationDuration: '3.7s',
            filter: 'blur(0.1px)',
          }}
        ></div>
        <div
          className="absolute top-3/8 left-1/8 h-3 w-3 animate-bounce rounded-full bg-[#f9bbc4] opacity-70 shadow-md"
          style={{
            animationDelay: '2.3s',
            animationDuration: '4.1s',
            filter: 'blur(0.3px)',
          }}
        ></div>
        <div
          className="absolute top-5/8 right-1/8 h-2 w-2 animate-bounce rounded-full bg-[#ec9cab] opacity-60 shadow-sm"
          style={{
            animationDelay: '3.2s',
            animationDuration: '3.9s',
            filter: 'blur(0.2px)',
          }}
        ></div>

        {/* Burbujas horizontal */}
        <div
          className="absolute top-1/4 left-0 h-3 w-3 animate-pulse rounded-full bg-[#fcdce3] opacity-40 shadow-md"
          style={{
            animation: 'float-horizontal 8s ease-in-out infinite',
            animationDelay: '0s',
          }}
        ></div>
        <div
          className="absolute top-3/4 right-0 h-4 w-4 animate-pulse rounded-full bg-[#f9bbc4] opacity-45 shadow-lg"
          style={{
            animation: 'float-horizontal-reverse 10s ease-in-out infinite',
            animationDelay: '2s',
          }}
        ></div>
        <div
          className="absolute top-1/2 left-0 h-2 w-2 animate-pulse rounded-full bg-[#ec9cab] opacity-50 shadow-sm"
          style={{
            animation: 'float-horizontal 12s ease-in-out infinite',
            animationDelay: '4s',
          }}
        ></div>
      </div>
      <div className="pointer-events-none absolute inset-2 rounded-lg border-2 border-[#fcdce3]/20"></div>

      {/* A testear */}
      <style jsx>{`
        @keyframes float-horizontal {
          0% {
            transform: translateX(-20px) translateY(0px);
          }
          25% {
            transform: translateX(25vw) translateY(-15px);
          }
          50% {
            transform: translateX(50vw) translateY(10px);
          }
          75% {
            transform: translateX(75vw) translateY(-8px);
          }
          100% {
            transform: translateX(100vw) translateY(5px);
          }
        }

        @keyframes float-horizontal-reverse {
          0% {
            transform: translateX(20px) translateY(0px);
          }
          25% {
            transform: translateX(-25vw) translateY(12px);
          }
          50% {
            transform: translateX(-50vw) translateY(-18px);
          }
          75% {
            transform: translateX(-75vw) translateY(8px);
          }
          100% {
            transform: translateX(-100vw) translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}
