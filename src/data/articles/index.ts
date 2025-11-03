// Export individual articles
export { artigo1 } from './artigo-1';
export { artigo2 } from './artigo-2';
export { artigo3 } from './artigo-3';
export { artigo4 } from './artigo-4';
export { artigo5 } from './artigo-5';
export { artigo6 } from './artigo-6';
export { artigo7 } from './artigo-7';
export { artigo8 } from './artigo-8';
export { artigo9 } from './artigo-9';
export { artigo10 } from './artigo-10';
export { artigo11 } from './artigo-11';
export { artigo12 } from './artigo-12';
export { artigo13 } from './artigo-13';
export { artigo14 } from './artigo-14';
export { artigo15 } from './artigo-15';
export { artigo16 } from './artigo-16';
export { artigo17 } from './artigo-17';
export { artigo18 } from './artigo-18';
export { artigo19 } from './artigo-19';
export { artigo20 } from './artigo-20';
export { artigo21 } from './artigo-21';
export { artigo22 } from './artigo-22';
export { artigo23 } from './artigo-23';
export { artigo24 } from './artigo-24';

// Import all articles
import { artigo1 } from './artigo-1';
import { artigo2 } from './artigo-2';
import { artigo3 } from './artigo-3';
import { artigo4 } from './artigo-4';
import { artigo5 } from './artigo-5';
import { artigo6 } from './artigo-6';
import { artigo7 } from './artigo-7';
import { artigo8 } from './artigo-8';
import { artigo9 } from './artigo-9';
import { artigo10 } from './artigo-10';
import { artigo11 } from './artigo-11';
import { artigo12 } from './artigo-12';
import { artigo13 } from './artigo-13';
import { artigo14 } from './artigo-14';
import { artigo15 } from './artigo-15';
import { artigo16 } from './artigo-16';
import { artigo17 } from './artigo-17';
import { artigo18 } from './artigo-18';
import { artigo19 } from './artigo-19';
import { artigo20 } from './artigo-20';
import { artigo21 } from './artigo-21';
import { artigo22 } from './artigo-22';
import { artigo23 } from './artigo-23';
import { artigo24 } from './artigo-24';

import { Article } from './types';

// Export Article type for convenience
export type { Article };

/**
 * All articles organized by priority
 *
 * Sections:
 * 📚 Seção 1: Primeiros Passos
 * 🤖 Seção 2: Configuração da IA
 * 💬 Seção 3: Gestão de Conversas e CRM
 * 🚀 Seção 4: Funcionalidades Avançadas
 * 🔧 Seção 5: Integrações e Ferramentas
 * 🎓 Seção 6: Guimoo Academy (Marketing e Estratégia)
 */
export const allArticles: Article[] = [
  // ========================================
  // 📚 SEÇÃO 1: PRIMEIROS PASSOS
  // ========================================
  artigo21, // Primeiro Acesso e Configuração Completa da IA Guimoo
  artigo15, // Visão Geral da Plataforma Guimoo

  // ========================================
  // 🤖 SEÇÃO 2: CONFIGURAÇÃO DA IA
  // ========================================
  artigo8,  // Modelos de Agente de IA
  artigo22, // Função "#sair" (Reiniciar Conversa da IA)
  artigo1,  // Gatilho de Acionamento da IA
  artigo2,  // Configurações de Áudio da IA
  artigo5,  // Configuração de Horário de Funcionamento da IA
  artigo9,  // Parâmetros do Agente de IA (Delay e Tempo de Inatividade)
  artigo12, // Teste de Agente (Simulação de Conversa)

  // ========================================
  // 💬 SEÇÃO 3: GESTÃO DE CONVERSAS E CRM
  // ========================================
  artigo16, // Aba de Conversas da Guimoo
  artigo17, // Controle de IA nas Conversas
  artigo18, // Configuração de Funil de Vendas
  artigo14, // Movimentação Automática no CRM
  artigo13, // Exportando Leads do CRM

  // ========================================
  // 🚀 SEÇÃO 4: FUNCIONALIDADES AVANÇADAS
  // ========================================
  artigo11, // Configuração de Follow-up Automático
  artigo7,  // Histórico de Follow-up
  artigo6,  // Configurando Notificações Automáticas no WhatsApp
  artigo19, // Envio em Massa
  artigo20, // Configuração de Agendamentos Automáticos

  // ========================================
  // 🔧 SEÇÃO 5: INTEGRAÇÕES E FERRAMENTAS
  // ========================================
  artigo3,  // Como Configurar o Google Agenda (Workspace)
  artigo4,  // Configurando o Google Agenda (Método Rápido)
  artigo10, // Sistema de Workspaces

  // ========================================
  // 🎓 SEÇÃO 6: GUIMOO ACADEMY (MARKETING E ESTRATÉGIA)
  // ========================================
  artigo23, // Guia Definitivo — Anúncios Jurídicos (Google Ads, Meta Ads, OAB)
  artigo24, // Como Criar Campanhas Trabalhistas no Google Ads (Passo a Passo)
];
