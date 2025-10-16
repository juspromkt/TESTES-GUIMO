import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { hasPermission } from '../../utils/permissions';

interface ProspectarFormProps {
  onProspeccaoCreated?: () => void;
}

export default function ProspectarForm({ onProspeccaoCreated }: ProspectarFormProps) {
  const [segmento, setSegmento] = useState('');
  const [cidade, setCidade] = useState('');
  const [filtros, setFiltros] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
const canEditProspect = hasPermission('can_edit_prospect');

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  const isAlimenticio = (value: string) => {
    const alimenticioTerms = ['restaurante', 'lanchonete', 'hamburgueria', 'pizzaria', 'bar', 'cafeteria', 'padaria'];
    return alimenticioTerms.some(term => value.toLowerCase().includes(term));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/prospeccao/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token
        },
        body: JSON.stringify({
          segmento,
          cidade,
          filtros
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar prospecção');
      }

      setSegmento('');
      setCidade('');
      setFiltros('');
      onProspeccaoCreated?.();
    } catch (err) {
      console.error('Erro ao criar prospecção:', err);
      setError('Erro ao iniciar prospecção');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-neutral-700">
      <div className="flex items-center gap-2 mb-6">
        <Search className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Prospectar Segmento</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label htmlFor="segmento" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
            Segmento
          </label>
          <input
            type="text"
            id="segmento"
  disabled={!canEditProspect}
            placeholder="Ex: Restaurantes, Clínicas..."
            value={segmento}
            onChange={(e) => setSegmento(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-900 dark:focus:border-neutral-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
            required
          />
          {isAlimenticio(segmento) && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              O Google impõe restrições à exibição de números de telefone em certos segmentos, como o alimentício, o que pode comprometer a eficácia da prospecção.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
            Cidade
          </label>
          <input
            type="text"
            id="cidade"
  disabled={!canEditProspect}
            placeholder="Digite uma cidade por vez"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-900 dark:focus:border-neutral-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
            required
          />
        </div>

        <div>
          <label htmlFor="filtros" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
            Filtros Adicionais
          </label>
          <input
            type="text"
            id="filtros"
              disabled={!canEditProspect}
            placeholder="Ex: apenas lojas físicas..."
            value={filtros}
            onChange={(e) => setFiltros(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-900 dark:focus:border-neutral-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
          />
        </div>

        {error && (
          <div className="col-span-full">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="col-span-full">
        {canEditProspect && (

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Iniciar Prospecção'}
          </button>
          )}
        </div>
      </form>
    </div>
  );
}