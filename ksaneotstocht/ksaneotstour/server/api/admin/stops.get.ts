// server/api/admin/stops.get.ts
import { defineEventHandler, createError, H3Error } from 'h3'
import { useSession } from 'h3'
import { getDbClient } from '~/server/utils/supabase' // Gebruik de Supabase client helper
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  console.log(`>>> [/api/admin/stops.get] Received request at ${new Date().toISOString()}`);
  const config = useRuntimeConfig();
  let sessionData: any = {};

  // --- Check Config ---
  if (!config.sessionPassword) {
     console.error(">>> [/api/admin/stops.get] FATAL: Missing sessionPassword in runtime config!");
     throw createError({ statusCode: 500, statusMessage: 'Server Configuration Error' });
  }
  // --- End Check Config ---

  try {
      const session = await useSession(event, {
          password: config.sessionPassword,
          name: 'neots-ksa-admin-session' // Gebruik dezelfde naam als bij login!
      });
      sessionData = session.data; // Sla data op voor logging, zelfs bij error
      console.log(`>>> [/api/admin/stops.get] Read session data:`, JSON.stringify(sessionData));

      // --- Authenticatie Check ---
      if (!sessionData?.isAdmin) { // Veilige check met optional chaining (?.)
          console.error(`>>> [/api/admin/stops.get] Forbidden check failed! isAdmin flag is missing or false in session data. Session data was: ${JSON.stringify(sessionData)}`);
          throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
      }
      console.log(`>>> [/api/admin/stops.get] Auth check passed. User is admin.`);
      // --- Einde Authenticatie Check ---

  } catch (sessionError: any) {
       console.error(`>>> [/api/admin/stops.get] CRITICAL ERROR reading session:`, sessionError);
        if (sessionError.message) {
           console.error(`>>> [/api/admin/stops.get] Session Error Message: ${sessionError.message}`);
       }
       // Belangrijk: geef 500 terug als sessie lezen faalt, niet 403
       throw createError({ statusCode: 500, statusMessage: 'Session Read Error', message: 'Kon sessie niet lezen/ontsleutelen.' });
  }

  // Als we hier komen, is de gebruiker admin. Haal stops op.
  const supabase = getDbClient(); // Haal Supabase client op

  try {
    console.log(`>>> [/api/admin/stops.get] Fetching all stops from database...`);
    const { data: stops, error: dbError } = await supabase
      .from('stops')
      .select('*')
      .order('start_time', { ascending: false });

    if (dbError) {
      console.error(`>>> [/api/admin/stops.get] Supabase DB error:`, dbError);
      // Gooi een specifieke fout die we kunnen tonen
      throw createError({ statusCode: 500, statusMessage: 'Database Query Error', message: `Databasefout: ${dbError.message}` });
    }

    console.log(`>>> [/api/admin/stops.get] Successfully fetched ${stops?.length ?? 0} stops.`);
    return stops ?? []; // Geef lege array terug als data null is

  } catch (error: any) {
    // Vang fouten van createError hierboven of andere onverwachte fouten
    console.error('>>> [/api/admin/stops.get] Unexpected error during database fetch:', error);

    // Als het al een H3Error is, gooi die opnieuw
     if (error.statusCode && error.statusMessage) {
         throw error;
     }

    // Anders, maak een generieke 500
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Onverwachte fout bij ophalen van stops.',
    })
  }
})