import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import rentalDockLogo from './assets/RentalDock-Versatile-Transparent.svg'

type ProductCard = {
  id: string
  name: string
  categoryName: string
  ownerName: string
  price: number
  pricingPeriod: string
  imageUrl?: string
}

type CategoryOption = {
  id: string
  name: string
}

type FilterOption = {
  value: string
  label: string
}

type FilterDropdownProps = {
  label: string
  value: string
  options: FilterOption[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}

function FilterDropdown({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: FilterDropdownProps) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? label

  return (
    <div className="store-select-filter">
      <button
        className="store-dropdown-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{selectedLabel}</span>
        <svg className={`store-filter-chevron ${isOpen ? 'is-open' : ''}`} viewBox="0 0 20 20" aria-hidden="true">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {isOpen && (
        <div className="store-options-panel" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              className={option.value === value ? 'is-selected' : ''}
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              onClick={() => onSelect(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WelcomePage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductCard[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoriesError, setCategoriesError] = useState('')
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [category, setCategory] = useState({ name: '', description: '' })
  const [formMessage, setFormMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [appliedPriceRange, setAppliedPriceRange] = useState({ min: '', max: '' })
  const [showPriceFilter, setShowPriceFilter] = useState(false)
  const [periodFilter, setPeriodFilter] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [openSelect, setOpenSelect] = useState<string | null>(null)

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch('/api/categories')
        if (!response.ok) throw new Error()
        setCategories((await response.json()) as CategoryOption[])
      } catch {
        setCategoriesError('Unable to load categories.')
      }
    }

    void loadCategories()
  }, [])

  useEffect(() => {
    const abortController = new AbortController()

    async function loadProducts() {
      setIsLoadingProducts(true)
      setProductsError('')

      const parameters = new URLSearchParams()
      if (appliedSearchQuery) parameters.set('search', appliedSearchQuery)
      if (categoryFilter) parameters.set('categoryId', categoryFilter)
      if (appliedPriceRange.min) parameters.set('minPrice', appliedPriceRange.min)
      if (appliedPriceRange.max) parameters.set('maxPrice', appliedPriceRange.max)
      if (periodFilter) parameters.set('pricingPeriod', periodFilter)
      parameters.set('sort', sortBy)

      try {
        const response = await fetch(`/api/products?${parameters.toString()}`, {
          signal: abortController.signal,
        })
        if (!response.ok) throw new Error()
        setProducts((await response.json()) as ProductCard[])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setProductsError('Unable to load products right now.')
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoadingProducts(false)
      }
    }

    void loadProducts()
    return () => abortController.abort()
  }, [appliedSearchQuery, categoryFilter, appliedPriceRange, periodFilter, sortBy])

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(category),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string }
        setFormMessage(payload.message ?? 'Unable to create category.')
        return
      }

      setCategory({ name: '', description: '' })
      setShowCategoryForm(false)
    } catch {
      setFormMessage('Unable to reach the server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOwner = user?.role === 'Owner'
  const isAdmin = user?.role === 'Admin'
  const categorySuggestions = useMemo(() => {
    const query = categorySearch.trim().toLowerCase()
    return categories.filter((categoryOption) =>
      !query || categoryOption.name.toLowerCase().includes(query),
    )
  }, [categories, categorySearch])

  return (
    <div className="renter-store">
      <nav className="store-navbar" aria-label="RentalDock navigation">
        <img className="store-logo" src={rentalDockLogo} alt="RentalDock" />
      </nav>

      <main className="store-main">
        <header className="store-hero">
          <p className="store-eyebrow">Equipment, when you need it.</p>
          <h1>Welcome, {user?.userName ?? 'renter'}.</h1>
          <p>Explore equipment available to rent from owners near you.</p>
        </header>

        {(isOwner || isAdmin) && (
          <div className="store-actions">
            {isOwner && (
              <button type="button" onClick={() => navigate('/addproduct')}>
                Add product
              </button>
            )}
            {isAdmin && (
              <button type="button" onClick={() => setShowCategoryForm((shown) => !shown)}>
                {showCategoryForm ? 'Close category form' : 'Create category'}
              </button>
            )}
          </div>
        )}

        {showCategoryForm && isAdmin && (
          <form className="dark-category-form" onSubmit={createCategory}>
            <label>
              Category name
              <input
                value={category.name}
                onChange={(event) =>
                  setCategory((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={category.description}
                onChange={(event) =>
                  setCategory((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>
            {formMessage && <p className="store-error">{formMessage}</p>}
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Saving...' : 'Save category'}
            </button>
          </form>
        )}

        <section className="store-products">
          <div className="store-section-heading">
            <p>Browse the dock</p>
            <h2>Available rentals</h2>
          </div>

          <div className="store-filter-navbar" aria-label="Product filters">
            <form
              className="store-search"
              onSubmit={(event) => {
                event.preventDefault()
                setAppliedSearchQuery(searchQuery.trim())
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
              </svg>
              <input
                type="search"
                placeholder="Search rentals"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </form>

            <div
              className="store-category-autocomplete"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setOpenSelect(null)
                }
              }}
            >
              <label>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
                </svg>
                <input
                  type="search"
                  placeholder="Category"
                  value={categorySearch}
                  onFocus={() => {
                    setShowPriceFilter(false)
                    setOpenSelect('category')
                  }}
                  onChange={(event) => {
                    setCategorySearch(event.target.value)
                    setOpenSelect('category')
                  }}
                />
              </label>

              {openSelect === 'category' && (
                <div className="store-options-panel store-category-options" role="listbox" aria-label="Category suggestions">
                  <button
                    className={!categoryFilter ? 'is-selected' : ''}
                    type="button"
                    role="option"
                    aria-selected={!categoryFilter}
                    onClick={() => {
                      setCategoryFilter('')
                      setCategorySearch('')
                      setOpenSelect(null)
                    }}
                  >
                    <span>All categories</span>
                    {!categoryFilter && <span aria-hidden="true">✓</span>}
                  </button>
                  {categorySuggestions.map((categoryOption) => (
                    <button
                      className={categoryFilter === categoryOption.id ? 'is-selected' : ''}
                      type="button"
                      role="option"
                      aria-selected={categoryFilter === categoryOption.id}
                      key={categoryOption.id}
                      onClick={() => {
                        setCategoryFilter(categoryOption.id)
                        setCategorySearch(categoryOption.name)
                        setOpenSelect(null)
                      }}
                    >
                      <span>{categoryOption.name}</span>
                      {categoryFilter === categoryOption.id && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                  {categorySuggestions.length === 0 && (
                    <p className="store-no-options">No matching categories</p>
                  )}
                  {categoriesError && <p className="store-no-options">{categoriesError}</p>}
                </div>
              )}
            </div>

            <div className="store-price-filter">
              <button
                className="store-price-trigger"
                type="button"
                aria-expanded={showPriceFilter}
                onClick={() => {
                  setOpenSelect(null)
                  setShowPriceFilter((shown) => !shown)
                }}
              >
                {appliedPriceRange.min || appliedPriceRange.max
                  ? `$${appliedPriceRange.min || '0'} – $${appliedPriceRange.max || '∞'}`
                  : 'Price'}
                <svg className={`store-filter-chevron ${showPriceFilter ? 'is-open' : ''}`} viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m5 7.5 5 5 5-5" />
                </svg>
              </button>

              {showPriceFilter && (
                <form
                  className="store-price-dropdown"
                  aria-label="Filter by price range"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setAppliedPriceRange({ min: minPrice, max: maxPrice })
                    setShowPriceFilter(false)
                  }}
                >
                  <p>Enter Range</p>
                  <div className="store-price-range">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label="Minimum price"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label="Maximum price"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                    />
                    <button type="submit" aria-label="Apply price filter">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
                      </svg>
                    </button>
                  </div>
                </form>
              )}
            </div>

            <FilterDropdown
              label="Any period"
              value={periodFilter}
              options={[
                { value: '', label: 'Any period' },
                { value: 'Hour', label: 'Hourly' },
                { value: 'Day', label: 'Daily' },
                { value: 'Week', label: 'Weekly' },
                { value: 'Month', label: 'Monthly' },
              ]}
              isOpen={openSelect === 'period'}
              onToggle={() => {
                setShowPriceFilter(false)
                setOpenSelect((current) => current === 'period' ? null : 'period')
              }}
              onSelect={(value) => {
                setPeriodFilter(value)
                setOpenSelect(null)
              }}
            />

            <FilterDropdown
              label="Most recent"
              value={sortBy}
              options={[
                { value: 'recent', label: 'Most recent' },
                { value: 'price-low', label: 'Price: low to high' },
                { value: 'price-high', label: 'Price: high to low' },
              ]}
              isOpen={openSelect === 'sort'}
              onToggle={() => {
                setShowPriceFilter(false)
                setOpenSelect((current) => current === 'sort' ? null : 'sort')
              }}
              onSelect={(value) => {
                setSortBy(value)
                setOpenSelect(null)
              }}
            />
          </div>

          {isLoadingProducts && <p className="store-status">Loading products...</p>}
          {productsError && <p className="store-error">{productsError}</p>}
          {!isLoadingProducts && !productsError && products.length === 0 && (
            <p className="store-status">No rentals match those filters.</p>
          )}

          <div className="store-product-grid">
            {products.map((product) => (
              <article className="store-product-card" key={product.id}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} />
                ) : (
                  <div className="store-image-placeholder">No image</div>
                )}
                <div className="store-product-copy">
                  <p className="store-category">{product.categoryName}</p>
                  <h3>{product.name}</h3>
                  <p className="store-owner">By {product.ownerName}</p>
                  <p className="store-price">
                    ${product.price.toFixed(2)}
                    <span> / {product.pricingPeriod.toLowerCase()}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
