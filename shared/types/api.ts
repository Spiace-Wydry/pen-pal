import type { AgeRange, Channel } from '../utils/rules'
import type { DeliveryChannel, LetterKind, TimelineStep } from '../utils/letters'

export type PairingStatus = 'INVITED' | 'ACTIVE' | 'ENDED' | 'BLOCKED'

/** What a pen pal may see. Never city or postal address. */
export interface PublicProfile {
  id: string
  name: string
  ageRange: AgeRange
  channel: Channel
  bio: string
  languages: string[]
  interests: string[]
}

export interface Me {
  id: string
  email: string
  name: string | null
  ageRange: AgeRange | null
  channel: Channel | null
  bio: string
  languages: string[]
  interests: string[]
  isPremium: boolean
  notifyNewLetter: boolean
  notifyDelivered: boolean
  scanConsent: boolean
  city: string | null
  postalAddress: string | null
  /** Route of the next unfinished onboarding step, or null when the profile is complete. */
  onboardingStep: string | null
  /** Max ACTIVE pairings (3, Premium 5). */
  limit: number
}

export type MePatch = Partial<{
  name: string
  ageRange: AgeRange
  channel: Channel
  bio: string
  languages: string[]
  interests: string[]
  city: string
  postalAddress: string
  notifyNewLetter: boolean
  notifyDelivered: boolean
  scanConsent: boolean
}>

export interface LetterView {
  id: string
  pairingId: string
  mine: boolean
  kind: LetterKind
  body: string | null
  /** Signed URLs; empty unless the endpoint says it signs them. */
  imageUrls: string[]
  deliveryChannel: DeliveryChannel
  sentAt: string
  deliverAt: string
  readAt: string | null
  delivered: boolean
  steps: TimelineStep[]
}

export interface PairingView {
  id: string
  palKod: string
  status: PairingStatus
  createdAt: string
  /** user_a_id: who sent the invitation */
  inviterId: string
  partner: PublicProfile
  sharedInterests: string[]
  /** Latest letter visible to me (mine, or theirs once delivered). */
  lastLetter: LetterView | null
  /** ACTIVE and it's my turn (one letter at a time). */
  canWrite: boolean
}

export interface LetterResponse { letter: LetterView, pairing: PairingView }

export interface MatchView { profile: PublicProfile, sharedInterests: string[], score: number }
export interface MatchesResponse { full: boolean, limit: number, matches: MatchView[] }

/** 7 entries indexed like Date.getDay() (0 = Sunday): [open, close] or null. */
export type Hours = ([string, string] | null)[]
export interface PointView {
  id: string
  type: 'PALPOINT' | 'PALBOX'
  name: string
  address: string
  lat: number
  lng: number
  hours: Hours
  canSend: boolean
  canCollect: boolean
  pickupNote: string | null
  phone: string | null
}
