import { useCallback, useEffect, useRef, useState } from "react";
import { playGentleChime } from "@/lib/kitchenUtils";
import { logger } from "@/lib/logger";
import type { ActiveTimer } from "@/types/recipe";

interface UseKitchenTimersOptions {
  onTimerFinished?: (label: string) => void;
}

export function useKitchenTimers({ onTimerFinished }: UseKitchenTimersOptions = {}) {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const onFinishedRef = useRef(onTimerFinished);
  onFinishedRef.current = onTimerFinished;

  const hasRunningTimers = timers.some((t) => t.running && !t.done);

  useEffect(() => {
    if (!hasRunningTimers) return;

    const intervalId = window.setInterval(() => {
      const newlyCompletedLabels: string[] = [];

      setTimers((prev) =>
        prev.map((timer) => {
          if (!timer.running || timer.done) return timer;
          const nextRemaining = timer.remaining - 1;
          if (nextRemaining <= 0) {
            newlyCompletedLabels.push(timer.label);
            return {
              ...timer,
              remaining: 0,
              running: false,
              done: true,
            };
          }
          return {
            ...timer,
            remaining: nextRemaining,
          };
        })
      );

      if (newlyCompletedLabels.length > 0) {
        playGentleChime();
        for (const label of newlyCompletedLabels) {
          logger.info("Timers", `Timer finished: '${label}'`);
          onFinishedRef.current?.(label);
        }
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [hasRunningTimers]);

  const startTimer = useCallback((id: string, label: string, seconds: number) => {
    setTimers((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      logger.info("Timers", `Started timer '${label}' (${seconds}s) [id=${id}]`);
      return [
        ...prev,
        {
          id,
          label,
          remaining: seconds,
          total: seconds,
          running: true,
          done: false,
        },
      ];
    });
  }, []);

  const togglePauseTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.done) return t;
        const nextRunning = !t.running;
        logger.info("Timers", `${nextRunning ? "Resumed" : "Paused"} timer '${t.label}' (${t.remaining}s left)`);
        return { ...t, running: nextRunning };
      })
    );
  }, []);

  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) {
        logger.info("Timers", `Dismissed timer '${target.label}'`);
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  return {
    timers,
    startTimer,
    togglePauseTimer,
    removeTimer,
  };
}
