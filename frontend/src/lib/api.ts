import { SEED_RECIPES } from "@/data/seedRecipes";
import { logger } from "@/lib/logger";
import type {
  AISwapRequest,
  AISwapResponse,
  DuplicateCheckRequest,
  DuplicateCheckResponse,
  KitchenRescueRequest,
  KitchenRescueResponse,
  PantryRecipeRequest,
  ParsedRecipeDraft,
  Recipe,
  UserProfile,
} from "@/types/recipe";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api";

export interface BootstrapPayload {
  recipes: Recipe[];
  savedIds: string[];
  profile: UserProfile;
  offlineFallback?: boolean;
}

export interface SaveTogglePayload {
  recipeId: string;
  saved: boolean;
  savedIds: string[];
}

export interface ProfilePatchPayload {
  name?: string;
  defaultServings?: number;
  autoWakeLock?: boolean;
}

class ApiHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = init?.method ?? "GET";
  const t0 = performance.now();

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const elapsedMs = (performance.now() - t0).toFixed(1);
  if (!response.ok) {
    let detailMsg = response.statusText;
    try {
      const errBody = (await response.json()) as { detail?: string };
      if (errBody && typeof errBody.detail === "string") {
        detailMsg = errBody.detail;
      }
    } catch {
      detailMsg = await response.text().catch(() => response.statusText);
    }
    logger.error("API", `${method} ${path} failed (${response.status}) in ${elapsedMs}ms: ${detailMsg}`);
    throw new ApiHttpError(response.status, detailMsg || `Request failed with status ${response.status}`);
  }

  const data = (await response.json()) as T;
  logger.debug("API", `${method} ${path} -> ${response.status} (${elapsedMs}ms)`);
  return data;
}

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  try {
    const data = await requestJson<BootstrapPayload>("/bootstrap");
    logger.info(
      "API",
      `Hydrated from FastAPI: ${data.recipes.length} recipes, ${data.savedIds.length} saved`
    );
    return { ...data, offlineFallback: false };
  } catch (err) {
    logger.warn(
      "API",
      "FastAPI backend unreachable; falling back to local seed recipes until backend starts",
      err
    );
    return {
      recipes: [...SEED_RECIPES],
      savedIds: [],
      profile: {
        name: "Home Cook",
        defaultServings: 2,
        autoWakeLock: false,
        mealsCooked: 0,
      },
      offlineFallback: true,
    };
  }
}

export async function checkDuplicateRecipeApi(
  payload: DuplicateCheckRequest,
  localRecipes: Recipe[]
): Promise<DuplicateCheckResponse> {
  try {
    return await requestJson<DuplicateCheckResponse>("/recipes/check-duplicate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof ApiHttpError) {
      throw err;
    }
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/\{[^}]+\}/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const candTitle = norm(payload.title);
    const candIngSig = payload.ingredients
      .map((i) => `${norm(i.name)}:${norm(i.unit)}:${Math.round(i.qty * 100) / 100}`)
      .sort()
      .join("|");
    const candStepSig = payload.steps.map((s) => norm(s)).join("|");

    for (const existing of localRecipes) {
      const exTitle = norm(existing.title);
      const exIngSig = existing.ingredients
        .map((i) => `${norm(i.name)}:${norm(i.unit)}:${Math.round(i.qty * 100) / 100}`)
        .sort()
        .join("|");
      const exStepSig = existing.steps.map((s) => norm(s.text)).join("|");

      if ((candTitle && candTitle === exTitle && candIngSig === exIngSig) || (candIngSig && candIngSig === exIngSig && candStepSig === exStepSig)) {
        return {
          isDuplicate: true,
          reason: `This exact recipe already exists in CookFlow as '${existing.title}'.`,
          existingRecipe: existing,
        };
      }
    }

    return { isDuplicate: false, reason: "" };
  }
}

