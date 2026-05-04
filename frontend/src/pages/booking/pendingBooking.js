import api from '../../services/api'

export const anyCollaboratorValue = 'any'

export function draftBookingKey(slug) {
  return `public-booking-draft:${slug}`
}

export function pendingBookingKey(slug) {
  return `pending-booking:${slug}`
}

export function readPendingBooking(slug) {
  if (!slug) {
    return null
  }

  try {
    const stored = window.localStorage.getItem(pendingBookingKey(slug))
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function savePendingBooking(slug, pendingBooking) {
  window.localStorage.setItem(pendingBookingKey(slug), JSON.stringify(pendingBooking))
}

export function clearPendingBooking(slug) {
  window.localStorage.removeItem(pendingBookingKey(slug))
}

export function clearBookingDraft(slug) {
  window.localStorage.removeItem(draftBookingKey(slug))
}

export function confirmedBookingKey(slug) {
  return `confirmed-booking:${slug}`
}

export function readConfirmedBooking(slug) {
  if (!slug) {
    return null
  }

  try {
    const stored = window.sessionStorage.getItem(confirmedBookingKey(slug))
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function saveConfirmedBooking(slug, confirmedBooking) {
  window.sessionStorage.setItem(confirmedBookingKey(slug), JSON.stringify(confirmedBooking))
}

export async function confirmPendingBooking(slug, pendingBooking) {
  const payload = pendingBooking?.payload || pendingBooking
  const response = await api.post(`/barber/public/${slug}/appointments`, payload)
  saveConfirmedBooking(slug, {
    appointment: response.data.data,
    summary: getPendingSummary(pendingBooking),
    confirmedAt: new Date().toISOString()
  })
  clearPendingBooking(slug)
  clearBookingDraft(slug)
  return response.data.data
}

export function getPendingSummary(pendingBooking) {
  return pendingBooking?.summary || null
}
