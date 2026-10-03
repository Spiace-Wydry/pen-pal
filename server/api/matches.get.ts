import type { MatchesResponse } from '#shared/types/api'

export default defineEventHandler(async (event): Promise<MatchesResponse> => {
  const me = await requireUserId(event)
  const { limit } = await loadMe(event, me)
  if (await activeCount(event, me) >= limit) return { full: true, limit, matches: [] }
  return { full: false, limit, matches: (await findMatches(event, me)).slice(0, 3) }
})
