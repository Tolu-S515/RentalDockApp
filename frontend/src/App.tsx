import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import WelcomePage from './WelcomePage'
import AddProductPage from './AddProductPage'
import './App.css'
import { useAuth } from './AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user, isLoading } = useAuth()
  if (isLoading) return <p>Loading...</p>
  return token && user ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/addproduct" element={<ProtectedRoute><AddProductPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
