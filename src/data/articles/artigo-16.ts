import { Article } from './types';

export const artigo16: Article = {
  id: 'artigo-16',
  title: 'Aba de Conversas da Guimoo',
  description: 'Aprenda a gerenciar seus atendimentos, controlar a IA e integrar com o CRM através da aba de Conversas.',
  category: 'artigos',
  readTime: '6 min',
  tags: ['Conversas', 'WhatsApp', 'IA', 'Atendimento', 'CRM'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é a aba de Conversas</h2>
          <p class="mb-3">
            A aba <strong>Conversas</strong> é o coração da Guimoo — é nela que você realiza <strong>todo o atendimento com seus leads</strong>, interagindo com mensagens, áudios, imagens e acompanhando o histórico completo.
          </p>
          <p class="mb-3">
            Ela funciona de forma muito semelhante ao <strong>WhatsApp Web</strong>, mas com recursos extras para gestão, controle da IA e integração direta com o CRM.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como acessar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>No menu lateral esquerdo da Guimoo, clique em <strong>"Conversas"</strong>.</li>
            <li>A tela inicial ficará em branco até que você selecione uma conversa.</li>
            <li>Ao clicar em um lead, o <strong>histórico completo de mensagens</strong> será exibido no painel central.</li>
          </ol>
          <p class="mt-3 text-sm text-gray-600 dark:text-neutral-400">
            💡 Toda conversa é carregada diretamente do seu WhatsApp conectado — você não perde histórico, mesmo das conversas antigas.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Conectando o WhatsApp</h2>
          <p class="mb-3">
            Antes de visualizar as mensagens, é necessário conectar sua conta do WhatsApp:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Vá até <strong>Configurações → Conexões → WhatsApp</strong>.</li>
            <li>Escaneie o <strong>QR Code</strong> exibido na tela.</li>
            <li>Após isso, suas conversas aparecerão automaticamente na aba <strong>Conversas</strong>, assim como no WhatsApp Web.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔍 Filtros e busca de conversas</h2>
          <p class="mb-3">
            Na parte superior da aba, há diversos filtros para você organizar e localizar atendimentos facilmente:
          </p>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Filtro</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Função</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔎 <strong>Pesquisa</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Encontre um lead pelo nome ou telefone</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🤖 <strong>IA Ativa</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Exibe apenas conversas com a IA ligada</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⏸️ <strong>IA Pausada / Desativada</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Mostra contatos em que a IA foi pausada manualmente</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⏰ <strong>Não Respondidas</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Mostra leads que enviaram mensagem e ainda não receberam resposta</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔁 <strong>Transferidas</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Exibe conversas que a IA transferiu para um atendente humano</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">👤 <strong>Responsável</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Filtra por atendente (ex: mostrar apenas os leads do Cauê)</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🏷️ <strong>Etiquetas</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Filtra por tags aplicadas, como "Aguardando documentação"</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📅 <strong>Período</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Mostra conversas recebidas em um intervalo de datas específico</td>
              </tr>
            </tbody>
          </table>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            💡 Você pode combinar vários filtros ao mesmo tempo e clicar em "Limpar filtros" para voltar à visão geral.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">➕ Iniciando uma nova conversa</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4 mb-3">
            <li>Clique no botão <strong>"Nova Conversa"</strong>.</li>
            <li>Digite o número do contato no formato completo:
              <div class="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-lg my-2 font-mono">
                55 + DDD + número
              </div>
              Exemplo: <code class="bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded">5562999999999</code>
            </li>
            <li>Verifique se o número possui o <strong>nove</strong> no lugar correto (muitos erros ocorrem por isso).</li>
            <li>Clique em <strong>Criar</strong> e o sistema abrirá automaticamente a tela de chat.</li>
          </ol>
          <p class="text-sm text-gray-600 dark:text-neutral-400">
            💬 Agora você pode conversar com o lead normalmente — enviando texto, mídia, áudio ou ativando a IA.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Gerenciando informações do lead</h2>
          <p class="mb-3">
            Ao abrir uma conversa, no topo do chat aparece o <strong>nome do cliente</strong>.
            Clique nele para abrir o <strong>painel lateral de informações</strong>.
          </p>
          <p class="mb-3">
            Esse painel permite que você <strong>gerencie tudo sobre o lead em um só lugar:</strong>
          </p>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Campo</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Função</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📞 <strong>Nome e telefone</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Mostra os dados básicos do contato</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🤖 <strong>Controle da IA</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Ativar, pausar ou desativar o agente da conversa</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">👤 <strong>Responsável</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Atribuir o atendimento a um membro da equipe</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧩 <strong>Funil e Etapa</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Definir manualmente em qual etapa do funil o lead está</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🏷️ <strong>Etiquetas</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Adicionar ou remover tags para organização</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧾 <strong>Resumo da Conversa</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Gerar ou baixar o resumo completo da interação</td>
              </tr>
            </tbody>
          </table>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            💡 O sistema atualiza automaticamente o nome do responsável no CRM quando você faz a atribuição.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧾 Gerando o resumo da conversa</h2>
          <p class="mb-3">
            O resumo é uma ferramenta inteligente que cria uma <strong>síntese automática</strong> de toda a conversa do lead — ideal para salvar histórico ou repassar informações rapidamente.
          </p>

          <div class="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg mb-3">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">Como gerar:</h3>
            <ol class="list-decimal list-inside space-y-2 ml-4">
              <li>No painel lateral, clique em <strong>"Gerar resumo"</strong>.</li>
              <li>Aguarde alguns segundos — o sistema processa toda a conversa.</li>
              <li>O resumo aparecerá logo abaixo, podendo ser:
                <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>📋 <strong>Copiado</strong> (para colar em outro local);</li>
                  <li>💾 <strong>Baixado</strong> em formato <strong>TXT</strong> ou <strong>PDF</strong>;</li>
                  <li>🔁 <strong>Regenerado</strong> após novas mensagens.</li>
                </ul>
              </li>
            </ol>
          </div>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            📘 Sempre que houver novas mensagens importantes, clique em "Gerar novo resumo" para atualizar as informações.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔗 Integração com o CRM</h2>
          <p class="mb-3">
            A partir do painel lateral, você também pode abrir o lead diretamente no <strong>CRM</strong>:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Clique em <strong>"Abrir no CRM"</strong>.</li>
            <li>O sistema levará você para a negociação correspondente, já vinculada àquela conversa.</li>
          </ul>
          <p class="mt-3">
            Essa integração garante <strong>sincronia total</strong> entre mensagens e registros de negociação.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Status da IA na conversa</h2>
          <p class="mb-3">
            Durante o atendimento, você pode alternar o comportamento da Inteligência Artificial:
          </p>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Status</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🟢 <strong>IA Ativa</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">A IA responde automaticamente ao lead</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🟡 <strong>IA Pausada</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Temporariamente desativada (pode ser reativada depois)</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔴 <strong>IA Desativada</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Não responde mais até ser ligada manualmente</td>
              </tr>
            </tbody>
          </table>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            💡 Esses status aparecem visualmente no chat para indicar o modo atual da conversa.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Exemplo prático</h2>
          <blockquote class="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4">
            Você abre a conversa da lead <strong>Pamela</strong>.
            <br><br>
            <ul class="list-disc list-inside space-y-2 ml-4">
              <li>A IA está ativa e responde automaticamente.</li>
              <li>Você decide pausar a IA e assumir o atendimento.</li>
              <li>Depois, adiciona a etiqueta "Aguardando documentação" e gera um resumo.</li>
              <li>Por fim, abre o lead no CRM para atualizar a etapa.</li>
            </ul>
            <br>
            Tudo isso é feito diretamente na aba <strong>Conversas</strong>, sem precisar sair da tela.
          </blockquote>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Função</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">O que faz</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💬 <strong>Conversar</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Envia mensagens, áudios e imagens diretamente</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔍 <strong>Filtros</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Localiza conversas específicas com rapidez</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🤖 <strong>Controle de IA</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Ativa, pausa ou desativa o agente individualmente</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🏷️ <strong>Etiquetas</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Identifica o status do lead</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📄 <strong>Resumo</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Gera e baixa o histórico resumido da conversa</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔗 <strong>Abrir no CRM</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Acessa a negociação vinculada</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Conclusão</h2>
          <p class="mb-3">
            A aba <strong>Conversas</strong> é o ponto central do atendimento dentro da Guimoo.
            Ela conecta o WhatsApp, o CRM e a IA em um único painel, permitindo que você <strong>atenda, gerencie e registre tudo com rapidez e organização.</strong>
          </p>
          <p>
            Com ela, seu escritório ganha eficiência, controle e histórico completo de todas as interações.
          </p>
        </section>
      </div>
    `
};
