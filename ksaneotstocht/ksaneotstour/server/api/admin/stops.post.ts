import { defineEventHandler, readBody, createError } from 'h3'
import { useSession } from 'h3'
import { z } from 'zod'
import { getDbClient } from '~/server/utils/supabase'
import { useRuntimeConfig } from '#imports'

// Zod schema voor validatie
const StopSchema = z.object({
  name: z.string().min(3, 'Naam is te kort'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  start_time: z.string().datetime({ message: "Ongeldige start datum/tijd formaat (ISO 8601 verwacht)" }), // ISO 8601 format (bv. 2025-30-04T12:00:00Z)
  end_time: z.string().datetime({ message: "Ongeldige eind datum/tijd formaat (ISO 8601 verwacht)" }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ongeldige kleur formaat (bv. #FF0000)'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const session = await useSession(event, { password: config.sessionPassword })

  if (!session.data.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const validationResult = StopSchema.safeParse(body)

  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request - Validation Failed',
      message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
    })
  }

  // Zorg dat end_time na start_time is
  if (new Date(validationResult.data.end_time) <= new Date(validationResult.data.start_time)) {
     throw createError({
       statusCode: 400,
       statusMessage: 'Bad Request',
       message: 'Eindtijd moet na starttijd liggen.',
     })
  }


  const sql = getDbClient();
  const { name, latitude, longitude, start_time, end_time, color } = validationResult.data

  try {
    const [newStop] = await sql`
      INSERT INTO stops (name, latitude, longitude, start_time, end_time, color, is_manually_disabled)
      VALUES (${name}, ${latitude}, ${longitude}, ${start_time}, ${end_time}, ${color}, false)
      RETURNING *
    `;
    // Optioneel: Set status code to 201 Created
    event.node.res.statusCode = 201
    return newStop

  } catch (error: any) {
    console.error('Error creating stop:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Kon stop niet aanmaken.',
    })
  }
})