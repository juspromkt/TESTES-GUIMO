import { useReducer, Dispatch } from 'react';
import type { Tag } from '../../../types/tag';
import type { Departamento } from '../../../types/departamento';

/**
 * Hook customizado para gerenciar estados do ContactSidebar com useReducer
 * Consolida múltiplos estados relacionados e reduz re-renders
 */

// Interfaces
export interface ContactData {
  Id: number;
  nome: string;
  telefone: string;
  Email: string | null;
  profilePicUrl?: string | null;
}

export interface DealData {
  Id: number;
  id_contato: number;
  id_funil: number;
  id_estagio: number;
  id_usuario: number | null;
  nome_etapa?: string;
}

export interface Note {
  Id: number;
  id_negociacao: number;
  id_usuario: number;
  descricao: string;
  CreatedAt: string;
  UpdatedAt: string | null;
}

export interface Agent {
  Id: number;
  nome: string;
  isAtivo?: boolean;
  isAgentePrincipal?: boolean;
}

export interface AIStatus {
  intervention: boolean;
  permanentExclusion: boolean;
}

// Estado consolidado
export interface SidebarState {
  // Dados principais
  contactData: ContactData | null;
  dealData: DealData | null;
  dealTags: Tag[];
  dealDepartamentos: Departamento[];
  availableDepartamentos: Departamento[];

  // Status da IA
  aiStatus: AIStatus;
  sessionInfo: any | null;
  interventionInfo: any | null;
  isTransferChat: boolean;

  // Agentes
  agents: Agent[];
  selectedAgentId: number | null;

  // UI States
  initialLoad: boolean;
  updatingAI: boolean;
  editingName: boolean;
  savingName: boolean;
  editedName: string;
  activationCooldown: boolean;
  showActivationMessage: boolean;

  // Modal States
  showCreateDealModal: boolean;
  creatingDeal: boolean;
  modalAlreadyShown: boolean;

  // Views
  activeView: 'info' | 'media' | 'notas';
  activeMediaTab: 'images' | 'videos' | 'docs' | 'cloud';

  // Media
  mediaFiles: {
    images: any[];
    videos: any[];
    docs: any[];
  };
  loadingMedia: boolean;
  loadingAgents: boolean;

  // Preview
  previewOpen: boolean;
  previewUrl: string | null;
  previewType: 'image' | 'video';
  previewIndex: number;

  // Notes
  notes: Note[];
  loadingNotes: boolean;
  newNote: string;
  savingNote: boolean;
  editingNote: Note | null;
  deletingNoteId: number | null;

  // Error handling
  error: Error | null;
  retryCount: number;
}

// Actions
export type SidebarAction =
  | { type: 'SET_CONTACT_DATA'; payload: ContactData | null }
  | { type: 'SET_DEAL_DATA'; payload: DealData | null }
  | { type: 'SET_DEAL_TAGS'; payload: Tag[] }
  | { type: 'SET_DEAL_DEPARTAMENTOS'; payload: Departamento[] }
  | { type: 'SET_AVAILABLE_DEPARTAMENTOS'; payload: Departamento[] }
  | { type: 'SET_AI_STATUS'; payload: AIStatus }
  | { type: 'SET_SESSION_INFO'; payload: any }
  | { type: 'SET_INTERVENTION_INFO'; payload: any }
  | { type: 'SET_IS_TRANSFER_CHAT'; payload: boolean }
  | { type: 'SET_AGENTS'; payload: Agent[] }
  | { type: 'SET_SELECTED_AGENT_ID'; payload: number | null }
  | { type: 'SET_INITIAL_LOAD'; payload: boolean }
  | { type: 'SET_UPDATING_AI'; payload: boolean }
  | { type: 'SET_EDITING_NAME'; payload: boolean }
  | { type: 'SET_SAVING_NAME'; payload: boolean }
  | { type: 'SET_EDITED_NAME'; payload: string }
  | { type: 'SET_ACTIVATION_COOLDOWN'; payload: boolean }
  | { type: 'SET_SHOW_ACTIVATION_MESSAGE'; payload: boolean }
  | { type: 'SET_SHOW_CREATE_DEAL_MODAL'; payload: boolean }
  | { type: 'SET_CREATING_DEAL'; payload: boolean }
  | { type: 'SET_MODAL_ALREADY_SHOWN'; payload: boolean }
  | { type: 'SET_ACTIVE_VIEW'; payload: 'info' | 'media' | 'notas' }
  | { type: 'SET_ACTIVE_MEDIA_TAB'; payload: 'images' | 'videos' | 'docs' | 'cloud' }
  | { type: 'SET_MEDIA_FILES'; payload: { images: any[]; videos: any[]; docs: any[] } }
  | { type: 'SET_LOADING_MEDIA'; payload: boolean }
  | { type: 'SET_LOADING_AGENTS'; payload: boolean }
  | { type: 'SET_PREVIEW_OPEN'; payload: boolean }
  | { type: 'SET_PREVIEW_URL'; payload: string | null }
  | { type: 'SET_PREVIEW_TYPE'; payload: 'image' | 'video' }
  | { type: 'SET_PREVIEW_INDEX'; payload: number }
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'SET_LOADING_NOTES'; payload: boolean }
  | { type: 'SET_NEW_NOTE'; payload: string }
  | { type: 'SET_SAVING_NOTE'; payload: boolean }
  | { type: 'SET_EDITING_NOTE'; payload: Note | null }
  | { type: 'SET_DELETING_NOTE_ID'; payload: number | null }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'INCREMENT_RETRY_COUNT' }
  | { type: 'RESET_RETRY_COUNT' }
  | { type: 'RESET_ON_CHAT_CHANGE' }
  | { type: 'UPDATE_DEAL_FIELD'; payload: { field: keyof DealData; value: any } };

