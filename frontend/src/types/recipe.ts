export type ScreenName = "discover" | "prep" | "cook" | "add" | "profile";

export interface IngredientSwap {
  label: string;
  qty: number;
  unit: string;
  name: string;
  note?: string;
}

export interface Ingredient {
  id: string;
  qty: number;
  unit: string;
  name: string;
  swaps?: IngredientSwap[];
}

export interface StepTimerConfig {
  label: string;
  seconds: number;
}

export interface RecipeStep {
  phase: string;
  text: string;
  tip?: string;
  timer?: StepTimerConfig | null;
  ingredientIds: string[];
}

export interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  baseServings: number;
  tags: string[];
  image: string;
  fallbackColor: string;
  authorCredit?: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
}

export interface ResolvedIngredient {
  id: string;
  formattedQty: string;
  unit: string;
  name: string;
  note?: string;
  isSwapped: boolean;
  hasSwaps: boolean;
  fullPhrase: string;
}

export interface ActiveTimer {
  id: string;
  label: string;
  remaining: number;
  total: number;
  running: boolean;
  done: boolean;
}

export interface UserProfile {
  name: string;
  defaultServings: number;
  autoWakeLock: boolean;
  mealsCooked: number;
}

export interface DraftIngredientRow {
  qty: string;
  unit: string;
  name: string;
}

export interface DraftStepRow {
  text: string;
  hasTimer: boolean;
  timerMins: number;
}

export interface AddRecipeDraft {
  title: string;
  subtitle: string;
  time: string;
  baseServings: number;
  tags: string[];
  ingredients: DraftIngredientRow[];
  steps: DraftStepRow[];
}

// ---------------------------------------------------------------------------
// Duplicate Detection Types
// ---------------------------------------------------------------------------

export interface DuplicateCheckIngredient {
  qty: number;
  unit: string;
  name: string;
}

export interface DuplicateCheckRequest {
  title: string;
  ingredients: DuplicateCheckIngredient[];
  steps: string[];
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  reason: string;
  existingRecipe?: Recipe | null;
}

// ---------------------------------------------------------------------------
// Groq AI Types
// ---------------------------------------------------------------------------

export interface AISwapRequest {
  recipeId: string;
  recipeTitle: string;
  ingredientId: string;
  ingredientName: string;
  ingredientQty: number;
  ingredientUnit: string;
  baseServings: number;
  stepContext: string[];
  preference: string;
}

export interface AISwapResponse {
  ingredientId: string;
  swaps: IngredientSwap[];
  cached: boolean;
}

export interface PantryRecipeRequest {
  pantryInput: string;
  dietaryNote: string;
  servings: number;
}

export interface ParsedRecipeDraft {
  title: string;
  subtitle: string;
  time: string;
  baseServings: number;
  tags: string[];
  detectedAuthor?: string;
  ingredients: DraftIngredientRow[];
  steps: DraftStepRow[];
}

export interface KitchenRescueRequest {
  recipeTitle: string;
  currentStepNumber: number;
  totalSteps: number;
  currentStepText: string;
  activeIngredients: string[];
  question: string;
}

export interface KitchenRescueResponse {
  onTopic: boolean;
  answer: string;
  quickTip?: string | null;
}
