import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    console.log('DEBUG CONTEXT - checkAuth iniciado')
    try {
      console.log('DEBUG CONTEXT - Llamando getCurrentUser...')
      const userData = await authService.getCurrentUser()
      console.log('DEBUG CONTEXT - getCurrentUser exitoso:', userData)
      setUser(userData)
    } catch (error) {
      console.log('DEBUG CONTEXT - getCurrentUser falló:', error.message)
      setUser(null)
    } finally {
      setLoading(false)
      console.log('DEBUG CONTEXT - checkAuth terminado')
    }
  }

  const login = async (username, password) => {
    console.log('DEBUG CONTEXT - login iniciado')
    const userData = await authService.login(username, password)
    console.log('DEBUG CONTEXT - login exitoso, userData:', userData)
    setUser(userData)
    console.log('DEBUG CONTEXT - setUser llamado')
    return userData
  }

  const register = async (userData) => {
    console.log('DEBUG CONTEXT - register iniciado')
    const newUser = await authService.register(userData)
    console.log('DEBUG CONTEXT - register exitoso, newUser:', newUser)
    setUser(newUser)
    console.log('DEBUG CONTEXT - setUser llamado')
    return newUser
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