export async function createRecipeApi(
  recipe: Omit<Recipe, "id"> & {
    id?: string;
    autoTag?: boolean;
    requiresAuthorCredit?: boolean;
  }
): Promise<Recipe> {
  try {
    return await requestJson<Recipe>("/recipes", {
      method: "POST",
      body: JSON.stringify(recipe),
    });
  } catch (err) {
    if (err instanceof ApiHttpError) {
      throw err;
    }
    const fallbackId = recipe.id ?? `custom-${Date.now()}`;
    logger.warn("API", `Offline fallback: saved custom recipe locally (${fallbackId})`, err);
    const { autoTag: _a, requiresAuthorCredit: _r, ...cleanRecipe } = recipe;
    return { ...cleanRecipe, id: fallbackId };
  }
}

export async function toggleSaveRecipeApi(
  recipeId: string,
  currentSavedIds: Set<string>
): Promise<SaveTogglePayload> {
  try {
    return await requestJson<SaveTogglePayload>(`/recipes/${encodeURIComponent(recipeId)}/save`, {
      method: "POST",
    });
  } catch (err) {
    const next = new Set(currentSavedIds);
    const willSave = !next.has(recipeId);
    if (willSave) next.add(recipeId);
    else next.delete(recipeId);
    logger.warn("API", `Offline fallback: toggled saved=${willSave} for ${recipeId}`, err);
    return {
      recipeId,
      saved: willSave,
      savedIds: Array.from(next),
    };
  }
}

export async function updateProfileApi(
  patch: ProfilePatchPayload,
  fallbackCurrent: UserProfile
): Promise<UserProfile> {
  try {
    return await requestJson<UserProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  } catch (err) {
    logger.warn("API", "Offline fallback: updated kitchen profile in memory", err);
    return {
      ...fallbackCurrent,
      ...patch,
    };
  }
}

export async function recordMealCookedApi(fallbackCurrent: UserProfile): Promise<UserProfile> {
  try {
    return await requestJson<UserProfile>("/profile/meals-cooked", {
      method: "POST",
    });
  } catch (err) {
    logger.warn("API", "Offline fallback: incremented mealsCooked in memory", err);
    return {
      ...fallbackCurrent,
      mealsCooked: fallbackCurrent.mealsCooked + 1,
    };
  }
}

// ---------------------------------------------------------------------------
// Groq AI Client Functions
// ---------------------------------------------------------------------------

export async function fetchAiSwapsApi(payload: AISwapRequest): Promise<AISwapResponse> {
  logger.info("AI:Swaps", `Requesting Groq substitutes for '${payload.ingredientName}'`);
  return await requestJson<AISwapResponse>("/ai/swaps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generatePantryRecipeApi(payload: PantryRecipeRequest): Promise<Recipe> {
  logger.info("AI:Pantry", `Generating recipe from pantry items: '${payload.pantryInput}'`);
  return await requestJson<Recipe>("/ai/pantry-recipe", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function importRawRecipeApi(rawText: string): Promise<ParsedRecipeDraft> {
  logger.info("AI:Import", `Parsing raw recipe text (${rawText.length} chars)`);
  return await requestJson<ParsedRecipeDraft>("/ai/import-recipe", {
    method: "POST",
    body: JSON.stringify({ rawText }),
  });
}

export async function importRecipeImageApi(
  imageDataUrl: string,
  sourceHint = ""
): Promise<ParsedRecipeDraft> {
  logger.info("AI:VisionImport", "Sending compressed recipe photo to Groq Vision OCR");
  return await requestJson<ParsedRecipeDraft>("/ai/import-recipe-image", {
    method: "POST",
    body: JSON.stringify({ imageDataUrl, sourceHint }),
  });
}

export async function askKitchenRescueApi(
  payload: KitchenRescueRequest
): Promise<KitchenRescueResponse> {
  logger.info("AI:Rescue", `Asking Kitchen Rescue on step ${payload.currentStepNumber}/${payload.totalSteps}`);
  return await requestJson<KitchenRescueResponse>("/ai/kitchen-rescue", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
