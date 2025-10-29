import React, { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

/**
 * Verifica se o usuário atual é uma conta demo
 */
export const isDemoAccount = (): boolean => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;

  try {
    const { ativoAte } = JSON.parse(userStr);
    return !!ativoAte; // Se tem ativoAte, é demo
  } catch {
    return false;
  }
};

/**
 * Retorna a data de expiração da conta demo
 */
export const getDemoExpirationDate = (): Date | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    const { ativoAte } = JSON.parse(userStr);
    if (!ativoAte) return null;
    return new Date(`${ativoAte}T23:59:59`);
  } catch {
    return null;
  }
};

const DemoBanner: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isDemoAccount()) return;

    const target = getDemoExpirationDate();
    if (!target) return;

    const update = () => {
      const diff = target.getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft('Expirado');
        setIsExpired(true);
        return;
      }

      const total = Math.floor(diff / 1000);
      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const minutes = Math.floor((total % 3600) / 60);

      if (days > 0) {
        setTimeLeft(`${days} dia${days > 1 ? 's' : ''}, ${hours}h e ${minutes}min`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h e ${minutes}min`);
      } else {
        setTimeLeft(`${minutes}min`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isDemoAccount()) return null;

  return (
    <div className="w-full mx-auto bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white rounded-lg shadow-lg px-4 py-3 mt-2 border border-red-400/50">
      <div className="flex items-center justify-center gap-2">
        {isExpired ? (
          <>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">
              Sua demonstração expirou
            </span>
          </>
        ) : (
          <>
            <Clock className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span className="font-semibold">
              Conta Demo - Expira em: <span className="font-bold">{timeLeft}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default DemoBanner;