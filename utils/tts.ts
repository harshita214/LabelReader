import { LanguageCode } from "../types";

let synth: SpeechSynthesis | null = null;
let voices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined') {
  synth = window.speechSynthesis;
  
  const loadVoices = () => {
    voices = synth?.getVoices() || [];
  };

  // Initial load
  loadVoices();
  
  // Listener for async loading (common in Chrome/Android)
  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
}

export const speak = (text: string, force: boolean = true, lang: LanguageCode = 'en') => {
  if (!synth) return;

  if (force) {
    synth.cancel();
  }

  // Ensure voices are loaded before speaking
  if (voices.length === 0) {
      voices = synth.getVoices();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Default to requested lang locale
  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';

  // Explicitly find a matching voice object if available.
  // This is crucial for Android/Chrome to actually switch accents.
  let targetVoice: SpeechSynthesisVoice | undefined;

  if (lang === 'hi') {
    // Priority: Exact match hi-IN -> Starts with hi -> Any Google Hindi
    targetVoice = voices.find(v => v.lang === 'hi-IN') || 
                  voices.find(v => v.lang.startsWith('hi'));
  } else {
    targetVoice = voices.find(v => v.lang === 'en-US') || 
                  voices.find(v => v.lang.startsWith('en'));
  }

  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  utterance.rate = 1.0; 
  utterance.pitch = 1.0;
  
  synth.speak(utterance);
};

export const stopSpeaking = () => {
  if (synth) {
    synth.cancel();
  }
};

export const announce = (text: string, lang: LanguageCode = 'en') => {
    speak(text, true, lang);
};