import React, { useState, useEffect } from 'react';
import { Key, Copy, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface ApiKeySectionProps {
  isActive: boolean;
  canEdit: boolean;
}

export default function ApiKeySection({ isActive, canEdit }: ApiKeySectionProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (isActive) {
      fetchApiKey();
    }
  }, [isActive]);

  const fetchApiKey = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/apikey/get', {
        headers: { token }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar API Key');
      }

      const data = await response.json();
      setApiKey(Array.isArray(data) && data.length > 0 ? data[0].apikey : null);
    } catch (err) {
      console.error('Erro ao carregar API Key:', err);
      setError('Erro ao carregar API Key');
    } finally {
      setLoading(false);
    }
  };

 const generateNewKey = async () => {
  setGenerating(true);
  setError('');
  setSuccess('');

  try {
    const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/apikey/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar nova API Key');
    }

    // ✅ Agora buscamos a nova chave atualizada do backend:
    await fetchApiKey();

    setSuccess('Nova API Key gerada com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
  } catch (err) {
    console.error('Erro ao gerar API Key:', err);
    setError('Erro ao gerar nova API Key');
  } finally {
    setGenerating(false);
  }
};



  const copyToClipboard = async () => {
    if (!apiKey) return;
    
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar para a área de transferência:', err);
    }
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Key className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Chave de API</h2>
            <p className="text-sm text-gray-500 mt-1">Gerencie sua chave de API com segurança</p>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Atenção! Mantenha sua chave segura
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside">
                  <li>Nunca compartilhe sua chave de API com terceiros</li>
                  <li>Armazene a chave em um local seguro</li>
                  <li>Gere uma nova chave se suspeitar de comprometimento</li>
                  <li>Use a chave apenas em ambientes seguros</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sua Chave de API
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 px-4 py-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-gray-600">
                    {apiKey ? '••••••••••••••••••••••••••••••••' : 'Nenhuma chave gerada'}
                  </div>
                  {apiKey && (
                    <button
                      onClick={copyToClipboard}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copiar chave"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <button
  onClick={canEdit ? generateNewKey : undefined}
  disabled={!canEdit || generating}
  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
>
  {generating ? (
    <>
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Gerando...</span>
    </>
  ) : (
    <>
      <RefreshCw className="w-5 h-5" />
      <span>{apiKey ? 'Gerar Nova Chave' : 'Gerar Chave'}</span>
    </>
  )}
</button>

            </div>
          </div>

          {copied && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              Chave copiada para a área de transferência!
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}