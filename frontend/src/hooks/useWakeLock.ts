import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";

interface UseWakeLockOptions {
  onActivated?: () => void;
}

export function useWakeLock({ onActivated }: UseWakeLockOptions = {}) {
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const activeRef = useRef(false);
  activeRef.current = wakeLockActive;

  const requestSentinel = useCallback(async () => {
    try {
      if ("wakeLock" in navigator && navigator.wakeLock) {
        sentinelRef.current = await navigator.wakeLock.request("screen");
        logger.info("WakeLock", "Acquired native Screen Wake Lock sentinel");
      } else {
        logger.debug("WakeLock", "Native Screen Wake Lock API unavailable; maintaining logical state");
      }
    } catch (err) {
      logger.warn("WakeLock", "Wake lock request blocked or unsupported in current context", err);
    }
  }, []);

  const enableWakeLock = useCallback(async () => {
    if (activeRef.current) return;
    await requestSentinel();
    setWakeLockActive(true);
    onActivated?.();
  }, [onActivated, requestSentinel]);

  const disableWakeLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
        logger.info("WakeLock", "Released Screen Wake Lock sentinel");
      } catch (err) {
        logger.warn("WakeLock", "Error releasing Screen Wake Lock sentinel", err);
      }
      sentinelRef.current = null;
    }
    setWakeLockActive(false);
  }, []);

  const toggleWakeLock = useCallback(async () => {
    if (activeRef.current) {
      await disableWakeLock();
    } else {
      await enableWakeLock();
    }
  }, [disableWakeLock, enableWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && activeRef.current) {
        void requestSentinel();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [requestSentinel]);

  return {
    wakeLockActive,
    enableWakeLock,
    disableWakeLock,
    toggleWakeLock,
  };
}
