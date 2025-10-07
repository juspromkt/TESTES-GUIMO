import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ConversasSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

export default function ConversasSection({ isActive, canEdit }: ConversasSectionProps) {
  const [assinatura, setAssinatura] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (isActive) {
      fetchAssinatura();
    }
  }, [isActive]);

  const fetchAssinatura = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/configuracoes/chat/assinatura/get', {
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar configuração');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setAssinatura(Boolean(data[0].isAssinatura));
      }
    } catch (err) {
      console.error('Erro ao carregar configuração:', err);
      setError('Erro ao carregar configuração');
    }
  };

  const toggleAssinatura = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/configuracoes/chat/assinatura', {
        method: 'POST',
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar configuração');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setAssinatura(Boolean(data[0].isAssinatura));
        setSuccess('Configuração atualizada com sucesso!');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Erro ao atualizar configuração:', err);
      setError('Erro ao atualizar configuração');
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="mt-8">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Conversas</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Assinatura de mensagens</h3>
            <p className="text-sm text-gray-500">Exibir nome do usuário ao final das mensagens enviadas.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={assinatura}
              onChange={canEdit ? toggleAssinatura : undefined}
              disabled={!canEdit || loading}
            />
            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${(!canEdit || loading) ? 'opacity-50' : ''}`}></div>
          </label>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 text-sm text-green-600">{success}</p>}
        {loading && (
          <div className="mt-4 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}
