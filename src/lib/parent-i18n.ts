/**
 * Copy for loved-one / parent device UI. Driven by care profile `preferredLanguage`.
 * English is always available for a subtle subtitle when the primary language is not English.
 */

export type ParentLang = "en" | "hi" | "te" | "ta";

export type ParentStringKey =
  | "yourFamily"
  | "shareUpdate"
  | "chooseOption"
  | "voiceMessage"
  | "photoOrVideo"
  | "recording"
  | "stopAndSend"
  | "cameraReady"
  | "recordingVideo"
  | "takePhoto"
  | "recordVideo"
  | "cancel"
  | "sendingUpdate"
  | "pleaseWait"
  | "somethingWrong"
  | "tryAgain"
  | "micPermissionError"
  | "cameraPermissionError"
  | "genericTryAgain"
  | "update"
  | "accept"
  | "decline"
  | "waitNextCall"
  | "ariaFamilyCalling"
  | "ariaFamilyProfile"
  | "back"
  | "checkInCall"
  | "checkInAutoStart"
  | "liveVoiceDemo"
  | "testGeminiBlurb"
  | "retryCheckInCall"
  | "startTestCall"
  | "connecting"
  | "settingUpSession"
  | "liveCallActive"
  | "endCall"
  | "assistantSpeaksFirst"
  | "callEnded"
  | "duration"
  | "savingRecording"
  | "fullTranscript"
  | "noTranscript"
  | "startAnotherCall"
  | "backToHome"
  | "aiAssistant"
  | "you"
  | "speaking"
  | "loading"
  | "elevenLabsCheckIn"
  | "elevenLabsDemo"
  | "setupRequired"
  | "connectingElevenLabs"
  | "establishingWebRtc"
  | "savingSummary"
  | "summarySaved"
  | "summarySaveFailed"
  | "transcript"
  | "agentSpeaking"
  | "listeningToYou"
  | "agentGreetSoon"
  | "checkInStartingAuto"
  | "elevenLabsDemoDesc"
  | "elevenLabsProduct";

const EN: Record<ParentStringKey, string> = {
  yourFamily: "Your family",
  shareUpdate: "Share an update",
  chooseOption: "Choose one option below.",
  voiceMessage: "Voice message",
  photoOrVideo: "Photo or video",
  recording: "Recording...",
  stopAndSend: "Stop and send",
  cameraReady: "Camera ready",
  recordingVideo: "Recording video...",
  takePhoto: "Take photo",
  recordVideo: "Record video",
  cancel: "Cancel",
  sendingUpdate: "Sending update...",
  pleaseWait: "Please wait.",
  somethingWrong: "Something went wrong",
  tryAgain: "Try again",
  micPermissionError:
    "Could not use the microphone. Please allow access and try again.",
  cameraPermissionError:
    "Could not use the camera. Please allow access and try again.",
  genericTryAgain: "Something went wrong. Please try again.",
  update: "Update",
  accept: "Accept",
  decline: "Decline",
  waitNextCall: "Wait for next call",
  ariaFamilyCalling: "Family member calling",
  ariaFamilyProfile: "Family member — photo placeholder",
  back: "Back",
  checkInCall: "Check-in call",
  checkInAutoStart:
    "The call should start after you answer. If not, tap retry.",
  liveVoiceDemo: "Live voice demo",
  testGeminiBlurb: "Try the care assistant with Gemini Live — tap below to start.",
  retryCheckInCall: "Retry check-in call",
  startTestCall: "Start test call",
  connecting: "Connecting...",
  settingUpSession: "Setting up secure voice",
  liveCallActive: "Live call active",
  endCall: "End call",
  assistantSpeaksFirst:
    "The assistant speaks first — then you can reply in any language you like.",
  callEnded: "Call ended",
  duration: "Duration",
  savingRecording: "Saving recording and transcript...",
  fullTranscript: "Full transcript",
  noTranscript: "No transcript recorded.",
  startAnotherCall: "Start another call",
  backToHome: "Back to home",
  aiAssistant: "AI assistant",
  you: "You",
  speaking: "(speaking...)",
  loading: "Loading...",
  elevenLabsCheckIn: "Check-in call (ElevenLabs)",
  elevenLabsDemo: "ElevenLabs full stack",
  setupRequired: "Setup required",
  connectingElevenLabs: "Connecting to ElevenLabs...",
  establishingWebRtc: "Establishing WebRTC session",
  savingSummary: "Saving summary to family dashboard...",
  summarySaved: "Summary saved — your family will be notified",
  summarySaveFailed: "Could not save summary. Check server logs.",
  transcript: "Transcript",
  agentSpeaking: "Agent speaking...",
  listeningToYou: "Listening to you...",
  agentGreetSoon: "The agent will greet you shortly...",
  checkInStartingAuto:
    "Starting automatically after you answer. Retry if needed.",
  elevenLabsDemoDesc:
    "Voice, understanding, and speech are handled for you — online conversation.",
  elevenLabsProduct: "ElevenLabs voice assistant",
};

