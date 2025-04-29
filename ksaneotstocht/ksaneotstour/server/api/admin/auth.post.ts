import { defineEventHandler, readBody, createError } from 'h3'
import { useSession } from 'h3' // Nuxt's session utility
import { z } from 'zod'
import { useRuntimeConfig } from '#imports'

// Validatieschema voor login body
const LoginSchema = z.object({
  password: z.string().min(1, 'Wachtwoord is vereist'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Valideer input
  const validationResult = LoginSchema.safeParse(body)
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: validationResult.error.errors.map(e => e.message).join(', '),
    });
  }

  const { password } = validationResult.data

  // Vergelijk met het admin geheim uit environment variables
  if (password === config.adminSecret) {
    // Wachtwoord correct, start de sessie
    const session = await useSession(event, {
      password: config.sessionPassword, // Haal sessie wachtwoord op uit config
       maxAge: 60 * 60 * 8, // Sessie duur in seconden (8 uur)
       name: 'neots-ksa-admin-session',
    });

    // Update de sessie data om aan te geven dat de gebruiker ingelogd is
    await session.update({ isAdmin: true, loggedInAt: Date.now() })

    return { success: true, message: 'Ingelogd' }
  } else {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Ongeldig wachtwoord',
    })
  }
})