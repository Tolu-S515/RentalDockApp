import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type AuthUser = {
  id: string
  userName: string
  email: string
  role: string
}

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  authenticate: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('accessToken'),
  )
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error()
        setUser((await response.json()) as AuthUser)
      } catch {
        localStorage.removeItem('accessToken')
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void restoreSession()
  }, [token])

  async function authenticate(newToken: string) {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${newToken}` },
    })

    if (!response.ok) throw new Error('Unable to identify the authenticated user.')

    setUser((await response.json()) as AuthUser)
    localStorage.setItem('accessToken', newToken)
    setToken(newToken)
  }

  function logout() {
    localStorage.removeItem('accessToken')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoading, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
