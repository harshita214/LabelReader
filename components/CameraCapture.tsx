import React, { useRef, useEffect, useState, useCallback } from 'react';
import { announce, stopSpeaking } from '../utils/tts';
import { vibrate, HapticPatterns } from '../utils/haptics';
import { LanguageCode } from '../types';
import { getTranslation } from '../utils/translations';

interface CameraCaptureProps {
  onCapture: (imageData: string | string[]) => void;
  onError: (msg: string) => void;
  language: LanguageCode;
}

type ScanMode = 'quick' | 'full';

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onError, language }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('quick');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0); // 0 to 100
  const framesRef = useRef<string[]>([]);
  
  const t = getTranslation(language);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer back camera
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      announce(t.cameraReady, language);
      vibrate(HapticPatterns.READY);
    } catch (err) {
      console.error("Camera access error:", err);
      onError(t.cameraPermission);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      return imageData.split(',')[1];
    }
    return null;
  };

  const handleCapture = useCallback(() => {
    vibrate(HapticPatterns.TAP);
    stopSpeaking(); 

    if (scanMode === 'quick') {
       // Single frame capture
       const frame = captureFrame();
       if (frame) {
         onCapture(frame);
       }
    } else {
       // Full Scan Logic
       if (isRecording) return; // Prevent double tap

       setIsRecording(true);
       framesRef.current = [];
       setRecordingProgress(0);
       announce(t.rotateInstruction, language);
       vibrate(HapticPatterns.TAP); // Initial tap

       // Capture duration: 4 seconds
       // Interval: 600ms -> approx 6-7 frames
       const totalTime = 4000;
       const intervalTime = 600;
       let elapsed = 0;

       const interval = setInterval(() => {
           elapsed += intervalTime;
           setRecordingProgress(Math.min((elapsed / totalTime) * 100, 100));
           
           const frame = captureFrame();
           if (frame) framesRef.current.push(frame);
           
           // Slight vibration to indicate recording
           if (navigator.vibrate) navigator.vibrate(20);

           if (elapsed >= totalTime) {
               clearInterval(interval);
               setIsRecording(false);
               vibrate(HapticPatterns.SUCCESS);
               announce(t.scanComplete, language);
               onCapture(framesRef.current);
           }
       }, intervalTime);
    }
  }, [onCapture, scanMode, isRecording, language, t]);

  const toggleMode = (e: React.MouseEvent, mode: ScanMode) => {
      e.stopPropagation();
      setScanMode(mode);
      vibrate(HapticPatterns.TAP);
      announce(`${t.modeChanged} ${mode === 'quick' ? t.quickScan : t.fullScan}`, language);
  };

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden flex flex-col"
      role="button"
      tabIndex={0}
      onClick={handleCapture}
      aria-label={scanMode === 'quick' ? t.tapToScan : t.tapToStartFull}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-80'}`}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none pb-8 pt-8">
        {/* Top: Progress Bar if recording */}
        <div className="w-full px-6">
            {isRecording && (
                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden border-2 border-yellow-500">
                    <div 
                        className="h-full bg-yellow-500 transition-all duration-500 ease-linear"
                        style={{ width: `${recordingProgress}%` }}
                    />
                </div>
            )}
        </div>

        {/* Center: Guides */}
        {!isRecording && (
            <div className="flex flex-col items-center justify-center opacity-80 w-full px-4">
                {/* 
                  Square Guide:
                  - w-[85vw] aspect-square: Takes up 85% of viewport width, stays square.
                  - max-w-[500px]: capped for tablets/desktop.
                  - shadow-[...]: Creates a dimming overlay outside the box.
                */}
                <div className="border-4 border-yellow-400 rounded-lg w-[85vw] aspect-square max-w-[500px] mb-8 shadow-[0_0_0_2000px_rgba(0,0,0,0.6)]"></div>
                
                <p className="text-yellow-400 text-2xl font-bold bg-black bg-opacity-90 px-8 py-4 rounded-full shadow-lg border border-yellow-900">
                    {scanMode === 'quick' ? t.tapToScan : t.tapToStartFull}
                </p>
            </div>
        )}
        
        {/* Bottom: Mode Toggle */}
        {/* Pointer events enabled for buttons */}
        <div className="pointer-events-auto flex gap-4 bg-black bg-opacity-80 p-2 rounded-full border border-yellow-900 z-10 mb-8">
            <button
                onClick={(e) => toggleMode(e, 'quick')}
                disabled={isRecording}
                className={`px-6 py-3 rounded-full font-bold transition-colors ${scanMode === 'quick' ? 'bg-yellow-500 text-black' : 'bg-transparent text-yellow-500'}`}
            >
                {t.quickScan}
            </button>
            <button
                onClick={(e) => toggleMode(e, 'full')}
                disabled={isRecording}
                className={`px-6 py-3 rounded-full font-bold transition-colors ${scanMode === 'full' ? 'bg-yellow-500 text-black' : 'bg-transparent text-yellow-500'}`}
            >
                {t.fullScan}
            </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;