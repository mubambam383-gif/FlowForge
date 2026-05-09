import { handleOptions, setCorsHeaders } from '../../_lib/cors';
import { requireSupabaseAdmin } from '../../_lib/supabaseAdmin';

function normalizePath(pathParam: string | string[] | undefined) {
  if (!pathParam) return '/';
  const segments = Array.isArray(pathParam) ? pathParam : [pathParam];
  return `/${segments.filter(Boolean).join('/')}`;
}

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(res);

  const supabase = requireSupabaseAdmin(res);
  if (!supabase) return;

  const serverSlug = String(req.query.serverSlug || '');
  const endpointPath = normalizePath(req.query.path);
  const method = req.method;

  try {
    const { data: server, error: serverError } = await supabase
      .from('mock_servers')
      .select('id, is_active')
      .eq('slug', serverSlug)
      .single();

    if (serverError || !server) {
      return res.status(404).json({ error: 'Mock server not found' });
    }

    if (!server.is_active) {
      return res.status(403).json({ error: 'Mock server is inactive' });
    }

    const { data: endpoint, error: endpointError } = await supabase
      .from('mock_endpoints')
      .select('*')
      .eq('mock_server_id', server.id)
      .eq('path', endpointPath)
      .eq('method', method)
      .single();

    if (endpointError || !endpoint) {
      return res.status(404).json({
        error: 'No endpoint defined for this path and method',
        suggestion: 'Use the Mock Server dashboard to add this route.',
      });
    }

    if (endpoint.delay_ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, endpoint.delay_ms));
    }

    if (endpoint.response_headers) {
      Object.entries(endpoint.response_headers).forEach(([key, value]) => {
        res.setHeader(key, String(value));
      });
    }

    return res.status(endpoint.response_status || 200).json(endpoint.response_body || {});
  } catch (error) {
    console.error('[MockServer] Error:', error);
    return res.status(500).json({ error: 'Internal server error in Mock Engine' });
  }
}
