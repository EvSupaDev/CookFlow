import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence: number };
  }>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export type MicStatus = "idle" | "starting" | "listening" | "reconnecting";
export type MicPermissionState = "unknown" | "granted" | "prompt" | "denied";
export type VoiceEngineMode = "native-speech" | "whisper-vad";

export interface AudioDeviceOption {
  deviceId: string;
  label: string;
}

export interface VoiceAiAnswer {
  onTopic: boolean;
  answer: string;
  quickTip?: string | null;
}

export interface VoiceCookHandlers {
  onNextStep: () => void;
  onPrevStep: () => void;
  onJumpToStep: (zeroBasedIndex: number) => void;
  onOpenIngredients: () => void;
  onOpenAssistant: () => void;
  onStartStepTimer: () => boolean;
  onStartCustomTimer: (label: string, seconds: number) => void;
  onPauseTimers?: (targetQuery?: string) => boolean;
  onResumeTimers?: (targetQuery?: string) => boolean;
  onCancelTimers?: (targetQuery?: string) => boolean;
  getStepReadoutText: () => string;
  onAskVoiceAi?: (spokenQuestion: string) => Promise<VoiceAiAnswer>;
  onTranscribeAudio?: (audioBase64: string, mimeType: string) => Promise<string>;
  totalSteps: number;
}

export interface VoiceCookControlState {
  supported: boolean;
  enabled: boolean;
  engineMode: VoiceEngineMode;
  isListening: boolean;
  micStatus: MicStatus;
  micLevel: number;
  micPermission: MicPermissionState;
  awakeForCommand: boolean;
  isSpeaking: boolean;
  isAskingAi: boolean;
  isPushToTalkRecording: boolean;
  isTranscribing: boolean;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  audioInputs: AudioDeviceOption[];
  audioOutputs: AudioDeviceOption[];
  selectedMicId: string;
  selectedOutputId: string;
  outputSelectionSupported: boolean;
  interimTranscript: string;
  lastHeard: string;
  lastAction: string;
  lastAiAnswer: string | null;
  micDiagnostic: string | null;
  error: string | null;
  toggleVoiceMode: () => void;
  retryMic: () => void;
  togglePushToTalk: () => Promise<void>;
  refreshAudioDevices: () => Promise<void>;
  selectMicDevice: (deviceId: string) => void;
  selectOutputDevice: (deviceId: string) => void;
  testMicHardware: () => Promise<void>;
  runTextCommand: (text: string) => void;
  selectVoice: (voiceName: string) => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
}

const SAVED_VOICE_KEY = "cookflow_tts_voice_v1";
const SAVED_MIC_KEY = "cookflow_audio_input_v1";
const SAVED_OUTPUT_KEY = "cookflow_audio_output_v1";

const SPOKEN_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  four: 4,
  for: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  "forty five": 45,
  fifty: 50,
  sixty: 60,
};

// Broad phonetic wake-word matcher so "CookFlow" is recognized even if heard as "workflow", "cook floor", "quick flow", etc.
const WAKE_WORD_REGEX =
  /\b(?:hey|okay|ok|hi|yo|a|hey there)?\s*(?:cook\s*flow|cookflow|work\s*flow|workflow|cook\s*floor|cookfloor|cook\s*glow|cook\s*slow|cook\s*pro|cook\s*low|cook\s*full|cook\s*foe|cook\s*floe|book\s*flow|quick\s*flow|good\s*flow|brook\s*flow|took\s*flow|co\s*flow|coflow|coke\s*flow|cup\s*flow|cut\s*flow)\b/i;

const PREFERRED_VOICE_NAMES = [
  "microsoft aria online (natural)",
  "microsoft jenny online (natural)",
  "microsoft ava online (natural)",
  "microsoft sonia online (natural)",
  "google us english",
  "google uk english female",
  "samantha",
  "ava",
  "allison",
  "karen",
  "serena",
  "moira",
  "tessa",
];

function isOperaOrBraveBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isOpera = /OPR\/|Opera/i.test(ua);
  const isBrave = Boolean((navigator as unknown as { brave?: unknown }).brave);
  return isOpera || isBrave;
}

