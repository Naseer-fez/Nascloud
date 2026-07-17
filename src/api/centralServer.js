/**
 * Central Server API Module
 * 
 * Isolated module for all Central Server communication.
 * This file is the ONLY place that talks to the Central Server.
 * Easy to swap out when the Central Server API changes.
 * 
 * Uses raw fetch() — no dependency on api/client.js.
 */

class CentralServerError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'CentralServerError';
    this.status = status;
    this.payload = payload;
  }
}

const extractMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  return payload.message || payload.return || payload.error || fallback;
};

async function centralRequest(serverUrl, path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  const base = serverUrl.replace(/\/+$/g, '');
  const route = String(path || '').startsWith('/') ? path : `/${path}`;
  const url = `${base}${route}`;

  const requestHeaders = {
    'ngrok-skip-browser-warning': '69420',
    ...headers
  };
  if (body) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new CentralServerError(
      `Could not reach Central Server at ${base}`,
      0,
      { cause: error.message },
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    throw new CentralServerError(
      extractMessage(payload, 'Central Server request failed'),
      response.status,
      payload,
    );
  }

  return payload;
}

/**
 * Login to the Central Server.
 * @param {string} serverUrl - The Central Server URL
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<{api_key: string, code: string, server_url: string, userid: number}>}
 */
export async function centralLogin(serverUrl, username, password) {
  const response = await centralRequest(serverUrl, '/login/', {
    method: 'POST',
    body: { username, password },
  });

  return {
    api_key: response.api_key || '',
    code: response.code || '',
    server_url: response.server_url || '',
    userid: response.userid,
  };
}

/**
 * Register on the Central Server.
 * @param {string} serverUrl - The Central Server URL
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {string} [email] - Optional email
 * @returns {Promise<{api_key: string, code: string, server_url: string, userid: number}>}
 */
export async function centralRegister(serverUrl, username, password, email) {
  const body = { username, password };
  if (email) body.email = email;
  const response = await centralRequest(serverUrl, '/register/', {
    method: 'POST',
    body,
  });

  return {
    api_key: response.api_key || '',
    code: response.code || '',
    server_url: response.server_url || '',
    userid: response.userid,
  };
}

/**
 * Resolve the backend URL from the Central Server.
 * @param {string} serverUrl - The Central Server URL
 * @param {string} uniqueId - The unique identifier from login
 * @returns {Promise<{server_url: string, allowusers: boolean}>}
 */
export async function centralResolve(serverUrl, uniqueId, token = '') {
  const result = await centralRequest(serverUrl, '/url/', {
    method: 'GET',
    headers: { 
      code: uniqueId,
      ...(token ? { auth: token } : {})
    },
  });
  return {
    server_url: result.url || '',
    allowusers: result.allowusers !== undefined ? result.allowusers : true,
  };
}

/**
 * Recover unique_id via the Central Server forgot flow.
 * @param {string} serverUrl - The Central Server URL
 * @param {string} email - Email to recover
 * @returns {Promise<{message: string}>}
 */
export function centralForgot(serverUrl, email) {
  return centralRequest(serverUrl, '/forgot/', {
    method: 'POST',
    body: { email },
  });
}

export { CentralServerError };
