// utils/timezone.ts
export function parseSaoPauloDate(dateString: string): Date {
  try {
    // Normaliza espaço para 'T' e adiciona 'Z' se for UTC explícito sem Z
    let isoString = dateString.replace(' ', 'T');

    // Se já contém fuso horário, não adicionar 'Z'
    if (!isoString.match(/([Zz]|[+-]\d{2}:\d{2})$/)) {
      isoString += 'Z';
    }

    return new Date(isoString);
  } catch {
    return new Date('');
  }
}