// Estado inicial
export const initialState: SidebarState = {
  contactData: null,
  dealData: null,
  dealTags: [],
  dealDepartamentos: [],
  availableDepartamentos: [],

  aiStatus: { intervention: false, permanentExclusion: false },
  sessionInfo: null,
  interventionInfo: null,
  isTransferChat: false,

  agents: [],
  selectedAgentId: null,

  initialLoad: true,
  updatingAI: false,
  editingName: false,
  savingName: false,
  editedName: '',
  activationCooldown: false,
  showActivationMessage: false,

  showCreateDealModal: false,
  creatingDeal: false,
  modalAlreadyShown: false,

  activeView: 'info',
  activeMediaTab: 'images',

  mediaFiles: { images: [], videos: [], docs: [] },
  loadingMedia: false,
  loadingAgents: false,

  previewOpen: false,
  previewUrl: null,
  previewType: 'image',
  previewIndex: 0,

  notes: [],
  loadingNotes: false,
  newNote: '',
  savingNote: false,
  editingNote: null,
  deletingNoteId: null,

  error: null,
  retryCount: 0,
};

// Reducer
export function sidebarReducer(state: SidebarState, action: SidebarAction): SidebarState {
  switch (action.type) {
    case 'SET_CONTACT_DATA':
      return { ...state, contactData: action.payload };
    case 'SET_DEAL_DATA':
      return { ...state, dealData: action.payload };
    case 'SET_DEAL_TAGS':
      return { ...state, dealTags: action.payload };
    case 'SET_DEAL_DEPARTAMENTOS':
      return { ...state, dealDepartamentos: action.payload };
    case 'SET_AVAILABLE_DEPARTAMENTOS':
      return { ...state, availableDepartamentos: action.payload };
    case 'SET_AI_STATUS':
      return { ...state, aiStatus: action.payload };
    case 'SET_SESSION_INFO':
      return { ...state, sessionInfo: action.payload };
    case 'SET_INTERVENTION_INFO':
      return { ...state, interventionInfo: action.payload };
    case 'SET_IS_TRANSFER_CHAT':
      return { ...state, isTransferChat: action.payload };
    case 'SET_AGENTS':
      return { ...state, agents: action.payload };
    case 'SET_SELECTED_AGENT_ID':
      return { ...state, selectedAgentId: action.payload };
    case 'SET_INITIAL_LOAD':
      return { ...state, initialLoad: action.payload };
    case 'SET_UPDATING_AI':
      return { ...state, updatingAI: action.payload };
    case 'SET_EDITING_NAME':
      return { ...state, editingName: action.payload };
    case 'SET_SAVING_NAME':
      return { ...state, savingName: action.payload };
    case 'SET_EDITED_NAME':
      return { ...state, editedName: action.payload };
    case 'SET_ACTIVATION_COOLDOWN':
      return { ...state, activationCooldown: action.payload };
    case 'SET_SHOW_ACTIVATION_MESSAGE':
      return { ...state, showActivationMessage: action.payload };
    case 'SET_SHOW_CREATE_DEAL_MODAL':
      return { ...state, showCreateDealModal: action.payload };
    case 'SET_CREATING_DEAL':
      return { ...state, creatingDeal: action.payload };
    case 'SET_MODAL_ALREADY_SHOWN':
      return { ...state, modalAlreadyShown: action.payload };
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_ACTIVE_MEDIA_TAB':
      return { ...state, activeMediaTab: action.payload };
    case 'SET_MEDIA_FILES':
      return { ...state, mediaFiles: action.payload };
    case 'SET_LOADING_MEDIA':
      return { ...state, loadingMedia: action.payload };
    case 'SET_LOADING_AGENTS':
      return { ...state, loadingAgents: action.payload };
    case 'SET_PREVIEW_OPEN':
      return { ...state, previewOpen: action.payload };
    case 'SET_PREVIEW_URL':
      return { ...state, previewUrl: action.payload };
    case 'SET_PREVIEW_TYPE':
      return { ...state, previewType: action.payload };
    case 'SET_PREVIEW_INDEX':
      return { ...state, previewIndex: action.payload };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'SET_LOADING_NOTES':
      return { ...state, loadingNotes: action.payload };
    case 'SET_NEW_NOTE':
      return { ...state, newNote: action.payload };
    case 'SET_SAVING_NOTE':
      return { ...state, savingNote: action.payload };
    case 'SET_EDITING_NOTE':
      return { ...state, editingNote: action.payload };
    case 'SET_DELETING_NOTE_ID':
      return { ...state, deletingNoteId: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'INCREMENT_RETRY_COUNT':
      return { ...state, retryCount: state.retryCount + 1 };
    case 'RESET_RETRY_COUNT':
      return { ...state, retryCount: 0 };
    case 'RESET_ON_CHAT_CHANGE':
      return {
        ...state,
        dealData: null,
        dealTags: [],
        dealDepartamentos: [],
        notes: [],
        mediaFiles: { images: [], videos: [], docs: [] },
        error: null,
        retryCount: 0,
      };
    case 'UPDATE_DEAL_FIELD':
      return {
        ...state,
        dealData: state.dealData
          ? { ...state.dealData, [action.payload.field]: action.payload.value }
          : null,
      };
    default:
      return state;
  }
}

// Hook customizado
export function useSidebarState(): [SidebarState, Dispatch<SidebarAction>] {
  return useReducer(sidebarReducer, initialState);
}
