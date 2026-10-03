import type { TablesUpdate } from '~~/types/database'
import type { MePatch } from '#shared/types/api'
import { AGE_RANGES, CHANNELS, INTERESTS, LANGUAGES } from '#shared/utils/rules'

const oneOf = (list: readonly string[], v: unknown) => typeof v === 'string' && list.includes(v)
const listOf = (list: readonly string[], v: unknown) =>
  Array.isArray(v) && v.every(x => oneOf(list, x)) && new Set(v).size === v.length

export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const b = await readBody<MePatch>(event)
  const pub: TablesUpdate<'profiles'> = {}
  const priv: TablesUpdate<'private_profiles'> = {}

  if (b.name !== undefined) {
    const name = String(b.name).trim()
    if (!name || name.length > 40) throw fail(400, 'Podaj imię (do 40 znaków).')
    pub.name = name
  }
  if (b.ageRange !== undefined) {
    if (!oneOf(AGE_RANGES, b.ageRange)) throw fail(400, 'Wybierz przedział wieku.')
    pub.age_range = b.ageRange!
  }
  if (b.channel !== undefined) {
    if (!oneOf(CHANNELS, b.channel)) throw fail(400, 'Wybierz, jak wolisz pisać.')
    pub.channel = b.channel!
  }
  if (b.bio !== undefined) {
    const bio = String(b.bio).trim()
    if (bio.length > 300) throw fail(400, 'Opis może mieć najwyżej 300 znaków.')
    pub.bio = bio
  }
  if (b.interests !== undefined) {
    if (!listOf(INTERESTS, b.interests) || b.interests.length < 3 || b.interests.length > 8)
      throw fail(400, 'Wybierz od 3 do 8 zainteresowań.')
    pub.interests = b.interests
  }
  if (b.languages !== undefined) {
    if (!listOf(LANGUAGES, b.languages) || b.languages.length < 1) throw fail(400, 'Wybierz co najmniej jeden język.')
    pub.languages = b.languages
  }
  if (b.notifyNewLetter !== undefined) pub.notify_new_letter = Boolean(b.notifyNewLetter)
  if (b.notifyDelivered !== undefined) pub.notify_delivered = Boolean(b.notifyDelivered)
  if (b.city !== undefined) priv.city = String(b.city).trim().slice(0, 80) || null
  if (b.postalAddress !== undefined) priv.postal_address = String(b.postalAddress).trim().slice(0, 200) || null

  const client = db(event)
  if (Object.keys(pub).length) {
    const { error } = await client.from('profiles').update(pub).eq('id', me)
    if (error) throw fail(500, 'Nie udało się zapisać profilu.')
  }
  if (Object.keys(priv).length) {
    const { error } = await client.from('private_profiles').update(priv).eq('id', me)
    if (error) throw fail(500, 'Nie udało się zapisać adresu.')
  }
  return loadMe(event, me)
})
