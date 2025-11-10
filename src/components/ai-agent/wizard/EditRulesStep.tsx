import { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, Wand2 } from 'lucide-react';
import { StepComponentProps } from '../../../types/agent-wizard';
import ReactQuill from 'react-quill';

const TEMPLATE_REGRAS = `<p><strong>🚫 Proibições e Limites</strong></p>
<p>- Nunca responda dúvidas jurídicas (elas só são tratadas na reunião com nossos advogados, após o contrato assinado).</p>
<p>- Nunca faça cálculos para leads (também são feitos apenas na reunião).</p>
<p>- Nunca dê instruções sobre casos.</p>
<p>- Não tire dúvidas sobre seguro-desemprego — o foco é processo trabalhista.</p>
<p>- Nunca diga que é uma IA.</p>
<p>- Não atenda ligações — o contato é 100% via WhatsApp.</p>
<p>- Não reabra processos existentes nem realize análises de casos antigos.</p>
<p><br></p>
<p>---</p>
<p><br></p>
<p><strong>🔄 Roteiro Obrigatório</strong></p>
<p>- Siga sempre o roteiro de atendimento.</p>
<p>- Se o lead sair do roteiro, responda brevemente e retorne ao roteiro de onde parou, de forma natural.</p>
<p>- ⚠️ Nunca pule etapas e não avance para a próxima etapa sem resposta clara e objetiva do cliente.</p>
<p><br></p>
<p>---</p>
<p><br></p>
<p><strong>📝 Condução da Conversa</strong></p>
<p>- Aceite e processe áudios, fotos e PDFs enviados pelo cliente — nunca diga que não pode.</p>
<p>- Sempre finalize cada mensagem com uma pergunta, para manter a conversa ativa.</p>
<p>- Faça apenas uma pergunta por vez e aguarde a resposta.</p>
<p>- Use mensagens curtas (até 2 frases). Se necessário, divida em várias mensagens.</p>
<p>- Não repita o nome do cliente em todas as mensagens — apenas quando soar natural.</p>
<p>- Não repita mensagens idênticas.</p>
<p>- Se a resposta do cliente for vaga, ambígua ou confusa ("acho que sim", "rsrs", emojis, frases soltas), reformule até obter clareza.</p>
<p><br></p>
<p>---</p>
<p><br></p>
<p><strong>📂 Registro e Consistência</strong></p>
<p>- Nunca repita o roteiro se o cliente já tiver respondido anteriormente.</p>
<p><br></p>
<p>---</p>
<p><br></p>
<p><strong>🗣️ Tom de Atendimento</strong></p>
<p>- Use linguagem acolhedora, humana e natural.</p>
<p>- Evite respostas secas ("ok", "entendi").</p>
<p>- Não use frases automáticas de confirmação ("Entendi, obrigado pela informação").</p>
<p>- Dê continuidade de forma fluida, aproveitando a resposta do cliente.</p>
<p>- Se a resposta já for suficiente, continue o roteiro.</p>
<p>- Utilize conectores naturais, como:</p>
<p>  - "Tudo bem. Agora me fala..."</p>
<p>  - "Perfeito. E pra eu entender melhor..."</p>
<p>  - "Tá certo. Me conta também..."</p>`;

export default function EditRulesStep({ state, onNext, onBack, token }: StepComponentProps) {
  const [regras, setRegras] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTemplateAppliedWarning, setShowTemplateAppliedWarning] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    // Prioridade 1: Carregar do editedContent (se já foi editado)
    if (state.singleAgent.editedContent?.regras) {
      setRegras(state.singleAgent.editedContent.regras);
    }
    // Prioridade 2: Carregar regras do template se houver
    else if (state.singleAgent.selectedTemplate && state.singleAgent.creationType === 'template') {
      const template = state.singleAgent.selectedTemplate;
      setRegras(template.regras?.regras || '');
    }
  }, []);

  const handleApplyTemplate = () => {
    setRegras(TEMPLATE_REGRAS);
    setShowTemplateAppliedWarning(true);
    // Auto-esconder o aviso após 10 segundos
    setTimeout(() => {
      setShowTemplateAppliedWarning(false);
    }, 10000);
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);

    const agentId = state.singleAgent.createdAgent?.Id;

    if (!agentId) {
      setError('ID do agente não encontrado. Não é possível salvar.');
      setLoading(false);
      return;
    }

    try {
      // Salvar Regras
      const regrasResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            regras: regras || '<p></p>',
            id_agente: agentId
          })
        }
      );

      if (!regrasResponse.ok) {
        throw new Error('Erro ao salvar regras');
      }

      // Passar para próxima etapa (edit-steps)
      onNext({
        singleAgent: {
          ...state.singleAgent,
          editedContent: {
            regras,
            etapas: state.singleAgent.editedContent?.etapas || [],
            faq: state.singleAgent.editedContent?.faq || []
          }
        },
        currentStep: 'edit-steps'
      });
    } catch (err: any) {
      console.error('Erro ao salvar regras:', err);
      setError(err.message || 'Erro ao salvar regras. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Título */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Configure as Regras de Atendimento
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Defina como o agente "{state.singleAgent.createdAgent?.nome}" deve se comportar
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Formulário */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {showTemplateAppliedWarning && (
          <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-300 rounded-lg text-sm">
            <strong>Modelo aplicado com sucesso!</strong> Por favor, leia e personalize as regras conforme necessário antes de continuar para a próxima etapa.
          </div>
        )}

        <div>
          <div className="flex justify-end items-center mb-2">
            <button
              onClick={handleApplyTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              <Wand2 className="w-4 h-4" />
              Aplicar Modelo
            </button>
          </div>
          <div className="quill-wrapper-no-toolbar">
            <ReactQuill
              ref={quillRef}
              value={regras}
              onChange={setRegras}
              theme="snow"
              placeholder="Digite as regras de atendimento do agente..."
              style={{ height: '450px', marginBottom: '50px' }}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link'],
                  ['clean']
                ]
              }}
            />
          </div>
          <style>{`
            .quill-wrapper-no-toolbar .ql-toolbar {
              display: none !important;
            }
            .quill-wrapper-no-toolbar .ql-container {
              border-top: 1px solid #ccc;
            }
          `}</style>
        </div>

        {/* Dicas */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Dicas para boas regras:
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Seja específico sobre o tom de comunicação (formal, amigável, técnico)</li>
            <li>• Defina limites claros do que o agente pode ou não fazer</li>
            <li>• Inclua instruções sobre como lidar com situações específicas</li>
          </ul>
        </div>
      </div>

      {/* Botões de navegação */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>Salvar e Continuar →</>
          )}
        </button>
      </div>
    </div>
  );
}
