# 🧪 Guia de Teste - Aba "Agentes"

## ✅ Servidor Rodando

**URL Local:** http://localhost:5186/

---

## 🎯 Rotas Disponíveis

### 1. Visualização Config (Original)
**URL:** http://localhost:5186/ai-agent

**Recursos:**
- Seletor horizontal de agentes
- Configurações por agente selecionado
- Toggle de ativação
- Botão **"Grid"** no cabeçalho → alterna para visualização em grid

---

### 2. Visualização Grid (Nova)
**URL:** http://localhost:5186/ai-agent-grid

**Recursos:**
- Sidebar interna com 4 abas
- Grid responsivo de cards
- Cards com hover effects
- Botões de status por agente
- Modal de configuração ao clicar no card
- Botão **"Config"** no cabeçalho → volta para visualização original

---

## 🧪 Testes Recomendados

### ✅ Teste 1: Navegação entre Visualizações

1. Acesse http://localhost:5186/ai-agent
2. Clique no botão **"Grid"** (canto superior direito)
3. Deve redirecionar para `/ai-agent-grid`
4. Na página Grid, clique no botão **"Config"**
5. Deve voltar para `/ai-agent`

**Resultado esperado:** Navegação fluida sem erros

---

### ✅ Teste 2: Listagem de Agentes (Grid)

1. Acesse http://localhost:5186/ai-agent-grid
2. Aguarde o carregamento (spinner deve aparecer)
3. Verifique se os cards aparecem em grid

**Resultado esperado:**
- Loading spinner aparece primeiro
- Cards aparecem em 1/2/3 colunas (conforme tamanho da tela)
- Cada card mostra: ícone, nome, badges, botão de status

---

### ✅ Teste 3: Estado Vazio

**Como testar:**
- Se não houver agentes, deve aparecer:
  - Ícone Bot grande
  - Mensagem "Nenhum agente criado"
  - Botão "Criar Agente"

---

### ✅ Teste 4: Criar Novo Agente

1. Clique em **"Novo Agente"**
2. Preencha os campos:
   - Nome: "Teste Grid"
   - Marque "Agente Ativo"
   - Marque "Ativar por Gatilho"
   - Gatilho: "oi teste"
3. Clique em **"Criar Agente"**

**Resultado esperado:**
- Modal fecha
- Mensagem verde de sucesso aparece
- Novo card aparece no grid
- Badge "Gatilho" visível
- Palavra-chave "oi teste" aparece no card

---

### ✅ Teste 5: Toggle de Status

1. Em um card de agente, clique no ícone **Power** (canto superior direito)
2. Aguarde o loader

**Resultado esperado:**
- Botão mostra loader durante requisição
- Ícone muda de Power → PowerOff (ou vice-versa)
- Cor do botão muda (verde → cinza ou cinza → verde)
- Mensagem de sucesso aparece

---

### ✅ Teste 6: Editar Agente

1. Passe o mouse sobre um card
2. Botão **"Editar"** deve aparecer (canto inferior direito)
3. Clique em **"Editar"**
4. Modifique o nome
5. Salve

**Resultado esperado:**
- Modal abre com dados pré-preenchidos
- Alterações são salvas
- Card atualiza com novo nome

---

### ✅ Teste 7: Abrir Configurações do Agente

1. Clique no **corpo do card** (não nos botões)
2. Modal lateral deve deslizar da direita

**Resultado esperado:**
- Animação slide-in suave
- Modal ocupa a direita da tela
- Mostra todas as configurações do agente
- Pode fechar clicando fora ou ESC

---

### ✅ Teste 8: Sidebar Interna

1. Na visualização Grid, teste as 4 abas da sidebar:
   - **Agentes** → mostra grid
   - **Notificações** → placeholder "Em desenvolvimento"
   - **Follow-up** → placeholder "Em desenvolvimento"
   - **Teste** → placeholder "Em desenvolvimento"

**Resultado esperado:**
- Aba ativa fica destacada (fundo escuro)
- Conteúdo muda ao trocar de aba

---

### ✅ Teste 9: Responsividade

**Desktop (> 1024px):**
- Grid com 3 colunas
- Sidebar visível (256px)

**Tablet (768px - 1024px):**
- Grid com 2 colunas
- Sidebar visível

**Mobile (< 768px):**
- Grid com 1 coluna
- Sidebar visível (TODO: melhorar responsividade)

**Como testar:**
- Redimensione a janela do navegador
- Use DevTools (F12) → Device Toolbar

---

### ✅ Teste 10: Dark Mode

1. Ative o dark mode do navegador/sistema
2. Verifique se a interface se adapta

**Resultado esperado:**
- Backgrounds escuros
- Textos claros
- Bordas e sombras ajustadas

---

### ✅ Teste 11: Mensagens de Feedback

**Sucesso:**
- Criar agente → mensagem verde
- Salvar alterações → mensagem verde
- Toggle status → mensagem verde
- Auto-dismiss após 3 segundos

**Erro:**
- Falha na API → mensagem vermelha
- Auto-dismiss após 3 segundos

---

### ✅ Teste 12: Badges Visuais

**Badge "Principal":**
- Fundo azul
- Texto "Principal"
- Apenas um agente pode ter

**Badge "Gatilho":**
- Fundo roxo
- Ícone Zap
- Texto "Gatilho"
- Palavra-chave aparece abaixo

---

## 🐛 Problemas Conhecidos

### ⚠️ Sidebar Mobile
A sidebar não colapsa em telas pequenas. Implementação futura:
- Hamburger menu
- Sidebar overlay

### ⚠️ Infinite Scroll
Grid não possui paginação/infinite scroll ainda.

---

## 📊 Checklist de Verificação

- [ ] Servidor está rodando sem erros
- [ ] Navegação Config ↔ Grid funciona
- [ ] Cards aparecem corretamente
- [ ] Loading state funciona
- [ ] Empty state funciona
- [ ] Criar agente funciona
- [ ] Editar agente funciona
- [ ] Toggle status funciona
- [ ] Abrir configurações funciona (modal lateral)
- [ ] Sidebar interna funciona
- [ ] Responsividade básica funciona
- [ ] Dark mode funciona
- [ ] Mensagens de feedback aparecem e somem
- [ ] Badges aparecem corretamente
- [ ] Hover effects funcionam

---

## 🔍 Debug

### Ver Console do Navegador
1. Abra DevTools (F12)
2. Vá para a aba "Console"
3. Verifique se há erros em vermelho

### Verificar Network
1. DevTools → Aba "Network"
2. Recarregue a página
3. Verifique requisições para:
   - `/webhook/prospecta/multiagente/get`
   - `/webhook/prospecta/multiagente/toggle`
   - `/webhook/prospecta/multiagente/create`
   - `/webhook/prospecta/multiagente/update`

### Simular Sem Token
Para testar estado de "não autorizado":
1. Abra Console
2. Execute: `localStorage.removeItem('user')`
3. Recarregue a página
4. Deve aparecer: "Acesso não autorizado"

---

## 🎬 Próximos Passos

Após validação dos testes:

1. **Integrar abas reais**
   - Substituir placeholders de Notificações, Follow-up e Teste
   - Usar componentes existentes (FollowUpTab, AgentTestTab)

2. **Melhorar responsividade mobile**
   - Sidebar colapsável
   - Botões adaptativos

3. **Adicionar features avançadas**
   - Busca/filtro de agentes
   - Ordenação
   - Ações em lote

4. **Otimizações**
   - Lazy loading de modais
   - Memoização de componentes
   - Infinite scroll

---

**Desenvolvido e testado com sucesso!** ✅
