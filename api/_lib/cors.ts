export function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Simulation');
}

export function handleOptions(req: any, res: any) {
  if (req.method !== 'OPTIONS') return false;
  setCorsHeaders(res);
  res.status(204).end();
  return true;
}
