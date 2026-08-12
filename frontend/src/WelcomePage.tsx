import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type ProductCard = {
  id: string
  name: string
  categoryName: string
  ownerName: string
  price: number
  pricingPeriod: string
  imageUrl?: string
}

export default function WelcomePage() {
  const username = localStorage.getItem('loggedInUserName') || 'User'
  const navigate = useNavigate()
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [category, setCategory] = useState({ name: '', description: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<ProductCard[]>([])
  const [productsError, setProductsError] = useState('')
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/products')
        if (!response.ok) throw new Error()
        setProducts((await response.json()) as ProductCard[])
      } catch {
        setProductsError('Unable to load products.')
      } finally {
        setIsLoadingProducts(false)
      }
    }

    void loadProducts()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string }
        setErrorMessage(payload.message ?? 'Unable to create category.')
        return
      }

      setSuccessMessage('Category created successfully!')
      setCategory({ name: '', description: '' })
      window.setTimeout(() => setShowCategoryForm(false), 1000)
    } catch {
      setErrorMessage('Unable to reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Welcome, {username}!</h1>
        <p style={styles.subtitle}>Manage your rental business</p>
      </div>

      <div style={styles.actionButtons}>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => navigate('/addproduct')}
        >
          ➕ Add Product
        </button>
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => {
            setShowCategoryForm((current) => !current)
            setErrorMessage('')
            setSuccessMessage('')
          }}
        >
          {showCategoryForm ? '✕ Cancel' : '📁 Create Category'}
        </button>
      </div>

      {showCategoryForm && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Create New Category</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category Name *</label>
              <input
                type="text"
                style={styles.input}
                placeholder="e.g., Electronics, Tools, Sports"
                value={category.name}
                onChange={(event) =>
                  setCategory((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                style={{ ...styles.input, ...styles.textarea }}
                placeholder="Describe this category (optional)"
                rows={4}
                value={category.description}
                onChange={(event) =>
                  setCategory((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            {errorMessage && <p style={styles.errorMessage}>{errorMessage}</p>}
            {successMessage && <p style={styles.successMessage}>{successMessage}</p>}

            <div style={styles.formActions}>
              <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      <section style={styles.productsSection}>
        <h2 style={styles.productsTitle}>Available rentals</h2>

        {isLoadingProducts && <p>Loading products...</p>}
        {productsError && <p style={styles.errorMessage}>{productsError}</p>}
        {!isLoadingProducts && !productsError && products.length === 0 && (
          <p>No products have been listed yet.</p>
        )}

        <div style={styles.productGrid}>
          {products.map((product) => (
            <article key={product.id} style={styles.productCard}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} style={styles.productImage} />
              ) : (
                <div style={styles.imagePlaceholder}>No image</div>
              )}
              <div style={styles.productDetails}>
                <p style={styles.categoryName}>{product.categoryName}</p>
                <h3 style={styles.productName}>{product.name}</h3>
                <p style={styles.ownerName}>Listed by {product.ownerName}</p>
                <p style={styles.productPrice}>
                  ${product.price.toFixed(2)}/{product.pricingPeriod.toLowerCase()}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem',
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  subtitle: {
    color: '#666',
    fontSize: '1rem',
    marginTop: '0.5rem',
  },
  actionButtons: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  formTitle: {
    marginBottom: '1.5rem',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#333',
    borderBottom: '2px solid #0066cc',
    paddingBottom: '0.5rem',
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
  textarea: {
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  errorMessage: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  successMessage: {
    color: '#155724',
    backgroundColor: '#d4edda',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  productsSection: {
    marginTop: '3rem',
    textAlign: 'left' as const,
  },
  productsTitle: {
    marginBottom: '1.5rem',
    fontSize: '1.6rem',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '1.5rem',
  },
  productCard: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  productImage: {
    width: '100%',
    height: '190px',
    display: 'block',
    objectFit: 'cover' as const,
  },
  imagePlaceholder: {
    height: '190px',
    display: 'grid',
    placeItems: 'center',
    color: '#777',
    backgroundColor: '#eee',
  },
  productDetails: {
    padding: '1rem',
  },
  categoryName: {
    margin: 0,
    color: '#0066cc',
    fontSize: '0.8rem',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
  },
  productName: {
    margin: '0.4rem 0',
    color: '#222',
    fontSize: '1.15rem',
  },
  ownerName: {
    margin: '0 0 1rem',
    color: '#666',
    fontSize: '0.9rem',
  },
  productPrice: {
    margin: 0,
    color: '#198754',
    fontSize: '1.15rem',
    fontWeight: '700',
  },
}
