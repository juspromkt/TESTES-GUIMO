import React, { useState, useEffect } from 'react';
import { Book, AlertCircle, Check, Loader2, Download, Upload, Plus } from 'lucide-react';
import { agentModels } from '../../data/agent-models';
import Modal from '../Modal';
import AIPromptGenerator from './AIPromptGenerator';

interface DefaultModelsSectionProps {
  token: string;
  onSuccess: () => void;
  canEdit: boolean;
}

export default function DefaultModelsSection({ token, onSuccess, canEdit }: DefaultModelsSectionProps) {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportedModel, setExportedModel] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedModel, setImportedModel] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [isAIPromptModalOpen, setIsAIPromptModalOpen] = useState(false);

  const CONFIRMATION_TEXT = "Eu confirmo que desejo aplicar este modelo";

  const [isModelDetailsModalOpen, setIsModelDetailsModalOpen] = useState(false);

  const handleSelectModel = (modelKey: string) => {
    setSelectedModel(modelKey);
    setIsModelsModalOpen(false);
    setIsModelDetailsModalOpen(true);
  };

  const handleConfirmModel = () => {
    setIsModelDetailsModalOpen(false);
    setIsConfirmModalOpen(true);
    setConfirmText('');
    setError('');
  };

  // Descrições dos modelos
  const modelDescriptions: Record<string, string> = {
    bpc: "Agente especializado em Benefício de Prestação Continuada (BPC/LOAS), auxiliando na identificação de critérios e documentação necessária.",
    trabalhista: "Focado em ações trabalhistas para reclamantes, cobrindo direitos trabalhistas, rescisões e verbas.",
    auxilio: "Especialista em auxílio-acidente, orientando sobre direitos e processos de solicitação.",
    bancario: "Voltado para casos de superendividamento bancário, revisão de contratos e negociação de dívidas.",
    descontoIndevido: "Especialista em descontos indevidos em consignados, RMC e RCC, auxiliando na identificação e recuperação de valores.",
    invalidez: "Focado em revisão de aposentadoria por invalidez, análise de benefícios e possibilidades de revisão.",
    maternidade: "Especialista em salário-maternidade, orientando sobre direitos, prazos e documentação.",
    bancarioProdutorRural: "Voltado para produtores rurais com questões bancárias, financiamentos e renegociações.",
    pensaoDivorcio: "Focado em pensão alimentícia e divórcio, auxiliando em questões de partilha e direitos.",
    pensaoMorte: "Especialista em pensão por morte, orientando sobre requisitos, documentação e processos."
  };

  // Detalhes completos dos modelos com etapas e funcionalidades
  const modelDetails: Record<string, { steps: string[], features: string[] }> = {
    pensaoMorte: {
      steps: [
        "Recepção: acolhe o cliente e coleta informações iniciais sobre o caso de pensão por morte.",
        "Qualificação: identifica se o benefício foi indeferido, ainda não solicitado ou está demorando demais para análise.",
        "Análise de Viabilidade: confirma causa da morte, vínculo familiar, filhos, bens e certidão de óbito.",
        "Contrato: explica o contrato de êxito (3 primeiros benefícios + 30% do retroativo) quando não há bens.",
        "Agendamento: marca reunião com o advogado após assinatura ou confirmação de bens.",
        "Confirmação: envia detalhes e orientações sobre a reunião por vídeo (Google Meet)."
      ],
      features: [
        "Acolhe leads com pensão indeferida, não solicitada ou em análise no INSS.",
        "Identifica automaticamente quem tem direito ao benefício.",
        "Reúne informações familiares e patrimoniais do falecido.",
        "Envia o contrato via Zapsign e valida assinatura.",
        "Agenda reunião com o advogado previdenciário.",
        "Mantém tom empático, natural e profissional."
      ]
    },
    bpc: {
      steps: [
        "Recepção: recebe o cliente e entende se o pedido do BPC foi negado ou ainda não feito.",
        "Qualificação: confirma se o beneficiário é idoso ou pessoa com deficiência.",
        "Análise de Viabilidade: verifica renda familiar, composição, CadÚnico e indeferimento do INSS.",
        "Contrato: explica que o escritório atua por êxito e detalha os percentuais.",
        "Agendamento: confirma assinatura do contrato e agenda reunião.",
        "Confirmação: envia data, horário e orientações da reunião online."
      ],
      features: [
        "Analisa casos de BPC negado ou pendente.",
        "Verifica critérios de renda e composição familiar.",
        "Filtra leads que se enquadram nas exigências legais.",
        "Envia contrato para assinatura digital.",
        "Agenda reunião com o advogado previdenciário.",
        "Garante atendimento humano e esclarecedor."
      ]
    },
    auxilio: {
      steps: [
        "Recepção: acolhe o cliente e identifica se o auxílio foi negado ou ainda não solicitado.",
        "Qualificação: verifica se há incapacidade comprovada ou em análise médica.",
        "Análise de Viabilidade: confirma histórico de contribuições e tipo de doença.",
        "Contrato: explica os honorários de êxito e autoriza representação.",
        "Agendamento: coleta e-mail, envia contrato e marca reunião.",
        "Confirmação: confirma data e orienta sobre a reunião virtual."
      ],
      features: [
        "Atende clientes com auxílio-doença negado ou pendente.",
        "Faz triagem jurídica para verificar viabilidade do pedido judicial.",
        "Coleta dados médicos e de contribuição.",
        "Envia contrato para assinatura digital.",
        "Agenda reunião com advogado especialista.",
        "Mantém comunicação empática e objetiva."
      ]
    },
    invalidez: {
      steps: [
        "Recepção: acolhe o cliente e identifica se o benefício de invalidez foi negado.",
        "Qualificação: confirma tipo de incapacidade e status do INSS.",
        "Análise de Viabilidade: avalia tempo de contribuição e documentos médicos.",
        "Contrato: apresenta o modelo de êxito e envia o link de assinatura.",
        "Agendamento: agenda reunião com advogado após assinatura.",
        "Confirmação: valida horário e orienta sobre o link da reunião."
      ],
      features: [
        "Avalia casos de aposentadoria ou benefício por invalidez indeferido.",
        "Verifica se há incapacidade permanente e direito ao benefício.",
        "Coleta dados de saúde e contribuição.",
        "Explica o contrato de êxito e coleta assinatura digital.",
        "Agenda reunião com advogado especializado.",
        "Acompanha o cliente de forma humanizada até a reunião."
      ]
    },
    maternidade: {
      steps: [
        "Recepção: acolhe a cliente e explica o benefício de salário maternidade.",
        "Qualificação: confirma se é gestante, mãe recente ou adoção/guarda judicial.",
        "Análise de Viabilidade: verifica vínculo com INSS, contribuições e idade da criança.",
        "Contrato: apresenta condições do contrato de êxito e envia link de assinatura.",
        "Agendamento: confirma e-mail e agenda reunião com o advogado.",
        "Confirmação: envia detalhes e horários da reunião virtual."
      ],
      features: [
        "Identifica quem tem direito ao salário maternidade.",
        "Verifica contribuições e situação previdenciária da mãe.",
        "Filtra casos elegíveis e encaminha para o jurídico.",
        "Envia contrato e valida assinatura digital.",
        "Agenda reunião com advogado previdenciário.",
        "Garante acolhimento e agilidade na condução do caso."
      ]
    },
    descontoIndevido: {
      steps: [
        "Recepção: acolhe o cliente e identifica o tipo de desconto indevido.",
        "Qualificação: verifica se há descontos em benefício, conta ou cartão.",
        "Análise de Viabilidade: confirma valores, tempo e tipo de contrato.",
        "Contrato: apresenta o modelo de êxito e coleta assinatura.",
        "Agendamento: confirma assinatura e agenda reunião jurídica.",
        "Confirmação: orienta sobre reunião online e próximos passos."
      ],
      features: [
        "Atende vítimas de descontos indevidos em benefícios ou contas.",
        "Identifica origem e responsáveis pelo desconto.",
        "Explica os direitos e coleta informações do caso.",
        "Envia contrato via Zapsign e agenda reunião.",
        "Mantém linguagem simples, profissional e acolhedora.",
        "Direciona o caso ao advogado para análise detalhada."
      ]
    },
    trabalhista: {
      steps: [
        "Recepção: acolhe o cliente e entende o problema com a empresa.",
        "Qualificação: confirma se há interesse em processo judicial.",
        "Análise de Viabilidade: faz perguntas sobre vínculo, pagamentos, função e jornada.",
        "Contrato: apresenta o contrato de êxito (30%) e envia o link para assinatura.",
        "Agendamento: agenda reunião após assinatura do contrato.",
        "Confirmação: envia confirmação e orientações sobre a reunião."
      ],
      features: [
        "Recebe leads com problemas trabalhistas e verifica irregularidades.",
        "Confirma se há rescisão indireta ou direitos violados.",
        "Explica a forma de atuação e percentual de êxito.",
        "Envia contrato via Zapsign e tutorial de assinatura.",
        "Agenda reunião com advogado trabalhista.",
        "Conduz o processo com empatia e clareza."
      ]
    },
    pensaoDivorcio: {
      steps: [
        "Recepção: identifica se o caso é de divórcio, união estável ou pensão.",
        "Qualificação: confirma interesse em análise de viabilidade.",
        "Análise de Viabilidade: faz perguntas sobre casamento, filhos e bens.",
        "Contrato: explica honorários e condições de atendimento.",
        "Agendamento: marca reunião gratuita com o advogado.",
        "Confirmação: envia data, horário e link da reunião."
      ],
      features: [
        "Atende clientes com demandas de divórcio, pensão ou alimentos.",
        "Coleta informações básicas sobre relação conjugal e filhos.",
        "Filtra se o caso é consensual ou litigioso.",
        "Explica valores e condições do escritório.",
        "Agenda reunião com advogado de família.",
        "Mantém atendimento cordial e profissional."
      ]
    },
    bancario: {
      steps: [
        "Recepção: acolhe o cliente e entende o problema bancário.",
        "Qualificação: confirma se há contrato, empréstimo ou cobrança indevida.",
        "Análise de Viabilidade: verifica documentos e histórico do banco.",
        "Contrato: explica a política de êxito e envia link para assinatura.",
        "Agendamento: confirma assinatura e agenda reunião.",
        "Confirmação: orienta sobre a reunião virtual com o advogado."
      ],
      features: [
        "Identifica e analisa contratos bancários irregulares.",
        "Verifica cobranças, empréstimos ou consignados não autorizados.",
        "Garante triagem completa antes do contato jurídico.",
        "Envia contrato via Zapsign e tutorial de assinatura.",
        "Agenda reunião com advogado bancário.",
        "Atende de forma simples, direta e empática."
      ]
    },
    bancarioProdutorRural: {
      steps: [
        "Recepção: acolhe o cliente e identifica o tipo de contrato rural.",
        "Qualificação: confirma se é produtor rural e qual a instituição financeira.",
        "Análise de Viabilidade: verifica valores, prazos e irregularidades no contrato.",
        "Contrato: apresenta condições de êxito e envia link de assinatura.",
        "Agendamento: agenda reunião após confirmação da assinatura.",
        "Confirmação: envia detalhes da reunião com advogado."
      ],
      features: [
        "Analisa contratos de crédito agrícola e financiamentos rurais.",
        "Identifica juros abusivos ou cláusulas ilegais.",
        "Filtra leads aptos a ação judicial.",
        "Envia contrato via Zapsign e agenda reunião.",
        "Encaminha o caso ao advogado bancário especialista.",
        "Mantém comunicação profissional e técnica, sem jargões."
      ]
    }
  };

  // Fetch current model data for export
  const fetchCurrentModel = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch personality
      const personalityResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/get', {
        headers: { token }
      });
      const personalityData = await personalityResponse.json();
      const personality = Array.isArray(personalityData) && personalityData.length > 0 ? personalityData[0] : null;
      
      // Fetch rules
      const rulesResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/get', {
        headers: { token }
      });
      const rulesData = await rulesResponse.json();
      const rules = Array.isArray(rulesData) && rulesData.length > 0 ? rulesData[0] : null;
      
      // Fetch steps
      const stepsResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/get', {
        headers: { token }
      });
      const steps = await stepsResponse.json();
      
      // Fetch FAQ
      const faqResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/get', {
        headers: { token }
      });
      const faq = await faqResponse.json();
      
      // Combine all data
      const modelData = {
        personalidade: {
          descricao: personality?.descricao || '',
          area: personality?.area || '',
          tom: personality?.tom || 'professional',
          valor_negociacao: personality?.valor_negociacao || 0
        },
        regras: {
          regras: rules?.regras || ''
        },
        etapas: Array.isArray(steps) ? steps.map(step => ({
          ordem: step.ordem,
          nome: step.nome,
          descricao: step.descricao
        })) : [],
        faq: Array.isArray(faq) ? faq.map(item => ({
          ordem: item.ordem,
          nome: item.pergunta,
          descricao: item.resposta
        })) : []
      };
      
      setExportedModel(JSON.stringify(modelData, null, 2));
      setIsExportModalOpen(true);
    } catch (err) {
      console.error('Erro ao exportar modelo:', err);
      setError('Erro ao exportar modelo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportModel = async () => {
    setImportLoading(true);
    setImportError('');
    
    try {
      let modelData;
      try {
        modelData = JSON.parse(importedModel);
      } catch (err) {
        throw new Error('JSON inválido. Verifique o formato do modelo.');
      }
      
      // Validate model structure
      if (!modelData.personalidade || !modelData.regras || !Array.isArray(modelData.etapas) || !Array.isArray(modelData.faq)) {
        throw new Error('Estrutura do modelo inválida. Verifique se o JSON contém personalidade, regras, etapas e faq.');
      }
      
      // Apply personality
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(modelData.personalidade)
      });
      
      // Apply rules
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(modelData.regras)
      });
      
      // Apply steps
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(modelData.etapas)
      });
      
      // Apply FAQ
      const faqData = modelData.faq.map(item => ({
        ordem: item.ordem,
        pergunta: item.nome,
        resposta: item.descricao
      }));
      
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(faqData)
      });
      
      setIsImportModalOpen(false);
      setImportedModel('');
      setSuccess('Modelo importado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh data
      onSuccess();
    } catch (err) {
      console.error('Erro ao importar modelo:', err);
      setImportError(err instanceof Error ? err.message : 'Erro ao importar modelo');
    } finally {
      setImportLoading(false);
    }
  };

  const handleApplyModel = async () => {
    if (!selectedModel || confirmText !== CONFIRMATION_TEXT) return;

    setLoading(true);
    setError('');

    try {
      const model = agentModels[selectedModel].data;

      // Aplicar personalidade
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.personalidade)
      });

      // Aplicar regras
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.regras)
      });

      // Aplicar etapas
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.etapas)
      });

      // Aplicar FAQ
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.faq)
      });

      setIsConfirmModalOpen(false);
      
      // Add a small delay before refreshing
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (err) {
      console.error('Erro ao aplicar modelo:', err);
      setError('Erro ao aplicar modelo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyGeneratedModel = async (model: any) => {
    setLoading(true);
    setError('');

    try {
      // Apply personality
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          descricao: model.personalidade.descricao,
          area: model.personalidade.area,
          tom: 'professional',
          valor_negociacao: 0
        })
      });

      // Apply rules
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/regras/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.regras)
      });

      // Apply steps
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(model.etapas)
      });

      // Apply FAQ
      const faqData = model.faq.map((item: any) => ({
        ordem: item.ordem,
        pergunta: item.nome,
        resposta: item.descricao
      }));

      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(faqData)
      });

      setSuccess('Modelo aplicado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh data
      onSuccess();
    } catch (err) {
      console.error('Erro ao aplicar modelo gerado:', err);
      setError('Erro ao aplicar modelo gerado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadModel = () => {
    const blob = new Blob([exportedModel], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-agente.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-800 rounded-2xl p-8 md:p-12 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-neutral-700 rounded-2xl shadow-lg mb-4">
                <Book className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Configure seu Agente de IA
              </h2>
              <p className="text-lg text-gray-600 dark:text-neutral-300 max-w-2xl mx-auto">
                Escolha um modelo pré-configurado ou crie um agente personalizado do zero
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {canEdit && (
                <>
                  {/* Card 1 - Escolher Área */}
                  <button
                    onClick={() => setIsModelsModalOpen(true)}
                    className="group relative bg-white dark:bg-neutral-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full -mr-16 -mt-16"></div>

                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                        <Book className="w-7 h-7 text-white" />
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Escolher Área da IA
                      </h3>
                      <p className="text-gray-600 dark:text-neutral-300 text-sm mb-4">
                        Selecione entre 10 modelos especializados prontos para uso
                      </p>

                      <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:gap-2 transition-all">
                        <span>Ver modelos</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </button>

                  {/* Card 2 - Criar do Zero */}
                  <button
                    onClick={() => setIsAIPromptModalOpen(true)}
                    className="group relative bg-white dark:bg-neutral-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-full -mr-16 -mt-16"></div>

                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-7 h-7 text-white" />
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Criar Agente do Zero
                      </h3>
                      <p className="text-gray-600 dark:text-neutral-300 text-sm mb-4">
                        Use IA para criar um agente personalizado do zero
                      </p>

                      <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium text-sm group-hover:gap-2 transition-all">
                        <span>Começar agora</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-xl text-sm flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Exportar/Importar Section */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-neutral-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Exportar/Importar Modelo</h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Gerencie seus modelos personalizados</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchCurrentModel}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-200 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Exportar Modelo Atual</span>
            </button>
            {canEdit && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-200 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors font-medium text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Importar Modelo</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal de Seleção de Modelos com Cards */}
        <Modal
          isOpen={isModelsModalOpen}
          onClose={() => setIsModelsModalOpen(false)}
          title=""
          maxWidth="6xl"
        >
          <div className="relative">
            {/* Header do Modal */}
            <div className="px-8 py-6 -mt-6 -mx-6 mb-6 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                Escolha a Área do seu Agente
              </h2>
              <p className="text-gray-600 dark:text-neutral-400 text-center text-sm">
                Selecione uma especialização para configurar seu agente
              </p>
            </div>

            {/* Grid de Cards */}
            <div className="px-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(agentModels).map(([key, model]) => {
                  const colors = {
                    bpc: 'from-blue-500 to-blue-600',
                    trabalhista: 'from-red-500 to-red-600',
                    auxilio: 'from-yellow-500 to-yellow-600',
                    bancario: 'from-orange-500 to-orange-600',
                    descontoIndevido: 'from-purple-500 to-purple-600',
                    invalidez: 'from-pink-500 to-pink-600',
                    maternidade: 'from-rose-500 to-rose-600',
                    bancarioProdutorRural: 'from-amber-500 to-amber-600',
                    pensaoDivorcio: 'from-emerald-500 to-emerald-600',
                    pensaoMorte: 'from-teal-500 to-teal-600'
                  };

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectModel(key)}
                      className="group relative bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-5 hover:border-gray-300 dark:hover:border-neutral-600 hover:shadow-md transition-all duration-200 text-left"
                    >
                      {/* Icon and Title */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${colors[key] || 'from-blue-500 to-purple-500'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Book className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight flex-1">
                          {model.name}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {modelDescriptions[key] || 'Modelo pré-configurado para otimizar o atendimento.'}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Footer Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-700">
                <button
                  onClick={() => setIsModelsModalOpen(false)}
                  className="w-full px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Modal de Detalhes do Modelo */}
        <Modal
          isOpen={isModelDetailsModalOpen}
          onClose={() => {
            setIsModelDetailsModalOpen(false);
            setSelectedModel('');
          }}
          title=""
          maxWidth="4xl"
        >
          {selectedModel && (
            <div className="relative">
              {/* Header com gradiente e ícone */}
              <div className={`bg-gradient-to-br ${
                selectedModel === 'bpc' ? 'from-blue-500 to-blue-600' :
                selectedModel === 'trabalhista' ? 'from-red-500 to-red-600' :
                selectedModel === 'auxilio' ? 'from-yellow-500 to-yellow-600' :
                selectedModel === 'bancario' ? 'from-orange-500 to-orange-600' :
                selectedModel === 'descontoIndevido' ? 'from-purple-500 to-purple-600' :
                selectedModel === 'invalidez' ? 'from-pink-500 to-pink-600' :
                selectedModel === 'maternidade' ? 'from-rose-500 to-rose-600' :
                selectedModel === 'bancarioProdutorRural' ? 'from-amber-500 to-amber-600' :
                selectedModel === 'pensaoDivorcio' ? 'from-emerald-500 to-emerald-600' :
                selectedModel === 'pensaoMorte' ? 'from-teal-500 to-teal-600' :
                'from-blue-500 to-purple-600'
              } px-8 py-10 -mt-6 -mx-6 rounded-t-2xl mb-0 relative overflow-hidden`}>
                {/* Padrão decorativo de fundo */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full mix-blend-overlay filter blur-2xl"></div>
                </div>

                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-5 shadow-2xl">
                    <Book className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
                    {agentModels[selectedModel]?.name}
                  </h2>
                  <p className="text-white/90 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                    {modelDescriptions[selectedModel]}
                  </p>
                </div>
              </div>

              {/* Conteúdo do modal */}
              <div className="px-8 py-8">
                {modelDetails[selectedModel] && (
                  <div className="space-y-8">
                    {/* Etapas do Atendimento */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl">⚙️</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Etapas do Atendimento
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-neutral-400">
                            Fluxo completo de interação com o cliente
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {modelDetails[selectedModel].steps.map((step, index) => {
                          const stepName = step.split(':')[0];
                          const stepDescription = step.split(':')[1];

                          return (
                            <div
                              key={index}
                              className="group bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-neutral-700"
                            >
                              <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-md group-hover:scale-110 transition-transform">
                                    {index + 1}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 dark:text-white mb-1 text-sm">
                                    {stepName}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                                    {stepDescription}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* O que o Agente Faz */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl">🧭</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            O que o Agente Faz
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-neutral-400">
                            Principais funcionalidades e capacidades
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {modelDetails[selectedModel].features.map((feature, index) => (
                          <div
                            key={index}
                            className="group bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-neutral-700"
                          >
                            <div className="flex gap-3 items-start">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed flex-1">
                                {feature}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!modelDetails[selectedModel] && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-neutral-700 rounded-2xl mb-4">
                      <Book className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-gray-500 dark:text-neutral-400 text-lg">
                      Este modelo está configurado e pronto para uso.
                    </p>
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-neutral-700">
                  <button
                    onClick={() => {
                      setIsModelDetailsModalOpen(false);
                      setSelectedModel('');
                      setIsModelsModalOpen(true);
                    }}
                    className="w-full sm:w-auto order-2 sm:order-1 px-6 py-3 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-xl transition-colors"
                  >
                    ← Voltar aos Modelos
                  </button>
                  {canEdit && (
                    <button
                      onClick={handleConfirmModel}
                      className={`w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 bg-gradient-to-r ${
                        selectedModel === 'bpc' ? 'from-blue-500 to-blue-600' :
                        selectedModel === 'trabalhista' ? 'from-red-500 to-red-600' :
                        selectedModel === 'auxilio' ? 'from-yellow-500 to-yellow-600' :
                        selectedModel === 'bancario' ? 'from-orange-500 to-orange-600' :
                        selectedModel === 'descontoIndevido' ? 'from-purple-500 to-purple-600' :
                        selectedModel === 'invalidez' ? 'from-pink-500 to-pink-600' :
                        selectedModel === 'maternidade' ? 'from-rose-500 to-rose-600' :
                        selectedModel === 'bancarioProdutorRural' ? 'from-amber-500 to-amber-600' :
                        selectedModel === 'pensaoDivorcio' ? 'from-emerald-500 to-emerald-600' :
                        selectedModel === 'pensaoMorte' ? 'from-teal-500 to-teal-600' :
                        'from-blue-600 to-purple-600'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                      Aplicar este Modelo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setConfirmText('');
            setError('');
          }}
          title=""
          maxWidth="2xl"
        >
          <div className="relative">
            {/* Header com gradiente de alerta */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 px-8 py-8 -mt-6 -mx-6 rounded-t-2xl mb-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
              </div>

              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Confirmar Aplicação do Modelo
                </h2>
                <p className="text-white/90 text-sm">
                  Esta ação irá substituir todas as configurações atuais do seu agente
                </p>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="px-8 pb-8">
              {selectedModel && (
                <div className={`relative rounded-2xl p-6 mb-6 overflow-hidden border-2 bg-gradient-to-br ${
                  selectedModel === 'bpc' ? 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700' :
                  selectedModel === 'trabalhista' ? 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-700' :
                  selectedModel === 'auxilio' ? 'from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-700' :
                  selectedModel === 'bancario' ? 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700' :
                  selectedModel === 'descontoIndevido' ? 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700' :
                  selectedModel === 'invalidez' ? 'from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 border-pink-200 dark:border-pink-700' :
                  selectedModel === 'maternidade' ? 'from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 border-rose-200 dark:border-rose-700' :
                  selectedModel === 'bancarioProdutorRural' ? 'from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-700' :
                  selectedModel === 'pensaoDivorcio' ? 'from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-emerald-200 dark:border-emerald-700' :
                  selectedModel === 'pensaoMorte' ? 'from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 border-teal-200 dark:border-teal-700' :
                  'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br ${
                      selectedModel === 'bpc' ? 'from-blue-500 to-blue-600' :
                      selectedModel === 'trabalhista' ? 'from-red-500 to-red-600' :
                      selectedModel === 'auxilio' ? 'from-yellow-500 to-yellow-600' :
                      selectedModel === 'bancario' ? 'from-orange-500 to-orange-600' :
                      selectedModel === 'descontoIndevido' ? 'from-purple-500 to-purple-600' :
                      selectedModel === 'invalidez' ? 'from-pink-500 to-pink-600' :
                      selectedModel === 'maternidade' ? 'from-rose-500 to-rose-600' :
                      selectedModel === 'bancarioProdutorRural' ? 'from-amber-500 to-amber-600' :
                      selectedModel === 'pensaoDivorcio' ? 'from-emerald-500 to-emerald-600' :
                      selectedModel === 'pensaoMorte' ? 'from-teal-500 to-teal-600' :
                      'from-blue-500 to-blue-600'
                    }`}>
                      <Book className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-600 dark:text-neutral-400 uppercase tracking-wide mb-1">
                        Modelo Selecionado
                      </p>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                        {agentModels[selectedModel]?.name}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">
                        {modelDescriptions[selectedModel]}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Seção de confirmação */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-700 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-neutral-600">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      Confirmação Necessária
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                      Para prosseguir, digite exatamente o texto abaixo no campo de confirmação:
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 mb-4 border-2 border-dashed border-gray-300 dark:border-neutral-600">
                  <code className="text-sm font-mono text-gray-900 dark:text-neutral-100 break-all">
                    {CONFIRMATION_TEXT}
                  </code>
                </div>

                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Digite o texto de confirmação aqui..."
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-amber-500 dark:focus:border-amber-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500 transition-all text-sm"
                  autoFocus
                />

                {/* Indicador de progresso */}
                {confirmText && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-xs">
                      {confirmText === CONFIRMATION_TEXT ? (
                        <>
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            Texto confirmado corretamente!
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 dark:border-neutral-500 rounded-full"></div>
                          <span className="text-gray-600 dark:text-neutral-400">
                            O texto não corresponde. Verifique e tente novamente.
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 border-t border-gray-200 dark:border-neutral-700">
                <button
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setConfirmText('');
                    setError('');
                  }}
                  className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-xl transition-all border border-gray-300 dark:border-neutral-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyModel}
                  disabled={confirmText !== CONFIRMATION_TEXT || loading}
                  className={`flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    confirmText === CONFIRMATION_TEXT && !loading
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105'
                      : 'bg-gray-400 dark:bg-neutral-600'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Aplicando Modelo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Aplicar Modelo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          title="Exportar Modelo"
          maxWidth="lg"
        >
          <div className="p-6 space-y-4">
            <p className="text-gray-600 dark:text-neutral-400">
              Abaixo está o JSON do seu modelo atual. Você pode copiá-lo ou fazer o download para importar em outro sistema.
            </p>

            <div className="bg-gray-50 dark:bg-neutral-700 p-4 rounded-lg border border-gray-300 dark:border-neutral-600 overflow-auto max-h-[400px]">
              <pre className="text-sm text-gray-800 dark:text-neutral-200 whitespace-pre-wrap">{exportedModel}</pre>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-md"
              >
                Fechar
              </button>
              <button
                onClick={handleDownloadModel}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md"
              >
                <Download className="w-4 h-4" />
                <span>Download JSON</span>
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            setImportedModel('');
            setImportError('');
          }}
          title="Importar Modelo"
          maxWidth="lg"
        >
          <div className="p-6 space-y-4">
            <p className="text-gray-600 dark:text-neutral-400">
              Cole o JSON do modelo que deseja importar. Certifique-se de que o formato está correto.
            </p>

            <textarea
              value={importedModel}
              onChange={(e) => setImportedModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              rows={12}
              placeholder="Cole o JSON do modelo aqui..."
            />

            {importError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {importError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportedModel('');
                  setImportError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportModel}
                disabled={!importedModel.trim() || importLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md disabled:opacity-50"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Importar Modelo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal de Criar Agente do Zero com IA */}
        <Modal
          isOpen={isAIPromptModalOpen}
          onClose={() => setIsAIPromptModalOpen(false)}
          title="Criar Agente do Zero com IA"
          maxWidth="4xl"
        >
          <div className="p-6">
            <AIPromptGenerator
              token={token}
              onApplyModel={(model) => {
                handleApplyGeneratedModel(model);
                setIsAIPromptModalOpen(false);
              }}
              canEdit={canEdit}
            />
          </div>
        </Modal>
      </div>
    </>
  );
}