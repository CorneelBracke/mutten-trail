import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { useSession } from 'h3'
import { z } from 'zod'
import { getDbClient } from '~/server/utils/db'
import { useRuntimeConfig } from '#imports'

const ToggleSchema = z.object({
    is_manually_disabled: z.boolean(),
})

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const session = await useSession(event, { password: config.sessionPassword })

    if (!session.data.isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    // haal id op uit de URL parameters
    const idParam = getRouterParam(event, 'id')
    if (!idParam || isNaN(Number(idParam))) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Ongeldig of ontbrekend ID.' })
    }
    // zet id om naar een getal
    const id = Number(idParam)
    if (id <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'ID moet een positief getal zijn.' })
    }
    // Kijk of id een geldig getal is
    if (isNaN(id) || id <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Ongeldig ID.' })
    }

    const body = await readBody(event)
    const validationResult = ToggleSchema.safeParse(body)

    if (!validationResult.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request - Validation Failed',
            message: validationResult.error.errors.map(e => e.message).join(', '),
        })
    }

    const sql = getDbClient()
    const { is_manually_disabled } = validationResult.data

    try {
        const [updatedStop] = await sql`
      UPDATE stops
      SET is_manually_disabled = ${is_manually_disabled}
      WHERE id = ${id}
      RETURNING id, is_manually_disabled, name -- return wat nuttig is
    `

        if (!updatedStop) {
            throw createError({ statusCode: 404, statusMessage: 'Not Found', message: `Stop met ID ${id} niet gevonden.` })
        }

        return updatedStop

    } catch (error: any) {
        if (error.statusCode === 404) throw error
        console.error(`Error updating stop ${id}:`, error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: 'Kon stop status niet aanpassen.',
        })
    }
})