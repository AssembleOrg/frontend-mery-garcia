import Image from 'next/image';
import { motion } from 'framer-motion';

interface PageBannerProps {
  title?: string;
  imageUrl: string;
  altText: string;
  heightClass?: string;
  imagePosition?: string;
}

export default function PageBanner({
  title,
  imageUrl,
  altText,
  heightClass = 'h-56 md:h-64',
  imagePosition = 'object-center',
}: PageBannerProps) {
  return (
    <div className={`relative w-full ${heightClass} group overflow-hidden`}>
      <Image
        src={imageUrl}
        alt={altText}
        fill
        quality={95}
        priority
        className={`transform object-cover transition-all duration-1000 ease-out group-hover:scale-105 ${imagePosition}`}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#f9bbc4]/20 via-transparent to-[#e8b4c6]/15" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f9bbc4]/10" />

      {/* Animated geometric elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[#f9bbc4]/30 to-transparent blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-gradient-to-tr from-[#e8b4c6]/25 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.25, 0.4, 0.25],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      {title && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative"
          >
            <h1
              className="relative font-sans text-4xl font-bold text-[#f9bbc4] sm:text-5xl md:text-6xl lg:text-7xl"
              style={{
                textShadow: `
                  0 2px 4px rgba(0,0,0,0.8),
                  0 4px 8px rgba(0,0,0,0.6),
                  0 8px 16px rgba(0,0,0,0.4),
                  0 0 40px rgba(249,187,196,0.6),
                  0 0 80px rgba(249,187,196,0.3)
                `,
              }}
            >
              {title}
            </h1>

            {/* Animated underline */}
            <motion.div
              className="mx-auto mt-4 h-1 bg-gradient-to-r from-transparent via-[#f9bbc4] to-transparent"
              initial={{ width: 0 }}
              animate={{ width: '80%' }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            />
          </motion.div>
        </div>
      )}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#f9bbc4] via-[#e8b4c6] to-[#d4a7ca]"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"
        animate={{
          opacity: [0, 1, 0],
          scaleX: [0, 1, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
