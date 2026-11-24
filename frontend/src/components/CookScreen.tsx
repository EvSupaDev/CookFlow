import { Fragment, useRef } from "react";
import {
  formatTimerSeconds,
  getResolvedIngredient,
  parseStepInstructionSegments,
} from "@/lib/kitchenUtils";
import type { ActiveTimer, Ingredient, IngredientSwap, Recipe } from "@/types/recipe";

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
  onStartTimer: (id: string, label: string, seconds: number) => void;
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
  onJumpToStep,
  onChangeStep,
  onRestartSteps,
  onBackToDiscover,
}: CookScreenProps) {
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const total = recipe.steps.length;
  const step = recipe.steps[Math.min(currentStep, total - 1)];

  const timerId = `${recipe.id}-step-${currentStep}`;
  const activeStepTimer = step?.timer ? activeTimers.find((t) => t.id === timerId) : undefined;
  const timerMins = step?.timer ? Math.round(step.timer.seconds / 60) : 0;
  const timerDurationLabel = step?.timer
    ? timerMins >= 1
      ? `${timerMins} min`
      : `${step.timer.seconds} sec`
    : "";

  const stepIngredients: Ingredient[] = (step?.ingredientIds ?? [])
    .map((id) => recipe.ingredients.find((item) => item.id === id))
    .filter((item): item is Ingredient => Boolean(item));

  const segments = step
    ? parseStepInstructionSegments(recipe, step.text, servings, swaps, aiSwapsByIng)
    : [];
  const isLastStep = currentStep === total - 1;

  return (
    <section className="space-y-5">
      {/* Top Cook Bar: Step Progress + Screen Awake Toggle */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-terracotta-700 bg-terracotta-50 px-3 py-1 rounded-full">
            {stepCompleted ? "All Done" : `Step ${currentStep + 1} of ${total}`}
          </span>

          <button
            type="button"
            onClick={onToggleWakeLock}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              wakeLockActive
                ? "border-sage-700/40 bg-sage-50 text-sage-800"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
            title="Prevents your phone or tablet screen from dimming while cooking"
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                wakeLockActive ? "bg-sage-700" : "bg-stone-300"
              }`}
            />
            <span>{wakeLockActive ? "Screen staying awake" : "Keep screen awake"}</span>
          </button>
        </div>

        {/* Visual Segmented Step Progress Bar */}
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        >
          {recipe.steps.map((_, idx) => {
            const done = stepCompleted || idx < currentStep;
            const current = !stepCompleted && idx === currentStep;
            return (
              <button
                key={`${recipe.id}-seg-${idx}`}
                type="button"
                onClick={() => onJumpToStep(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  current ? "bg-terracotta-600" : done ? "bg-sage-700" : "bg-stone-200 hover:bg-stone-300"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Focused Step Card OR Completion Card */}
      {stepCompleted ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-7 sm:p-10 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sage-100 text-sage-700 mx-auto flex items-center justify-center">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Dinner is ready!</h2>
            <p className="text-sm text-stone-600">
              You finished {recipe.title} ({servings} {servings === 1 ? "serving" : "servings"}).
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onBackToDiscover}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold text-sm transition-colors"
            >
              Browse More Recipes
            </button>
            <button
              type="button"
              onClick={onRestartSteps}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium text-sm transition-colors"
            >
              Review Steps Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            onTouchStart={(e) => {
              touchStartRef.current = {
                x: e.changedTouches[0].screenX,
                y: e.changedTouches[0].screenY,
              };
            }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].screenX - touchStartRef.current.x;
              const dy = e.changedTouches[0].screenY - touchStartRef.current.y;
              if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
                if (dx < 0) onChangeStep(1);
                else onChangeStep(-1);
              }
            }}
            className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-6 min-h-[320px] flex flex-col justify-between transition-all"
          >
            <div className="space-y-5">
              {/* Step Title / Phase + Kitchen Rescue & All Ingredients Triggers */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  {step.phase || `Step ${currentStep + 1}`}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenKitchenRescue}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-700 bg-terracotta-50 hover:bg-terracotta-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                    <span>Need help?</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenIngredientsDrawer}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-700 bg-sage-50 hover:bg-sage-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span>All Ingredients</span>
                  </button>
                </div>
              </div>

              {/* Large, High-Contrast Kitchen Instruction */}
              <p className="text-xl sm:text-2xl font-medium text-stone-900 leading-relaxed">
                {segments.map((seg, idx) =>
                  seg.type === "ingredient" ? (
                    <span
                      key={idx}
                      className="font-semibold text-terracotta-700 bg-terracotta-50 px-1.5 py-0.5 rounded-md"
                    >
                      {seg.value}
                    </span>
                  ) : (
                    <Fragment key={idx}>{seg.value}</Fragment>
                  )
                )}
              </p>

              {/* Optional Chef Tip */}
              {step.tip && (
                <div className="bg-sand/70 border border-stone-200/70 rounded-2xl p-3.5 flex items-start gap-2.5">
                  <span className="text-terracotta-600 mt-0.5 shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </span>
                  <p className="text-xs sm:text-sm text-stone-700 leading-snug">{step.tip}</p>
                </div>
              )}

              {/* Embedded 1-Tap Step Timer */}
              {step.timer && (
                <div className="pt-1">
                  {activeStepTimer ? (
                    <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-sage-50 border border-sage-700/20 text-sage-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-sage-700 animate-pulse" />
                      <span className="text-sm font-semibold">
                        {activeStepTimer.label}:{" "}
                        <span className="font-mono">{formatTimerSeconds(activeStepTimer.remaining)}</span>
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (step.timer) {
                          onStartTimer(timerId, step.timer.label, step.timer.seconds);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sage-700 hover:bg-sage-800 active:scale-95 text-white text-sm font-semibold shadow-xs transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="13" r="8" />
                        <path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3M10 2h4" />
                      </svg>
                      <span>
                        Start {timerDurationLabel} timer ({step.timer.label})
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Ingredients Needed Specifically For This Step */}
            {stepIngredients.length > 0 && (
              <div className="pt-5 border-t border-stone-100 space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">For this step</p>
                <div className="flex flex-wrap gap-2">
                  {stepIngredients.map((ing) => {
                    const resolved = getResolvedIngredient(recipe, ing, servings, swaps, aiSwapsByIng);
                    return (
                      <span
                        key={ing.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand/80 text-stone-800 text-xs sm:text-sm"
                      >
                        <strong className="font-semibold text-stone-900">
                          {resolved.formattedQty} {resolved.unit}
                        </strong>
                        <span>{resolved.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Oversized Bottom Navigation Bar (Easy to tap with wet/messy hands) */}
          <div className="fixed bottom-0 inset-x-0 z-20 bg-cream/95 backdrop-blur border-t border-stone-200/90 p-3.5 sm:p-4">
            <div className="max-w-3xl mx-auto grid grid-cols-3 gap-3">
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => onChangeStep(-1)}
                className="col-span-1 py-3.5 px-4 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none text-stone-800 font-semibold text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeStep(1)}
                className="col-span-2 py-3.5 px-6 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 active:scale-[0.99] text-white font-semibold text-base shadow-md shadow-terracotta-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>{isLastStep ? "Finish Dish" : "Next Step"}</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
