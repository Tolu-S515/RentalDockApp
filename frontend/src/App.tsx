import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import WelcomePage from './WelcomePage'
import AddProductPage from './AddProductPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/addproduct" element={<AddProductPage />} />
    </Routes>
  )
}

export default App
