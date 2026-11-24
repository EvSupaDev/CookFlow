import { useEffect, useState } from "react";
import { generatePantryRecipeApi } from "@/lib/api";
import { logger } from "@/lib/logger";
import type { Recipe } from "@/types/recipe";

interface PantryGeneratorModalProps {
  open: boolean;
  defaultServings: number;
  onClose: () => void;
  onRecipeGenerated: (recipe: Recipe) => void;
}

const MOOD_CHIPS = ["Under 20 min", "One Pan", "High Protein", "Vegetarian", "Dairy-free"];

export function PantryGeneratorModal({
  open,
  defaultServings,
  onClose,
  onRecipeGenerated,
}: PantryGeneratorModalProps) {
  const [pantryInput, setPantryInput] = useState("");
  const [dietaryNote, setDietaryNote] = useState("");
  const [servings, setServings] = useState(defaultServings || 2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setServings(defaultServings || 2);
      setError(null);
    }
  }, [open, defaultServings]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isGenerating) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isGenerating, onClose]);

  if (!open) return null;

  const handleGenerate = async () => {
    const cleanIngredients = pantryInput.trim();
    if (cleanIngredients.length < 2) {
      setError("Enter at least one or two ingredients you have on hand.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const createdRecipe = await generatePantryRecipeApi({
        pantryInput: cleanIngredients,
        dietaryNote: dietaryNote.trim(),
        servings,
      });
      logger.info("PantryAI", `Generated recipe '${createdRecipe.title}' [id=${createdRecipe.id}]`);
      setPantryInput("");
      setDietaryNote("");
      onRecipeGenerated(createdRecipe);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not generate recipe right now.";
      logger.error("PantryAI", `Generation failed: ${msg}`);
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sage-700">Groq AI Kitchen</span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
              Cook With What You Have
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              List what’s in your fridge or pantry—typos are totally fine. We’ll build a step-by-step recipe with timers.
            </p>
          </div>
          <button
            type="button"
            disabled={isGenerating}
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-40"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ingredients Input */}
        <div className="space-y-1.5">
          <label htmlFor="pantry-items-input" className="block text-xs font-bold uppercase tracking-wider text-stone-500">
            Ingredients On Hand
          </label>
          <textarea
            id="pantry-items-input"
            rows={3}
            value={pantryInput}
            onChange={(e) => setPantryInput(e.target.value)}
            placeholder="e.g., chicken thighs, baby spinach, lemon, garlic, rice..."
            className="w-full px-3.5 py-2.5 bg-cream/70 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta-600/30 focus:border-terracotta-600 resize-none"
          />
        </div>

        {/* Quick Mood / Style Chips + Custom Note */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-stone-500">
            Style or Dietary Preference <span className="font-normal text-stone-400">(optional)</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_CHIPS.map((chip) => {
              const active = dietaryNote.toLowerCase() === chip.toLowerCase();
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDietaryNote(active ? "" : chip)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-stone-900 text-white"
                      : "bg-sand/80 text-stone-700 hover:bg-sand"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={dietaryNote}
            onChange={(e) => setDietaryNote(e.target.value)}
            placeholder="Or type a note (e.g. spicy, kid-friendly, no oven)..."
            className="w-full px-3.5 py-2 bg-cream/60 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-600"
          />
        </div>

        {/* Servings Row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Servings</span>
          <div className="inline-flex items-center gap-2.5 bg-sand/80 px-3 py-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setServings((prev) => Math.max(1, prev - 1))}
              className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50"
              aria-label="Decrease servings"
            >
              &minus;
            </button>
            <span className="w-6 text-center text-sm font-bold text-stone-900">{servings}</span>
            <button
              type="button"
              onClick={() => setServings((prev) => Math.min(12, prev + 1))}
              className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50"
              aria-label="Increase servings"
            >
              +
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200/80 rounded-xl px-3.5 py-2.5 leading-snug">
            {error}
          </p>
        )}

        {/* Submit Action */}
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => void handleGenerate()}
          className="w-full py-3.5 px-6 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-60 active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-md shadow-terracotta-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 3v3M12 18v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M3 12h3M18 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
          </svg>
          <span>{isGenerating ? "Crafting Your Recipe..." : "Create Recipe with Groq AI"}</span>
        </button>
      </div>
    </div>
  );
}
