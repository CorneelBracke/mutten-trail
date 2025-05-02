// server/api/admin/scoreboard.post.ts
// Voegt een nieuwe groep toe of update de score van een bestaande groep (Upsert)
import { defineEventHandler, readBody, createError } from 'h3'
import { useSession } from 'h3'
import { z } from 'zod'
import { getDbClient } from '~/server/utils/supabase'
import { useRuntimeConfig } from '#imports'

// Zod schema voor validatie
const ScoreSchema = z.object({
  group_name: z.string().min(1, 'Groepsnaam is vereist').trim(),
  score: z.number().int('Score moet een geheel getal zijn.'), // Accepteer nu nummers
});

export default defineEventHandler(async (event) => {
  const routePath = event.path;
  console.log(`>>> [${routePath}] Received request at ${new Date().toISOString()}`);
  const config = useRuntimeConfig();
  let sessionData: any = {};
  let body: any;

  // --- Sessie Check (zelfde als andere admin routes) ---
  try {
    const session = await useSession(event, { password: config.sessionPassword, name: 'neots-ksa-admin-session' });
    sessionData = session.data;
    console.log(`>>> [${routePath}] Read session data:`, JSON.stringify(sessionData));
    if (!sessionData?.isAdmin) {
      console.error(`>>> [${routePath}] Forbidden check failed! isAdmin flag missing/false. Session was: ${JSON.stringify(sessionData)}`);
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }
    console.log(`>>> [${routePath}] Auth check passed.`);
  } catch (sessionError: any) {
    console.error(`>>> [${routePath}] CRITICAL ERROR reading session:`, sessionError);
    throw createError({ statusCode: 500, statusMessage: 'Session Read Error', message: 'Kon sessie niet lezen.' });
  }
  // --- Einde Sessie Check ---

  // Lees en valideer body
  try {
      body = await readBody(event);
  } catch (error: any) {
       console.error(`>>> [${routePath}] Error reading request body:`, error);
       throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Kon request body niet lezen.' });
  }

  // Converteer score naar nummer als het een string is (vanuit formulier)
   if (body.score && typeof body.score === 'string') {
       body.score = parseInt(body.score, 10);
       if (isNaN(body.score)) {
            throw createError({statusCode: 400, statusMessage: 'Bad Request', message: 'Score moet een geldig getal zijn.'});
       }
   }


  const validationResult = ScoreSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    console.warn(`>>> [${routePath}] Validation failed: ${errorMessage}`);
    throw createError({ statusCode: 400, statusMessage: 'Bad Request - Validation Failed', message: errorMessage });
  }

  // Voer Upsert uit (Update or Insert)
  const supabase = getDbClient();
  const { group_name, score } = validationResult.data;

  try {
    console.log(`>>> [${routePath}] Attempting to upsert score for group "${group_name}" to ${score}`);
    const { data: upsertedScore, error: dbError } = await supabase
      .from('scoreboard')
      .upsert(
        { group_name: group_name, score: score }, // Data om in te voegen/updaten
        { onConflict: 'group_name' } // Als group_name al bestaat, update die rij
      )
      .select() // Geef de (geüpdatete) rij terug
      .single(); // Verwacht één resultaat

    if (dbError) {
      console.error(`>>> [${routePath}] Supabase DB error during upsert:`, dbError);
      throw createError({ statusCode: 500, statusMessage: 'Database Upsert Error', message: `Databasefout: ${dbError.message}` });
    }

    console.log(`>>> [${routePath}] Successfully upserted score for group: ${upsertedScore?.group_name}`);
    event.node.res.statusCode = 200; // OK (of 201 als je specifiek weet dat het nieuw was)
    return upsertedScore;

  } catch (error: any) {
     console.error(`>>> [${routePath}] Error during database upsert phase for group "${group_name}":`, error);
     if (error.statusCode) { throw error; } // Gooi H3 errors opnieuw
     throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: 'Kon score niet opslaan in database.' });
  }
});