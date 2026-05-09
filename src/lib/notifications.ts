import { supabase } from './supabase';

export async function createNotification(userId: string, title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', metadata?: any) {
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    metadata: metadata || null,
  });
}

export function downloadTextFile(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: Record<string, any>[]) {
  if (rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const escape = (value: any) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [
    keys.join(','),
    ...rows.map((row) => keys.map((key) => escape(row[key])).join(',')),
  ].join('\n');
}
