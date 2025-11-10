import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, StopCircle, FileText, Smile } from "lucide-react";
import { apiClient } from "./utils/api";
import type { Message } from "./utils/api";
import { toast } from "sonner";
import { resolveJid } from "../../utils/jidMapping";
import * as Popover from "@radix-ui/react-popover";

interface MessageInputProps {
  remoteJid: string;
  onMessageSent: (newMessages: Message[]) => void;
  onTempMessage?: (msg: Message) => void;
  onMessageError?: (tempId: string) => void;
  onReplaceTempMessage?: (tempId: string, newMessages: Message[]) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  replyTo?: Message | null;
  onClearReply?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  isBusiness?: boolean;
  onTemplateClick?: () => void;
}

export function MessageInput({
 remoteJid,
  onMessageSent,
  onTempMessage,
  onMessageError,
  onReplaceTempMessage,
  fileInputRef,
  replyTo,
  onClearReply,
  inputRef,
  isBusiness,
  onTemplateClick,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const internalRef = useRef<HTMLInputElement>(null);
  const internalInputRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || internalInputRef; // Usar a ref passada ou interna
  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    base64: string;
    mediatype: "image" | "video" | "document";
    mimetype: string;
  } | null>(null);
const [audioPreview, setAudioPreview] = useState<{ blob: Blob; url: string; base64: string } | null>(null);

   const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

const reader = new FileReader();
reader.onloadend = async () => {
  const base64data = reader.result?.toString().split(",")[1];

  if (base64data) {
    setAudioPreview({
      blob: audioBlob,
      url: URL.createObjectURL(audioBlob),
      base64: base64data,
    });
  }
};

reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);

      // Iniciar contador de tempo
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast("Gravando... 🎙️ (clique para parar)");

    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      toast.error("Erro ao acessar microfone");
    }
  };

  // FUNÇÃO PARA PARAR A GRAVAÇÃO
  const stopRecording = () => {
    // Parar o contador
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
    }
  };

  const handleSendMessage = () => {
    if ((!message.trim() && !pendingFile && !audioPreview) || !token) return;

    const tempId = `temp-${Date.now()}`;
    let tempMessage: Message | null = null;
    const timestamp = Math.floor(Date.now() / 1000);
    const jid = resolveJid(remoteJid);

    if (audioPreview) {
      tempMessage = {
        id: tempId,
        key: { id: tempId, fromMe: true, remoteJid: jid },
        messageType: 'audioMessage',
        message: { mediaUrl: audioPreview.url },
        messageTimestamp: timestamp,
        status: 'pending'
      };
      onTempMessage?.(tempMessage);
    } else if (pendingFile) {
      const msgType =
        pendingFile.mediatype === 'image'
          ? 'imageMessage'
          : pendingFile.mediatype === 'video'
          ? 'videoMessage'
          : 'documentMessage';
      tempMessage = {
        id: tempId,
        key: { id: tempId, fromMe: true, remoteJid: jid },
        messageType: msgType,
        message: {
          mediaUrl: `data:${pendingFile.mimetype};base64,${pendingFile.base64}`,
        },
        messageTimestamp: timestamp,
        status: 'pending'
      };
      onTempMessage?.(tempMessage);
    } else {
      tempMessage = {
        id: tempId,
        key: { id: tempId, fromMe: true, remoteJid: jid },
        messageType: 'conversation',
        message: { conversation: message.trim() },
        messageTimestamp: timestamp,
        status: 'pending'
      };
      onTempMessage?.(tempMessage);
    }

    setMessage('');
    setPendingFile(null);
    setAudioPreview(null);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 10);

    (async () => {
      try {
        let sentMessages: Message[] = [];
        if (audioPreview) {
          console.log('[MessageInput] Enviando áudio...', { jid, mimetype: 'audio/mp3' });
          sentMessages = await apiClient.sendMessage(token, {
            jid: jid,
            mediatype: 'audio',
            mimetype: 'audio/mp3',
            base64: audioPreview.base64,
            fileName: `audio-${Date.now()}.mp3`,
            resposta: replyTo
              ? {
                  idMensagem: replyTo.key.id,
                  mensagem: replyTo.message.conversation || '',
                }
              : undefined,
          });
        } else if (pendingFile) {
          console.log('[MessageInput] Enviando arquivo...', {
            jid,
            mediatype: pendingFile.mediatype,
            mimetype: pendingFile.mimetype,
            fileName: pendingFile.file.name,
            size: pendingFile.file.size
          });
          sentMessages = await apiClient.sendMessage(token, {
            jid: jid,
            mediatype: pendingFile.mediatype,
            mimetype: pendingFile.mimetype,
            base64: pendingFile.base64,
            resposta: replyTo
              ? {
                  idMensagem: replyTo.key.id,
                  mensagem: replyTo.message.conversation || '',
                }
              : undefined,
            fileName: pendingFile.file.name,
          });
        } else {
          console.log('[MessageInput] Enviando texto...', { jid, text: message.trim() });
          sentMessages = await apiClient.sendMessage(token, {
            jid: jid,
            type: 'text',
            resposta: replyTo
              ? {
                  idMensagem: replyTo.key.id,
                  mensagem: replyTo.message.conversation || '',
                }
              : undefined,
            text: message.trim(),
          });
        }

        console.log('[MessageInput] Mensagens enviadas com sucesso:', sentMessages);
        onReplaceTempMessage?.(tempId, sentMessages);
        onMessageSent(sentMessages);

        // Atualizar lastMessage no ChatList
        if (sentMessages && sentMessages.length > 0) {
          const lastMsg = sentMessages[sentMessages.length - 1];
          const { updateChatLastMessage } = await import('../../utils/chatUpdateEvents');
          updateChatLastMessage(jid, {
            messageType: lastMsg.messageType,
            fromMe: true,
            conversation: lastMsg.message?.conversation || '',
            messageTimestamp: lastMsg.messageTimestamp,
            ...lastMsg.message
          });
        }

        toast.success('✨', { duration: 1000 });
      } catch (error) {
        console.error('[MessageInput] Erro ao enviar:', error);
        toast.error('Erro ao enviar');
        onMessageError?.(tempId);
      }
    })();
  };

  
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    // Validação de tamanho
    const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Arquivo muito grande! Tamanho máximo: 16MB. Tamanho do arquivo: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      if (fileInputRef?.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1];

        let mediatype: "image" | "video" | "document" = "document";
        if (file.type.startsWith("image/")) mediatype = "image";
        else if (file.type.startsWith("video/")) mediatype = "video";

        setPendingFile({
          file,
          base64: base64Data,
          mediatype,
          mimetype: file.type,
        });

        toast.success(`Arquivo selecionado: ${file.name}`);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Erro ao processar arquivo");
    }

    if (fileInputRef?.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Lista de emojis mais usados (estilo WhatsApp)
  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
    "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
    "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
    "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥",
    "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
    "🤧", "🥵", "🥶", "😶‍🌫️", "🥴", "😵", "🤯", "🤠", "🥳", "😎",
    "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺",
    "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣",
    "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "👍",
    "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞", "🤟",
    "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐",
    "✋", "🖖", "👌", "🤏", "✊", "👊", "🤛", "🤜", "💪", "❤️",
    "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️",
    "💕", "💞", "💓", "💗", "💖", "💘", "💝", "🔥", "✨", "💫"
  ];

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  // Auto-resize do textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset para altura mínima primeiro
      textarea.style.height = '36px';

      // Se há conteúdo e precisa de mais espaço, expande até no máximo ~2 linhas
      if (message.trim() && textarea.scrollHeight > 36) {
        textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
      }
    }
  }, [message]);

  // Limpar intervalo de gravação ao desmontar
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Formatar tempo de gravação (mm:ss)
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

 return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 relative z-[9998] transition-colors">
      {/* Preview de arquivo selecionado */}
      {pendingFile && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {pendingFile.mediatype === 'image' && (
              <img
                src={`data:${pendingFile.mimetype};base64,${pendingFile.base64}`}
                alt="preview"
                className="w-12 h-12 object-cover rounded"
              />
            )}
            {pendingFile.mediatype === 'video' && (
              <video
                src={`data:${pendingFile.mimetype};base64,${pendingFile.base64}`}
                className="w-12 h-12 object-cover rounded"
                controls={false}
              />
            )}
            {pendingFile.mediatype === 'document' && (
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{pendingFile.file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{(pendingFile.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => setPendingFile(null)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Remover arquivo"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Preview de áudio gravado */}
      {audioPreview && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <audio controls src={audioPreview.url} className="flex-1 h-8" />
            <button
              onClick={() => setAudioPreview(null)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Remover áudio"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Responder a mensagem */}
      {replyTo && (
        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Respondendo</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                {replyTo.message.conversation?.slice(0, 50)}...
              </p>
            </div>
            <button
              onClick={() => onClearReply?.()}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded transition-colors"
              title="Cancelar resposta"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input principal */}
      <div className="flex items-center gap-2 px-3 py-2">
        <input
          ref={fileInputRef || internalRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Lado esquerdo: Emoji + Anexo */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Botão Emoji com Popover */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Emoji"
                aria-label="Selecionar emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Content
                className="z-50 bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden w-[300px] md:w-[350px] animate-in fade-in-0 zoom-in-95 transition-colors duration-200"
                sideOffset={8}
                align="start"
              >
                <div className="p-2 md:p-3">
                  <div className="grid grid-cols-7 md:grid-cols-8 gap-0.5 md:gap-1 max-h-[250px] md:max-h-[300px] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl md:text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded p-1.5 md:p-2 transition-colors touch-manipulation"
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          {/* Botão Anexar */}
          <button
            type="button"
            onClick={() => (fileInputRef || internalRef).current?.click()}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Anexar arquivo"
            aria-label="Anexar arquivo"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Botão Template (se business) */}
          {isBusiness && (
            <button
              type="button"
              onClick={onTemplateClick}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Template"
              aria-label="Selecionar template"
            >
              <FileText className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Campo de input */}
        {recording ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg py-2 px-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {formatRecordingTime(recordingTime)}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Gravando...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem"
              rows={1}
              className="w-full resize-none rounded-lg bg-transparent px-3 py-2 text-[15px] text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none overflow-y-auto"
              style={{
                minHeight: '36px',
                maxHeight: '100px'
              }}
            />
          </div>
        )}

        {/* Lado direito: Áudio ou Enviar */}
        {message.trim() || pendingFile || audioPreview ? (
          <button
            type="button"
            onClick={handleSendMessage}
            className="p-2 text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg flex-shrink-0 transition-colors"
            title="Enviar"
            aria-label="Enviar mensagem"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={`p-2 transition-colors rounded-lg flex-shrink-0 ${
              recording
                ? 'text-white bg-red-500 hover:bg-red-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={recording ? "Parar gravação" : "Gravar áudio"}
            aria-label={recording ? "Parar gravação" : "Gravar áudio"}
          >
            {recording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}