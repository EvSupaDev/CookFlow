import hashlib
import json
import re
import time
from typing import Any, Dict, List

from groq import AsyncGroq

from app.core.config import settings
from app.core.logger import logger
from app.db import database
from app.models.schemas import (
    AISwapRequest,
    AISwapResponse,
    AutoTagRequest,
    AutoTagResponse,
    DraftIngredientOut,
    DraftStepOut,
    Ingredient,
    IngredientSwap,
    KitchenRescueRequest,
    KitchenRescueResponse,
    PantryRecipeRequest,
    ParsedRecipeDraftOut,
    RecipeCreate,
    RecipeImageImportRequest,
    RecipeImportRequest,
    RecipeStep,
    StepTimerConfig,
)

CANONICAL_TAGS = [
    "Under 20 min",
    "One Pan",
    "Vegetarian",
    "Pantry Staples",
    "High Protein",
    "Kid-Friendly",
]


class GroqServiceError(Exception):
    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _get_groq_client() -> AsyncGroq:
    if not settings.has_valid_groq_key:
        raise GroqServiceError(
            "GROQ_API_KEY is not configured in backend/.env. Add your Groq key and restart uvicorn.",
            status_code=503,
        )
    return AsyncGroq(api_key=settings.groq_api_key, timeout=30.0)


async def _complete_json(
    system_prompt: str,
    user_content: Any,
    scope: str,
    temperature: float = 0.25,
    model_override: str | None = None,
) -> Dict[str, Any]:
    client = _get_groq_client()
    model_name = model_override or settings.groq_model
    t0 = time.perf_counter()
    logger.info(f"[Groq:{scope}] Dispatching request to model='{model_name}'")

    try:
        completion = await client.chat.completions.create(
            model=model_name,
            temperature=temperature,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        )
    except Exception as exc:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.error(f"[Groq:{scope}] API call failed after {elapsed_ms:.1f}ms: {exc}")
        raise GroqServiceError(f"Groq AI request failed: {exc}", status_code=502) from exc

    elapsed_ms = (time.perf_counter() - t0) * 1000
    raw_content = completion.choices[0].message.content or "{}"
    usage = getattr(completion, "usage", None)
    tokens_info = f"tokens={usage.total_tokens}" if usage else "tokens=unknown"
    logger.info(f"[Groq:{scope}] Completed in {elapsed_ms:.1f}ms ({tokens_info})")

    try:
        return json.loads(raw_content)
    except json.JSONDecodeError as exc:
        logger.error(f"[Groq:{scope}] Invalid JSON returned by model: {raw_content[:300]}")
        raise GroqServiceError("Groq returned malformed JSON. Please retry.", status_code=502) from exc


def _normalize_parsed_draft(data: Dict[str, Any], default_subtitle: str) -> ParsedRecipeDraftOut:
    allowed_times = {"10 min", "15 min", "20 min", "30 min", "45 min"}
    parsed_time = str(data.get("time", "20 min")).strip()
    if parsed_time not in allowed_times:
        parsed_time = "20 min"

    allowed_units = {"cup", "cups", "tbsp", "tsp", "oz", "lb", "cloves", "can", "whole", "pinch"}
    ingredients: List[DraftIngredientOut] = []
    for item in data.get("ingredients", []):
        name = str(item.get("name", "")).strip()
        if not name:
            continue
        unit = str(item.get("unit", "cup")).strip().lower()
        if unit not in allowed_units:
            unit = "whole"
        ingredients.append(
            DraftIngredientOut(
                qty=str(item.get("qty", "1")).strip() or "1",
                unit=unit,
                name=name,
            )
        )

    if not ingredients:
        ingredients = [DraftIngredientOut(qty="1", unit="cup", name="main ingredient")]

    steps: List[DraftStepOut] = []
    for s in data.get("steps", []):
        text = str(s.get("text", "")).strip()
        if not text:
            continue
        has_timer = bool(s.get("hasTimer", False))
        mins = max(1, min(180, int(s.get("timerMins", 5) or 5)))
        steps.append(DraftStepOut(text=text, hasTimer=has_timer, timerMins=mins))

    if not steps:
        steps = [DraftStepOut(text="Prepare and cook ingredients until done.", hasTimer=False, timerMins=5)]

    tags = [t for t in data.get("tags", []) if t in CANONICAL_TAGS]
    detected_author = str(data.get("detectedAuthor", "")).strip()[:160]

    return ParsedRecipeDraftOut(
        title=str(data.get("title", "Imported Recipe")).strip()[:160],
        subtitle=str(data.get("subtitle", default_subtitle)).strip()[:300],
        time=parsed_time,
        baseServings=max(1, min(12, int(data.get("baseServings", 2) or 2))),
        tags=tags if tags else ["One Pan"],
        detectedAuthor=detected_author,
        ingredients=ingredients,
        steps=steps,
    )


