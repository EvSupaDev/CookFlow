import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import type { ActiveTimer } from "@/types/recipe";

interface UseKitchenTimersOptions {
  onTimerFinished?: (label: string) => void;
}

const SAVED_OUTPUT_KEY = "cookflow_audio_output_v1";

async function playTimerDoneChime(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const savedSink = window.localStorage.getItem(SAVED_OUTPUT_KEY);
    const ctxWithSink = ctx as AudioContext & {
      setSinkId?: (id: string) => Promise<void>;
    };
    if (savedSink && savedSink !== "default" && typeof ctxWithSink.setSinkId === "function") {
      await ctxWithSink.setSinkId(savedSink);
    }

    const notes = [587.33, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startAt = ctx.currentTime + idx * 0.14;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startAt);
      gain.gain.setValueAtTime(0.001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.36);
    });
  } catch (err) {
    logger.debug("Timers", "Completion audio chime skipped", err);
  }
}

export function useKitchenTimers({ onTimerFinished }: UseKitchenTimersOptions = {}) {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const onFinishedRef = useRef(onTimerFinished);
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  onFinishedRef.current = onTimerFinished;

  // Accepts both (seconds, label) and (label, seconds) so callers can never cause NaN:NaN
  const startTimer = useCallback(
    (arg1: number | string, arg2?: string | number) => {
      let parsedSeconds: number;
      let parsedLabel: string;

      if (typeof arg1 === "number") {
        parsedSeconds = arg1;
        parsedLabel = typeof arg2 === "string" && arg2.trim() ? arg2.trim() : "Kitchen Timer";
      } else {
        parsedLabel = arg1.trim() || "Kitchen Timer";
        parsedSeconds = typeof arg2 === "number" ? arg2 : Number(arg2);
      }

      const safeSeconds =
        Number.isFinite(parsedSeconds) && parsedSeconds > 0 ? Math.round(parsedSeconds) : 60;
      const id = `timer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      logger.info("Timers", `Started timer '${parsedLabel}' for ${safeSeconds}s [id=${id}]`);
      setTimers((prev) => [
        ...prev,
        {
          id,
          label: parsedLabel,
          totalSeconds: safeSeconds,
          remaining: safeSeconds,
          running: true,
          done: false,
        },
      ]);
    },
    []
  );

  const togglePauseTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.done) return t;
        const nextRunning = !t.running;
        logger.info("Timers", `${nextRunning ? "Resumed" : "Paused"} timer '${t.label}'`);
        return { ...t, running: nextRunning };
      })
    );
  }, []);

  const removeTimer = useCallback((id: string) => {
    notifiedIdsRef.current.delete(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const hasRunning = timers.some((t) => t.running && !t.done);
    if (!hasRunning) return;

    const interval = window.setInterval(() => {
      const newlyDoneLabels: string[] = [];

      setTimers((prev) =>
        prev.map((t) => {
          if (!t.running || t.done) return t;
          const nextRemaining = Math.max(0, t.remaining - 1);
          if (nextRemaining === 0) {
            if (!notifiedIdsRef.current.has(t.id)) {
              notifiedIdsRef.current.add(t.id);
              newlyDoneLabels.push(t.label);
            }
            return { ...t, remaining: 0, running: false, done: true };
          }
          return { ...t, remaining: nextRemaining };
        })
      );

      if (newlyDoneLabels.length > 0) {
        void playTimerDoneChime();
        for (const label of newlyDoneLabels) {
          logger.info("Timers", `Timer finished: '${label}'`);
          onFinishedRef.current?.(label);
        }
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timers]);

  return {
    timers,
    startTimer,
    togglePauseTimer,
    removeTimer,
  };
}
