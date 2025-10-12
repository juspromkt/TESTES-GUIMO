import React, { useState, useEffect } from 'react';
import { Loader2, Plus, X, Trash2, AlertCircle } from 'lucide-react';
import type { Fonte } from '../../types/fonte';
import Pagination from '../Pagination';

interface FontesSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

export default function FontesSection({ isActive, canEdit }: FontesSectionProps) {
  const [fontes, setFontes] = useState<Fonte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFonteName, setNewFonteName] = useState('');
  const [newFonteSource, setNewFonteSource] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFonte, setSelectedFonte] = useState<Fonte | null>(null);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (isActive) {
      fetchFontes();
    }
  }, [isActive]);

const fetchFontes = async () => {
  try {
    const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/fonte/get', {
      headers: { token }
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar fontes');
    }

    const data = await response.json();

    // Filtra apenas fontes com ID e nome válidos
    const fontesValidas = Array.isArray(data)
      ? data.filter(f => f && f.Id && f.nome)
      : [];

    setFontes(fontesValidas);
  } catch (err) {
    setError('Erro ao carregar fontes');
  } finally {
    setLoading(false);
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/fonte/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          nome: newFonteName,
          source: newFonteSource || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar fonte');
      }

      await fetchFontes();
      setIsModalOpen(false);
      setNewFonteName('');
      setNewFonteSource('');
    } catch (err) {
      setFormError('Erro ao criar fonte. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFonte) return;

    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/fonte/delete?id=${selectedFonte.Id}`, {
        method: 'DELETE',
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir fonte');
      }

      await fetchFontes();
      setIsDeleteModalOpen(false);
      setSelectedFonte(null);
    } catch (err) {
      setError('Erro ao excluir fonte');
    }
  };

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFontes = fontes.slice(startIndex, endIndex);

  if (!isActive) return null;

 return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
  <h2 className="text-xl font-semibold text-gray-900">Origem do Lead</h2>

  {/* Botão de informação */}
  <div className="relative group">
    <button
      className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 transition-colors"
      title=""
    >
      ?
    </button>

    {/* Tooltip */}
    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg z-10">
      A <strong>origem do lead</strong> é preenchida de forma automática pelo sistema, você não precisa configurar. Automaticamente o sistema identificará de onde o lead veio (ex: facebook ads) e mostrará essa informação aqui (e no cartão CRM do lead). Se o lead não tiver uma origem identificada, será mostrado como <em>Indefinida</em>. Se você quiser ter controle total da fonte, fale com seu gestor de tráfego - ele saberá configurar, caso necessário.
    </div>
  </div>
</div>
        {canEdit && (
  <button
    onClick={() => setIsModalOpen(true)}
    className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
  >
    <Plus size={20} />
    Nova Fonte
  </button>
)}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
<tbody className="bg-white divide-y divide-gray-200">
  {paginatedFontes.length === 0 ? (
    <tr>
      <td colSpan={4} className="text-center text-gray-500 py-6 text-sm">
        Não há fontes cadastradas.
      </td>
    </tr>
  ) : (
    paginatedFontes.map((fonte) => (
      <tr key={fonte.Id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">#{fonte.Id}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{fonte.nome}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{fonte.source || '-'}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
{canEdit && (
  <button
    onClick={() => {
      setSelectedFonte(fonte);
      setIsDeleteModalOpen(true);
    }}
    className="text-red-600 hover:text-red-900"
  >
    <Trash2 className="w-5 h-5" />
  </button>
)}
        </td>
      </tr>
    ))
  )}
</tbody>
          </table>
          
          <Pagination
            totalItems={fontes.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* Nova Fonte Modal */}
{canEdit && isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">Nova Fonte</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Fonte
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={newFonteName}
                    onChange={(e) => setNewFonteName(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Digite o nome da fonte..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                    Source
                  </label>
                  <input
                    type="text"
                    id="source"
                    value={newFonteSource}
                    onChange={(e) => setNewFonteSource(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Digite o source da fonte..."
                  />
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-blue-600 text-white rounded-md px-6 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
{canEdit && isDeleteModalOpen && selectedFonte && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Confirmar Exclusão
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Tem certeza que deseja excluir a fonte "{selectedFonte.nome}"?
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedFonte(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}