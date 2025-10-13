/**
 * Sistema de Cache Inteligente
 *
 * Gerencia cache no localStorage com diferentes TTLs:
 * - Dados fixos (quase nunca mudam): 24h
 * - Dados estáveis (mudam pouco): 5-10 min
 * - Dados voláteis (mudam muito): sem cache
 */

export enum CacheTTL {
  /** Sem cache - sempre buscar da API */
  NONE = 0,
  /** 5 minutos - dados que mudam moderadamente */
  SHORT = 5 * 60 * 1000,
  /** 10 minutos - dados estáveis */
  MEDIUM = 10 * 60 * 1000,
  /** 1 hora - dados muito estáveis */
  LONG = 60 * 60 * 1000,
  /** 24 horas - dados fixos (tags, funis, usuários) */
  VERY_LONG = 24 * 60 * 60 * 1000,
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private prefix = 'app_cache_';

  /**
   * Gera a chave do cache com prefixo
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Salva dados no cache com timestamp
   */
  set<T>(key: string, data: T, ttl: CacheTTL = CacheTTL.MEDIUM): void {
    if (ttl === CacheTTL.NONE) return;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar no cache:', error);
      // Se localStorage estiver cheio, limpar caches antigos
      this.clearExpired();
    }
  }

  /**
   * Recupera dados do cache se ainda válidos
   * @returns dados do cache ou null se expirado/inexistente
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();
      const age = now - entry.timestamp;

      // Verifica se o cache expirou
      if (age > entry.ttl) {
        this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('⚠️ Erro ao ler do cache:', error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Remove um item específico do cache
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('⚠️ Erro ao remover do cache:', error);
    }
  }

  /**
   * Limpa todos os caches expirados
   */
  clearExpired(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const entry: CacheEntry<any> = JSON.parse(item);
              const age = now - entry.timestamp;
              if (age > entry.ttl) {
                localStorage.removeItem(key);
              }
            } catch {
              // Se não conseguir parsear, remove
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('⚠️ Erro ao limpar caches expirados:', error);
    }
  }

  /**
   * Limpa todo o cache da aplicação
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache:', error);
    }
  }

  /**
   * Invalida cache de uma chave específica (força reload na próxima busca)
   */
  invalidate(key: string): void {
    this.remove(key);
  }

  /**
   * Invalida múltiplas chaves de uma vez
   */
  invalidateMultiple(keys: string[]): void {
    keys.forEach((key) => this.remove(key));
  }

  /**
   * Verifica se um cache existe e é válido
   */
  isValid(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Retorna informações sobre um cache (para debug)
   */
  getInfo(key: string): { age: number; ttl: number; valid: boolean } | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;

      const entry: CacheEntry<any> = JSON.parse(item);
      const now = Date.now();
      const age = now - entry.timestamp;

      return {
        age,
        ttl: entry.ttl,
        valid: age <= entry.ttl,
      };
    } catch {
      return null;
    }
  }
}

// Exportar instância singleton
export const cacheManager = new CacheManager();

/**
 * Hook personalizado para usar cache com fetch
 * @param key - chave do cache
 * @param fetcher - função que busca os dados da API
 * @param ttl - tempo de vida do cache
 * @returns dados (do cache ou da API)
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: CacheTTL = CacheTTL.MEDIUM
): Promise<T> {
  // Se TTL for NONE, sempre buscar da API
  if (ttl === CacheTTL.NONE) {
    return fetcher();
  }

  // Tentar obter do cache primeiro
  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    console.log(`✅ Cache hit: ${key}`);
    return cached;
  }

  // Se não encontrar no cache, buscar da API
  console.log(`🔄 Cache miss: ${key} - buscando da API...`);
  const data = await fetcher();

  // Salvar no cache para próximas consultas
  cacheManager.set(key, data, ttl);

  return data;
}

/**
 * Chaves de cache padronizadas
 */
export const CacheKeys = {
  // Dados fixos (24h)
  TAGS: 'tags',
  FUNNELS: 'funnels',
  USERS: 'users',
  WHATSAPP_TYPE: 'whatsapp_type',

  // Dados estáveis (10 min)
  STAGES: (funnelId: number) => `stages_${funnelId}`,

  // Dados voláteis (sem cache)
  CHATS: 'chats', // não usar cache - dados mudam muito
  MESSAGES: (chatId: string) => `messages_${chatId}`, // não usar cache
} as const;
