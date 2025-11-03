import { Article } from './types';

export const artigo6: Article = {
  id: 'artigo-6',
  title: 'Configurando Notificações Automáticas no WhatsApp',
  description: 'Configure alertas automáticos no WhatsApp para receber notificações sobre eventos importantes dos seus leads.',
  category: 'artigos',
  readTime: '5 min',
  tags: ['IA', 'Notificações', 'WhatsApp', 'Automação'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que são as Notificações da IA</h2>
          <p class="mb-3">
            A função de <strong>Notificações no WhatsApp</strong> da Guimoo permite que você e sua equipe recebam <strong>alertas automáticos</strong> diretamente no WhatsApp sempre que algo importante acontecer com os seus leads — como uma reunião agendada, um contrato assinado ou um lead qualificado.
          </p>
          <p class="mb-3">
            Com isso, você se mantém informado <strong>sem precisar abrir o sistema o tempo todo</strong>, tornando o acompanhamento muito mais ágil.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔔 Principais situações que podem gerar notificações</h2>
          <p class="mb-3">Você pode configurar até <strong>5 notificações personalizadas</strong>. As mais usadas (e recomendadas) são:</p>
          <ul class="list-decimal list-inside space-y-2 ml-4">
            <li>🗓️ <strong>Reunião Agendada</strong></li>
            <li>🧭 <strong>Lead Qualificado</strong></li>
            <li>🚫 <strong>Lead Desqualificado</strong></li>
            <li>📤 <strong>Contrato Enviado</strong></li>
            <li>📝 <strong>Contrato Assinado</strong></li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Onde encontrar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Acesse o painel da <strong>Guimoo</strong>.</li>
            <li>Vá até <strong>Agente de IA → Notificações WhatsApp</strong>.</li>
            <li>Clique em <strong>Criar Nova Notificação</strong>.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como configurar passo a passo</h2>

          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🧩 1. Criar uma nova notificação</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Clique em <strong>"Criar Nova Notificação"</strong>.</li>
                <li>Uma notificação em branco será criada.</li>
                <li>Clique no <strong>ícone de engrenagem ⚙️</strong> para abrir as configurações.</li>
              </ul>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">💬 2. Configurar a mensagem</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Na aba de <strong>Mensagem</strong>, digite o texto que será enviado via WhatsApp.</li>
                <li>Você pode usar <strong>tags dinâmicas</strong> para personalizar o conteúdo:
                  <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">{nome}</code> → nome do cliente</li>
                    <li><code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">{telefone}</code> → telefone do cliente</li>
                    <li><code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">{resumo}</code> → breve resumo da negociação</li>
                  </ul>
                </li>
              </ul>
              <div class="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg mt-3">
                <p class="font-semibold mb-2">Exemplo de mensagem:</p>
                <p class="text-sm italic">
                  🗓️ <em>Reunião Agendada!</em><br/>
                  O cliente <strong>{nome}</strong> (WhatsApp: {telefone}) agendou uma reunião.<br/>
                  Resumo: {resumo}
                </p>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-3">
                <p class="text-sm">💡 <strong>Dica:</strong> lembre-se de clicar em <strong>Salvar mensagem</strong> antes de sair da aba — se não salvar, o texto será perdido.</p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🤖 3. Definir quando a IA dispara a notificação</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Vá até a aba <strong>IA</strong>.</li>
                <li>No campo de instrução, descreva <strong>em qual situação a notificação deve ser enviada</strong>.</li>
                <li>Exemplo de prompt:</li>
              </ul>
              <div class="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg mt-3 italic text-sm">
                "Dispare esta função quando a reunião com o cliente estiver confirmada em data e horário definidos."
              </div>
              <p class="mt-3">Clique em <strong>Salvar</strong>.</p>
              <p class="mt-3">🧠 Assim, toda vez que uma reunião for confirmada no sistema, a IA automaticamente enviará a notificação para os números configurados.</p>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">👥 4. Escolher os destinatários</h3>
              <p class="mb-3">Na aba <strong>Destinatários</strong>, você define <strong>quem vai receber</strong> a mensagem no WhatsApp. Você pode adicionar até <strong>10 pessoas</strong> por notificação.</p>
              <p class="mb-2">Há três formas de definir o destinatário:</p>

              <div class="space-y-3 ml-4">
                <div class="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p class="font-semibold mb-2">1. Número específico:</p>
                  <ul class="list-disc list-inside space-y-1 ml-2 text-sm">
                    <li>Digite o número completo com código do país e DDD.</li>
                    <li>Exemplo: <code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">55 62 98631-0640</code></li>
                    <li>Clique em <strong>Adicionar destinatário</strong>.</li>
                  </ul>
                </div>

                <div class="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p class="font-semibold mb-2">2. Usuário do sistema:</p>
                  <ul class="list-disc list-inside space-y-1 ml-2 text-sm">
                    <li>Selecione um usuário cadastrado (por exemplo, atendente, advogado, gestor).</li>
                  </ul>
                </div>

                <div class="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p class="font-semibold mb-2">3. Responsável pela negociação:</p>
                  <ul class="list-disc list-inside space-y-1 ml-2 text-sm">
                    <li>Ative a opção <strong>"Responsável atual pela negociação"</strong>.</li>
                    <li>Assim, a notificação será enviada automaticamente para quem estiver atribuído ao lead no momento.</li>
                  </ul>
                </div>
              </div>

              <p class="mt-3">✅ Você pode incluir várias pessoas, combinando métodos (exemplo: 1 usuário + 2 números externos).</p>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🧾 5. Gerenciar e editar notificações</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Todas as notificações criadas aparecerão listadas na tela.</li>
                <li>Você pode <strong>editar, duplicar ou excluir</strong> a qualquer momento.</li>
                <li>Também é possível:
                  <ul class="list-disc list-inside ml-6 mt-2">
                    <li>Alterar o texto da mensagem</li>
                    <li>Adicionar ou remover destinatários</li>
                    <li>Ajustar o gatilho da IA</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Dica de Configuração Ideal (recomendada)</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Tipo de Notificação</th>
                  <th class="text-left py-2 font-bold">Mensagem Recomendada</th>
                  <th class="text-left py-2 font-bold">Gatilho de Envio</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">Reunião Agendada</td>
                  <td class="py-2">"O cliente {nome} agendou uma reunião para {resumo}."</td>
                  <td class="py-2">Quando a reunião estiver confirmada com data e hora</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">Lead Qualificado</td>
                  <td class="py-2">"Novo lead qualificado: {nome} – {telefone}."</td>
                  <td class="py-2">Quando a IA marcar o lead como qualificado</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">Lead Desqualificado</td>
                  <td class="py-2">"Lead {nome} foi desqualificado."</td>
                  <td class="py-2">Quando a IA definir o lead como desqualificado</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">Contrato Enviado</td>
                  <td class="py-2">"Contrato enviado para {nome}."</td>
                  <td class="py-2">Quando o contrato for enviado ao cliente</td>
                </tr>
                <tr>
                  <td class="py-2">Contrato Assinado</td>
                  <td class="py-2">"Contrato assinado por {nome}!"</td>
                  <td class="py-2">Quando o contrato for marcado como assinado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Exemplo prático</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <p>Imagine que sua equipe configurou a notificação de <strong>Reunião Agendada</strong>.</p>
            <p>Quando a IA confirmar uma reunião no sistema:</p>
            <ul class="list-disc list-inside ml-4 space-y-2">
              <li>Você e seu time jurídico recebem no WhatsApp:</li>
            </ul>
            <div class="bg-white dark:bg-neutral-700 p-3 rounded-lg border-l-4 border-green-500 mt-2 italic text-sm">
              "🗓️ O cliente João Pereira (62 99999-9999) agendou uma reunião para amanhã às 15h."
            </div>
            <p>Tudo isso de forma <strong>automática</strong>, sem precisar abrir o painel Guimoo.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚠️ Atenção</h2>
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500 space-y-3">
            <p>📊 Você pode ter <strong>até 5 notificações ativas simultaneamente</strong>.</p>
            <p>💾 Lembre-se de <strong>salvar</strong> cada aba (Mensagem, IA e Destinatários) antes de sair da tela.</p>
            <p>📱 As notificações são enviadas <strong>pelo mesmo número de WhatsApp conectado à sua conta Guimoo</strong>.</p>
            <p>⚠️ Caso o WhatsApp desconecte, as notificações <strong>não serão entregues</strong> até a reconexão.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Etapa</th>
                  <th class="text-left py-2 font-bold">O que fazer</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">1️⃣</td>
                  <td class="py-2">Criar nova notificação</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">2️⃣</td>
                  <td class="py-2">Escrever a mensagem (usar tags dinâmicas)</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">3️⃣</td>
                  <td class="py-2">Definir o momento em que a IA dispara</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">4️⃣</td>
                  <td class="py-2">Escolher os destinatários</td>
                </tr>
                <tr>
                  <td class="py-2">5️⃣</td>
                  <td class="py-2">Salvar e testar</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Benefício</h2>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
            <p>
              Com o sistema de notificações ativas, você e sua equipe recebem <strong>alertas instantâneos no WhatsApp</strong> — garantindo que ninguém perca uma reunião, contrato ou lead importante, mesmo fora do sistema.
            </p>
          </div>
        </section>
      </div>
    `
};
