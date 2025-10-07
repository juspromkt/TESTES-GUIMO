import { useState, useRef } from "react";
import { Send, Paperclip, Mic, StopCircle, FileText } from "lucide-react";
import { apiClient } from "./utils/api";
import type { Message } from "./utils/api";
import { toast } from "sonner";
import { resolveJid } from "../../utils/jidMapping";

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
      toast("Gravando... 🎙️ (clique para parar)");

    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      toast.error("Erro ao acessar microfone");
    }
  };

  // FUNÇÃO PARA PARAR A GRAVAÇÃO
  const stopRecording = () => {
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

        onReplaceTempMessage?.(tempId, sentMessages);
        onMessageSent(sentMessages);
        toast.success('✨', { duration: 1000 });
      } catch (error) {
        console.error('Erro ao enviar:', error);
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
 return (
    <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-gray-100">
      {pendingFile && (
        <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-50 border border-gray-200 rounded-2xl">
          <div className="flex items-center space-x-3">
            {pendingFile.mediatype === 'image' && (
              <img
                src={`data:${pendingFile.mimetype};base64,${pendingFile.base64}`}
                alt="preview"
                className="w-16 h-16 object-cover rounded-xl shadow-md"
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">Arquivo selecionado</p>
              <p className="text-xs text-gray-600 truncate">{pendingFile.file.name}</p>
            </div>
          </div>
        </div>
      )}

      {replyTo && (
        <div className="mb-2 px-4 py-2 bg-gray-100 border-l-4 border-gray-400 text-gray-700 rounded">
          Respondendo: {replyTo.message.conversation?.slice(0, 40)}...
          <button
            onClick={() => onClearReply?.()}
            className="ml-2 text-gray-600 hover:text-gray-800 text-xs underline"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="flex items-end space-x-3">
        <input
          ref={fileInputRef || internalRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isBusiness && (
          <button
            type="button"
            onClick={onTemplateClick}
            className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-700 shadow-lg hover:scale-105"
          >
            <FileText className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => (fileInputRef || internalRef).current?.click()}
          className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-700 shadow-lg hover:scale-105"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          className={`p-3 ${recording ? 'bg-red-500' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white rounded-2xl hover:from-gray-600 hover:to-gray-700 shadow-lg hover:scale-105`}
        >
          {recording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {audioPreview ? (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 border border-gray-300 rounded-2xl mb-3">
            <audio controls src={audioPreview.url} className="w-40 h-8" />
            <div className="flex flex-col space-y-1">
              <button
                onClick={handleSendMessage}
                className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Enviar
              </button>
              <button
                onClick={() => setAudioPreview(null)}
                className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : !recording ? (
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              rows={1}
              autoFocus
              className="w-full resize-none rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-sm px-4 py-3 pr-12 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSendMessage}
          disabled={!message.trim() && !pendingFile && !audioPreview}
          className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-700 shadow-lg hover:scale-105 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}