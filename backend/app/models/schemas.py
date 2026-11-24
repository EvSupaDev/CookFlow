from typing import List, Optional
from pydantic import BaseModel, Field


class IngredientSwap(BaseModel):
    label: str
    qty: float = Field(gt=0)
    unit: str
    name: str
    note: Optional[str] = None


class Ingredient(BaseModel):
    id: str
    qty: float = Field(gt=0)
    unit: str
    name: str
    swaps: Optional[List[IngredientSwap]] = None


class StepTimerConfig(BaseModel):
    label: str
    seconds: int = Field(gt=0)


class RecipeStep(BaseModel):
    phase: str
    text: str
    tip: Optional[str] = None
    timer: Optional[StepTimerConfig] = None
    ingredientIds: List[str] = Field(default_factory=list)


class RecipeBase(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    subtitle: str = Field(default="Homemade recipe saved in CookFlow.", max_length=400)
    time: str = Field(default="20 min", max_length=32)
    baseServings: int = Field(default=2, ge=1, le=24)
    tags: List[str] = Field(default_factory=list)
    image: str
    fallbackColor: str = Field(default="C85A32", max_length=16)
    authorCredit: str = Field(default="", max_length=160)
    ingredients: List[Ingredient] = Field(min_length=1)
    steps: List[RecipeStep] = Field(min_length=1)


class RecipeCreate(RecipeBase):
    id: Optional[str] = None
    autoTag: bool = False
    requiresAuthorCredit: bool = False


class RecipeOut(RecipeBase):
    id: str


class UserProfileOut(BaseModel):
    name: str = "Home Cook"
    defaultServings: int = Field(default=2, ge=1, le=12)
    autoWakeLock: bool = False
    mealsCooked: int = Field(default=0, ge=0)


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    defaultServings: Optional[int] = Field(default=None, ge=1, le=12)
    autoWakeLock: Optional[bool] = None


class SaveToggleResponse(BaseModel):
    recipeId: str
    saved: bool
    savedIds: List[str]


class BootstrapResponse(BaseModel):
    recipes: List[RecipeOut]
    savedIds: List[str]
    profile: UserProfileOut


# ---------------------------------------------------------------------------
# Duplicate Detection Schemas
# ---------------------------------------------------------------------------

class DuplicateIngredientItem(BaseModel):
    qty: float = Field(default=1.0, gt=0)
    unit: str = ""
    name: str


class DuplicateCheckRequest(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    ingredients: List[DuplicateIngredientItem] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)


class DuplicateCheckResponse(BaseModel):
    isDuplicate: bool
    reason: str = ""
    existingRecipe: Optional[RecipeOut] = None


# ---------------------------------------------------------------------------
# Groq AI Request / Response Schemas
# ---------------------------------------------------------------------------

class AISwapRequest(BaseModel):
    recipeId: str
    recipeTitle: str
    ingredientId: str
    ingredientName: str
    ingredientQty: float = Field(gt=0)
    ingredientUnit: str
    baseServings: int = Field(default=2, ge=1, le=24)
    stepContext: List[str] = Field(default_factory=list)
    preference: str = Field(default="", max_length=160)


class AISwapResponse(BaseModel):
    ingredientId: str
    swaps: List[IngredientSwap]
    cached: bool = False


class PantryRecipeRequest(BaseModel):
    pantryInput: str = Field(min_length=2, max_length=500)
    dietaryNote: str = Field(default="", max_length=160)
    servings: int = Field(default=2, ge=1, le=12)


class RecipeImportRequest(BaseModel):
    rawText: str = Field(min_length=10, max_length=8000)


class RecipeImageImportRequest(BaseModel):
    imageDataUrl: str = Field(min_length=50, max_length=8_000_000)
    sourceHint: str = Field(default="", max_length=160)


class DraftIngredientOut(BaseModel):
    qty: str
    unit: str
    name: str


class DraftStepOut(BaseModel):
    text: str
    hasTimer: bool = False
    timerMins: int = Field(default=5, ge=1, le=180)


class ParsedRecipeDraftOut(BaseModel):
    title: str
    subtitle: str
    time: str
    baseServings: int = Field(default=2, ge=1, le=12)
    tags: List[str]
    detectedAuthor: str = ""
    ingredients: List[DraftIngredientOut]
    steps: List[DraftStepOut]


class KitchenRescueRequest(BaseModel):
    recipeTitle: str
    currentStepNumber: int = Field(ge=1)
    totalSteps: int = Field(ge=1)
    currentStepText: str
    activeIngredients: List[str] = Field(default_factory=list)
    question: str = Field(min_length=1, max_length=600)


class KitchenRescueResponse(BaseModel):
    onTopic: bool
    answer: str
    quickTip: Optional[str] = None


class AutoTagRequest(BaseModel):
    title: str
    time: str = "20 min"
    ingredients: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)


class AutoTagResponse(BaseModel):
    tags: List[str]
