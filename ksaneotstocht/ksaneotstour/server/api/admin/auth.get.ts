import { defineEventHandler } from 'h3'
import { useSession } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const session = await useSession(event, { password: config.sessionPassword })
  // Return enkel of de gebruiker admin is, rest van de sessie data is niet nodig
  return { isAdmin: !!session.data.isAdmin }
})

