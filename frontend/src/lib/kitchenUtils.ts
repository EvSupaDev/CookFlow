import type { Ingredient, IngredientSwap, Recipe, ResolvedIngredient } from "@/types/recipe";
import { logger } from "@/lib/logger";

export interface StepSegment {
  type: "text" | "ingredient";
  value: string;
}

const FRACTION_TABLE: ReadonlyArray<{ val: number; label: string }> = [
  { val: 0, label: "" },
  { val: 0.25, label: "¼" },
  { val: 0.33, label: "⅓" },
  { val: 0.5, label: "½" },
  { val: 0.66, label: "⅔" },
  { val: 0.75, label: "¾" },
  { val: 1, label: "" },
];

/**
 * Converts decimal quantities into readable cookbook fractions (e.g., 1.5 -> "1 ½", 0.33 -> "⅓").
 */
export function formatKitchenQuantity(rawQty: number): string {
  if (!rawQty || rawQty <= 0) return "";
  const whole = Math.floor(rawQty + 0.02);
  const frac = rawQty - whole;

  let closest = FRACTION_TABLE[0];
  let minDiff = Number.POSITIVE_INFINITY;

  for (const entry of FRACTION_TABLE) {
    const diff = Math.abs(frac - entry.val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  const adjustedWhole = closest.val === 1 ? whole + 1 : whole;
  if (adjustedWhole === 0 && closest.label) return closest.label;
  if (adjustedWhole > 0 && closest.label) return `${adjustedWhole} ${closest.label}`;
  if (adjustedWhole > 0) return `${adjustedWhole}`;
  return rawQty.toFixed(1).replace(/\.0$/, "");
}

/**
 * Parses user-typed quantities including unicode fractions ("1 ½") and slash fractions ("1 1/2", "3/4").
 */
export function parseFractionInput(str: string): number {
  const cleaned = String(str ?? "").trim();
  if (!cleaned) return 1;

  const unicodeMap: Record<string, number> = {
    "¼": 0.25,
    "⅓": 1 / 3,
    "½": 0.5,
    "⅔": 2 / 3,
    "¾": 0.75,
  };

  for (const [sym, val] of Object.entries(unicodeMap)) {
    if (cleaned.includes(sym)) {
      const wholePart = cleaned.replace(sym, "").trim();
      const whole = wholePart ? parseFloat(wholePart) : 0;
      return (Number.isNaN(whole) ? 0 : whole) + val;
    }
  }

  if (cleaned.includes("/")) {
    const parts = cleaned.split(/\s+/);
    let total = 0;
    for (const part of parts) {
      if (part.includes("/")) {
        const [num, den] = part.split("/").map(Number);
        if (den && !Number.isNaN(num) && !Number.isNaN(den)) {
          total += num / den;
        }
      } else {
        const whole = parseFloat(part);
        if (!Number.isNaN(whole)) total += whole;
      }
    }
    return total > 0 ? total : 1;
  }

  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;
}

/**
 * Returns the unified list of options for any ingredient (index 0 is always the original ingredient),
 * combining built-in preset swaps with any dynamically generated Groq AI swaps.
 */
export function getCombinedIngredientSwaps(
  ingredient: Ingredient,
  aiSwaps: IngredientSwap[] = []
): IngredientSwap[] {
  const baseOptions: IngredientSwap[] =
    Array.isArray(ingredient.swaps) && ingredient.swaps.length > 0
      ? [...ingredient.swaps]
      : [
          {
            label: `${ingredient.name} (original)`,
            qty: ingredient.qty,
            unit: ingredient.unit,
            name: ingredient.name,
          },
        ];

  const seenNames = new Set(baseOptions.map((item) => item.name.trim().toLowerCase()));
  for (const aiOpt of aiSwaps) {
    const norm = aiOpt.name.trim().toLowerCase();
    if (!seenNames.has(norm)) {
      seenNames.add(norm);
      baseOptions.push(aiOpt);
    }
  }

  return baseOptions;
}

/**
 * Resolves an ingredient's scaled quantity, unit, and active swap (preset or AI-generated).
 */
export function getResolvedIngredient(
  recipe: Recipe,
  ingredient: Ingredient,
  servings: number,
  swaps: Record<string, number>,
  aiSwapsByIng: Record<string, IngredientSwap[]> = {}
): ResolvedIngredient {
  const combined = getCombinedIngredientSwaps(ingredient, aiSwapsByIng[ingredient.id]);
  const swapIdx = swaps[ingredient.id] ?? 0;
  const activeVariant = combined[swapIdx] ?? combined[0];
  const scale = servings / Math.max(1, recipe.baseServings);
  const scaledQty = activeVariant.qty * scale;
  const formattedQty = formatKitchenQuantity(scaledQty);

  return {
    id: ingredient.id,
    formattedQty,
    unit: activeVariant.unit,
    name: activeVariant.name,
    note: activeVariant.note,
    isSwapped: swapIdx > 0,
    hasSwaps: true,
    fullPhrase: `${formattedQty} ${activeVariant.unit} ${activeVariant.name}`.replace(/\s+/g, " ").trim(),
  };
}

/**
 * Splits step instruction templates like "Sear {protein} in {fat}" into typed JSX-safe segments.
 */
export function parseStepInstructionSegments(
  recipe: Recipe,
  rawText: string,
  servings: number,
  swaps: Record<string, number>,
  aiSwapsByIng: Record<string, IngredientSwap[]> = {}
): StepSegment[] {
  const segments: StepSegment[] = [];
  const tokenRegex = /\{([a-zA-Z0-9_-]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: rawText.slice(lastIndex, match.index) });
    }

    const ingId = match[1];
    const ing = recipe.ingredients.find((item) => item.id === ingId);
    if (ing) {
      const resolved = getResolvedIngredient(recipe, ing, servings, swaps, aiSwapsByIng);
      segments.push({ type: "ingredient", value: resolved.fullPhrase });
    } else {
      segments.push({ type: "text", value: match[0] });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    segments.push({ type: "text", value: rawText.slice(lastIndex) });
  }

  return segments;
}

export function formatTimerSeconds(sec: number): string {
  const safeSec = Math.max(0, Math.floor(sec));
  const mins = Math.floor(safeSec / 60);
  const rem = safeSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export function getInitials(name: string): string {
  const words = String(name || "HC")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "HC";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Plays a gentle two-note synthesized chime (D5 -> A5) via Web Audio API when a timer completes.
 */
export function playGentleChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes = [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.22);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.22 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.22 + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.22);
      osc.stop(ctx.currentTime + idx * 0.22 + 0.95);
    });
    logger.debug("AudioChime", "Played timer completion chime");
  } catch (err) {
    logger.warn("AudioChime", "Unable to play synthesized chime", err);
  }
}
