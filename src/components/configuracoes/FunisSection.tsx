import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Loader2, Pencil, Trash2, AlertCircle } from 'lucide-react';
import type { Funil, Estagio } from '../../types/funil';
import Modal from '../Modal';
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

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl gap-4 overflow-visible">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <GitBranch className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
  Status do Lead - Funis
  <div className="relative group overflow-visible z-[9999]">
    <button
      className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 transition-colors"
      title=""
    >
      ?
    </button>

    {/* Tooltip */}
<div className="absolute left-6 top-1/2 -translate-y-1/2
                w-[30rem] md:w-[34rem] max-w-[90vw]
                p-4 bg-gray-800 text-white text-sm rounded-lg
                opacity-0 group-hover:opacity-100 transition-opacity duration-300
                pointer-events-none shadow-2xl z-[99999]
                whitespace-normal leading-relaxed break-words">
  Cada funil representa um fluxo de atendimento, e cada estágio dentro do funil representa uma etapa desse fluxo. 
  É recomendado ter apenas um funil ativo. Cada lead pode ser movido entre os estágios conforme avança no atendimento 
  (de forma automática pela IA - nas configurações de Agente, Movimentações automáticas - ou manual pelo cartão CRM do lead).
</div>
  </div>
</h2>


              <p className="text-gray-500 text-xs sm:text-sm">Defina os status do lead em cada etapa do seu funil</p>
            </div>
          </div>

          
          
          {canEdit && (
            <button
              onClick={handleOpenCreateModal}
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
              <span className="relative z-10 text-sm sm:text-base">Novo Funil</span>
            </button>
          )}
        </div>

        

        {/* Error Alert */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-700 font-medium text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {funis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
              <GitBranch className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Nenhum funil encontrado</h3>
            <p className="text-gray-500 text-center max-w-md text-sm">
              Comece criando seu primeiro funil de vendas para organizar seus leads e oportunidades.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {funis.map((funil, funilIndex) => (
              <div key={funil.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Funil Header */}
                <div className="relative bg-gradient-to-r from-slate-50 to-blue-50 p-3 sm:p-6 border-b border-gray-100/50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg">
                        <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{funil.nome}</h3>
                          {funil.isFunilPadrao && (
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/50 self-start">
                              Funil Padrão
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 sm:py-1 rounded-md mt-1 inline-block">
                          ID: {funil.id}
                        </span>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleEditFunil(funil)}
                        className="p-2 sm:p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all duration-200 group-hover:bg-white/50"
                        title="Editar funil"
                      >
                        <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Pipeline Stages */}
                <div className="p-3 sm:p-6">
                  <div className="flex items-start overflow-x-auto space-x-3 sm:space-x-6 py-2 sm:py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {funil.estagios?.map((estagio, index) => (
                      <div key={estagio.Id} className="relative">
                        {/* Stage Card */}
                        <div
                          className="min-w-[200px] sm:min-w-[280px] rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm"
                          style={{ 
                            backgroundColor: estagio.cor || '#ffffff',
                            boxShadow: `0 8px 32px ${estagio.cor || '#000000'}20`
                          }}
                        >
                          {/* Stage Header */}
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-white/90 to-white/70 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg border border-white/30"
                                 style={{ color: estagio.cor_texto_principal || '#1f2937' }}>
                              {estagio.ordem}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className="text-xs sm:text-sm font-bold truncate"
                                style={{ color: estagio.cor_texto_principal || '#1f2937' }}
                              >
                                {estagio.nome}
                              </h4>
                              <span className="text-xs opacity-70 font-mono bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-md block sm:inline mt-1 sm:mt-0"
                                    style={{ color: estagio.cor_texto_secundario || '#6b7280' }}>
                                ID: {estagio.Id}
                              </span>
                            </div>
                          </div>

                          {/* Stage Controls */}
                          <div className="space-y-2 sm:space-y-3">
                            {['isFollowUp'].map((fieldKey) => {
                              const fieldConfig = {
                                isFollowUp: { label: 'Ativar follow-up para esta etapa?', color: 'from-blue-500 to-cyan-500', }
                              }[fieldKey];

                              return (
                                <div key={fieldKey} className="flex items-center justify-between p-2 sm:p-3 bg-white/30 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/30">
                                  <span className="text-xs font-medium truncate flex-1 mr-2" style={{ color: estagio.cor_texto_secundario || '#6b7280' }}>
                                    {fieldConfig.label}
                                  </span>
                                  {loadingField?.id === estagio.Id && loadingField?.field === fieldKey ? (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/50 flex items-center justify-center">
                                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-600" />
                                    </div>
                                  ) : (
                                    <div
                                      onClick={canEdit ? () => handleUpdateStageConfig(estagio, {
                                        [fieldKey]: !estagio[fieldKey]
                                      }) : undefined}
                                      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-all duration-300 ${
                                        estagio[fieldKey] 
                                          ? `bg-gradient-to-r ${fieldConfig.color} shadow-lg` 
                                          : 'bg-gray-300/70'
                                      } ${canEdit ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-60'}`}
                                    >
                                      <span
                                        className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                          estagio[fieldKey] ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                                        }`}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Connector Arrow */}
                        {index < funil.estagios.length - 1 && (
                          <div className="absolute -right-1.5 sm:-right-3 top-1/2 transform -translate-y-1/2 z-10">
                            <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-lg flex items-center justify-center">
                              <div className="w-1 h-1 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Funnel Modal */}
        {canEdit && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={handleCloseModals}
            title="Criar Novo Funil"
          >
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200/50">
              <form onSubmit={handleCreateFunil} className="space-y-6">
                <div>
                  <label htmlFor="funilName" className="block text-sm font-semibold text-gray-700 mb-3">
                    Nome do Funil
                  </label>
                  <input
                    type="text"
                    id="funilName"
                    value={newFunilName}
                    onChange={(e) => setNewFunilName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Ex: Funil Trabalhista"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newFunilName.trim()}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Criando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Criar Funil</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
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