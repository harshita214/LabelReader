import React, { useEffect } from 'react';
import { announce } from '../utils/tts';
import { LanguageCode } from '../types';
import { getTranslation } from '../utils/translations';

interface LoadingViewProps {
  language: LanguageCode;
}

const LoadingView: React.FC<LoadingViewProps> = ({ language }) => {
  const t = getTranslation(language);

  useEffect(() => {
    announce(t.analyzing, language);
  }, [language, t.analyzing]);

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-24 h-24 border-8 border-yellow-900 border-t-yellow-400 rounded-full animate-spin mb-8"></div>
      <p className="text-yellow-400 text-3xl font-bold animate-pulse">{t.analyzingShort}</p>
    </div>
  );
};

export default LoadingView;