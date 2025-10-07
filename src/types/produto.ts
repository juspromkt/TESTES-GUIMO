export interface Produto {
  Id: number;
  nome: string;
  descricao: string;
  valor_unitario: number;
  isAtivo: boolean;
}

export interface ProdutoLead {
  id_produto: number;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}