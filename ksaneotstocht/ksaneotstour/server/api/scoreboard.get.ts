import { defineEventHandler, createError } from 'h3'
import { getDbClient } from '~/server/utils/supabase' // Zorg dat pad klopt

export default defineEventHandler(async (event) => {
  console.log(`>>> [/api/scoreboard.get] Received request at ${new Date().toISOString()}`);
  const supabase = getDbClient();

  try {
    const { data: scores, error: dbError } = await supabase
      .from('scoreboard')
      .select('id, group_name, score') // Selecteer benodigde velden
      .order('score', { ascending: false }) // Sorteer op score aflopend
      .order('group_name', { ascending: true }); // Alfabetisch bij gelijke score

    if (dbError) {
      console.error(`>>> [/api/scoreboard.get] Supabase DB error:`, dbError);
      throw createError({ statusCode: 500, statusMessage: 'Database Query Error', message: `Databasefout: ${dbError.message}` });
    }

    console.log(`>>> [/api/scoreboard.get] Successfully fetched ${scores?.length ?? 0} scores.`);
    return scores ?? [];

  } catch (error: any) {
     console.error(`>>> [/api/scoreboard.get] Unexpected error:`, error);
     if (error.statusCode) throw error; // Gooi H3 errors opnieuw
     throw createError({ statusCode: 500, statusMessage: 'Internal Server Error', message: 'Kon scoreboard niet ophalen.' });
  }
});