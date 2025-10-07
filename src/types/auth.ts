export interface LoginResponse {
  status: string;
  id_usuario: number;
  /**
   * Data final de ativação da conta demo. Pode ser null em contas regulares.
   */
  ativoAte?: string | null;
  nome_usuario: string;
  token: string;
  expiracao: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}