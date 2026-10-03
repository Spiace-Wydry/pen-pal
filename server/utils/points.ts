import type { PointView } from '#shared/types/api'
import type { Tables } from '~~/types/database'

export const toPointView = (p: Tables<'points'>): PointView => ({
  id: p.id,
  type: p.type,
  name: p.name,
  address: p.address,
  lat: p.lat,
  lng: p.lng,
  hours: p.hours as PointView['hours'],
  canSend: p.can_send,
  canCollect: p.can_collect,
  pickupNote: p.pickup_note,
  phone: p.phone,
})