const HI: Partial<Record<ParentStringKey, string>> = {
  yourFamily: "आपका परिवार",
  shareUpdate: "अपडेट भेजें",
  chooseOption: "नीचे एक विकल्प चुनें।",
  voiceMessage: "आवाज़ संदेश",
  photoOrVideo: "फोटो या वीडियो",
  recording: "रिकॉर्ड हो रहा है...",
  stopAndSend: "रोकें और भेजें",
  cameraReady: "कैमरा तैयार",
  recordingVideo: "वीडियो रिकॉर्ड हो रहा है...",
  takePhoto: "फोटो लें",
  recordVideo: "वीडियो रिकॉर्ड करें",
  cancel: "रद्द करें",
  sendingUpdate: "अपडेट भेजा जा रहा है...",
  pleaseWait: "कृपया प्रतीक्षा करें।",
  somethingWrong: "कुछ गलत हो गया",
  tryAgain: "फिर कोशिश करें",
  micPermissionError:
    "माइक्रोफ़ोन नहीं मिला। कृपया अनुमति दें और फिर कोशिश करें।",
  cameraPermissionError:
    "कैमरा नहीं मिला। कृपया अनुमति दें और फिर कोशिश करें।",
  genericTryAgain: "कुछ गलत हो गया। कृपया फिर कोशिश करें।",
  update: "अपडेट",
  accept: "स्वीकार करें",
  decline: "मना करें",
  waitNextCall: "अगली कॉल का इंतज़ार",
  ariaFamilyCalling: "परिवार की कॉल",
  ariaFamilyProfile: "परिवार — फोटो जल्द आएगी",
  back: "वापस",
  checkInCall: "चेक-इन कॉल",
  checkInAutoStart:
    "जवाब देने के बाद कॉल शुरू होनी चाहिए। नहीं हुई तो फिर कोशिश करें।",
  liveVoiceDemo: "लाइव आवाज़ डेमो",
  testGeminiBlurb:
    "Gemini Live से केयर असिस्टेंट आज़माएँ — शुरू करने के लिए नीचे दबाएँ।",
  retryCheckInCall: "चेक-इन फिर से",
  startTestCall: "टेस्ट कॉल शुरू करें",
  connecting: "जुड़ रहा है...",
  settingUpSession: "सुरक्षित आवाज़ तैयार हो रही है",
  liveCallActive: "कॉल चालू है",
  endCall: "कॉल खत्म करें",
  assistantSpeaksFirst:
    "पहले असिस्टेंट बोलता है — फिर आप अपनी भाषा में जवाब दें।",
  callEnded: "कॉल खत्म",
  duration: "समय",
  savingRecording: "रिकॉर्डिंग सेव हो रही है...",
  fullTranscript: "पूरी बातचीत",
  noTranscript: "कोई बातचीत सेव नहीं हुई।",
  startAnotherCall: "नई कॉल",
  backToHome: "होम पर जाएँ",
  aiAssistant: "सहायक",
  you: "आप",
  speaking: "(बोल रहे हैं...)",
  loading: "लोड हो रहा है...",
  elevenLabsCheckIn: "चेक-इन कॉल (ElevenLabs)",
  elevenLabsDemo: "ElevenLabs डेमो",
  setupRequired: "सेटअप ज़रूरी है",
  connectingElevenLabs: "ElevenLabs से जुड़ रहा है...",
  establishingWebRtc: "WebRTC सत्र",
  savingSummary: "सार परिवार को भेजा जा रहा है...",
  summarySaved: "सार सेव — परिवार को सूचना मिलेगी",
  summarySaveFailed: "सार सेव नहीं हुआ। सर्वर देखें।",
  transcript: "बातचीत",
  agentSpeaking: "सहायक बोल रहा है...",
  listeningToYou: "आपकी सुन रहा है...",
  agentGreetSoon: "सहायक जल्द अभिवादन करेगा...",
  checkInStartingAuto:
    "जवाब देने के बाद अपने आप शुरू होगा। ज़रूरत हो तो फिर कोशिश करें।",
  elevenLabsDemoDesc:
    "आवाज़, समझ और बोलने का काम सिस्टम संभालता है — ऑनलाइन बातचीत।",
  elevenLabsProduct: "ElevenLabs आवाज़ सहायक",
};

