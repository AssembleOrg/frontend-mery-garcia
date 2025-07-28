import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { authService, UserProfile } from '@/services/auth.service';
import { components } from '@/types/backend';
import { toast } from 'sonner';
import { UnidadNegocio } from '@/types/caja';
import { setTokenGetter } from '@/lib/apiClient';

// ✅ Tipos extraídos de components.schemas
type LoginDto = components['schemas']['LoginDto'];
type RegisterDto = components['schemas']['RegisterDto'];

// Storage helper para evitar acceso a localStorage en SSR
const safeJSONStorage = createJSONStorage(() => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  const memoryStore = new Map<string, string>();
  return {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStore.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
  } as Storage;
});

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginDto) => Promise<boolean>;
  register: (userData: RegisterDto) => Promise<boolean>;
  logout: () => void;
  getProfile: () => Promise<void>;
  initializeAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Acciones
        login: async (credentials: LoginDto) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authService.login(credentials);

            set({
              user: {
                ...response.data.user,
                unidadesDisponibles: response.data.user
                  .unidadesDisponibles as UnidadNegocio[],
                fechaIngreso:
                  response.data.user.fechaIngreso || new Date().toISOString(),
                activo: true,
              },
              token: response.data.access_token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            const nombreUsuario = response.data.user.nombre || 'Usuario';
            toast.success(`¡Bienvenida ${nombreUsuario}!`);
            return true;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Error de autenticación';
            set({ isLoading: false, error: errorMessage });
            toast.error(errorMessage);
            return false;
          }
        },

        register: async (userData: RegisterDto) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authService.register(userData);

            set({
              user: {
                ...response.data.user,
                unidadesDisponibles: response.data.user
                  .unidadesDisponibles as UnidadNegocio[],

                fechaIngreso: userData.fechaIngreso || new Date().toISOString(),
                activo: true,
              },
              token: response.data.access_token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            toast.success(
              `¡Usuario ${response.data.user.nombre} registrado exitosamente!`
            );
            return true;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Error en el registro';
            set({ isLoading: false, error: errorMessage });
            toast.error(errorMessage);
            return false;
          }
        },

        getProfile: async () => {
          set({ isLoading: true, error: null });
          try {
            const profile = await authService.getProfile();
            set({ user: profile, isLoading: false });
          } catch (error) {
            console.error('Error obteniendo perfil:', error);

            const errorMessage =
              error instanceof Error ? error.message : 'Error desconocido';

            if (
              errorMessage.includes('500') ||
              errorMessage.includes('401') ||
              errorMessage.includes('403')
            ) {
              // Clear Zustand state instead of calling authService.logout
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
              });
              toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            } else {
              set({
                isLoading: false,
                error: 'Error al obtener perfil de usuario',
              });
              toast.error('Error al obtener perfil de usuario');
            }
          }
        },

        logout: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          toast.info('Sesión cerrada correctamente');
        },

        initializeAuth: () => {
          const state = get();
          
          if (state.token && state.user) {
            try {
              const payload = JSON.parse(atob(state.token.split('.')[1]));
              const now = Date.now() / 1000;

              if (payload.exp && payload.exp < now) {
                // Token expirado, limpiar
                set({
                  user: null,
                  token: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
                return;
              }
            } catch {
              // Token malformado, limpiar
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }

            set({
              isAuthenticated: true,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        storage: safeJSONStorage,
        partialize: (state) => ({
          user: state.user,
          token: state.token,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);

// Set up the token getter for apiClient
setTokenGetter(() => useAuthStore.getState().token);
