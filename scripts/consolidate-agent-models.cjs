const fs = require('fs');
const path = require('path');

// Caminho para os modelos
const modelsDir = path.join(__dirname, '..', 'src', 'data', 'agent-models');

// Lista de arquivos JSON
const modelFiles = [
  'bancario.json',
  'descontoIndevido.json',
  'invalidez.json',
  'maternidade.json',
  'Bancário - Produtor Rural.json',
  'Pensão e Divórcio.json',
  'Pensão por Morte.json',
  'auxilio.json',
  'bpc.json',
  'trabalhista.json'
];

console.log('🔄 Iniciando consolidação dos modelos de agentes...\n');

modelFiles.forEach(fileName => {
  const filePath = path.join(modelsDir, fileName);

  try {
    // Ler o arquivo JSON
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const model = JSON.parse(fileContent);

    console.log(`📄 Processando: ${fileName}`);

    // Verificar se tem etapas
    if (!model.etapas || model.etapas.length === 0) {
      console.log(`   ⚠️  Sem etapas para consolidar\n`);
      return;
    }

    console.log(`   ℹ️  Etapas encontradas: ${model.etapas.length}`);

    // Consolidar todas as etapas em uma única descrição
    let consolidatedDescription = '';

    model.etapas.forEach((etapa, index) => {
      if (index > 0) {
        consolidatedDescription += '\n\n<p><br></p>\n<hr>\n<p><br></p>\n\n';
      }

      // Adicionar título da etapa
      consolidatedDescription += `<h3><strong>${etapa.nome}</strong></h3>\n\n`;

      // Adicionar descrição da etapa
      consolidatedDescription += etapa.descricao;
    });

    // Substituir o array de etapas por uma única etapa consolidada
    model.etapas = [
      {
        ordem: 1,
        nome: 'Roteiro de Atendimento',
        descricao: consolidatedDescription
      }
    ];

    // Salvar o arquivo atualizado
    fs.writeFileSync(filePath, JSON.stringify(model, null, 2), 'utf8');

    console.log(`   ✅ Consolidado em 1 etapa única\n`);

  } catch (error) {
    console.error(`   ❌ Erro ao processar ${fileName}:`, error.message, '\n');
  }
});

console.log('✨ Consolidação concluída!');