const TE: Partial<Record<ParentStringKey, string>> = {
  yourFamily: "మీ కుటుంబం",
  shareUpdate: "అప్‌డేట్ పంపండి",
  chooseOption: "క్రింద ఒక ఎంపిక ఎంచుకోండి.",
  voiceMessage: "వాయిస్ సందేశం",
  photoOrVideo: "ఫోటో లేదా వీడియో",
  recording: "రికార్డ్ అవుతోంది...",
  stopAndSend: "ఆపి పంపండి",
  cameraReady: "కెమెరా సిద్ధం",
  recordingVideo: "వీడియో రికార్డ్ అవుతోంది...",
  takePhoto: "ఫోటో తీయండి",
  recordVideo: "వీడియో రికార్డ్ చేయండి",
  cancel: "రద్దు",
  sendingUpdate: "అప్‌డేట్ పంపుతున్నాం...",
  pleaseWait: "దయచేసి వేచి ఉండండి.",
  somethingWrong: "ఏదో తప్పు జరిగింది",
  tryAgain: "మళ్లా ప్రయత్నించండి",
  micPermissionError:
    "మైక్రోఫోన్ వాడలేకపోతున్నాం. అనుమతి ఇచ్చి మళ్లా ప్రయత్నించండి.",
  cameraPermissionError:
    "కెమెరా వాడలేకపోతున్నాం. అనుమతి ఇచ్చి మళ్లా ప్రయత్నించండి.",
  genericTryAgain: "ఏదో తప్పు జరిగింది. మళ్లా ప్రయత్నించండి.",
  update: "అప్‌డేట్",
  accept: "అంగీకరించండి",
  decline: "తిరస్కరించండి",
  waitNextCall: "తదుపరి కాల్ కోసం వేచి",
  ariaFamilyCalling: "కుటుంబం కాల్ చేస్తోంది",
  ariaFamilyProfile: "కుటుంబం — ఫోటో త్వరలో",
  back: "వెనక్కి",
  checkInCall: "చెక్-ఇన్ కాల్",
  checkInAutoStart:
    "మీరు సమాధానం ఇచ్చాక కాల్ మొదలవ్వాలి. కాకపోతే మళ్లా ప్రయత్నించండి.",
  liveVoiceDemo: "లైవ్ వాయిస్ డెమో",
  testGeminiBlurb:
    "Gemini Live తో సహాయకుడిని ప్రయత్నించండి — ప్రారంభించడానికి క్రింద నొక్కండి.",
  retryCheckInCall: "చెక్-ఇన్ మళ్లా",
  startTestCall: "టెస్ట్ కాల్ ప్రారంభించండి",
  connecting: "కనెక్ట్ అవుతోంది...",
  settingUpSession: "సురక్షిత వాయిస్ సిద్ధమవుతోంది",
  liveCallActive: "కాల్ నడుస్తోంది",
  endCall: "కాల్ ముగించండి",
  assistantSpeaksFirst:
    "ముందు సహాయకుడు మాట్లాడతాడు — తర్వాత మీరు మీ భాషలో సమాధానం ఇవ్వండి.",
  callEnded: "కాల్ ముగిసింది",
  duration: "సమయం",
  savingRecording: "రికార్డింగ్ సేవ్ అవుతోంది...",
  fullTranscript: "మొత్తం సంభాషణ",
  noTranscript: "సంభాషణ రికార్డ్ కాలేదు.",
  startAnotherCall: "మరో కాల్",
  backToHome: "హోమ్‌కి వెళ్లండి",
  aiAssistant: "సహాయకుడు",
  you: "మీరు",
  speaking: "(మాట్లాడుతున్నారు...)",
  loading: "లోడ్ అవుతోంది...",
  elevenLabsCheckIn: "చెక్-ఇన్ కాల్ (ElevenLabs)",
  elevenLabsDemo: "ElevenLabs డెమో",
  setupRequired: "సెటప్ అవసరం",
  connectingElevenLabs: "ElevenLabs కి కనెక్ట్ అవుతోంది...",
  establishingWebRtc: "WebRTC సెషన్",
  savingSummary: "సారాంశం కుటుంబానికి పంపుతున్నాం...",
  summarySaved: "సారాంశం సేవ్ — కుటుంబానికి తెలుస్తుంది",
  summarySaveFailed: "సారాంశం సేవ్ కాలేదు. సర్వర్ చూడండి.",
  transcript: "సంభాషణ",
  agentSpeaking: "సహాయకుడు మాట్లాడుతున్నాడు...",
  listeningToYou: "మిమ్మల్ని వింటున్నాడు...",
  agentGreetSoon: "సహాయకుడు త్వరలో అభివాదం చేస్తాడు...",
  checkInStartingAuto:
    "మీరు సమాధానం ఇచ్చాక ఆటోమేటిక్ ప్రారంభమవుతుంది. కావాలంటే మళ్లా ప్రయత్నించండి.",
  elevenLabsDemoDesc:
    "వాయిస్, అర్థం మరియు మాటలు సిస్టమ్ చూసుకుంటుంది — ఆన్‌లైన్ సంభాషణ.",
  elevenLabsProduct: "ElevenLabs వాయిస్ సహాయకుడు",
};

