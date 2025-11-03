import { Article } from './types';

export const artigo4: Article = {
  id: 'artigo-4',
  title: 'Configurando o Google Agenda na Guimoo (Método Rápido)',
  description: 'Aprenda a integrar sua conta Google pessoal ou corporativa com a Guimoo de forma rápida e prática.',
  category: 'artigos',
  readTime: '4 min',
  tags: ['Integração', 'Google Agenda', 'Rápido', 'Automação'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é a Integração com o Google Agenda</h2>
          <p class="mb-3">
            A integração do <strong>Google Agenda com a Guimoo</strong> permite que a <strong>IA crie agendamentos automaticamente</strong> direto na sua agenda do Google, mantendo tudo organizado — datas, horários e até links de reunião.
          </p>
          <p class="mb-3">
            Após configurada, sempre que a IA marcar um compromisso pelo WhatsApp, ele aparecerá automaticamente na agenda que você escolher.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ O que você vai precisar</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Uma conta <strong>Google</strong> (pode ser pessoal ou corporativa).</li>
            <li>Acesso à sua <strong>agenda no Google Calendar</strong>.</li>
            <li>O e-mail de integração da Guimoo: <code class="bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">agendamentocomia@gmail.com</code></li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Passo a passo completo</h2>

          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🖥️ 1. Acesse o Google Agenda</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Vá até <a href="https://calendar.google.com" target="_blank" class="text-blue-600 dark:text-blue-400 underline">https://calendar.google.com</a>.</li>
                <li>Verifique se está logado com a <strong>conta do escritório</strong> que será usada para os agendamentos.</li>
              </ol>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📘 2. Crie (ou escolha) a agenda que será usada</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>No lado esquerdo da tela, localize a seção <strong>Minhas agendas</strong>.</li>
                <li>Se quiser criar uma nova, clique em <strong>"+ Criar nova agenda"</strong>.
                  <ul class="list-disc list-inside ml-6 mt-2">
                    <li>Exemplo de nome: <em>Reuniões de Peticionamento</em></li>
                  </ul>
                </li>
                <li>Clique em <strong>Criar agenda</strong> e aguarde a confirmação.</li>
              </ol>
              <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-3">
                <p class="text-sm">💡 <strong>Dica:</strong> você pode usar uma agenda separada só para os agendamentos automáticos da IA — isso facilita o controle e evita confusão com eventos pessoais.</p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">⚙️ 3. Compartilhe a agenda com a Guimoo</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Em <strong>Minhas agendas</strong>, passe o mouse sobre a agenda criada.</li>
                <li>Clique nos <strong>três pontinhos (⋮)</strong> → selecione <strong>Configurações e compartilhamento</strong>.</li>
                <li>Role até a seção <strong>Compartilhado com pessoas específicas</strong>.</li>
                <li>Clique em <strong>Adicionar participante</strong>.</li>
                <li>No campo de e-mail, digite: <code class="bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">agendamentocomia@gmail.com</code></li>
                <li>Em <strong>Permissões</strong>, selecione <strong>Fazer alterações nos eventos</strong>.</li>
                <li>Clique em <strong>Enviar</strong>.</li>
              </ol>
              <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-500 mt-3">
                <p class="text-sm">📌 <strong>Importante:</strong> essa permissão permite que a IA crie, altere ou cancele eventos diretamente na sua agenda.</p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🧾 4. Copie o ID da agenda</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Role a tela até a seção <strong>Agenda integrada</strong>.</li>
                <li>Encontre o campo <strong>ID da agenda</strong>.
                  <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Pode ser um endereço de e-mail (ex: <code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">seudominio@gmail.com</code>)</li>
                    <li>Ou um código alfanumérico (no caso de agendas personalizadas).</li>
                  </ul>
                </li>
                <li>Copie o valor completo.</li>
              </ol>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">💻 5. Configure dentro do sistema Guimoo</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Acesse sua conta em <a href="https://app.guimoo.com.br" target="_blank" class="text-blue-600 dark:text-blue-400 underline">app.guimoo.com.br</a>.</li>
                <li>Vá até <strong>Configurações → Integrações → Google Agenda</strong>.</li>
                <li>No campo <strong>ID da Agenda</strong>, cole o código copiado do Google Calendar.</li>
                <li>Clique em <strong>Salvar</strong>.</li>
              </ol>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🧠 6. Teste a integração</h3>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>No WhatsApp vinculado à sua IA, envie uma mensagem de teste.</li>
                <li>Peça algo como "Quero agendar uma reunião".</li>
                <li>A IA irá verificar os horários disponíveis e criar automaticamente o evento no Google Agenda.</li>
              </ol>
              <p class="mt-3 text-sm">✅ O evento aparecerá com o título, o horário definido e, caso ativado, o link de videoconferência.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Dicas e observações</h2>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500 space-y-3">
            <p>🔄 Após compartilhar a agenda, pode levar <strong>alguns minutos</strong> até o Google processar a permissão.</p>
            <p>🔐 Certifique-se de que o e-mail <code class="bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">agendamentocomia@gmail.com</code> tem acesso de edição — sem isso, a IA não conseguirá salvar eventos.</p>
            <p>🗓️ Se quiser usar outra agenda no futuro, basta repetir o processo e trocar o <strong>ID</strong> dentro da Guimoo.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Checklist Final</h2>
          <p class="mb-3">Antes de sair, confirme se:</p>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-2">
            <div class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400">☐</span>
              <p class="text-sm">A agenda está criada e visível em <em>Minhas Agendas</em>.</p>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400">☐</span>
              <p class="text-sm">O e-mail <code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">agendamentocomia@gmail.com</code> foi adicionado com permissão de <strong>edição</strong>.</p>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400">☐</span>
              <p class="text-sm">O ID da agenda foi colado corretamente no campo <strong>ID da Agenda</strong> da Guimoo.</p>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400">☐</span>
              <p class="text-sm">O botão <strong>Salvar</strong> foi clicado.</p>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400">☐</span>
              <p class="text-sm">O evento de teste foi criado com sucesso no Google Calendar.</p>
            </div>
          </div>
        </section>
      </div>
    `
};
