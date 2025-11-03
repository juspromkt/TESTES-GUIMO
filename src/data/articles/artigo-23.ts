import { Article } from './types';

export const artigo23: Article = {
  id: 'artigo-23',
  title: 'Guia Definitivo — Anúncios Jurídicos: Como Anunciar Corretamente e Dentro das Normas da OAB',
  description: 'Aprenda como criar, configurar e aplicar anúncios jurídicos corretamente, entendendo o que é um anúncio, onde anunciar (Google x Meta), como criar anúncios eficazes para BPC/LOAS, o que a OAB permite ou proíbe, estrutura prática para vídeos e segmentação correta.',
  category: 'artigos',
  readTime: '15 min',
  tags: ['Marketing Jurídico', 'Google Ads', 'Meta Ads', 'OAB', 'Anúncios', 'BPC/LOAS'],
  content: `
    <div class="space-y-6">
      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 Visão Geral</h2>
        <p class="mb-3">
          Este guia ensina <strong>como criar, configurar e aplicar anúncios jurídicos corretamente</strong>, explicando:
        </p>
        <ul class="list-disc list-inside space-y-2 ml-4">
          <li>O que é um anúncio e sua função real</li>
          <li>Onde anunciar (Google x Meta)</li>
          <li>Como criar anúncios eficazes para BPC/LOAS</li>
          <li>O que a OAB permite ou proíbe</li>
          <li>Estrutura prática para vídeos e segmentação correta</li>
          <li>Exemplos práticos e estratégias validadas</li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 1. O que é um Anúncio?</h2>
        <p class="mb-3">
          Um <strong>anúncio</strong> é, essencialmente, <strong>um investimento pago em visibilidade</strong>.
          Você grava um vídeo ou cria uma imagem, define um valor de investimento (ex: R$100) e diz às plataformas (Meta ou Google):
        </p>
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded mb-4">
          <p class="text-sm text-gray-700 dark:text-neutral-300">
            "Use este valor para mostrar este conteúdo às pessoas certas, que podem se interessar pelo meu serviço jurídico."
          </p>
        </div>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">📌 Resumindo:</h3>
        <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
          <li>Você paga por <strong>atenção</strong></li>
          <li>A plataforma (Facebook, Instagram, Google) mostra o conteúdo para o público certo</li>
          <li>Se o anúncio não gerar resultado, normalmente <strong>o problema está no vídeo ou mensagem</strong>, não na ferramenta</li>
        </ul>

        <p class="mb-3">👉 A responsabilidade é dividida:</p>
        <ul class="list-disc list-inside space-y-2 ml-4">
          <li><strong>50% você:</strong> precisa criar um conteúdo relevante e claro</li>
          <li><strong>50% a plataforma:</strong> entrega o conteúdo para o público-alvo ideal</li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💰 2. Para Que Serve um Anúncio?</h2>
        <p class="mb-3">
          O objetivo final de um anúncio jurídico é <strong>gerar lucro e clientes</strong>, não "fama" ou "visualizações".
        </p>
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded mb-4">
          <p class="text-sm text-gray-700 dark:text-neutral-300">
            🎯 <strong>Função principal:</strong> Levar uma pessoa com uma necessidade jurídica até o advogado certo — de preferência, direto no WhatsApp.
          </p>
        </div>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">Exemplo prático:</h3>
        <p class="mb-3">
          Um beneficiário que poderia receber <strong>BPC/LOAS</strong>, mas <strong>não sabe que tem esse direito</strong>,
          precisa ser informado e direcionado para um advogado.
        </p>

        <p class="mb-3">Portanto:</p>
        <ul class="list-disc list-inside space-y-2 ml-4">
          <li><strong>Não serve</strong> para autopromoção ou "branding" pessoal</li>
          <li><strong>Serve</strong> para conectar <strong>necessidade + solução jurídica</strong></li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🌐 3. Onde Anunciar: Google x Meta</h2>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">⚖️ Diferenças Principais</h3>
        <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
          <thead>
            <tr class="bg-gray-100 dark:bg-neutral-800">
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Plataforma</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Melhor para</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Quando usar</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Característica</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Google Ads</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Pessoas que <strong>sabem que têm direito</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Ex: busca "advogado trabalhista", "como entrar com ação"</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Demanda ativa (intenção de busca)</strong></td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Meta Ads (Facebook/Instagram)</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Pessoas que <strong>não sabem que têm direito</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Ex: "Você sabia que quem tem epilepsia pode ter direito ao BPC?"</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Demanda passiva (descoberta)</strong></td>
            </tr>
          </tbody>
        </table>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">🔍 Exemplos por Tipo de Caso</h3>
        <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
          <thead>
            <tr class="bg-gray-100 dark:bg-neutral-800">
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Tipo de Benefício / Caso</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Público</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Melhor Plataforma</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>BPC/LOAS</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Não sabe que tem direito</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Meta</strong></td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Salário Maternidade</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Sabe parcialmente</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Meta (descoberta)</strong></td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Trabalhista / Reclamatória</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Sabe que tem direito</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Google</strong></td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Pensão Alimentícia</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Busca solução ativa</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Google</strong></td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Aposentadoria indeferida</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Já sabe do direito</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Google</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
          <p class="text-sm text-gray-700 dark:text-neutral-300">
            💡 <strong>Regra prática:</strong><br>
            • Se o cliente <strong>não sabe que tem um direito</strong>, anuncie no <strong>Meta</strong>.<br>
            • Se o cliente <strong>já busca resolver um direito conhecido</strong>, anuncie no <strong>Google</strong>.
          </p>
        </div>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚖️ 4. A OAB Permite Fazer Anúncios? (Provimento 205/2021)</h2>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">📜 Contexto Legal</h3>
        <p class="mb-3">
          O <strong>Provimento 205/2021 da OAB</strong> foi criado para modernizar as regras de publicidade na advocacia,
          substituindo o antigo provimento de 2000. Hoje, ele <strong>autoriza anúncios jurídicos pagos</strong>,
          <strong>desde que informativos e éticos</strong>.
        </p>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">🧾 Conceitos Importantes (Artigo 2º)</h3>
        <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
          <thead>
            <tr class="bg-gray-100 dark:bg-neutral-800">
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Termo</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Definição Simplificada</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Marketing Jurídico</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Estratégia planejada para promover o exercício da advocacia.</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Marketing de Conteúdo Jurídico</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Criação e divulgação de conteúdo informativo para educar o público.</td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Publicidade Profissional</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Divulgação pública do perfil e serviços do advogado, sem ostentação.</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Publicidade Ativa</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Atinge pessoas que <strong>não buscaram</strong> o tema (ex: anúncio no Instagram).</td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>Publicidade Passiva</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Atinge quem <strong>busca</strong> o tema (ex: pesquisa no Google).</td>
            </tr>
          </tbody>
        </table>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">🚫 Condutas Vedadas pela OAB</h3>
        <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
          <thead>
            <tr class="bg-gray-100 dark:bg-neutral-800">
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Não pode fazer</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Exemplo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Falar de valores, descontos ou formas de pagamento</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Atendo por R$500" / "Parcelamos"</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Prometer resultados</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Garanta seu benefício rápido"</td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Usar comparações ou autoelogios</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Somos o melhor escritório da região"</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Falar de áreas sem título comprovado</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Especialista em previdenciário" sem certificação</td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Usar tom mercantil ou sensacionalista</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Ganhe dinheiro com sua rescisão!"</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Divulgar com ostentação</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Carros, luxo, frases apelativas</td>
            </tr>
          </tbody>
        </table>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">✅ O que é Permitido</h3>
        <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
          <li>Criar <strong>conteúdos informativos</strong> (educar, esclarecer, explicar)</li>
          <li>Fazer <strong>anúncios pagos</strong> (ativos e passivos)</li>
          <li>Divulgar <strong>em redes sociais e WhatsApp</strong>, desde que o conteúdo seja ético e informativo</li>
          <li>Incluir dados de contato, site e link do WhatsApp no final do anúncio</li>
          <li>Utilizar CTA (chamada para ação) <strong>neutra e informativa</strong>:
            <ul class="list-disc list-inside space-y-1 ml-8 mt-2">
              <li>"Saiba mais"</li>
              <li>"Entenda seu direito"</li>
              <li>"Clique e conheça nossos materiais"</li>
            </ul>
          </li>
        </ul>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">⚖️ Sobre WhatsApp</h3>
        <p class="mb-3">
          O WhatsApp é <strong>permitido</strong> como canal de contato. O provimento autoriza
          "<strong>meios de comunicação disponíveis, desde que não vedados</strong>", e o WhatsApp <strong>não é vedado</strong> pelo código de ética.
        </p>
        <div class="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded mb-2">
          <p class="text-sm text-gray-700 dark:text-neutral-300">
            ❌ <strong>O que seria infração:</strong><br>
            "Clique aqui e fale com um advogado especialista agora!"
          </p>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
          <p class="text-sm text-gray-700 dark:text-neutral-300">
            ✅ <strong>O que é permitido:</strong><br>
            "Quer saber mais sobre o assunto? Clique e saiba mais."
          </p>
        </div>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🎬 5. Tipos de Anúncio: Vídeo x Imagem</h2>
        <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
          <thead>
            <tr class="bg-gray-100 dark:bg-neutral-800">
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Tipo</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Vantagem</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Desvantagem</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>🎥 Vídeo</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Gera autoridade, empatia e confiança. Melhora performance e conversão.</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Exige gravação e presença.</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><strong>🖼️ Imagem</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Simples, rápida de criar. Ideal para testes.</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Menor engajamento. Parece "panfletagem digital".</td>
            </tr>
          </tbody>
        </table>
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
          <p class="text-sm text-gray-700 dark:text-neutral-300">
            <strong>Conclusão:</strong> Vídeos sempre performam melhor, principalmente quando o advogado aparece e fala com clareza.
          </p>
        </div>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧱 6. Estrutura Ideal de Vídeo Jurídico (Guia Prático)</h2>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">🧩 Objetivo:</h3>
        <p class="mb-3">
          Informar e levar o cliente até o WhatsApp, <strong>sem mercantilizar</strong>.
        </p>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">🪶 Roteiro Base (em 3 Frases):</h3>
        <ol class="list-decimal list-inside space-y-3 ml-4 mb-4">
          <li><strong>Identificação:</strong>
            <div class="p-3 bg-gray-50 dark:bg-neutral-800 rounded ml-6 mt-2">
              <p class="text-sm">"Se você tem epilepsia, pode ter direito ao BPC/LOAS."</p>
            </div>
          </li>
          <li><strong>Informação:</strong>
            <div class="p-3 bg-gray-50 dark:bg-neutral-800 rounded ml-6 mt-2">
              <p class="text-sm">"O BPC é um benefício pago pelo governo, no valor de um salário mínimo por mês."</p>
            </div>
          </li>
          <li><strong>Ação ética:</strong>
            <div class="p-3 bg-gray-50 dark:bg-neutral-800 rounded ml-6 mt-2">
              <p class="text-sm">"Para saber mais, fale com um dos nossos especialistas."</p>
            </div>
          </li>
        </ol>

        <div class="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
          <p class="text-sm text-gray-700 dark:text-neutral-300">
            ✅ Simples, claro e ético.<br>
            ✅ Não promete resultados.<br>
            ✅ Tem caráter informativo.<br>
            ✅ Direciona o público para mais informações (WhatsApp).
          </p>
        </div>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 7. Segmentação de Anúncios</h2>
        <p class="mb-3">
          <strong>Nunca misture temas no mesmo vídeo.</strong>
        </p>

        <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
          <thead>
            <tr class="bg-gray-100 dark:bg-neutral-800">
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Errado</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Correto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Se você tem TDAH, autismo ou epilepsia..."</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Se você tem epilepsia..."</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Benefícios do INSS"</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Benefício BPC para autistas"</td>
            </tr>
          </tbody>
        </table>

        <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
          <p class="text-sm text-gray-700 dark:text-neutral-300">
            👉 <strong>Motivo técnico:</strong> O algoritmo do Meta não entende públicos múltiplos no mesmo criativo.
            Cada vídeo deve ter <strong>apenas uma tese</strong>, para que o sistema identifique com precisão
            <strong>quem deve ver aquele conteúdo</strong>.
          </p>
        </div>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 8. Dicas Finais e Estratégia Prática</h2>
        <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
          <thead>
            <tr class="bg-gray-100 dark:bg-neutral-800">
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Tópico</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Orientação</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💵 <strong>Investimento Inicial</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Comece com orçamentos pequenos (R$ 20 a R$ 50/dia) e aumente conforme retorno.</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🎥 <strong>Formato do Vídeo</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Vertical (9:16), até 40 segundos, legendado.</td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧠 <strong>Tom de Voz</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Calmo, explicativo, natural e empático.</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⚖️ <strong>Compliance OAB</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Sempre com caráter educativo, sem apelos comerciais.</td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔁 <strong>Teste A/B</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Crie 2 versões do mesmo vídeo com frases iniciais diferentes.</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📊 <strong>Avaliação</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Acompanhe CTR (taxa de cliques) e mensagens recebidas.</td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💬 <strong>Mensagem Final</strong></td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">"Saiba mais sobre seus direitos" (CTA neutra e permitida).</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 9. Resumo Estratégico</h2>
        <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
          <thead>
            <tr class="bg-gray-100 dark:bg-neutral-800">
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa</th>
              <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Descrição</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🎥 Criação</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Vídeo curto, claro e informativo sobre 1 tese.</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💡 Mensagem</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Informação + direito + CTA ética.</td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧠 Segmentação</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Uma tese por criativo.</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📱 Plataforma</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Meta Ads (para público leigo) / Google Ads (para público consciente).</td>
            </tr>
            <tr>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⚖️ Ética</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Baseado no Provimento 205/2021.</td>
            </tr>
            <tr class="bg-gray-50 dark:bg-neutral-800/50">
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💬 Canal</td>
              <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">WhatsApp permitido como meio de contato.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧱 10. Modelo de Script Pronto para Advogados (Exemplo BPC/LOAS)</h2>

        <div class="space-y-4">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="font-semibold mb-2">Cena 1: (olhando para a câmera)</p>
            <p class="text-sm">"Se você tem epilepsia, sabia que pode ter direito ao BPC/LOAS?"</p>
          </div>

          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p class="font-semibold mb-2">Cena 2: (tom explicativo)</p>
            <p class="text-sm">"Esse é um benefício pago pelo governo, no valor de um salário mínimo por mês, para quem tem alguma limitação e baixa renda."</p>
          </div>

          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="font-semibold mb-2">Cena 3: (tom empático e neutro)</p>
            <p class="text-sm">"Para saber mais e entender se você se encaixa, clique abaixo e fale com nossa equipe."</p>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚖️ Conclusão</h2>
        <p class="mb-3">
          A publicidade jurídica <strong>é permitida</strong>, desde que:
        </p>
        <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
          <li>Tenha <strong>caráter informativo</strong></li>
          <li>Seja <strong>discreta, ética e verdadeira</strong></li>
          <li>E respeite o <strong>Provimento 205/2021 da OAB</strong></li>
        </ul>

        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded">
          <p class="text-sm text-gray-700 dark:text-neutral-300">
            📢 <strong>Mensagem final:</strong><br>
            O bom anúncio jurídico não é o que promete resultados.
            É o que <strong>educa, gera confiança e conecta o cliente ao advogado certo</strong>.
          </p>
        </div>
      </section>
    </div>
  `
};
