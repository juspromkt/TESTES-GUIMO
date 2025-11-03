import { Article } from './types';

export const artigo21: Article = {
  id: 'artigo-21',
  title: 'Primeiro Acesso e Configuração Completa da IA Guimoo',
  description: 'Guia completo passo a passo para configurar sua conta Guimoo pela primeira vez, desde o login até a ativação completa da IA com WhatsApp, CRM e funil integrados.',
  category: 'artigos',
  readTime: '10 min',
  tags: ['Primeiros Passos', 'Configuração', 'IA', 'WhatsApp', 'Funil', 'CRM', 'Agente'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🚀 Bem-vindo à Guimoo</h2>
          <p class="mb-3">
            Assim que você recebe seu login e senha, o primeiro passo é configurar sua conta para que a
            <strong>Inteligência Artificial (IA)</strong> comece a atender automaticamente seus leads via <strong>WhatsApp</strong>
            — com CRM, funil, agente e movimentação automática totalmente integrados.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Etapa 1 – Acessando o sistema</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Acesse <strong><a href="https://app.guimoo.com.br" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">app.guimoo.com.br</a></strong>.</li>
            <li>Escolha o <strong>tema claro ou escuro</strong>.</li>
            <li>Faça login com seu <strong>e-mail e senha</strong>.</li>
            <li>Você verá o <strong>Dashboard inicial</strong> — se o CRM ainda não estiver configurado, ele aparecerá vazio.</li>
          </ol>

          <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
            <p class="text-sm text-gray-700 dark:text-neutral-300">
              💡 O primeiro passo sempre será configurar o seu <strong>Funil de Vendas</strong>.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Etapa 2 – Criar o Funil de Vendas</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4 mb-4">
            <li>Vá até <strong>Configurações → Funil de Vendas</strong>.</li>
            <li>Clique em <strong>"Novo Funil"</strong>.</li>
            <li>Dê um nome (ex: <code>Trabalhista</code>).</li>
            <li>Crie as etapas que o lead percorre:</li>
          </ol>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Exemplo</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Ativar Follow-up?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📥 Recepção</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Lead chega pelo WhatsApp</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ Sim</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧮 Análise de Viabilidade</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Verificação do caso</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ Sim</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💬 Oferta do Contrato</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Apresentação de proposta</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ Sim</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🖋️ Contrato Assinado</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Contrato confirmado</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ Sim</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📅 Agendamento</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Agendar reunião</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ Sim</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ Agendamento Feito</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Reunião concluída</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ Sim</td>
              </tr>
            </tbody>
          </table>

          <ol start={5} class="list-decimal list-inside space-y-2 ml-4">
            <li>Marque <strong>"Funil Padrão"</strong>.</li>
            <li>Clique em <strong>Salvar</strong>.</li>
          </ol>

          <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
            <p class="text-sm text-gray-700 dark:text-neutral-300">
              💡 <em>Este funil será o que a IA usará para movimentar automaticamente os leads no CRM.</em>
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Etapa 3 – Criar e Personalizar o Agente de IA</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Vá até <strong>Agente de IA</strong>.</li>
            <li>Clique em <strong>"Modelo de Agente"</strong>.</li>
            <li>Escolha a <strong>área da IA</strong> (ex: Trabalhista, Previdenciária, Cível etc.).</li>
            <li>Clique em <strong>"Aplicar Modelo"</strong> e confirme digitando o texto solicitado.</li>
          </ol>

          <p class="mt-4 mb-3">O sistema preencherá automaticamente:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Personalidade</li>
            <li>Regras Gerais</li>
            <li>Etapas de Atendimento</li>
            <li>Perguntas Frequentes</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">👤 Etapa 4 – Personalizar o Agente</h2>

          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">🪪 Personalidade</h3>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Altere o <strong>nome do agente</strong> (ex: <em>Ana Luísa</em>).</li>
            <li>Altere o <strong>nome do escritório</strong> (ex: <em>João Farias Advogados</em>).</li>
            <li>Clique em <strong>Salvar Personalidade</strong>.</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">⚖️ Regras Gerais</h3>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Revise as diretrizes e personalize se necessário.</li>
            <li>Exemplo: "Lead desqualificado: trabalhou menos de 6 meses."</li>
            <li>Clique em <strong>Salvar Regras</strong>.</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">🧾 Etapas de Atendimento</h3>
          <p class="mb-3">Cada etapa é o roteiro que a IA seguirá na conversa.</p>

          <ol class="list-decimal list-inside space-y-2 ml-4 mb-3">
            <li>Expanda cada etapa e personalize:</li>
          </ol>
          <ul class="list-disc list-inside space-y-2 ml-8 mb-3">
            <li>Nome do escritório</li>
            <li>Nome do agente</li>
            <li>Percentual de honorários (ex: 30%/70%)</li>
            <li>Link do contrato <strong>Zapsign</strong></li>
          </ul>

          <ol start={2} class="list-decimal list-inside space-y-2 ml-4 mb-3">
            <li>Etapas principais:</li>
          </ol>
          <ul class="list-disc list-inside space-y-2 ml-8 mb-3">
            <li>Recepção</li>
            <li>Qualificação do lead</li>
            <li>Análise de Viabilidade</li>
            <li>Oferta do Contrato</li>
            <li>Agendamento</li>
            <li>Agendamento Confirmado</li>
          </ul>

          <ol start={3} class="list-decimal list-inside space-y-2 ml-4 mb-4">
            <li>Na última etapa (<strong>Agendamento Confirmado</strong>):</li>
          </ol>
          <ul class="list-disc list-inside space-y-2 ml-8 mb-4">
            <li>Marque para <strong>desativar a IA após o atendimento</strong>.</li>
            <li><strong>Transfira</strong> o atendimento para um <strong>usuário humano</strong>.</li>
            <li>Clique em <strong>Salvar Etapa</strong>.</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">❓ Perguntas Frequentes (FAQ)</h3>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Atualize informações do escritório, advogado responsável e cidade.</li>
            <li>Exemplo:</li>
          </ul>
          <ul class="list-disc list-inside space-y-2 ml-8 mb-3">
            <li>"Onde fica o escritório?" → <em>Rua 123, Centro, Goiânia</em></li>
            <li>"Quem é o advogado responsável?" → <em>Dr. João Farias, OAB/GO 12345</em></li>
          </ul>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Revise todas as perguntas e respostas.</li>
            <li>Clique em <strong>Salvar Perguntas</strong>.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔄 Etapa 5 – Configurar Movimentação Automática</h2>
          <p class="mb-3">Essa parte conecta a IA ao CRM.</p>

          <ol class="list-decimal list-inside space-y-2 ml-4 mb-4">
            <li>Vá até <strong>Movimentação Automática</strong>.</li>
            <li>Clique em <strong>Resetar (se necessário)</strong>.</li>
            <li>Configure etapa por etapa:</li>
          </ol>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa de Atendimento</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Funil</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa no CRM</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Recepção</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Trabalhista</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Recepção</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Qualificação do Lead</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Trabalhista</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Qualificação</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Análise de Viabilidade</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Trabalhista</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Análise</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Oferta do Contrato</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Trabalhista</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Oferta</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Agendamento</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Trabalhista</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Agendamento</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Agendamento Confirmado</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Trabalhista</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Agendamento Feito</td>
              </tr>
            </tbody>
          </table>

          <ol start={4} class="list-decimal list-inside space-y-2 ml-4">
            <li>Clique em <strong>Gerar Descrição Automática</strong> → <strong>Aplicar Descrições</strong>.</li>
            <li>Ative o módulo (deixe o status como <strong>Ativo</strong>).</li>
          </ol>

          <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
            <p class="text-sm text-gray-700 dark:text-neutral-300">
              💡 Assim, a IA vai mover automaticamente o lead entre as etapas do funil conforme o andamento da conversa.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📱 Etapa 6 – Conectar o WhatsApp</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Vá até <strong>Configurações → Conexões</strong>.</li>
            <li>Clique em <strong>Conectar WhatsApp</strong>.</li>
            <li>Dê um nome para a conexão (ex: "Hub Trabalhista").</li>
            <li>Leia o <strong>QR Code</strong> com o WhatsApp do celular.</li>
            <li>Quando aparecer conectado, o sistema exibirá o status verde ✅.</li>
          </ol>

          <div class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
            <p class="text-sm text-gray-700 dark:text-neutral-300">
              💬 Assim que conectar, o painel de <strong>Conversas</strong> já carregará o histórico do seu WhatsApp.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💬 Etapa 7 – Gerenciar Conversas</h2>
          <p class="mb-3">Na aba <strong>Conversas</strong>, você pode:</p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>📂 Ver o histórico completo do lead</li>
            <li>🧠 Ativar, pausar ou desativar a IA manualmente</li>
            <li>👤 Alterar o responsável pelo atendimento</li>
            <li>🏷️ Adicionar etiquetas</li>
            <li>📄 Gerar e baixar <strong>resumo do atendimento</strong> em <strong>PDF</strong></li>
          </ul>

          <p class="mb-3"><strong>Cores dos status:</strong></p>
          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Cor / Ícone</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Significado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🟢 <strong>IA ativa</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Atendendo normalmente</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🟡 <strong>IA pausada</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Temporariamente parada</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔴 <strong>IA desativada</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Atendimento manual</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔁 <strong>Transferido</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Encaminhado a um usuário humano</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo geral da configuração</h2>
          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">O que fazer</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Resultado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">1️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Criar Funil de Vendas</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Define as etapas do CRM</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">2️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Aplicar Modelo de Agente</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Cria estrutura da IA</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">3️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Personalizar IA</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Adapta nome, escritório e regras</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">4️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Ajustar Movimentação Automática</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">IA move leads automaticamente</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">5️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Conectar WhatsApp</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">IA passa a atender os leads</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">6️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Revisar Conversas</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Acompanhe tudo em tempo real</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 Conclusão</h2>
          <p class="mb-3">
            Depois dessas etapas, sua <strong>IA Guimoo estará 100% configurada e funcional</strong>, pronta para:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-3">
            <li>Atender leads 24h via WhatsApp,</li>
            <li>Qualificar automaticamente,</li>
            <li>Enviar contratos,</li>
            <li>Agendar reuniões,</li>
            <li>E atualizar seu CRM sem você precisar intervir.</li>
          </ul>

          <div class="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded">
            <p class="text-sm text-gray-700 dark:text-neutral-300">
              🧩 Tudo integrado e automatizado — o agente virtual faz o trabalho pesado, e você foca nas decisões estratégicas.
            </p>
          </div>
        </section>
      </div>
    `
};
