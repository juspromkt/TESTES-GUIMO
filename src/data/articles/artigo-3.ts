import { Article } from './types';

export const artigo3: Article = {
  id: 'artigo-3',
  title: 'Como Configurar o Google Agenda com a Guimoo (Workspace)',
  description: 'Aprenda a integrar o Google Agenda corporativo com a Guimoo para permitir agendamentos automáticos pela IA.',
  category: 'artigos',
  readTime: '6 min',
  tags: ['Integração', 'Google Agenda', 'Workspace', 'Automação'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é a Integração com o Google Agenda</h2>
          <p class="mb-3">
            A integração do <strong>Google Agenda com a Guimoo</strong> permite que sua <strong>IA agende reuniões automaticamente</strong> com seus clientes, de forma totalmente sincronizada com o calendário do seu escritório.
          </p>
          <p class="mb-3">
            Com essa configuração, quando a IA agenda um horário pelo WhatsApp, o evento aparece diretamente na sua agenda do Google, com link de reunião do <strong>Google Meet</strong> e todas as informações do atendimento.
          </p>
          <p class="italic bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            Essa função é <strong>essencial para automatizar agendamentos e evitar conflitos de horário</strong>.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Pré-requisitos</h2>
          <p class="mb-3">Antes de começar, você precisa:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Ter uma conta <strong>Google Workspace (corporativa)</strong>.</li>
            <li>Acesso ao <strong>Admin Console</strong> do seu domínio.</li>
            <li>Ter criado ou saber qual é a <strong>agenda que será usada para os agendamentos automáticos</strong>.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como configurar passo a passo</h2>

          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🧩 1. Acesse o painel de administração do Google Workspace</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Acesse <a href="https://admin.google.com" target="_blank" class="text-blue-600 dark:text-blue-400 underline">https://admin.google.com</a>.</li>
                <li>Clique em <strong>Admin Console</strong>.</li>
                <li>No campo de pesquisa superior, digite <strong>Agenda</strong> ou <strong>Calendário</strong>.</li>
                <li>Selecione <strong>Configurações do Agenda</strong>.</li>
              </ol>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">⚙️ 2. Ajuste as permissões de compartilhamento</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Clique em <strong>Configurações de compartilhamento</strong>.</li>
                <li>Em <strong>Opções de compartilhamento externo para agendas principais</strong>, marque:
                  <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>✅ <em>Compartilhar todas as informações.</em></li>
                    <li>✅ <em>Permitir o gerenciamento de agendas.</em></li>
                  </ul>
                </li>
                <li>Clique em <strong>Salvar</strong>.</li>
                <li>Em <strong>Opções de compartilhamento interno</strong>, marque também:
                  <ul class="list-disc list-inside ml-6 mt-2">
                    <li>✅ <em>Compartilhar todas as informações.</em></li>
                  </ul>
                </li>
                <li>Certifique-se de que <strong>videoconferência</strong> está <strong>ativada</strong> e que a opção <strong>"Definir Google Meet como provedor de reunião"</strong> está marcada.</li>
                <li>Em <strong>Convites externos</strong>, mantenha <strong>ativado</strong>.</li>
                <li>Clique novamente em <strong>Salvar</strong> e aguarde a confirmação.</li>
              </ol>
              <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-500 mt-3">
                <p class="text-sm">💡 <strong>Observação:</strong> pode levar <strong>de 10 a 15 minutos</strong> para que essas configurações sejam aplicadas totalmente em todas as agendas do seu domínio.</p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🗓️ 3. Crie ou selecione sua agenda</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Volte para o <a href="https://calendar.google.com" target="_blank" class="text-blue-600 dark:text-blue-400 underline">Google Agenda</a>.</li>
                <li>Em <strong>Minhas agendas</strong>, crie uma nova (exemplo: "Reuniões de Peticionamento") ou use uma existente.</li>
                <li>Clique nos <strong>três pontinhos (⋮)</strong> ao lado da agenda e selecione <strong>Configurações</strong>.</li>
              </ol>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🔗 4. Compartilhe com a Guimoo</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Role até a seção <strong>Compartilhado com pessoas específicas</strong>.</li>
                <li>Clique em <strong>Adicionar participante</strong>.</li>
                <li>Insira o e-mail: <code class="bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">agendamentocomia@gmail.com</code></li>
                <li>Em <strong>Permissões</strong>, selecione <strong>Fazer alterações nos eventos</strong>.</li>
                <li>Clique em <strong>Enviar</strong>.</li>
              </ol>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🧾 5. Copie o ID da agenda</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Ainda nas configurações da agenda, role até o final até encontrar <strong>Agenda integrada</strong>.</li>
                <li>Localize o campo <strong>ID da agenda</strong> — pode ser um e-mail ou um código alfanumérico.</li>
                <li>Copie esse ID.</li>
              </ol>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">💻 6. Cole o ID no sistema Guimoo</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Acesse sua conta Guimoo.</li>
                <li>Vá até <strong>Configurações → Integrações → Google Agenda</strong>.</li>
                <li>No campo <strong>ID da Agenda</strong>, cole o valor copiado.</li>
                <li>Clique em <strong>Salvar</strong>.</li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Teste o funcionamento</h2>
          <p class="mb-3">Após salvar:</p>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Envie uma mensagem para o seu número conectado à IA.</li>
            <li>Solicite um agendamento.</li>
            <li>Em poucos segundos, a IA verificará os horários disponíveis e criará o evento automaticamente no <strong>Google Agenda</strong> — com link de Google Meet incluso.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Dicas importantes</h2>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500 space-y-3">
            <p>⏱️ Após configurar, <strong>aguarde cerca de 10 a 15 minutos</strong> para que o Google aplique as permissões.</p>
            <p>🔐 O e-mail <code class="bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">agendamentocomia@gmail.com</code> precisa ter acesso de <strong>edição</strong>; sem isso, a IA não conseguirá criar eventos.</p>
            <p>📅 Você pode usar <strong>várias agendas diferentes</strong>, basta inserir o ID correto para cada agente.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Resumo rápido</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Etapa</th>
                  <th class="text-left py-2 font-bold">Ação</th>
                </tr>
              </thead>
              <tbody class="space-y-2">
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">1</td>
                  <td class="py-2">Acesse o Admin Console do Workspace</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">2</td>
                  <td class="py-2">Ative o compartilhamento externo e interno</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">3</td>
                  <td class="py-2">Crie ou selecione uma agenda</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">4</td>
                  <td class="py-2">Compartilhe com agendamentocomia@gmail.com</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">5</td>
                  <td class="py-2">Copie o ID da agenda</td>
                </tr>
                <tr>
                  <td class="py-2">6</td>
                  <td class="py-2">Cole o ID no sistema Guimoo e salve</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    `
};
