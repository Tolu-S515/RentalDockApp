import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import rentalDockLogo from './assets/RentalDock-Versatile-Transparent.svg'
import BookingCalendarModal from './BookingCalendarModal'
import { weekDays, type BusinessDay } from './businessHours'

type ProductDetail = {
  id: string
  name: string
  description: string
  condition: string
  price: number
  pricingPeriod: string
  depositAmount: number
  turnoverMinutes: number
  imageUrl?: string
  location: string
  createdAt: string
  categoryName: string
  ownerId: string
  ownerName: string
}

function formatTurnover(minutes: number) {
  if (minutes === 0) return 'None'
  if (minutes % 1440 === 0) return `${minutes / 1440} day${minutes === 1440 ? '' : 's'}`
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`
  return `${minutes} minutes`
}

// "13:30:00" -> "1:30 PM"
function formatClockTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
    .format(new Date(2000, 0, 1, hours, minutes))
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBookingCalendar, setShowBookingCalendar] = useState(false)
  const [businessHours, setBusinessHours] = useState<BusinessDay[]>([])
  const ownerId = product?.ownerId

  useEffect(() => {
    if (!ownerId) return
    const abortController = new AbortController()

    async function loadBusinessHours() {
      try {
        const response = await fetch(`/api/business-hours/owner/${ownerId}`, {
          signal: abortController.signal,
        })
        if (response.ok) setBusinessHours((await response.json()) as BusinessDay[])
      } catch {
        // Hours are supplementary; the product page still works without them.
      }
    }

    void loadBusinessHours()
    return () => abortController.abort()
  }, [ownerId])

  useEffect(() => {
    const abortController = new AbortController()

    async function loadProduct() {
      try {
        const response = await fetch(`/api/products/${id}`, {
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Product not found.' : 'Unable to load this product.')
        }

        setProduct((await response.json()) as ProductDetail)
      } catch (requestError) {
        if ((requestError as Error).name !== 'AbortError') {
          setError((requestError as Error).message)
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false)
      }
    }

    void loadProduct()
    return () => abortController.abort()
  }, [id])

  return (
    <div className="renter-store">
      <nav className="store-navbar" aria-label="RentalDock navigation">
        <Link to="/welcome" aria-label="Return to available rentals">
          <img className="store-logo" src={rentalDockLogo} alt="RentalDock" />
        </Link>
      </nav>

      <main className="store-main product-detail-main">
        <Link className="product-detail-back" to="/welcome">← Back to rentals</Link>

        {isLoading && <p className="store-status">Loading product...</p>}
        {error && <p className="store-error">{error}</p>}

        {product && (
          <article className="product-detail">
            <div className="product-detail-media">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} />
              ) : (
                <div className="store-image-placeholder">No image</div>
              )}
            </div>

            <div className="product-detail-content">
              <p className="store-category">{product.categoryName}</p>
              <h1>{product.name}</h1>
              <p className="product-detail-owner">Listed by {product.ownerName}</p>

              <div className="product-detail-price">
                <strong>${product.price.toFixed(2)}</strong>
                <span> / {product.pricingPeriod.toLowerCase()}</span>
              </div>

              <dl className="product-detail-facts">
                <div><dt>Condition</dt><dd>{product.condition.replace(/([A-Z])/g, ' $1').trim()}</dd></div>
                <div><dt>Location</dt><dd>{product.location}</dd></div>
                <div><dt>Deposit</dt><dd>${product.depositAmount.toFixed(2)}</dd></div>
                <div><dt>Rental period</dt><dd>Per {product.pricingPeriod.toLowerCase()}</dd></div>
                <div><dt>Turnover</dt><dd>{formatTurnover(product.turnoverMinutes)}</dd></div>
              </dl>

              {businessHours.length > 0 && (
                <section className="product-detail-description">
                  <h2>Pickup & drop-off hours (UTC)</h2>
                  <ul className="product-detail-hours">
                    {weekDays.map((dayOfWeek) => {
                      const day = businessHours.find((current) => current.dayOfWeek === dayOfWeek)
                      return (
                        <li key={dayOfWeek}>
                          <span>{dayOfWeek}</span>
                          <span>
                            {!day || day.isClosed
                              ? 'Closed'
                              : `${formatClockTime(day.openTime)} – ${formatClockTime(day.closeTime)}`}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )}

              <section className="product-detail-description">
                <h2>About this rental</h2>
                <p>{product.description}</p>
              </section>

              <div className="product-detail-actions">
                <button className="product-book-button" type="button" onClick={() => setShowBookingCalendar(true)}>
                  Book Rental
                </button>
                <button className="product-contact-button" type="button">Contact Owner</button>
              </div>
            </div>
          </article>
        )}
      </main>

      {product && showBookingCalendar && (
        <BookingCalendarModal
          product={product}
          businessHours={businessHours}
          onClose={() => setShowBookingCalendar(false)}
        />
      )}
    </div>
  )
}
