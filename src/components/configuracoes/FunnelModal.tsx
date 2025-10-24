import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Loader2,
  X,
  Check,
  Trash2,
  Plus,
  Pencil,
  AlertCircle,
  GripVertical
} from 'lucide-react';
// Removido hello-pangea/dnd para evitar bugs recorrentes
import type { Funil, Estagio } from '../../types/funil';

interface FunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFunil: Funil | null;
  onSaveStage: (stage: Estagio) => Promise<void>;
  onDeleteStage: (stageId: string) => Promise<void>;
  onDeleteFunil?: () => Promise<void>;
  token: string;
  canEdit: boolean;
  totalFunis?: number;
}

// Cores predefinidas profissionais
const PRESET_COLORS = [
  { bg: '#EEF2FF', text: '#3730A3', name: 'Indigo' },
  { bg: '#DBEAFE', text: '#1E40AF', name: 'Azul' },
  { bg: '#D1FAE5', text: '#065F46', name: 'Verde' },
  { bg: '#FEF3C7', text: '#92400E', name: 'Amarelo' },
  { bg: '#FED7AA', text: '#9A3412', name: 'Laranja' },
  { bg: '#FECACA', text: '#991B1B', name: 'Vermelho' },
  { bg: '#E9D5FF', text: '#6B21A8', name: 'Roxo' },
  { bg: '#FBCFE8', text: '#9F1239', name: 'Rosa' },
  { bg: '#E5E7EB', text: '#1F2937', name: 'Cinza' },
];

