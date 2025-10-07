export interface Deal {
  Id: number;
  id_funil: number;
  id_estagio: number;
  id_fonte: number | null;
  id_contato: number;
  id_usuario: number | null;
  id_anuncio: number | null;
  titulo: string;
  descricao: string | null;
  valor: number | null;
  CreatedAt: string;
  UpdatedAt: string | null;
  contato?: {
    nome: string;
    Email: string;
    telefone: string;
  };
  tags?: import('./tag').Tag[];
}