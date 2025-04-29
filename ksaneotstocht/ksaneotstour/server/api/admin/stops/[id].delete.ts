import { defineEventHandler, createError, getRouterParam } from 'h3'
import { useSession } from 'h3'
import { getDbClient } from '~/server/utils/db'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const session = await useSession(event, { password: config.sessionPassword })

  if (!session.data.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }


  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Ongeldig ID.' })
  }

  const sql = getDbClient()

  try {
    const result = await sql`
      DELETE FROM stops
      WHERE id = ${id}
      RETURNING id -- Check of er iets verwijderd is
    `

    // Check postgres delete count of RETURNING result
    if (result.count === 0) {
       throw createError({ statusCode: 404, statusMessage: 'Not Found', message: `Stop met ID ${id} niet gevonden.` })
    }

    // Stuur een succes response zonder body (status 204 No Content)
    event.node.res.statusCode = 204
    return null // of return { success: true }; met status 200 OK

  } catch (error: any) {
     if (error.statusCode === 404) throw error // Rethrow Not Found error
    console.error(`Error deleting stop ${id}:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Kon stop niet verwijderen.',
    })
  }
})