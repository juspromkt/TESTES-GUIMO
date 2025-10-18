import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GitBranch, Plus, Loader2, Settings, Trash2, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Funil, Estagio } from '../../types/funil';
import FunnelModal from './FunnelModal';

interface FunisSectionProps {
  isActive: boolean;
  canEdit: boolean;
}

export default function FunisSection({ isActive, canEdit }: FunisSectionProps) {
  const [funis, setFunis] = useState<Funil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFunil, setSelectedFunil] = useState<Funil | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFunilName, setNewFunilName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingField, setLoadingField] = useState<{ id: string; field: keyof Estagio } | null>(null);
  const [collapsedFunis, setCollapsedFunis] = useState<Set<number>>(new Set());

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  

  useEffect(() => {
    if (isActive) {
      fetchFunis();
    }
  }, [isActive]);

  const fetchFunis = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', {
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar funis');
      }

      const data = await response.json();

      // Filtra apenas funis com ID e nome válidos
      const funisValidos = Array.isArray(data)
        ? data.filter(f => f && f.id && f.nome)
        : [];

      setFunis(funisValidos);

      // Recolhe todos os funis por padrão
      setCollapsedFunis(new Set(funisValidos.map(f => f.id)));
    } catch (err) {
      console.error('Erro ao carregar funis:', err);
      setError('Erro ao carregar funis');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFunil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          nome: newFunilName
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar funil');
      }

      await fetchFunis();
      setIsCreateModalOpen(false);
      setNewFunilName('');
      setSuccess('Funil criado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao criar funil:', err);
      setError('Erro ao criar funil');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStage = async (stage: Estagio) => {
    const endpoint = stage.Id 
      ? 'https://n8n.lumendigital.com.br/webhook/prospecta/estagio/update'
      : 'https://n8n.lumendigital.com.br/webhook/prospecta/estagio/create';
    
    const method = stage.Id ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify(stage)
    });

    if (!response.ok) {
      throw new Error(`Erro ao ${stage.Id ? 'atualizar' : 'criar'} estágio`);
    }

    // Fetch updated data
    await fetchFunis();
    
    // Update selectedFunil with new data
    const updatedFunis = funis.find(f => f.id === selectedFunil?.id);
    if (updatedFunis) {
      setSelectedFunil(updatedFunis);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/estagio/delete?id=${stageId}`, {
      method: 'DELETE',
      headers: { token }
    });

    if (!response.ok) {
      throw new Error('Erro ao excluir estágio');
    }

    await fetchFunis();
  };

  const handleDeleteFunil = async () => {
    if (!selectedFunil) return;

    setSubmitting(true);
    setError('');

    try {
      // Verifica apenas se é funil padrão
      if (selectedFunil.isFunilPadrao) {
        throw new Error('Não é possível excluir o funil padrão');
      }

      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/funil/delete?id=${selectedFunil.id}`,
        {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'token': token
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir funil');
      }

      await fetchFunis();
      setSelectedFunil(null);
      setIsModalOpen(false);
      setIsDeleteModalOpen(false);
      setSuccess('Funil excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao excluir funil:', err);
      setError(err.message || 'Erro ao excluir funil');
    } finally {
      setSubmitting(false);
    }
  };

  

  const handleUpdateStageConfig = async (stage: Estagio, config: Partial<Estagio>) => {
    const field = Object.keys(config)[0] as keyof Estagio;
    setLoadingField({ id: stage.Id, field });

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/estagio/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          ...stage,
          ...config
        })
      });

      if (!response.ok) throw new Error('Erro ao atualizar configuração do estágio');

      await fetchFunis();
      setSuccess('Configuração atualizada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar configuração:', err);
      setError('Erro ao atualizar configuração do estágio');
    } finally {
      setLoadingField(null);
    }
  };

  

  // Função para abrir o modal de edição
  const handleEditFunil = (funil: Funil) => {
    setSelectedFunil(funil);
    setIsModalOpen(true);
  };

  // Função para abrir o modal de criação
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  // Função para fechar modals
  const handleCloseModals = () => {
    setIsModalOpen(false);
    setIsCreateModalOpen(false);
    setSelectedFunil(null);
    setNewFunilName('');
    setError('');
  };

  // Função para recolher/expandir funil
  const toggleFunilCollapse = (funilId: number) => {
    setCollapsedFunis(prev => {
      const newSet = new Set(prev);
      if (newSet.has(funilId)) {
        newSet.delete(funilId);
      } else {
        newSet.add(funilId);
      }
      return newSet;
    });
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Funis de Vendas</h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Gerencie os estágios do seu funil de vendas</p>
          </div>

          {canEdit && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
            >
              <Plus className="w-4 h-4" />
              Novo Funil
            </button>
          )}
        </div>


        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {funis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-neutral-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-neutral-700">
            <GitBranch className="w-12 h-12 text-gray-400 dark:text-neutral-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-neutral-300 mb-2">Nenhum funil encontrado</h3>
            <p className="text-gray-500 dark:text-neutral-400 text-sm text-center max-w-md">
              Comece criando seu primeiro funil de vendas para organizar seus leads.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {funis.map((funil) => {
              const isCollapsed = collapsedFunis.has(funil.id);
              return (
                <div key={funil.id} className="bg-gray-50 dark:bg-neutral-900/50 rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
                  {/* Funil Header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => toggleFunilCollapse(funil.id)}
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <div className="text-gray-400 dark:text-neutral-500">
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </div>
                      <GitBranch className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{funil.nome}</h3>
                          {funil.isFunilPadrao && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              Padrão
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-neutral-400">
                          ID: {funil.id}
                        </span>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFunil(funil);
                        }}
                        className="p-1.5 text-gray-400 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Configurar funil"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Pipeline Stages */}
                  {!isCollapsed && (
                    <div className="p-3 bg-white dark:bg-neutral-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {funil.estagios?.map((estagio) => (
                          <div
                            key={estagio.Id}
                            className="rounded-lg p-3 border bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                            style={{ borderColor: estagio.cor || '#e5e7eb' }}
                          >
                            {/* Stage Header */}
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-sm font-semibold"
                                style={{
                                  backgroundColor: estagio.cor || '#6b7280',
                                  color: estagio.cor_texto_principal || '#ffffff'
                                }}
                              >
                                {estagio.ordem}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold truncate text-gray-900 dark:text-neutral-100">
                                  {estagio.nome}
                                </h4>
                                <span className="text-xs text-gray-500 dark:text-neutral-400">
                                  ID: {estagio.Id}
                                </span>
                              </div>
                            </div>

                            {/* Follow-up Toggle */}
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-900 rounded">
                              <span className="text-xs text-gray-700 dark:text-neutral-300">
                                Ativar follow-up para esta etapa?
                              </span>
                              {loadingField?.id === estagio.Id && loadingField?.field === 'isFollowUp' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                              ) : (
                                <button
                                  onClick={
                                    canEdit
                                      ? () =>
                                          handleUpdateStageConfig(estagio, {
                                            isFollowUp: !estagio.isFollowUp
                                          })
                                      : undefined
                                  }
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    estagio.isFollowUp ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-neutral-600'
                                  } ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                  disabled={!canEdit}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      estagio.isFollowUp ? 'translate-x-4' : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Funnel Modal */}
        {canEdit && isCreateModalOpen && createPortal(
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
            onClick={handleCloseModals}
          >
            <div
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-neutral-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Criar Novo Funil</h3>
                <button
                  onClick={handleCloseModals}
                  className="p-1 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateFunil} className="p-5">
                <div className="mb-4">
                  <label htmlFor="funilName" className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Nome do Funil
                  </label>
                  <input
                    type="text"
                    id="funilName"
                    value={newFunilName}
                    onChange={(e) => setNewFunilName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                    placeholder="Ex: Funil Trabalhista"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newFunilName.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Criar Funil
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Edit Funnel Modal */}
        {canEdit && selectedFunil && (
          <FunnelModal
            isOpen={isModalOpen}
            onClose={handleCloseModals}
            selectedFunil={selectedFunil}
            onSaveStage={handleSaveStage}
            onDeleteStage={handleDeleteStage}
            onDeleteFunil={handleDeleteFunil}
            token={token}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  );
}