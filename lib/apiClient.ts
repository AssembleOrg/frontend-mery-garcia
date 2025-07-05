// === Configuración de endpoint ===
// El valor debe establecerse en un archivo .env.local o variable de entorno
// NEXT_PUBLIC_API_URL=https://mi-backend/api
let BASE_URL: string | undefined = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error(
    '❌ NEXT_PUBLIC_API_URL no está definido. Crea un .env.local con NEXT_PUBLIC_API_URL=https://...'
  );
}

// En este punto BASE_URL está garantizado
BASE_URL = BASE_URL as string;

type FetchOptions = Omit<RequestInit, 'method' | 'body'> & {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  json?: unknown; // cuerpo como JSON
};

/**
 * Helper minimalista sobre fetch.
 * Aplica BASE_URL, Authorization y serializa json.
 */
export async function apiFetch<T = unknown>(
  path: string,
  { method = 'GET', json, headers, ...init }: FetchOptions = {}
): Promise<T> {
  const url = `${BASE_URL!.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: json ? JSON.stringify(json) : undefined,
    ...init,
  });

  // Status 204 (No Content) or 304 (Not Modified) – nothing que parsear
  if (response.status === 204 || response.status === 304) {
    return undefined as T;
  }

  if (!response.ok) {
    // Intentar parsear mensaje de error JSON
    let message: string | undefined;
    try {
      const data = await response.json();
      message = data?.message || JSON.stringify(data);
    } catch {
      message = response.statusText;
    }
    throw new Error(`API ${response.status}: ${message}`);
  }

  // Intentar devolver JSON; si no hay cuerpo, devolver void 0
  return (await response.json()) as T;
}
