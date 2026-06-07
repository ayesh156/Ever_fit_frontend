const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const isFormData = body instanceof FormData;
  const mergedHeaders = { ...options.headers };
  if (isFormData) {
    delete mergedHeaders['Content-Type'];
  } else if (!mergedHeaders['Content-Type']) {
    mergedHeaders['Content-Type'] = 'application/json';
  }
  const config: RequestInit = {
    method,
    headers: mergedHeaders as Record<string, string>,
    signal: options.signal,
  };

  if (body !== undefined) {
    config.body = isFormData ? body as FormData : JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody || response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, 'GET', undefined, options);
}

export function post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, 'POST', body, options);
}

export function put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, 'PUT', body, options);
}

export function patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, 'PATCH', body, options);
}

export function del<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return request<T>(endpoint, 'DELETE', undefined, options);
}