# ---------------------------------------------------------------------------
# 1. Universal AI Ingredient Swaps (with SQLite Cache)
# ---------------------------------------------------------------------------
async def get_ingredient_swaps(req: AISwapRequest) -> AISwapResponse:
    pref_norm = req.preference.strip().lower()
    raw_key = (
        f"{req.recipeId}|{req.ingredientId}|{req.ingredientName.lower()}|"
        f"{req.ingredientQty}|{req.ingredientUnit.lower()}|{pref_norm}"
    )
    cache_key = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()[:24]

    cached = await database.get_cached_swaps(cache_key)
    if cached:
        logger.info(
            f"[Groq:Swaps] Cache HIT for recipe='{req.recipeTitle}' ingredient='{req.ingredientName}' (pref='{pref_norm}')"
        )
        return AISwapResponse(ingredientId=req.ingredientId, swaps=cached, cached=True)

    system_prompt = (
        "You are a master culinary scientist and practical home-cook assistant for CookFlow. "
        "Your job is to calculate accurate, kitchen-tested ingredient substitutions with exact adjusted quantities and units. "
        "Users may write preferences or ingredient names with typos, phonetic spelling, or shorthand—interpret them generously without commenting on spelling. "
        "Always return valid JSON matching this exact schema:\n"
        "{\n"
        '  "swaps": [\n'
        "    {\n"
        '      "label": "Short display title (e.g. Garlic powder (pantry swap))",\n'
        '      "qty": 0.75,\n'
        '      "unit": "tsp",\n'
        '      "name": "garlic powder",\n'
        '      "note": "Brief 6-10 word ratio/cooking adjustment tip"\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Rules:\n"
        "- Provide exactly 3 practical substitutes ordered from best overall match to creative/dietary alternative.\n"
        "- Adjust 'qty' and 'unit' accurately for culinary potency, moisture, and density (for example: 3 cloves garlic -> 0.75 tsp garlic powder; 1 tbsp fresh herb -> 1 tsp dried herb).\n"
        "- Keep 'qty' as a positive decimal number (e.g. 0.25, 0.33, 0.5, 0.75, 1, 1.5, 2) scaled to the recipe's baseServings.\n"
        "- Keep 'name' clean and concise so it reads naturally inside recipe step sentences."
    )

    steps_preview = " | ".join(req.stepContext[:4]) if req.stepContext else "Standard home cooking preparation"
    user_prompt = (
        f"Recipe: {req.recipeTitle} (baseServings: {req.baseServings})\n"
        f"Target ingredient to replace: {req.ingredientQty} {req.ingredientUnit} {req.ingredientName}\n"
        f"How it is used in steps: {steps_preview}\n"
        f"User dietary/pantry preference (may contain typos): {req.preference.strip() or 'Any everyday kitchen substitute'}"
    )

    data = await _complete_json(system_prompt, user_prompt, scope="Swaps", temperature=0.2)
    raw_swaps = data.get("swaps", [])
    validated_swaps: List[IngredientSwap] = []
    for item in raw_swaps[:4]:
        try:
            validated_swaps.append(IngredientSwap(**item))
        except Exception as err:
            logger.warning(f"[Groq:Swaps] Skipping invalid swap candidate {item}: {err}")

    if not validated_swaps:
        raise GroqServiceError("Could not generate valid ingredient substitutes. Please try again.")

    await database.save_cached_swaps(
        cache_key=cache_key,
        recipe_id=req.recipeId,
        ingredient_id=req.ingredientId,
        preference=pref_norm,
        swaps=validated_swaps,
    )
    return AISwapResponse(ingredientId=req.ingredientId, swaps=validated_swaps, cached=False)


