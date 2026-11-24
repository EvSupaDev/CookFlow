from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.core.logger import logger
from app.db import database
from app.models.schemas import (
    AISwapRequest,
    AISwapResponse,
    AutoTagRequest,
    AutoTagResponse,
    BootstrapResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    KitchenRescueRequest,
    KitchenRescueResponse,
    PantryRecipeRequest,
    ParsedRecipeDraftOut,
    RecipeCreate,
    RecipeImageImportRequest,
    RecipeImportRequest,
    RecipeOut,
    SaveToggleResponse,
    UserProfileOut,
    UserProfileUpdate,
)
from app.services import groq_service
from app.services.groq_service import GroqServiceError

router = APIRouter(prefix="/api", tags=["cookflow"])


@router.get("/health")
async def health_check() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "cookflow-api",
        "groqConfigured": settings.has_valid_groq_key,
        "groqModel": settings.groq_model,
        "groqVisionModel": settings.groq_vision_model,
    }


@router.get("/bootstrap", response_model=BootstrapResponse)
async def get_bootstrap_state() -> BootstrapResponse:
    recipes = await database.list_recipes()
    saved_ids = await database.list_saved_ids()
    profile = await database.get_profile()
    logger.info(
        f"Bootstrap payload served: {len(recipes)} recipes, {len(saved_ids)} saved, user='{profile.name}'"
    )
    return BootstrapResponse(recipes=recipes, savedIds=saved_ids, profile=profile)


@router.post("/recipes/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate_recipe(payload: DuplicateCheckRequest) -> DuplicateCheckResponse:
    dup_match = await database.find_duplicate_recipe(
        title=payload.title,
        ingredients=[ing.model_dump() for ing in payload.ingredients],
        steps=payload.steps,
    )
    if dup_match is not None:
        existing_recipe, reason = dup_match
        return DuplicateCheckResponse(
            isDuplicate=True,
            reason=reason,
            existingRecipe=existing_recipe,
        )
    return DuplicateCheckResponse(isDuplicate=False)


@router.post("/recipes", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def create_new_recipe(payload: RecipeCreate) -> RecipeOut:
    if payload.requiresAuthorCredit and not payload.authorCredit.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please credit the original author, chef, or cookbook before saving this recipe.",
        )

    dup_match = await database.find_duplicate_recipe(
        title=payload.title,
        ingredients=[ing.model_dump() for ing in payload.ingredients],
        steps=[step.text for step in payload.steps],
    )
    if dup_match is not None:
        existing_recipe, reason = dup_match
        logger.warning(
            f"Blocked duplicate recipe submission '{payload.title}' -> matches id={existing_recipe.id}"
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=reason,
        )

    try:
        if payload.autoTag:
            tag_resp = await groq_service.suggest_recipe_tags(
                AutoTagRequest(
                    title=payload.title,
                    time=payload.time,
                    ingredients=[f"{i.qty} {i.unit} {i.name}" for i in payload.ingredients],
                    steps=[s.text for s in payload.steps],
                )
            )
            merged_tags = list(dict.fromkeys([*payload.tags, *tag_resp.tags]))
            payload = payload.model_copy(update={"tags": merged_tags[:4]})

        return await database.create_recipe(payload)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to persist custom recipe")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/recipes/{recipe_id}/save", response_model=SaveToggleResponse)
async def toggle_recipe_saved(recipe_id: str) -> SaveToggleResponse:
    saved, saved_ids = await database.toggle_saved_recipe(recipe_id)
    return SaveToggleResponse(recipeId=recipe_id, saved=saved, savedIds=saved_ids)


@router.patch("/profile", response_model=UserProfileOut)
async def patch_user_profile(patch: UserProfileUpdate) -> UserProfileOut:
    return await database.update_profile(patch)


@router.post("/profile/meals-cooked", response_model=UserProfileOut)
async def record_meal_cooked() -> UserProfileOut:
    return await database.increment_meals_cooked()


# ---------------------------------------------------------------------------
# Groq AI Endpoints
# ---------------------------------------------------------------------------

@router.post("/ai/swaps", response_model=AISwapResponse)
async def generate_ai_ingredient_swaps(payload: AISwapRequest) -> AISwapResponse:
    try:
        return await groq_service.get_ingredient_swaps(payload)
    except GroqServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/ai/pantry-recipe", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def create_ai_pantry_recipe(payload: PantryRecipeRequest) -> RecipeOut:
    try:
        recipe_draft = await groq_service.generate_pantry_recipe(payload)
        return await database.create_recipe(recipe_draft)
    except GroqServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/ai/import-recipe", response_model=ParsedRecipeDraftOut)
async def import_raw_recipe_with_ai(payload: RecipeImportRequest) -> ParsedRecipeDraftOut:
    try:
        return await groq_service.parse_raw_recipe_text(payload)
    except GroqServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/ai/import-recipe-image", response_model=ParsedRecipeDraftOut)
async def import_recipe_image_with_ai(payload: RecipeImageImportRequest) -> ParsedRecipeDraftOut:
    try:
        return await groq_service.parse_recipe_image(payload)
    except GroqServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/ai/kitchen-rescue", response_model=KitchenRescueResponse)
async def ask_ai_kitchen_rescue(payload: KitchenRescueRequest) -> KitchenRescueResponse:
    try:
        return await groq_service.ask_kitchen_rescue(payload)
    except GroqServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/ai/auto-tag", response_model=AutoTagResponse)
async def auto_tag_recipe_with_ai(payload: AutoTagRequest) -> AutoTagResponse:
    return await groq_service.suggest_recipe_tags(payload)

import base64
import os
import httpx
from fastapi import HTTPException
from pydantic import BaseModel


class VoiceTranscribeBody(BaseModel):
    audioBase64: str
    mimeType: str = "audio/webm"


@router.post("/ai/transcribe")
async def transcribe_voice_command(body: VoiceTranscribeBody):
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key or api_key == "gsk_your_key_here":
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured in backend/.env")

    try:
        audio_bytes = base64.b64decode(body.audioBase64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 audio payload") from exc

    clean_mime = body.mimeType.split(";")[0].strip() or "audio/webm"
    ext = "ogg" if "ogg" in clean_mime else "mp4" if "mp4" in clean_mime else "webm"

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            data={
                "model": "whisper-large-v3-turbo",
                "language": "en",
                "response_format": "json",
            },
            files={"file": (f"command.{ext}", audio_bytes, clean_mime)},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Groq Whisper error: {resp.text}")

    data = resp.json()
    return {"transcript": (data.get("text") or "").strip()}