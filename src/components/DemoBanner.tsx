import React, { useEffect, useState } from 'react';

const DemoBanner: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const { ativoAte } = JSON.parse(userStr);
    if (!ativoAte) return;

    const target = new Date(`${ativoAte}T23:59:59`);

    const update = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      const total = Math.floor(diff / 1000);
      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;
      const formatted = `${days} dias, ${hours} horas e ${minutes} minutos`;      setTimeLeft(formatted);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  const { ativoAte } = JSON.parse(userStr);
  if (!ativoAte) return null;

  return (
 <div className="w-full mx-auto bg-red-600 text-white text-center font-bold rounded-lg shadow-md px-4 py-2 mt-2">
      Seu acesso de demonstração encerra em {timeLeft}.
    </div>
  );
};

export default DemoBanner;