import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical, Upload, Loader2, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FAQ {
  ordem: number;
  pergunta: string;
  resposta: string;
  objectMidia?: string;
}

interface SortableFAQItemProps {
  faq: FAQ;
  onRemove: () => void;
  onUpdate: (ordem: number, field: 'pergunta' | 'resposta', value: string) => void;
  onMediaUpload: (file: File) => void;
  isUploading: boolean;
}

export function SortableFAQItem({ faq, onRemove, onUpdate, onMediaUpload, isUploading }: SortableFAQItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: faq.ordem });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onMediaUpload(acceptedFiles[0]);
    }
  }, [onMediaUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 64 * 1024 * 1024, // 64MB
    accept: {
      'image/*': [],
      'video/*': [],
      'audio/*': [],
      'application/pdf': []
    }
  });

  const renderMedia = () => {
    if (!faq.objectMidia) return null;

    const url = faq.objectMidia;
    if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return <img src={url} alt="Mídia" className="max-w-full h-auto rounded-lg" />;
    } else if (url.match(/\.(mp4|webm)$/i)) {
      return <video src={url} controls className="max-w-full rounded-lg" />;
    } else if (url.match(/\.(mp3|wav)$/i)) {
      return <audio src={url} controls className="w-full" />;
    } else if (url.match(/\.pdf$/i)) {
      return (
        <div className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <a href={url} target="_blank" rel="noopener noreferrer">Ver PDF</a>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-300 rounded-lg p-4"
    >
      <div className="flex items-start gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pergunta {faq.ordem}
            </label>
            <input
              type="text"
              value={faq.pergunta}
              onChange={(e) => onUpdate(faq.ordem, 'pergunta', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Digite a pergunta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resposta
            </label>
            <textarea
              value={faq.resposta}
              onChange={(e) => onUpdate(faq.ordem, 'resposta', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Digite a resposta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mídia
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Fazendo upload...</span>
                </div>
              ) : faq.objectMidia ? (
                <div className="space-y-2">
                  {renderMedia()}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate(faq.ordem, 'objectMidia', '');
                    }}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                    Remover mídia
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Upload className="w-8 h-8 mb-2" />
                  <p className="text-sm text-center">
                    Arraste e solte arquivos aqui, ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Suporta imagens, vídeos, áudios e PDFs (máx. 64MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}