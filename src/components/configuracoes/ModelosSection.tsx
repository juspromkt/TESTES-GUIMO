import React, { useState, useEffect } from 'react';
import { Loader2, Plus, X, Trash2, AlertCircle, Pencil, Check } from 'lucide-react';
import type { Fonte } from '../../types/fonte';
import Pagination from '../Pagination';

interface ModelosSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

interface Modelo {
  id: number;
  nome: string;
  texto: string;
}

export default function ModelosSection({ isActive, canEdit }: ModelosSectionProps) {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedModelo, setSelectedModelo] = useState<Modelo | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    texto: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (isActive) {
      fetchModelos();
    }
  }, [isActive]);

  const fetchModelos = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/modelo/get', {
        headers: { token }
      });
const data = await response.json();
const sanitized = Array.isArray(data)
  ? data.filter(
      (m: any) =>
        m &&
        typeof m === 'object' &&
        Object.keys(m).length > 0 &&
        typeof m.id !== 'undefined' &&
        typeof m.nome === 'string' &&
        typeof m.texto === 'string'
    )
  : [];
setModelos(sanitized);

    } catch (err) {
      console.error('Erro ao carregar modelos:', err);
      setError('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = selectedModelo
        ? 'https://n8n.lumendigital.com.br/webhook/prospecta/modelo/update'
        : 'https://n8n.lumendigital.com.br/webhook/prospecta/modelo/create';

      const method = selectedModelo ? 'PUT' : 'POST';
      const body = selectedModelo
        ? { ...formData, id: selectedModelo.id }
        : { body: formData };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(selectedModelo ? 'Erro ao atualizar modelo' : 'Erro ao criar modelo');
      }

      await fetchModelos();
      setIsModalOpen(false);
      setFormData({ nome: '', texto: '' });
      setSelectedModelo(null);
      setSuccess(selectedModelo ? 'Modelo atualizado com sucesso!' : 'Modelo criado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar modelo:', err);
      setError(selectedModelo ? 'Erro ao atualizar modelo' : 'Erro ao criar modelo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedModelo) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/modelo/delete?id=${selectedModelo.id}`,
        {
          method: 'DELETE',
          headers: { token }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir modelo');
      }

      await fetchModelos();
      setIsDeleteModalOpen(false);
      setSelectedModelo(null);
      setSuccess('Modelo excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao excluir modelo:', err);
      setError('Erro ao excluir modelo');
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedModelos = modelos.slice(startIndex, endIndex);

  if (!isActive) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Modelos</h2>
{canEdit && (
  <button
    onClick={() => {
      setSelectedModelo(null);
      setFormData({ nome: '', texto: '' });
      setIsModalOpen(true);
    }}
    className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
  >
    <Plus size={20} />
    Novo Modelo
  </button>
)}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-4">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Texto
              </th>
              {canEdit && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedModelos.map((modelo) => (
              <tr key={modelo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{modelo.nome}</div>
                </td>

<td className="px-6 py-4">
  <div
    className="text-sm text-gray-500 truncate max-w-md"
    dangerouslySetInnerHTML={{
      __html: (modelo.texto || "")
        .replace(/{{primeiroNome}}/g, '<span class="text-blue-600 font-semibold">{{primeiroNome}}</span>')
        .replace(/{{nomeCompleto}}/g, '<span class="text-green-600 font-semibold">{{nomeCompleto}}</span>')
    }}
  />
</td>


                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {canEdit && (
  <button
    onClick={() => {
      setSelectedModelo(modelo);
      setFormData({
        nome: modelo.nome,
        texto: modelo.texto
      });
      setIsModalOpen(true);
    }}
    className="text-blue-600 hover:text-blue-900"
  >
    <Pencil className="w-5 h-5" />
  </button>
)}

                    {canEdit && (
  <button
    onClick={() => {
      setSelectedModelo(modelo);
      setIsDeleteModalOpen(true);
    }}
    className="text-red-600 hover:text-red-900"
  >
    <Trash2 className="w-5 h-5" />
  </button>
)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          totalItems={modelos.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Create/Edit Modal */}
{canEdit && isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedModelo ? 'Editar Modelo' : 'Novo Modelo'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedModelo(null);
                  setFormData({ nome: '', texto: '' });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Modelo
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="texto" className="block text-sm font-medium text-gray-700 mb-1">
                    Texto do Modelo
                  </label>
                  <textarea
                    id="texto"
                    value={formData.texto}
                    onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
<div className="text-xs text-gray-500 mt-1">
  Você pode usar as variáveis:
  <span className="text-blue-600 font-semibold"> {'{{primeiroNome}}'} </span>
  e
  <span className="text-green-600 font-semibold"> {'{{nomeCompleto}}'} </span><br />Clique nos botões abaixo para adicionar
</div>
  <div className="flex gap-2 mt-2">
    <button
      type="button"
      onClick={() =>
        setFormData({ ...formData, texto: formData.texto + ' {{primeiroNome}}' })
      }
      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
    >
      Primeiro Nome
    </button>
    <button
      type="button"
      onClick={() =>
        setFormData({ ...formData, texto: formData.texto + ' {{nomeCompleto}}' })
      }
      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
    >
      Nome Completo
    </button>
  </div>


                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedModelo(null);
                      setFormData({ nome: '', texto: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{selectedModelo ? 'Atualizar' : 'Criar'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedModelo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Tem certeza que deseja excluir o modelo "{selectedModelo.nome}"?
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedModelo(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}