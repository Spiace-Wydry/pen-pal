import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/types/database'

/** Service-role client. Every route must check membership itself (requirePairing). */
export const db = (event: H3Event) => serverSupabaseServiceRole<Database>(event)

export const fail = (statusCode: number, message: string) => createError({ statusCode, message })

export async function requireUserId(event: H3Event): Promise<string> {
  const claims = await serverSupabaseUser(event).catch(() => null)
  if (!claims?.sub) throw fail(401, 'Zaloguj się, aby kontynuować.')
  return claims.sub
}
