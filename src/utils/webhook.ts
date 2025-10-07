export const triggerWebhook = async (
  clientId: string,
  type: 'create' | 'update' | 'delete',
  data: any
) => {
  const token = localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user')!).token 
    : null;

  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-webhook/${clientId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type,
      data
    })
  });

  if (!response.ok) {
    throw new Error('Failed to trigger webhook');
  }

  return response.json();
};