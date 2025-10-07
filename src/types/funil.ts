export interface Estagio {
  Id: string;
  nome: string;
  id_funil: string;
  ordem: string;
  cor: string | null;
  cor_texto_principal?: string | null;
  cor_texto_secundario?: string | null;
  isFollowUp: boolean;
  isReuniaoAgendada: boolean;
  isPerdido: boolean;
  isGanho: boolean;
}

export interface Funil {
  id: number;
  nome: string;
  isFunilPadrao: boolean;
  estagios?: Estagio[];
}