const TA: Partial<Record<ParentStringKey, string>> = {
  yourFamily: "உங்கள் குடும்பம்",
  shareUpdate: "புதுப்பிப்பை அனுப்பவும்",
  chooseOption: "கீழே ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்.",
  voiceMessage: "குரல் செய்தி",
  photoOrVideo: "புகைப்படம் அல்லது வீடியோ",
  recording: "பதிவாகிறது...",
  stopAndSend: "நிறுத்தி அனுப்பு",
  cameraReady: "கேமரா தயார்",
  recordingVideo: "வீடியோ பதிவாகிறது...",
  takePhoto: "புகைப்படம் எடு",
  recordVideo: "வீடியோ பதிவு",
  cancel: "ரத்து",
  sendingUpdate: "புதுப்பிப்பு அனுப்பப்படுகிறது...",
  pleaseWait: "காத்திருக்கவும்.",
  somethingWrong: "ஏதோ தவறு நடந்தது",
  tryAgain: "மீண்டும் முயலவும்",
  micPermissionError:
    "மைக்ரோஃபோன் பயன்படுத்த முடியவில்லை. அனுமதி கொடுத்து மீண்டும் முயலவும்.",
  cameraPermissionError:
    "கேமரா பயன்படுத்த முடியவில்லை. அனுமதி கொடுத்து மீண்டும் முயலவும்.",
  genericTryAgain: "ஏதோ தவறு நடந்தது. மீண்டும் முயலவும்.",
  update: "புதுப்பிப்பு",
  accept: "ஏற்கவும்",
  decline: "மறுக்கவும்",
  waitNextCall: "அடுத்த அழைப்புக்காக காத்திரு",
  ariaFamilyCalling: "குடும்பம் அழைக்கிறது",
  ariaFamilyProfile: "குடும்பம் — புகைப்படம் விரைவில்",
  back: "பின்",
  checkInCall: "சரிபார்ப்பு அழைப்பு",
  checkInAutoStart:
    "பதில் சொன்ன பிறகு அழைப்பு தொடங்க வேண்டும். இல்லையெனில் மீண்டும் முயலவும்.",
  liveVoiceDemo: "நேரலை குரல் சோதனை",
  testGeminiBlurb:
    "Gemini Live மூலம் உதவியாளரை முயற்சிக்கவும் — தொடங்க கீழே தட்டவும்.",
  retryCheckInCall: "சரிபார்ப்பை மீண்டும்",
  startTestCall: "சோதனை அழைப்பு",
  connecting: "இணைகிறது...",
  settingUpSession: "பாதுகாப்பான குரல் தயாராகிறது",
  liveCallActive: "அழைப்பு நடக்கிறது",
  endCall: "அழைப்பை முடி",
  assistantSpeaksFirst:
    "முதலில் உதவியாளர் பேசுவார் — பிறகு நீங்கள் உங்கள் மொழியில் பதிலளிக்கலாம்.",
  callEnded: "அழைப்பு முடிந்தது",
  duration: "நேரம்",
  savingRecording: "பதிவு சேமிக்கப்படுகிறது...",
  fullTranscript: "முழு உரையாடல்",
  noTranscript: "உரையாடல் பதிவு இல்லை.",
  startAnotherCall: "மற்றொரு அழைப்பு",
  backToHome: "முகப்புக்கு",
  aiAssistant: "உதவியாளர்",
  you: "நீங்கள்",
  speaking: "(பேசுகிறீர்கள்...)",
  loading: "ஏற்றுகிறது...",
  elevenLabsCheckIn: "சரிபார்ப்பு (ElevenLabs)",
  elevenLabsDemo: "ElevenLabs சோதனை",
  setupRequired: "அமைப்பு தேவை",
  connectingElevenLabs: "ElevenLabs உடன் இணைகிறது...",
  establishingWebRtc: "WebRTC அமர்வு",
  savingSummary: "சுருக்கம் குடும்பத்திற்கு அனுப்பப்படுகிறது...",
  summarySaved: "சுருக்கம் சேமிக்கப்பட்டது — குடும்பத்திற்குத் தெரியும்",
  summarySaveFailed: "சுருக்கம் சேமிக்க முடியவில்லை.",
  transcript: "உரையாடல்",
  agentSpeaking: "உதவியாளர் பேசுகிறார்...",
  listeningToYou: "உங்களைக் கேட்கிறார்...",
  agentGreetSoon: "உதவியாளர் விரைவில் வணக்கம் சொல்வார்...",
  checkInStartingAuto:
    "பதில் சொன்ன பிறகு தானாகத் தொடங்கும். வேண்டுமெனில் மீண்டும் முயலவும்.",
  elevenLabsDemoDesc:
    "குரல், புரிதல், பேச்சு — அமைப்பு பார்த்துக்கொள்கிறது; இணைய உரையாடல்.",
  elevenLabsProduct: "ElevenLabs குரல் உதவியாளர்",
};

