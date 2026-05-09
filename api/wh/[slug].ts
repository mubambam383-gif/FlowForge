import { handleOptions, setCorsHeaders } from '../_lib/cors';
import { requireSupabaseAdmin } from '../_lib/supabaseAdmin';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(res);

  const supabase = requireSupabaseAdmin(res);
  if (!supabase) return;

  const slug = String(req.query.slug || '');

  try {
    if (slug.startsWith('user-')) {
      const userId = slug.replace('user-', '');

      const { error } = await supabase.from('webhook_events').insert({
        user_id: userId,
        payload: {
          method: req.method,
          headers: req.headers,
          body: req.body,
        },
        source: req.headers['x-simulation'] || 'default',
      });

      if (error) throw error;
    }

    return res.status(200).json({ status: 'received', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Supabase write error in webhook:', error);
    return res.status(500).json({ error: 'Failed to record webhook event.' });
  }
}
