import { useEffect, useState } from "react";
import { askKitchenRescueApi } from "@/lib/api";
import { getResolvedIngredient, parseStepInstructionSegments } from "@/lib/kitchenUtils";
import { logger } from "@/lib/logger";
import type { IngredientSwap, Recipe } from "@/types/recipe";

interface KitchenRescueDrawerProps {
  open: boolean;
  recipe: Recipe;
  servings: number;
  swaps: Record<string, number>;
  aiSwapsByIng: Record<string, IngredientSwap[]>;
  currentStepIndex: number;
  focusedIngredient?: string | null;
  onClearFocusedIngredient?: () => void;
  onClose: () => void;
}

interface RescueExchange {
  id: string;
  question: string;
  onTopic: boolean;
  answer: string;
  quickTip?: string | null;
}

const QUICK_RESCUE_PROMPTS = [
  "How do I know it's done?",
  "Sauce looks too thick or split",
  "Can I use a different pan?",
  "Heat feels too high",
];

const INGREDIENT_QUICK_PROMPTS = [
  "How should I prep this?",
  "Can I skip or swap this?",
  "What does this do in the dish?",
  "How do I store leftovers of this?",
];

export function KitchenRescueDrawer({
  open,
  recipe,
  servings,
  swaps,
  aiSwapsByIng,
  currentStepIndex,
  focusedIngredient = null,
  onClearFocusedIngredient,
  onClose,
}: KitchenRescueDrawerProps) {
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RescueExchange[]>([]);

  useEffect(() => {
    setHistory([]);
    setQuestion("");
    setError(null);
  }, [recipe.id]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isAsking) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isAsking, onClose]);

  if (!open) return null;

  const safeStepIdx = Math.min(currentStepIndex, recipe.steps.length - 1);
  const step = recipe.steps[safeStepIdx];
  const resolvedStepText = parseStepInstructionSegments(recipe, step.text, servings, swaps, aiSwapsByIng)
    .map((seg) => seg.value)
    .join("");

  const activeIngredientList = recipe.ingredients.map(
    (ing) => getResolvedIngredient(recipe, ing, servings, swaps, aiSwapsByIng).fullPhrase
  );

  const activePrompts = focusedIngredient ? INGREDIENT_QUICK_PROMPTS : QUICK_RESCUE_PROMPTS;

  const handleAsk = async (overrideQuestion?: string) => {
    const rawQ = (overrideQuestion !== undefined ? overrideQuestion : question).trim();
    if (!rawQ || isAsking) return;

    const contextualPrompt = focusedIngredient
      ? `[Focusing on ingredient: ${focusedIngredient}] ${rawQ}`
      : rawQ;

    setIsAsking(true);
    setError(null);
    if (overrideQuestion === undefined) {
      setQuestion("");
    }

    try {
      const resp = await askKitchenRescueApi({
        recipeTitle: recipe.title,
        currentStepNumber: safeStepIdx + 1,
        totalSteps: recipe.steps.length,
        currentStepText: resolvedStepText,
        activeIngredients: activeIngredientList,
        question: contextualPrompt,
      });

      logger.info(
        "KitchenRescue",
        `Received response (onTopic=${resp.onTopic}, ingredient='${focusedIngredient ?? "none"}') for step ${safeStepIdx + 1}/${recipe.steps.length}`
      );

      setHistory((prev) => [
        ...prev,
        {
          id: `rescue-${Date.now()}`,
          question: focusedIngredient ? `${focusedIngredient}: ${rawQ}` : rawQ,
          onTopic: resp.onTopic,
          answer: resp.answer,
          quickTip: resp.quickTip,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kitchen assistant is unavailable right now.";
      logger.error("KitchenRescue", `Request failed: ${msg}`);
      setError(msg);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAsking) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-lg max-h-[86vh] flex flex-col rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-700">
                Kitchen Rescue AI
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sand text-stone-700">
                Step {safeStepIdx + 1} of {recipe.steps.length}
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 mt-0.5">
              {focusedIngredient ? `Ask about ${focusedIngredient}` : "Stuck? Ask anything about this dish"}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Cooking-only assistant • Messy-hand typos welcome
            </p>
          </div>
          <button
            type="button"
            disabled={isAsking}
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-40"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Focused Ingredient Context Pill */}
        {focusedIngredient && (
          <div className="mt-3 px-3 py-2 rounded-2xl bg-sage-50 border border-sage-700/20 flex items-center justify-between gap-2 shrink-0">
            <span className="text-xs font-medium text-sage-800 truncate">
              Context: <strong className="font-semibold">{focusedIngredient}</strong>
            </span>
            {onClearFocusedIngredient && (
              <button
                type="button"
                onClick={onClearFocusedIngredient}
                className="text-[11px] font-semibold text-sage-700 hover:text-sage-900 shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Scrollable Conversation Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {history.length === 0 ? (
            <div className="p-4 rounded-2xl bg-cream/80 border border-stone-200/70 space-y-3">
              <p className="text-xs text-stone-600 leading-relaxed">
                {focusedIngredient ? (
                  <>
                    Ask anything about <strong className="text-stone-900">{focusedIngredient}</strong> in{" "}
                    <strong className="text-stone-900">{recipe.title}</strong>:
                  </>
                ) : (
                  <>
                    I already see your active recipe (<strong className="text-stone-900">{recipe.title}</strong>), your current step, and any ingredient swaps you selected. Tap a quick prompt or type below:
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isAsking}
                    onClick={() => void handleAsk(prompt)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:border-terracotta-600 hover:text-terracotta-700 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-br-sm bg-stone-900 text-white text-xs sm:text-sm">
                    {item.question}
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl rounded-bl-sm border space-y-1.5 ${
                    item.onTopic
                      ? "bg-cream border-stone-200/90 text-stone-800"
                      : "bg-amber-50/80 border-amber-300/80 text-amber-950"
                  }`}
                >
                  {!item.onTopic && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                      Cooking Topics Only
                    </span>
                  )}
                  <p className="text-xs sm:text-sm leading-relaxed">{item.answer}</p>
                  {item.onTopic && item.quickTip && (
                    <p className="text-xs font-medium text-sage-800 bg-sage-50 px-2.5 py-1.5 rounded-xl">
                      Tip: {item.quickTip}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}

          {isAsking && (
            <div className="px-3.5 py-2.5 rounded-2xl bg-sand/60 text-xs font-medium text-stone-600 inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terracotta-600 animate-ping" />
              <span>Checking your dish...</span>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200/80 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleAsk();
          }}
          className="pt-3 border-t border-stone-100 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              focusedIngredient
                ? `Ask about ${focusedIngredient}...`
                : "e.g. my crem sause splitd, how do i fix it?"
            }
            className="flex-1 min-w-0 px-3.5 py-2.5 bg-cream/70 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-600"
          />
          <button
            type="submit"
            disabled={isAsking || !question.trim()}
            className="shrink-0 px-4 py-2.5 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
