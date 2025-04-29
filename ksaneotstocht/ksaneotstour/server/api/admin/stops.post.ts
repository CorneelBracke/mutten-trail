// server/api/admin/stops.post.ts (met extra logging)
import { defineEventHandler, readBody, createError, H3Error } from 'h3'
import { useSession } from 'h3'
import { z } from 'zod'
import { getDbClient } from '~/server/utils/supabase' // Zorg dat dit pad correct is
import { useRuntimeConfig } from '#imports'

// Zod schema voor validatie (zorg dat dit overeenkomt met je StopFormData type)
const StopSchema = z.object({
  name: z.string().min(3, 'Naam is te kort'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  // Zorg dat je frontend datetime-local strings stuurt (YYYY-MM-DDTHH:mm)
  start_time: z.string().datetime({ message: "Ongeldige start datum/tijd formaat (ISO 8601 verwacht)" }),
  end_time: z.string().datetime({ message: "Ongeldige eind datum/tijd formaat (ISO 8601 verwacht)" }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ongeldige kleur formaat (bv. #FF0000)'),
});

export default defineEventHandler(async (event) => {
  console.log(`>>> [/api/admin/stops.post] Received request at ${new Date().toISOString()}`);
  const config = useRuntimeConfig();
  let sessionData: any = {};
  let body: any;

  // --- Check Config ---
  if (!config.sessionPassword) {
    console.error(">>> [/api/admin/stops.post] FATAL: Missing sessionPassword in runtime config!");
    throw createError({ statusCode: 500, statusMessage: 'Server Configuration Error' });
  }
  // --- End Check Config ---

  // --- Lees en Controleer Sessie ---
  try {
      const session = await useSession(event, {
          password: config.sessionPassword,
          name: 'neots-ksa-admin-session' // Gebruik consistente naam
      });
      sessionData = session.data;
      // !! BELANGRIJKE LOG !!: Wat ziet de server als sessie data?
      console.log(`>>> [/api/admin/stops.post] Read session data:`, JSON.stringify(sessionData));

      // --- Authenticatie Check ---
      if (!sessionData?.isAdmin) {
          console.error(`>>> [/api/admin/stops.post] Forbidden check failed! isAdmin flag is missing or false in session data. Session data was: ${JSON.stringify(sessionData)}`);
          throw createError({ statusCode: 403, statusMessage: 'Forbidden' }); // Gooi 403
      }
      console.log(`>>> [/api/admin/stops.post] Auth check passed. User is admin.`);
      // --- Einde Authenticatie Check ---

  } catch (sessionError: any) {
      // Vang fouten bij het lezen/ontsleutelen van de sessie
       console.error(`>>> [/api/admin/stops.post] CRITICAL ERROR reading session:`, sessionError);
        if (sessionError.message) {
           console.error(`>>> [/api/admin/stops.post] Session Error Message: ${sessionError.message}`);
       }
       // Gooi 500 als sessie lezen faalt, niet 403
       throw createError({ statusCode: 500, statusMessage: 'Session Read Error', message: 'Kon sessie niet lezen/ontsleutelen.' });
  }
  // --- Einde Lees en Controleer Sessie ---

  // Als we hier komen, is de gebruiker geauthenticeerd. Verwerk de POST data.
  try {
      body = await readBody(event);
  } catch (error: any) {
       console.error(">>> [/api/admin/stops.post] Error reading request body:", error);
       throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Kon request body niet lezen.' });
  }

  // Valideer de ontvangen data
  const validationResult = StopSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    console.warn(`>>> [/api/admin/stops.post] Validation failed: ${errorMessage}`);
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request - Validation Failed',
      message: errorMessage,
    });
  }

  // Extra validatie: check end_time > start_time
  if (new Date(validationResult.data.end_time) <= new Date(validationResult.data.start_time)) {
      console.warn(`>>> [/api/admin/stops.post] Validation failed: End time not after start time.`);
     throw createError({
       statusCode: 400,
       statusMessage: 'Bad Request',
       message: 'Eindtijd moet na starttijd liggen.',
     });
  }

  // Haal Supabase client op
  const supabase = getDbClient();
  const { name, latitude, longitude, start_time, end_time, color } = validationResult.data;

  // Voeg toe aan database
  try {
    console.log(`>>> [/api/admin/stops.post] Attempting to insert stop:`, JSON.stringify(validationResult.data));
    const { data: newStop, error: dbError } = await supabase
      .from('stops')
      .insert({ name, latitude, longitude, start_time, end_time, color, is_manually_disabled: false })
      .select() // Geef de gemaakte record terug
      .single(); // Verwacht één record

    if (dbError) {
      console.error(`>>> [/api/admin/stops.post] Supabase DB error during insert:`, dbError);
      throw createError({ statusCode: 500, statusMessage: 'Database Insert Error', message: `Databasefout bij aanmaken: ${dbError.message}` });
    }

    console.log(`>>> [/api/admin/stops.post] Successfully inserted stop with ID: ${newStop?.id}`);
    event.node.res.statusCode = 201; // Set status to 201 Created
    return newStop;

  } catch (error: any) {
     // Vang alle andere fouten tijdens DB interactie
     console.error('>>> [/api/admin/stops.post] Error during database insert phase:', error);
     if (error.statusCode && error.statusMessage) { throw error; } // Gooi H3 errors opnieuw
     throw createError({
       statusCode: 500,
       statusMessage: 'Internal Server Error',
       message: 'Kon stop niet aanmaken in database.',
     });
  }
});