import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import { findTemplates, createTemplate, sendTemplate } from './utils/templates';
import { toast } from 'sonner';
import { resolveJid } from '../../utils/jidMapping';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  remoteJid: string;
}

interface ButtonComponent {
  type: 'QUICK_REPLY' | 'URL';
  text: string;
  url?: string;
}

interface CreateFormData {
  name: string;
  category: string;
  text: string;
  buttons: ButtonComponent[];
  examples: string[];
}

export default function TemplateModal({ isOpen, onClose, token, remoteJid }: TemplateModalProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormData>({ 
    name: '', 
    category: 'MARKETING', 
    text: '',
    buttons: [],
    examples: ['']
  });
  const [creating, setCreating] = useState(false);
  const [sendData, setSendData] = useState<any | null>(null);
  const [paramValues, setParamValues] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      loadTemplates();
    }
  }, [isOpen, token]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const list = await findTemplates(token);
      setTemplates(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }

  const renderTemplatePreview = (template: any) => {
    const body = template.components?.find((c: any) => c.type === 'BODY');
    const buttons = template.components?.find((c: any) => c.type === 'BUTTONS');
    const placeholders = body?.text?.match(/{{\d+}}/g) || [];
    
    let previewText = body?.text || '';
    // Replace placeholders with example values for preview
    placeholders.forEach((placeholder: string, index: number) => {
      const exampleValue = body?.example?.body_text?.[0]?.[index] || `Exemplo ${index + 1}`;
      previewText = previewText.replace(placeholder, exampleValue);
    });

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-3 py-2 font-medium">
          Template do WhatsApp
        </div>
        
        <div className="p-3">
          <div className="text-sm text-gray-800 mb-3 whitespace-pre-wrap leading-relaxed break-words">
            {previewText}
          </div>

          {buttons?.buttons && buttons.buttons.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              {buttons.buttons.map((btn: any, idx: number) => (
                <div
                  key={idx}
                  className={`text-center py-2 px-3 text-sm border rounded-md transition-colors ${
                    btn.type === 'URL' 
                      ? 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100' 
                      : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {btn.type === 'URL' && '🔗 '}
                  {btn.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const addButton = () => {
    if (createForm.buttons.length < 3) {
      setCreateForm({
        ...createForm,
        buttons: [...createForm.buttons, { type: 'QUICK_REPLY', text: '' }]
      });
    }
  };

  const updateButton = (index: number, field: string, value: string) => {
    const newButtons = [...createForm.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setCreateForm({ ...createForm, buttons: newButtons });
  };

  const removeButton = (index: number) => {
    const newButtons = createForm.buttons.filter((_, i) => i !== index);
    setCreateForm({ ...createForm, buttons: newButtons });
  };

  const addExample = () => {
    setCreateForm({
      ...createForm,
      examples: [...createForm.examples, '']
    });
  };

  const updateExample = (index: number, value: string) => {
    const newExamples = [...createForm.examples];
    newExamples[index] = value;
    setCreateForm({ ...createForm, examples: newExamples });
  };

  const removeExample = (index: number) => {
    const newExamples = createForm.examples.filter((_, i) => i !== index);
    setCreateForm({ ...createForm, examples: newExamples.length ? newExamples : [''] });
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.text) {
      toast.error('Nome e texto são obrigatórios');
      return;
    }

    setCreating(true);
    try {
      const components: any[] = [
        {
          type: 'BODY',
          text: createForm.text,
          ...(createForm.examples.filter(e => e.trim()).length > 0 && {
            example: {
              body_text: [createForm.examples.filter(e => e.trim())]
            }
          })
        }
      ];

      if (createForm.buttons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: createForm.buttons.filter(btn => btn.text.trim())
        });
      }

      await createTemplate(token, {
        name: createForm.name,
        category: createForm.category,
        allowCategoryChange: false,
        language: 'pt_BR',
        components,
      });

      toast.success('Template criado com sucesso');
      setCreateForm({ name: '', category: 'MARKETING', text: '', buttons: [], examples: [''] });
      setCreateOpen(false);
      await loadTemplates();
    } catch (err) {
      console.error('Erro ao criar template:', err);
      toast.error('Erro ao criar template');
    } finally {
      setCreating(false);
    }
  };

  const openSend = (tpl: any) => {
    if (tpl.status !== 'APPROVED') {
      const msg =
        tpl.status === 'REJECTED'
          ? 'Este template foi reprovado e não pode ser enviado'
          : 'Este template ainda não está aprovado';
      toast.error(msg);
      return;
    }

    const body = tpl.components?.find((c: any) => c.type === 'BODY');
    const placeholders = body?.text?.match(/{{\d+}}/g) || [];
    setParamValues(placeholders.map(() => ''));
    setSendData(tpl);
  };

  const handleSend = async () => {
    if (!sendData) return;
    setSending(true);
    try {
      const bodyParams = paramValues.map(text => ({ type: 'text', text }));
      const components = bodyParams.length ? [{ type: 'body', parameters: bodyParams }] : [];
      const jid = resolveJid(remoteJid);
      await sendTemplate(token, {
        number: jid.replace(/\D/g, ''),
        name: sendData.name,
        language: sendData.language || 'pt_BR',
        components,
      });
      toast.success('Template enviado com sucesso');
      setSendData(null);
      onClose();
    } catch (err) {
      console.error('Erro ao enviar template:', err);
      toast.error('Erro ao enviar template');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Templates WhatsApp" maxWidth="6xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-3 text-sm text-gray-600">Carregando templates...</span>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Container principal com scroll */}
            <div className="flex-1 overflow-y-auto">
              {templates.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-1">
                  {templates.map(t => (
                    <div key={t.id || t.name} className="bg-gray-50 rounded-xl p-4 space-y-4">
                      {/* Header do template */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{t.name}</h3>
                          <p className="text-xs text-gray-500 capitalize mt-1">
                            {t.category?.toLowerCase()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
                              t.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : t.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {t.status === 'APPROVED' ? 'Aprovado' : 
                             t.status === 'REJECTED' ? 'Reprovado' : 'Pendente'}
                          </span>
                          <button
                            onClick={() => openSend(t)}
                            disabled={t.status !== 'APPROVED'}
                            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                              t.status === 'APPROVED'
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                      
                      {/* Preview do template */}
                      <div className="transform scale-95 origin-top">
                        {renderTemplatePreview(t)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <div className="text-6xl mb-4">📱</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template disponível</h3>
                  <p className="text-sm text-center max-w-md">
                    Crie seu primeiro template para começar a enviar mensagens personalizadas pelo WhatsApp
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer fixo */}
            <div className="flex justify-end pt-6 mt-6 border-t bg-white">
              <button
                onClick={() => setCreateOpen(true)}
                className="px-6 py-2.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                + Novo Template
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Criação */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Criar Novo Template" maxWidth="5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Coluna do Formulário */}
          <div className="space-y-6 overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Template</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Ex: boas_vindas"
                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                value={createForm.category}
                onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
              >
                <option value="MARKETING">Marketing (~R$ 0,35)</option>
                <option value="UTILITY">Utilidade (~R$ 0,035)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto do Corpo
                <span className="text-xs text-gray-500 ml-2">(Use {'{'}{'{'
                }1{'}'}{'}'},  {'{'}{'{'
                }2{'}'}{'}' } para variáveis)</span>
              </label>
              <textarea
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                placeholder="Olá {'{'}{'{'
                }1{'}'}{'}'}! Sua compra foi confirmada com o código {'{'}{'{'
                }2{'}'}{'}'
                }."
                value={createForm.text}
                onChange={e => setCreateForm({ ...createForm, text: e.target.value })}
              />
            </div>

            {/* Exemplos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exemplos para Variáveis
                <span className="text-xs text-gray-500 ml-2">(Opcional, para preview)</span>
              </label>
              <div className="space-y-2">
                {createForm.examples.map((example, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder={`Valor para ${'{'}${'{'}${idx + 1}${'}'}${'}'}`}
                      value={example}
                      onChange={e => updateExample(idx, e.target.value)}
                    />
                    {createForm.examples.length > 1 && (
                      <button
                        onClick={() => removeExample(idx)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addExample}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  + Adicionar exemplo
                </button>
              </div>
            </div>

            {/* Botões */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Botões de Ação
                <span className="text-xs text-gray-500 ml-2">(Máximo 3)</span>
              </label>
              <div className="space-y-3">
                {createForm.buttons.map((button, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex gap-2 mb-3">
                      <select
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={button.type}
                        onChange={e => updateButton(idx, 'type', e.target.value)}
                      >
                        <option value="QUICK_REPLY">Resposta Rápida</option>
                        <option value="URL">Link/URL</option>
                      </select>
                      <button
                        onClick={() => removeButton(idx)}
                        className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg text-sm transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Texto do botão"
                      value={button.text}
                      onChange={e => updateButton(idx, 'text', e.target.value)}
                    />
                    {button.type === 'URL' && (
                      <input
                        type="url"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="https://exemplo.com"
                        value={button.url || ''}
                        onChange={e => updateButton(idx, 'url', e.target.value)}
                      />
                    )}
                  </div>
                ))}
                {createForm.buttons.length < 3 && (
                  <button
                    onClick={addButton}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    + Adicionar botão
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Coluna do Preview */}
          <div className="lg:border-l lg:pl-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">Preview do Template</label>
            <div className="bg-gray-50 p-6 rounded-xl h-fit sticky top-0">
              {createForm.text ? (
                renderTemplatePreview({
                  components: [
                    {
                      type: 'BODY',
                      text: createForm.text,
                      example: {
                        body_text: [createForm.examples.filter(e => e.trim())]
                      }
                    },
                    ...(createForm.buttons.length > 0 ? [{
                      type: 'BUTTONS',
                      buttons: createForm.buttons.filter(btn => btn.text.trim())
                    }] : [])
                  ]
                })
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="font-medium">Digite o texto para ver o preview</p>
                  <p className="text-sm mt-1">O template aparecerá aqui conforme você digita</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 mt-8 border-t">
          <button
            onClick={() => setCreateOpen(false)}
            className="px-6 py-2.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !createForm.name || !createForm.text}
            className="px-6 py-2.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
          >
            {creating ? 'Criando...' : 'Criar Template'}
          </button>
        </div>
      </Modal>

      {/* Modal de Envio */}
      <Modal isOpen={!!sendData} onClose={() => setSendData(null)} title="Enviar Template" maxWidth="lg">
        {sendData && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              {renderTemplatePreview(sendData)}
            </div>
            
            {paramValues.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 text-lg">Preencha os parâmetros:</h4>
                <div className="space-y-3">
                  {paramValues.map((v, idx) => (
                    <div key={idx}>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Parâmetro {idx + 1}
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder={`Valor para {{${idx + 1}}}`}
                        value={v}
                        onChange={e => {
                          const arr = [...paramValues];
                          arr[idx] = e.target.value;
                          setParamValues(arr);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={() => setSendData(null)}
                className="px-6 py-2.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={sending || (paramValues.length > 0 && paramValues.some(v => !v.trim()))}
                className="px-6 py-2.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
              >
                {sending ? 'Enviando...' : 'Enviar Template'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}