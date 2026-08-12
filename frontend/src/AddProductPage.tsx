import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type Category = {
    id: string
    name: string
}

export default function AddProductPage() {
    const navigate = useNavigate()
    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)
    const [product, setProduct] = useState({
        name: '',
        description: '',
        categoryId: '',
        condition: '',
        price: 0,
        pricingPeriod: '',
        depositAmount: 0,
        imageUrl: '',
        location: ''
    })

    const handleChange = (field: string, value: string | number) => {
        setProduct({ ...product, [field]: value })
    }

    useEffect(() => {
        async function loadCategories() {
            try {
                const response = await fetch('/api/categories')
                if (!response.ok) {
                    throw new Error()
                }

                setCategories((await response.json()) as Category[])
            } catch {
                setErrorMessage('Unable to load categories.')
            } finally {
                setIsLoadingCategories(false)
            }
        }

        void loadCategories()
    }, [])

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const ownerId = localStorage.getItem('loggedInUserId')

        if (!ownerId) {
            setErrorMessage('Please log in again before adding a product.')
            return
        }

        setErrorMessage('')
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...product, ownerId })
            })

            if (!response.ok) {
                const payload = (await response.json()) as {
                    message?: string
                    errors?: Record<string, string[]>
                }
                const validationError = payload.errors
                    ? Object.values(payload.errors).flat()[0]
                    : undefined
                setErrorMessage(payload.message ?? validationError ?? 'Unable to create product.')
                return
            }

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
                <h1>Add New Product</h1>
                <p style={styles.subtitle}>Fill in the details below to list your product for rent</p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
                {/* Basic Information */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Basic Information</h2>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Product Name *</label>
                        <input
                            type="text"
                            style={styles.input}
                            placeholder="Enter product name"
                            value={product.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Description *</label>
                        <textarea
                            style={{ ...styles.input, ...styles.textarea }}
                            placeholder="Describe your product in detail"
                            value={product.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={4}
                            required
                        />
                    </div>
                </section>

                {/* Category & Condition */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Category & Condition</h2>
                    
                    <div style={styles.formRow}>
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                            <label style={styles.label}>Category *</label>
                            <select
                                style={styles.input}
                                value={product.categoryId}
                                onChange={(e) => handleChange('categoryId', e.target.value)}
                                disabled={isLoadingCategories}
                                required
                            >
                                <option value="">
                                    {isLoadingCategories ? 'Loading categories...' : 'Select category'}
                                </option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ ...styles.formGroup, flex: 1, marginLeft: '1rem' }}>
                            <label style={styles.label}>Condition *</label>
                            <select
                                style={styles.input}
                                value={product.condition}
                                onChange={(e) => handleChange('condition', e.target.value)}
                                required
                            >
                                <option value="">Select condition</option>
                                <option value="New">New</option>
                                <option value="LikeNew">Like new</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Pricing</h2>
                    
                    <div style={styles.formRow}>
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                            <label style={styles.label}>Rental Price *</label>
                            <input
                                type="number"
                                style={styles.input}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                value={product.price}
                                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                                required
                            />
                        </div>

                        <div style={{ ...styles.formGroup, flex: 1, marginLeft: '1rem' }}>
                            <label style={styles.label}>Pricing Period *</label>
                            <select
                                style={styles.input}
                                value={product.pricingPeriod}
                                onChange={(e) => handleChange('pricingPeriod', e.target.value)}
                                required
                            >
                                <option value="">Select period</option>
                                <option value="Hour">Hourly</option>
                                <option value="Day">Daily</option>
                                <option value="Week">Weekly</option>
                                <option value="Month">Monthly</option>
                            </select>
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Deposit Amount *</label>
                        <input
                            type="number"
                            style={styles.input}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value={product.depositAmount}
                            onChange={(e) => handleChange('depositAmount', parseFloat(e.target.value) || 0)}
                            required
                        />
                    </div>
                </section>

                {/* Media & Location */}
                <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>Media & Location</h2>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Image URL</label>
                        <input
                            type="url"
                            style={styles.input}
                            placeholder="https://example.com/image.jpg"
                            value={product.imageUrl}
                            onChange={(e) => handleChange('imageUrl', e.target.value)}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Location *</label>
                        <input
                            type="text"
                            style={styles.input}
                            placeholder="Enter your location"
                            value={product.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            required
                        />
                    </div>
                </section>

                {/* Actions */}
                {errorMessage && <p style={{ color: '#dc2626' }}>{errorMessage}</p>}
                <div style={styles.actions}>
                    <button type="button" style={styles.cancelButton} onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                    <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Product'}
                    </button>
                </div>
            </form>
        </div>
    )
}

const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px'
    } as React.CSSProperties,
    header: {
        marginBottom: '2rem',
        textAlign: 'center' as const
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '0.5rem'
    },
    subtitle: {
        color: '#666',
        fontSize: '0.9rem'
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2rem'
    },
    section: {
        backgroundColor: '#fff',
        padding: '1.5rem',
        borderRadius: '6px',
        border: '1px solid #e0e0e0'
    },
    sectionTitle: {
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#333',
        borderBottom: '2px solid #007bff',
        paddingBottom: '0.5rem'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        marginBottom: '1rem'
    },
    formRow: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '1rem'
    },
    label: {
        fontWeight: '600',
        marginBottom: '0.5rem',
        fontSize: '0.95rem',
        color: '#333'
    },
    input: {
        padding: '0.75rem',
        fontSize: '0.95rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box' as const
    },
    textarea: {
        resize: 'vertical' as const,
        fontFamily: 'inherit'
    },
    actions: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'flex-end',
        marginTop: '1rem'
    },
    submitButton: {
        padding: '0.75rem 2rem',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontWeight: '600',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    cancelButton: {
        padding: '0.75rem 2rem',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontWeight: '600',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    }
}
