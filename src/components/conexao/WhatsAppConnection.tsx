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
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import Modal from '../Modal';

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

  const navigate = useNavigate();
  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchWhatsAppConnection();
  }, []);

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
      console.error('Error fetching WhatsApp connection:', err);
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
    console.error('Error creating WhatsApp connection:', err);
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
      console.error('Error creating official WhatsApp connection:', err);
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
      console.error('Error validating WhatsApp connection:', err);
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
  console.error('Error generating QR code:', err);
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
      console.error('Error deleting WhatsApp connection:', err);
    }
  };

  const formatPhoneNumber = (jid: string | null) => {
    if (!jid) return 'Não disponível';
    return jid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
  };

  const getConnectionStatusDisplay = (status: string) => {
    switch (status) {
      case 'open':
        return { text: 'ATIVO', className: 'bg-emerald-100 text-emerald-800' };
      case 'connecting':
        return { text: 'CONECTANDO', className: 'bg-yellow-100 text-yellow-800' };
      default:
        return { text: 'DESATIVADO', className: 'bg-red-100 text-red-800' };
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
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-neutral-700">
          {/* Connection Header */}
          <div className="p-6 border-b border-gray-300 dark:border-neutral-700">
            <div className="flex items-center gap-6">
              <div className="relative">
                {connection.profilePicUrl ? (
                  <img
                    src={connection.profilePicUrl}
                    alt={connection.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-50 dark:ring-emerald-900"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900 flex items-center justify-center ring-4 ring-emerald-50 dark:ring-emerald-900">
                    <User className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-800 ${
                  connection.connectionStatus === 'open' ? 'bg-emerald-500' :
                  connection.connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                  {connection.name}
                </h2>
                <p className="text-gray-500 dark:text-neutral-400 mt-1 flex items-center gap-2">
                  {connection.ownerJid
                    ? formatPhoneNumber(connection.ownerJid)
                    : 'Número não validado'}
                  {connection.tipo === 'WHATSAPP-BUSINESS' && !connection.ownerJid && (
                    <button
                      onClick={() => {
                        setError('');
                        setIsValidateModalOpen(true);
                      }}
                      className="px-2 py-1 text-xs font-medium text-white bg-emerald-500 dark:bg-emerald-600 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-700"
                    >
                      Validar Conexão
                    </button>
                  )}
                </p>
                <div className="mt-2">
                  {(() => {
                    const status = getConnectionStatusDisplay(connection.connectionStatus);
                    return (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
                        {status.text}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Connection Actions */}
          {canEditConnection && (
            <div className="p-6 bg-gray-50 dark:bg-neutral-900 flex flex-col gap-3">
              {connection.tipo === 'EVO' && connection.connectionStatus !== 'open' && (
                <button
                  onClick={handleGenerateQRCode}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 dark:bg-emerald-600 text-white rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  Gerar QR Code
                </button>
              )}
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
              >
                <X className="w-5 h-5" />
                Excluir Conexão
              </button>
            </div>
          )}

        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-8 text-center border border-gray-200 dark:border-neutral-700">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <LinkIcon className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 mb-2">Nenhuma conexão ativa</h2>
          <p className="text-gray-500 dark:text-neutral-400 mb-6">Conecte seu WhatsApp para começar a usar o sistema</p>
          {canEditConnection && (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  setError('');
                  setIsConnectModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 dark:bg-emerald-600 text-white rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors"
              >
                <QrCode className="w-5 h-5" />
                Conectar WhatsApp
              </button>
            </div>
          )}
        </div>
      )}

      {/* Connect Modal */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Conectar WhatsApp"
      >
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Nome da Instância
            </label>
            <input
              type="text"
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              placeholder="Ex: WhatsApp Principal"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsConnectModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg"
            >
              Cancelar
            </button>
<button
  onClick={handleConnect}
  disabled={connecting || !/^[A-Za-zÀ-ÿ\s]+$/.test(instanceName.trim())}
  className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg disabled:opacity-50"
>
  {connecting ? 'Conectando...' : 'Conectar'}
</button>

          </div>
        </div>
      </Modal>

      {/* Official API Connect Modal */}
      <Modal
        isOpen={isOfficialModalOpen}
        onClose={() => setIsOfficialModalOpen(false)}
        title="Conectar API oficial"
      >
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="officialName" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              id="officialName"
              value={officialName}
              onChange={(e) => setOfficialName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              placeholder="Ex: LucasApiOficial"
              required
            />
          </div>
          <div>
            <label htmlFor="officialNumber" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Number
            </label>
            <input
              type="text"
              id="officialNumber"
              value={officialNumber}
              onChange={(e) => setOfficialNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              placeholder="668169203055880"
              required
            />
          </div>
          <div>
            <label htmlFor="officialBusinessId" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              BusinessId
            </label>
            <input
              type="text"
              id="officialBusinessId"
              value={officialBusinessId}
              onChange={(e) => setOfficialBusinessId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              placeholder="735895655965278"
              required
            />
          </div>
          <div>
            <label htmlFor="officialToken" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Token
            </label>
            <input
              type="text"
              id="officialToken"
              value={officialToken}
              onChange={(e) => setOfficialToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              placeholder="EAAe4NTWmCnEBPI"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsOfficialModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleConnectOfficial}
              disabled={connectingOfficial}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              {connectingOfficial ? 'Conectando...' : 'Conectar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Validate Connection Modal */}
      <Modal
        isOpen={isValidateModalOpen}
        onClose={() => setIsValidateModalOpen(false)}
        title="Validar Conexão"
      >
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="validateNumber" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Número com DDD
            </label>
            <input
              type="text"
              id="validateNumber"
              value={validateNumber}
              onChange={(e) => setValidateNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              placeholder="62999995555"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsValidateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleValidateConnection}
              disabled={validating}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              {validating ? 'Validando...' : 'Validar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQRCodeModalOpen}
        onClose={() => setIsQRCodeModalOpen(false)}
        title="Escaneie o QR Code"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-neutral-300">
              Abra o WhatsApp no seu celular e escaneie o QR Code abaixo
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-700 p-4 rounded-lg shadow-inner flex items-center justify-center">
            <QRCodeSVG
              value={qrCode}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
                Confirmar Exclusão
              </h2>
              <p className="text-gray-500 dark:text-neutral-400 mt-1">
                Tem certeza que deseja excluir esta conexão do WhatsApp?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg"
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
      </Modal>

      <Modal
  isOpen={isInfoModalOpen}
  onClose={() => setIsInfoModalOpen(false)}
  title="Atenção"
>
  <div className="p-6 space-y-4">
    <p className="text-gray-600 dark:text-neutral-300">
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
</Modal>
    </div>
  );
};

export default WhatsAppConnection;