'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo, Woman } from '../images';

export default function LogoutButton() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      logout();
      setShowLogoutDialog(false);
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  const userInitials = user.nombre
    ? user.nombre
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <>
      {/* Botón flotante principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-4 right-4 z-50"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="group relative flex items-center gap-3 rounded-full border-2 border-[#f9bbc4]/30 bg-gradient-to-r from-white/95 via-[#f9bbc4]/5 to-white/95 px-4 py-2 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-[#f9bbc4]/50 hover:from-[#f9bbc4]/10 hover:via-[#f9bbc4]/15 hover:to-[#f9bbc4]/10 hover:shadow-xl hover:shadow-[#f9bbc4]/20"
              disabled={isLoading}
            >
              <Avatar className="h-8 w-8 border-2 border-[#f9bbc4]/30 transition-all duration-300 group-hover:border-[#f9bbc4]/50">
                <AvatarImage src={Woman.src} alt={user.nombre} />
                <AvatarFallback className="bg-gradient-to-br from-[#f9bbc4] to-[#e8b4c6] text-xs font-semibold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-[#6b4c57] group-hover:text-[#8b5a6b]">
                  {user.nombre}
                </p>
                <p className="text-xs text-[#8b5a6b]/70 group-hover:text-[#8b5a6b]">
                  {user.rol}
                </p>
              </div>
              
              <ChevronDown className="h-4 w-4 text-[#8b5a6b] transition-transform duration-300 group-hover:rotate-180" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl border-2 border-[#f9bbc4]/20 bg-gradient-to-b from-white/95 to-[#f9bbc4]/5 shadow-xl backdrop-blur-sm"
          >
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-[#f9bbc4]/30">
                  <AvatarImage src={Woman.src} alt={user.nombre} />
                  <AvatarFallback className="bg-gradient-to-br from-[#f9bbc4] to-[#e8b4c6] text-sm font-semibold text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-[#6b4c57]">{user.nombre}</p>
                  <p className="text-xs text-[#8b5a6b]/70">{user.email}</p>
                  <p className="text-xs text-[#8b5a6b]/70 capitalize">{user.rol}</p>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-[#f9bbc4]/20" />

            {/* <DropdownMenuItem className="group flex items-center gap-3 px-4 py-3 text-[#6b4c57] hover:bg-[#f9bbc4]/10 hover:text-[#8b5a6b] focus:bg-[#f9bbc4]/10 focus:text-[#8b5a6b]">
              <User className="h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="group flex items-center gap-3 px-4 py-3 text-[#6b4c57] hover:bg-[#f9bbc4]/10 hover:text-[#8b5a6b] focus:bg-[#f9bbc4]/10 focus:text-[#8b5a6b]">
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem> */}

            <DropdownMenuSeparator className="bg-[#f9bbc4]/20" />

            <DropdownMenuItem
              className="group flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Dialog de confirmación */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-[#6b4c57]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-200">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              Cerrar Sesión
            </DialogTitle>
            <DialogDescription className="text-[#8b5a6b]">
              ¿Estás segura de que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder al sistema.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
              className="border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10 hover:border-[#f9bbc4]/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500/20"
            >
              <AnimatePresence mode="wait">
                {isLoggingOut ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Cerrando...
                  </motion.div>
                ) : (
                  <motion.div
                    key="logout"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
