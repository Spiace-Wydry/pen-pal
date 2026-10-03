export type LetterKind = 'TYPED' | 'SCAN'
export type DeliveryChannel = 'APP' | 'PAPER'
export const DELIVERY_MS = 2 * 24 * 60 * 60 * 1000

export interface TimelineStep { label: string, at: string, done: boolean }

// Step label + fraction of the way from sent_at to deliver_at.
const STEPS: Record<`${LetterKind}_${DeliveryChannel}`, [string, number][]> = {
  TYPED_APP: [['Wysłany', 0], ['W drodze', 0.1], ['Dostarczony', 1]],
  TYPED_PAPER: [['Wysłany', 0], ['Wydrukowany', 0.3], ['Nadany na poczcie', 0.5], ['Dostarczony', 1]],
  SCAN_APP: [['Przyjęty w PiszuPunkcie', 0], ['W drodze', 0.3], ['Dostarczony', 1]],
  SCAN_PAPER: [['Przyjęty w PiszuPunkcie', 0], ['Wysłany pocztą', 0.5], ['Dostarczony', 1]],
}

export function deliverySteps(kind: LetterKind, channel: DeliveryChannel, sentAt: string, deliverAt: string, now = Date.now()): TimelineStep[] {
  const s = Date.parse(sentAt)
  const d = Date.parse(deliverAt)
  return STEPS[`${kind}_${channel}`].map(([label, f]) => {
    const at = s + (d - s) * f
    return { label, at: new Date(at).toISOString(), done: at <= now }
  })
}

/** One letter at a time: write if no letters yet, or the latest is the pen pal's and has arrived.
 *  Pass ALL letters of the pairing, including ones still in transit. */
export function canWrite(letters: { senderId: string, sentAt: string, deliverAt: string }[], me: string, now = Date.now()): boolean {
  const last = letters.reduce<typeof letters[number] | undefined>(
    (acc, l) => !acc || Date.parse(l.sentAt) > Date.parse(acc.sentAt) ? l : acc, undefined)
  return !last || (last.senderId !== me && Date.parse(last.deliverAt) <= now)
}
