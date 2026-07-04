import React, { useState, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceAssistantProps {
  onTranscript: (text: string) => void;
  textToSpeak?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onTranscript, textToSpeak }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { language, t } = useLanguage();

  const langCodes: Record<string, string> = {
    en: 'en-IN',
    te: 'te-IN',
    hi: 'hi-IN',
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langCodes[language] || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [language, onTranscript]);

  const speakText = useCallback(() => {
    if (!textToSpeak) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCodes[language] || 'en-IN';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [textToSpeak, language, isSpeaking]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={startListening}
        className={`p-3 rounded-xl transition-all duration-300 ${
          isListening
            ? 'bg-red-500/20 text-red-400 animate-pulse ring-2 ring-red-500/50'
            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105'
        }`}
        title={t('voice_input')}
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {textToSpeak && (
        <button
          onClick={speakText}
          className={`p-3 rounded-xl transition-all duration-300 ${
            isSpeaking
              ? 'bg-amber-500/20 text-amber-400 animate-pulse ring-2 ring-amber-500/50'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105'
          }`}
          title={t('speak_answer')}
        >
          {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      )}
    </div>
  );
};

export default VoiceAssistant;
