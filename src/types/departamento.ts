import type { Produto, ProdutoLead } from './produto';

// Departamentos usam a mesma estrutura de Produtos no backend
// Diferenciados por valor_unitario = 0
export type Departamento = Produto;
export type DepartamentoLead = ProdutoLead;

// Helper functions para diferenciar no frontend
export const isDepartamento = (item: Produto): boolean => item.valor_unitario === 0;
export const isProduto = (item: Produto): boolean => item.valor_unitario > 0;
