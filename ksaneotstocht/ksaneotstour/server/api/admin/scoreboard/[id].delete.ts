import { defineEventHandler, getRouterParam, createError } from 'h3'
import { useSession } from 'h3'
import { getDbClient } from '~/server/utils/supabase'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const routePath = event.path;
  console.log(`>>> [${routePath}] Received DELETE request at ${new Date().toISOString()}`);
  const config = useRuntimeConfig();
  let sessionData: any = {};

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


  const idParam = getRouterParam(event, 'id');
  const id = Number(idParam);
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Ongeldig Scoreboard ID.' });
  }

  const supabase = getDbClient();
  try {
    console.log(`>>> [${routePath}] Attempting to delete score entry ID ${id}...`);
    const { error: dbError, count } = await supabase
      .from('scoreboard')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error(`>>> [${routePath}] Supabase DB error during delete for ID ${id}:`, dbError);
      throw createError({ statusCode: 500, message: `Databasefout: ${dbError.message}` });
    }

    if (count === 0) {
        console.warn(`>>> [${routePath}] Score entry with ID ${id} not found for deletion.`);
       throw createError({ statusCode: 404, message: `Score entry met ID ${id} niet gevonden.` });
    }

    console.log(`>>> [${routePath}] Successfully deleted score entry ID ${id}.`);
    event.node.res.statusCode = 204;
    return null;

  } catch (error: any) {
    console.error(`>>> [${routePath}] Error during database delete phase for ID ${id}:`, error);
    if (error.statusCode) { throw error; }
    throw createError({ statusCode: 500, message: 'Kon score entry niet verwijderen.' });
  }
});