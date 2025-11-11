import { Article } from './types';

export const artigo13: Article = {
  id: 'artigo-13',
  title: 'Exportando Leads do CRM da Guimoo',
  description: 'Aprenda a exportar leads do CRM em formato de planilha para relatórios, backups e análise de resultados do funil.',
  category: 'artigos',
  readTime: '3 min',
  tags: ['CRM', 'Exportação', 'Leads', 'Relatórios'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é a função de Exportar Leads</h2>
          <p class="mb-3">
            A função <strong>Exportar Leads</strong> permite que você baixe uma <strong>planilha com todos os contatos e negociações</strong> do seu CRM Guimoo.
            Com ela, você pode gerar relatórios, fazer backups ou analisar resultados do funil de vendas com apenas alguns cliques.
          </p>
          <p class="mb-3">
            Agora, essa função está disponível <strong>tanto no modo Lista quanto no modo Kanban</strong>.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Onde encontrar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Acesse o menu <strong>CRM</strong>.</li>
            <li>Escolha a visualização desejada:
              <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>🗂️ <strong>Lista:</strong> modo detalhado de leads em formato de tabela.</li>
                <li>📊 <strong>Kanban:</strong> modo visual em colunas (por etapas do funil).</li>
              </ul>
            </li>
            <li>Clique no botão <strong>"Exportar"</strong> no canto superior direito da tela.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como exportar leads</h2>

          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">1️⃣ Selecionar os leads</h3>
              <p class="mb-3">
                Ao clicar em <strong>"Exportar"</strong>, será aberta uma janela com todas as etapas do seu funil.
              </p>
              <p class="mb-2">Você pode escolher o que deseja exportar:</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li><strong>Selecionar todas:</strong> exporta todos os leads de todas as etapas.</li>
                <li><strong>Desmarcar todas:</strong> limpa a seleção.</li>
                <li>Ou selecione manualmente apenas as etapas que quiser (ex: <em>Contrato assinado</em>, <em>Oferta do contrato</em>).</li>
              </ul>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">2️⃣ Gerar o arquivo</h3>
              <p class="mb-2">Depois de selecionar as etapas desejadas:</p>
              <ol class="list-decimal list-inside space-y-2 ml-4">
                <li>Clique no botão <strong>"Exportar"</strong> (azul).</li>
                <li>O sistema fará o download automático de uma planilha <code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">.CSV</code> ou <code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">.XLSX</code>.</li>
                <li>Escolha onde salvar o arquivo no seu computador.</li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📄 O que vem na planilha exportada</h2>
          <p class="mb-3">O arquivo contém as principais informações dos leads:</p>

          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Campo</th>
                  <th class="text-left py-2 font-bold">Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🧍 Nome</td>
                  <td class="py-2">Nome do cliente/lead</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">📞 Telefone</td>
                  <td class="py-2">Número de contato</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🗂️ Etapa do funil</td>
                  <td class="py-2">Em qual etapa o lead está</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🧩 Funil</td>
                  <td class="py-2">Nome do funil (ex: Trabalhista, BPC, etc.)</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">📅 Data de criação</td>
                  <td class="py-2">Quando o lead foi inserido</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🧑‍💼 Responsável</td>
                  <td class="py-2">Usuário vinculado ao lead</td>
                </tr>
                <tr>
                  <td class="py-2">📝 Observações</td>
                  <td class="py-2">Notas adicionadas ao cartão</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-3">
            <p class="text-sm">💡 <em>Campos personalizados também serão incluídos automaticamente, conforme suas configurações do CRM.</em></p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Exemplo prático</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <blockquote class="italic text-gray-800 dark:text-neutral-200 border-l-4 border-purple-600 pl-4">
              Você quer exportar apenas os leads de "Contrato Assinado".
            </blockquote>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li>Acesse <strong>CRM → Kanban → Exportar</strong>.</li>
              <li>Marque apenas a opção <strong>"Contrato Assinado"</strong>.</li>
              <li>Clique em <strong>Exportar</strong>.</li>
            </ul>
            <p class="mt-2 font-semibold">
              ✅ O sistema gerará uma planilha com todos os leads dessa etapa, incluindo nome, telefone, data, responsável e status.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Etapa</th>
                  <th class="text-left py-2 font-bold">Ação</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">1️⃣</td>
                  <td class="py-2">Acesse <strong>CRM → Kanban</strong> ou <strong>Lista</strong></td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">2️⃣</td>
                  <td class="py-2">Clique em <strong>Exportar</strong></td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">3️⃣</td>
                  <td class="py-2">Escolha as etapas do funil</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">4️⃣</td>
                  <td class="py-2">Clique em <strong>Exportar (azul)</strong></td>
                </tr>
                <tr>
                  <td class="py-2">5️⃣</td>
                  <td class="py-2">Baixe a planilha com os leads selecionados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Dicas de uso</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>💾 Faça exportações regulares como <strong>backup de segurança</strong>.</li>
            <li>📊 Use os dados exportados para <strong>análises de conversão</strong> por etapa do funil.</li>
            <li>🧩 Combine com relatórios da IA e métricas de automação para medir desempenho.</li>
            <li>🔎 Se precisar apenas de uma etapa, filtre antes de exportar — o sistema respeitará o filtro aplicado.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Conclusão</h2>
          <p class="mb-3">
            Com o novo botão <strong>Exportar</strong> no <strong>modo Kanban</strong>, ficou ainda mais fácil <strong>baixar leads diretamente de qualquer etapa do funil</strong>.
            Agora, você pode gerar relatórios personalizados com agilidade, sem precisar mudar de visualização.
          </p>
        </section>
      </div>
    `
};
