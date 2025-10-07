export interface UserType {
  tipo: 'MASTER' | 'ADMIN' | 'USER';
}

export interface User {
  Id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  tipo: 'MASTER' | 'ADMIN' | 'USER';
  isAtivo: boolean;
}

export interface CreateUserPayload {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  tipo: 'USER' | 'ADMIN';
}

export interface UpdateUserPayload {
  id: number;
  nome: string;
  telefone: string;
  tipo: 'MASTER' | 'ADMIN' | 'USER';
}