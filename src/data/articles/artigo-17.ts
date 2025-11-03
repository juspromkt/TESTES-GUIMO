import { Article } from './types';

export const artigo17: Article = {
  id: 'artigo-17',
  title: 'Controle de IA nas Conversas (Ativar, Pausar, Desativar e Push Manual)',
  description: 'Aprenda a gerenciar o comportamento da IA em tempo real: ative, pause, desative ou envie push manual para controlar quando a IA interage.',
  category: 'artigos',
  readTime: '7 min',
  tags: ['IA', 'Conversas', 'Controle', 'Push', 'Parâmetros'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é o Controle de IA</h2>
          <p class="mb-3">
            O <strong>Controle de IA</strong> permite que você <strong>gerencie o comportamento da Inteligência Artificial em tempo real</strong>, diretamente dentro da aba de <strong>Conversas</strong> da Guimoo.
          </p>
          <p class="mb-3">
            Por meio dessa função, você pode:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>🟢 <strong>Ativar ou reativar</strong> a IA para retomar um atendimento automático;</li>
            <li>⏸️ <strong>Pausar</strong> temporariamente o agente;</li>
            <li>🔴 <strong>Desativar</strong> completamente;</li>
            <li>🚀 <strong>Enviar um Push (follow-up manual)</strong> para fazer a IA iniciar um novo contato com o cliente.</li>
          </ul>
          <p class="mt-3">
            Essa ferramenta oferece <strong>controle total sobre quando e como a IA interage com o lead</strong>, sem precisar alterar as configurações do agente.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💬 Como funciona na prática</h2>
          <p class="mb-3">
            Sempre que um novo lead entra em contato pelo WhatsApp e o agente estiver ativo e configurado, a IA começará a conversa automaticamente.
            Na tela de <strong>Conversas</strong>, você pode ver o status atual da IA de cada lead:
          </p>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Status</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Indicação</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Ação possível</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🟢 <strong>IA Ativa</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">A IA está respondendo normalmente</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Pode ser pausada ou desativada</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🟡 <strong>IA Pausada</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">A IA foi temporariamente interrompida</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Pode ser reativada manualmente ou automaticamente (caso configurado)</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔴 <strong>IA Desativada</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">A IA foi desligada definitivamente</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Só volta a funcionar após ser ativada novamente</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como usar o Controle de IA</h2>

          <div class="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">1️⃣ Visualizando o status</h3>
            <p class="mb-2">
              Na aba <strong>Conversas</strong>, selecione um lead.
              Na lateral do painel de informações, você verá o controle da IA com botões para:
            </p>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><strong>Ativar / Desativar IA</strong></li>
              <li><strong>Pausar IA</strong></li>
              <li><strong>Push (ativação manual)</strong></li>
            </ul>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-blue-900 dark:text-blue-300 mb-2">2️⃣ Enviando um Push (Follow-up Manual)</h3>
            <p class="text-blue-800 dark:text-blue-200 mb-2">
              O <strong>Push</strong> é uma maneira de <strong>forçar a IA a iniciar ou retomar a conversa</strong> com o lead manualmente.
            </p>
            <p class="text-blue-800 dark:text-blue-200 mb-2"><strong>Como fazer:</strong></p>
            <ol class="list-decimal list-inside space-y-1 ml-4 text-blue-800 dark:text-blue-200">
              <li>Clique no botão <strong>Ativar</strong> (ou "Push").</li>
              <li>A Guimoo enviará uma requisição para o agente.</li>
              <li>Aguarde até <strong>1 minuto</strong> — a IA enviará automaticamente uma nova mensagem ao lead.</li>
              <li>O botão ficará <strong>desativado durante esse período</strong>, evitando múltiplos envios.</li>
            </ol>
            <p class="text-sm text-blue-700 dark:text-blue-300 mt-2">
              💡 O Push é ideal para reengajar clientes que estão parados há algum tempo sem resposta.
            </p>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-yellow-900 dark:text-yellow-300 mb-2">3️⃣ Pausando a IA</h3>
            <p class="text-yellow-800 dark:text-yellow-200 mb-2">
              Use o botão <strong>"Pausar IA"</strong> quando quiser que a Inteligência Artificial <strong>pare de responder temporariamente</strong>.
              Essa pausa é útil quando o atendente humano assume o controle da conversa.
            </p>
            <p class="text-yellow-800 dark:text-yellow-200 mb-2"><strong>Durante a pausa:</strong></p>
            <ul class="list-disc list-inside space-y-1 ml-4 text-yellow-800 dark:text-yellow-200">
              <li>A IA não enviará mensagens;</li>
              <li>O botão ficará bloqueado (não clicável);</li>
              <li>A duração da pausa depende do que foi definido em <strong>Parâmetros do Agente → Tempo de Inatividade</strong>.</li>
            </ul>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              📘 <strong>Exemplo:</strong> Se estiver configurado para <strong>30 minutos</strong>, a IA será reativada automaticamente após esse tempo.
            </p>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              👉 <strong>Dica:</strong> O recomendado é deixar a opção como <strong>"Nunca reativar"</strong>, garantindo que a IA só volte quando você decidir.
            </p>
          </div>

          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <h3 class="font-bold text-red-900 dark:text-red-300 mb-2">4️⃣ Desativando a IA</h3>
            <p class="text-red-800 dark:text-red-200 mb-2">
              Se você quiser <strong>parar completamente o funcionamento da IA em uma conversa específica</strong>, clique em <strong>"Desativar IA"</strong>.
            </p>
            <p class="text-red-800 dark:text-red-200 mb-2"><strong>Quando desativada:</strong></p>
            <ul class="list-disc list-inside space-y-1 ml-4 text-red-800 dark:text-red-200">
              <li>O status ficará como <strong>IA Desativada Permanentemente</strong>.</li>
              <li>Nenhuma mensagem automática será enviada.</li>
              <li>O botão ficará bloqueado.</li>
            </ul>
            <p class="text-red-800 dark:text-red-200 mt-2"><strong>Para reativar:</strong></p>
            <ul class="list-disc list-inside space-y-1 ml-4 text-red-800 dark:text-red-200">
              <li>Clique no <strong>ícone de "X"</strong> ao lado do status.</li>
              <li>O status voltará para <strong>IA Ativa</strong>, e a IA retomará o atendimento normalmente.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como ajustar o tempo de pausa e delay</h2>
          <p class="mb-3">
            Essas configurações ficam em:<br>
            👉 <strong>Agente de IA → Parâmetros do Agente</strong>
          </p>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Parâmetro</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Função</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Recomendação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⏱️ <strong>Tempo de Delay</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Tempo que a IA aguarda entre a mensagem do cliente e a resposta</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">20 segundos (ideal)</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⏸️ <strong>Tempo de Inatividade</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Tempo que a IA fica pausada antes de ser reativada automaticamente</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Nunca reativar" (recomendado) ou um valor em minutos (10, 30, 60...)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Por que o Delay é importante</h2>
          <p class="mb-3">
            O <strong>Delay</strong> deixa a resposta da IA mais natural e humanizada.
            Com 20 segundos, a IA tem tempo para <strong>interpretar todas as mensagens enviadas pelo cliente</strong> antes de responder — evitando respostas curtas e fragmentadas.
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>📉 Se o delay for muito curto (ex: 5 segundos), a IA se comportará como um chatbot comum, respondendo cada mensagem separadamente.</li>
            <li>📈 Se for muito longo (ex: 30–40 segundos), é útil em casos como atendimentos BPC/LOAS, onde o cliente demora mais para digitar.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Exemplo prático</h2>
          <blockquote class="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4">
            Um cliente envia duas mensagens seguidas:<br>
            <em>"Oi, tudo bem?"</em><br>
            <em>"Quero saber sobre o contrato."</em>
            <br><br>
            Com delay de <strong>20 segundos</strong>, a IA espera o cliente terminar e responde de forma completa e contextual:<br>
            <em>"Olá! Tudo bem, sim. Sobre o contrato, posso te explicar agora."</em>
            <br><br>
            Se o delay fosse de 5 segundos, ela responderia duas vezes — parecendo robótica.
          </blockquote>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚠️ Boas práticas</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>🔹 Use <strong>Pausar IA</strong> sempre que um atendente humano assumir a conversa.</li>
            <li>🔹 Evite reativar a IA em leads que já foram encerrados.</li>
            <li>🔹 Não reduza o <strong>delay</strong> para menos de 10 segundos.</li>
            <li>🔹 Sempre clique em <strong>Salvar</strong> após alterar os parâmetros do agente.</li>
            <li>🔹 Monitore os status das conversas (Ativa, Pausada, Desativada) para garantir consistência no atendimento.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Ação</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">O que faz</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Duração</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🚀 <strong>Push (ativar)</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Dispara manualmente uma nova resposta da IA</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">1 minuto de cooldown</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⏸️ <strong>Pausar IA</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Interrompe o atendimento temporariamente</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Conforme configurado</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔴 <strong>Desativar IA</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Desliga a IA permanentemente na conversa</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Até ser reativada</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">❌ <strong>Reativar IA</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Retoma o atendimento automático</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Imediata</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⏱️ <strong>Delay (Parâmetros)</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Ajusta o tempo de resposta da IA</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Recomendado: 20 segundos</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Conclusão</h2>
          <p class="mb-3">
            O <strong>Controle de IA</strong> dá autonomia total para que você decida <strong>quando a IA fala e quando ela escuta</strong>.
            Com ele, o atendimento se torna mais natural, estratégico e alinhado à realidade de cada cliente.
          </p>
          <p>
            Use o <strong>Push</strong> para reengajar leads, <strong>Pause</strong> para atendimentos humanos e <strong>Desative</strong> quando a conversa for encerrada — mantendo o equilíbrio perfeito entre automação e personalização.
          </p>
        </section>
      </div>
    `
};
