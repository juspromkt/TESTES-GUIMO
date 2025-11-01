export interface CampoPersonalizado {
  Id: number;
  tipo: 'INTEGER' | 'DECIMAL' | 'STRING' | 'BOOLEAN' | 'DATE' | 'DATETIME';
  nome: string;
  isAtivo: boolean;
}

export interface CampoPersonalizadoValor {
  Id?: number;
  id_campo_personalizado: number;
  valor: string;
}