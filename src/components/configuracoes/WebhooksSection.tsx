import React, { useState, useEffect } from 'react';
import { Webhook, Save, Loader2, AlertCircle } from 'lucide-react';

interface WebhookConfig {
  followup_realizado: string;
  novo_lead: string;
  mensagem_recebida: string;
  nova_movimentacao: string;
  reuniao_agendada: string;
  lembrete_enviado: string;
  mensagem_enviada: string;
}

interface WebhooksSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

export default function WebhooksSection({ isActive, canEdit }: WebhooksSectionProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfig>({
    followup_realizado: '',
    novo_lead: '',
    mensagem_recebida: '',
    nova_movimentacao: '',
    reuniao_agendada: '',
    lembrete_enviado: '',
    mensagem_enviada: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (isActive) {
      fetchWebhooks();
    }
  }, [isActive]);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/webhook/get', {
        headers: { token }
      });
      
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setWebhooks(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar webhooks:', err);
      setError('Erro ao carregar webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/webhook/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(webhooks)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar webhooks');
      }

      setSuccess('Webhooks atualizados com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar webhooks:', err);
      setError('Erro ao salvar webhooks');
    } finally {
      setSaving(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="mt-8">
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Webhook className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Webhooks</h2>
            <p className="text-sm text-gray-500 mt-1">Configure URLs para receber notificações de eventos</p>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            <strong>Instruções:</strong>
          </p>
          <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
            <li>Todas as requisições devem ser do tipo POST</li>
            <li>As URLs devem ser válidas e acessíveis</li>
            <li>Os webhooks serão acionados em tempo real quando os eventos ocorrerem</li>
            <li>Certifique-se de que seu endpoint pode processar as requisições de forma adequada</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Realizado
              </label>
              <input
                type="url"
                value={webhooks.followup_realizado}
                onChange={(e) => setWebhooks({ ...webhooks, followup_realizado: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://seu-dominio.com/webhook/followup"
                  disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Novo Lead
              </label>
              <input
                type="url"
                value={webhooks.novo_lead}
                onChange={(e) => setWebhooks({ ...webhooks, novo_lead: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://seu-dominio.com/webhook/lead"
                  disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem Recebida
              </label>
              <input
                type="url"
                value={webhooks.mensagem_recebida}
                onChange={(e) => setWebhooks({ ...webhooks, mensagem_recebida: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://seu-dominio.com/webhook/message"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Movimentação
              </label>
              <input
                type="url"
                value={webhooks.nova_movimentacao}
                onChange={(e) => setWebhooks({ ...webhooks, nova_movimentacao: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://seu-dominio.com/webhook/movement"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reunião Agendada
              </label>
              <input
                type="url"
                value={webhooks.reuniao_agendada}
                onChange={(e) => setWebhooks({ ...webhooks, reuniao_agendada: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://seu-dominio.com/webhook/meeting"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lembrete Enviado
              </label>
              <input
                type="url"
                value={webhooks.lembrete_enviado}
                onChange={(e) => setWebhooks({ ...webhooks, lembrete_enviado: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://seu-dominio.com/webhook/reminder"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem Enviada
              </label>
              <input
                type="url"
                value={webhooks.mensagem_enviada}
                onChange={(e) => setWebhooks({ ...webhooks, mensagem_enviada: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://seu-dominio.com/webhook/sent"
                disabled={!canEdit}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg">
              {success}
            </div>
          )}

          {canEdit && (
  <div className="flex justify-end pt-6">
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
    >
      {saving ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Salvando...</span>
        </>
      ) : (
        <>
          <Save className="w-5 h-5" />
          <span>Salvar Webhooks</span>
        </>
      )}
    </button>
  </div>
)}

        </form>
      </div>
    </div>
  );
}