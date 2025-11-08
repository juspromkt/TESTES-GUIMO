import React, { useEffect, useState } from 'react';
import { AudioPlayer } from '../chat/AudioPlayer';
import { Mic, Save, Loader2, AlertCircle } from 'lucide-react';

interface AudioSettingsSectionProps {
  token: string;
  idAgente: number;
  canEdit: boolean;
}
export default function AudioSettingsSection({ token, idAgente, canEdit }: AudioSettingsSectionProps) {
  const [recordAudio, setRecordAudio] = useState(false);
  const [respondWithAudio, setRespondWithAudio] = useState(false);
  const [voice, setVoice] = useState('');
  const [rate, setRate] = useState(1);
  const [alwaysRespondAudio, setAlwaysRespondAudio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const voices = ['Nova', 'Alloy', 'Echo', 'Fable', 'Onyx', 'Shimmer'];

  const previewUrl = voice ? `/audio/${voice.toLowerCase()}.mp3` : '';

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/audio?id_agente=${idAgente}`, {
          headers: { token }
        });
        if (!response.ok) {
          throw new Error('Erro ao carregar configurações de áudio');
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const settings = data[0];
          setRecordAudio(!!settings.gravar_audio);
          setRespondWithAudio(!!settings.responder_audio_com_audio);
          setAlwaysRespondAudio(!!settings.sempre_responder_com_audio);
          setVoice(settings.voz || '');
          setRate(settings.velocidade ?? 1);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações de áudio:', err);
        setError('Erro ao carregar configurações de áudio');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token, idAgente]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/audio/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          gravar_audio: recordAudio,
          responder_audio_com_audio: respondWithAudio,
          sempre_responder_com_audio: alwaysRespondAudio,
          voz: voice,
          velocidade: rate,
          id_agente: idAgente
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações de áudio');
      }

      setSuccess('Configurações de áudio salvas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar configurações de áudio:', err);
      setError('Erro ao salvar configurações de áudio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Mic className="w-6 h-6 text-emerald-600" />
        Configurações de Ãudio
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={recordAudio}
              onChange={(e) => setRecordAudio(e.target.checked)}
              disabled={!canEdit}
            />
            <div
              className={`w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-emerald-300 peer-checked:bg-emerald-500 transition-all relative ${!canEdit ? 'opacity-50' : ''}`}
            >
              <span className="absolute top-[2px] left-[2px] h-5 w-5 bg-white border border-gray-300 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
            </div>
            <span className="ml-3 text-gray-700">Ativar geração de áudio com IA</span>
          </label>
        </div>


        <div className="flex items-center justify-between">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={respondWithAudio}
              onChange={(e) => setRespondWithAudio(e.target.checked)}
              disabled={!canEdit}
            />
            <div
              className={`w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-emerald-300 peer-checked:bg-emerald-500 transition-all relative ${!canEdit ? 'opacity-50' : ''}`}
            >
              <span className="absolute top-[2px] left-[2px] h-5 w-5 bg-white border border-gray-300 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
            </div>
            <span className="ml-3 text-gray-700">Responder áudio com áudio</span>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={alwaysRespondAudio}
              onChange={(e) => setAlwaysRespondAudio(e.target.checked)}
              disabled={!canEdit}
            />
            <div
              className={`w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-emerald-300 peer-checked:bg-emerald-500 transition-all relative ${!canEdit ? 'opacity-50' : ''}`}
            >
              <span className="absolute top-[2px] left-[2px] h-5 w-5 bg-white border border-gray-300 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
            </div>
            <span className="ml-3 text-gray-700">Sempre responder com áudio</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Voz</label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">Selecione</option>
            {voices.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        {previewUrl && (
          <div className="mt-2">
            <AudioPlayer url={previewUrl} />
          </div>
        )}
      </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
            <span>Velocidade</span>
            <span className="text-gray-500">{rate.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            disabled={!canEdit}
            className="w-full"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}


        {canEdit && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