# ---------------------------------------------------------------------------
# 2. "Cook With What I Have" Pantry Recipe Generator
# ---------------------------------------------------------------------------
async def generate_pantry_recipe(req: PantryRecipeRequest) -> RecipeCreate:
    system_prompt = (
        "You are the head recipe developer for CookFlow, a calm, kitchen-friendly cooking app. "
        "Given a list of ingredients a user has on hand (which may contain typos, abbreviations, or phonetic spelling), "
        "create a delicious, realistic, easy-to-follow recipe that uses their ingredients plus basic pantry staples (salt, pepper, oil, water). "
        "Return ONLY valid JSON matching this exact structure:\n"
        "{\n"
        '  "title": "Appetizing Dish Name",\n'
        '  "subtitle": "One inviting sentence describing the dish.",\n'
        '  "time": "20 min",\n'
        f'  "baseServings": {req.servings},\n'
        '  "tags": ["One Pan", "Under 20 min"],\n'
        '  "ingredients": [\n'
        '    {"id": "chicken", "qty": 1, "unit": "lb", "name": "boneless chicken thighs"}\n'
        "  ],\n"
        '  "steps": [\n'
        "    {\n"
        '      "phase": "Sear",\n'
        '      "text": "Heat {oil} in a skillet and sear {chicken} for 5 minutes until golden.",\n'
        '      "tip": "Optional helpful kitchen tip",\n'
        '      "timer": {"label": "Sear Chicken", "seconds": 300},\n'
        '      "ingredientIds": ["oil", "chicken"]\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Strict Rules:\n"
        "- Every ingredient MUST have a unique lowercase alphanumeric id (no spaces, e.g. 'chicken', 'spinach', 'lemon').\n"
        "- In step 'text', wrap referenced ingredient ids in curly braces like {chicken} so CookFlow highlights and scales them live. Do NOT include raw numbers next to {id} because {id} already renders quantity + unit + name.\n"
        "- Only use {id} tokens that exist in the 'ingredients' array.\n"
        f"- Choose 1 to 3 tags from: {', '.join(CANONICAL_TAGS)}.\n"
        "- Include realistic timers (in seconds) on steps that require waiting/simmering/roasting/searing."
    )

    user_prompt = (
        f"Ingredients on hand (fix any spelling typos silently): {req.pantryInput}\n"
        f"Servings: {req.servings}\n"
        f"Dietary or mood note: {req.dietaryNote.strip() or 'None'}"
    )

    data = await _complete_json(system_prompt, user_prompt, scope="PantryRecipe", temperature=0.35)

    raw_ingredients = data.get("ingredients", [])
    ingredients: List[Ingredient] = []
    seen_ids = set()
    for idx, item in enumerate(raw_ingredients):
        clean_id = re.sub(r"[^a-zA-Z0-9_-]", "", str(item.get("id", f"ing{idx}"))).lower() or f"ing{idx}"
        if clean_id in seen_ids:
            clean_id = f"{clean_id}{idx}"
        seen_ids.add(clean_id)
        ingredients.append(
            Ingredient(
                id=clean_id,
                qty=max(0.1, float(item.get("qty", 1))),
                unit=str(item.get("unit", "whole")).strip() or "whole",
                name=str(item.get("name", "ingredient")).strip(),
            )
        )

    if not ingredients:
        raise GroqServiceError("AI could not extract ingredients for the generated recipe.")

    valid_id_set = {ing.id for ing in ingredients}

    def sanitize_step_text(text: str) -> str:
        def repl(match: re.Match[str]) -> str:
            token = match.group(1)
            return f"{{{token}}}" if token in valid_id_set else token

        return re.sub(r"\{([a-zA-Z0-9_-]+)\}", repl, text)

    steps: List[RecipeStep] = []
    for idx, s in enumerate(data.get("steps", [])):
        raw_timer = s.get("timer")
        timer_cfg = None
        if isinstance(raw_timer, dict) and int(raw_timer.get("seconds", 0)) > 0:
            timer_cfg = StepTimerConfig(
                label=str(raw_timer.get("label", f"Step {idx + 1}"))[:32],
                seconds=int(raw_timer["seconds"]),
            )
        ing_ids = [i for i in s.get("ingredientIds", []) if i in valid_id_set]
        steps.append(
            RecipeStep(
                phase=str(s.get("phase", f"Step {idx + 1}")),
                text=sanitize_step_text(str(s.get("text", "")).strip()),
                tip=str(s["tip"]).strip() if s.get("tip") else None,
                timer=timer_cfg,
                ingredientIds=ing_ids,
            )
        )

    if not steps:
        raise GroqServiceError("AI generated a recipe without cooking steps. Please retry.")

    title = str(data.get("title", "Pantry Skillet Special")).strip()[:160]
    palette = ["C85A32", "2E5A44", "B85D19", "3B6E52"]
    color = palette[len(title) % len(palette)]
    raw_tags = [t for t in data.get("tags", []) if t in CANONICAL_TAGS]

    return RecipeCreate(
        title=title,
        subtitle=str(data.get("subtitle", "Custom pantry recipe generated by CookFlow AI.")).strip(),
        time=str(data.get("time", "20 min")).strip(),
        baseServings=req.servings,
        tags=raw_tags if raw_tags else ["Pantry Staples"],
        image=f"https://placehold.co/900x500/{color}/FAF8F5?text={title.replace(' ', '+')}",
        fallbackColor=color,
        authorCredit="CookFlow Pantry AI",
        ingredients=ingredients,
        steps=steps,
    )


