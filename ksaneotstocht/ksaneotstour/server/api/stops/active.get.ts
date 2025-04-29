import { defineEventHandler, createError } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#imports' // Still needed inside

// NO top-level client initialization or config access here

export default defineEventHandler(async (event) => {
  // Access config and initialize client INSIDE the handler
  const config = useRuntimeConfig(event); // Pass event for Nuxt 3 context if needed/available
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  // Check credentials
  if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials are missing!');
      throw createError({
          statusCode: 500,
          statusMessage: "Server Configuration Error",
          message: "Supabase credentials missing",
      })
  }

  // Create client per request (or use a cached instance if implementing more complex utils)
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('stops')
      .select('id, name, latitude, longitude, color')
      .lte('start_time', now) // Check if stop has started
      .gte('end_time', now)   // Check if stop has not ended
      .eq('is_manually_disabled', false)
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error fetching active stops:', error)
      // Rethrowing as a generic error, specific handling might be better
      throw createError({
        statusCode: 500, // Or map Supabase errors (e.g., 404 if table not found)
        statusMessage: 'Database Error',
        message: `Database query failed: ${error.message}`, // Include DB error message
      })
    }

    return data;

  } catch (error: any) {
    // Catch errors from createError above or other unexpected errors
    console.error('Handler error fetching active stops:', error)

    // Avoid creating another error if it's already an H3Error
    if (error.statusCode) {
         throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Kon actieve stops niet ophalen door een onverwachte serverfout.',
    })
  }
})