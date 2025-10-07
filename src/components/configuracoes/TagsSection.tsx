import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import type { Tag } from '../../types/tag';

interface TagsSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

export default function TagsSection({ isActive, canEdit }: TagsSectionProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ nome: '', cor: '#000000', cor_texto: '#ffffff' });
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    if (isActive) {
      fetchTags();
    }
  }, [isActive]);

  const fetchTags = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/list', { headers: { token } });
      if (!response.ok) throw new Error('Erro ao carregar etiquetas');
      const data = await response.json();
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erro ao carregar etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = editingTag ?
        'https://n8n.lumendigital.com.br/webhook/prospecta/tag/update' :
        'https://n8n.lumendigital.com.br/webhook/prospecta/tag/create';
      const method = editingTag ? 'PUT' : 'POST';
      const body = editingTag ? { ...formData, Id: editingTag.Id } : formData;
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Erro ao salvar etiqueta');
      await fetchTags();
      setIsModalOpen(false);
      setEditingTag(null);
      setFormData({ nome: '', cor: '#000000', cor_texto: '#ffffff' });
    } catch (err) {
      setError('Erro ao salvar etiqueta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTag) return;
    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/tag/delete?id=${selectedTag.Id}`, {
        method: 'DELETE',
        headers: { token }
      });
      if (!response.ok) throw new Error('Erro ao excluir etiqueta');
      await fetchTags();
      setIsDeleteModalOpen(false);
      setSelectedTag(null);
    } catch (err) {
      setError('Erro ao excluir etiqueta');
    }
  };

  if (!isActive) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Etiquetas</h2>
        {canEdit && (
          <button
            onClick={() => {
              setEditingTag(null);
              setFormData({ nome: '', cor: '#000000', cor_texto: '#ffffff' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} /> Nova Etiqueta
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visualização</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-6 text-sm">Nenhuma etiqueta cadastrada.</td>
                </tr>
              ) : (
                tags.map(tag => (
                  <tr key={tag.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{tag.Id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tag.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: tag.cor, color: tag.cor_texto }}>{tag.nome}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right flex gap-2 justify-end">
                      {canEdit && (
                        <>
                          <button
                            onClick={() => {
                              setEditingTag(tag);
                              setFormData({ nome: tag.nome, cor: tag.cor, cor_texto: tag.cor_texto });
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTag(tag);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{editingTag ? 'Editar' : 'Nova'} Etiqueta</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-600">Cor Fundo</span>
                  <input
                    type="color"
                    value={formData.cor}
                    onChange={e => setFormData({ ...formData, cor: e.target.value })}
                    className="w-10 h-10 rounded border"
                  />
                </label>
                <label className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-600">Cor Texto</span>
                  <input
                    type="color"
                    value={formData.cor_texto}
                    onChange={e => setFormData({ ...formData, cor_texto: e.target.value })}
                    className="w-10 h-10 rounded border"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckIcon />} {editingTag ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Confirmar Exclusão</h2>
                  <p className="text-gray-500 mt-1">Tem certeza que deseja excluir a etiqueta "{selectedTag.nome}"?</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setIsDeleteModalOpen(false); setSelectedTag(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md">
                  Cancelar
                </button>
                <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
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

function CheckIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>;
}