# ---------------------------------------------------------------------------
# 3. Smart Recipe Text Importer (Parses messy text / typos into Draft Form)
# ---------------------------------------------------------------------------
async def parse_raw_recipe_text(req: RecipeImportRequest) -> ParsedRecipeDraftOut:
    system_prompt = (
        "You are a culinary data parser for CookFlow. Convert raw, messy, pasted recipe text (which may include typos, "
        "blog chatter, abbreviations, or unicode/slash fractions) into a clean, structured CookFlow recipe draft. "
        "Fix obvious spelling typos in ingredient names and instructions while preserving the author's dish accurately.\n"
        "Return ONLY valid JSON matching this schema:\n"
        "{\n"
        '  "title": "Clean Dish Title",\n'
        '  "subtitle": "Short 1-sentence appetizing summary",\n'
        '  "time": "20 min",\n'
        '  "baseServings": 2,\n'
        '  "tags": ["One Pan"],\n'
        '  "detectedAuthor": "Author, cookbook, or blog name if mentioned, otherwise empty string",\n'
        '  "ingredients": [\n'
        '    {"qty": "1 ½", "unit": "tbsp", "name": "olive oil"}\n'
        "  ],\n"
        '  "steps": [\n'
        '    {"text": "Clear single-action cooking step.", "hasTimer": true, "timerMins": 8}\n'
        "  ]\n"
        "}\n"
        "Rules:\n"
        "- 'time' must be one of: '10 min', '15 min', '20 min', '30 min', '45 min'.\n"
        "- 'unit' should be one of: 'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'cloves', 'can', 'whole', 'pinch'. Convert other units cleanly.\n"
        f"- 'tags' must only contain values from: {', '.join(CANONICAL_TAGS)}.\n"
        "- Detect any cooking durations mentioned in a step (e.g. 'simmer for 10 minutes') and set hasTimer=true and timerMins=10."
    )

    data = await _complete_json(system_prompt, req.rawText, scope="ImportRecipe", temperature=0.15)
    return _normalize_parsed_draft(data, default_subtitle="Imported into CookFlow.")


