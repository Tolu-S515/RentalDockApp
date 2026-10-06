import { useCallback, useEffect, useMemo, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { useAuth } from './AuthContext'
import type { BusinessDay } from './businessHours'

type AvailabilityRange = {
  startDateTime: string
  endDateTime: string
  // endDateTime plus the product's turnover; the product can't be booked until then.
  blockedUntil: string
  status: 'Pending' | 'Confirmed' | 'Active'
}

// The server's BookingResponse.
type CreatedBooking = {
  id: string
  startDateTime: string
  endDateTime: string
  rentalSubtotal: number
  depositAmount: number
  totalAmount: number
  status: string
}

type BookableProduct = {
  id: string
  name: string
  pricingPeriod: string
  price: number
  depositAmount: number
  turnoverMinutes: number
}

type Props = {
  product: BookableProduct
  businessHours: BusinessDay[]
  onClose: () => void
}

type Block = { start: number; end: number; blockedUntil: number }
type OpenWindow = { open: number; close: number }

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
const SLOT_MINUTES = 30
const MIN_BOOKING_MINUTES = 60
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function startOfDay(date: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day
}

function addDays(date: Date, days: number) {
  const day = new Date(date)
  day.setDate(day.getDate() + days)
  return day
}

// Business hours are UTC times for now, matching the server. Calendar days are the
// dates the renter clicked, so each one is mapped to the same date in UTC.
function utcMidnight(day: Date) {
  return Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())
}

// "08:30:00" UTC on the given day, as a timestamp.
function atTime(day: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return utcMidnight(day) + (hours * 60 + minutes) * MINUTE
}

// The owner's pickup/drop-off window for a day, or null when they're closed.
// Owners who haven't set hours yet are treated as open all day.
function getOpenWindow(day: Date, businessHours: BusinessDay[]): OpenWindow | null {
  if (businessHours.length === 0) {
    return { open: utcMidnight(day), close: utcMidnight(day) + DAY }
  }

  const hours = businessHours.find((current) => current.dayOfWeek === dayNames[day.getDay()])
  if (!hours || hours.isClosed) return null
  return { open: atTime(day, hours.openTime), close: atTime(day, hours.closeTime) }
}

function formatClock(time: number) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(time)
}

function formatTick(time: number) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', timeZone: 'UTC' }).format(time)
}

const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

// 5_400_000 -> "1 hr 30 min"
function formatHoursAndMinutes(duration: number) {
  const totalMinutes = Math.round(duration / MINUTE)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return [hours > 0 ? `${hours} hr` : '', minutes > 0 ? `${minutes} min` : ''].filter(Boolean).join(' ')
}

// Server timestamps, shown in UTC like the business hours.
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value)) + ' UTC'
}

// Calendar days are local Date objects, so they're formatted in local time.
function formatDay(day: Date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(day)
}

