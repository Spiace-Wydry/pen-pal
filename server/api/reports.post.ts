import { REPORT_REASONS } from '#shared/utils/reports'

export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const b = await readBody<{ pairingId?: string, reason?: string, details?: string }>(event)
  const p = await requirePairing(event, String(b.pairingId ?? ''), me)
  if (!REPORT_REASONS.includes(b.reason as typeof REPORT_REASONS[number])) throw fail(400, 'Wybierz, co się stało.') // (new copy)
  const details = String(b.details ?? '').trim().slice(0, 1000) || null
  const { error } = await db(event).from('reports').insert({ pairing_id: p.id, reporter_id: me, reason: b.reason!, details })
  if (error) throw fail(500, 'Nie udało się wysłać zgłoszenia.') // (new copy)
  return { ok: true }
})
