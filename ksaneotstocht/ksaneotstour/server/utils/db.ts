import postgres from 'postgres'
import { useRuntimeConfig } from '#imports'

let sql: postgres.Sql | null = null

export function getDbClient() {
  if (!sql) {
    const config = useRuntimeConfig()
    if (!config.databaseUrl) {
      throw new Error('Database URL is not configured in runtimeConfig')
    }
    // Configureer extra opties indien nodig (bv. SSL, timeouts)
    // Voor Vercel/Supabase is ssl: 'require' vaak nodig. Check Supabase docs.
    // Vercel injecteert soms direct POSTGRES_URL etc, je kan die ook gebruiken.
    const dbUrl = config.databaseUrl
     console.log("Attempting to connect to DB...")
    try {
       sql = postgres(dbUrl, {
         // ssl: 'require', // Uncomment indien nodig voor Supabase/Neon/etc.
         connect_timeout: 10, // Timeout van 10 seconden
         // idle_timeout: 20, // Timeout na 20s inactiviteit
         // max: 1 // Beperk connecties in serverless (belangrijk!)
       });
       console.log("DB client initialized.");
     } catch (error) {
       console.error("Failed to initialize DB client:", error)
       throw error; // Rethrow or handle appropriately
     }
  }
  return sql
}