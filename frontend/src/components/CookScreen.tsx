import { Fragment, useCallback, useRef, useState } from "react";
import { useVoiceCookControl } from "@/hooks/useVoiceCookControl";
import { askKitchenRescueApi, transcribeVoiceAudioApi } from "@/lib/api";
import {
  formatTimerSeconds,
  getResolvedIngredient,
  parseStepInstructionSegments,
} from "@/lib/kitchenUtils";
import { logger } from "@/lib/logger";
import type { ActiveTimer, IngredientSwap, Recipe } from "@/types/recipe";

interface CookScreenProps {
  recipe: Recipe;
  servings: number;
  swaps: Record<string, number>;
  aiSwapsByIng: Record<string, IngredientSwap[]>;
  currentStep: number;
  stepCompleted: boolean;
  activeTimers: ActiveTimer[];
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
  onOpenIngredientsDrawer: () => void;
  onOpenKitchenRescue: () => void;
  onStartTimer: (seconds: number, label: string) => void;
  onToggleTimerPause?: (id: string) => void;
  onRemoveTimer?: (id: string) => void;
  onJumpToStep: (idx: number) => void;
  onChangeStep: (delta: number) => void;
  onRestartSteps: () => void;
  onBackToDiscover: () => void;
}

export function CookScreen({
  recipe,
  servings,
  swaps,
  aiSwapsByIng,
  currentStep,
  stepCompleted,
  activeTimers,
  wakeLockActive,
  onToggleWakeLock,
  onOpenIngredientsDrawer,
  onOpenKitchenRescue,
  onStartTimer,
  onToggleTimerPause,
  onRemoveTimer,
  onJumpToStep,
  onChangeStep,
  onRestartSteps,
  onBackToDiscover,
}: CookScreenProps) {
  const touchStartXRef = useRef<number | null>(null);
  const [quickCmdInput, setQuickCmdInput] = useState("");
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const safeStepIdx = Math.min(currentStep, recipe.steps.length - 1);
  const step = recipe.steps[safeStepIdx];

  const segments = parseStepInstructionSegments(
    recipe,
    step.text,
    servings,
    swaps,
    aiSwapsByIng
  );

  const plainStepText = segments.map((s) => s.value).join("");

  const stepIngredients = (step.ingredientIds ?? [])
    .map((id) => recipe.ingredients.find((ing) => ing.id === id))
    .filter((ing): ing is NonNullable<typeof ing> => Boolean(ing))
    .map((ing) => getResolvedIngredient(recipe, ing, servings, swaps, aiSwapsByIng));

  const handleStartStepTimerFromVoice = useCallback((): boolean => {
    if (!step.timer) return false;
    logger.info("CookMode", `Voice triggered step timer '${step.timer.label}' (${step.timer.seconds}s)`);
    onStartTimer(step.timer.seconds, step.timer.label);
    return true;
  }, [step.timer, onStartTimer]);

  const handleStartCustomTimerFromVoice = useCallback(
    (label: string, seconds: number) => {
      logger.info("CookMode", `Voice triggered custom timer '${label}' (${seconds}s)`);
      onStartTimer(seconds, label);
    },
    [onStartTimer]
  );

  const handlePauseTimersFromVoice = useCallback(
    (targetQuery?: string): boolean => {
      if (!onToggleTimerPause) return false;
      const runningTimers = activeTimers.filter((t) => !t.done && t.running);
      if (runningTimers.length === 0) return false;

      const q = (targetQuery ?? "").toLowerCase();
      if (/\ball\b/.test(q)) {
        runningTimers.forEach((t) => onToggleTimerPause(t.id));
        logger.info("CookMode", `Voice paused all (${runningTimers.length}) running timer(s)`);
        return true;
      }

      const matched =
        runningTimers.find((t) => q.includes(t.label.toLowerCase())) ??
        runningTimers[runningTimers.length - 1];
      onToggleTimerPause(matched.id);
      logger.info("CookMode", `Voice paused timer '${matched.label}' [id=${matched.id}]`);
      return true;
    },
    [activeTimers, onToggleTimerPause]
  );

  const handleResumeTimersFromVoice = useCallback(
    (targetQuery?: string): boolean => {
      if (!onToggleTimerPause) return false;
      const pausedTimers = activeTimers.filter((t) => !t.done && !t.running);
      if (pausedTimers.length === 0) return false;

      const q = (targetQuery ?? "").toLowerCase();
      if (/\ball\b/.test(q)) {
        pausedTimers.forEach((t) => onToggleTimerPause(t.id));
        logger.info("CookMode", `Voice resumed all (${pausedTimers.length}) paused timer(s)`);
        return true;
      }

      const matched =
        pausedTimers.find((t) => q.includes(t.label.toLowerCase())) ??
        pausedTimers[pausedTimers.length - 1];
      onToggleTimerPause(matched.id);
      logger.info("CookMode", `Voice resumed timer '${matched.label}' [id=${matched.id}]`);
      return true;
    },
    [activeTimers, onToggleTimerPause]
  );

  const handleCancelTimersFromVoice = useCallback(
    (targetQuery?: string): boolean => {
      if (!onRemoveTimer || activeTimers.length === 0) return false;

      const q = (targetQuery ?? "").toLowerCase();
      if (/\ball\b/.test(q)) {
        activeTimers.forEach((t) => onRemoveTimer(t.id));
        logger.info("CookMode", `Voice canceled all (${activeTimers.length}) timer(s)`);
        return true;
      }

      const matched =
        activeTimers.find((t) => q.includes(t.label.toLowerCase())) ??
        activeTimers[activeTimers.length - 1];
      onRemoveTimer(matched.id);
      logger.info("CookMode", `Voice canceled timer '${matched.label}' [id=${matched.id}]`);
      return true;
    },
    [activeTimers, onRemoveTimer]
  );

  const getStepReadoutText = useCallback(() => {
    if (stepCompleted) {
      return `You finished cooking ${recipe.title}. Enjoy your meal!`;
    }
    const tipPart = step.tip ? ` Tip: ${step.tip}` : "";
    return `Step ${safeStepIdx + 1} of ${recipe.steps.length}. ${step.phase}. ${plainStepText}${tipPart}`;
  }, [stepCompleted, recipe.title, recipe.steps.length, safeStepIdx, step.phase, step.tip, plainStepText]);

  const handleAskVoiceAi = useCallback(
    async (spokenQuestion: string) => {
      const activeIngredientList = recipe.ingredients.map(
        (ing) => getResolvedIngredient(recipe, ing, servings, swaps, aiSwapsByIng).fullPhrase
      );
      return await askKitchenRescueApi({
        recipeTitle: recipe.title,
        currentStepNumber: safeStepIdx + 1,
        totalSteps: recipe.steps.length,
        currentStepText: plainStepText,
        activeIngredients: activeIngredientList,
        question: spokenQuestion,
      });
    },
    [recipe, servings, swaps, aiSwapsByIng, safeStepIdx, plainStepText]
  );

  const voice = useVoiceCookControl({
    onNextStep: () => onChangeStep(1),
    onPrevStep: () => onChangeStep(-1),
    onJumpToStep,
    onOpenIngredients: onOpenIngredientsDrawer,
    onOpenAssistant: onOpenKitchenRescue,
    onStartStepTimer: handleStartStepTimerFromVoice,
    onStartCustomTimer: handleStartCustomTimerFromVoice,
    onPauseTimers: handlePauseTimersFromVoice,
    onResumeTimers: handleResumeTimersFromVoice,
    onCancelTimers: handleCancelTimersFromVoice,
    getStepReadoutText,
    onAskVoiceAi: handleAskVoiceAi,
    onTranscribeAudio: transcribeVoiceAudioApi,
    totalSteps: recipe.steps.length,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const diff = touchStartXRef.current - endX;
    touchStartXRef.current = null;
    if (Math.abs(diff) > 55) {
      onChangeStep(diff > 0 ? 1 : -1);
    }
  };

  const matchingActiveTimer = step.timer
    ? activeTimers.find((t) => t.label === step.timer?.label && !t.done)
    : undefined;

  const micStatusLabel =
    voice.micStatus === "listening"
      ? voice.engineMode === "whisper-vad"
        ? "Mic active (Whisper Auto + Pre-Roll)"
        : "Mic active"
      : voice.micStatus === "starting"
        ? "Starting mic..."
        : "Reconnecting mic...";

  const showVoicePanel =
    voice.enabled || Boolean(voice.error) || audioSettingsOpen || voice.isPushToTalkRecording || voice.isTranscribing;

  return (
    <section
      className="space-y-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Cook Mode Utility Row: Progress + Hands-Free & Read Controls */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-700 truncate">
              {recipe.title}
            </p>
            <p className="text-xs text-stone-500">
              {stepCompleted
                ? "All steps complete!"
                : `Step ${safeStepIdx + 1} of ${recipe.steps.length} • ${step.phase}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={voice.toggleVoiceMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                voice.enabled
                  ? voice.awakeForCommand || voice.isAskingAi || voice.isTranscribing
                    ? "border-terracotta-600 bg-terracotta-600 text-white shadow-sm"
                    : "border-sage-700 bg-sage-700 text-white shadow-xs"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
              title='Enable Hands-Free Voice ("Hey CookFlow")'
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  voice.enabled
                    ? voice.awakeForCommand || voice.isAskingAi || voice.isTranscribing
                      ? "bg-white animate-ping"
                      : "bg-emerald-300 animate-pulse"
                    : "bg-stone-300"
                }`}
              />
              <span>
                {voice.enabled
                  ? voice.isAskingAi || voice.isTranscribing
                    ? "Thinking..."
                    : voice.awakeForCommand
                      ? "Listening..."
                      : "Voice On"
                  : "Hands-Free Voice"}
              </span>
            </button>

            {/* Read Aloud + Always-Visible Voice Selector */}
            <div className="inline-flex items-center rounded-full border border-stone-200 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  if (voice.isSpeaking) {
                    voice.stopSpeaking();
                  } else {
                    voice.speakText(getStepReadoutText());
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  voice.isSpeaking
                    ? "bg-terracotta-50 text-terracotta-700"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
                aria-label={voice.isSpeaking ? "Stop reading step" : "Read step aloud"}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <span>{voice.isSpeaking ? "Stop" : "Read"}</span>
              </button>

              {voice.availableVoices.length > 0 && (
                <select
                  aria-label="Select Read Aloud voice"
                  title="Select Read Aloud & AI voice"
                  value={voice.selectedVoiceName}
                  onChange={(e) => voice.selectVoice(e.target.value)}
                  className="max-w-[125px] sm:max-w-[155px] truncate border-l border-stone-200 bg-cream/60 px-2 py-1.5 text-[11px] text-stone-700 focus:outline-none focus:bg-white cursor-pointer"
                >
                  {voice.availableVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Audio Devices (Mic & Headphones) Toggle */}
            <button
              type="button"
              onClick={() => {
                void voice.refreshAudioDevices();
                setAudioSettingsOpen((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                audioSettingsOpen
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
              title="Choose Microphone and Headphones / Speaker"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              <span className="hidden sm:inline">Audio</span>
            </button>

            <button
              type="button"
              onClick={onToggleWakeLock}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                wakeLockActive
                  ? "border-sage-700/40 bg-sage-50 text-sage-800"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
              title="Prevent screen from dimming while cooking"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  wakeLockActive ? "bg-sage-700" : "bg-stone-300"
                }`}
              />
              <span className="hidden sm:inline">
                {wakeLockActive ? "Screen awake" : "Keep awake"}
              </span>
            </button>
          </div>
        </div>

        {/* Segmented Step Progress Bar */}
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Recipe steps">
          {recipe.steps.map((s, idx) => {
            const isCurrent = !stepCompleted && idx === safeStepIdx;
            const isPast = stepCompleted || idx < safeStepIdx;
            return (
              <button
                key={`${recipe.id}-bar-${idx}`}
                type="button"
                onClick={() => onJumpToStep(idx)}
                aria-label={`Go to step ${idx + 1}: ${s.phase}`}
                className={`h-2 flex-1 rounded-full transition-all ${
                  isCurrent
                    ? "bg-terracotta-600"
                    : isPast
                      ? "bg-sage-700/70"
                      : "bg-stone-200 hover:bg-stone-300"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Live Hands-Free Voice & Audio Device Panel */}
      {showVoicePanel && (
        <div
          className={`rounded-2xl px-4 py-3 border text-xs space-y-2.5 transition-colors ${
            voice.error
              ? "bg-red-50 border-red-200 text-red-800"
              : voice.awakeForCommand || voice.isAskingAi || voice.isPushToTalkRecording || voice.isTranscribing
                ? "bg-terracotta-50 border-terracotta-600/40 text-terracotta-900"
                : "bg-sage-50/90 border-sage-700/25 text-sage-900"
          }`}
        >
          {/* Microphone & Headphones / Output Device Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-black/10">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold opacity-80">Microphone Input</span>
              <select
                value={voice.selectedMicId}
                onChange={(e) => voice.selectMicDevice(e.target.value)}
                className="rounded-xl border border-stone-300/90 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-terracotta-600"
              >
                <option value="default">System Default Microphone</option>
                {voice.audioInputs
                  .filter((d) => d.deviceId !== "default")
                  .map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold opacity-80">
                  Headphones / Speaker Output
                </span>
                <button
                  type="button"
                  onClick={() => void voice.refreshAudioDevices()}
                  className="text-[10px] underline opacity-75 hover:opacity-100"
                >
                  Refresh
                </button>
              </div>
              <select
                value={voice.selectedOutputId}
                onChange={(e) => voice.selectOutputDevice(e.target.value)}
                className="rounded-xl border border-stone-300/90 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-terracotta-600"
              >
                <option value="default">System Default Headphones / Speaker</option>
                {voice.audioOutputs
                  .filter((d) => d.deviceId !== "default")
                  .map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {/* Live Mic Input Level Meter (when in Whisper Auto-VAD mode) */}
          {voice.enabled && voice.engineMode === "whisper-vad" && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] opacity-75 shrink-0">Mic Level:</span>
              <div className="flex-1 h-2 rounded-full bg-black/10 overflow-hidden">
                <div
                  className="h-full bg-sage-700 transition-all duration-100"
                  style={{ width: `${Math.max(4, voice.micLevel)}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => void voice.togglePushToTalk()}
                disabled={voice.isTranscribing}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  voice.isPushToTalkRecording
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-stone-900 hover:bg-stone-800 text-white"
                }`}
              >
                {voice.isPushToTalkRecording ? "Stop & Run" : "Speak Now"}
              </button>
            </div>
          )}

          {voice.error ? (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-medium leading-relaxed flex-1 min-w-[200px]">{voice.error}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => void voice.testMicHardware()}
                  className="px-3 py-1.5 rounded-full border border-red-300 bg-white hover:bg-red-100 text-red-700 text-[11px] font-semibold transition-colors"
                >
                  Test Mic
                </button>
                <button
                  type="button"
                  onClick={voice.retryMic}
                  className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors"
                >
                  Retry Mic
                </button>
              </div>
            </div>
          ) : (
            voice.enabled && (
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">
                  {voice.isAskingAi || voice.isTranscribing
                    ? "Processing voice..."
                    : voice.awakeForCommand
                      ? "CookFlow is listening — speak your command or question"
                      : 'Hands-Free Ready — say "Hey CookFlow" + command or question'}
                </span>
                <span className="text-[11px] opacity-75 shrink-0">
                  {micStatusLabel}
                </span>
              </div>
            )
          )}

          {voice.micDiagnostic && (
            <p className="text-[11px] bg-white/90 border border-stone-200 rounded-xl px-3 py-2 text-stone-800">
              {voice.micDiagnostic}
            </p>
          )}

          {voice.lastAction && (
            <p className="text-[11px] opacity-90">{voice.lastAction}</p>
          )}

          {voice.interimTranscript && (
            <p className="text-[11px] italic opacity-80 truncate">
              Hearing: &ldquo;{voice.interimTranscript}&rdquo;
            </p>
          )}

          {voice.lastAiAnswer && (
            <div className="mt-1 p-2.5 rounded-xl bg-white/95 border border-stone-200/80 text-stone-800 text-xs leading-relaxed">
              {voice.lastAiAnswer}
            </div>
          )}

          {voice.lastHeard && (
            <p className="text-[11px] opacity-70 truncate">
              Heard: &ldquo;{voice.lastHeard}&rdquo;
            </p>
          )}

          <p className="text-[11px] opacity-75">
            Commands: <strong>&ldquo;next step&rdquo;</strong> •{" "}
            <strong>&ldquo;go to ingredients&rdquo;</strong> •{" "}
            <strong>&ldquo;set a 5m timer&rdquo;</strong> •{" "}
            <strong>&ldquo;pause timer&rdquo;</strong> •{" "}
            <strong>&ldquo;resume timer&rdquo;</strong>
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!quickCmdInput.trim()) return;
              voice.runTextCommand(quickCmdInput);
              setQuickCmdInput("");
            }}
            className="flex items-center gap-2 pt-0.5"
          >
            <input
              type="text"
              value={quickCmdInput}
              onChange={(e) => setQuickCmdInput(e.target.value)}
              placeholder='Quick command or AI question: "set a 5m timer", "pause timer", "next step"...'
              className="flex-1 rounded-xl border border-stone-300/90 bg-white px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-600"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold transition-colors"
            >
              Run
            </button>
          </form>
        </div>
      )}

      {/* Active Step Card OR Completion Card */}
      {stepCompleted ? (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-7 sm:p-10 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sage-50 text-sage-700 flex items-center justify-center">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Dinner is served!
            </h2>
            <p className="text-sm text-stone-600 max-w-md mx-auto">
              You finished <strong className="text-stone-900">{recipe.title}</strong> ({servings}{" "}
              {servings === 1 ? "serving" : "servings"}).
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onRestartSteps}
              className="px-5 py-2.5 rounded-2xl border border-stone-300 bg-white text-stone-700 text-sm font-semibold hover:bg-stone-50 transition-colors"
            >
              Review Steps
            </button>
            <button
              type="button"
              onClick={onBackToDiscover}
              className="px-6 py-2.5 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              Back to All Recipes
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-7 space-y-5 shadow-xs">
          {/* Step Card Header */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand text-stone-800 text-xs font-semibold">
              <span>Step {safeStepIdx + 1}</span>
              <span className="text-stone-400">•</span>
              <span>{step.phase}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenIngredientsDrawer}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-stone-200 bg-cream/70 text-stone-700 hover:bg-sand transition-colors"
              >
                All Ingredients
              </button>
              <button
                type="button"
                onClick={onOpenKitchenRescue}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-sage-700/30 bg-sage-50 text-sage-800 hover:bg-sage-100 transition-colors"
              >
                Need help?
              </button>
            </div>
          </div>

          {/* High-Readability Step Instruction */}
          <p className="text-xl sm:text-2xl font-medium text-stone-900 leading-relaxed">
            {segments.map((seg, idx) =>
              seg.type === "ingredient" ? (
                <span
                  key={idx}
                  className="font-semibold text-terracotta-700 bg-terracotta-50 px-1.5 py-0.5 rounded-lg"
                >
                  {seg.value}
                </span>
              ) : (
                <Fragment key={idx}>{seg.value}</Fragment>
              )
            )}
          </p>

          {/* Embedded Step Timer Button + Quick Pause/Resume Controls */}
          {(step.timer || activeTimers.length > 0) && (
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              {step.timer && (
                <button
                  type="button"
                  onClick={() => onStartTimer(step.timer!.seconds, step.timer!.label)}
                  className="inline-flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-sage-700 hover:bg-sage-800 active:scale-[0.99] text-white text-sm font-semibold shadow-sm transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>
                    {matchingActiveTimer
                      ? `${step.timer.label} ${matchingActiveTimer.running ? "running" : "paused"} (${formatTimerSeconds(matchingActiveTimer.remaining)})`
                      : `Start ${Math.max(1, Math.round(step.timer.seconds / 60))} min timer • ${step.timer.label}`}
                  </span>
                </button>
              )}

              {activeTimers.map((t) => (
                <div
                  key={t.id}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold ${
                    t.done
                      ? "border-terracotta-600 bg-terracotta-50 text-terracotta-800"
                      : "border-stone-200 bg-cream text-stone-800"
                  }`}
                >
                  <span>{t.label}:</span>
                  <span className="font-mono">
                    {t.done ? "Done!" : formatTimerSeconds(t.remaining)}
                  </span>
                  {!t.done && onToggleTimerPause && (
                    <button
                      type="button"
                      onClick={() => onToggleTimerPause(t.id)}
                      className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold transition-colors"
                    >
                      {t.running ? "Pause" : "Resume"}
                    </button>
                  )}
                  {onRemoveTimer && (
                    <button
                      type="button"
                      onClick={() => onRemoveTimer(t.id)}
                      aria-label={`Cancel ${t.label}`}
                      className="px-2 py-1 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-600 text-[11px] transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Optional Kitchen Tip */}
          {step.tip && (
            <div className="p-3.5 rounded-2xl bg-cream border border-stone-200/80 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <strong className="font-semibold text-stone-900">Kitchen tip: </strong>
              {step.tip}
            </div>
          )}

          {/* Isolated Ingredients for This Step */}
          {stepIngredients.length > 0 && (
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                For this step
              </p>
              <div className="flex flex-wrap gap-2">
                {stepIngredients.map((ing) => (
                  <span
                    key={ing.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      ing.isSwapped
                        ? "bg-sage-50 text-sage-800 border border-sage-700/20"
                        : "bg-sand/80 text-stone-800"
                    }`}
                  >
                    <strong>
                      {ing.formattedQty} {ing.unit}
                    </strong>{" "}
                    {ing.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Oversized Wet-Hand-Friendly Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-cream/95 backdrop-blur border-t border-stone-200/90 p-3.5 sm:p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            type="button"
            disabled={!stepCompleted && safeStepIdx === 0}
            onClick={() => onChangeStep(-1)}
            className="px-5 py-3.5 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 text-stone-800 font-semibold text-sm sm:text-base transition-colors"
          >
            &larr; Back
          </button>
          <button
            type="button"
            onClick={() => (stepCompleted ? onBackToDiscover() : onChangeStep(1))}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 active:scale-[0.99] text-white font-semibold text-base shadow-md shadow-terracotta-600/20 transition-all"
          >
            {stepCompleted
              ? "Finish & Back to Recipes"
              : safeStepIdx === recipe.steps.length - 1
                ? "Finish Cooking ✓"
                : "Next Step →"}
          </button>
        </div>
      </div>
    </section>
  );
}
