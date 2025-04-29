import { defineEventHandler } from 'h3'
import { useSession } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const session = await useSession(event, { password: config.sessionPassword })
  await session.clear(); // Wis de sessie data
  return { success: true, message: 'Uitgelogd' }
})