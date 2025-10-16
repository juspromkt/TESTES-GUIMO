import React, { useState, useEffect } from 'react';
import { Loader2, Info } from 'lucide-react';
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
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto border border-gray-200 dark:border-neutral-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 mb-6">Configurações de envio</h2>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label htmlFor="maxDisparos" className="block text-sm font-medium text-gray-700 dark:text-neutral-300">
                Máximo de disparos
              </label>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 dark:text-neutral-400 cursor-help" />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-80 p-3 bg-gray-900 dark:bg-neutral-800 text-white dark:text-neutral-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg z-10 border border-gray-700 dark:border-neutral-600">
                  <p className="font-semibold mb-2">Como configurar:</p>
                  <p className="mb-1">• Se sua lista tem <strong>2000 contatos</strong>, coloque <strong>2000</strong> aqui</p>
                  <p>• Este valor define quantos disparos serão feitos por vez</p>
                  <p className="mt-2">• <strong>Dica:</strong> Deixe um valor alto para processar todos os contatos</p>
                </div>
              </div>
            </div>
            <input
              type="number"
              id="maxDisparos"
              disabled={!canEdit}
              value={maxDisparos}
              onChange={(e) => setMaxDisparos(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-neutral-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-2 border bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label htmlFor="delayDisparos" className="block text-sm font-medium text-gray-700 dark:text-neutral-300">
                Delay entre disparos (segundos)
              </label>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 dark:text-neutral-400 cursor-help" />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-72 p-3 bg-gray-900 dark:bg-neutral-800 text-white dark:text-neutral-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg z-10 border border-gray-700 dark:border-neutral-600">
                  <p className="font-semibold mb-2">Recomendações de delay:</p>
                  <p className="mb-1">• <strong>Chip aquecido:</strong> 15 a 45 segundos</p>
                  <p>• <strong>Chip novo:</strong> 60 a 120 segundos</p>
                </div>
              </div>
            </div>
            <input
              type="number"
              id="delayDisparos"
              disabled={!canEdit}
              value={delayDisparos}
              onChange={(e) => setDelayDisparos(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-neutral-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-2 border bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          )}

          <div className="flex justify-end">
          {canEdit && (
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md disabled:opacity-50"
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