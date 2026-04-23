import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/services/api'

interface User {
  id: string
  email: string
  username: string
  nombre_completo: string
  rol: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          const response = await api.post('/auth/login', { email, password })
          localStorage.setItem('token', response.data.token)
          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
          })
        } catch (error) {
          throw error
        }
      },
      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
