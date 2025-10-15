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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Funis de Vendas</h2>
            <p className="text-sm text-gray-500 mt-1">Gerencie os estágios do seu funil de vendas</p>
          </div>

          {canEdit && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Funil
            </button>
          )}
        </div>


        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {funis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <GitBranch className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum funil encontrado</h3>
            <p className="text-gray-500 text-sm text-center max-w-md">
              Comece criando seu primeiro funil de vendas para organizar seus leads.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {funis.map((funil) => {
              const isCollapsed = collapsedFunis.has(funil.id);
              return (
                <div key={funil.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Funil Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleFunilCollapse(funil.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-1 text-gray-400">
                        {isCollapsed ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronUp className="w-5 h-5" />
                        )}
                      </div>
                      <GitBranch className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{funil.nome}</h3>
                          {funil.isFunilPadrao && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                              Padrão
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
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
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Configurar funil"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Pipeline Stages */}
                  {!isCollapsed && (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {funil.estagios?.map((estagio) => (
                          <div
                            key={estagio.Id}
                            className="rounded-lg p-4 border border-gray-200"
                            style={{ backgroundColor: estagio.cor || '#ffffff' }}
                          >
                            {/* Stage Header */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shadow-sm border-2"
                                style={{
                                  backgroundColor: estagio.cor_texto_principal || '#1f2937',
                                  color: estagio.cor || '#ffffff',
                                  borderColor: estagio.cor_texto_principal || '#1f2937'
                                }}
                              >
                                {estagio.ordem}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4
                                  className="text-sm font-semibold truncate"
                                  style={{ color: estagio.cor_texto_principal || '#1f2937' }}
                                >
                                  {estagio.nome}
                                </h4>
                                <span
                                  className="text-xs opacity-70"
                                  style={{ color: estagio.cor_texto_secundario || '#6b7280' }}
                                >
                                  ID: {estagio.Id}
                                </span>
                              </div>
                            </div>

                            {/* Follow-up Toggle */}
                            <div className="flex items-center justify-between p-2 bg-white bg-opacity-30 rounded-lg">
                              <span
                                className="text-xs font-medium"
                                style={{ color: estagio.cor_texto_secundario || '#6b7280' }}
                              >
                                Ativar follow-up para esta etapa?
                              </span>
                              {loadingField?.id === estagio.Id && loadingField?.field === 'isFollowUp' ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
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
                                    estagio.isFollowUp ? 'bg-blue-600' : 'bg-gray-300'
                                  } ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                  disabled={!canEdit}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      estagio.isFollowUp ? 'translate-x-5' : 'translate-x-0.5'
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
            onClick={handleCloseModals}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Criar Novo Funil</h3>
                <button
                  onClick={handleCloseModals}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateFunil} className="p-5">
                <div className="mb-4">
                  <label htmlFor="funilName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Funil
                  </label>
                  <input
                    type="text"
                    id="funilName"
                    value={newFunilName}
                    onChange={(e) => setNewFunilName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Funil Trabalhista"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newFunilName.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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