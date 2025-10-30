import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Image as ImageIcon,
  X,
  RefreshCw,
  StopCircle,
  Loader2,
  AlertCircle,
  Check,
  Sparkles
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  type: 'text' | 'image' | 'audio';
  media?: string;
}

export default function AgentTestTab({ token }: { token: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  function formatMessageText(text: string): string {
  if (!text) return '';

  // Escapar HTML (simples e seguro)
  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#039;');

  // Se já for HTML (ex: inicia com <div>, <img>, <video>), retorna como está
  if (text.trim().startsWith('<')) return text;

  const escaped = escapeHtml(text);

  return escaped
    .replace(/\*(.*?)\*/g, '<b>$1</b>')        // *negrito*
    .replace(/_(.*?)_/g, '<i>$1</i>')          // _itálico_
    .replace(/~(.*?)~/g, '<s>$1</s>')          // ~riscado~
    .replace(/```(.*?)```/gs, '<pre>$1</pre>') // ```bloco de código```
    .replace(/\n/g, '<br>');                   // quebra de linha
}


  const formatTimestamp = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return '';
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

const handleSendMessage = async () => {
  if (!inputMessage.trim() && !isRecording) return;

  if (isRecording) {
    stopRecording();
    return;
  }

  const userMessage = inputMessage.trim();
  setInputMessage('');

  // Retorna o foco imediatamente após limpar o input
  setTimeout(() => textareaRef.current?.focus(), 0);

  const newUserMessage: Message = {
    id: Date.now().toString(),
    text: userMessage,
    isUser: true,
    timestamp: new Date().toISOString(),
    type: 'text'
  };

  setMessages(prev => [...prev, newUserMessage]);
  setIsLoading(true);
  setError('');

  try {
    const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify({
        tipo: 'text',
        mensagem: userMessage
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem');
    }

    const data = await response.json();

    // Handle both array and object response formats
    const responseText = Array.isArray(data) ? data[0]?.text : data.text;
    const responseDateTime = Array.isArray(data) ? data[0]?.dateTime : data.dateTime;

    if (responseText) {
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 3000));
      setIsTyping(false);

      const messageParts = responseText.split('\n\n').filter(part => part.trim());

      for (let i = 0; i < messageParts.length; i++) {
        if (i > 0) {
          setIsTyping(true);
          await new Promise(resolve => setTimeout(resolve, 3000));
          setIsTyping(false);
        }

        const botMessage: Message = {
          id: `${Date.now()}_${i}`,
          text: messageParts[i].trim(),
          isUser: false,
          timestamp: responseDateTime || new Date().toISOString(),
          type: 'text'
        };

        setMessages(prev => [...prev, botMessage]);

        if (i < messageParts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    setError('Erro ao enviar mensagem. Tente novamente.');
    setIsLoading(false);
    setIsTyping(false);
  } finally {
    setIsLoading(false);
    setIsTyping(false);
  }
};

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/chat/reset', {
        method: 'POST',
        headers: { token }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao resetar conversa');
      }
      
      setMessages([]);
      setSuccess('Conversa resetada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao resetar conversa:', err);
      setError('Erro ao resetar conversa. Tente novamente.');
    } finally {
      setIsResetting(false);
    }
  };

const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  setIsUploading(true);
  setError('');
  
  try {
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    
    if (!isImage && !isAudio) {
      throw new Error('Apenas imagens e áudios são suportados');
    }
    
    const fileType = isImage ? 'image' : 'audio';
    
    // Convert file to base64
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result?.toString();
        if (result) {
          const base64 = result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Erro ao converter arquivo'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
    
    // Add user message with media
    const mediaUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result?.toString();
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Erro ao converter arquivo para preview'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo para preview'));
      reader.readAsDataURL(file);
    });
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: '',
      isUser: true,
      timestamp: new Date().toISOString(),
      type: fileType,
      media: mediaUrl
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    // Retorna o foco imediatamente
    setTimeout(() => textareaRef.current?.focus(), 0);

    // Send to API
    const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify({
        tipo: fileType,
        base64: base64String
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao enviar ${fileType}`);
    }
    
    const data = await response.json();
    
    // Handle both array and object response formats
    const responseText = Array.isArray(data) ? data[0]?.text : data.text;
    const responseDateTime = Array.isArray(data) ? data[0]?.dateTime : data.dateTime;

    if (responseText) {
      setIsTyping(true);
      await new Promise(resolve => setTimeout(resolve, 3000));
      setIsTyping(false);
      
      const messageParts = responseText.split('\n\n').filter(part => part.trim());
      
      for (let i = 0; i < messageParts.length; i++) {
        if (i > 0) {
          setIsTyping(true);
          await new Promise(resolve => setTimeout(resolve, 3000));
          setIsTyping(false);
        }
        
        const botMessage: Message = {
          id: `${Date.now()}_${i}`,
          text: messageParts[i].trim(),
          isUser: false,
          timestamp: responseDateTime || new Date().toISOString(),
          type: 'text'
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        if (i < messageParts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
  } catch (err) {
    console.error('Erro ao enviar mídia:', err);
    setError(err instanceof Error ? err.message : 'Erro ao enviar mídia');
  } finally {
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream; // salvar aqui

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);

    // Timer
    let seconds = 0;
    recordingTimerRef.current = setInterval(() => {
      seconds += 1;
      setRecordingTime(seconds);
    }, 1000);
  } catch (err) {
    console.error('Erro ao iniciar gravação:', err);
    setError('Erro ao acessar microfone. Verifique as permissões do navegador.');
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString();
      if (result) {
        resolve(result.split(',')[1]);
      } else {
        reject(new Error('Erro ao converter blob'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


const stopRecording = () => {
  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
    mediaRecorderRef.current.onstop = async () => {
const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      if (audioBlob.size > 0) {
        try {
          const base64String = await blobToBase64(audioBlob);
          const mediaUrl = URL.createObjectURL(audioBlob);

          const newUserMessage: Message = {
            id: Date.now().toString(),
            text: '',
            isUser: true,
            timestamp: new Date().toISOString(),
            type: 'audio',
            media: mediaUrl
          };

          setMessages(prev => [...prev, newUserMessage]);
          setIsLoading(true);

          // Retorna o foco imediatamente
          setTimeout(() => textareaRef.current?.focus(), 0);

          const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify({
              tipo: 'audio',
              base64: base64String
            })
          });

          if (!response.ok) {
            throw new Error('Erro ao enviar áudio');
          }

          // mesmo tratamento do texto
          const data = await response.json();
          const responseText = Array.isArray(data) ? data[0]?.text : data.text;
          const responseDateTime = Array.isArray(data) ? data[0]?.dateTime : data.dateTime;

          if (responseText) {
            setIsTyping(true);
            await new Promise(resolve => setTimeout(resolve, 3000));
            setIsTyping(false);

            const messageParts = responseText.split('\n\n').filter(part => part.trim());

            for (let i = 0; i < messageParts.length; i++) {
              if (i > 0) {
                setIsTyping(true);
                await new Promise(resolve => setTimeout(resolve, 3000));
                setIsTyping(false);
              }

              const botMessage: Message = {
                id: `${Date.now()}_${i}`,
                text: messageParts[i].trim(),
                isUser: false,
                timestamp: responseDateTime || new Date().toISOString(),
                type: 'text'
              };

              setMessages(prev => [...prev, botMessage]);
              if (i < messageParts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }

        } catch (err) {
          console.error('Erro ao enviar áudio:', err);
          setError('Erro ao enviar áudio. Tente novamente.');
        } finally {
          setIsLoading(false);
        }
      }

      // finaliza a gravação corretamente
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };

    mediaRecorderRef.current.stop();
  }

  if (recordingTimerRef.current) {
    clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
  }

  setIsRecording(false);
  setRecordingTime(0);
};



  return (
    <div className="flex flex-col h-full">
      {/* Header Premium */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-3xl shadow-2xl p-8 mb-6 border border-gray-200/50 dark:border-neutral-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Teste do Agente</h2>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Converse com sua IA em tempo real</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none font-medium"
          >
            {isResetting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Resetando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Resetar Conversa</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/50 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-100/50 dark:from-green-950 dark:to-emerald-900/50 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="font-medium">{success}</span>
          </div>
        )}

        {/* Grid de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Coluna Esquerda - Informações */}
          <div className="flex flex-col gap-5">
            {/* Descrição */}
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-6 border border-gray-200/50 dark:border-neutral-700/50 shadow-md">
              <h3 className="font-bold text-lg text-gray-800 dark:text-neutral-200 mb-3">Sobre o Teste</h3>
              <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                Use esta interface para testar seu agente de IA. Envie mensagens de texto, imagens ou áudios e veja como o agente responde em tempo real. Perfeito para validar as configurações e o comportamento do seu assistente virtual.
              </p>
            </div>

            {/* Instruções Premium */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50 shadow-md">
              <h3 className="font-bold text-lg text-gray-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                Como usar
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-neutral-300">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5 text-lg">•</span>
                  <span>Digite uma mensagem e pressione <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-neutral-700 rounded text-xs font-mono">Enter</kbd> ou clique no botão de enviar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5 text-lg">•</span>
                  <span>Use o botão <ImageIcon className="w-3.5 h-3.5 inline" /> para enviar uma imagem</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5 text-lg">•</span>
                  <span>Use o botão <Mic className="w-3.5 h-3.5 inline" /> para gravar e enviar um áudio</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5 text-lg">•</span>
                  <span>Clique em "Resetar Conversa" para limpar o histórico</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 dark:text-red-400 font-bold mt-0.5 text-lg">⚠</span>
                  <span className="font-medium">Neste teste o agente <strong>não faz agendamentos</strong> (retornará erro). Para testar agendamentos, envie uma mensagem de outro WhatsApp real.</span>
                </li>
              </ul>
            </div>

            {/* Dicas */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-800/50 shadow-md">
              <h3 className="font-bold text-lg text-gray-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Dicas
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">→</span>
                  <span>Teste diferentes tipos de perguntas para validar as respostas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">→</span>
                  <span>Envie imagens para testar o reconhecimento visual</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">→</span>
                  <span>Use áudios para verificar a transcrição de voz</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Coluna Direita - Chat Container Luxo */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-200/80 dark:border-neutral-700/80 flex flex-col transition-theme" style={{ height: "650px" }}>
            {/* Header Premium do Chat */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-4 flex items-center shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md">
                <span className="text-xl font-bold">AI</span>
              </div>
              <div className="ml-4 flex-1">
                <p className="font-bold text-lg">Agente de IA</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse shadow-sm"></div>
                  <p className="text-xs text-white/90 font-medium">Online</p>
                </div>
              </div>
            </div>

            {/* Chat messages */}
<div
  className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gradient-to-b from-gray-50/50 to-gray-100/30 dark:from-neutral-950/50 dark:to-neutral-900/30 backdrop-blur-sm [&::-webkit-scrollbar]:hidden"
  style={{
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  }}
>
  {messages.length === 0 ? (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mb-4 shadow-lg">
        <Sparkles className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
      </div>
      <p className="text-gray-600 dark:text-neutral-400 font-medium mb-1">Nenhuma mensagem ainda</p>
      <p className="text-sm text-gray-500 dark:text-neutral-500">Comece a conversar com o agente!</p>
    </div>
  ) : (
    messages.map((message) => (
      <div
        key={message.id}
        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
      >
        <div
          className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
            message.isUser
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
              : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-100 border border-gray-200 dark:border-neutral-700'
          }`}
        >
          {message.type === 'image' && message.media && (
            <img
              src={message.media}
              alt="Imagem enviada"
              className="max-w-full h-auto rounded-xl mb-2 shadow-sm"
            />
          )}
          {message.type === 'audio' && message.media && (
            <audio controls className="max-w-full mb-2">
              <source src={message.media} type="audio/ogg" />
              Seu navegador não suporta o elemento de áudio.
            </audio>
          )}
<div
  className={`text-sm whitespace-pre-wrap ${message.isUser ? 'text-white' : ''}`}
  dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }}
