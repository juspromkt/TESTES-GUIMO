import React, { useEffect, useState } from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface WhatsAppAlertProps {
  token: string;
}

interface WhatsAppConnection {
  connectionStatus: string;
}

const WhatsAppAlert: React.FC<WhatsAppAlertProps> = ({ token }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const checkWhatsAppStatus = async () => {
    if (!token) {
      setIsChecking(false);
      return;
    }

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/get', {
        headers: { token }
      });

      if (!response.ok) {
        setIsConnected(false);
        setIsChecking(false);
        return;
      }

      const text = await response.text();
      const data: WhatsAppConnection[] = text ? JSON.parse(text) : [];

      // Verifica se tem alguma conexão e se está aberta
      if (data.length === 0) {
        setIsConnected(false);
      } else if (data[0].connectionStatus === 'open') {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status do WhatsApp:', error);
      // Em caso de erro, não mostra o alerta (evita falsos positivos)
      setIsConnected(true);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkWhatsAppStatus();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkWhatsAppStatus, 30000);

    return () => clearInterval(interval);
  }, [token]);

  // Não mostrar nada se estiver conectado ou ainda verificando
  if (isConnected || isChecking) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-pulse">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-3 rounded-lg shadow-2xl border-2 border-red-400 flex items-center gap-3 min-w-[300px]">
        {/* Ícone piscante */}
        <div className="relative">
          <WifiOff className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
        </div>

        {/* Mensagem */}
        <div className="flex-1">
          <p className="font-semibold text-sm">WhatsApp Desconectado</p>
          <p className="text-xs opacity-90">Reconecte para receber mensagens</p>
        </div>

        {/* Indicador de alerta */}
        <AlertTriangle className="w-5 h-5 animate-bounce" />
      </div>
    </div>
  );
};

export default WhatsAppAlert;
