// apps/web/lib/supabase.server.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * NOTE:
 * - Previously we threw at import time when envs were missing. That causes Next to fail
 *   during build/static analysis (collecting page data) when those variables are not present.
 * - Now we create the client using safe fallbacks and log a warning. This prevents the
 *   build from crashing during module evaluation while you ensure platform envs are set.
 *
 * Important: API calls will still fail if the correct env vars are not configured in your
 * hosting provider. Make sure to set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 * in Netlify/Vercel (and add them to turbo.json tasks.env which we updated above).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!url || !serviceKey) {
  // do not throw — warn so build won't crash during static evaluation
  // but make the issue obvious in logs
  // (replace console.warn with a logger if you use one)
  console.warn(
    '[supabase.server] Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. ' +
      'Create these env vars in your deployment platform (Netlify/Vercel) and add them to turbo.json tasks.env. ' +
      'API routes that rely on supabaseAdmin will fail at runtime until this is fixed.'
  )
}

/**
 * Create a Supabase admin client. If envs are empty strings we still create a client
 * (calls will fail) but we avoid throwing at import time.
 */
export const supabaseAdmin: SupabaseClient = createClient(url, serviceKey)








// // apps/web/lib/supabase.server.ts
// import { createClient, SupabaseClient } from '@supabase/supabase-js'

// const url = process.env.NEXT_PUBLIC_SUPABASE_URL
// const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// if (!url || !serviceKey) {
//   throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
// }

// export const supabaseAdmin: SupabaseClient = createClient(url, serviceKey)
