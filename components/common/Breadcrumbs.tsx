import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      aria-label="Breadcrumb"
      className="relative border-b border-[#f9bbc4]/20 bg-gradient-to-r from-white/90 via-[#f9bbc4]/5 to-white/90 px-4 py-4 shadow-sm backdrop-blur-md sm:px-6 lg:px-8 dark:border-[#f9bbc4]/30 dark:from-gray-800/90 dark:via-[#f9bbc4]/5 dark:to-gray-800/90"
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(249,187,196,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(232,180,198,0.1),transparent_50%)]" />
      </div>

      <ol className="relative flex items-center space-x-2 text-sm md:space-x-3">
        {items.map((item, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center"
          >
            {index === 0 && (
              <Home className="mr-2 h-4 w-4 flex-shrink-0 text-[#f9bbc4]" />
            )}
            {index > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
              >
                <ChevronRight
                  className="mx-2 h-4 w-4 flex-shrink-0 text-[#e8b4c6] dark:text-[#f9bbc4]/70"
                  aria-hidden="true"
                />
              </motion.div>
            )}

            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="group relative font-medium text-gray-600 transition-all duration-200 hover:text-[#f9bbc4] dark:text-gray-300 dark:hover:text-[#f9bbc4]"
              >
                <span className="relative z-10">{item.label}</span>
                <motion.div
                  className="absolute inset-x-0 -bottom-1 h-0.5 origin-left bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6]"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            ) : (
              <motion.span
                className="relative font-semibold text-[#f9bbc4] dark:text-[#f9bbc4]"
                aria-current={index === items.length - 1 ? 'page' : undefined}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <span className="relative z-10">{item.label}</span>
                {index === items.length - 1 && (
                  <motion.div
                    className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                )}
              </motion.span>
            )}
          </motion.li>
        ))}
      </ol>

      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-[#f9bbc4]/50 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </motion.nav>
  );
}
