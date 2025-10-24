import React, { useState, useEffect } from 'react';
import { Loader2, Plus, X, Edit, Building2 } from 'lucide-react';
import type { Departamento } from '../../types/departamento';
import { isDepartamento } from '../../types/departamento';

interface DepartamentosSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

export default function DepartamentosSection({ isActive, canEdit }: DepartamentosSectionProps) {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDepartamento, setEditDepartamento] = useState<Departamento | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editAtivo, setEditAtivo] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (isActive) {
      fetchDepartamentos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const fetchDepartamentos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/produtos/get', {
        headers: { token },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar departamentos');
      }

      const data = await response.json();
      // Filtrar apenas departamentos (valor_unitario = 0)
      const departamentosValidos = Array.isArray(data)
        ? (data.filter((p: Partial<Departamento>) => p && p.Id && p.nome && isDepartamento(p as Departamento)) as Departamento[])
        : [];

      setDepartamentos(departamentosValidos);
    } catch {
      setError('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/produtos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify({
          nome,
          descricao,
          valor_unitario: 0, // Departamentos sempre têm valor 0
          isAtivo: ativo,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar departamento');
      }

      await fetchDepartamentos();
      setIsModalOpen(false);
      setNome('');
      setDescricao('');
      setAtivo(true);
    } catch {
      setFormError('Erro ao criar departamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (departamento: Departamento) => {
    setEditDepartamento(departamento);
    setEditNome(departamento.nome);
    setEditDescricao(departamento.descricao);
    setEditAtivo(departamento.isAtivo);
    setIsEditModalOpen(true);
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDepartamento) return;
    setEditSubmitting(true);
    setEditError(null);

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/produtos/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify({
          Id: editDepartamento.Id,
          nome: editNome,
          descricao: editDescricao,
          valor_unitario: 0, // Manter valor 0 para departamentos
          isAtivo: editAtivo,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar departamento');
      }

      await fetchDepartamentos();
      setIsEditModalOpen(false);
      setEditDepartamento(null);
    } catch {
      setEditError('Erro ao atualizar departamento. Tente novamente.');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-gray-700 dark:text-neutral-300" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Departamentos</h2>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Novo Departamento
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
            <thead className="bg-gray-50 dark:bg-neutral-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                  Ativo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
              {departamentos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 dark:text-neutral-400 py-6 text-sm">
                    Não há departamentos cadastrados.
                  </td>
                </tr>
              ) : (
                departamentos.map((departamento) => (
                  <tr key={departamento.Id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-neutral-400">#{departamento.Id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">{departamento.nome}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-neutral-200">{departamento.descricao}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        departamento.isAtivo
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-neutral-300'
                      }`}>
                        {departamento.isAtivo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {canEdit && (
                        <button
                          onClick={() => openEdit(departamento)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Novo Departamento</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Financeiro, RH, TI"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Descrição do departamento"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="departamentoAtivo"
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-neutral-600 rounded"
                />
                <label htmlFor="departamentoAtivo" className="text-sm text-gray-700 dark:text-neutral-300">
                  Departamento ativo
                </label>
              </div>
              {formError && (
                <div className="text-sm text-red-600 dark:text-red-400">{formError}</div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {isEditModalOpen && editDepartamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Editar Departamento</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="editDepartamentoAtivo"
                  type="checkbox"
                  checked={editAtivo}
                  onChange={(e) => setEditAtivo(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-neutral-600 rounded"
                />
                <label htmlFor="editDepartamentoAtivo" className="text-sm text-gray-700 dark:text-neutral-300">
                  Departamento ativo
                </label>
              </div>
              {editError && (
                <div className="text-sm text-red-600 dark:text-red-400">{editError}</div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
