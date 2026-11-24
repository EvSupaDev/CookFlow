import { formatTimerSeconds } from "@/lib/kitchenUtils";
import type { ActiveTimer, ScreenName } from "@/types/recipe";

interface NavbarProps {
  screen: ScreenName;
  savedCount: number;
  savedOnly: boolean;
  isOffline: boolean;
  isReconnecting: boolean;
  timers: ActiveTimer[];
  onGoHome: () => void;
  onOpenAddRecipe: () => void;
  onToggleSavedOnly: () => void;
  onToggleProfile: () => void;
  onOpenAssistant: () => void;
  onRetryConnection: () => void;
  onExitCookToPrep: () => void;
  onToggleTimerPause: (id: string) => void;
  onRemoveTimer: (id: string) => void;
}

export function Navbar({
  screen,
  savedCount,
  savedOnly,
  isOffline,
  isReconnecting,
  timers,
  onGoHome,
  onOpenAddRecipe,
  onToggleSavedOnly,
  onToggleProfile,
  onOpenAssistant,
  onRetryConnection,
  onExitCookToPrep,
  onToggleTimerPause,
  onRemoveTimer,
}: NavbarProps) {
  const inRecipe = screen === "prep" || screen === "cook";
  const showGlobalControls = screen === "discover" || inRecipe;

  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur border-b border-stone-200/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Brand / Home Button (Resets filters & returns to All Recipes) */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2 text-left group focus:outline-none rounded-xl py-1 px-1.5 -ml-1.5 hover:bg-sand/70 transition-colors shrink-0"
          aria-label="CookFlow Home — Back to all recipes"
          title="Back to All Recipes"
        >
          <span className="w-8 h-8 rounded-xl bg-terracotta-600 text-white flex items-center justify-center shadow-sm group-hover:bg-terracotta-700 transition-colors">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </span>
          <span className="font-serif font-bold text-lg tracking-tight text-stone-900">CookFlow</span>
        </button>

        {/* Context-Aware + Persistent Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {inRecipe && (
            <button
              type="button"
              onClick={onOpenAssistant}
              aria-label="Open Kitchen Rescue AI Assistant"
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border border-sage-700/30 bg-sage-50 text-sage-800 hover:bg-sage-100 active:scale-95 transition-all"
            >
              <svg className="w-3.5 h-3.5 text-sage-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              <span>Assistant</span>
            </button>
          )}

          {screen === "cook" && (
            <button
              type="button"
              onClick={onExitCookToPrep}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="hidden sm:inline">Ingredients</span>
            </button>
          )}

          {showGlobalControls && (
            <>
              <button
                type="button"
                onClick={onOpenAddRecipe}
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-terracotta-600 text-white hover:bg-terracotta-700 active:scale-95 shadow-xs transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add Recipe</span>
              </button>

              <button
                type="button"
                onClick={onToggleSavedOnly}
                className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  savedOnly && screen === "discover"
                    ? "border-terracotta-600 bg-terracotta-50 text-terracotta-700"
                    : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 ${
                    savedOnly && screen === "discover"
                      ? "fill-terracotta-600 text-terracotta-600"
                      : "text-stone-400"
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                <span>Saved ({savedCount})</span>
              </button>
            </>
          )}

          {(showGlobalControls || screen === "profile") && (
            <button
              type="button"
              onClick={onToggleProfile}
              aria-label="Your Kitchen Profile"
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                screen === "profile"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <svg
                className={`w-3.5 h-3.5 ${screen === "profile" ? "text-white" : "text-stone-500"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
              <span className="hidden sm:inline">Profile</span>
            </button>
          )}

          {screen === "add" && (
            <button
              type="button"
              onClick={onGoHome}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Visible Offline Mode Banner (with 1-click Reconnect) */}
      {isOffline && (
        <div className="bg-amber-100/95 text-amber-950 border-t border-amber-300/80">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
              <p className="truncate">
                <strong className="font-semibold">Offline Mode:</strong> Recipes, timers, swaps, and local edits stay saved on this device.
              </p>
            </div>
            <button
              type="button"
              disabled={isReconnecting}
              onClick={onRetryConnection}
              className="shrink-0 px-2.5 py-1 rounded-full bg-amber-900 hover:bg-amber-950 disabled:opacity-60 text-white font-semibold text-[11px] transition-colors"
            >
              {isReconnecting ? "Checking..." : "Reconnect"}
            </button>
          </div>
        </div>
      )}

      {/* Persistent Floating Active Timers Bar */}
      {timers.length > 0 && (
        <div className="bg-sage-800 text-white border-t border-sage-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {timers.map((timer) => (
              <div
                key={timer.id}
                className={`shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  timer.done ? "bg-terracotta-600 text-white animate-pulse" : "bg-white/15 text-white"
                }`}
              >
                <span>{timer.label}:</span>
                <span className="font-mono">
                  {timer.done ? "Done!" : formatTimerSeconds(timer.remaining)}
                </span>
                {!timer.done && (
                  <button
                    type="button"
                    onClick={() => onToggleTimerPause(timer.id)}
                    className="px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[11px]"
                  >
                    {timer.running ? "Pause" : "Resume"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveTimer(timer.id)}
                  aria-label="Dismiss timer"
                  className="text-white/75 hover:text-white ml-0.5"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
