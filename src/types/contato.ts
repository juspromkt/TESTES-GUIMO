export interface Contato {
  Id: number;
  nome: string;
  Email: string;
  telefone: string;
  createdAt?: string;
  CreatedAt?: string; // Backend retorna com C maiúsculo
}