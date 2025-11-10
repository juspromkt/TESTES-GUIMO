/**
 * Sistema de cache de requisições com TTL (Time To Live)
 * Armazena resultados de requisições em memória por um período determinado
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // em milissegundos
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Gera chave única para a requisição
   */
  private generateKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}::${paramString}`;
  }

  /**
   * Verifica se entrada do cache está válida
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Busca dados do cache
   */
  get<T>(endpoint: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Armazena dados no cache
   */
  set<T>(endpoint: string, data: T, ttl: number = 60000, params?: Record<string, any>): void {
    const key = this.generateKey(endpoint, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Remove entrada específica do cache
   */
  invalidate(endpoint: string, params?: Record<string, any>): void {
    const key = this.generateKey(endpoint, params);
    this.cache.delete(key);
  }

  /**
   * Remove todas as entradas que correspondem ao padrão
   */
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Inicia limpeza automática de entradas expiradas
   */
  private startCleanup(): void {
    // Executa limpeza a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const entries = Array.from(this.cache.entries());

      entries.forEach(([key, entry]) => {
        if (!this.isValid(entry)) {
          this.cache.delete(key);
        }
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Para a limpeza automática
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Wrapper para fetch com cache automático
   */
  async fetchWithCache<T>(
    endpoint: string,
    options: RequestInit = {},
    ttl: number = 60000,
    params?: Record<string, any>
  ): Promise<T> {
    // Verifica se existe no cache
    const cached = this.get<T>(endpoint, params);
    if (cached !== null) {
      console.log(`[RequestCache] Cache HIT: ${endpoint}`);
      return cached;
    }

    console.log(`[RequestCache] Cache MISS: ${endpoint}`);

    // Busca da API
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Armazena no cache
    this.set(endpoint, data, ttl, params);

    return data;
  }
}

// Instância global do cache
export const requestCache = new RequestCache();

// TTL padrões (em milissegundos)
export const CacheTTL = {
  SHORT: 30 * 1000, // 30 segundos
  MEDIUM: 60 * 1000, // 1 minuto
  LONG: 5 * 60 * 1000, // 5 minutos
  VERY_LONG: 15 * 60 * 1000, // 15 minutos
} as const;

// Hook React para usar cache
export function useCachedRequest() {
  return {
    fetchWithCache: requestCache.fetchWithCache.bind(requestCache),
    invalidate: requestCache.invalidate.bind(requestCache),
    invalidatePattern: requestCache.invalidatePattern.bind(requestCache),
    clear: requestCache.clear.bind(requestCache),
  };
}