function pickPleasingVoice(
  voices: SpeechSynthesisVoice[],
  savedName?: string | null
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  if (savedName) {
    const savedMatch = voices.find((v) => v.name === savedName);
    if (savedMatch) return savedMatch;
  }

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  for (const preferred of PREFERRED_VOICE_NAMES) {
    const match = pool.find((v) => v.name.toLowerCase().includes(preferred));
    if (match) return match;
  }

  const neuralMatch = pool.find((v) =>
    /natural|neural|enhanced|premium|google/i.test(v.name)
  );
  if (neuralMatch) return neuralMatch;

  return (
    pool.find((v) => v.lang.toLowerCase() === "en-us" && v.default) ??
    pool.find((v) => v.lang.toLowerCase() === "en-us") ??
    pool[0] ??
    null
  );
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function parseNumberToken(token: string): number | null {
  const clean = token.trim().toLowerCase();
  if (/^\d+(?:\.\d+)?$/.test(clean)) {
    return parseFloat(clean);
  }
  if (clean in SPOKEN_NUMBERS) {
    return SPOKEN_NUMBERS[clean];
  }
  return null;
}

function parseCustomTimerDuration(command: string): { seconds: number; label: string } | null {
  const lower = command.toLowerCase();

  const halfMinMatch = lower.match(
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+and\s+a\s+half\s*(?:m|min|mins|minute|minutes)\b/
  );
  if (halfMinMatch) {
    const base = parseNumberToken(halfMinMatch[1]);
    if (base !== null && base > 0) {
      const secs = Math.round((base + 0.5) * 60);
      return { seconds: secs, label: `${base}.5m Timer` };
    }
  }

  let totalSeconds = 0;
  const minMatch = lower.match(
    /\b(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty\s+five|forty|fifty|sixty)\s*(?:m|min|mins|minute|minutes)\b/
  );
  if (minMatch) {
    const mins = parseNumberToken(minMatch[1]);
    if (mins !== null && mins > 0) {
      totalSeconds += Math.round(mins * 60);
    }
  }

  const secMatch = lower.match(
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|forty\s+five|forty|fifty|sixty)\s*(?:s|sec|secs|second|seconds)\b/
  );
  if (secMatch) {
    const secs = parseNumberToken(secMatch[1]);
    if (secs !== null && secs > 0) {
      totalSeconds += Math.round(secs);
    }
  }

  if (totalSeconds > 0) {
    const minsPart = Math.floor(totalSeconds / 60);
    const secsPart = totalSeconds % 60;
    const label =
      minsPart > 0 && secsPart > 0
        ? `${minsPart}m ${secsPart}s Timer`
        : minsPart > 0
          ? `${minsPart}m Timer`
          : `${secsPart}s Timer`;
    return { seconds: totalSeconds, label };
  }

  return null;
}

