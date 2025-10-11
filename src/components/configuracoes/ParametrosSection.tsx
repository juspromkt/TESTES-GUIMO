import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../Modal';

interface ParametrosSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

interface Parametro {
  max_disparos_por_vez: string;
  delay_entre_disparo: string;
}

export default function ParametrosSection({ isActive, canEdit }: ParametrosSectionProps) {
  const [maxDisparos, setMaxDisparos] = useState('');
  const [delayDisparos, setDelayDisparos] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (isActive) {
      fetchParametros();
    }
  }, [isActive]);

  const fetchParametros = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/parametro/get', {
        headers: { token }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const params = data[0];
        setMaxDisparos(params.max_disparos_por_vez);
        setDelayDisparos(params.delay_entre_disparo);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Erro ao carregar configurações');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/parametro/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          body: {
            max_disparos_por_vez: maxDisparos,
            delay_entre_disparo: delayDisparos
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar configurações');
      }

      setSuccess('Configurações atualizadas com sucesso!');
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
      setError('Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="mt-8">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurações</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="maxDisparos" className="block text-sm font-medium text-gray-700">
              Máximo de disparos (Se sua lista tem 2000 nomes, coloque 2000 aqui)
            </label>
            <input
              type="number"
              id="maxDisparos"
              disabled={!canEdit}
              value={maxDisparos}
              onChange={(e) => setMaxDisparos(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              required
            />
          </div>

          <div>
            <label htmlFor="delayDisparos" className="block text-sm font-medium text-gray-700">
              Delay entre disparos (segundos)
            </label>
            <input
              type="number"
              id="delayDisparos"
              disabled={!canEdit}
              value={delayDisparos}
              onChange={(e) => setDelayDisparos(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-600">{success}</p>
          )}

          <div className="flex justify-end">
          {canEdit && (
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : (
                'Salvar'
              )}
            </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}