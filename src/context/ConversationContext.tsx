import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConversationContextType {
  isInConversation: boolean;
  setIsInConversation: (value: boolean) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  const [isInConversation, setIsInConversation] = useState(false);

  return (
    <ConversationContext.Provider value={{ isInConversation, setIsInConversation }}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};
