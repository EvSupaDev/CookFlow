import { useEffect, useRef, useState } from "react";
import { RecipeImportPanel } from "@/components/RecipeImportPanel";
import {
  ADD_TAG_OPTIONS,
  ADD_TIME_OPTIONS,
  ADD_UNIT_OPTIONS,
  QUICK_STAPLES,
} from "@/data/seedRecipes";
import { checkDuplicateRecipeApi } from "@/lib/api";
import { formatKitchenQuantity, parseFractionInput } from "@/lib/kitchenUtils";
import { logger } from "@/lib/logger";
import type {
  DraftIngredientRow,
  DraftStepRow,
  DuplicateCheckResponse,
  ParsedRecipeDraft,
  Recipe,
} from "@/types/recipe";

interface AddRecipeScreenProps {
  existingRecipes: Recipe[];
  onCancel: () => void;
  onNotify: (message: string) => void;
  onOpenExistingRecipe: (recipeId: string) => void;
  onSaveRecipe: (
    recipe: Omit<Recipe, "id"> & { autoTag?: boolean; requiresAuthorCredit?: boolean }
  ) => Promise<void>;
}

export function AddRecipeScreen({
  existingRecipes,
  onCancel,
  onNotify,
  onOpenExistingRecipe,
  onSaveRecipe,
}: AddRecipeScreenProps) {
  const authorInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorCredit, setAuthorCredit] = useState("");
  const [requiresAuthorCredit, setRequiresAuthorCredit] = useState(false);
  const [time, setTime] = useState("20 min");
  const [baseServings, setBaseServings] = useState(2);
  const [selectedTags, setSelectedTags] = useState<string[]>(["One Pan"]);
  const [autoTagOnSave, setAutoTagOnSave] = useState(true);
  const [ingredients, setIngredients] = useState<DraftIngredientRow[]>([
    { qty: "1", unit: "tbsp", name: "" },
    { qty: "2", unit: "cups", name: "" },
  ]);
  const [steps, setSteps] = useState<DraftStepRow[]>([
    { text: "", hasTimer: false, timerMins: 5 },
    { text: "", hasTimer: false, timerMins: 10 },
  ]);

  const [duplicateStatus, setDuplicateStatus] = useState<DuplicateCheckResponse | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Debounced live duplicate check
  useEffect(() => {
    const cleanTitle = title.trim();
    const validIngs = ingredients
      .filter((i) => i.name.trim().length > 0)
      .map((i) => ({
        qty: parseFractionInput(i.qty),
        unit: i.unit,
        name: i.name.trim(),
      }));
    const validSteps = steps.map((s) => s.text.trim()).filter((t) => t.length > 0);

    if (!cleanTitle && validIngs.length === 0 && validSteps.length === 0) {
      setDuplicateStatus(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsCheckingDuplicate(true);
      void checkDuplicateRecipeApi(
        {
          title: cleanTitle || "Untitled",
          ingredients: validIngs,
          steps: validSteps,
        },
        existingRecipes
      )
        .then((res) => {
          if (!cancelled) setDuplicateStatus(res);
        })
        .catch(() => {
          if (!cancelled) setDuplicateStatus(null);
        })
        .finally(() => {
          if (!cancelled) setIsCheckingDuplicate(false);
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [title, ingredients, steps, existingRecipes]);

  const handleDraftImported = (parsed: ParsedRecipeDraft, sourceLabel: string) => {
    setTitle(parsed.title);
    setSubtitle(parsed.subtitle);
    setTime(parsed.time);
    setBaseServings(parsed.baseServings);
    if (parsed.tags.length > 0) setSelectedTags(parsed.tags);
    setIngredients(parsed.ingredients);
    setSteps(parsed.steps);
    setRequiresAuthorCredit(true);
    setSaveError(null);

    const detected = (parsed.detectedAuthor || "").trim();
    if (detected) {
      setAuthorCredit(detected);
      onNotify(`${sourceLabel} imported! Verify the author credit below before saving.`);
    } else {
      setAuthorCredit("");
      onNotify(`${sourceLabel} imported! Credit the original author below before saving.`);
      window.setTimeout(() => authorInputRef.current?.focus(), 120);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const quickAddStaple = (qty: string, unit: string, name: string) => {
    setIngredients((prev) => {
      const normName = name.trim().toLowerCase();
      const existingIdx = prev.findIndex(
        (item) => item.name.trim().toLowerCase() === normName && item.unit === unit
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        const combined = parseFractionInput(updated[existingIdx].qty) + parseFractionInput(qty);
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: formatKitchenQuantity(combined) || String(combined),
        };
        return updated;
      }
      const emptyIdx = prev.findIndex((item) => !item.name.trim());
      if (emptyIdx !== -1) {
        const updated = [...prev];
        updated[emptyIdx] = { qty, unit, name };
        return updated;
      }
      return [...prev, { qty, unit, name }];
    });
  };

  const updateIngredient = (idx: number, field: keyof DraftIngredientRow, value: string) => {
    setIngredients((prev) =>
      prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, [field]: value } : row))
    );
  };

  const removeIngredient = (idx: number) => {
    setIngredients((prev) =>
      prev.length <= 1 ? [{ qty: "1", unit: "cup", name: "" }] : prev.filter((_, i) => i !== idx)
    );
  };

  const updateStep = <K extends keyof DraftStepRow>(
    idx: number,
    field: K,
    value: DraftStepRow[K]
  ) => {
    setSteps((prev) =>
      prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, [field]: value } : row))
    );
  };

  const removeStep = (idx: number) => {
    setSteps((prev) =>
      prev.length <= 1
        ? [{ text: "", hasTimer: false, timerMins: 5 }]
        : prev.filter((_, i) => i !== idx)
    );
  };

  const missingMandatoryCredit = requiresAuthorCredit && authorCredit.trim().length === 0;
  const isDuplicateBlocked = Boolean(duplicateStatus?.isDuplicate);

  const handleSave = async () => {
    setSaveError(null);
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      onNotify("Please give your dish a name first");
      return;
    }
    if (missingMandatoryCredit) {
      const msg = "Please credit the original author, chef, or cookbook before saving.";
      setSaveError(msg);
      onNotify(msg);
      authorInputRef.current?.focus();
      return;
    }

    const mergedMap = new Map<string, { qty: number; unit: string; name: string }>();
    ingredients
      .filter((item) => item.name.trim().length > 0)
      .forEach((item) => {
        const cleanName = item.name.trim();
        const key = `${cleanName.toLowerCase()}__${item.unit}`;
        const parsedQty = parseFractionInput(item.qty);
        const existing = mergedMap.get(key);
        if (existing) existing.qty += parsedQty;
        else mergedMap.set(key, { qty: parsedQty, unit: item.unit, name: cleanName });
      });

    const validIngredients = Array.from(mergedMap.values()).map((item, idx) => ({
      id: `custom-ing-${idx}`,
      qty: item.qty,
      unit: item.unit,
      name: item.name,
    }));
    if (validIngredients.length === 0) {
      onNotify("Add at least one ingredient to continue");
      return;
    }

    const validSteps = steps
      .filter((s) => s.text.trim().length > 0)
      .map((s, idx) => ({
        phase: `Step ${idx + 1}`,
        text: s.text.trim(),
        timer: s.hasTimer
          ? { label: `Step ${idx + 1}`, seconds: Math.max(1, s.timerMins || 5) * 60 }
          : null,
        ingredientIds: [],
      }));
    if (validSteps.length === 0) {
      onNotify("Add at least one cooking step");
      return;
    }

    setIsSaving(true);
    try {
      const dupCheck = await checkDuplicateRecipeApi(
        {
          title: cleanTitle,
          ingredients: validIngredients.map((i) => ({ qty: i.qty, unit: i.unit, name: i.name })),
          steps: validSteps.map((s) => s.text),
        },
        existingRecipes
      );
      if (dupCheck.isDuplicate) {
        setDuplicateStatus(dupCheck);
        setSaveError(dupCheck.reason);
        onNotify("Duplicate recipe detected—already in CookFlow.");
        return;
      }

      const palette = ["C85A32", "2E5A44", "B85D19", "3B6E52"];
      const color = palette[existingRecipes.length % palette.length];

      logger.info(
        "AddRecipe",
        `Submitting recipe '${cleanTitle}' (credit='${authorCredit.trim()}', autoTag=${autoTagOnSave})`
      );
      await onSaveRecipe({
        title: cleanTitle,
        subtitle: subtitle.trim() || "Homemade recipe saved in CookFlow.",
        time,
        baseServings,
        tags: selectedTags.length > 0 ? selectedTags : ["Home Recipe"],
        image: `https://placehold.co/900x500/${color}/FAF8F5?text=${encodeURIComponent(cleanTitle)}`,
        fallbackColor: color,
        authorCredit: authorCredit.trim(),
        ingredients: validIngredients,
        steps: validSteps,
        autoTag: autoTagOnSave,
        requiresAuthorCredit,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save recipe.";
      setSaveError(msg);
      onNotify(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Back to all recipes</span>
      </button>

      <div className="space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Add Your Recipe
        </h1>
        <p className="text-sm text-stone-600">
          Snap a cookbook photo, paste raw recipe text, or build from scratch.
        </p>
      </div>

      <RecipeImportPanel onDraftImported={handleDraftImported} />

      {/* Duplicate Recipe Blocker Banner */}
      {isDuplicateBlocked && duplicateStatus && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">
              Duplicate Recipe Blocked
            </span>
            <p className="text-sm font-semibold text-amber-950">{duplicateStatus.reason}</p>
            <p className="text-xs text-amber-800">
              CookFlow prevents saving identical copies of existing recipes.
            </p>
          </div>
          {duplicateStatus.existingRecipe && (
            <button
              type="button"
              onClick={() => onOpenExistingRecipe(duplicateStatus.existingRecipe!.id)}
              className="shrink-0 px-4 py-2 rounded-2xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold transition-colors"
            >
              Open Existing Recipe &rarr;
            </button>
          )}
        </div>
      )}

      {/* Card 1: Dish Basics, Mandatory Author Credit & Meal Style */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="add-title-input"
                className="block text-xs font-bold uppercase tracking-wider text-stone-500"
              >
                Dish Name
              </label>
              {isCheckingDuplicate && (
                <span className="text-[11px] text-stone-400">Checking for duplicates...</span>
              )}
            </div>
            <input
              id="add-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weeknight Garlic Shrimp Bowl"
              className="w-full px-4 py-3 bg-cream/60 border border-stone-200 rounded-2xl text-base font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta-600/30 focus:border-terracotta-600"
            />
          </div>

          {/* Original Author / Cookbook Attribution Field */}
          <div
            className={`p-3.5 rounded-2xl border transition-colors ${
              missingMandatoryCredit
                ? "bg-terracotta-50/70 border-terracotta-600/50"
                : requiresAuthorCredit
                  ? "bg-sage-50/60 border-sage-700/30"
                  : "bg-cream/50 border-stone-200/80"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="add-author-input"
                className="text-xs font-bold uppercase tracking-wider text-stone-700"
              >
                Recipe Author / Cookbook Credit
              </label>
              {requiresAuthorCredit ? (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    missingMandatoryCredit
                      ? "bg-terracotta-600 text-white"
                      : "bg-sage-700 text-white"
                  }`}
                >
                  {missingMandatoryCredit ? "Required to Submit" : "Credited ✓"}
                </span>
              ) : (
                <span className="text-[11px] text-stone-400">Optional for original recipes</span>
              )}
            </div>
            <input
              ref={authorInputRef}
              id="add-author-input"
              type="text"
              value={authorCredit}
              onChange={(e) => {
                setAuthorCredit(e.target.value);
                if (saveError) setSaveError(null);
              }}
              placeholder="e.g., Julia Child — Mastering the Art of French Cooking, or Grandma Rose"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta-600/30 focus:border-terracotta-600"
            />
            {requiresAuthorCredit && (
              <p className="text-[11px] text-stone-600 mt-1.5">
                Imported recipes must credit the original author, chef, book, or website before saving.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="add-subtitle-input"
              className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5"
            >
              Short Note <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input
              id="add-subtitle-input"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g., Ready fast with pantry staples and fresh lemon."
              className="w-full px-4 py-2.5 bg-cream/60 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta-600/30 focus:border-terracotta-600"
            />
          </div>
        </div>

        {/* Quick Time & Servings Row */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-stone-500">Total Time</span>
            <div className="flex flex-wrap gap-1.5">
              {ADD_TIME_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    time === t
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-cream border border-stone-200 text-stone-700 hover:bg-sand/70"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-stone-500">Makes</span>
            <div className="inline-flex items-center gap-2.5 bg-sand/80 px-3 py-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setBaseServings((prev) => Math.max(1, prev - 1))}
                className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50 active:scale-95 transition"
                aria-label="Decrease servings"
              >
                &minus;
              </button>
              <span className="w-16 text-center text-xs font-bold text-stone-900">
                {baseServings} {baseServings === 1 ? "serving" : "servings"}
              </span>
              <button
                type="button"
                onClick={() => setBaseServings((prev) => Math.min(12, prev + 1))}
                className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50 active:scale-95 transition"
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Meal Style Checklist + AI Auto-Tag Toggle */}
        <div className="pt-2 border-t border-stone-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Meal Style Checklist</span>
            <button
              type="button"
              onClick={() => setAutoTagOnSave((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                autoTagOnSave
                  ? "border-sage-700/40 bg-sage-50 text-sage-800"
                  : "border-stone-200 bg-cream text-stone-500"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoTagOnSave ? "bg-sage-700" : "bg-stone-300"}`} />
              <span>AI Auto-Tag on Save: {autoTagOnSave ? "On" : "Off"}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ADD_TAG_OPTIONS.map((tag) => {
              const checked = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    checked
                      ? "border-sage-700 bg-sage-50/80 text-sage-800"
                      : "border-stone-200 bg-cream/40 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      checked ? "bg-sage-700 border-sage-700 text-white" : "border-stone-300 bg-white"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="text-xs font-semibold truncate">{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card 2: Ingredients Checklist Builder */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-900">Ingredients Checklist</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Add items below or tap a quick-add staple to save typing.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[11px] font-semibold text-stone-400 shrink-0 mr-1">Quick add:</span>
          {QUICK_STAPLES.map((staple) => (
            <button
              key={staple.name}
              type="button"
              onClick={() => quickAddStaple(staple.qty, staple.unit, staple.name)}
              className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-sand/80 hover:bg-sand text-stone-700 transition-colors"
            >
              {staple.label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {ingredients.map((row, idx) => (
            <div
              key={`draft-ing-${idx}`}
              className="flex items-center gap-2 bg-cream/60 p-2 rounded-2xl border border-stone-200/80"
            >
              <span className="w-5 h-5 rounded-md border border-stone-300 bg-white shrink-0 ml-1" />
              <input
                type="text"
                value={row.qty}
                onChange={(e) => updateIngredient(idx, "qty", e.target.value)}
                placeholder="1"
                aria-label="Amount"
                className="w-14 px-2 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-center text-stone-900 focus:outline-none focus:border-terracotta-600"
              />
              <select
                value={row.unit}
                onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                aria-label="Unit"
                className="px-2 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-700 focus:outline-none focus:border-terracotta-600"
              >
                {ADD_UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={row.name}
                onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                placeholder="Ingredient (e.g., baby spinach)"
                aria-label="Ingredient name"
                className="flex-1 min-w-0 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-600"
              />
              <button
                type="button"
                onClick={() => removeIngredient(idx)}
                aria-label="Remove ingredient"
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIngredients((prev) => [...prev, { qty: "1", unit: "cup", name: "" }])}
          className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-stone-300 hover:border-terracotta-600 hover:bg-terracotta-50/50 text-sm font-semibold text-terracotta-700 flex items-center justify-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add another ingredient</span>
        </button>
      </div>

      {/* Card 3: Cooking Steps Builder */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-900">Cooking Steps</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Break it into bite-sized actions so you never lose your place.
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={`draft-step-${idx}`}
              className="p-3.5 rounded-2xl bg-cream/60 border border-stone-200/80 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-stone-700">
                  <span className="w-5 h-5 rounded-full bg-terracotta-600 text-white text-[11px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  Step {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStep(idx, "hasTimer", !step.hasTimer)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      step.hasTimer
                        ? "border-sage-700 bg-sage-50 text-sage-800"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <span>{step.hasTimer ? "Timer On" : "Add timer"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    aria-label="Remove step"
                    className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <textarea
                rows={2}
                value={step.text}
                onChange={(e) => updateStep(idx, "text", e.target.value)}
                placeholder="Describe what to do (e.g., Sear chicken in olive oil until golden brown)..."
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-600 resize-none"
              />

              {step.hasTimer && (
                <div className="flex items-center gap-2 pt-0.5 text-xs text-sage-800">
                  <span className="font-semibold">Timer length:</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={step.timerMins}
                    onChange={(e) =>
                      updateStep(idx, "timerMins", Math.max(1, parseInt(e.target.value || "1", 10)))
                    }
                    className="w-16 px-2 py-1 bg-white border border-sage-700/30 rounded-lg font-bold text-center text-stone-900"
                  />
                  <span>minutes</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSteps((prev) => [...prev, { text: "", hasTimer: false, timerMins: 5 }])}
          className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-stone-300 hover:border-sage-700 hover:bg-sage-50/60 text-sm font-semibold text-sage-800 flex items-center justify-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add another step</span>
        </button>
      </div>

      {saveError && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 font-medium">
          {saveError}
        </p>
      )}

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-cream/95 backdrop-blur border-t border-stone-200/90 p-3.5 sm:p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3.5 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || isDuplicateBlocked || missingMandatoryCredit}
            onClick={() => void handleSave()}
            className="flex-1 sm:flex-initial sm:min-w-[260px] py-3.5 px-6 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] text-white font-semibold text-base shadow-md shadow-terracotta-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>
              {isSaving
                ? "Saving..."
                : isDuplicateBlocked
                  ? "Already Saved in CookFlow"
                  : missingMandatoryCredit
                    ? "Credit Author to Save"
                    : "Save Recipe"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
