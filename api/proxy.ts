import { handleOptions, setCorsHeaders } from './_lib/cors';
import { handleProxyRequest } from './_lib/proxyHandler';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const result = await handleProxyRequest(req.body);
  return res.status(result.statusCode).json(result.body);
}
