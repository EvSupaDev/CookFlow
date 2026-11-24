import { SEED_RECIPES } from "@/data/seedRecipes";
import { logger } from "@/lib/logger";
import type {
  AISwapRequest,
  AISwapResponse,
  DuplicateCheckRequest,
  DuplicateCheckResponse,
  IngredientSwap,
  KitchenRescueRequest,
  KitchenRescueResponse,
  PantryRecipeRequest,
  ParsedRecipeDraft,
  Recipe,
  UserProfile,
} from "@/types/recipe";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api";
const OFFLINE_CACHE_KEY = "cookflow_offline_state_v1";
const OFFLINE_SWAPS_KEY = "cookflow_offline_ai_swaps_v1";

export interface BootstrapPayload {
  recipes: Recipe[];
  savedIds: string[];
  profile: UserProfile;
  offlineFallback?: boolean;
  syncedOfflineCount?: number;
}

export interface SaveTogglePayload {
  recipeId: string;
  saved: boolean;
  savedIds: string[];
  offline?: boolean;
}

export interface ProfilePatchPayload {
  name?: string;
  defaultServings?: number;
  autoWakeLock?: boolean;
}

interface CachedOfflineSnapshot {
  recipes: Recipe[];
  savedIds: string[];
  profile: UserProfile;
  updatedAt: number;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Home Cook",
  defaultServings: 2,
  autoWakeLock: false,
  mealsCooked: 0,
};

export function readOfflineSnapshot(): CachedOfflineSnapshot {
  try {
    const raw = window.localStorage.getItem(OFFLINE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CachedOfflineSnapshot>;
      if (Array.isArray(parsed.recipes) && parsed.recipes.length > 0) {
        return {
          recipes: parsed.recipes,
          savedIds: Array.isArray(parsed.savedIds) ? parsed.savedIds : [],
          profile: {
            ...DEFAULT_PROFILE,
            ...(parsed.profile ?? {}),
          },
          updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
        };
      }
    }
  } catch (err) {
    logger.warn("OfflineCache", "Failed to read localStorage snapshot", err);
  }
  return {
    recipes: [...SEED_RECIPES],
    savedIds: [],
    profile: { ...DEFAULT_PROFILE },
    updatedAt: Date.now(),
  };
}

export function writeOfflineSnapshot(snapshot: Omit<CachedOfflineSnapshot, "updatedAt">): void {
  try {
    const payload: CachedOfflineSnapshot = {
      ...snapshot,
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    logger.warn("OfflineCache", "Failed to persist offline snapshot to localStorage", err);
  }
}

export function readOfflineAiSwaps(): Record<string, Record<string, IngredientSwap[]>> {
  try {
    const raw = window.localStorage.getItem(OFFLINE_SWAPS_KEY);
    if (raw) {
      return JSON.parse(raw) as Record<string, Record<string, IngredientSwap[]>>;
    }
  } catch (err) {
    logger.warn("OfflineCache", "Failed to read cached AI swaps", err);
  }
  return {};
}

export function writeOfflineAiSwaps(
  swapsMap: Record<string, Record<string, IngredientSwap[]>>
): void {
  try {
    window.localStorage.setItem(OFFLINE_SWAPS_KEY, JSON.stringify(swapsMap));
  } catch (err) {
    logger.warn("OfflineCache", "Failed to save AI swaps to localStorage", err);
  }
}

class ApiHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
  }
}

class OfflineNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfflineNetworkError";
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = init?.method ?? "GET";
  const t0 = performance.now();

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    const elapsedMs = (performance.now() - t0).toFixed(1);
    logger.warn("API", `${method} ${path} unreachable (offline) after ${elapsedMs}ms`, err);
    const isAiEndpoint = path.startsWith("/ai/");
    const friendlyMessage = isAiEndpoint
      ? "You're currently offline, so AI features aren't available right now. Reconnect to the CookFlow server to use AI."
      : "You're currently offline. Reconnect to the CookFlow server to sync your changes.";
    throw new OfflineNetworkError(friendlyMessage);
  }

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
  const cached = readOfflineSnapshot();

  try {
    let data = await requestJson<BootstrapPayload>("/bootstrap");

    const offlineCreated = cached.recipes.filter((r) => r.id.startsWith("offline-"));
    let syncedCount = 0;
    if (offlineCreated.length > 0) {
      logger.info(
        "OfflineSync",
        `Syncing ${offlineCreated.length} offline-created recipe(s) to FastAPI SQLite...`
      );
      for (const localRecipe of offlineCreated) {
        try {
          const { id: _oldId, ...rest } = localRecipe;
          await requestJson<Recipe>("/recipes", {
            method: "POST",
            body: JSON.stringify(rest),
          });
          syncedCount += 1;
        } catch (syncErr) {
          logger.warn("OfflineSync", `Skipped syncing offline recipe '${localRecipe.title}'`, syncErr);
        }
      }
      if (syncedCount > 0) {
        data = await requestJson<BootstrapPayload>("/bootstrap");
      }
    }

    writeOfflineSnapshot({
      recipes: data.recipes,
      savedIds: data.savedIds,
      profile: data.profile,
    });

    logger.info(
      "API",
      `Hydrated from FastAPI: ${data.recipes.length} recipes, ${data.savedIds.length} saved (synced=${syncedCount})`
    );
    return { ...data, offlineFallback: false, syncedOfflineCount: syncedCount };
  } catch (err) {
    logger.warn(
      "API",
      `FastAPI backend unreachable; running in Offline Mode with ${cached.recipes.length} cached recipes`,
      err
    );
    return {
      recipes: cached.recipes,
      savedIds: cached.savedIds,
      profile: cached.profile,
      offlineFallback: true,
      syncedOfflineCount: 0,
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

      if (
        (candTitle && candTitle === exTitle && candIngSig === exIngSig) ||
        (candIngSig && candIngSig === exIngSig && candStepSig === exStepSig)
      ) {
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
): Promise<{ recipe: Recipe; offline: boolean }> {
  try {
    const created = await requestJson<Recipe>("/recipes", {
      method: "POST",
      body: JSON.stringify(recipe),
    });
    const snap = readOfflineSnapshot();
    writeOfflineSnapshot({
      recipes: [created, ...snap.recipes.filter((r) => r.id !== created.id)],
      savedIds: Array.from(new Set([created.id, ...snap.savedIds])),
      profile: snap.profile,
    });
    return { recipe: created, offline: false };
  } catch (err) {
    if (err instanceof ApiHttpError) {
      throw err;
    }
    const offlineId = recipe.id ?? `offline-${Date.now()}`;
    logger.warn("API", `Offline Mode: saved recipe to localStorage (${offlineId})`, err);
    const { autoTag: _a, requiresAuthorCredit: _r, ...cleanRecipe } = recipe;
    const localCreated: Recipe = { ...cleanRecipe, id: offlineId };
    const snap = readOfflineSnapshot();
    writeOfflineSnapshot({
      recipes: [localCreated, ...snap.recipes],
      savedIds: Array.from(new Set([offlineId, ...snap.savedIds])),
      profile: snap.profile,
    });
    return { recipe: localCreated, offline: true };
  }
}

export async function toggleSaveRecipeApi(
  recipeId: string,
  currentSavedIds: Set<string>
): Promise<SaveTogglePayload> {
  try {
    const res = await requestJson<SaveTogglePayload>(`/recipes/${encodeURIComponent(recipeId)}/save`, {
      method: "POST",
    });
    const snap = readOfflineSnapshot();
    writeOfflineSnapshot({
      recipes: snap.recipes,
      savedIds: res.savedIds,
      profile: snap.profile,
    });
    return { ...res, offline: false };
  } catch (err) {
    const next = new Set(currentSavedIds);
    const willSave = !next.has(recipeId);
    if (willSave) next.add(recipeId);
    else next.delete(recipeId);
    const nextIds = Array.from(next);
    const snap = readOfflineSnapshot();
    writeOfflineSnapshot({
      recipes: snap.recipes,
      savedIds: nextIds,
      profile: snap.profile,
    });
    logger.warn("API", `Offline Mode: persisted saved=${willSave} for ${recipeId} in localStorage`, err);
    return {
      recipeId,
      saved: willSave,
      savedIds: nextIds,
      offline: true,
    };
  }
}

export async function updateProfileApi(
  patch: ProfilePatchPayload,
  fallbackCurrent: UserProfile
): Promise<{ profile: UserProfile; offline: boolean }> {
  try {
    const updated = await requestJson<UserProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    const snap = readOfflineSnapshot();
    writeOfflineSnapshot({
      recipes: snap.recipes,
      savedIds: snap.savedIds,
      profile: updated,
    });
    return { profile: updated, offline: false };
  } catch (err) {
    const nextProfile: UserProfile = { ...fallbackCurrent, ...patch };
    const snap = readOfflineSnapshot();
    writeOfflineSnapshot({
      recipes: snap.recipes,
      savedIds: snap.savedIds,
      profile: nextProfile,
    });
    logger.warn("API", "Offline Mode: persisted kitchen profile in localStorage", err);
    return { profile: nextProfile, offline: true };
  }
}

export async function recordMealCookedApi(
  fallbackCurrent: UserProfile
): Promise<{ profile: UserProfile; offline: boolean }> {
  try {
    const updated = await requestJson<UserProfile>("/profile/meals-cooked", {
      method: "POST",
    });
    const snap = readOfflineSnapshot();
    writeOfflineSnapshot({
      recipes: snap.recipes,
      savedIds: snap.savedIds,
      profile: updated,
    });
    return { profile: updated, offline: false };
  } catch (err) {
    const nextProfile: UserProfile = {
      ...fallbackCurrent,
      mealsCooked: fallbackCurrent.mealsCooked + 1,
    };
    const snap = readOfflineSnapshot();
    writeOfflineSnapshot({
      recipes: snap.recipes,
      savedIds: snap.savedIds,
      profile: nextProfile,
    });
    logger.warn("API", "Offline Mode: persisted mealsCooked increment in localStorage", err);
    return { profile: nextProfile, offline: true };
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
  const created = await requestJson<Recipe>("/ai/pantry-recipe", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const snap = readOfflineSnapshot();
  writeOfflineSnapshot({
    recipes: [created, ...snap.recipes.filter((r) => r.id !== created.id)],
    savedIds: Array.from(new Set([created.id, ...snap.savedIds])),
    profile: snap.profile,
  });
  return created;
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

export async function transcribeVoiceAudioApi(
  audioBase64: string,
  mimeType: string
): Promise<string> {
  logger.info("AI:Whisper", `Sending recorded audio (${mimeType}) to Groq Whisper`);
  try {
    const res = await requestJson<{ transcript: string }>("/ai/transcribe", {
      method: "POST",
      body: JSON.stringify({ audioBase64, mimeType }),
    });
    return res.transcript;
  } catch (err) {
    if (err instanceof ApiHttpError && err.status === 404) {
      throw new Error(
        "Backend /api/ai/transcribe route not added yet — add the Whisper snippet to backend/app/api/routes.py or use Chrome/Edge."
      );
    }
    throw err;
  }
}
