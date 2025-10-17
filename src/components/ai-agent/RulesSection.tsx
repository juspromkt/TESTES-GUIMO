import React, { useState, useEffect, useRef } from 'react';
import { Book, Loader2, Save, Upload } from 'lucide-react';
import ReactQuill from 'react-quill';
import { registerMediaBlot } from './mediaBlot';
import 'react-quill/dist/quill.snow.css';
import Modal from '../Modal';

interface MediaItem {
  url: string;
  type: string;
  name?: string;
}

export default function RulesSection({ token, canEdit }: { token: string; canEdit: boolean }) {
  const [rules, setRules] = useState('');
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const quillRef = useRef<ReactQuill>(null);
const [modalOpen, setModalOpen] = useState(false);
const [modalLoading, setModalLoading] = useState(false);

  const MAX_CHARS = 2000;

  // Função para remover tags HTML e contar caracteres
  const getTextLength = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.length || 0;
  };

  const charCount = getTextLength(rules);
  const charPercentage = (charCount / MAX_CHARS) * 100;

  // Determina a cor baseada na porcentagem
  const getProgressColor = () => {
    if (charPercentage < 50) return 'bg-emerald-500 dark:bg-emerald-600';
    if (charPercentage < 75) return 'bg-yellow-500 dark:bg-yellow-600';
    if (charPercentage < 90) return 'bg-orange-500 dark:bg-orange-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  const getTextColor = () => {
    if (charPercentage < 50) return 'text-emerald-600 dark:text-emerald-400';
    if (charPercentage < 75) return 'text-yellow-600 dark:text-yellow-400';
    if (charPercentage < 90) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  useEffect(() => {
    fetchRules();
    registerMediaBlot();
  }, []);

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
              <div style="width: 40px; height: 40px; background: #dc2626; display: flex; justify-content: center; align-items: center; border-radius: 8px; color: white; font-size: 20px;">📄</div>
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
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/get', {
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
    }
  }

async function handleSaveRules() {
  setSaving(true);
  setError('');
  setSuccess('');
  setModalLoading(true);

  try {
    const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token,
      },
      body: JSON.stringify({ regras: rules }),
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

      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/upload', {
        method: 'POST',
        headers: { token },
        body: formData,
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
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Regras Gerais</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Defina as regras gerais de comportamento do agente (o que ele pode e não pode fazer)</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Regras do Agente</label>

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
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-900 dark:text-neutral-100 rounded-lg"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Carregando...' : 'Adicionar Mídia'}
          </button>
          )}

          {/* Contador de caracteres */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${getTextColor()}`}>
                {charCount}/{MAX_CHARS}
              </span>
              <span className={`text-xs ${getTextColor()}`}>
                ({charPercentage.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor()} transition-all duration-300 ease-out`}
                style={{ width: `${Math.min(charPercentage, 100)}%` }}
              />
            </div>

            {/* Alerta quando exceder o limite */}
            {charCount > MAX_CHARS && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800/50 rounded-lg flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Limite recomendado excedido
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Seu agente pode se perder pelo volume de caracteres. Recomendamos manter até {MAX_CHARS} caracteres.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="relative mt-4">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={rules}
              onChange={(content) => {
                if (!canEdit) return;
                setRules(content);
              }}
              modules={modules}
              formats={formats}
              placeholder="Defina as regras gerais que o agente deve seguir..."
              readOnly={!canEdit}
              className="bg-white dark:bg-neutral-700 rounded-lg"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 dark:text-blue-400" />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-2 rounded-md">
            {success}
          </div>
        )}
        {canEdit && (
        <div className="flex justify-end pt-6">
          <button
            onClick={handleSaveRules}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg font-medium"
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
      <Loader2 className="w-5 h-5 animate-spin text-blue-500 dark:text-blue-400" />
      <p className="text-sm text-gray-600 dark:text-neutral-400">Processando regras...</p>
    </div>
  ) : (
    <p className="text-gray-700 dark:text-neutral-300">Regras salvas com sucesso!</p>
  )}
</Modal>

      </div>
    </div>
  );
}
