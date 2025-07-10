import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    getProfile,
    initializeAuth,
    clearError,
  } = useAuthStore();

  return {
    // Estado
    user,
    token,
    isAuthenticated,
    isLoading,
    error,

    // Acciones
    login,
    register,
    logout,
    getProfile,
    initializeAuth, // ✅ Exponemos para uso explícito
    clearError,

    // Helpers - Estado derivado calculado en cada render
    hasRole: (role: 'admin' | 'user' | 'encargado') => user?.rol === role,
    hasUnidadNegocio: (unidad: 'tattoo' | 'estilismo' | 'formacion') =>
      user?.unidadesDisponibles?.includes(unidad) ?? false,
    isAdmin: user?.rol === 'admin',
  };
};
