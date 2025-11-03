import { Article } from './types';

export const artigo19: Article = {
  id: 'artigo-19',
  title: 'Envio em Massa na Guimoo',
  description: 'Aprenda a criar campanhas de envio em massa via WhatsApp, configurar modelos, importar listas e disparar mensagens automaticamente.',
  category: 'artigos',
  readTime: '7 min',
  tags: ['Envio em Massa', 'WhatsApp', 'Campanhas', 'Disparo', 'Automação'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é o Envio em Massa</h2>
          <p class="mb-3">
            A função <strong>Envio em Massa</strong> da Guimoo permite disparar mensagens automáticas via <strong>WhatsApp</strong> para uma lista de contatos, com controle total sobre o tempo entre envios, o modelo de mensagem e o tamanho da lista.
          </p>
          <p class="mb-3">
            É ideal para <strong>comunicações em lote</strong>, como:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Divulgação de serviços advocatícios</li>
            <li>Avisos sobre benefícios indeferidos</li>
            <li>Follow-ups de campanhas</li>
            <li>Chamadas para novos atendimentos</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como acessar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>No menu lateral esquerdo, clique em <strong>"Envio em Massa"</strong>.</li>
            <li>A tela exibirá três abas principais:
              <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><strong>Configurações de Envio</strong></li>
                <li><strong>Modelos de Mensagem</strong></li>
                <li><strong>Listas / Disparos</strong></li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Etapa 1 – Configurar o Envio</h2>
          <p class="mb-3">
            Essa é a parte onde você define a <strong>velocidade e volume dos disparos</strong>.
          </p>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Campo</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Descrição</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Recomendação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⏱️ <strong>Disparo entre mensagens</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Tempo de espera entre cada envio</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>45 segundos</strong> (ideal para chips aquecidos)</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📦 <strong>Número máximo de disparos</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Quantidade total de mensagens por campanha</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Coloque o <strong>tamanho total da sua lista</strong></td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💾 <strong>Salvar configurações</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Garante que o sistema use os novos parâmetros</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Clique sempre em <strong>Salvar</strong></td>
              </tr>
            </tbody>
          </table>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            💡 O tempo entre mensagens é essencial para evitar bloqueios do WhatsApp — nunca coloque abaixo de 15 segundos.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✉️ Etapa 2 – Criar Modelos de Mensagem</h2>
          <p class="mb-3">
            Os modelos são mensagens prontas que serão enviadas para sua lista.
          </p>

          <div class="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">Como criar:</h3>
            <ol class="list-decimal list-inside space-y-2 ml-4">
              <li>Vá até a aba <strong>"Modelo de Mensagem"</strong>.</li>
              <li>Clique em <strong>Criar Modelo</strong>.</li>
              <li>Dê um nome descritivo (ex: <code class="bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded">Indeferidos INSS Agosto</code>).</li>
              <li>Escreva o texto da mensagem, por exemplo:
                <div class="bg-white dark:bg-neutral-900 p-3 rounded-lg my-2 border border-gray-200 dark:border-neutral-700">
                  <code class="text-sm">
                    Olá, bom dia!<br>
                    Vi que seu benefício do INSS foi indeferido.<br>
                    Podemos te ajudar com isso. O que acha?
                  </code>
                </div>
              </li>
              <li>Clique em <strong>Criar</strong>.</li>
            </ol>
          </div>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            💡 Você pode cadastrar quantos modelos desejar — ideal para segmentar campanhas por tipo de cliente, benefício ou cidade.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📋 Etapa 3 – Criar a Lista de Disparo</h2>
          <p class="mb-3">
            Agora é hora de montar sua lista de contatos para envio.
          </p>

          <ol class="list-decimal list-inside space-y-2 ml-4 mb-4">
            <li>Vá até <strong>"Listas de Envio"</strong>.</li>
            <li>Clique em <strong>"Novo Disparo"</strong>.</li>
            <li>Dê um nome à lista (ex: <code class="bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded">Indeferidos INSS – Goiânia – Agosto</code>).</li>
            <li>Clique em <strong>Criar Disparo</strong>.</li>
            <li>A lista aparecerá com o total inicial "0 contatos".</li>
          </ol>

          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">🧾 Como importar contatos</h3>
          <p class="mb-3">
            Você pode adicionar contatos <strong>manualmente</strong> ou <strong>via planilha</strong>:
          </p>

          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-3">
            <h4 class="font-bold text-green-900 dark:text-green-300 mb-2">✅ Opção 1 – Manualmente</h4>
            <p class="text-green-800 dark:text-green-200 mb-2">
              Digite linha por linha no formato:
            </p>
            <div class="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-green-200 dark:border-green-800 font-mono text-sm">
              Nome, 55DDDNÚMERO
            </div>
            <p class="text-green-800 dark:text-green-200 mt-2 mb-1"><strong>Exemplo:</strong></p>
            <div class="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-green-200 dark:border-green-800 font-mono text-sm">
              Pedro Augusto, 5562986310640<br>
              João Silva, 5511999999999<br>
              Andreia Costa, 5562988888888
            </div>
            <p class="text-sm text-green-700 dark:text-green-300 mt-2">
              ⚠️ Não coloque espaços após a vírgula!
            </p>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h4 class="font-bold text-blue-900 dark:text-blue-300 mb-2">✅ Opção 2 – Via Planilha</h4>
            <ul class="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Prepare um arquivo CSV ou XLSX com as colunas <strong>Nome</strong> e <strong>Telefone</strong>.</li>
              <li>Importe o arquivo no campo indicado.</li>
              <li>A lista será carregada automaticamente na tela.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🚀 Etapa 4 – Iniciar o Disparo</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4 mb-3">
            <li>Após importar os contatos, clique em <strong>"Iniciar Disparo"</strong>.</li>
            <li>Selecione o <strong>modelo de mensagem</strong> que deseja enviar.</li>
            <li>Clique em <strong>"Iniciar Envio"</strong>.</li>
          </ol>

          <p class="mb-3">
            Durante o disparo, o sistema mostrará:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>📈 <strong>Tamanho total da lista</strong></li>
            <li>📤 <strong>Quantidade de mensagens já enviadas</strong></li>
            <li>⏸️ <strong>Opção de pausar ou parar o envio</strong></li>
            <li>🔁 <strong>Opção de reiniciar caso precise continuar depois</strong></li>
          </ul>

          <p class="mt-3 text-sm text-gray-600 dark:text-neutral-400">
            💡 Você pode interromper e retomar a campanha a qualquer momento.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Boas práticas</h2>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Situação</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Recomendação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📱 Chip novo</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Use intervalos de 45–60s para "aquecer" o número</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📊 Grandes listas</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Divida em blocos menores (máx. 2000 contatos por vez)</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔄 Repetição</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Evite reenviar a mesma mensagem para o mesmo lead</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🕐 Tempo ideal</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Envie entre 9h e 18h — horários comerciais</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📋 Personalização</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Crie mensagens específicas para cada público (INSS, BPC, Trabalhista)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📈 Exemplo prático</h2>
          <blockquote class="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-4">
            <strong>Campanha: Indeferidos INSS Agosto – Goiânia</strong>
            <br><br>
            <ul class="list-disc list-inside space-y-2">
              <li>Lista com 1800 contatos</li>
              <li>Tempo entre mensagens: 45s</li>
              <li>Modelo: "Olá! Vi que seu benefício foi indeferido. Podemos te ajudar com isso?"</li>
              <li><strong>Resultado:</strong> 1800 mensagens enviadas automaticamente, com respostas tratadas pela IA logo após.</li>
            </ul>
          </blockquote>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Ação</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">1️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Configurações de Envio</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Define velocidade e volume do disparo</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">2️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Modelos de Mensagem</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Cria textos automáticos para envio</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">3️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Lista de Disparo</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Importa contatos manualmente ou por planilha</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">4️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Iniciar Disparo</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Executa o envio e monitora o progresso</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Conclusão</h2>
          <p class="mb-3">
            A função <strong>Envio em Massa da Guimoo</strong> é uma poderosa ferramenta para campanhas automáticas via WhatsApp, totalmente integrada à IA.
            Ela permite <strong>segmentar contatos, personalizar mensagens e automatizar a comunicação</strong> — com total segurança e controle de desempenho.
          </p>
          <blockquote class="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4 italic">
            Use com estratégia e responsabilidade — e deixe a IA cuidar das respostas!
          </blockquote>
        </section>
      </div>
    `
};