const TABLES: Record<ParentLang, Record<ParentStringKey, string>> = {
  en: EN,
  hi: { ...EN, ...HI },
  te: { ...EN, ...TE },
  ta: { ...EN, ...TA },
};

/** Languages with full parent UI copy (Care Profile dropdown). */
export const PARENT_UI_LANGUAGE_OPTIONS: { value: ParentLang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
];

export function normalizeParentLang(raw: string | undefined | null): ParentLang {
  const s = (raw ?? "en").trim().toLowerCase();
  if (s.startsWith("hi") || s === "hin") return "hi";
  if (s.startsWith("te") || s === "tel") return "te";
  if (s.startsWith("ta") || s === "tam") return "ta";
  if (s.startsWith("en")) return "en";
  return "en";
}

export function parentPrimary(lang: ParentLang, key: ParentStringKey): string {
  return TABLES[lang][key] ?? EN[key];
}

export function parentEnglish(key: ParentStringKey): string {
  return EN[key];
}

/** BCP 47 tag for formatting dates/times on parent screens */
export function parentLocaleTag(lang: ParentLang): string {
  switch (lang) {
    case "hi":
      return "hi-IN";
    case "te":
      return "te-IN";
    case "ta":
      return "ta-IN";
    default:
      return "en-IN";
  }
}
