import { useEffect, useState } from "react";
import { fetchAiSwapsApi } from "@/lib/api";
import { formatKitchenQuantity, getCombinedIngredientSwaps } from "@/lib/kitchenUtils";
import { logger } from "@/lib/logger";
import type { IngredientSwap, Recipe } from "@/types/recipe";

interface SwapModalProps {
  recipe: Recipe;
  ingredientId: string | null;
  servings: number;
  currentSwapIndex: number;
  aiSwaps: IngredientSwap[];
  onAiSwapsLoaded: (ingredientId: string, swaps: IngredientSwap[], cached: boolean) => void;
  onSelectSwap: (ingredientId: string, swapIndex: number) => void;
  onClose: () => void;
}

const QUICK_SWAP_PREFS = ["Pantry staple", "Dairy-free", "Gluten-free", "Vegetarian"];

export function SwapModal({
  recipe,
  ingredientId,
  servings,
  currentSwapIndex,
  aiSwaps,
  onAiSwapsLoaded,
  onSelectSwap,
  onClose,
}: SwapModalProps) {
  const [preference, setPreference] = useState("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const ingredient = ingredientId ? recipe.ingredients.find((i) => i.id === ingredientId) : null;

  useEffect(() => {
    setPreference("");
    setAiError(null);
    setIsLoadingAi(false);
  }, [ingredientId]);

  useEffect(() => {
    if (!ingredient) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ingredient, onClose]);

  if (!ingredient) return null;

  const combinedOptions = getCombinedIngredientSwaps(ingredient, aiSwaps);
  const scale = servings / Math.max(1, recipe.baseServings);

  const handleGenerateAiSwaps = async (overridePref?: string) => {
    const activePref = (overridePref !== undefined ? overridePref : preference).trim();
    setIsLoadingAi(true);
    setAiError(null);

    try {
      const stepContext = recipe.steps
        .filter((s) => s.ingredientIds.includes(ingredient.id) || s.text.includes(`{${ingredient.id}}`))
        .map((s) => s.text);

      const response = await fetchAiSwapsApi({
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        ingredientQty: ingredient.qty,
        ingredientUnit: ingredient.unit,
        baseServings: recipe.baseServings,
        stepContext: stepContext.length > 0 ? stepContext : recipe.steps.slice(0, 3).map((s) => s.text),
        preference: activePref,
      });

      logger.info(
        "SwapModal",
        `Loaded ${response.swaps.length} Groq swaps for '${ingredient.name}' (cached=${response.cached})`
      );
      onAiSwapsLoaded(ingredient.id, response.swaps, response.cached);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to load AI substitutes right now.";
      logger.error("SwapModal", `Failed to generate AI swaps: ${msg}`);
      setAiError(msg);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-md max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl border border-stone-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-700">Kitchen Swap</span>
            <h3 className="font-serif text-xl font-bold text-stone-900 mt-0.5">Substitute for {ingredient.name}</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Pick an option or ask Groq AI for calibrated measurements.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Options + AI Generator */}
        <div className="overflow-y-auto space-y-4 pr-0.5">
          {/* Available Options (Original + Presets + AI Swaps) */}
          <div className="space-y-2">
            {combinedOptions.map((opt, idx) => {
              const selected = idx === currentSwapIndex;
              const scaledQty = formatKitchenQuantity(opt.qty * scale);
              return (
                <button
                  key={`${opt.label}-${idx}`}
                  type="button"
                  onClick={() => onSelectSwap(ingredient.id, idx)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                    selected
                      ? "border-terracotta-600 bg-terracotta-50/70 ring-1 ring-terracotta-600"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-stone-900">{opt.label}</p>
                      {opt.note && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-sage-50 text-sage-700">
                          AI Calibrated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Uses <strong className="font-semibold">{scaledQty} {opt.unit}</strong> {opt.name}
                    </p>
                    {opt.note && (
                      <p className="text-[11px] text-sage-800/90 mt-1 leading-snug">{opt.note}</p>
                    )}
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      selected ? "border-terracotta-600 bg-terracotta-600 text-white" : "border-stone-300"
                    }`}
                  >
                    {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Groq AI Substitute Generator Box */}
          <div className="p-4 rounded-2xl bg-cream border border-stone-200/90 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sage-800 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-terracotta-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 3v3M12 18v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M3 12h3M18 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
                </svg>
                <span>Groq AI Chef Swaps</span>
              </span>
              <span className="text-[11px] text-stone-400">Auto-scales amounts</span>
            </div>

            {/* Quick 1-Tap Preference Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SWAP_PREFS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={isLoadingAi}
                  onClick={() => {
                    setPreference(chip);
                    void handleGenerateAiSwaps(chip);
                  }}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-stone-200 text-stone-700 hover:border-terracotta-600 hover:text-terracotta-700 disabled:opacity-50 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Custom Pantry / Dietary Input (Typo-Tolerant) */}
            <div className="flex gap-2">
              <input
                type="text"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleGenerateAiSwaps();
                  }
                }}
                placeholder="Optional: e.g. 'use greek yogurt' or 'no dairy'..."
                className="flex-1 min-w-0 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-600"
              />
              <button
                type="button"
                disabled={isLoadingAi}
                onClick={() => void handleGenerateAiSwaps()}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-sage-700 hover:bg-sage-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
              >
                {isLoadingAi ? "Thinking..." : aiSwaps.length > 0 ? "Refresh AI" : "Get Swaps"}
              </button>
            </div>

            {aiError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200/80 rounded-xl px-3 py-2 leading-snug">
                {aiError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
