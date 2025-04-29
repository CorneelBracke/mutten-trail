// server/api/admin/auth.post.ts
import { defineEventHandler, readBody, createError, H3Error } from 'h3'
import { useSession } from 'h3'
import { z } from 'zod'
import { useRuntimeConfig } from '#imports'

const LoginSchema = z.object({
  password: z.string().min(1, 'Wachtwoord is vereist'),
});

export default defineEventHandler(async (event) => {
  console.log(`>>> [auth.post] Received login request at ${new Date().toISOString()}`);
  const config = useRuntimeConfig();
  let body: any;

  // --- Check Config ---
  if (!config.adminSecret || !config.sessionPassword) {
     console.error(">>> [auth.post] FATAL: Missing adminSecret or sessionPassword in runtime config!");
     throw createError({ statusCode: 500, statusMessage: 'Server Configuration Error' });
  }
  if (config.sessionPassword.length < 32) {
     console.error(`>>> [auth.post] FATAL: NUXT_SESSION_PASSWORD is too short (${config.sessionPassword.length} chars)! Must be at least 32 characters.`);
     throw createError({ statusCode: 500, statusMessage: 'Server Configuration Error' });
  }
  // --- End Check Config ---

  try {
      body = await readBody(event);
  } catch (error: any) {
       console.error(">>> [auth.post] Error reading request body:", error);
       throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Kon request body niet lezen.' });
  }

  const validationResult = LoginSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
    console.warn(`>>> [auth.post] Login validation failed: ${errorMessage}`);
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: errorMessage,
    });
  }

  const { password } = validationResult.data;

  if (password === config.adminSecret) {
    console.log('>>> [auth.post] Admin password correct, attempting to set session...');
    try {
      const session = await useSession(event, {
        password: config.sessionPassword,
        maxAge: 60 * 60 * 8, // 8 hours
        name: 'neots-ksa-admin-session', // Consistent name
      });
      console.log(`>>> [auth.post] Session object obtained. Current data BEFORE update:`, JSON.stringify(session.data));

      await session.update({ isAdmin: true, loggedInAt: Date.now() });

      // !! BELANGRIJK !! Controleer de data DIRECT na het updaten
      console.log(`>>> [auth.post] Session updated attempt finished. Session data AFTER update:`, JSON.stringify(session.data));

      // Stuur succes response
      return { success: true, message: 'Ingelogd' };

    } catch (sessionError: any) {
       console.error(`>>> [auth.post] CRITICAL ERROR during session creation/update:`, sessionError);
       // Log de specifieke fout van iron-session/webcrypto
       if (sessionError.message) {
           console.error(`>>> [auth.post] Session Error Message: ${sessionError.message}`);
       }
       throw createError({ statusCode: 500, statusMessage: 'Session Error', message: 'Kon sessie niet aanmaken/bijwerken.' });
    }

  } else {
    console.warn(`>>> [auth.post] Invalid password attempt.`);
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Ongeldig wachtwoord',
    });
  }
});