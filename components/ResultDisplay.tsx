import React, { useEffect, useState, useRef } from 'react';
import { LabelData, LanguageCode } from '../types';
import { announce, stopSpeaking, speak } from '../utils/tts';
import { vibrate, HapticPatterns } from '../utils/haptics';
import { getTranslation } from '../utils/translations';
import { askProductQuestion } from '../services/geminiService';

interface ResultDisplayProps {
  data: LabelData;
  imageData: string | string[];
  onReset: () => void;
  language: LanguageCode;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, imageData, onReset, language }) => {
  const t = getTranslation(language);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);
  
  // Ensure the warning text exists if it's medicine, handling potential API inconsistencies
  let safeWarnings = data.warnings;
  const verifyText = t.medicineWarningPrefix;

  if (data.is_medicine && !safeWarnings.toLowerCase().includes(verifyText.toLowerCase())) {
      const existingWarnings = (safeWarnings === "None" || safeWarnings === "कोई नहीं") ? "" : safeWarnings;
      safeWarnings = `${verifyText} ${existingWarnings}`;
  }

  // Check if ingredients exist and are not "None"
  const hasIngredients = data.ingredients && data.ingredients !== "None" && data.ingredients !== "कोई नहीं";

  // Check new fields validity (avoid "N/A" or "None")
  const hasVisuals = data.visual_details && data.visual_details !== "N/A" && data.visual_details !== "None";
  const hasSeal = data.seal_status && data.seal_status !== "N/A" && data.seal_status !== "None" && data.seal_status !== "Unknown";
  const hasQuantity = data.quantity_estimate && data.quantity_estimate !== "N/A" && data.quantity_estimate !== "None";

  // Calculate confidence percentage
  const confidencePercent = data.confidence_score !== undefined ? Math.round(data.confidence_score * 100) : null;

  useEffect(() => {
    // Only speak the main analysis on mount if we haven't asked a question yet
    if (showQuestionInput) return;

    // Construct the spoken message
    const messageParts: string[] = [];
    
    // 1. Critical Alerts
    if (data.is_medicine) {
        messageParts.push(`${t.cautionMedicine} ${t.medicineWarningPrefix}`);
    }
    
    // Safety check for low confidence
    if (data.confidence_score !== undefined && data.confidence_score < 0.5) {
        messageParts.push(t.noteUnclear);
    }

    // 2. Item Name
    messageParts.push(data.item_name);

    // 3. Information Order
    if (data.is_medicine) {
        // For medicine: Warnings first, then quantity
        messageParts.push(`${t.warningsLabel}: ${safeWarnings}`);
        if (hasQuantity) messageParts.push(`${t.quantityEstimateLabel}: ${data.quantity_estimate}`);
        messageParts.push(`${t.expiryLabel}: ${data.expiry}`);
        messageParts.push(`${t.usageLabel}: ${data.usage}`);
    } else {
        // For regular items: Visuals first, then usage, then warnings
        if (hasVisuals) messageParts.push(data.visual_details!);
        if (hasSeal) messageParts.push(`${t.sealStatusLabel}: ${data.seal_status}`);
        
        messageParts.push(`${t.expiryLabel}: ${data.expiry}`);
        messageParts.push(`${t.usageLabel}: ${data.usage}`);
        messageParts.push(`${t.warningsLabel}: ${safeWarnings}`);
    }

    const fullMessage = messageParts.join('. ');
    
    vibrate(HapticPatterns.SUCCESS);
    announce(fullMessage, language);

    return () => {
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleScreenClick = (e: React.MouseEvent) => {
    // If clicking on input or button, don't trigger the reset/stop
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button')) return;

    // For simplicity, tapping background stops speaking.
    stopSpeaking();
  };

  const handleStartListening = () => {
    // @ts-ignore - SpeechRecognition is not standard in all TS configs yet
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      announce(t.micError, language);
      return;
    }

    if (isListening) {
        // Stop logic handled by onend usually, but we can force stop
        setIsListening(false);
        return;
    }

    stopSpeaking();
    
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      vibrate(HapticPatterns.TAP);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      vibrate(HapticPatterns.SUCCESS);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      vibrate(HapticPatterns.ERROR);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleAskQuestion = async () => {
      if (!question.trim()) return;
      
      setIsAsking(true);
      setAnswer(null);
      stopSpeaking();
      announce(t.thinking, language);
      vibrate(HapticPatterns.TAP);

      try {
          const result = await askProductQuestion(imageData, data, question, language);
          setAnswer(result);
          announce(`${t.answerTitle}: ${result}`, language);
          vibrate(HapticPatterns.SUCCESS);
          
          // Scroll answer into view
          setTimeout(() => {
              answerRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      } catch (err) {
          console.error(err);
          announce(t.askError, language);
          vibrate(HapticPatterns.ERROR);
      } finally {
          setIsAsking(false);
          setQuestion(''); // Clear input
      }
  };

  const WarningBlock = () => (
    <div className={`p-4 rounded-lg border ${safeWarnings !== 'None' && safeWarnings !== 'कोई नहीं' ? 'bg-red-900 border-red-700 bg-opacity-30' : 'bg-yellow-900 border-yellow-800 bg-opacity-20'}`}>
        <h2 className={`text-sm uppercase tracking-widest mb-1 ${safeWarnings !== 'None' && safeWarnings !== 'कोई नहीं' ? 'text-red-400' : 'text-yellow-600'}`}>
            {data.is_medicine ? t.criticalWarningLabel : t.warningsLabel}
        </h2>
        <p className={`text-xl leading-snug ${safeWarnings !== 'None' && safeWarnings !== 'कोई नहीं' ? 'text-red-300' : ''}`}>
            {safeWarnings}
        </p>
    </div>
  );

  return (
    <div 
      className="w-full min-h-screen bg-black text-yellow-400 p-6 flex flex-col overflow-y-auto"
      onClick={handleScreenClick}
      role="main"
    >
      <div className="space-y-8 mt-4 pb-48">
        <div>
          <h1 className="text-sm uppercase tracking-widest text-yellow-600 mb-1">{t.itemLabel}</h1>
          <p className="text-4xl font-bold leading-tight">{data.item_name}</p>
          
          {/* Visual Details (Non-medicine) */}
          {hasVisuals && !data.is_medicine && (
               <p className="text-lg opacity-80 mt-2 italic">{data.visual_details}</p>
          )}

          {/* Confidence Score Indicator */}
          {confidencePercent !== null && (
            <div className="flex items-center gap-3 mt-3 opacity-90">
                <div className="w-24 h-2 bg-gray-800 rounded-full border border-yellow-900 overflow-hidden">
                    <div 
                        className={`h-full ${confidencePercent > 80 ? 'bg-green-500' : confidencePercent > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${confidencePercent}%` }}
                    />
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${confidencePercent > 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {t.accuracyLabel} {confidencePercent}%
                </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* If medicine, show warnings FIRST */}
          {data.is_medicine && <WarningBlock />}

          {/* Medicine Quantity Estimate */}
          {data.is_medicine && hasQuantity && (
            <div className="bg-blue-900 bg-opacity-20 p-4 rounded-lg border border-blue-800">
                <h2 className="text-sm uppercase tracking-widest text-blue-400 mb-1">{t.quantityEstimateLabel}</h2>
                <p className="text-2xl font-semibold text-blue-200">{data.quantity_estimate}</p>
            </div>
          )}

          {/* Seal Status (Non-Medicine) */}
          {!data.is_medicine && hasSeal && (
            <div className="bg-yellow-900 bg-opacity-20 p-4 rounded-lg border border-yellow-800">
                <h2 className="text-sm uppercase tracking-widest text-yellow-600 mb-1">{t.sealStatusLabel}</h2>
                <p className="text-xl font-semibold">{data.seal_status}</p>
            </div>
          )}

          <div className="bg-yellow-900 bg-opacity-20 p-4 rounded-lg border border-yellow-800">
            <h2 className="text-sm uppercase tracking-widest text-yellow-600 mb-1">{t.expiryLabel}</h2>
            <p className="text-2xl font-semibold">{data.expiry}</p>
          </div>

          <div className="bg-yellow-900 bg-opacity-20 p-4 rounded-lg border border-yellow-800">
             <h2 className="text-sm uppercase tracking-widest text-yellow-600 mb-1">{t.usageLabel}</h2>
             <p className="text-xl leading-snug">{data.usage}</p>
          </div>

          {hasIngredients && (
             <div className="bg-yellow-900 bg-opacity-20 p-4 rounded-lg border border-yellow-800">
               <h2 className="text-sm uppercase tracking-widest text-yellow-600 mb-1">{t.ingredientsLabel}</h2>
               <p className="text-lg leading-snug opacity-90">{data.ingredients}</p>
             </div>
          )}
          
           {/* If not medicine, show warnings LAST */}
           {!data.is_medicine && <WarningBlock />}

           {/* Answer Display */}
           {answer && (
               <div ref={answerRef} className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border border-blue-700 animate-fade-in mt-4">
                   <h2 className="text-sm uppercase tracking-widest text-blue-400 mb-1">{t.answerTitle}</h2>
                   <p className="text-xl leading-snug text-blue-100">{answer}</p>
               </div>
           )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-black bg-opacity-95 p-4 border-t border-yellow-900 flex flex-col gap-3">
        
        {/* Question Input Area */}
        {showQuestionInput ? (
            <div className="flex flex-col gap-3 animate-slide-up">
                <div className="flex gap-2 w-full">
                    {/* Mic Button */}
                    <button
                        onClick={handleStartListening}
                        className={`p-3 rounded-lg border ${isListening ? 'bg-red-600 border-red-500 animate-pulse' : 'bg-gray-800 border-gray-600'}`}
                        aria-label={isListening ? t.listening : t.micButton}
                        title={t.micButton}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                         </svg>
                    </button>

                    <input 
                        type="text" 
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={isListening ? t.listening : t.questionPlaceholder}
                        className="flex-1 bg-gray-900 text-yellow-400 border border-yellow-600 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAskQuestion();
                        }}
                    />
                    <button 
                        onClick={handleAskQuestion}
                        disabled={isAsking || !question.trim()}
                        className="bg-yellow-500 text-black font-bold px-4 py-3 rounded-lg disabled:opacity-50 whitespace-nowrap"
                    >
                        {isAsking ? '...' : t.sendButton}
                    </button>
                </div>
            </div>
        ) : (
            <button 
                onClick={() => {
                    setShowQuestionInput(true);
                    vibrate(HapticPatterns.TAP);
                }}
                className="w-full bg-yellow-900 bg-opacity-40 text-yellow-400 border border-yellow-600 font-bold py-4 rounded-lg text-lg"
            >
                {t.askButton}
            </button>
        )}

        <button 
            onClick={() => {
                vibrate(HapticPatterns.TAP);
                stopSpeaking();
                onReset();
            }}
            className="w-full bg-yellow-500 text-black font-bold py-4 rounded-lg text-xl"
        >
            {t.tapAgain}
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;