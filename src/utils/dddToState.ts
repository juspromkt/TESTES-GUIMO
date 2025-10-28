// Mapeamento de DDDs para estados brasileiros
export const dddToStateMap: Record<string, { uf: string; nome: string }> = {
  // Acre
  '68': { uf: 'AC', nome: 'Acre' },

  // Alagoas
  '82': { uf: 'AL', nome: 'Alagoas' },

  // Amapá
  '96': { uf: 'AP', nome: 'Amapá' },

  // Amazonas
  '92': { uf: 'AM', nome: 'Amazonas' },
  '97': { uf: 'AM', nome: 'Amazonas' },

  // Bahia
  '71': { uf: 'BA', nome: 'Bahia' },
  '73': { uf: 'BA', nome: 'Bahia' },
  '74': { uf: 'BA', nome: 'Bahia' },
  '75': { uf: 'BA', nome: 'Bahia' },
  '77': { uf: 'BA', nome: 'Bahia' },

  // Ceará
  '85': { uf: 'CE', nome: 'Ceará' },
  '88': { uf: 'CE', nome: 'Ceará' },

  // Distrito Federal
  '61': { uf: 'DF', nome: 'Distrito Federal' },

  // Espírito Santo
  '27': { uf: 'ES', nome: 'Espírito Santo' },
  '28': { uf: 'ES', nome: 'Espírito Santo' },

  // Goiás
  '62': { uf: 'GO', nome: 'Goiás' },
  '64': { uf: 'GO', nome: 'Goiás' },

  // Maranhão
  '98': { uf: 'MA', nome: 'Maranhão' },
  '99': { uf: 'MA', nome: 'Maranhão' },

  // Mato Grosso
  '65': { uf: 'MT', nome: 'Mato Grosso' },
  '66': { uf: 'MT', nome: 'Mato Grosso' },

  // Mato Grosso do Sul
  '67': { uf: 'MS', nome: 'Mato Grosso do Sul' },

  // Minas Gerais
  '31': { uf: 'MG', nome: 'Minas Gerais' },
  '32': { uf: 'MG', nome: 'Minas Gerais' },
  '33': { uf: 'MG', nome: 'Minas Gerais' },
  '34': { uf: 'MG', nome: 'Minas Gerais' },
  '35': { uf: 'MG', nome: 'Minas Gerais' },
  '37': { uf: 'MG', nome: 'Minas Gerais' },
  '38': { uf: 'MG', nome: 'Minas Gerais' },

  // Pará
  '91': { uf: 'PA', nome: 'Pará' },
  '93': { uf: 'PA', nome: 'Pará' },
  '94': { uf: 'PA', nome: 'Pará' },

  // Paraíba
  '83': { uf: 'PB', nome: 'Paraíba' },

  // Paraná
  '41': { uf: 'PR', nome: 'Paraná' },
  '42': { uf: 'PR', nome: 'Paraná' },
  '43': { uf: 'PR', nome: 'Paraná' },
  '44': { uf: 'PR', nome: 'Paraná' },
  '45': { uf: 'PR', nome: 'Paraná' },
  '46': { uf: 'PR', nome: 'Paraná' },

  // Pernambuco
  '81': { uf: 'PE', nome: 'Pernambuco' },
  '87': { uf: 'PE', nome: 'Pernambuco' },

  // Piauí
  '86': { uf: 'PI', nome: 'Piauí' },
  '89': { uf: 'PI', nome: 'Piauí' },

  // Rio de Janeiro
  '21': { uf: 'RJ', nome: 'Rio de Janeiro' },
  '22': { uf: 'RJ', nome: 'Rio de Janeiro' },
  '24': { uf: 'RJ', nome: 'Rio de Janeiro' },

  // Rio Grande do Norte
  '84': { uf: 'RN', nome: 'Rio Grande do Norte' },

  // Rio Grande do Sul
  '51': { uf: 'RS', nome: 'Rio Grande do Sul' },
  '53': { uf: 'RS', nome: 'Rio Grande do Sul' },
  '54': { uf: 'RS', nome: 'Rio Grande do Sul' },
  '55': { uf: 'RS', nome: 'Rio Grande do Sul' },

  // Rondônia
  '69': { uf: 'RO', nome: 'Rondônia' },

  // Roraima
  '95': { uf: 'RR', nome: 'Roraima' },

  // Santa Catarina
  '47': { uf: 'SC', nome: 'Santa Catarina' },
  '48': { uf: 'SC', nome: 'Santa Catarina' },
  '49': { uf: 'SC', nome: 'Santa Catarina' },

  // São Paulo
  '11': { uf: 'SP', nome: 'São Paulo' },
  '12': { uf: 'SP', nome: 'São Paulo' },
  '13': { uf: 'SP', nome: 'São Paulo' },
  '14': { uf: 'SP', nome: 'São Paulo' },
  '15': { uf: 'SP', nome: 'São Paulo' },
  '16': { uf: 'SP', nome: 'São Paulo' },
  '17': { uf: 'SP', nome: 'São Paulo' },
  '18': { uf: 'SP', nome: 'São Paulo' },
  '19': { uf: 'SP', nome: 'São Paulo' },

  // Sergipe
  '79': { uf: 'SE', nome: 'Sergipe' },

  // Tocantins
  '63': { uf: 'TO', nome: 'Tocantins' },
};

/**
 * Extrai o DDD de um número de telefone brasileiro
 * Suporta formatos: +5511999999999, 5511999999999, 11999999999, (11) 99999-9999
 */
export function extractDDD(phoneNumber: string): string | null {
  if (!phoneNumber) return null;

  // Remove caracteres não numéricos
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Se começa com 55 (código do Brasil), pega os próximos 2 dígitos
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    return cleaned.substring(2, 4);
  }

  // Se tem 10 ou 11 dígitos (formato nacional), pega os 2 primeiros
  if (cleaned.length >= 10) {
    return cleaned.substring(0, 2);
  }

  return null;
}

/**
 * Retorna o estado (UF e nome) baseado no DDD
 */
export function getStateFromDDD(ddd: string): { uf: string; nome: string } | null {
  return dddToStateMap[ddd] || null;
}

/**
 * Retorna o estado baseado em um número de telefone completo
 */
export function getStateFromPhone(phoneNumber: string): { uf: string; nome: string } | null {
  const ddd = extractDDD(phoneNumber);
  if (!ddd) return null;
  return getStateFromDDD(ddd);
}

/**
 * Agrupa contatos por estado baseado nos DDDs dos telefones
 */
export interface ContactsByState {
  uf: string;
  nome: string;
  leads: number;
}

export function groupContactsByState(contacts: Array<{ telefone: string }>): ContactsByState[] {
  const stateCount: Record<string, { nome: string; count: number }> = {};

  contacts.forEach(contact => {
    const state = getStateFromPhone(contact.telefone);
    if (state) {
      if (!stateCount[state.uf]) {
        stateCount[state.uf] = { nome: state.nome, count: 0 };
      }
      stateCount[state.uf].count++;
    }
  });

  return Object.entries(stateCount).map(([uf, data]) => ({
    uf,
    nome: data.nome,
    leads: data.count,
  }));
}
