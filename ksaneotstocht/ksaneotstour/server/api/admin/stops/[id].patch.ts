// server/api/admin/stops/[id].patch.ts
import { defineEventHandler, readBody, createError, getRouterParam, H3Error } from 'h3'
import { useSession } from 'h3'
import { z } from 'zod'
import { getDbClient } from '~/server/utils/supabase'
import { useRuntimeConfig } from '#imports'

// Validatie voor de toggle status (of algemeenere update)
const UpdateSchema = z.object({
  // Maak velden optioneel voor PATCH
  name: z.string().min(3, 'Naam is te kort').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  start_time: z.string().datetime({ message: "Ongeldige start datum/tijd formaat" }).optional(),
  end_time: z.string().datetime({ message: "Ongeldige eind datum/tijd formaat" }).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ongeldige kleur formaat').optional(),
  is_manually_disabled: z.boolean().optional(), // Voor de toggle
});

export default defineEventHandler(async (event) => {
  const routePath = event.path; // Gebruik event.path voor logging
  console.log(`>>> [${routePath}] Received request at ${new Date().toISOString()}`);
  const config = useRuntimeConfig();
  let sessionData: any = {};
  let body: any;

  // --- Check Config ---
  if (!config.sessionPassword) {
     console.error(`>>> [${routePath}] FATAL: Missing sessionPassword in runtime config!`);
     throw createError({ statusCode: 500, statusMessage: 'Server Configuration Error' });
  }
  // --- End Check Config ---

  // --- Lees en Controleer Sessie ---
  try {
      const session = await useSession(event, {
          password: config.sessionPassword,
          name: 'neots-ksa-admin-session'
      });
      sessionData = session.data;
      console.log(`>>> [${routePath}] Read session data:`, JSON.stringify(sessionData));

      // --- Authenticatie Check ---
      if (!sessionData?.isAdmin) {
          console.error(`>>> [${routePath}] Forbidden check failed! isAdmin flag is missing or false. Session data was: ${JSON.stringify(sessionData)}`);
          throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
      }
      console.log(`>>> [${routePath}] Auth check passed. User is admin.`);
      // --- Einde Authenticatie Check ---
  } catch (sessionError: any) {
       console.error(`>>> [${routePath}] CRITICAL ERROR reading session:`, sessionError);
        if (sessionError.message) { console.error(`>>> [${routePath}] Session Error Message: ${sessionError.message}`); }
       throw createError({ statusCode: 500, statusMessage: 'Session Read Error', message: 'Kon sessie niet lezen/ontsleutelen.' });
  }
  // --- Einde Lees en Controleer Sessie ---

  // Haal ID op en valideer
  const idParam = getRouterParam(event, 'id');
  const id = Number(idParam);
  if (isNaN(id) || id <= 0) {
    console.warn(`>>> [${routePath}] Invalid ID received: ${idParam}`);
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Ongeldig Stop ID.' });
  }

  // Lees en valideer body
  try {
      body = await readBody(event);
  } catch (error: any) {
       console.error(`>>> [${routePath}] Error reading request body:`, error);
       throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Kon request body niet lezen.' });
  }

  const validationResult = UpdateSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    console.warn(`>>> [${routePath}] Validation failed: ${errorMessage}`);
    throw createError({ statusCode: 400, statusMessage: 'Bad Request - Validation Failed', message: errorMessage });
  }

  const dataToUpdate = validationResult.data;
  if (Object.keys(dataToUpdate).length === 0) {
      console.warn(`>>> [${routePath}] Empty update payload received.`);
      throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Geen data om te updaten meegegeven.' });
  }

   // Extra validatie: check end_time > start_time als beide worden meegegeven
   if (dataToUpdate.start_time && dataToUpdate.end_time && new Date(dataToUpdate.end_time) <= new Date(dataToUpdate.start_time)) {
       console.warn(`>>> [${routePath}] Validation failed: End time not after start time.`);
      throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Eindtijd moet na starttijd liggen.'});
   }


  // Voer update uit
  const supabase = getDbClient();
  try {
    console.log(`>>> [${routePath}] Attempting to update stop ID ${id} with:`, JSON.stringify(dataToUpdate));
    const { data: updatedStop, error: dbError } = await supabase
      .from('stops')
      .update(dataToUpdate)
      .eq('id', id)
      .select() // Geef geüpdatete record terug
      .single(); // Verwacht één record

    if (dbError) {
      // Check specifiek voor 'rij niet gevonden' fouten (bv. P0002 in Supabase?)
       if (dbError.code === 'PGRST116') { // Voorbeeld code, check Supabase docs voor juiste code bij .single() not found
           console.warn(`>>> [${routePath}] Stop with ID ${id} not found for update.`);
           throw createError({ statusCode: 404, statusMessage: 'Not Found', message: `Stop met ID ${id} niet gevonden.` });
       }
      console.error(`>>> [${routePath}] Supabase DB error during update:`, dbError);
      throw createError({ statusCode: 500, statusMessage: 'Database Update Error', message: `Databasefout bij bijwerken: ${dbError.message}` });
    }
     if (!updatedStop) { // Fallback check als .single() null teruggeeft zonder error
         console.warn(`>>> [${routePath}] Stop with ID ${id} not found for update (no data returned).`);
         throw createError({ statusCode: 404, statusMessage: 'Not Found', message: `Stop met ID ${id} niet gevonden.` });
     }

    console.log(`>>> [${routePath}] Successfully updated stop ID ${id}.`);
    return updatedStop;

  } catch (error: any) {
     console.error(`>>> [${routePath}] Error during database update phase for ID ${id}:`, error);
     if (error.statusCode && error.statusMessage) { throw error; } // Gooi H3/createError fouten opnieuw
     throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: 'Kon stop niet bijwerken in database.' });
  }
});