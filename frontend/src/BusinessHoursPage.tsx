import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import rentalDockLogo from './assets/RentalDock-Versatile-Transparent.svg'
import { weekDays, type BusinessDay } from './businessHours'

// Used until the owner saves their own hours.
const defaultHours: BusinessDay[] = weekDays.map((dayOfWeek) => ({
  dayOfWeek,
  isClosed: dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday',
  openTime: '09:00',
  closeTime: '17:00',
}))

// The API sends and expects "HH:mm:ss"; time inputs use "HH:mm".
function fromApi(days: BusinessDay[]) {
  return weekDays.map((dayOfWeek) => {
    const day = days.find((current) => current.dayOfWeek === dayOfWeek)
    return day
      ? { ...day, openTime: day.openTime.slice(0, 5), closeTime: day.closeTime.slice(0, 5) }
      : { dayOfWeek, isClosed: true, openTime: '09:00', closeTime: '17:00' }
  })
}

export default function BusinessHoursPage() {
  const { token, user } = useAuth()
  const [hours, setHours] = useState<BusinessDay[]>(defaultHours)
  const [hasSavedHours, setHasSavedHours] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const isOwner = user?.role === 'Owner'

  useEffect(() => {
    if (!isOwner) {
      setIsLoading(false)
      return
    }

    async function loadHours() {
      try {
        const response = await fetch('/api/business-hours/mine', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error()
        const days = (await response.json()) as BusinessDay[]
        if (days.length > 0) {
          setHours(fromApi(days))
          setHasSavedHours(true)
        }
      } catch {
        setError('Unable to load your business hours.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadHours()
  }, [isOwner, token])

  function updateDay(dayOfWeek: string, changes: Partial<BusinessDay>) {
    setHours((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day)),
    )
    setMessage('')
  }

  const invalidDay = hours.find((day) => !day.isClosed && day.closeTime <= day.openTime)

  async function saveHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (invalidDay) return

    setError('')
    setMessage('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/business-hours/mine', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          hours.map((day) => ({
            ...day,
            openTime: `${day.openTime}:00`,
            closeTime: `${day.closeTime}:00`,
          })),
        ),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string }
        setError(payload.message ?? 'Unable to save your business hours.')
        return
      }

      setHours(fromApi((await response.json()) as BusinessDay[]))
      setHasSavedHours(true)
      setMessage('Business hours saved.')
    } catch {
      setError('Unable to reach the server. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="renter-store">
      <nav className="store-navbar" aria-label="RentalDock navigation">
        <Link to="/welcome" aria-label="Return to available rentals">
          <img className="store-logo" src={rentalDockLogo} alt="RentalDock" />
        </Link>
      </nav>

      <main className="store-main">
        <Link className="product-detail-back" to="/welcome">← Back to rentals</Link>

        <header className="store-hero">
          <p className="store-eyebrow">Pickup & drop-off</p>
          <h1>Business hours</h1>
          <p>Renters can only pick up and return your equipment during these hours. Times are in UTC.</p>
        </header>

        {!isOwner && <p className="store-error">Only product owners can set business hours.</p>}
        {isOwner && isLoading && <p className="store-status">Loading business hours...</p>}

        {isOwner && !isLoading && (
          <form className="business-hours-form" onSubmit={saveHours}>
            {!hasSavedHours && (
              <p className="store-status">You haven't set hours yet. These are suggested defaults.</p>
            )}

            {hours.map((day) => (
              <div className={`business-hours-row ${day.isClosed ? 'is-closed' : ''}`} key={day.dayOfWeek}>
                <span className="business-hours-day">{day.dayOfWeek}</span>

                <label className="business-hours-toggle">
                  <input
                    type="checkbox"
                    checked={!day.isClosed}
                    onChange={(event) => updateDay(day.dayOfWeek, { isClosed: !event.target.checked })}
                  />
                  {day.isClosed ? 'Closed' : 'Open'}
                </label>

                {!day.isClosed && (
                  <div className="business-hours-times">
                    <input
                      type="time"
                      aria-label={`${day.dayOfWeek} opening time`}
                      value={day.openTime}
                      onChange={(event) => updateDay(day.dayOfWeek, { openTime: event.target.value })}
                      required
                    />
                    <span>to</span>
                    <input
                      type="time"
                      aria-label={`${day.dayOfWeek} closing time`}
                      value={day.closeTime}
                      onChange={(event) => updateDay(day.dayOfWeek, { closeTime: event.target.value })}
                      required
                    />
                  </div>
                )}
              </div>
            ))}

            {invalidDay && (
              <p className="store-error">{invalidDay.dayOfWeek} closing time must be after its opening time.</p>
            )}
            {error && <p className="store-error">{error}</p>}
            {message && <p className="store-status">{message}</p>}

            <button type="submit" disabled={isSaving || Boolean(invalidDay)}>
              {isSaving ? 'Saving...' : 'Save hours'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
