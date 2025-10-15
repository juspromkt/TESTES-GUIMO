import useSWR from 'swr';
import type { Tag } from '../types/tag';

interface User {
  Id: number;
  nome: string;
  email: string;
}

interface Funnel {
  id: number;
  nome: string;
  isFunilPadrao?: boolean;
  estagios?: any[];
}

const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, { headers: { token } });
  if (!response.ok) throw new Error('Erro ao buscar dados');

  const text = await response.text();
  if (!text) return null;

  const data = JSON.parse(text);
  return Array.isArray(data) ? data : [data];
};

export function useTags(token: string | null) {
  return useSWR<Tag[]>(
    token ? ['tags', token] : null,
    () => fetcher('https://n8n.lumendigital.com.br/webhook/prospecta/tag/list', token!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60000, // Atualiza a cada 1 minuto
      dedupingInterval: 30000, // Evita requisições duplicadas em 30 segundos
    }
  );
}

export function useUsers(token: string | null) {
  return useSWR<User[]>(
    token ? ['users', token] : null,
    () => fetcher('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get', token!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60000,
      dedupingInterval: 30000,
    }
  );
}

export function useFunnels(token: string | null) {
  return useSWR<Funnel[]>(
    token ? ['funnels', token] : null,
    () => fetcher('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', token!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60000,
      dedupingInterval: 30000,
    }
  );
}