// Encode Float32 PCM chunks downsampled to 16kHz Mono 16-bit WAV (zero codec startup delay!)
function encodeFloat32ChunksToWavBlob(chunks: Float32Array[], sourceSampleRate: number): Blob {
  let totalInputSamples = 0;
  for (const chunk of chunks) {
    totalInputSamples += chunk.length;
  }

  const targetRate = 16000;
  const ratio = sourceSampleRate / targetRate;
  const outputLength = Math.max(1, Math.floor(totalInputSamples / ratio));
  const mono16k = new Float32Array(outputLength);

  const flat = new Float32Array(totalInputSamples);
  let offset = 0;
  for (const chunk of chunks) {
    flat.set(chunk, offset);
    offset += chunk.length;
  }

  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(totalInputSamples, Math.floor((i + 1) * ratio));
    if (end <= start) {
      mono16k[i] = flat[Math.min(start, totalInputSamples - 1)] ?? 0;
    } else {
      let sum = 0;
      for (let j = start; j < end; j += 1) {
        sum += flat[j];
      }
      mono16k[i] = sum / (end - start);
    }
  }

  const dataByteLength = mono16k.length * 2;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  const writeString = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(pos + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataByteLength, true);

  let bytePos = 44;
  for (let i = 0; i < mono16k.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, mono16k[i]));
    view.setInt16(bytePos, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    bytePos += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function useVoiceCookControl(handlers: VoiceCookHandlers): VoiceCookControlState {
  const [supported] = useState<boolean>(() => {
    const hasNative = getSpeechRecognitionCtor() !== null;
    const hasMedia = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
    return hasNative || hasMedia;
  });
  const [engineMode, setEngineMode] = useState<VoiceEngineMode>(() =>
    isOperaOrBraveBrowser() || !getSpeechRecognitionCtor() ? "whisper-vad" : "native-speech"
  );
  const [enabled, setEnabled] = useState(false);
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [micPermission, setMicPermission] = useState<MicPermissionState>("unknown");
  const [awakeForCommand, setAwakeForCommand] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [isPushToTalkRecording, setIsPushToTalkRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    try {
      return window.localStorage.getItem(SAVED_VOICE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [audioInputs, setAudioInputs] = useState<AudioDeviceOption[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<AudioDeviceOption[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>(() => {
    try {
      return window.localStorage.getItem(SAVED_MIC_KEY) ?? "default";
    } catch {
      return "default";
    }
  });
  const [selectedOutputId, setSelectedOutputId] = useState<string>(() => {
    try {
      return window.localStorage.getItem(SAVED_OUTPUT_KEY) ?? "default";
    } catch {
      return "default";
    }
  });
  const [outputSelectionSupported] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    const proto = HTMLMediaElement.prototype as unknown as { setSinkId?: unknown };
    return typeof proto.setSinkId === "function";
  });
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [lastAction, setLastAction] = useState("");
  const [lastAiAnswer, setLastAiAnswer] = useState<string | null>(null);
  const [micDiagnostic, setMicDiagnostic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const pttStopFnRef = useRef<(() => void) | null>(null);
  const vadAudioCtxRef = useRef<AudioContext | null>(null);
  const vadProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const selectedMicIdRef = useRef<string>(selectedMicId);
  const selectedOutputIdRef = useRef<string>(selectedOutputId);
  const activeMicStreamRef = useRef<MediaStream | null>(null);
  const handlersRef = useRef<VoiceCookHandlers>(handlers);
  const enabledRef = useRef<boolean>(false);
  const awakeUntilRef = useRef<number>(0);
  const awakeTimerRef = useRef<number | null>(null);
  const startWatchdogRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const isAskingAiRef = useRef<boolean>(false);
  const isTranscribingRef = useRef<boolean>(false);
  const hasStartedRef = useRef<boolean>(false);
  const consecutiveFailuresRef = useRef<number>(0);

  handlersRef.current = handlers;
  selectedMicIdRef.current = selectedMicId;
  selectedOutputIdRef.current = selectedOutputId;

  const releasePinnedMicStream = useCallback(() => {
    if (pttStopFnRef.current) {
      try {
        pttStopFnRef.current();
      } catch {
        // ignore
      }
      pttStopFnRef.current = null;
    }
    setIsPushToTalkRecording(false);

    if (vadProcessorRef.current) {
      try {
        vadProcessorRef.current.disconnect();
        vadProcessorRef.current.onaudioprocess = null;
      } catch {
        // ignore
      }
      vadProcessorRef.current = null;
    }
    if (vadAudioCtxRef.current) {
      void vadAudioCtxRef.current.close().catch(() => {});
      vadAudioCtxRef.current = null;
    }
    if (activeMicStreamRef.current) {
      activeMicStreamRef.current.getTracks().forEach((t) => t.stop());
      activeMicStreamRef.current = null;
    }
    setMicLevel(0);
  }, []);

  const refreshAudioDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs: AudioDeviceOption[] = [];
      const outputs: AudioDeviceOption[] = [];

      let micIdx = 1;
      let outIdx = 1;
      for (const dev of devices) {
        if (dev.kind === "audioinput") {
          inputs.push({
            deviceId: dev.deviceId || `mic-${micIdx}`,
            label: dev.label || `Microphone ${micIdx}`,
          });
          micIdx += 1;
        } else if (dev.kind === "audiooutput") {
          outputs.push({
            deviceId: dev.deviceId || `out-${outIdx}`,
            label: dev.label || `Speaker / Headphones ${outIdx}`,
          });
          outIdx += 1;
        }
      }

      setAudioInputs(inputs);
      setAudioOutputs(outputs);
    } catch (err) {
      logger.warn("VoiceControl", "Failed to enumerate audio devices", err);
    }
  }, []);

  useEffect(() => {
    void refreshAudioDevices();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.addEventListener) return;
    const onDeviceChange = () => void refreshAudioDevices();
    navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
    };
  }, [refreshAudioDevices]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    let active = true;
    let permStatus: PermissionStatus | null = null;

    void navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((status) => {
        if (!active) return;
        permStatus = status;
        const syncState = () => {
          const next = status.state as MicPermissionState;
          setMicPermission(next);
          if (next === "granted") void refreshAudioDevices();
        };
        syncState();
        status.onchange = syncState;
      })
      .catch(() => {});

    return () => {
      active = false;
      if (permStatus) permStatus.onchange = null;
    };
  }, [refreshAudioDevices]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const refreshVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices.length) return;
      const englishVoices = allVoices.filter((v) => v.lang.toLowerCase().startsWith("en"));
      const list = englishVoices.length > 0 ? englishVoices : allVoices;
      setAvailableVoices(list);

      let savedName: string | null = null;
      try {
        savedName = window.localStorage.getItem(SAVED_VOICE_KEY);
      } catch {
        savedName = null;
      }

      const chosen = pickPleasingVoice(allVoices, savedName);
      if (chosen) {
        preferredVoiceRef.current = chosen;
        setSelectedVoiceName(chosen.name);
      }
    };

    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (startWatchdogRef.current !== null) {
      window.clearTimeout(startWatchdogRef.current);
      startWatchdogRef.current = null;
    }
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const clearAwakeWindow = useCallback(() => {
    awakeUntilRef.current = 0;
    setAwakeForCommand(false);
    if (awakeTimerRef.current !== null) {
      window.clearTimeout(awakeTimerRef.current);
      awakeTimerRef.current = null;
    }
  }, []);

  const openAwakeWindow = useCallback((durationMs = 12000) => {
    awakeUntilRef.current = Date.now() + durationMs;
    setAwakeForCommand(true);
    if (awakeTimerRef.current !== null) {
      window.clearTimeout(awakeTimerRef.current);
    }
    awakeTimerRef.current = window.setTimeout(() => {
      awakeUntilRef.current = 0;
      setAwakeForCommand(false);
    }, durationMs);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const playOutputChime = useCallback(async (sinkDeviceId: string) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const ctxWithSink = ctx as AudioContext & {
        setSinkId?: (id: string) => Promise<void>;
      };
      if (sinkDeviceId && sinkDeviceId !== "default" && typeof ctxWithSink.setSinkId === "function") {
        await ctxWithSink.setSinkId(sinkDeviceId);
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch (err) {
      logger.debug("VoiceControl", "Output chime skipped", err);
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const clean = text.trim();
    if (!clean) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    const voice =
      preferredVoiceRef.current ?? pickPleasingVoice(window.speechSynthesis.getVoices());
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = 0.96;
    utterance.pitch = 1.0;
    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const selectVoice = useCallback(
    (voiceName: string) => {
      const match = availableVoices.find((v) => v.name === voiceName);
      if (!match) return;
      preferredVoiceRef.current = match;
      setSelectedVoiceName(match.name);
      try {
        window.localStorage.setItem(SAVED_VOICE_KEY, match.name);
      } catch {
        // ignore
      }
      speakText("CookFlow voice ready.");
    },
    [availableVoices, speakText]
  );

  const selectOutputDevice = useCallback(
    (deviceId: string) => {
      setSelectedOutputId(deviceId);
      selectedOutputIdRef.current = deviceId;
      try {
        window.localStorage.setItem(SAVED_OUTPUT_KEY, deviceId);
      } catch {
        // ignore
      }
      const label =
        audioOutputs.find((d) => d.deviceId === deviceId)?.label || "Default Output";
      setLastAction(`Audio output set to ${label}`);
      void playOutputChime(deviceId);
    },
    [audioOutputs, playOutputChime]
  );

  const stopRecognitionInstance = useCallback(() => {
    clearTimers();
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        // ignore
      }
    }
    releasePinnedMicStream();
    setMicStatus("idle");
    setInterimTranscript("");
  }, [clearTimers, releasePinnedMicStream]);

  const executeCommand = useCallback(
    (rawCommand: string) => {
      const cmd = rawCommand.replace(/[.!?]+$/g, "").trim().toLowerCase();
      if (!cmd) return;
      const h = handlersRef.current;
      logger.info("VoiceControl", `Parsing voice command (local-first): "${cmd}"`);

      // 1. Pause Timer(s)
      if (
        /\b(pause|hold|freeze)\b/.test(cmd) &&
        (/\b(timer|timers|clock|countdown)\b/.test(cmd) || /^(?:pause|hold)$/.test(cmd))
      ) {
        const paused = h.onPauseTimers ? h.onPauseTimers(cmd) : false;
        if (paused) {
          setLastAction("Paused active timer");
          speakText("Timer paused");
        } else {
          setLastAction("No running timer to pause");
          speakText("There is no running timer to pause.");
        }
        clearAwakeWindow();
        return;
      }

      // 2. Resume / Unpause Timer(s)
      if (
        /\b(resume|unpause|restart|continue)\b/.test(cmd) &&
        (/\b(timer|timers|clock|countdown)\b/.test(cmd) || /^(?:resume|unpause)$/.test(cmd))
      ) {
        const resumed = h.onResumeTimers ? h.onResumeTimers(cmd) : false;
        if (resumed) {
          setLastAction("Resumed timer");
          speakText("Timer resumed");
        } else {
          setLastAction("No paused timer to resume");
          speakText("There is no paused timer to resume.");
        }
        clearAwakeWindow();
        return;
      }

      // 3. Cancel / Dismiss / Stop Timer(s)
      if (
        /\b(cancel|clear|dismiss|remove|delete|stop)\b/.test(cmd) &&
        /\b(timer|timers|alarm|countdown)\b/.test(cmd)
      ) {
        const canceled = h.onCancelTimers ? h.onCancelTimers(cmd) : false;
        if (canceled) {
          setLastAction("Canceled timer");
          speakText("Timer canceled");
        } else {
          setLastAction("No active timer to cancel");
        }
        clearAwakeWindow();
        return;
      }

      // 4. Mute / Stop Speech Readout
      if (/\b(stop|quiet|mute|silence|cancel speech)\b/.test(cmd)) {
        stopSpeaking();
        setLastAction("Muted voice readout");
        clearAwakeWindow();
        return;
      }

      // 5. Read / Repeat Current Step
      if (/\b(read|repeat|say again|say that again|what step|read step)\b/.test(cmd)) {
        const text = h.getStepReadoutText();
        speakText(text);
        setLastAction("Reading current step aloud");
        clearAwakeWindow();
        return;
      }

      // 6. Open Ingredients List
      if (/\b(ingredient|ingredients|ingred)\b/.test(cmd)) {
        h.onOpenIngredients();
        setLastAction("Opened Ingredients list");
        speakText("Opening ingredients");
        clearAwakeWindow();
        return;
      }

      // 7. Open Kitchen Rescue Assistant Drawer
      if (/^(?:open\s+)?(?:help|assistant|rescue|kitchen\s+rescue)$/.test(cmd)) {
        h.onOpenAssistant();
        setLastAction("Opened Kitchen Rescue AI");
        speakText("Opening kitchen assistant");
        clearAwakeWindow();
        return;
      }

      // 8. Start Step Timer OR Custom Duration Timer
      if (/\b(timer|alarm|countdown|remind)\b/.test(cmd)) {
        const custom = parseCustomTimerDuration(cmd);
        if (custom) {
          h.onStartCustomTimer(custom.label, custom.seconds);
          setLastAction(`Started ${custom.label}`);
          speakText(`Starting ${custom.label}`);
          clearAwakeWindow();
          return;
        }
        const startedStepTimer = h.onStartStepTimer();
        if (startedStepTimer) {
          setLastAction("Started step timer");
          speakText("Timer started");
        } else {
          setLastAction("No timer on this step — try 'set a timer for 5 minutes'");
          speakText("This step has no built-in timer. Say a time like 5 minutes.");
        }
        clearAwakeWindow();
        return;
      }

      // 9. Jump to Specific Step Number
      const stepNumMatch = cmd.match(
        /\bstep\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/
      );
      if (stepNumMatch) {
        const num = parseNumberToken(stepNumMatch[1]);
        if (num !== null && num >= 1 && num <= h.totalSteps) {
          h.onJumpToStep(Math.floor(num) - 1);
          setLastAction(`Jumped to Step ${Math.floor(num)}`);
          speakText(`Step ${Math.floor(num)}`);
          clearAwakeWindow();
          return;
        }
      }

      // 10. Next Step / Page
      if (/\b(next|forward|continue|keep going|done|finish)\b/.test(cmd)) {
        h.onNextStep();
        setLastAction("Moved to next step");
        clearAwakeWindow();
        return;
      }

      // 11. Previous Step / Back
      if (/\b(back|previous|prev|last step|go back)\b/.test(cmd)) {
        h.onPrevStep();
        setLastAction("Went back a step");
        clearAwakeWindow();
        return;
      }

      // 12. Fallback -> Route open-ended cooking questions to Groq Kitchen Rescue AI (online only)
      if (h.onAskVoiceAi && !isAskingAiRef.current) {
        const questionText = rawCommand.trim();
        logger.info(
          "VoiceControl",
          `No local command matched; routing to Kitchen Rescue AI: "${questionText}"`
        );
        isAskingAiRef.current = true;
        setIsAskingAi(true);
        setLastAiAnswer(null);
        setLastAction(`Asking CookFlow AI: "${questionText}"`);
        clearAwakeWindow();

        void h
          .onAskVoiceAi(questionText)
          .then((resp) => {
            setLastAiAnswer(resp.answer);
            setLastAction(resp.onTopic ? "CookFlow AI answered" : "Cooking topics only");
            speakText(resp.answer);
          })
          .catch((err) => {
            const msg =
              err instanceof Error
                ? err.message
                : "You're offline, so AI questions aren't available right now.";
            setLastAiAnswer(msg);
            setLastAction("Offline — local voice commands still work");
            speakText(
              "You're currently offline, so AI questions aren't available. Local commands like next step and timers still work."
            );
          })
          .finally(() => {
            isAskingAiRef.current = false;
            setIsAskingAi(false);
          });
        return;
      }

      setLastAction(
        `Heard "${rawCommand.trim()}" — try "next step", "pause timer", or "set a 5 min timer"`
      );
    },
    [clearAwakeWindow, speakText, stopSpeaking]
  );

  const runTextCommand = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      setLastHeard(clean);
      const stripped = clean.replace(WAKE_WORD_REGEX, "").replace(/^[,.:;!?\s-]+/, "").trim();
      executeCommand(stripped || clean);
    },
    [executeCommand]
  );

  const handleFinalTranscript = useCallback(
    (transcript: string) => {
      const clean = transcript.trim();
      if (!clean) return;
      if (isSpeakingRef.current) return;

      setInterimTranscript("");
      setLastHeard(clean);
      logger.debug("VoiceControl", `Final transcript: "${clean}"`);

      const wakeMatch = clean.match(WAKE_WORD_REGEX);
      if (wakeMatch && wakeMatch.index !== undefined) {
        const afterWake = clean
          .slice(wakeMatch.index + wakeMatch[0].length)
          .replace(/^[,.:;!?\s-]+/, "")
          .trim();

        if (afterWake.length > 0) {
          logger.info("VoiceControl", `Wake word + inline command detected: "${afterWake}"`);
          executeCommand(afterWake);
        } else {
          logger.info("VoiceControl", "Wake word detected; opening 12s command window");
          openAwakeWindow(12000);
          setLastAction("Listening for your command or question...");
          void playOutputChime(selectedOutputIdRef.current);
        }
        return;
      }

      if (Date.now() < awakeUntilRef.current) {
        executeCommand(clean);
      }
    },
    [executeCommand, openAwakeWindow, playOutputChime]
  );

  const sendWavBlobToWhisper = useCallback(
    (blob: Blob) => {
      if (!handlersRef.current.onTranscribeAudio) {
        setLastAction("Whisper transcription client not configured.");
        return;
      }
      if (blob.size < 1600 || isTranscribingRef.current) return;

      isTranscribingRef.current = true;
      setIsTranscribing(true);
      setLastAction("Transcribing speech with Groq Whisper...");

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        void handlersRef.current
          .onTranscribeAudio!(base64, "audio/wav")
          .then((transcript) => {
            const clean = transcript.trim();
            logger.info("VoiceControl", `Whisper transcript: "${clean}"`);
            if (clean) {
              handleFinalTranscript(clean);
            } else {
              setLastAction('Say "Hey CookFlow" + your command or question');
            }
          })
          .catch((err) => {
            const msg = err instanceof Error ? err.message : "Voice transcription failed";
            logger.warn("VoiceControl", `Whisper transcription error: ${msg}`);
            setLastAction(msg);
          })
          .finally(() => {
            isTranscribingRef.current = false;
            setIsTranscribing(false);
          });
      };
      reader.readAsDataURL(blob);
    },
    [handleFinalTranscript]
  );

  // Hands-Free VAD with 1.2s Rolling PCM Pre-Roll Buffer (never cuts off your first word!)
  const startWhisperVadHandsFree = useCallback(
    async (overrideMicId?: string) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError("Microphone access is not available in this browser.");
        return;
      }

      const micId = overrideMicId ?? selectedMicIdRef.current;
      stopRecognitionInstance();
      enabledRef.current = true;
      setEngineMode("whisper-vad");
      setEnabled(true);
      setError(null);
      setMicDiagnostic(null);
      setMicStatus("starting");
      setLastAction('Starting Hands-Free Whisper listening — say "Hey CookFlow" + command');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            ...(micId && micId !== "default" ? { deviceId: { exact: micId } } : {}),
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
        if (!enabledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeMicStreamRef.current = stream;
        setMicPermission("granted");
        await refreshAudioDevices();
        setMicStatus("listening");

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }
        vadAudioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(2048, 1, 1);
        const silentGain = audioCtx.createGain();
        silentGain.gain.value = 0;
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(audioCtx.destination);
        vadProcessorRef.current = processor;

        // Maintain a rolling ~1.2s pre-roll buffer of Float32 chunks so initial syllables are never cut off
        const maxPreRollSamples = Math.ceil(audioCtx.sampleRate * 1.2);
        let preRollChunks: Float32Array[] = [];
        let preRollSampleCount = 0;

        let capturingSpeech = false;
        let capturedChunks: Float32Array[] = [];
        let speechStartedAt = 0;
        let lastLoudAt = 0;
        let uiMeterThrottle = 0;

        processor.onaudioprocess = (event: AudioProcessingEvent) => {
          if (!enabledRef.current) return;
          const input = event.inputBuffer.getChannelData(0);
          const copy = new Float32Array(input.length);
          copy.set(input);

          let sumSq = 0;
          for (let i = 0; i < copy.length; i += 1) {
            sumSq += copy[i] * copy[i];
          }
          const rms = Math.sqrt(sumSq / copy.length);

          const now = Date.now();
          if (now - uiMeterThrottle > 90) {
            uiMeterThrottle = now;
            setMicLevel(Math.min(100, Math.round(rms * 500)));
          }

          // While TTS or Whisper/AI is active, reset buffers so CookFlow doesn't hear itself
          if (isSpeakingRef.current || isTranscribingRef.current || isAskingAiRef.current) {
            capturingSpeech = false;
            capturedChunks = [];
            preRollChunks = [];
            preRollSampleCount = 0;
            return;
          }

          const ONSET_RMS = 0.015;
          const HOLD_RMS = 0.01;

          if (!capturingSpeech) {
            preRollChunks.push(copy);
            preRollSampleCount += copy.length;
            while (preRollSampleCount > maxPreRollSamples && preRollChunks.length > 1) {
              const dropped = preRollChunks.shift();
              if (dropped) preRollSampleCount -= dropped.length;
            }

            if (rms > ONSET_RMS) {
              capturingSpeech = true;
              speechStartedAt = now;
              lastLoudAt = now;
              capturedChunks = [...preRollChunks];
              preRollChunks = [];
              preRollSampleCount = 0;
              setInterimTranscript("Listening to voice...");
            }
          } else {
            capturedChunks.push(copy);
            if (rms > HOLD_RMS) {
              lastLoudAt = now;
            }

            const silenceMs = now - lastLoudAt;
            const totalMs = now - speechStartedAt;
            if (silenceMs > 1150 || totalMs > 11000) {
              capturingSpeech = false;
              const finishedChunks = capturedChunks;
              capturedChunks = [];
              setInterimTranscript("");
              const wavBlob = encodeFloat32ChunksToWavBlob(finishedChunks, audioCtx.sampleRate);
              sendWavBlobToWhisper(wavBlob);
            }
          }
        };

        logger.info(
          "VoiceControl",
          `Hands-Free Whisper VAD + 1.2s Pre-Roll active on mic: ${stream.getAudioTracks()[0]?.label || micId}`
        );
      } catch (err) {
        const errName = err instanceof DOMException ? err.name : "UnknownError";
        logger.warn("VoiceControl", `Hands-Free Whisper mic error: ${errName}`, err);
        enabledRef.current = false;
        setEnabled(false);
        setMicStatus("idle");
        setError(
          `Could not open selected microphone (${errName}). Check Windows Microphone settings and allow mic access in your browser.`
        );
      }
    },
    [refreshAudioDevices, sendWavBlobToWhisper, stopRecognitionInstance]
  );

  const togglePushToTalk = useCallback(async () => {
    if (isPushToTalkRecording && pttStopFnRef.current) {
      pttStopFnRef.current();
      pttStopFnRef.current = null;
      setIsPushToTalkRecording(false);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicDiagnostic("Microphone recording is not supported in this browser.");
      return;
    }

    try {
      const micId = selectedMicIdRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(micId && micId !== "default" ? { deviceId: { exact: micId } } : {}),
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      setMicPermission("granted");
      await refreshAudioDevices();

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(2048, 1, 1);
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);

      const chunks: Float32Array[] = [];
      processor.onaudioprocess = (ev) => {
        const ch = ev.inputBuffer.getChannelData(0);
        const copy = new Float32Array(ch.length);
        copy.set(ch);
        chunks.push(copy);
      };

      pttStopFnRef.current = () => {
        processor.disconnect();
        processor.onaudioprocess = null;
        stream.getTracks().forEach((t) => t.stop());
        const sampleRate = ctx.sampleRate;
        void ctx.close().catch(() => {});

        const wavBlob = encodeFloat32ChunksToWavBlob(chunks, sampleRate);
        if (wavBlob.size < 1600 || !handlersRef.current.onTranscribeAudio) {
          setLastAction("Recording too short — speak clearly then click Stop.");
          return;
        }
        isTranscribingRef.current = true;
        setIsTranscribing(true);
        setLastAction("Transcribing with Groq Whisper...");
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = typeof reader.result === "string" ? reader.result : "";
          const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
          void handlersRef.current
            .onTranscribeAudio!(base64, "audio/wav")
            .then((transcript) => {
              const clean = transcript.trim();
              if (clean) runTextCommand(clean);
              else setLastAction("Didn't catch any words — try again.");
            })
            .catch((err) => {
              setLastAction(err instanceof Error ? err.message : "Transcription failed");
            })
            .finally(() => {
              isTranscribingRef.current = false;
              setIsTranscribing(false);
            });
        };
        reader.readAsDataURL(wavBlob);
      };

      setIsPushToTalkRecording(true);
      setLastAction("Recording... speak your command, then click 'Stop & Run'");
    } catch (err) {
      const errName = err instanceof DOMException ? err.name : "UnknownError";
      setMicDiagnostic(`Could not access selected microphone (${errName}).`);
    }
  }, [isPushToTalkRecording, refreshAudioDevices, runTextCommand]);

  const testMicHardware = useCallback(async () => {
    setMicDiagnostic("Checking microphone hardware...");
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicDiagnostic("Browser does not expose navigator.mediaDevices.getUserMedia.");
      return;
    }
    try {
      const micId = selectedMicIdRef.current;
      const constraints: MediaStreamConstraints = {
        audio: micId && micId !== "default" ? { deviceId: { exact: micId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = stream.getAudioTracks()[0];
      const deviceLabel = track?.label || "Default Microphone";
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
      await refreshAudioDevices();
      setMicDiagnostic(`Hardware mic OK (${deviceLabel})!`);
    } catch (err) {
      const errName = err instanceof DOMException ? err.name : "UnknownError";
      setMicDiagnostic(
        `Hardware mic blocked (${errName}). Enable Microphone in Windows Settings -> Privacy -> Microphone and in your browser address bar.`
      );
    }
  }, [refreshAudioDevices]);

  const startRecognitionSync = useCallback(
    (overrideMicId?: string) => {
      const Ctor = getSpeechRecognitionCtor();
      if (isOperaOrBraveBrowser() || !Ctor) {
        void startWhisperVadHandsFree(overrideMicId);
        return;
      }

      const micId = overrideMicId ?? selectedMicIdRef.current;
      stopRecognitionInstance();
      enabledRef.current = true;
      hasStartedRef.current = false;
      consecutiveFailuresRef.current = 0;
      setEngineMode("native-speech");
      setEnabled(true);
      setError(null);
      setMicDiagnostic(null);
      setMicStatus("starting");
      setLastAction('Say "Hey CookFlow" + command or cooking question');

      if (
        micId &&
        micId !== "default" &&
        typeof navigator !== "undefined" &&
        navigator.mediaDevices?.getUserMedia
      ) {
        void navigator.mediaDevices
          .getUserMedia({ audio: { deviceId: { exact: micId } } })
          .then((stream) => {
            if (!enabledRef.current) {
              stream.getTracks().forEach((t) => t.stop());
              return;
            }
            activeMicStreamRef.current = stream;
            void refreshAudioDevices();
          })
          .catch(() => {});
      }

      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      startWatchdogRef.current = window.setTimeout(() => {
        if (!hasStartedRef.current && enabledRef.current) {
          logger.warn("VoiceControl", "Native Web Speech timed out; falling back to Whisper VAD");
          void startWhisperVadHandsFree(micId);
        }
      }, 3000);

      recognition.onstart = () => {
        if (startWatchdogRef.current !== null) {
          window.clearTimeout(startWatchdogRef.current);
          startWatchdogRef.current = null;
        }
        hasStartedRef.current = true;
        consecutiveFailuresRef.current = 0;
        setMicStatus("listening");
        setError(null);
        void refreshAudioDevices();
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (!result || !result[0]?.transcript) continue;
          if (result.isFinal) {
            handleFinalTranscript(result[0].transcript);
          } else if (!isSpeakingRef.current) {
            interim += result[0].transcript;
          }
        }
        if (interim.trim()) {
          setInterimTranscript(interim.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        if (event.error === "network" || event.error === "service-not-allowed") {
          void startWhisperVadHandsFree(micId);
          return;
        }
        enabledRef.current = false;
        setEnabled(false);
        stopRecognitionInstance();
        setError(
          "Microphone permission was denied. Allow Microphone in your browser address bar, then click Retry Mic."
        );
      };

      recognition.onend = () => {
        setInterimTranscript("");
        if (!enabledRef.current) {
          setMicStatus("idle");
          return;
        }
        if (!hasStartedRef.current) {
          consecutiveFailuresRef.current += 1;
          if (consecutiveFailuresRef.current >= 2) {
            void startWhisperVadHandsFree(micId);
            return;
          }
        }
        setMicStatus("reconnecting");
        restartTimerRef.current = window.setTimeout(() => {
          if (enabledRef.current && recognitionRef.current === recognition) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        }, 350);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        void startWhisperVadHandsFree(micId);
      }
    },
    [handleFinalTranscript, refreshAudioDevices, startWhisperVadHandsFree, stopRecognitionInstance]
  );

  const selectMicDevice = useCallback(
    (deviceId: string) => {
      setSelectedMicId(deviceId);
      selectedMicIdRef.current = deviceId;
      try {
        window.localStorage.setItem(SAVED_MIC_KEY, deviceId);
      } catch {
        // ignore
      }
      const label = audioInputs.find((d) => d.deviceId === deviceId)?.label || "Default Microphone";
      setLastAction(`Microphone set to ${label}`);
      if (enabledRef.current) {
        startRecognitionSync(deviceId);
      }
    },
    [audioInputs, startRecognitionSync]
  );

  useEffect(() => {
    return () => {
      enabledRef.current = false;
      stopRecognitionInstance();
      stopSpeaking();
      clearAwakeWindow();
    };
  }, [stopRecognitionInstance, stopSpeaking, clearAwakeWindow]);

  const toggleVoiceMode = useCallback(() => {
    if (enabledRef.current) {
      enabledRef.current = false;
      setEnabled(false);
      stopRecognitionInstance();
      clearAwakeWindow();
      stopSpeaking();
      setError(null);
      setMicDiagnostic(null);
      setLastAction("");
      setLastHeard("");
      setLastAiAnswer(null);
      return;
    }
    startRecognitionSync();
  }, [startRecognitionSync, stopRecognitionInstance, clearAwakeWindow, stopSpeaking]);

  const retryMic = useCallback(() => {
    startRecognitionSync();
  }, [startRecognitionSync]);

  return {
    supported,
    enabled,
    engineMode,
    isListening: micStatus === "listening",
    micStatus,
    micLevel,
    micPermission,
    awakeForCommand,
    isSpeaking,
    isAskingAi,
    isPushToTalkRecording,
    isTranscribing,
    availableVoices,
    selectedVoiceName,
    audioInputs,
    audioOutputs,
    selectedMicId,
    selectedOutputId,
    outputSelectionSupported,
    interimTranscript,
    lastHeard,
    lastAction,
    lastAiAnswer,
    micDiagnostic,
    error,
    toggleVoiceMode,
    retryMic,
    togglePushToTalk,
    refreshAudioDevices,
    selectMicDevice,
    selectOutputDevice,
    testMicHardware,
    runTextCommand,
    selectVoice,
    speakText,
    stopSpeaking,
  };
}
