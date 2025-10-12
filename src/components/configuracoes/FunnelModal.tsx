import React, { useState, useEffect } from 'react';
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
import Modal from '../Modal';

interface FunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFunil: Funil | null;
  onSaveStage: (stage: Estagio) => Promise<void>;
  onDeleteStage: (stageId: string) => Promise<void>;
  onDeleteFunil?: () => Promise<void>;
  token: string;
  canEdit: boolean;
}

export default function FunnelModal({
  isOpen,
  onClose,
  selectedFunil,
  onSaveStage,
  onDeleteStage,
  onDeleteFunil,
  token,
  canEdit
}: FunnelModalProps) {
  const [stages, setStages] = useState<Estagio[]>([]);
  const [editingStage, setEditingStage] = useState<Estagio | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#ffffff');
  const [newStagePrimaryColor, setNewStagePrimaryColor] = useState('#000000');
  const [newStageSecondaryColor, setNewStageSecondaryColor] = useState('#6b7280');
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
      setIsDefaultFunnel(selectedFunil.isFunilPadrao);
    }
  }, [selectedFunil]);

  const handleAddStage = async () => {
    if (!selectedFunil || !newStageName.trim()) return;
    setSaving(true);
    setError('');

    try {
      const nextOrder = (stages.length + 1).toString();
      const newStage: Estagio = {
        Id: '',
        nome: newStageName,
        id_funil: selectedFunil.id.toString(),
        ordem: nextOrder,
        cor: newStageColor,
        cor_texto_principal: newStagePrimaryColor,
        cor_texto_secundario: newStageSecondaryColor,
        isFollowUp: false,
        isReuniaoAgendada: false,
        isPerdido: false,
        isGanho: false
      };

      await onSaveStage(newStage);
      await fetchUpdatedFunnel();
      setNewStageName('');
      setNewStageColor('#ffffff');
      setNewStagePrimaryColor('#000000');
      setNewStageSecondaryColor('#6b7280');
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

return (
  <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedFunil ? `Editar Funil: ${selectedFunil.nome}` : 'Editar Funil'}
      width="90vw"
      maxWidth="900px"
      height="85vh"
      maxHeight="700px"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b bg-gray-50 p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Configurações do Funil</h3>
              
              <label className="flex items-center gap-2">
<div className="flex items-center gap-4">
  {/* Switch bonito */}
  <button
    onClick={handleToggleDefaultFunnel}
    disabled={updatingDefault}
    className={`relative w-14 h-8 flex items-center rounded-full transition-all duration-300 shadow-sm
      ${isDefaultFunnel ? 'bg-blue-600' : 'bg-gray-300'}
      ${updatingDefault ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div
      className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300
        ${isDefaultFunnel ? 'translate-x-6' : ''}`}
    ></div>
  </button>

  {/* Texto ao lado */}
  <span className="text-sm text-gray-700">
    {updatingDefault ? (
      <span className="flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Atualizando...
      </span>
    ) : (
      <>
        <strong className="text-gray-900">Funil Padrão</strong> — Deixe ativado para que novos leads sejam adicionados automaticamente a este funil.
      </>
    )}
  </span>
</div>

              </label>
            </div>
            
            <button 
              onClick={() => setIsDeleteModalOpen(true)} 
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Funil
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Stages */}
          <div className="mb-6">
            <h4 className="text-base font-medium text-gray-900 mb-4">Estágios do Funil</h4>
            
            {stages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Nenhum estágio configurado</p>
              </div>
            ) : (
              <div className="space-y-3">
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
                      border rounded-lg p-4 cursor-move transition-all
                      ${draggedIndex === index ? 'opacity-50' : ''}
                      ${dragOverIndex === index && draggedIndex !== index ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-300'}
                    `}
                    style={{ backgroundColor: stage.cor || '#ffffff' }}
                  >
                    {editingStage?.Id === stage.Id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingStage.nome}
                          onChange={(e) => setEditingStage({ ...editingStage, nome: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nome do estágio"
                          autoFocus
                        />
                        
                        <div className="flex gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Cor de fundo</label>
                            <input
                              type="color"
                              value={editingStage.cor || '#ffffff'}
                              onChange={(e) => setEditingStage({ ...editingStage, cor: e.target.value })}
                              className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Texto principal</label>
                            <input
                              type="color"
                              value={editingStage.cor_texto_principal || '#000000'}
                              onChange={(e) => setEditingStage({ ...editingStage, cor_texto_principal: e.target.value })}
                              className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Texto secundário</label>
                            <input
                              type="color"
                              value={editingStage.cor_texto_secundario || '#6b7280'}
                              onChange={(e) => setEditingStage({ ...editingStage, cor_texto_secundario: e.target.value })}
                              className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={handleUpdateStage} 
                            disabled={saving} 
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Salvar
                          </button>
                          <button 
                            onClick={() => setEditingStage(null)} 
                            className="flex items-center gap-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-md"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center justify-center">
                              {stage.ordem}
                            </span>
                            <h5
                              className="font-medium"
                              style={{ color: stage.cor_texto_principal || '#000000' }}
                            >
                              {stage.nome}
                            </h5>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingStage(stage)} 
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteStage(stage.Id)} 
                            disabled={saving} 
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
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
          <div className="border-t pt-6">
            <h4 className="text-base font-medium text-gray-900 mb-4">Adicionar Novo Estágio</h4>
            
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <div className="space-y-4">
                <input
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Nome do novo estágio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStage()}
                />
                
                <div className="flex gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cor de fundo</label>
                    <input
                      type="color"
                      value={newStageColor}
                      onChange={(e) => setNewStageColor(e.target.value)}
                      className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Texto principal</label>
                    <input
                      type="color"
                      value={newStagePrimaryColor}
                      onChange={(e) => setNewStagePrimaryColor(e.target.value)}
                      className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Texto secundário</label>
                    <input
                      type="color"
                      value={newStageSecondaryColor}
                      onChange={(e) => setNewStageSecondaryColor(e.target.value)}
                      className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 flex items-end">
                    <button
                      onClick={handleAddStage}
                      disabled={!newStageName.trim() || saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Adicionar Estágio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    {/* Delete Confirmation Modal */}
    <Modal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      title="Confirmar Exclusão"
      maxWidth="400px"
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Tem certeza que deseja excluir este funil? Esta ação não pode ser desfeita.
            </p>
            <p className="text-xs text-red-600">
              Todos os estágios e leads associados serão removidos permanentemente.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteFunil}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
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
    </Modal>
  </>
);
}