export default function BookingCalendarModal({ product, businessHours, onClose }: Props) {
  const { token } = useAuth()
  const isHourly = product.pricingPeriod === 'Hour'
  const turnover = product.turnoverMinutes * MINUTE
  const [availability, setAvailability] = useState<AvailabilityRange[]>([])
  const [month, setMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date>()
  const [selectedRange, setSelectedRange] = useState<DateRange>()
  const [pickup, setPickup] = useState<number>()
  const [dropOff, setDropOff] = useState<number>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [booking, setBooking] = useState<CreatedBooking>()
  // Bumped to refetch availability, e.g. after someone else takes the chosen time.
  const [availabilityVersion, setAvailabilityVersion] = useState(0)
  const today = startOfDay(new Date())
  const showPicker = !isLoading && !error && !booking

  useEffect(() => {
    const controller = new AbortController()

    async function loadAvailability() {
      try {
        const response = await fetch(`/api/bookings/product/${product.id}/availability`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Unable to load availability.')
        setAvailability((await response.json()) as AvailabilityRange[])
      } catch (requestError) {
        if ((requestError as Error).name !== 'AbortError') setError((requestError as Error).message)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadAvailability()
    return () => controller.abort()
  }, [product.id, availabilityVersion])

  async function createBooking(start: number, end: number) {
    if (!token) {
      setMessage('Please log in to book this rental.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: product.id,
          startDateTime: new Date(start).toISOString(),
          endDateTime: new Date(end).toISOString(),
        }),
      })

      if (response.ok) {
        setBooking((await response.json()) as CreatedBooking)
        return
      }

      // 401/403 responses have no body, so fall back to a generic message.
      const payload = (await response.json().catch(() => ({}))) as { message?: string }

      if (response.status === 409) {
        setPickup(undefined)
        setDropOff(undefined)
        setSelectedRange(undefined)
        setAvailabilityVersion((version) => version + 1)
        setMessage('Someone just booked that time. Availability has been refreshed, please choose again.')
      } else if (response.status === 401) {
        setMessage('Your session has expired. Please log in again to book.')
      } else {
        setMessage(payload.message ?? 'Unable to create the booking.')
      }
    } catch {
      setMessage('Unable to reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Hourly day view: Escape goes back to the calendar; otherwise it closes the popup.
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (selectedDay && !booking) showCalendar()
      else onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [booking, onClose, selectedDay])

  const blocks = useMemo<Block[]>(() => availability.map((booking) => ({
    start: new Date(booking.startDateTime).getTime(),
    end: new Date(booking.endDateTime).getTime(),
    blockedUntil: new Date(booking.blockedUntil).getTime(),
  })), [availability])

  // A rental from start to end is possible when neither it nor its turnover
  // touches an existing booking or that booking's turnover.
  const isFree = useCallback(
    (start: number, end: number) =>
      !blocks.some((block) => start < block.blockedUntil && end + turnover > block.start),
    [blocks, turnover],
  )

  // Every pickup slot in the day's open hours, flagged by whether a minimum-length rental fits there.
  const pickupSlotsFor = useCallback((day: Date) => {
    const openWindow = getOpenWindow(day, businessHours)
    if (!openWindow) return []

    const now = Date.now()
    const slots: { time: number; available: boolean }[] = []
    for (let time = openWindow.open; time + MIN_BOOKING_MINUTES * MINUTE <= openWindow.close; time += SLOT_MINUTES * MINUTE) {
      slots.push({
        time,
        available: time >= now && isFree(time, time + MIN_BOOKING_MINUTES * MINUTE),
      })
    }
    return slots
  }, [businessHours, isFree])

  const isDayUnavailable = useCallback(
    (day: Date) => !pickupSlotsFor(day).some((slot) => slot.available),
    [pickupSlotsFor],
  )

  // Has at least one booking during open hours but still has a free pickup time.
  const isDayPartlyBooked = useCallback((day: Date) => {
    const openWindow = getOpenWindow(day, businessHours)
    return Boolean(openWindow) && !isDayUnavailable(day) && blocks.some((block) =>
      block.start < openWindow!.close && block.blockedUntil > openWindow!.open,
    )
  }, [blocks, businessHours, isDayUnavailable])

  // An open day from today onwards with no pickup time left.
  const isDayFullyBooked = useCallback(
    (day: Date) =>
      day >= startOfDay(new Date()) && Boolean(getOpenWindow(day, businessHours)) && isDayUnavailable(day),
    [businessHours, isDayUnavailable],
  )

  const isClosedDay = useCallback(
    (day: Date) => !getOpenWindow(day, businessHours),
    [businessHours],
  )

  // Daily/weekly rentals: an open day is unavailable when renting just that day
  // (opening to closing, plus turnover) would hit a booking, or when today's opening
  // time has already passed. A closed day is unavailable only when a booking covers it,
  // so a rental can still run through it.
  const isDayBooked = useCallback((day: Date) => {
    const openWindow = getOpenWindow(day, businessHours)
    if (openWindow) return openWindow.open < Date.now() || !isFree(openWindow.open, openWindow.close)

    const dayStart = utcMidnight(day)
    const dayEnd = dayStart + DAY
    return blocks.some((block) => block.start < dayEnd && block.blockedUntil > dayStart)
  }, [blocks, businessHours, isFree])

  // Pickup is at opening time on the first day and return is by closing time on the last day.
  const rangeRental = (() => {
    if (isHourly || !selectedRange?.from) return null
    const firstDay = selectedRange.from
    const lastDay = selectedRange.to ?? selectedRange.from
    const pickupWindow = getOpenWindow(firstDay, businessHours)
    const returnWindow = getOpenWindow(lastDay, businessHours)
    if (!pickupWindow || !returnWindow) return null
    return { firstDay, lastDay, pickup: pickupWindow.open, dropOff: returnWindow.close }
  })()

  function selectRange(range: DateRange | undefined) {
    const firstDay = range?.from
    const lastDay = range?.to ?? range?.from
    if (firstDay && lastDay && (isClosedDay(firstDay) || isClosedDay(lastDay))) {
      setMessage(`The owner is closed on ${dayNames[(isClosedDay(firstDay) ? firstDay : lastDay).getDay()]}s. Pickup and return need to be on open days.`)
      return
    }

    if (firstDay && lastDay) {
      const pickupWindow = getOpenWindow(firstDay, businessHours)!
      const returnWindow = getOpenWindow(lastDay, businessHours)!
      if (!isFree(pickupWindow.open, returnWindow.close)) {
        setMessage('Those dates overlap another booking or its turnover time.')
        return
      }
    }

    setSelectedRange(range)
    setMessage('')
  }

  // Mirrors the server's CalculateSubtotal: started periods are charged in full.
  const rangeUnits = (() => {
    if (!rangeRental) return 0
    const days = (rangeRental.dropOff - rangeRental.pickup) / DAY
    const perPeriod = product.pricingPeriod === 'Week' ? 7 : product.pricingPeriod === 'Month' ? 30 : 1
    return Math.max(1, Math.ceil(days / perPeriod))
  })()
  const periodLabel = product.pricingPeriod.toLowerCase()
  // Calendar days the renter has the item, counting both the pickup and return day.
  const rangeDays = rangeRental
    ? Math.round((utcMidnight(rangeRental.lastDay) - utcMidnight(rangeRental.firstDay)) / DAY) + 1
    : 0

  function showCalendar() {
    setSelectedDay(undefined)
    setPickup(undefined)
    setDropOff(undefined)
    setMessage('')
  }

  function showDay(day: Date) {
    setSelectedDay(day)
    setMonth(day)
    setPickup(undefined)
    setDropOff(undefined)
    setMessage('')
  }

  function choosePickup(time: number) {
    setPickup(time)
    setDropOff(time + MIN_BOOKING_MINUTES * MINUTE)
    setMessage('')
  }

  const openWindow = selectedDay ? getOpenWindow(selectedDay, businessHours) : null
  const pickupSlots = selectedDay ? pickupSlotsFor(selectedDay) : []

  // Return times run in 30-minute steps from the minimum length until the owner
  // closes or the next booking (including this rental's turnover) gets in the way.
  const dropOffSlots: { time: number; available: boolean }[] = []
  if (openWindow && pickup !== undefined) {
    let stillFree = true
    for (let time = pickup + MIN_BOOKING_MINUTES * MINUTE; time <= openWindow.close; time += SLOT_MINUTES * MINUTE) {
      stillFree = stillFree && isFree(pickup, time)
      dropOffSlots.push({ time, available: stillFree })
    }
  }

  const rentalHours = pickup !== undefined && dropOff !== undefined
    ? Math.ceil((dropOff - pickup) / (60 * MINUTE))
    : 0

  return (
    <div className="booking-modal-back" role="presentation" onMouseDown={onClose}>
      <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="booking-modal-close" type="button" onClick={onClose} aria-label="Close calendar">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5 5 15" />
          </svg>
        </button>
        <p className="store-category">
          {booking
            ? 'Request sent'
            : selectedDay ? 'Choose your pickup and return time' : 'Choose your rental dates'}
        </p>
        <h2 id="booking-modal-title">Book {product.name}</h2>
        {isLoading && <p className="store-status">Loading availability...</p>}
        {error && <p className="store-error">{error}</p>}

        {booking && (
          <div className="booking-day-view">
            <Receipt
              title="Booking request"
              status={booking.status}
              pickup={formatDateTime(booking.startDateTime)}
              dropOff={formatDateTime(booking.endDateTime)}
              units={Math.round(booking.rentalSubtotal / product.price)}
              unitLabel={product.pricingPeriod.toLowerCase()}
              unitPrice={product.price}
              deposit={booking.depositAmount}
              total={booking.totalAmount}
            />
            <p className="booking-selection-message">The owner will confirm or decline your request.</p>
            <button className="booking-calendar-continue" type="button" onClick={onClose}>
              Done
            </button>
          </div>
        )}

        {showPicker && !isHourly && (
          <>
            <div className="booking-calendar-wrap">
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={selectRange}
                disabled={[{ before: today }, isDayBooked]}
                modifiers={{ unavailable: isDayBooked, closed: isClosedDay }}
                modifiersClassNames={{ unavailable: 'booking-day-unavailable', closed: 'booking-day-closed-day' }}
                excludeDisabled
              />
            </div>

            <div className="booking-calendar-legend">
              <span><i className="is-unavailable" />Unavailable</span>
              <span><i className="is-closed" />Owner closed</span>
              <span><i className="is-today" />Today</span>
            </div>

            {rangeRental && (
              <Receipt
                pickup={`${formatDay(rangeRental.firstDay)} · ${formatClock(rangeRental.pickup)} UTC`}
                dropOff={`${formatDay(rangeRental.lastDay)} · ${formatClock(rangeRental.dropOff)} UTC`}
                duration={plural(rangeDays, 'day')}
                units={rangeUnits}
                unitLabel={periodLabel}
                unitPrice={product.price}
                deposit={product.depositAmount}
                note={periodLabel === 'day' || rangeDays % (periodLabel === 'week' ? 7 : 30) === 0
                  ? undefined
                  : `Each started ${periodLabel} is charged in full.`}
              />
            )}

            {message && <p className="booking-selection-message">{message}</p>}
            <button
              className="booking-calendar-continue"
              type="button"
              disabled={!rangeRental || isSubmitting}
              onClick={() => rangeRental && void createBooking(rangeRental.pickup, rangeRental.dropOff)}
            >
              {isSubmitting ? 'Booking...' : 'Continue'}
            </button>
          </>
        )}

        {showPicker &&isHourly && !selectedDay && (
          <>
            <div className="booking-calendar-wrap">
              <DayPicker
                mode="single"
                month={month}
                onMonthChange={setMonth}
                selected={selectedDay}
                onSelect={(day) => { if (day) showDay(day) }}
                disabled={[{ before: today }, isDayUnavailable]}
                modifiers={{
                  partiallyBooked: isDayPartlyBooked,
                  unavailable: isDayFullyBooked,
                  closed: (day: Date) => !getOpenWindow(day, businessHours),
                }}
                modifiersClassNames={{
                  partiallyBooked: 'booking-day-partial',
                  unavailable: 'booking-day-unavailable',
                  closed: 'booking-day-closed-day',
                }}
              />
            </div>

            <div className="booking-calendar-legend">
              <span><i className="is-partial" />Some hours booked</span>
              <span><i className="is-unavailable" />Fully booked</span>
              <span><i className="is-closed" />Owner closed</span>
              <span><i className="is-today" />Today</span>
            </div>
            <p className="booking-selection-message">Pick a day to see its available hours.</p>
          </>
        )}

        {showPicker &&isHourly && selectedDay && (
          <div className="booking-day-view">
            <div className="booking-day-header">
              <button className="booking-back" type="button" onClick={showCalendar}>← Calendar</button>
              <div className="booking-day-nav">
                <button
                  type="button"
                  aria-label="Previous day"
                  disabled={selectedDay <= today}
                  onClick={() => showDay(addDays(selectedDay, -1))}
                >
                  ‹
                </button>
                <strong>{formatDay(selectedDay)}</strong>
                <button type="button" aria-label="Next day" onClick={() => showDay(addDays(selectedDay, 1))}>
                  ›
                </button>
              </div>
            </div>

            {!openWindow && (
              <p className="booking-day-closed">
                The owner is closed on {dayNames[selectedDay.getDay()]}s, so pickups aren't available.
              </p>
            )}

            {openWindow && (
              <>
                <DayTimeline
                  openWindow={openWindow}
                  blocks={blocks}
                  pickup={pickup}
                  dropOff={dropOff}
                />

                {!pickupSlots.some((slot) => slot.available) && (
                  <p className="booking-day-closed">No times are available on this day.</p>
                )}

                <div className="booking-slot-group">
                  <h3>Pickup (UTC)</h3>
                  <div className="booking-slots">
                    {pickupSlots.map((slot) => (
                      <button
                        className={slot.time === pickup ? 'is-selected' : ''}
                        type="button"
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => choosePickup(slot.time)}
                      >
                        {formatClock(slot.time)}
                      </button>
                    ))}
                  </div>
                </div>

                {pickup !== undefined && (
                  <div className="booking-slot-group">
                    <h3>Return (UTC)</h3>
                    <div className="booking-slots">
                      {dropOffSlots.map((slot) => (
                        <button
                          className={slot.time === dropOff ? 'is-selected' : ''}
                          type="button"
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => { setDropOff(slot.time); setMessage('') }}
                        >
                          {formatClock(slot.time)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {pickup !== undefined && dropOff !== undefined && (
                  <Receipt
                    pickup={`${formatDay(selectedDay)} · ${formatClock(pickup)} UTC`}
                    dropOff={`${formatDay(selectedDay)} · ${formatClock(dropOff)} UTC`}
                    duration={formatHoursAndMinutes(dropOff - pickup)}
                    units={rentalHours}
                    unitLabel="hour"
                    unitPrice={product.price}
                    deposit={product.depositAmount}
                    note={(dropOff - pickup) % (60 * MINUTE) === 0 ? undefined : 'Each started hour is charged in full.'}
                  />
                )}
              </>
            )}

            {message && <p className="booking-selection-message">{message}</p>}
            <button
              className="booking-calendar-continue"
              type="button"
              disabled={pickup === undefined || dropOff === undefined || isSubmitting}
              onClick={() => pickup !== undefined && dropOff !== undefined && void createBooking(pickup, dropOff)}
            >
              {isSubmitting ? 'Booking...' : 'Continue'}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

type ReceiptProps = {
  title?: string
  status?: string
  pickup: string
  dropOff: string
  duration?: string
  units: number
  unitLabel: string
  unitPrice: number
  deposit: number
  // Defaults to subtotal + deposit; the confirmation passes the server's total.
  total?: number
  note?: string
}

function Receipt({
  title = 'Rental summary',
  status,
  pickup,
  dropOff,
  duration,
  units,
  unitLabel,
  unitPrice,
  deposit,
  total,
  note,
}: ReceiptProps) {
  const subtotal = units * unitPrice

  return (
    <section className="booking-receipt" aria-label={title}>
      <header className="booking-receipt-header">
        <h3>{title}</h3>
        {status && <span className="booking-receipt-status">{status}</span>}
      </header>

      <dl className="booking-receipt-rows">
        <div><dt>Pickup</dt><dd>{pickup}</dd></div>
        <div><dt>Return by</dt><dd>{dropOff}</dd></div>
        {duration && <div><dt>Duration</dt><dd>{duration}</dd></div>}
      </dl>

      <dl className="booking-receipt-rows booking-receipt-charges">
        <div>
          <dt>
            Rental
            <small>{plural(units, unitLabel)} × {currency.format(unitPrice)}</small>
          </dt>
          <dd>{currency.format(subtotal)}</dd>
        </div>
        <div>
          <dt>Security deposit</dt>
          <dd>{currency.format(deposit)}</dd>
        </div>
      </dl>

      <div className="booking-receipt-total">
        <span>Total due</span>
        <strong>{currency.format(total ?? subtotal + deposit)}</strong>
      </div>

      {note && <p className="booking-receipt-note">{note}</p>}
    </section>
  )
}

type DayTimelineProps = {
  openWindow: OpenWindow
  blocks: Block[]
  pickup?: number
  dropOff?: number
}

// A bar spanning the owner's open hours, with bookings, turnover, past time and the selection laid over it.
function DayTimeline({ openWindow, blocks, pickup, dropOff }: DayTimelineProps) {
  const span = openWindow.close - openWindow.open
  const percent = (time: number) => ((time - openWindow.open) / span) * 100

  function segment(start: number, end: number, className: string, key: string) {
    const from = Math.max(start, openWindow.open)
    const to = Math.min(end, openWindow.close)
    if (to <= from) return null
    return (
      <span
        className={`booking-segment ${className}`}
        key={key}
        style={{ left: `${percent(from)}%`, width: `${percent(to) - percent(from)}%` }}
        title={`${formatClock(from)} – ${formatClock(to)}`}
      />
    )
  }

  const hours = span / (60 * MINUTE)
  const tickStep = (hours <= 12 ? 1 : hours <= 18 ? 2 : 3) * 60 * MINUTE
  const firstTick = Math.ceil(openWindow.open / (60 * MINUTE)) * 60 * MINUTE
  const ticks: number[] = []
  for (let time = firstTick; time <= openWindow.close; time += tickStep) ticks.push(time)

  return (
    <div className="booking-timeline">
      <div className="booking-timeline-track">
        {segment(openWindow.open, Date.now(), 'is-past', 'past')}
        {blocks.map((block) => [
          segment(block.start, block.end, 'is-booked', `booked-${block.start}`),
          segment(block.end, block.blockedUntil, 'is-turnover', `turnover-${block.start}`),
        ])}
        {pickup !== undefined && dropOff !== undefined &&
          segment(pickup, dropOff, 'is-selected', 'selected')}
      </div>

      <div className="booking-timeline-ticks" aria-hidden="true">
        {ticks.map((time) => (
          <span key={time} style={{ left: `${percent(time)}%` }}>{formatTick(time)}</span>
        ))}
      </div>

      <div className="booking-timeline-legend">
        <span><i className="is-booked" />Booked</span>
        <span><i className="is-turnover" />Turnover</span>
        <span><i className="is-selected" />Your rental</span>
      </div>
    </div>
  )
}
