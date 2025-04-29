// server/api/admin/stops/[id].delete.ts
import { defineEventHandler, createError, getRouterParam, H3Error } from 'h3'
import { useSession } from 'h3'
import { getDbClient } from '~/server/utils/supabase'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const routePath = event.path;
  console.log(`>>> [${routePath}] Received request at ${new Date().toISOString()}`);
  const config = useRuntimeConfig();
  let sessionData: any = {};

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

  // Voer delete uit
  const supabase = getDbClient();
  try {
    console.log(`>>> [${routePath}] Attempting to delete stop ID ${id}...`);
    const { error: dbError, count } = await supabase
      .from('stops')
      .delete()
      .eq('id', id); // Verwijder op basis van ID

    if (dbError) {
      console.error(`>>> [${routePath}] Supabase DB error during delete for ID ${id}:`, dbError);
      throw createError({ statusCode: 500, statusMessage: 'Database Delete Error', message: `Databasefout bij verwijderen: ${dbError.message}` });
    }

    // Controleer of er wel iets verwijderd is
    // Supabase delete return .count = null als RLS voorkomt dat rijen worden gezien,
    // maar zou hier niet mogen gebeuren door service_role key of omdat auth check al slaagde.
    // Een count van 0 betekent dat de ID niet bestond.
    if (count === 0) {
        console.warn(`>>> [${routePath}] Stop with ID ${id} not found for deletion.`);
       throw createError({ statusCode: 404, statusMessage: 'Not Found', message: `Stop met ID ${id} niet gevonden.` });
    }


    console.log(`>>> [${routePath}] Successfully deleted stop ID ${id}.`);
    // Stuur een succes response zonder body
    event.node.res.statusCode = 204; // 204 No Content
    return null; // of return { success: true } met status 200

  } catch (error: any) {
    console.error(`>>> [${routePath}] Error during database delete phase for ID ${id}:`, error);
    if (error.statusCode && error.statusMessage) { throw error; } // Gooi H3/createError fouten opnieuw
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: 'Kon stop niet verwijderen uit database.' });
  }
});