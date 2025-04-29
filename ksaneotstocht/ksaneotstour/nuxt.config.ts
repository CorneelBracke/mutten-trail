export default defineNuxtConfig({

  runtimeConfig: {
    // Keys only available server-side
    sessionPassword: process.env.NUXT_SESSION_PASSWORD, // Zeer belangrijk! Stel in Vercel in.
    adminSecret: process.env.ADMIN_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,

    public: {
      supabaseUrl: process.env.SUPABASE_URL,
    }
  },

})