# ---------------------------------------------------------------------------
# 3B. Cookbook / Recipe Photo Vision Scanner (Groq Multimodal Vision)
# ---------------------------------------------------------------------------
async def parse_recipe_image(req: RecipeImageImportRequest) -> ParsedRecipeDraftOut:
    data_url = req.imageDataUrl.strip()
    has_image_prefix = data_url.startswith("data:image/")
    has_base64_marker = ";base64," in data_url
    if not (has_image_prefix and has_base64_marker):
        raise GroqServiceError(
            "Invalid image format. Please upload a JPG, PNG, or WebP photo of a recipe.",
            status_code=400,
        )

    system_prompt = (
        "You are an expert OCR and culinary recipe parser for CookFlow. "
        "Carefully read the recipe shown in the photo (from a cookbook page, magazine, recipe card, handwritten note, or screenshot). "
        "Extract the exact dish title, ingredients with measurements, step-by-step instructions, and any visible author, chef, or cookbook title credit. "
        'If the photo does NOT contain a readable recipe or food preparation instructions, return {"notARecipe": true}.\n'
        "Otherwise return ONLY valid JSON matching this exact schema:\n"
        "{\n"
        '  "title": "Exact Dish Title",\n'
        '  "subtitle": "Short 1-sentence appetizing summary",\n'
        '  "time": "20 min",\n'
        '  "baseServings": 2,\n'
        '  "tags": ["One Pan"],\n'
        '  "detectedAuthor": "Author name, cookbook title, or source visible on the page (or empty string if none visible)",\n'
        '  "ingredients": [\n'
        '    {"qty": "1 ½", "unit": "tbsp", "name": "olive oil"}\n'
        "  ],\n"
        '  "steps": [\n'
        '    {"text": "Clear single-action cooking step.", "hasTimer": true, "timerMins": 8}\n'
        "  ]\n"
        "}\n"
        "Rules:\n"
        "- 'time' must be one of: '10 min', '15 min', '20 min', '30 min', '45 min'.\n"
        "- 'unit' must be one of: 'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'cloves', 'can', 'whole', 'pinch'. Convert other units cleanly.\n"
        f"- 'tags' must only contain values from: {', '.join(CANONICAL_TAGS)}.\n"
        "- Detect any cooking durations in a step (e.g., 'bake for 25 minutes') and set hasTimer=true and timerMins=25."
    )

    hint_line = (
        f" Source hint from user: {req.sourceHint.strip()}."
        if req.sourceHint.strip()
        else ""
    )
    user_content = [
        {
            "type": "text",
            "text": f"Extract the full recipe from this image into structured CookFlow JSON.{hint_line}",
        },
        {
            "type": "image_url",
            "image_url": {"url": data_url},
        },
    ]

    data = await _complete_json(
        system_prompt,
        user_content,
        scope="ScanRecipeImage",
        temperature=0.1,
        model_override=settings.groq_vision_model,
    )

    if data.get("notARecipe"):
        raise GroqServiceError(
            "Could not find a readable recipe in that photo. Try a clearer, closer shot of the recipe page.",
            status_code=422,
        )

    return _normalize_parsed_draft(data, default_subtitle="Scanned from recipe photo.")


