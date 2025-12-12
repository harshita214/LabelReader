import React, { useState } from 'react';
import CameraCapture from './components/CameraCapture';
import ResultDisplay from './components/ResultDisplay';
import LoadingView from './components/LoadingView';
import { AppState, LabelData, LanguageCode } from './types';
import { analyzeImage } from './services/geminiService';
import { announce } from './utils/tts';
import { vibrate, HapticPatterns } from './utils/haptics';
import { getTranslation } from './utils/translations';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [labelData, setLabelData] = useState<LabelData | null>(null);
  const [imageData, setImageData] = useState<string | string[] | null>(null);
  const [language, setLanguage] = useState<LanguageCode>('en');

  const t = getTranslation(language);

  const handleStart = () => {
    setAppState(AppState.CAMERA);
  };

  const handleCapture = async (capturedImage: string | string[]) => {
    setImageData(capturedImage); // Store image(s) for Q&A
    setAppState(AppState.ANALYZING);
    try {
      const data = await analyzeImage(capturedImage, language);
      setLabelData(data);
      setAppState(AppState.RESULT);
    } catch (error) {
      console.error(error);
      vibrate(HapticPatterns.ERROR);
      announce(t.analysisError, language);
      setAppState(AppState.CAMERA); // Go back to camera on error
    }
  };

  const handleReset = () => {
    setLabelData(null);
    setImageData(null);
    setAppState(AppState.CAMERA);
  };

  const handleError = (msg: string) => {
    announce(msg, language);
    // Stay in IDLE or show error UI if strict
  };

  const toggleLanguage = (e: React.MouseEvent, lang: LanguageCode) => {
    e.stopPropagation(); // Prevent triggering the "Start" click on the background
    setLanguage(lang);
    announce(lang === 'hi' ? "हिंदी चुनी गई" : "Language set to English", lang);
    vibrate(HapticPatterns.TAP);
  };

  // Initial Welcome Screen
  if (appState === AppState.IDLE) {
    return (
      <div 
        className="w-full h-screen bg-black flex flex-col items-center justify-between p-6 text-center cursor-pointer relative"
        onClick={handleStart}
        role="button"
        tabIndex={0}
        aria-label={`${t.welcomeTitle}. ${t.welcomeSubtitle}`}
      >
        <div className="mt-20 flex flex-col items-center">
          <h1 className="text-6xl font-bold text-yellow-400 mb-4">{t.welcomeTitle}</h1>
          <p className="text-xl text-yellow-200">{t.welcomeSubtitle}</p>
        </div>

        <div className="mb-20 w-full max-w-sm flex flex-col gap-4">
           <div className="w-24 h-24 rounded-full bg-yellow-500 animate-ping opacity-75 self-center mb-8"></div>
           
           {/* Language Toggles */}
           <div className="flex gap-4 w-full z-10">
             <button 
               onClick={(e) => toggleLanguage(e, 'en')}
               className={`flex-1 py-4 rounded-lg font-bold text-xl border-2 ${language === 'en' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-transparent text-yellow-400 border-yellow-600'}`}
             >
               English
             </button>
             <button 
               onClick={(e) => toggleLanguage(e, 'hi')}
               className={`flex-1 py-4 rounded-lg font-bold text-xl border-2 ${language === 'hi' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-transparent text-yellow-400 border-yellow-600'}`}
             >
               हिंदी
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.CAMERA) {
    return <CameraCapture onCapture={handleCapture} onError={handleError} language={language} />;
  }

  if (appState === AppState.ANALYZING) {
    return <LoadingView language={language} />;
  }

  if (appState === AppState.RESULT && labelData && imageData) {
    return <ResultDisplay data={labelData} imageData={imageData} onReset={handleReset} language={language} />;
  }

  return null;
};

export default App;