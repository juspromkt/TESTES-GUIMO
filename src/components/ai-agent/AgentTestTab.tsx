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
  Check
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
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 mb-6 transition-theme">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Teste do Agente</h2>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-300 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col">
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">
              Use esta interface para testar seu agente de IA. Envie mensagens de texto, imagens ou áudios e veja como o agente responde.
            </p>
            <div className="bg-gray-100 dark:bg-neutral-700 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-gray-700 dark:text-neutral-200 mb-2">Instruções:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-neutral-300 space-y-1">
                <li>Digite uma mensagem e pressione Enter ou clique no botão de enviar</li>
                <li>Use o botão de imagem para enviar uma imagem</li>
                <li>Use o botão de microfone para gravar e enviar um áudio</li>
                <li>Clique em "Resetar Conversa" para limpar o histórico</li>
              </ul>
            </div>
          </div>

          <div className="w-full md:w-[380px] bg-gray-100 dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-md border border-gray-300 dark:border-neutral-700 flex flex-col transition-theme" style={{ height: "600px" }}>
            {/* WhatsApp-like header */}
            <div className="bg-emerald-600 text-white p-3 flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold">AI</span>
              </div>
              <div className="ml-3">
                <p className="font-medium">Agente de IA</p>
                <p className="text-xs text-white/80">Online</p>
              </div>
            </div>

            {/* Chat messages */}
<div
  className="flex-1 bg-[#e5ddd5] dark:bg-neutral-950 bg-opacity-30 p-3 overflow-y-auto flex flex-col gap-3 transition-theme"
  style={{
    backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-light_a4be512e7195b6b733d9110b408f075d.png')",
    height: "calc(600px - 132px)"
  }}
>
  {messages.length === 0 ? (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-neutral-400 text-sm">
      <p>Nenhuma mensagem ainda.</p>
      <p>Comece a conversar com o agente!</p>
    </div>
  ) : (
    messages.map((message) => (
      <div
        key={message.id}
        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-2 ${
            message.isUser
              ? 'bg-emerald-100 dark:bg-emerald-900 text-gray-800 dark:text-neutral-100'
              : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-100'
          }`}
        >
          {message.type === 'image' && message.media && (
            <img
              src={message.media}
              alt="Imagem enviada"
              className="max-w-full h-auto rounded mb-1"
            />
          )}
          {message.type === 'audio' && message.media && (
            <audio controls className="max-w-full mb-1">
              <source src={message.media} type="audio/ogg" />
              Seu navegador não suporta o elemento de áudio.
            </audio>
          )}
<div
  className="text-sm whitespace-pre-wrap"
  dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }}
/>
          <p className="text-right text-xs text-gray-500 dark:text-neutral-400 mt-1">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
      </div>
    ))
  )}

  {/* Indicador de "digitando" */}
  {isTyping && (
    <div className="flex justify-start">
      <div className="bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-100 rounded-lg p-2 max-w-[80%]">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-xs text-gray-500 dark:text-neutral-400 ml-2">digitando...</span>
        </div>
      </div>
    </div>
  )}

  <div ref={messagesEndRef} />
</div>

            {/* Input area */}
            <div className="bg-gray-100 dark:bg-neutral-800 p-3 border-t border-gray-300 dark:border-neutral-700 transition-theme">
              {isRecording ? (
                <div className="flex items-center gap-2 bg-white dark:bg-neutral-700 rounded-full px-4 py-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 dark:text-neutral-200 flex-1">Gravando... {formatRecordingTime(recordingTime)}</span>
                  <button
                    onClick={stopRecording}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <StopCircle className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
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
                    className="text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 disabled:opacity-50"
                  >
                    <ImageIcon className="w-6 h-6" />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite uma mensagem"
                      className="w-full px-4 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-gray-900 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-400"
                      rows={1}
                      disabled={isLoading || isUploading}
                    />
                  </div>
                  {inputMessage.trim() ? (
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || isUploading}
                      className="bg-emerald-500 text-white rounded-full p-2 hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Send className="w-6 h-6" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      disabled={isLoading || isUploading}
                      className="text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 disabled:opacity-50"
                    >
                      <Mic className="w-6 h-6" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}