export default function FunnelModal({
  isOpen,
  onClose,
  selectedFunil,
  onSaveStage,
  onDeleteStage,
  onDeleteFunil,
  token,
  canEdit,
  totalFunis = 1
}: FunnelModalProps) {
  const [stages, setStages] = useState<Estagio[]>([]);
  const [editingStage, setEditingStage] = useState<Estagio | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [editingColorIndex, setEditingColorIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDefaultFunnel, setIsDefaultFunnel] = useState(false);
  const [updatingDefault, setUpdatingDefault] = useState(false);

  const fetchUpdatedFunnel = async () => {
    if (!selectedFunil) return;

    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/funil/getById?id=${selectedFunil.id}`, {
        headers: { token }
      });
      const data = await response.json();
      const updated = Array.isArray(data) ? data[0] : data;
      if (updated) {
        setStages(updated.estagios || []);
        setIsDefaultFunnel(updated.isFunilPadrao || false);
      }
    } catch (err) {
      console.error('Erro ao atualizar funil:', err);
    }
  };

  useEffect(() => {
    if (selectedFunil) {
      setStages(selectedFunil.estagios || []);
      // Se há apenas um funil, ele deve ser padrão obrigatoriamente
      const shouldBeDefault = totalFunis === 1 || selectedFunil.isFunilPadrao;
      setIsDefaultFunnel(shouldBeDefault);

      // Se há apenas um funil e ele não é padrão, força a atualização
      if (totalFunis === 1 && !selectedFunil.isFunilPadrao) {
        handleToggleDefaultFunnel();
      }
    }
  }, [selectedFunil, totalFunis]);

  const handleAddStage = async () => {
    if (!selectedFunil || !newStageName.trim()) return;
    setSaving(true);
    setError('');

    try {
      const nextOrder = (stages.length + 1).toString();
      const selectedColor = PRESET_COLORS[selectedColorIndex];
      const newStage: Estagio = {
        Id: '',
        nome: newStageName,
        id_funil: selectedFunil.id.toString(),
        ordem: nextOrder,
        cor: selectedColor.bg,
        cor_texto_principal: selectedColor.text,
        cor_texto_secundario: selectedColor.text,
        isFollowUp: false,
        isReuniaoAgendada: false,
        isPerdido: false,
        isGanho: false
      };

      await onSaveStage(newStage);
      await fetchUpdatedFunnel();
      setNewStageName('');
      setSelectedColorIndex(0);
    } catch (err) {
      console.error('Error adding stage:', err);
      setError('Error adding stage');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStage = async () => {
    if (!editingStage) return;
    setSaving(true);
    setError('');

    try {
      await onSaveStage(editingStage);
      await fetchUpdatedFunnel();
      setEditingStage(null);
    } catch (err) {
      console.error('Error updating stage:', err);
      setError('Error updating stage');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    setSaving(true);
    setError('');

    try {
      await onDeleteStage(stageId);
      await fetchUpdatedFunnel();
    } catch (err) {
      console.error('Error deleting stage:', err);
      setError('Error deleting stage');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFunil = async () => {
    if (!onDeleteFunil) return;
    setDeleting(true);
    setError('');

    try {
      await onDeleteFunil();
      setIsDeleteModalOpen(false);
      onClose();
    } catch (err) {
      console.error('Error deleting funnel:', err);
      setError('Erro ao excluir funil');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleDefaultFunnel = async () => {
    if (!selectedFunil) return;

    // Se há apenas um funil e ele já é padrão, não permite desabilitar
    if (totalFunis === 1 && isDefaultFunnel) {
      setError('Quando há apenas um funil, ele deve ser o padrão obrigatoriamente.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUpdatingDefault(true);
    setError('');

    try {
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({ id: selectedFunil.id })
      });

      await fetchUpdatedFunnel();
      setIsDefaultFunnel(!isDefaultFunnel);
    } catch (err) {
      console.error('Error updating default funnel:', err);
      setError('Erro ao atualizar funil padrão');
    } finally {
      setUpdatingDefault(false);
    }
  };

  const updateStageOrder = async (updated: Estagio[]) => {
    try {
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/update/ordem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({ estagios: updated.map(s => ({ Id: s.Id, ordem: s.ordem })) })
      });
    } catch (err) {
      console.error('Erro ao atualizar ordem dos estágios:', err);
    }
  };

const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

const handleDragStart = (e: React.DragEvent, index: number) => {
  setDraggedIndex(index);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', index.toString());
};

const handleDragOver = (e: React.DragEvent, index: number) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  setDragOverIndex(index);
};

const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault();
  setDragOverIndex(null);
};

const handleDrop = (e: React.DragEvent, dropIndex: number) => {
  e.preventDefault();
  
  if (draggedIndex === null || draggedIndex === dropIndex) {
    setDraggedIndex(null);
    setDragOverIndex(null);
    return;
  }

  const newStages = [...stages];
  const draggedStage = newStages[draggedIndex];
  
  // Remove o item da posição original
  newStages.splice(draggedIndex, 1);
  // Insere na nova posição
  newStages.splice(dropIndex, 0, draggedStage);
  
  // Atualiza as ordens
  const updatedStages = newStages.map((stage, index) => ({
    ...stage,
    ordem: (index + 1).toString()
  }));
  
  setStages(updatedStages);
  updateStageOrder(updatedStages);
  
  setDraggedIndex(null);
  setDragOverIndex(null);
};

const handleDragEnd = () => {
  setDraggedIndex(null);
  setDragOverIndex(null);
};

  if (!isOpen) return null;

  const mainModal = createPortal(
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
            {selectedFunil?.nome}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Excluir Funil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Funil Padrão Toggle */}
        <div className="flex-shrink-0 p-3 bg-gray-50 dark:bg-neutral-900/50 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleDefaultFunnel}
              disabled={updatingDefault}
              className={`relative w-11 h-6 flex items-center rounded-full transition-all duration-300
                ${isDefaultFunnel ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-neutral-600'}
                ${updatingDefault ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transform transition-transform duration-300
                  ${isDefaultFunnel ? 'translate-x-5' : ''}`}
              ></div>
            </button>
            <span className="text-sm text-gray-700 dark:text-neutral-300">
              {updatingDefault ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Atualizando...
                </span>
              ) : (
                <>
                  <strong className="text-gray-900 dark:text-neutral-100">Funil Padrão</strong> — Novos leads serão adicionados automaticamente a este funil
                </>
              )}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-neutral-800">
          {/* Error Message */}
          {error && (
            <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Stages */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wide mb-2">Etapas do Funil</h4>

            {stages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-neutral-700">
                <p className="text-sm">Nenhuma etapa configurada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <div
                    key={stage.Id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`
                      border rounded p-2.5 cursor-move transition-all bg-white dark:bg-neutral-800
                      ${draggedIndex === index ? 'opacity-50' : ''}
                      ${dragOverIndex === index && draggedIndex !== index ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950' : 'hover:bg-gray-50 dark:hover:bg-neutral-700'}
                    `}
                    style={{ borderColor: stage.cor || '#e5e7eb' }}
                  >
                    {editingStage?.Id === stage.Id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingStage.nome}
                          onChange={(e) => setEditingStage({ ...editingStage, nome: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                          placeholder="Nome da etapa"
                          autoFocus
                        />

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-2">Selecione uma cor</label>
                          <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((color, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setEditingColorIndex(idx);
                                  setEditingStage({
                                    ...editingStage,
                                    cor: color.bg,
                                    cor_texto_principal: color.text,
                                    cor_texto_secundario: color.text
                                  });
                                }}
                                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                  editingStage.cor === color.bg
                                    ? 'border-gray-900 dark:border-neutral-100 ring-2 ring-gray-300 dark:ring-neutral-500'
                                    : 'border-gray-200 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-400'
                                }`}
                                style={{ backgroundColor: color.bg }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateStage}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingStage(null)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-300 text-sm rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 text-xs font-semibold rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor: stage.cor || '#6b7280',
                                color: stage.cor_texto_principal || '#ffffff'
                              }}>
                              {stage.ordem}
                            </span>
                            <h5 className="font-medium text-sm text-gray-900 dark:text-neutral-100">
                              {stage.nome}
                            </h5>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingStage(stage);
                              // Find the color index for this stage
                              const colorIdx = PRESET_COLORS.findIndex(c => c.bg === stage.cor);
                              setEditingColorIndex(colorIdx >= 0 ? colorIdx : 0);
                            }}
                            className="p-1 text-gray-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStage(stage.Id)}
                            disabled={saving}
                            className="p-1 text-gray-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded disabled:opacity-50 transition-colors"
                          >
                            {saving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Stage */}
          <div className="border-t border-gray-200 dark:border-neutral-700 pt-4">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wide mb-2">Adicionar Nova Etapa</h4>

            <div className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded p-3">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Nome da nova etapa"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStage()}
                />

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-2">Selecione uma cor</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_COLORS.map((color, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedColorIndex(idx)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          selectedColorIndex === idx
                            ? 'border-gray-900 dark:border-neutral-100 ring-2 ring-gray-300 dark:ring-neutral-500'
                            : 'border-gray-200 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-400'
                        }`}
                        style={{ backgroundColor: color.bg }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddStage}
                  disabled={!newStageName.trim() || saving}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium rounded transition-colors border border-blue-200 dark:border-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Adicionar Etapa
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  // Delete confirmation modal
  const deleteModal = isDeleteModalOpen && createPortal(
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]"
      onClick={() => setIsDeleteModalOpen(false)}
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mb-2">
                Tem certeza que deseja excluir este funil? Esta ação não pode ser desfeita.
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Todos os status e leads associados serão removidos permanentemente.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteFunil}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 rounded-lg disabled:opacity-50 transition-colors"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {mainModal}
      {deleteModal}
    </>
  );
}