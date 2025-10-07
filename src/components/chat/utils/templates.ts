const BASE_URL = 'https://n8n.lumendigital.com.br/webhook/prospecta/chat';

export async function findTemplates(token: string) {
  const response = await fetch(`${BASE_URL}/findTemplates`, {
    headers: { token },
  });
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'UNAUTHORIZED'
        : `HTTP error! status: ${response.status}`
    );
  return response.json();
}

export async function createTemplate(token: string, payload: any) {
  const response = await fetch(`${BASE_URL}/createTemplate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'UNAUTHORIZED'
        : `HTTP error! status: ${response.status}`
    );
  return response.json();
}

export async function sendTemplate(token: string, payload: any) {
  const response = await fetch(`${BASE_URL}/enviarTemplate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'UNAUTHORIZED'
        : `HTTP error! status: ${response.status}`
    );
  return response.json();
}