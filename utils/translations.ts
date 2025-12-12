import { LanguageCode } from "../types";

export const TRANSLATIONS = {
  en: {
    welcomeTitle: "Label Reader",
    welcomeSubtitle: "Tap anywhere to start",
    cameraPermission: "Could not access camera. Please allow permissions.",
    cameraReady: "Camera ready. Tap anywhere to scan.",
    tapToScan: "Tap to Scan",
    analyzing: "Analyzing... Please wait.",
    analyzingShort: "Analyzing...",
    analysisError: "I could not analyze that. Please try again.",
    itemLabel: "Item",
    expiryLabel: "Expiry",
    usageLabel: "Usage",
    warningsLabel: "Warnings",
    ingredientsLabel: "Ingredients",
    criticalWarningLabel: "CRITICAL WARNING",
    tapAgain: "Tap to Scan Again",
    verifyProfessional: "Verify with a professional.",
    noteUnclear: "Note: Image was unclear.",
    cautionMedicine: "Caution: This looks like medication.",
    medicineWarningPrefix: "Verify with a professional.",
    languageName: "English",
    // Q&A
    askButton: "Ask a Question",
    questionPlaceholder: "e.g., Is it vegetarian?",
    sendButton: "Ask",
    answerTitle: "Answer",
    thinking: "Thinking...",
    askError: "Could not get an answer. Try again.",
    micButton: "Tap to Speak",
    listening: "Listening...",
    micError: "Voice input not supported",
    // Scan Modes
    quickScan: "Quick Scan",
    fullScan: "Full Scan",
    modeChanged: "Mode changed to",
    rotateInstruction: "Rotate product slowly. Capturing...",
    scanComplete: "Scan complete.",
    tapToStartFull: "Tap to start Full Scan",
    // Accuracy
    accuracyLabel: "Match",
    // New Details
    visualDetailsLabel: "Appearance",
    sealStatusLabel: "Condition",
    quantityEstimateLabel: "Quantity Estimate"
  },
  hi: {
    welcomeTitle: "लेबल रीडर",
    welcomeSubtitle: "शुरू करने के लिए कहीं भी टैप करें",
    cameraPermission: "कैमरा एक्सेस नहीं मिला। कृपया अनुमति दें।",
    cameraReady: "कैमरा तैयार है। स्कैन करने के लिए कहीं भी टैप करें।",
    tapToScan: "स्कैन करने के लिए टैप करें",
    analyzing: "विश्लेषण हो रहा है... कृपया प्रतीक्षा करें।",
    analyzingShort: "विश्लेषण हो रहा है...",
    analysisError: "मैं विश्लेषण नहीं कर सका। कृपया पुनः प्रयास करें।",
    itemLabel: "वस्तु",
    expiryLabel: "समाप्ति तिथि",
    usageLabel: "उपयोग",
    warningsLabel: "चेतावनी",
    ingredientsLabel: "सामग्री",
    criticalWarningLabel: "गंभीर चेतावनी",
    tapAgain: "फिर से स्कैन करने के लिए टैप करें",
    verifyProfessional: "किसी पेशेवर से जाँच करें।",
    noteUnclear: "नोट: छवि स्पष्ट नहीं थी।",
    cautionMedicine: "सावधान: यह दवा जैसी लग रही है।",
    medicineWarningPrefix: "किसी पेशेवर से जाँच करें।",
    languageName: "Hindi",
    // Q&A
    askButton: "प्रश्न पूछें",
    questionPlaceholder: "जैसे: क्या यह शाकाहारी है?",
    sendButton: "पूछें",
    answerTitle: "उत्तर",
    thinking: "सोच रहा हूँ...",
    askError: "उत्तर नहीं मिला। पुनः प्रयास करें।",
    micButton: "बोलकर पूछें",
    listening: "सुन रहा हूँ...",
    micError: "आवाज़ इनपुट समर्थित नहीं है",
    // Scan Modes
    quickScan: "त्वरित स्कैन",
    fullScan: "पूरा स्कैन",
    modeChanged: "मोड बदल गया है:",
    rotateInstruction: "उत्पाद को धीरे-धीरे घुमाएं। स्कैन हो रहा है...",
    scanComplete: "स्कैन पूरा हुआ।",
    tapToStartFull: "पूरा स्कैन शुरू करने के लिए टैप करें",
    // Accuracy
    accuracyLabel: "सटीकता",
    // New Details
    visualDetailsLabel: "दिखावट",
    sealStatusLabel: "स्थिति",
    quantityEstimateLabel: "अनुमानित मात्रा"
  }
};

export const getTranslation = (lang: LanguageCode) => TRANSLATIONS[lang];