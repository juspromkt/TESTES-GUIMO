import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { apiClient, Chat } from "../components/chat/utils/api";
import type { Tag } from "../types/tag";
import { useTags, useUsers, useFunnels } from "../hooks/useChatData";

interface ChatContextType {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat | null) => void;
  refreshChats: () => Promise<void>;
  updateChatLocal: (remoteJid: string, updates: Partial<Chat>) => void;
  loading: boolean;
  // Dados auxiliares (tags, usuários, funis)
  availableTags: Tag[];
  users: any[];
  funnels: any[];
  // Controle de polling
  pausePolling: () => void;
  resumePolling: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Controle de polling
  const pollingIntervalRef = useRef<number | null>(null);
  const pollingPausedRef = useRef(false);

  // Usa SWR para cache automático de dados auxiliares
  const { data: availableTags = [], error: tagsError } = useTags(token);
  const { data: users = [], error: usersError } = useUsers(token);
  const { data: funnels = [], error: funnelsError } = useFunnels(token);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) setToken(JSON.parse(user).token);
  }, []);

  const refreshChats = useCallback(async () => {
    if (!token) return;

    try {
      const chats = await apiClient.findChats(token);
      setChats(Array.isArray(chats) ? chats : []);
    } catch (err) {
      console.error("Erro ao atualizar conversas:", err);
    }
  }, [token]);

  const updateChatLocal = useCallback((remoteJid: string, updates: Partial<Chat>) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.remoteJid === remoteJid ? { ...chat, ...updates } : chat
      )
    );

    // Se o chat selecionado for o que está sendo atualizado, atualiza também
    setSelectedChat((current) => {
      if (current && current.remoteJid === remoteJid) {
        return { ...current, ...updates };
      }
      return current;
    });
  }, []);

  // Carrega dados iniciais
  useEffect(() => {
    if (token) {
      setLoading(true);
      refreshChats().finally(() => {
        setLoading(false);
      });
    }
  }, [token, refreshChats]);

  // Polling controlado (atualiza a cada 5 segundos)
  useEffect(() => {
    if (!token) return;

    const startPolling = () => {
      pollingIntervalRef.current = window.setInterval(() => {
        // Só atualiza se a aba estiver visível e o polling não estiver pausado
        if (document.visibilityState === "visible" && !pollingPausedRef.current) {
          refreshChats();
        }
      }, 5000); // 5 segundos
    };

    startPolling();

    // Listener para pausar quando a aba fica inativa
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      } else if (document.visibilityState === "visible" && !pollingIntervalRef.current) {
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [token, refreshChats]);

  const pausePolling = useCallback(() => {
    pollingPausedRef.current = true;
  }, []);

  const resumePolling = useCallback(() => {
    pollingPausedRef.current = false;
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        refreshChats,
        updateChatLocal,
        loading,
        availableTags,
        users,
        funnels,
        pausePolling,
        resumePolling,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat deve ser usado dentro de ChatProvider");
  return ctx;
};
