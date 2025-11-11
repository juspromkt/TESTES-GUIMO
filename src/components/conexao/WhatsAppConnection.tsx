import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  QrCode,
  Smartphone,
  User,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import SidePanel from '../SidePanel';
import FacebookLoginButton from './FacebookLoginButton';

interface WhatsAppConnection {
  Id: number;
  name: string;
  connectionStatus: string;
  ownerJid: string | null;
  profileName: string | null;
  profilePicUrl: string | null;
  tipo?: string;
}

interface WhatsAppConnectionProps {
  canEditConnection: boolean;
}

interface QRCodeResponse {
  qrCode?: string;
  status?: string;
}

const WhatsAppConnection: React.FC<WhatsAppConnectionProps> = ({ canEditConnection }) => {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [connecting, setConnecting] = useState(false);
const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
const [infoMessage, setInfoMessage] = useState('');

  const [isOfficialModalOpen, setIsOfficialModalOpen] = useState(false);
  const [officialName, setOfficialName] = useState('');
  const [officialNumber, setOfficialNumber] = useState('');
  const [officialBusinessId, setOfficialBusinessId] = useState('');
  const [officialToken, setOfficialToken] = useState('');
  const [connectingOfficial, setConnectingOfficial] = useState(false);

  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [validateNumber, setValidateNumber] = useState('');
  const [validating, setValidating] = useState(false);

  const [resetting, setResetting] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  const navigate = useNavigate();
  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;
  const fetchedRef = React.useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchWhatsAppConnection();
  }, []);

  useEffect(() => {
    if (resetCooldown > 0) {
      const timer = setTimeout(() => {
        setResetCooldown(resetCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resetCooldown]);

  const fetchWhatsAppConnection = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/get', {
        headers: {
          token: token
        }
      });
      const text = await response.text();
      
      const data = text ? JSON.parse(text) : [];
      setConnection(data[0] || null);
    } catch (err) {
      setError('Erro ao carregar conexão do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

const handleConnect = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  // ✅ Validação: apenas letras e espaços
  const onlyLettersRegex = /^[A-Za-zÀ-ÿ\s]+$/; 
  if (!onlyLettersRegex.test(instanceName.trim())) {
    setError('O nome da instância deve conter apenas letras e espaços, sem números ou caracteres especiais.');
    return;
  }

  setConnecting(true);

  try {
    const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: token
      },
      body: JSON.stringify({ nome: instanceName }),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar conexão do WhatsApp');
    }

    const data: QRCodeResponse = await response.json();
    if (data.qrCode) {
      setQrCode(data.qrCode);
      setIsConnectModalOpen(false);
      setIsQRCodeModalOpen(true);

      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/get', {
          headers: { token: token }
        });
        const statusText = await statusResponse.text();
        const statusData = statusText ? JSON.parse(statusText) : [];

        if (statusData[0]?.connectionStatus === 'open') {
          clearInterval(pollInterval);
          setConnection(statusData[0]);
          setIsQRCodeModalOpen(false);
          setQrCode('');
        }
      }, 5000);

      setTimeout(() => clearInterval(pollInterval), 120000);
    } else {
  setIsConnectModalOpen(false);
  setInfoMessage(
    'Não foi possível criar uma conexão no momento. Isso às vezes é normal: o WhatsApp pode demorar um pouco para liberar o QR Code. Tente novamente em 30 segundos a 1 minuto clicando no botão "Gerar QR Code".'
  );
  setIsInfoModalOpen(true);
  await fetchWhatsAppConnection();
}
  } catch (err) {
    setError('Erro ao criar conexão do WhatsApp');
  } finally {
    setConnecting(false);
  }
};


  const handleConnectOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConnectingOfficial(true);

    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/create/apiOficial',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token: token,
          },
          body: JSON.stringify({
            nome: officialName,
            number: officialNumber,
            businessId: officialBusinessId,
            token: officialToken,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.status === 'sucess') {
        setIsOfficialModalOpen(false);
        setOfficialName('');
        setOfficialNumber('');
        setOfficialBusinessId('');
        setOfficialToken('');
        await fetchWhatsAppConnection();
      } else {
        throw new Error('Erro ao criar conexão oficial');
      }
    } catch (err) {
      setError('Erro ao criar conexão oficial');
    } finally {
      setConnectingOfficial(false);
    }
  };

  const handleValidateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidating(true);
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/validador',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token: token,
          },
          body: JSON.stringify({ numero: validateNumber }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.status === 'sucess') {
        setIsValidateModalOpen(false);
        setValidateNumber('');
        await fetchWhatsAppConnection();
      } else {
        throw new Error('Erro ao validar conexão');
      }
    } catch (err) {
      setError('Erro ao validar conexão do WhatsApp');
  } finally {
    setValidating(false);
  }
};

  const handleGenerateQRCode = async () => {
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/qrcode',
        {
          headers: {
            token: token,
          },
        },
      );
      const data: QRCodeResponse = await response.json();
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setIsQRCodeModalOpen(true);

        const pollInterval = setInterval(async () => {
          const statusResponse = await fetch(
            'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/get',
            { headers: { token: token } },
          );
          const statusText = await statusResponse.text();
          const statusData = statusText ? JSON.parse(statusText) : [];

          if (statusData[0]?.connectionStatus === 'open') {
            clearInterval(pollInterval);
            setConnection(statusData[0]);
            setIsQRCodeModalOpen(false);
            setQrCode('');
          }
        }, 5000);

        setTimeout(() => clearInterval(pollInterval), 120000);
} else {
  setInfoMessage(
    'Não foi possível gerar o QR Code agora. Isso às vezes é normal, pois dependemos da conexão com o WhatsApp Web. Aguarde 30 segundos a 1 minuto e tente novamente clicando em "Gerar QR Code".'
  );
  setIsInfoModalOpen(true);
}

} catch (err) {
  setInfoMessage(
    'Não foi possível gerar o QR Code agora. Isso às vezes é normal, pois dependemos da conexão com o WhatsApp Web. Aguarde 30 segundos a 1 minuto e tente novamente clicando em "Gerar QR Code".'
  );
  setIsInfoModalOpen(true);
}
  };


  const handleDelete = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/delete', {
        method: 'DELETE',
        headers: {
          token: token
        }
      });

      if (response.ok) {
        setConnection(null);
        setIsDeleteModalOpen(false);
      } else {
        throw new Error('Erro ao excluir conexão');
      }
    } catch (err) {
      setError('Erro ao excluir conexão do WhatsApp');
    }
  };

  const handleResetConnection = async () => {
    setResetting(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/corrigir', {
        method: 'GET',
        headers: {
          token: token
        }
      });

      if (response.ok) {
        toast.success('Conexão resetada com sucesso! Aguarde 2 minutos antes de resetar novamente.');
        setResetCooldown(120); // 2 minutos em segundos
        await fetchWhatsAppConnection();
      } else {
        throw new Error('Erro ao resetar conexão');
      }
    } catch (err) {
      toast.error('Erro ao resetar conexão do WhatsApp');
    } finally {
      setResetting(false);
    }
  };

  const formatPhoneNumber = (jid: string | null) => {
    if (!jid) return 'Não disponível';
    return jid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
  };

  const getConnectionStatusDisplay = (status: string) => {
    switch (status) {
      case 'open':
        return { text: 'ATIVO', className: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' };
      case 'connecting':
        return { text: 'CONECTANDO', className: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' };
      default:
        return { text: 'DESATIVADO', className: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 dark:text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400">
        <AlertCircle className="w-8 h-8 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div>
      {connection ? (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header com gradiente de status */}
          <div className={`px-8 py-6 ${
            connection.connectionStatus === 'open'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700'
              : connection.connectionStatus === 'connecting'
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-600 dark:to-amber-700'
              : 'bg-gradient-to-r from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {connection.connectionStatus === 'open'
                    ? 'Conexão Ativa'
                    : connection.connectionStatus === 'connecting'
                    ? 'Conectando...'
                    : 'Conexão Desconectada'}
                </h2>
                <p className="text-white/90 text-sm">
                  {connection.connectionStatus === 'open'
                    ? 'Seu WhatsApp está conectado ao sistema'
                    : connection.connectionStatus === 'connecting'
                    ? 'Aguardando conexão com o WhatsApp'
                    : 'Sua conexão está desconectada. Gere um novo QR Code para reconectar'}
                </p>
              </div>
            </div>
          </div>

          {/* Connection Info */}
          <div className="p-8">
            <div className="flex items-start gap-6 mb-6">
              <div className="relative">
                {connection.profilePicUrl ? (
                  <img
                    src={connection.profilePicUrl}
                    alt={connection.name}
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-emerald-100 dark:ring-emerald-900 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900 dark:to-green-900 flex items-center justify-center ring-4 ring-emerald-100 dark:ring-emerald-900 shadow-lg">
                    <User className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center ${
                  connection.connectionStatus === 'open' ? 'bg-emerald-500' :
                  connection.connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {connection.name}
                  </h2>
                  {connection.tipo === 'WHATSAPP-BUSINESS' && (
                    <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                      API OFICIAL
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Número */}
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {connection.ownerJid
                        ? formatPhoneNumber(connection.ownerJid)
                        : 'Número não validado'}
                    </span>
                    {connection.tipo === 'WHATSAPP-BUSINESS' && !connection.ownerJid && (
                      <button
                        onClick={() => {
                          setError('');
                          setIsValidateModalOpen(true);
                        }}
                        className="ml-2 px-3 py-1 text-xs font-semibold text-white bg-purple-500 dark:bg-purple-600 rounded-lg hover:bg-purple-600 dark:hover:bg-purple-700 transition-colors"
                      >
                        Validar Agora
                      </button>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>
                    {(() => {
                      const status = getConnectionStatusDisplay(connection.connectionStatus);
                      return (
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${status.className}`}>
                          <div className={`w-2 h-2 rounded-full ${
                            connection.connectionStatus === 'open' ? 'bg-emerald-600 dark:bg-emerald-400' :
                            connection.connectionStatus === 'connecting' ? 'bg-yellow-600 dark:bg-yellow-400' : 'bg-red-600 dark:bg-red-400'
                          }`}></div>
                          {status.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className={`rounded-xl p-4 border mb-6 ${
              connection.connectionStatus === 'open'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : connection.connectionStatus === 'connecting'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  connection.connectionStatus === 'open'
                    ? 'text-blue-600 dark:text-blue-400'
                    : connection.connectionStatus === 'connecting'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <div>
                  <p className={`text-sm font-medium mb-1 ${
                    connection.connectionStatus === 'open'
                      ? 'text-blue-900 dark:text-blue-100'
                      : connection.connectionStatus === 'connecting'
                      ? 'text-yellow-900 dark:text-yellow-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {connection.connectionStatus === 'open'
                      ? 'Conexão estabelecida com sucesso!'
                      : connection.connectionStatus === 'connecting'
                      ? 'Aguardando conexão...'
                      : 'Conexão perdida'}
                  </p>
                  <p className={`text-xs leading-relaxed ${
                    connection.connectionStatus === 'open'
                      ? 'text-blue-700 dark:text-blue-300'
                      : connection.connectionStatus === 'connecting'
                      ? 'text-yellow-700 dark:text-yellow-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {connection.connectionStatus === 'open'
                      ? 'Seu WhatsApp está conectado e funcionando normalmente. Você pode gerenciar suas conversas pela plataforma.'
                      : connection.connectionStatus === 'connecting'
                      ? 'Sua conexão está sendo estabelecida. Aguarde alguns instantes para que o processo seja concluído.'
                      : 'Sua conexão foi perdida. Gere um novo QR Code para reconectar seu WhatsApp ao sistema.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Actions */}
            {canEditConnection && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {connection.tipo === 'EVO' && connection.connectionStatus !== 'open' && (
                  <button
                    onClick={handleGenerateQRCode}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <QrCode className="w-5 h-5" />
                    Gerar Novo QR Code
                  </button>
                )}
                {connection.connectionStatus === 'open' && (
                  <div className="space-y-2">
                    <button
                      onClick={handleResetConnection}
                      disabled={resetting || resetCooldown > 0}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Resetando...
                        </>
                      ) : resetCooldown > 0 ? (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          Aguarde {Math.floor(resetCooldown / 60)}:{String(resetCooldown % 60).padStart(2, '0')}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5" />
                          Resetar Conexão
                        </>
                      )}
                    </button>
                    {resetCooldown > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                        <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Aguarde {Math.floor(resetCooldown / 60)}:{String(resetCooldown % 60).padStart(2, '0')} para resetar novamente
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-red-500 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                  Excluir Conexão
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <LinkIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Conecte seu WhatsApp</h2>
                <p className="text-emerald-50 text-sm">Configure sua conexão para começar a usar o sistema</p>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-8">
            {/* Cards de opções */}
            {canEditConnection ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Card WhatsApp Normal */}
                <div className="group relative bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
                     onClick={() => {
                       setError('');
                       setIsConnectModalOpen(true);
                     }}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                        WhatsApp Web
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium">
                          Recomendado
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Conecte via QR Code - rápido e fácil
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      Conexão instantânea via QR Code
                    </li>
                    <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      Ideal para contas pessoais
                    </li>
                    <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      Grátis e sem configuração complexa
                    </li>
                  </ul>

                  <button className="w-full px-4 py-2.5 bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg">
                    <QrCode className="w-4 h-4" />
                    Conectar via QR Code
                  </button>
                </div>

                {/* Card API Oficial */}
                <div className="group relative bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
                     onClick={() => {
                       setError('');
                       setIsOfficialModalOpen(true);
                     }}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                        API Oficial
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                          Business
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        WhatsApp Business API oficial
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Recursos avançados e maior estabilidade
                    </li>
                    <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Ideal para empresas e alto volume
                    </li>
                    <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Requer credenciais Meta Business
                    </li>
                  </ul>

                  <button className="w-full px-4 py-2.5 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg">
                    <LinkIcon className="w-4 h-4" />
                    Conectar API Oficial
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Você não tem permissão para editar conexões</p>
              </div>
            )}

            {/* Info adicional */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Precisa de ajuda?
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Se você não sabe qual opção escolher, recomendamos começar com o <strong>WhatsApp Web</strong> (QR Code). É mais rápido e não requer configurações técnicas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connect Panel */}
      <SidePanel
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Conectar WhatsApp"
      >
        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500 dark:bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                  Configure sua conexão WhatsApp
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  Escolha um nome para identificar esta conexão. Você poderá escanear o QR Code na próxima etapa.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="instanceName" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nome da Conexão
              </label>
              <input
                type="text"
                id="instanceName"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="Ex: WhatsApp Principal"
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Use apenas letras e espaços. Este nome será usado para identificar sua conexão no sistema.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Steps Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Próximos passos
            </h4>
            <ol className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                <span className="w-5 h-5 bg-blue-500 dark:bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
                <span>Clique em "Conectar" para gerar o QR Code</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                <span className="w-5 h-5 bg-blue-500 dark:bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
                <span>Abra o WhatsApp no seu celular</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                <span className="w-5 h-5 bg-blue-500 dark:bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
                <span>Escaneie o QR Code para conectar</span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsConnectModalOpen(false)}
              className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting || !/^[A-Za-zÀ-ÿ\s]+$/.test(instanceName.trim())}
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Conectar
                </>
              )}
            </button>
          </div>
        </div>
      </SidePanel>

      {/* Official API Connect Panel */}
      <SidePanel
        isOpen={isOfficialModalOpen}
        onClose={() => setIsOfficialModalOpen(false)}
        title="Conectar API Oficial do WhatsApp"
      >
        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  WhatsApp Business API
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  Configure sua conexão com a API oficial do WhatsApp Business. Você precisará das credenciais do Meta Business.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="officialName" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nome da Conexão
              </label>
              <input
                type="text"
                id="officialName"
                value={officialName}
                onChange={(e) => setOfficialName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Ex: API Oficial Empresa"
                required
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Identificação interna da conexão
              </p>
            </div>

            <div>
              <label htmlFor="officialNumber" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Phone Number ID
              </label>
              <input
                type="text"
                id="officialNumber"
                value={officialNumber}
                onChange={(e) => setOfficialNumber(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                placeholder="668169203055880"
                required
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                ID do número de telefone no Meta Business
              </p>
            </div>

            <div>
              <label htmlFor="officialBusinessId" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                WhatsApp Business Account ID
              </label>
              <input
                type="text"
                id="officialBusinessId"
                value={officialBusinessId}
                onChange={(e) => setOfficialBusinessId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                placeholder="735895655965278"
                required
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                ID da conta Business no Facebook
              </p>
            </div>

            <div>
              <label htmlFor="officialToken" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Access Token
              </label>
              <input
                type="text"
                id="officialToken"
                value={officialToken}
                onChange={(e) => setOfficialToken(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                placeholder="EAAe4NTWmCnEBPI..."
                required
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Token de acesso da API do WhatsApp Business
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1">
                  Onde encontrar essas informações?
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Acesse o Meta Business Suite, vá em Configurações → WhatsApp Business Account → API Setup para obter suas credenciais.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsOfficialModalOpen(false)}
              className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConnectOfficial}
              disabled={connectingOfficial}
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {connectingOfficial ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Conectar API
                </>
              )}
            </button>
          </div>
        </div>
      </SidePanel>

      {/* Validate Connection Panel */}
      <SidePanel
        isOpen={isValidateModalOpen}
        onClose={() => setIsValidateModalOpen(false)}
        title="Validar Conexão"
      >
        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-500 dark:bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  Validação de Número
                </h3>
                <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                  Informe o número de telefone conectado à API oficial para validar e ativar a conexão.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="validateNumber" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Número com DDD
              </label>
              <input
                type="text"
                id="validateNumber"
                value={validateNumber}
                onChange={(e) => setValidateNumber(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-base"
                placeholder="62999995555"
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Digite apenas números, incluindo o DDD (ex: 62999995555)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
                  Por que validar?
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  A validação confirma que o número informado corresponde à API oficial conectada, garantindo o funcionamento correto do sistema.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsValidateModalOpen(false)}
              className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleValidateConnection}
              disabled={validating}
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-purple-500 dark:bg-purple-600 hover:bg-purple-600 dark:hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Validar Número
                </>
              )}
            </button>
          </div>
        </div>
      </SidePanel>

      {/* QR Code Panel Premium */}
      <SidePanel
        isOpen={isQRCodeModalOpen}
        onClose={() => setIsQRCodeModalOpen(false)}
        title="Conectar WhatsApp"
        width="45%"
      >
        <div className="p-4">
          {/* Header com ícone - Compacto */}
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              Escaneie o QR Code
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Use o WhatsApp do seu celular para conectar
            </p>
          </div>

          {/* Layout Horizontal: 2 Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Coluna 1: QR Code */}
            <div className="flex flex-col">
              <div className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-xl"></div>
                <div className="relative bg-white dark:bg-gray-700 p-3 rounded-lg shadow-inner">
                  <QRCodeSVG
                    value={qrCode}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
            </div>

            {/* Coluna 2: Instruções */}
            <div className="flex flex-col justify-center space-y-3">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">?</span>
                </div>
                Como conectar
              </h4>

              <div className="space-y-2">
                {/* Passo 1 */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-bold text-[10px]">1</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      Abra o <span className="font-semibold text-green-600 dark:text-green-400">WhatsApp</span> no seu celular
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-bold text-[10px]">2</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      Toque em <span className="font-semibold">Menu (⋮)</span> ou <span className="font-semibold">Configurações</span>
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-bold text-[10px]">3</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      Selecione <span className="font-semibold">Aparelhos conectados</span>
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-bold text-[10px]">4</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      Toque em <span className="font-semibold">Conectar um aparelho</span>
                    </p>
                  </div>
                </div>

                {/* Passo 5 */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-bold text-[10px]">5</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      <span className="font-semibold text-green-600 dark:text-green-400">Escaneie o QR Code</span> com a câmera
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso de tempo - Full Width Compacto */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs text-blue-900 dark:text-blue-200">
                <span className="font-medium">QR Code temporário:</span> Expira em 2 minutos. Se expirar, gere um novo.
              </p>
            </div>
          </div>
        </div>
      </SidePanel>

      {/* Delete Confirmation Panel */}
      <SidePanel
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Confirmar Exclusão
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Tem certeza que deseja excluir esta conexão do WhatsApp?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 rounded-lg"
            >
              Sim, Excluir
            </button>
          </div>
        </div>
      </SidePanel>

      <SidePanel
  isOpen={isInfoModalOpen}
  onClose={() => setIsInfoModalOpen(false)}
  title="Atenção"
>
  <div className="p-6 space-y-4">
    <p className="text-gray-600 dark:text-gray-400">
      {infoMessage ||
        'Não foi possível processar sua solicitação no momento. Tente novamente em 30 segundos a 1 minuto usando o botão "Gerar QR Code".'}
    </p>
    <div className="flex justify-end">
      <button
        onClick={() => setIsInfoModalOpen(false)}
        className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg"
      >
        Entendi
      </button>
    </div>
  </div>
</SidePanel>
    </div>
  );
};

export default WhatsAppConnection;
