import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type RegisterForm = {
  firstName: string
  lastName: string
  userName: string
  email: string
  password: string
  confirmPassword: string
  userType: 'Owner' | 'Renter'
}

type RegisterResponse = {
  message?: string
}

const initialForm: RegisterForm = {
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
  password: '',
  confirmPassword: '',
  userType: 'Renter',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegisterForm>(initialForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setErrorMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      setSuccessMessage('')
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          userName: formData.userName,
          email: formData.email,
          password: formData.password,
          userType: formData.userType,
        }),
      })
      const payload = (await response.json()) as RegisterResponse

      if (!response.ok) {
        setErrorMessage(payload.message ?? 'Registration failed.')
        return
      }

      setSuccessMessage(payload.message ?? 'Registration successful.')
      setFormData(initialForm)
      window.setTimeout(() => navigate('/login'), 800)
    } catch {
      setErrorMessage('Unable to reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Create Account</h1>
        <p style={styles.subtitle}>Join us to start renting and listing items</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formRow}>
          <div style={{ ...styles.formGroup, flex: 1 }}>
            <label style={styles.label}>First Name *</label>
            <input
              type="text"
              name="firstName"
              style={styles.input}
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ ...styles.formGroup, flex: 1, marginLeft: '1rem' }}>
            <label style={styles.label}>Last Name *</label>
            <input
              type="text"
              name="lastName"
              style={styles.input}
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Username *</label>
          <input
            type="text"
            name="userName"
            style={styles.input}
            placeholder="Choose a unique username"
            value={formData.userName}
            onChange={handleChange}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Email *</label>
          <input
            type="email"
            name="email"
            style={styles.input}
            placeholder="your@email.com"
            value={formData.email}
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
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            style={styles.input}
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {!passwordsMatch && formData.confirmPassword.length > 0 && (
            <p style={styles.errorMessage}>Passwords do not match</p>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>I am registering as a... *</label>
          <select
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            style={styles.select}
            required
          >
            <option value="Renter">Renter</option>
            <option value="Owner">Product Owner</option>
          </select>
        </div>

        {errorMessage && <p style={styles.errorMessage}>{errorMessage}</p>}
        {successMessage && <p style={styles.successMessage}>{successMessage}</p>}

        <button
          type="submit"
          style={styles.submitButton}
          disabled={isSubmitting || (!passwordsMatch && formData.confirmPassword.length > 0)}
        >
          {isSubmitting ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <div style={styles.footer}>
        <p>Already have an account? <span style={styles.link} onClick={() => navigate('/login')}>Login here</span></p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '500px',
    margin: '2rem auto',
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
  formRow: {
    display: 'flex',
    gap: '1rem',
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
  select: {
    padding: '0.75rem',
    fontSize: '0.95rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  errorMessage: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  successMessage: {
    color: '#155724',
    backgroundColor: '#d4edda',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  submitButton: {
    padding: '0.75rem',
    backgroundColor: '#28a745',
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
    color: '#28a745',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: '600',
  }
}
