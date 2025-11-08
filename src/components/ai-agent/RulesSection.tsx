import React, { useState, useEffect, useRef } from 'react';
import { Book, Loader2, Save, Upload } from 'lucide-react';
import ReactQuill from 'react-quill';
// Import removido: registramos blots localmente nesta seção
import 'react-quill/dist/quill.snow.css';
import Modal from '../Modal';

interface MediaItem {
  url: string;
  type: string;
  name?: string;
}

export default function RulesSection({ token, idAgente, canEdit }: { token: string; idAgente: number; canEdit: boolean }) {
  const [rules, setRules] = useState('');
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [success, setSuccess] = useState('');
  const quillRef = useRef<ReactQuill>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    registerMediaBlot();
  }, []);

  useEffect(() => {
    if (idAgente && token) {
      fetchRules();
    }
  }, [idAgente, token]);

async function registerMediaBlot() {
  if (typeof window !== 'undefined') {
    const { Quill } = await import('react-quill');
    const BlockEmbed = Quill.import('blots/block/embed');

    class MediaBlot extends BlockEmbed {
      static create(value: MediaItem | string) {
        const node = super.create();
        node.setAttribute('contenteditable', 'false');

        if (typeof value === 'string') {
          node.innerHTML = value;
          return node;
        }

        // Adiciona os atributos data-*
        node.setAttribute('data-url', value.url);
        node.setAttribute('data-type', value.type);
        if (value.name) {
          node.setAttribute('data-name', value.name);
        }

        if (value.type.startsWith('image')) {
          node.innerHTML = `<img src="${value.url}" alt="${value.name || ''}" style="max-width: 300px; border-radius: 8px;" />`;
        } else if (value.type.startsWith('video')) {
          node.innerHTML = `<video src="${value.url}" controls style="max-width: 200px; border-radius: 8px;"></video>`;
        } else if (value.type.startsWith('audio')) {
          node.innerHTML = `<audio src="${value.url}" controls style="width: 300px;"></audio>`;
        } else if (value.type === 'application/pdf') {
          node.innerHTML = `
            <div style="display: flex; align-items: center; background: #eff6ff; padding: 12px; border-radius: 8px; max-width: 80%; margin: 0 auto;">
              <div style="width: 40px; height: 40px; background: #dc2626; display: flex; justify-content: center; align-items: center; border-radius: 8px; color: white; font-size: 20px;">ðŸ“„</div>
              <a href="${value.url}" target="_blank" style="margin-left: 12px; color: #2563eb; font-weight: 500; text-decoration: none;">${value.name || 'Abrir PDF'}</a>
            </div>`;
        }

        return node;
      }

      static value(node: HTMLElement) {
        return {
          url: node.getAttribute('data-url'),
          type: node.getAttribute('data-type'),
          name: node.getAttribute('data-name'),
          html: node.innerHTML
        };
      }
    }

    MediaBlot.blotName = 'media';
    MediaBlot.tagName = 'div';
    MediaBlot.className = 'ql-media';
    Quill.register(MediaBlot);
  }
}

  async function fetchRules() {
    try {
      setIsLoadingRules(true);
      const res = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/get?id_agente=${idAgente}`, {
        headers: { token },
      });
      if (!res.ok) throw new Error('Erro ao carregar regras');
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.regras) {
        setRules(data[0].regras);  // Salva o conteúdo recebido para renderização
      }
    } catch (error) {
      console.error(error);
      setError('Erro ao carregar regras');
    } finally {
      setIsLoadingRules(false);
    }
  }

async function handleSaveRules() {
  setSaving(true);
  setError('');
  setSuccess('');
  setModalLoading(true);

  try {
    const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token,
      },
      body: JSON.stringify({ regras: rules, id_agente: idAgente }),
    });

    if (!res.ok) throw new Error('Erro ao salvar regras');

    setTimeout(() => {
      setModalOpen(true);
      setModalLoading(false);
    }, 300);
  } catch (error) {
    console.error(error);
    setError('Erro ao salvar regras');
    setModalLoading(false);
  } finally {
    setSaving(false);
  }
}


  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/upload?id_agente=${idAgente}` , {
        method: 'POST',
        headers: { token },
        body: (() => { formData.append('id_agente', String(idAgente)); return formData; })(),
      });

      if (!res.ok) throw new Error('Erro no upload');

      const { url } = await res.json();
      const editor = quillRef.current?.getEditor();

      if (editor) {
        const range = editor.getSelection(true);

        editor.insertEmbed(range.index, 'media', { 
          url, 
          type: file.type, 
          name: file.name 
        });

        editor.setSelection(range.index + 1, 0);
      }
    } catch (error) {
      console.error(error);
      setError('Erro ao fazer upload');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean'],
      ],
    },
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'media',
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Book className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Regras Gerais</h2>
          <p className="text-sm text-gray-500 mt-1">Defina as regras gerais de comportamento do agente</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Regras do Agente</label>

          <input
            id="rules-file-upload"
            type="file"
            accept="image/*,video/*,audio/*,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={!canEdit}
          />
                    {canEdit && (
          <button
            type="button"
            onClick={() => document.getElementById('rules-file-upload')?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Carregando...' : 'Adicionar Mídia'}
          </button>
          )}

          <div className="relative mt-4">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={rules}
              onChange={canEdit ? setRules : () => {}}
              modules={modules}
              formats={formats}
              placeholder="Defina as regras gerais que o agente deve seguir..."
              readOnly={!canEdit}
              className="bg-white rounded-lg"
            />
            {isLoadingRules && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Carregando regras...</span>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-md">
            {success}
          </div>
        )}
        {canEdit && (
        <div className="flex justify-end pt-6">
          <button
            onClick={handleSaveRules}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Regras
              </>
            )}
          </button>
        </div>
        )}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Sucesso">
  {modalLoading ? (
    <div className="flex items-center justify-center gap-2 py-4">
      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      <p className="text-sm text-gray-600">Processando regras...</p>
    </div>
  ) : (
    <p className="text-gray-700">Regras salvas com sucesso!</p>
  )}
</Modal>

      </div>
    </div>
  );
}


