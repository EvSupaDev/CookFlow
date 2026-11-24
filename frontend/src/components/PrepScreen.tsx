import { Fragment } from "react";
import { getResolvedIngredient, parseStepInstructionSegments } from "@/lib/kitchenUtils";
import type { IngredientSwap, Recipe } from "@/types/recipe";

interface PrepScreenProps {
  recipe: Recipe;
  servings: number;
  isSaved: boolean;
  checkedIngredients: Set<string>;
  swaps: Record<string, number>;
  aiSwapsByIng: Record<string, IngredientSwap[]>;
  onBackToDiscover: () => void;
  onToggleFavorite: () => void;
  onChangeServings: (delta: number) => void;
  onToggleIngredientCheck: (ingId: string) => void;
  onOpenSwapModal: (ingId: string) => void;
  onAskAboutIngredient: (ingredientPhrase: string) => void;
  onResetSwaps: () => void;
  onStartCooking: () => void;
}

export function PrepScreen({
  recipe,
  servings,
  isSaved,
  checkedIngredients,
  swaps,
  aiSwapsByIng,
  onBackToDiscover,
  onToggleFavorite,
  onChangeServings,
  onToggleIngredientCheck,
  onOpenSwapModal,
  onAskAboutIngredient,
  onResetSwaps,
  onStartCooking,
}: PrepScreenProps) {
  const placeholderUrl = `https://placehold.co/900x500/${recipe.fallbackColor}/FAF8F5?text=${encodeURIComponent(recipe.title)}`;
  const hasAnySwaps = Object.values(swaps).some((idx) => idx > 0);
  const cleanAuthor = recipe.authorCredit?.trim() || "";

  return (
    <section className="space-y-6">
      <button
        type="button"
        onClick={onBackToDiscover}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>All recipes</span>
      </button>

      <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs">
        <div className="relative h-48 sm:h-56 bg-stone-200">
          <img
            src={recipe.image}
            alt={recipe.title}
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = placeholderUrl;
            }}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onToggleFavorite}
            className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow-sm flex items-center justify-center text-stone-700 hover:scale-105 transition-transform"
            aria-label="Save recipe"
          >
            <svg
              className={`w-5 h-5 ${isSaved ? "fill-terracotta-600 text-terracotta-600" : "text-stone-600"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-sand text-stone-700">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">{recipe.title}</h2>
            <p className="text-sm text-stone-600 leading-relaxed">{recipe.subtitle}</p>
            {cleanAuthor && (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 pt-1">
                <svg className="w-3.5 h-3.5 text-terracotta-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
                <span>
                  Credited to <strong className="font-semibold text-stone-700">{cleanAuthor}</strong>
                </span>
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-stone-600">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-terracotta-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <strong className="font-semibold text-stone-900">{recipe.time}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-sage-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20V10M18 20V4M6 20v-4" />
                </svg>
                <span>{recipe.steps.length} easy steps</span>
              </span>
            </div>

            <div className="flex items-center gap-2.5 bg-sand/80 px-3 py-1.5 rounded-2xl">
              <span className="text-xs font-medium text-stone-600">Servings</span>
              <button
                type="button"
                onClick={() => onChangeServings(-1)}
                className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50 active:scale-95 transition"
                aria-label="Decrease servings"
              >
                &minus;
              </button>
              <span className="w-6 text-center text-sm font-bold text-stone-900">{servings}</span>
              <button
                type="button"
                onClick={() => onChangeServings(1)}
                className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50 active:scale-95 transition"
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-xl font-bold text-stone-900">Ingredients</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Tap to check off • Tap <span className="font-semibold text-terracotta-700">Swap</span> to substitute or <span className="font-semibold text-sage-700">?</span> to ask AI
            </p>
          </div>
          {hasAnySwaps && (
            <button
              type="button"
              onClick={onResetSwaps}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 underline underline-offset-2 shrink-0"
            >
              Reset swaps
            </button>
          )}
        </div>

        <ul className="divide-y divide-stone-100">
          {recipe.ingredients.map((ing) => {
            const resolved = getResolvedIngredient(recipe, ing, servings, swaps, aiSwapsByIng);
            const checked = checkedIngredients.has(ing.id);

            return (
              <li key={ing.id} className="py-3 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => onToggleIngredientCheck(ing.id)}
                  className="flex items-start gap-3 text-left flex-1 min-w-0 group"
                >
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? "bg-sage-700 border-sage-700 text-white"
                        : "border-stone-300 bg-white group-hover:border-stone-400"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`block text-sm sm:text-base transition-all ${
                        checked ? "line-through text-stone-400" : "text-stone-800"
                      }`}
                    >
                      <strong className={`font-semibold ${checked ? "text-stone-400" : "text-stone-900"}`}>
                        {resolved.formattedQty} {resolved.unit}
                      </strong>{" "}
                      {resolved.name}
                      {resolved.isSwapped && (
                        <span className="ml-1.5 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sage-50 text-sage-700">
                          Swapped
                        </span>
                      )}
                    </span>
                    {resolved.isSwapped && resolved.note && (
                      <span className="block text-xs text-sage-800/90 mt-0.5 leading-snug">
                        {resolved.note}
                      </span>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAskAboutIngredient(resolved.fullPhrase)}
                    aria-label={`Ask Kitchen AI about ${resolved.name}`}
                    title={`Ask Kitchen AI about ${resolved.fullPhrase}`}
                    className="w-7 h-7 rounded-full border border-stone-200 bg-cream hover:border-sage-700/40 hover:bg-sage-50 text-stone-500 hover:text-sage-800 flex items-center justify-center text-xs font-bold transition-colors"
                  >
                    ?
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenSwapModal(ing.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      resolved.isSwapped
                        ? "border-sage-700/30 bg-sage-50 text-sage-800 hover:bg-sage-100"
                        : "border-terracotta-600/30 bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100"
                    }`}
                  >
                    {resolved.isSwapped ? "Change" : "Swap"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-3 shadow-xs">
        <h3 className="font-serif text-lg font-bold text-stone-900">Cooking Overview</h3>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => {
            const segments = parseStepInstructionSegments(recipe, step.text, servings, swaps, aiSwapsByIng);
            return (
              <li key={`${recipe.id}-preview-${i}`} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-sand text-stone-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-stone-700 leading-relaxed">
                  {segments.map((seg, segIdx) =>
                    seg.type === "ingredient" ? (
                      <span
                        key={segIdx}
                        className="font-semibold text-terracotta-700 bg-terracotta-50 px-1.5 py-0.5 rounded-md"
                      >
                        {seg.value}
                      </span>
                    ) : (
                      <Fragment key={segIdx}>{seg.value}</Fragment>
                    )
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-20 bg-cream/95 backdrop-blur border-t border-stone-200/90 p-3.5 sm:p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <p className="text-xs text-stone-500">Everything updates automatically</p>
            <p className="text-sm font-semibold text-stone-900">
              {servings} {servings === 1 ? "serving" : "servings"} • {recipe.steps.length} easy steps
            </p>
          </div>
          <button
            type="button"
            onClick={onStartCooking}
            className="w-full sm:w-auto flex-1 sm:flex-initial sm:min-w-[240px] py-3.5 px-6 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 active:scale-[0.99] text-white font-semibold text-base shadow-md shadow-terracotta-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>Start Step-by-Step Cooking</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