# ---------------------------------------------------------------------------
# 4. In-Step "Kitchen Rescue" Assistant (Strict Topic Guardrail + Typo Tolerant)
# ---------------------------------------------------------------------------
async def ask_kitchen_rescue(req: KitchenRescueRequest) -> KitchenRescueResponse:
    clean_q = req.question.strip()
    if not clean_q:
        return KitchenRescueResponse(
            onTopic=True,
            answer="Ask me anything about this step—like rescuing a broken sauce, checking doneness, or swapping a pan.",
            quickTip=None,
        )

    system_prompt = (
        "You are CookFlow's focused In-Step Kitchen Rescue Assistant helping someone actively cooking at the stove.\n"
        "STRICT TOPIC GUARDRAIL & TYPO TOLERANCE RULES:\n"
        "1. TYPO TOLERANCE: Users are cooking with messy or wet hands and WILL make heavy typos, phonetic misspellings, or broken grammar "
        "(e.g. 'my crem sause splitd', 'can i use duch ovn', 'how do i no chiken is dun', 'sub for garlc', 'burned pan botom'). "
        "Always decode typos generously and never criticize spelling.\n"
        "2. ON-TOPIC SCOPE: Answer ONLY questions related to cooking, this recipe, ingredients, substitutions, doneness/food safety, kitchen equipment, measurements, or flavor/texture fixes.\n"
        "3. OFF-TOPIC FILTER: If the user's message is clearly NOT about cooking, food, recipes, or kitchen tasks (for example: coding, politics, sports, math homework, finance, relationships, or general trivia), "
        "set 'onTopic' to false and set 'answer' to a warm, polite 1-sentence refusal steering them back to their current cooking step.\n"
        "4. RESPONSE STYLE: When onTopic=true, give an immediate, calm, practical answer in 2-3 short sentences tailored to their exact active recipe and step.\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        '  "onTopic": true,\n'
        '  "answer": "Clear, actionable kitchen answer here.",\n'
        '  "quickTip": "Optional 1-line pro tip or null"\n'
        "}"
    )

    ing_list = ", ".join(req.activeIngredients) if req.activeIngredients else "Standard recipe ingredients"
    user_prompt = (
        f"Active Recipe: {req.recipeTitle}\n"
        f"Current Step ({req.currentStepNumber} of {req.totalSteps}): {req.currentStepText}\n"
        f"Active Ingredients (including any swaps): {ing_list}\n"
        f"Cook's Question (may contain typos): {clean_q}"
    )

    data = await _complete_json(system_prompt, user_prompt, scope="KitchenRescue", temperature=0.2)
    on_topic = bool(data.get("onTopic", True))
    answer = str(data.get("answer", "")).strip()
    quick_tip = str(data["quickTip"]).strip() if data.get("quickTip") else None

    if not on_topic:
        logger.info(f"[Groq:KitchenRescue] Filtered off-topic prompt: '{clean_q[:80]}'")
        if not answer:
            answer = (
                f"I'm your CookFlow kitchen assistant, so I can only help with cooking and {req.recipeTitle}. "
                "Need help with your current step or an ingredient?"
            )
        quick_tip = None

    return KitchenRescueResponse(onTopic=on_topic, answer=answer, quickTip=quick_tip)


# ---------------------------------------------------------------------------
# 5. Auto-Tagging for Custom Recipes (Typo Tolerant)
# ---------------------------------------------------------------------------
async def suggest_recipe_tags(req: AutoTagRequest) -> AutoTagResponse:
    system_prompt = (
        "You categorize recipes for CookFlow's filter bar. Interpret any typos in ingredient or step names generously. "
        f"Select 1 to 3 matching tags strictly from this allowed list: {', '.join(CANONICAL_TAGS)}.\n"
        'Return ONLY valid JSON: {"tags": ["One Pan", "Under 20 min"]}'
    )

    user_prompt = (
        f"Title: {req.title}\n"
        f"Total Time: {req.time}\n"
        f"Ingredients: {', '.join(req.ingredients)}\n"
        f"Steps: {' '.join(req.steps[:5])}"
    )

    try:
        data = await _complete_json(system_prompt, user_prompt, scope="AutoTag", temperature=0.1)
        tags = [t for t in data.get("tags", []) if t in CANONICAL_TAGS]
        return AutoTagResponse(tags=tags if tags else ["One Pan"])
    except GroqServiceError as err:
        logger.warning(f"[Groq:AutoTag] Falling back to default tag due to error: {err.message}")
        return AutoTagResponse(
            tags=["Under 20 min"] if "10" in req.time or "15" in req.time or "20" in req.time else ["One Pan"]
        )
