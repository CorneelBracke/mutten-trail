// server/api/admin/scoreboard/[id].patch.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { useSession } from 'h3'
import { z } from 'zod'
import { getDbClient } from '~/server/utils/supabase'
import { useRuntimeConfig } from '#imports'

// Schema voor enkel de score update
const ScoreUpdateSchema = z.object({
  score: z.number().int('Score moet een geheel getal zijn.'),
});

export default defineEventHandler(async (event) => {
  const routePath = event.path;
  console.log(`>>> [${routePath}] Received PATCH request at ${new Date().toISOString()}`);
  const config = useRuntimeConfig();
  let sessionData: any = {};
  let body: any;

  // --- Sessie Check ---
  try {
    const session = await useSession(event, { password: config.sessionPassword, name: 'neots-ksa-admin-session' });
    sessionData = session.data;
    console.log(`>>> [${routePath}] Read session data:`, JSON.stringify(sessionData));
    if (!sessionData?.isAdmin) {
      console.error(`>>> [${routePath}] Forbidden check failed! isAdmin missing/false.`);
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }
    console.log(`>>> [${routePath}] Auth check passed.`);
  } catch (sessionError: any) {
    console.error(`>>> [${routePath}] CRITICAL ERROR reading session:`, sessionError);
    throw createError({ statusCode: 500, statusMessage: 'Session Read Error' });
  }
  // --- Einde Sessie Check ---

  // Haal ID op
  const idParam = getRouterParam(event, 'id');
  const id = Number(idParam);
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Ongeldig Scoreboard ID.' });
  }

  // Lees en valideer body
  try {
      body = await readBody(event);
  } catch (error: any) {
       throw createError({ statusCode: 400, message: 'Kon request body niet lezen.' });
  }

   // Converteer score naar nummer indien nodig
   if (body.score && typeof body.score === 'string') {
       body.score = parseInt(body.score, 10);
       if (isNaN(body.score)) {
            throw createError({statusCode: 400, message: 'Score moet een geldig getal zijn.'});
       }
   }


  const validationResult = ScoreUpdateSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.errors.map(e => e.message).join(', ');
    throw createError({ statusCode: 400, message: `Validatiefout: ${errorMsg}` });
  }

  const { score } = validationResult.data;
  const supabase = getDbClient();

  // Voer update uit
  try {
    console.log(`>>> [${routePath}] Attempting to update score for ID ${id} to ${score}`);
    const { data: updatedScore, error: dbError } = await supabase
      .from('scoreboard')
      .update({ score: score }) // Update score en updated_at
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') { // Rij niet gevonden
         throw createError({ statusCode: 404, message: `Score entry met ID ${id} niet gevonden.` });
      }
      console.error(`>>> [${routePath}] Supabase DB error during update:`, dbError);
      throw createError({ statusCode: 500, message: `Databasefout: ${dbError.message}` });
    }
    if (!updatedScore) { // Fallback
         throw createError({ statusCode: 404, message: `Score entry met ID ${id} niet gevonden.` });
    }

    console.log(`>>> [${routePath}] Successfully updated score for ID ${id}.`);
    return updatedScore;

  } catch (error: any) {
     console.error(`>>> [${routePath}] Error during database update phase for ID ${id}:`, error);
     if (error.statusCode) { throw error; }
     throw createError({ statusCode: 500, message: 'Kon score niet bijwerken.' });
  }
});