/>
          <p className={`text-right text-xs mt-1.5 ${message.isUser ? 'text-white/70' : 'text-gray-500 dark:text-neutral-400'}`}>
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
      </div>
    ))
  )}

  {/* Indicador de "digitando" */}
  {isTyping && (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-neutral-400 font-medium ml-1">digitando...</span>
        </div>
      </div>
    </div>
  )}

  <div ref={messagesEndRef} />
</div>

            {/* Input area Premium */}
            <div className="bg-white dark:bg-neutral-800 p-4 border-t-2 border-gray-200 dark:border-neutral-700 transition-theme">
              {isRecording ? (
                <div className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-2xl px-5 py-3 border-2 border-red-200 dark:border-red-800">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-gray-800 dark:text-neutral-200 flex-1 font-medium">Gravando... {formatRecordingTime(recordingTime)}</span>
                  <button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl p-2 transition-all shadow-md"
                  >
                    <StopCircle className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,audio/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isLoading}
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-600 dark:text-neutral-400 disabled:opacity-50 transition-all"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite uma mensagem"
                      className="w-full px-5 py-3 bg-gray-50 dark:bg-neutral-700 border-2 border-gray-200 dark:border-neutral-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500 font-medium"
                      rows={1}
                    />
                  </div>
                  {inputMessage.trim() ? (
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || isUploading}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl p-2.5 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      disabled={isLoading || isUploading}
                      className="p-2.5 rounded-xl bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-600 dark:text-neutral-400 disabled:opacity-50 transition-all"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}