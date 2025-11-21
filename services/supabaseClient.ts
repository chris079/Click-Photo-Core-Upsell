const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const getHeaders = () => ({
  apikey: SUPABASE_ANON_KEY || '',
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
});

const buildUrl = (path: string) => {
  if (!SUPABASE_URL) throw new Error('Supabase URL missing');
  return `${SUPABASE_URL}${path}`;
};

export const supabaseRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: Record<string, any>
): Promise<T> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || response.statusText || 'Unknown Supabase error';
    throw new Error(message);
  }

  return data as T;
};

export const fetchSingle = async <T>(table: string, filters: Record<string, string | number>, select = '*') => {
  const params = new URLSearchParams({ select, limit: '1' });
  Object.entries(filters).forEach(([key, value]) => {
    params.set(key, `eq.${value}`);
  });

  const data = await supabaseRequest<T[]>(
    'GET',
    `/rest/v1/${table}?${params.toString()}`
  );
  return Array.isArray(data) ? data[0] : undefined;
};

export const insertRow = async <T>(table: string, payload: Record<string, any>) => {
  return supabaseRequest<T>('POST', `/rest/v1/${table}`, payload);
};
