import { Article } from './types';

export const artigo10: Article = {
  id: 'artigo-10',
  title: 'Sistema de Workspaces da Guimoo',
  description: 'Gerencie várias contas e ambientes independentes com um único login, ideal para escritórios com múltiplas áreas de atuação.',
  category: 'artigos',
  readTime: '4 min',
  tags: ['Workspaces', 'Organização', 'Multi-conta', 'Gestão'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é o Sistema de Workspaces</h2>
          <p class="mb-3">
            O <strong>sistema de Workspaces</strong> da Guimoo permite que você <strong>tenha várias contas conectadas em um único login</strong>, sem precisar lembrar ou alternar entre várias senhas.
          </p>
          <p class="mb-3">
            Cada workspace funciona como um <strong>sistema independente</strong>, com suas próprias configurações, agentes, conversas, funis, CRM e atendimentos — mas todos <strong>vinculados ao mesmo usuário principal</strong>.
          </p>
          <p class="mt-3">
            👉 Isso é ideal para escritórios que atuam em <strong>mais de uma área jurídica</strong> ou <strong>gerenciam equipes e operações separadas</strong> dentro da mesma empresa.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como acessar seus Workspaces</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>No painel principal da <strong>Guimoo</strong>, clique no menu <strong>Workspace</strong> (no topo ou na lateral da tela).</li>
            <li>Será exibida uma lista com <strong>todos os workspaces vinculados à sua conta</strong>.</li>
            <li>Clique sobre o workspace que deseja acessar.</li>
            <li>O sistema será recarregado automaticamente, abrindo o ambiente selecionado.</li>
          </ol>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-3">
            <p class="text-sm">💡 <em>Para voltar ao workspace anterior, basta clicar novamente em "Workspace" e escolher outro da lista.</em></p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Como o sistema funciona</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Cada workspace é <strong>um ambiente separado</strong>, com banco de dados e IA independentes.</li>
            <li>Você pode configurar <strong>um agente diferente em cada workspace</strong>, adaptando o atendimento a cada área ou tipo de cliente.</li>
            <li>É possível alternar entre eles de forma <strong>instantânea</strong>, sem precisar sair da sua conta.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💼 Exemplos de uso</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Situação</th>
                  <th class="text-left py-2 font-bold">Como aplicar o Workspace</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">⚖️ Escritório com várias áreas</td>
                  <td class="py-2">Criar um workspace para <strong>Trabalhista</strong> e outro para <strong>BPC/LOAS</strong></td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🧾 Setores separados</td>
                  <td class="py-2">Um workspace para <strong>Atendimento de Novos Leads</strong> e outro para <strong>Clientes Ativos</strong></td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🧠 Estratégias diferentes</td>
                  <td class="py-2">Um workspace apenas para <strong>Coleta de Documentos</strong> e outro para <strong>Acompanhamento Jurídico</strong></td>
                </tr>
                <tr>
                  <td class="py-2">🧍 Equipes distintas</td>
                  <td class="py-2">Cada equipe (ex: comercial, jurídico, suporte) com seu próprio ambiente e agente personalizado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💰 Quanto custa um Workspace adicional</h2>
          <p class="mb-3">
            O valor de um <strong>workspace adicional</strong> corresponde a <strong>30% do valor da mensalidade principal</strong>.
          </p>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
            <ul class="space-y-2">
              <li>💵 <strong>Mensalidade atual:</strong> R$ 795,00/mês</li>
              <li>💼 <strong>Workspace adicional:</strong> R$ 238,50/mês</li>
            </ul>
          </div>
          <p class="mt-3 mb-2">Cada workspace adicional dá direito a:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>1 agente de IA independente</li>
            <li>Configurações exclusivas de CRM, funis e atendimento</li>
            <li>Relatórios e métricas separados</li>
            <li>Login unificado</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Por que usar vários Workspaces</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Facilita a <strong>organização por área jurídica ou tipo de atendimento</strong></li>
            <li>Permite testar <strong>estratégias de IA diferentes</strong> sem interferir nas demais</li>
            <li>Melhora a <strong>gestão de equipes</strong> — cada time pode ter seu próprio ambiente</li>
            <li>Mantém os <strong>dados e históricos de leads separados</strong>, evitando confusão entre áreas</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como contratar um novo Workspace</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Acesse o menu <strong>Suporte</strong> dentro da sua conta Guimoo.</li>
            <li>Solicite a criação de um novo workspace, informando:
              <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Nome desejado para o workspace</li>
                <li>Área ou função que será utilizada</li>
              </ul>
            </li>
            <li>O time de suporte fará a ativação e enviará a confirmação.</li>
          </ol>
          <p class="mt-3">
            Após a ativação, o novo workspace aparecerá automaticamente na sua lista.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Função</th>
                  <th class="text-left py-2 font-bold">Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🔗 Login único</td>
                  <td class="py-2">Acesse todos os sistemas com o mesmo e-mail e senha</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🧭 Ambientes independentes</td>
                  <td class="py-2">Cada workspace tem sua própria IA e CRM</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">⚙️ Alternância fácil</td>
                  <td class="py-2">Mude de workspace com um clique</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">💰 Custo adicional</td>
                  <td class="py-2">30% do valor da mensalidade principal</td>
                </tr>
                <tr>
                  <td class="py-2">💬 Contratação</td>
                  <td class="py-2">Solicite via suporte Guimoo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Exemplo prático</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <blockquote class="italic text-gray-800 dark:text-neutral-200 border-l-4 border-purple-600 pl-4">
              O escritório "Souza & Lima" atua com Trabalhista e BPC/LOAS.<br/>
              Eles criam dois workspaces:
            </blockquote>
            <ul class="list-disc list-inside ml-4 space-y-2">
              <li><strong>Workspace 1:</strong> Trabalhista (IA especializada em rescisão e indenizações)</li>
              <li><strong>Workspace 2:</strong> BPC/LOAS (IA com foco em benefícios sociais)</li>
            </ul>
            <p class="mt-2">
              Ambos são acessados com o mesmo login e senha, mas têm fluxos e agentes totalmente diferentes — simplificando o gerenciamento e a performance de cada operação.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Conclusão</h2>
          <p class="mb-3">
            O <strong>Sistema de Workspaces</strong> é a solução perfeita para escritórios e empresas que desejam <strong>dividir operações, equipes e áreas de atendimento sem perder a centralização</strong>.
            Com ele, você tem <strong>autonomia, flexibilidade e escala</strong>, mantendo tudo organizado sob um único acesso.
          </p>
        </section>
      </div>
    `
};
