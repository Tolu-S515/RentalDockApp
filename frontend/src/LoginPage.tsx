import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

type LoginResponse = {
  message?: string
  token?: string
  userId?: string
  userName?: string
  email?: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { authenticate } = useAuth()
  const [formData, setFormData] = useState({ identifier: '', password: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!formData.identifier || !formData.password) {
      setErrorMessage('Please enter both your username/email and password.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const payload = (await response.json()) as LoginResponse

      if (!response.ok) {
        setErrorMessage(payload.message ?? 'Login failed.')
        return
      }

      if (!payload.token) {
        setErrorMessage('The server did not return an access token.')
        return
      }

      await authenticate(payload.token)
      navigate('/welcome')
    } catch {
      setErrorMessage('Unable to reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to your account to get started</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Username or Email *</label>
          <input
            type="text"
            name="identifier"
            style={styles.input}
            placeholder="Enter your username or email"
            value={formData.identifier}
            onChange={handleChange}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Password *</label>
          <input
            type="password"
            name="password"
            style={styles.input}
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {errorMessage && <p style={styles.errorMessage}>{errorMessage}</p>}

        <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div style={styles.footer}>
        <p>Don't have an account? <span style={styles.link} onClick={() => navigate('/register')}>Register here</span></p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '4rem auto',
    padding: '2rem',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  subtitle: {
    color: '#666',
    fontSize: '0.95rem',
    marginTop: '0.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    fontWeight: '600',
    marginBottom: '0.5rem',
    fontSize: '0.95rem',
    color: '#333',
  },
  input: {
    padding: '0.75rem',
    fontSize: '0.95rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  errorMessage: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  submitButton: {
    padding: '0.75rem',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '0.5rem',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '1.5rem',
    fontSize: '0.9rem',
    color: '#666',
  },
  link: {
    color: '#0066cc',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: '600',
  }
}
