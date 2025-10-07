import React, { useState, useEffect } from 'react';
import { Loader2, Plus, X, Edit } from 'lucide-react';
import type { CampoPersonalizado } from '../../types/campo';

interface CamposSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

const tipoOptions = [
  { value: 'INTEGER', label: 'INTEGER - números inteiros' },
  { value: 'DECIMAL', label: 'DECIMAL - números com casas decimais' },
  { value: 'STRING', label: 'STRING - textos livres' },
  { value: 'BOOLEAN', label: 'BOOLEAN - verdadeiro ou falso' },
  { value: 'DATE', label: 'DATE - datas sem hora' },
  { value: 'DATETIME', label: 'DATETIME - datas com hora' },
] as const;

const tipoDescriptions: Record<CampoPersonalizado['tipo'], string> = {
  INTEGER: 'Aceita apenas números inteiros, sem casas decimais.',
  DECIMAL: 'Aceita números com casas decimais.',
  STRING: 'Aceita textos e combinações de caracteres.',
  BOOLEAN: 'Aceita apenas os valores verdadeiro ou falso.',
  DATE: 'Aceita datas no formato dia/mês/ano.',
  DATETIME: 'Aceita datas com hora e minuto.',
};

export default function CamposSection({ isActive, canEdit }: CamposSectionProps) {
  const [campos, setCampos] = useState<CampoPersonalizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newTipo, setNewTipo] = useState<CampoPersonalizado['tipo']>('STRING');
  const [newAtivo, setNewAtivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCampo, setEditCampo] = useState<CampoPersonalizado | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editAtivo, setEditAtivo] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (isActive) {
      fetchCampos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const fetchCampos = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/campos/get', {
        headers: { token },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar campos');
      }

      const data = await response.json();
      const camposValidos = Array.isArray(data)
        ? (data.filter((c: Partial<CampoPersonalizado>) => c && c.Id && c.nome && c.tipo) as CampoPersonalizado[])
        : [];

      setCampos(camposValidos);
    } catch {
      setError('Erro ao carregar campos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/campos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify({
          nome: newNome,
          tipo: newTipo,
          isAtivo: newAtivo,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar campo');
      }

      await fetchCampos();
      setIsModalOpen(false);
      setNewNome('');
      setNewTipo('STRING');
      setNewAtivo(true);
    } catch {
      setFormError('Erro ao criar campo. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (campo: CampoPersonalizado) => {
    setEditCampo(campo);
    setEditNome(campo.nome);
    setEditAtivo(campo.isAtivo);
    setIsEditModalOpen(true);
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCampo) return;
    setEditSubmitting(true);
    setEditError(null);

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/campos/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify({
          Id: editCampo.Id,
          nome: editNome,
          isAtivo: editAtivo,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar campo');
      }

      await fetchCampos();
      setIsEditModalOpen(false);
      setEditCampo(null);
    } catch {
      setEditError('Erro ao atualizar campo. Tente novamente.');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Campos personalizados</h2>
        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Novo Campo
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
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ativo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-6 text-sm">
                    Não há campos cadastrados.
                  </td>
                </tr>
              ) : (
                campos.map((campo) => (
                  <tr key={campo.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">#{campo.Id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campo.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{campo.tipo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{campo.isAtivo ? 'Sim' : 'Não'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {canEdit && (
                        <button
                          onClick={() => openEdit(campo)}
                          className="text-blue-600 hover:text-blue-900"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Campo</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={newTipo}
                  onChange={(e) => setNewTipo(e.target.value as CampoPersonalizado['tipo'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {tipoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {tipoDescriptions[newTipo]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="ativo"
                  type="checkbox"
                  checked={newAtivo}
                  onChange={(e) => setNewAtivo(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">
                  Campo ativo
                </label>
              </div>
              {formError && (
                <div className="text-sm text-red-600">{formError}</div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
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

      {isEditModalOpen && editCampo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Campo</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {editCampo.tipo}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  O tipo do campo não pode ser alterado.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="editAtivo"
                  type="checkbox"
                  checked={editAtivo}
                  onChange={(e) => setEditAtivo(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="editAtivo" className="text-sm text-gray-700">
                  Campo ativo
                </label>
              </div>
              {editError && (
                <div className="text-sm text-red-600">{editError}</div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
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