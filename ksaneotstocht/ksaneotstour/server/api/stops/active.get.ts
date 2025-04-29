// server/api/stops/active.get.ts
import { defineEventHandler, createError } from 'h3'
import { getDbClient } from '~/server/utils/db'; // Pas pad aan indien nodig

export default defineEventHandler(async (event) => {
  const sql = getDbClient()

  try {
    const stops = await sql`
      SELECT
        id,
        name,
        latitude,
        longitude,
        color
      FROM stops
      WHERE
        now() BETWEEN start_time AND end_time
        AND is_manually_disabled = false
      ORDER BY name ASC
    `;

    return stops;

  } catch (error: any) {
    console.error('Error fetching active stops:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Kon actieve stops niet ophalen.',
    })
  }
})