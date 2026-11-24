import { useEffect } from "react";
import { getResolvedIngredient } from "@/lib/kitchenUtils";
import type { IngredientSwap, Recipe } from "@/types/recipe";

interface IngredientsDrawerProps {
  open: boolean;
  recipe: Recipe;
  servings: number;
  checkedIngredients: Set<string>;
  swaps: Record<string, number>;
  aiSwapsByIng: Record<string, IngredientSwap[]>;
  onToggleIngredientCheck: (ingId: string) => void;
  onClose: () => void;
}

export function IngredientsDrawer({
  open,
  recipe,
  servings,
  checkedIngredients,
  swaps,
  aiSwapsByIng,
  onToggleIngredientCheck,
  onClose,
}: IngredientsDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-md max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">Full Ingredient List</h3>
            <p className="text-xs text-stone-500">
              Scaled for {servings} {servings === 1 ? "serving" : "servings"}
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

        <ul className="divide-y divide-stone-100 overflow-y-auto py-2">
          {recipe.ingredients.map((ing) => {
            const resolved = getResolvedIngredient(recipe, ing, servings, swaps, aiSwapsByIng);
            const checked = checkedIngredients.has(ing.id);

            return (
              <li key={ing.id} className="py-3">
                <button
                  type="button"
                  onClick={() => onToggleIngredientCheck(ing.id)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      checked ? "bg-sage-700 border-sage-700 text-white" : "border-stone-300 bg-white"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm ${checked ? "line-through text-stone-400" : "text-stone-800"}`}>
                    <strong className="font-semibold">
                      {resolved.formattedQty} {resolved.unit}
                    </strong>{" "}
                    {resolved.name}
                    {resolved.isSwapped && (
                      <span className="ml-1.5 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sage-50 text-sage-700">
                        Swapped
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
