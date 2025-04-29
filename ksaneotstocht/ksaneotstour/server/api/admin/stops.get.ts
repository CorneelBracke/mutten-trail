import { defineEventHandler, createError } from 'h3'
import { useSession } from 'h3'
import { getDbClient } from '~/server/utils/db'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const session = await useSession(event, { password: config.sessionPassword })

  if (!session.data.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }


  const sql = getDbClient()

  try {
    const stops = await sql`
      SELECT * FROM stops ORDER BY start_time DESC
    `;
    return stops;
  } catch (error: any) {
    console.error('Error fetching all stops for admin:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})