import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Loader2, Save, Upload } from 'lucide-react';
import ReactQuill from 'react-quill';
import { registerMediaBlot } from './mediaBlot';
import 'react-quill/dist/quill.snow.css';

interface FAQ {
  ordem: number;
  pergunta: string;
  resposta: string;
}

interface FAQItemProps {
  faq: FAQ;
  onRemove: () => void;
  onUpdate: (ordem: number, field: 'pergunta' | 'resposta', value: string) => void;
  onMediaUpload: (file: File) => Promise<string>;
  isUploading: boolean;
  onSave: () => Promise<void>;
  isSaving?: boolean;
  canEdit: boolean; // ✅ NOVO
}

interface MediaItem {
  url: string;
  type: string;
  name: string;
  id: string;
}

const FAQItem: React.FC<FAQItemProps> = ({
  faq,
  onRemove,
  onUpdate,
  onMediaUpload,
  isUploading,
  onSave,
  isSaving,
  canEdit
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);

  useEffect(() => {
    const initializeQuill = async () => {
      await registerMediaBlot();
      setIsQuillReady(true);
    };
    initializeQuill();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setShowMediaModal(true);
    event.target.value = '';
  };

  const handleInsertMedia = async (position: 'start' | 'cursor' | 'end') => {
    if (!uploadedFile) return;

    try {
      const url = await onMediaUpload(uploadedFile);
      const mediaItem: MediaItem = {
        url,
        type: uploadedFile.type,
        name: uploadedFile.name,
        id: Math.random().toString(36).substr(2, 9),
      };

      const editor = quillRef.current?.getEditor();
      if (editor) {
        let index = 0;
        if (position === 'start') index = 0;
        else if (position === 'cursor') index = editor.getSelection()?.index ?? editor.getLength();
        else if (position === 'end') index = editor.getLength();

        editor.insertEmbed(index, 'media', mediaItem);
        editor.setSelection(index + 1);
      }
    } catch (error) {
      console.error('Erro ao fazer upload da mídia', error);
    } finally {
      setShowMediaModal(false);
      setUploadedFile(null);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  };

  const formats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'media'];

  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pergunta {faq.ordem}
            </label>
            <input
              type="text"
              value={faq.pergunta}
              onChange={(e) => onUpdate(faq.ordem, 'pergunta', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Digite a pergunta"
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resposta</label>
            {canEdit && (
              <div className="mb-2">
                <input
                  type="file"
                  id={`upload-file-${faq.ordem}`}
                  className="hidden"
                  accept="image/*,video/*,audio/*,application/pdf"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => document.getElementById(`upload-file-${faq.ordem}`)?.click()}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Adicionar Mídia
                </button>
              </div>
            )}

            <div className="relative">
{isQuillReady && (
  <ReactQuill
    ref={quillRef}
    theme="snow"
    value={faq.resposta}
    onChange={canEdit ? (content) => onUpdate(faq.ordem, 'resposta', content) : () => {}}
    modules={canEdit ? modules : { toolbar: false }}
    formats={formats}
    readOnly={!canEdit}
    placeholder="Descreva a dúvida..."
    className="bg-white rounded-lg"
  />
)}


              {isUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {canEdit && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {showMediaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Onde inserir a mídia?
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleInsertMedia('start')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-lg"
              >
                No início do texto
              </button>
              <button
                onClick={() => handleInsertMedia('cursor')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-lg"
              >
                Na posição do cursor
              </button>
              <button
                onClick={() => handleInsertMedia('end')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-lg"
              >
                No final do texto
              </button>
              <button
                onClick={() => {
                  setShowMediaModal(false);
                  setUploadedFile(null);
                }}
                className="w-full px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg mt-4"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQItem;
