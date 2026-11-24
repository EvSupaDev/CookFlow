## REPOSITORY ARCHITECTURE

Project Structure:
```
└── backend
    └── app
        ├── __init__.py
        ├── api
        │   ├── __init__.py
        │   └── routes.py
        ├── core
        │   ├── __init__.py
        │   └── logger.py
        ├── db
        │   ├── __init__.py
        │   └── database.py
        ├── main.py
        └── models
            ├── __init__.py
            └── schemas.py
```

---
## CODE FILES

<file path="backend/app/main.py">
```python
import time
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as cookflow_router
from app.core.logger import logger
from app.db.database import init_db

@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger.info("Starting CookFlow FastAPI backend...")
    await init_db()
    yield
    logger.info("Shutting down CookFlow FastAPI backend.")

def create_app() -> FastAPI:
    app = FastAPI(
        title="CookFlow API",
        version="1.0.0",
        description="High-performance async backend for CookFlow kitchen-friendly recipes.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.2f}ms)"
        )
        return response

    app.include_router(cookflow_router)
    return app

app = create_app()
```
</file>

<file path="backend/app/__init__.py">
```python
"""CookFlow FastAPI backend package."""
```
</file>

<file path="backend/app/api/routes.py">
```python
from fastapi import APIRouter, HTTPException, status

from app.core.logger import logger
from app.db import database
from app.models.schemas import (
    BootstrapResponse,
    RecipeCreate,
    RecipeOut,
    SaveToggleResponse,
    UserProfileOut,
    UserProfileUpdate,
)

router = APIRouter(prefix="/api", tags=["cookflow"])

@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "cookflow-api"}

@router.get("/bootstrap", response_model=BootstrapResponse)
async def get_bootstrap_state() -> BootstrapResponse:
    recipes = await database.list_recipes()
    saved_ids = await database.list_saved_ids()
    profile = await database.get_profile()
    logger.info(
        f"Bootstrap payload served: {len(recipes)} recipes, {len(saved_ids)} saved, user='{profile.name}'"
    )
    return BootstrapResponse(recipes=recipes, savedIds=saved_ids, profile=profile)

@router.post("/recipes", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def create_new_recipe(payload: RecipeCreate) -> RecipeOut:
    try:
        return await database.create_recipe(payload)
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
```
</file>

<file path="backend/app/api/__init__.py">
```python
"""FastAPI HTTP routes."""
```
</file>

<file path="backend/app/core/logger.py">
```python
import logging
import sys

def configure_logger(name: str = "cookflow") -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False
    return logger

logger = configure_logger("cookflow.api")
```
</file>

<file path="backend/app/core/__init__.py">
```python
"""Core utilities and logging configuration."""
```
</file>

<file path="backend/app/db/database.py">
```python
import json
import time
from pathlib import Path
from typing import Any, Dict, List

import aiosqlite

from app.core.logger import logger
from app.models.schemas import RecipeCreate, RecipeOut, UserProfileOut, UserProfileUpdate

DB_PATH = Path(__file__).resolve().parents[2] / "cookflow.db"

INITIAL_RECIPES: List[Dict[str, Any]] = [
    {
        "id": "tuscan-salmon",
        "title": "15-Minute Garlic Butter Tuscan Salmon",
        "subtitle": "Crispy pan-seared salmon in a rich sun-dried tomato, spinach, and garlic cream sauce.",
        "time": "15 min",
        "baseServings": 2,
        "tags": ["Under 20 min", "High Protein", "One Pan"],
        "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
        "fallbackColor": "C85A32",
        "ingredients": [
            {
                "id": "protein",
                "qty": 2,
                "unit": "fillets",
                "name": "salmon (skin-on or skinless)",
                "swaps": [
                    {"label": "Salmon fillets (original)", "qty": 2, "unit": "fillets", "name": "salmon"},
                    {"label": "Boneless chicken breasts (halved)", "qty": 2, "unit": "cutlets", "name": "thin chicken cutlets"},
                    {"label": "Extra-firm tofu slabs", "qty": 8, "unit": "oz", "name": "pressed tofu slabs"},
                ],
            },
            {
                "id": "fat",
                "qty": 1.5,
                "unit": "tbsp",
                "name": "unsalted butter",
                "swaps": [
                    {"label": "Unsalted butter (original)", "qty": 1.5, "unit": "tbsp", "name": "unsalted butter"},
                    {"label": "Extra-virgin olive oil", "qty": 1.5, "unit": "tbsp", "name": "olive oil"},
                ],
            },
            {"id": "garlic", "qty": 3, "unit": "cloves", "name": "garlic, minced"},
            {"id": "tomatoes", "qty": 0.33, "unit": "cup", "name": "sun-dried tomatoes, chopped"},
            {
                "id": "cream",
                "qty": 0.5,
                "unit": "cup",
                "name": "heavy cream",
                "swaps": [
                    {"label": "Heavy cream (original)", "qty": 0.5, "unit": "cup", "name": "heavy cream"},
                    {"label": "Full-fat coconut milk (dairy-free)", "qty": 0.5, "unit": "cup", "name": "coconut milk"},
                    {"label": "Half-and-half + 1 tsp flour", "qty": 0.5, "unit": "cup", "name": "half-and-half"},
                ],
            },
            {
                "id": "greens",
                "qty": 2,
                "unit": "cups",
                "name": "fresh baby spinach",
                "swaps": [
                    {"label": "Fresh baby spinach (original)", "qty": 2, "unit": "cups", "name": "baby spinach"},
                    {"label": "Chopped lacinato kale", "qty": 2, "unit": "cups", "name": "chopped kale"},
                ],
            },
            {"id": "parm", "qty": 0.25, "unit": "cup", "name": "grated Parmesan cheese"},
        ],
        "steps": [
            {
                "phase": "Sear",
                "text": "Pat {protein} dry with a paper towel and season with salt and pepper. Melt {fat} in a large skillet over medium-high heat and sear for 4 minutes per side until golden, then transfer to a plate.",
                "tip": "Avoid moving the fish for the first 3 minutes so it releases cleanly from the pan.",
                "timer": {"label": "Sear First Side", "seconds": 240},
                "ingredientIds": ["protein", "fat"],
            },
            {
                "phase": "Aromatics",
                "text": "Lower heat to medium. Add {garlic} and {tomatoes} to the same skillet and stir for 1 minute until fragrant.",
                "tip": "Keep the garlic moving so it turns golden and sweet, not bitter.",
                "timer": {"label": "Sauté Garlic", "seconds": 60},
                "ingredientIds": ["garlic", "tomatoes"],
            },
            {
                "phase": "Simmer Sauce",
                "text": "Pour in {cream} and bring to a gentle bubble. Fold in {greens} and {parm}, stirring for 2 minutes until wilted and glossy.",
                "timer": {"label": "Simmer Sauce", "seconds": 120},
                "ingredientIds": ["cream", "greens", "parm"],
            },
            {
                "phase": "Finish",
                "text": "Nestle {protein} back into the warm skillet, spoon the creamy sauce over top, and warm through for 1 minute before serving.",
                "ingredientIds": ["protein"],
            },
        ],
    },
    {
        "id": "creamy-tomato-pasta",
        "title": "One-Pot Creamy Tomato & Basil Pasta",
        "subtitle": "Everything simmers together in one pot so the starch creates a velvety, restaurant-style sauce.",
        "time": "20 min",
        "baseServings": 2,
        "tags": ["One Pan", "Vegetarian", "Pantry Staples"],
        "image": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
        "fallbackColor": "A94623",
        "ingredients": [
            {
                "id": "pasta",
                "qty": 8,
                "unit": "oz",
                "name": "penne or rigatoni pasta",
                "swaps": [
                    {"label": "Penne or rigatoni (original)", "qty": 8, "unit": "oz", "name": "penne pasta"},
                    {"label": "Chickpea pasta (high-protein)", "qty": 8, "unit": "oz", "name": "chickpea pasta"},
                    {"label": "Gluten-free fusilli", "qty": 8, "unit": "oz", "name": "gluten-free fusilli"},
                ],
            },
            {"id": "tomatoes", "qty": 14, "unit": "oz", "name": "crushed tomatoes (1 can)"},
            {"id": "broth", "qty": 2, "unit": "cups", "name": "vegetable broth"},
            {"id": "garlic", "qty": 3, "unit": "cloves", "name": "garlic, thinly sliced"},
            {"id": "oil", "qty": 1, "unit": "tbsp", "name": "olive oil"},
            {
                "id": "herb",
                "qty": 0.5,
                "unit": "cup",
                "name": "fresh basil leaves, torn",
                "swaps": [
                    {"label": "Fresh basil leaves (original)", "qty": 0.5, "unit": "cup", "name": "fresh basil leaves"},
                    {"label": "Dried Italian seasoning", "qty": 1.5, "unit": "tsp", "name": "dried Italian seasoning"},
                ],
            },
            {
                "id": "cheese",
                "qty": 0.33,
                "unit": "cup",
                "name": "grated Parmesan",
                "swaps": [
                    {"label": "Grated Parmesan (original)", "qty": 0.33, "unit": "cup", "name": "grated Parmesan"},
                    {"label": "Nutritional yeast (vegan)", "qty": 3, "unit": "tbsp", "name": "nutritional yeast"},
                ],
            },
        ],
        "steps": [
            {
                "phase": "Combine",
                "text": "Add {pasta}, {tomatoes}, {broth}, {garlic}, {oil}, and a big pinch of salt to a wide pot or deep skillet.",
                "tip": "Make sure the pasta is mostly submerged in the liquid before turning on the heat.",
                "ingredientIds": ["pasta", "tomatoes", "broth", "garlic", "oil"],
            },
            {
                "phase": "Boil & Simmer",
                "text": "Bring to a lively boil over high heat, then reduce to medium-low and simmer uncovered for 11 minutes, stirring every few minutes so nothing sticks.",
                "timer": {"label": "Simmer Pasta", "seconds": 660},
                "ingredientIds": ["pasta"],
            },
            {
                "phase": "Finish",
                "text": "Remove from heat while a splash of saucy liquid remains. Stir in {cheese} and {herb} until creamy and glossy.",
                "tip": "The sauce thickens rapidly as it cools for 1 minute—add a splash of warm water if needed.",
                "ingredientIds": ["cheese", "herb"],
            },
        ],
    },
    {
        "id": "honey-ginger-chicken",
        "title": "Crispy Honey-Ginger Chicken & Broccoli",
        "subtitle": "Sweet, savory, and sticky weeknight stir-fry that beats takeout in 18 minutes flat.",
        "time": "18 min",
        "baseServings": 2,
        "tags": ["Under 20 min", "High Protein"],
        "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
        "fallbackColor": "2E5A44",
        "ingredients": [
            {
                "id": "protein",
                "qty": 12,
                "unit": "oz",
                "name": "boneless chicken thighs, bite-sized",
                "swaps": [
                    {"label": "Chicken thighs (original)", "qty": 12, "unit": "oz", "name": "chicken thigh pieces"},
                    {"label": "Extra-firm tofu, cubed", "qty": 14, "unit": "oz", "name": "cubed tofu"},
                ],
            },
            {"id": "broccoli", "qty": 3, "unit": "cups", "name": "broccoli florets"},
            {
                "id": "soy",
                "qty": 2.5,
                "unit": "tbsp",
                "name": "low-sodium soy sauce",
                "swaps": [
                    {"label": "Low-sodium soy sauce (original)", "qty": 2.5, "unit": "tbsp", "name": "soy sauce"},
                    {"label": "Tamari (gluten-free)", "qty": 2.5, "unit": "tbsp", "name": "tamari"},
                ],
            },
            {
                "id": "sweetener",
                "qty": 2,
                "unit": "tbsp",
                "name": "honey",
                "swaps": [
                    {"label": "Honey (original)", "qty": 2, "unit": "tbsp", "name": "honey"},
                    {"label": "Pure maple syrup", "qty": 2, "unit": "tbsp", "name": "maple syrup"},
                ],
            },
            {"id": "ginger", "qty": 1, "unit": "tbsp", "name": "fresh ginger, grated"},
            {"id": "oil", "qty": 1, "unit": "tbsp", "name": "neutral cooking oil"},
        ],
        "steps": [
            {
                "phase": "Whisk Glaze",
                "text": "In a small bowl, stir together {soy}, {sweetener}, {ginger}, and 2 tablespoons of water so your glaze is ready to pour.",
                "ingredientIds": ["soy", "sweetener", "ginger"],
            },
            {
                "phase": "Brown Protein",
                "text": "Heat {oil} in a large skillet over high heat. Add {protein} in a single layer and cook for 5 minutes, turning once, until deeply browned.",
                "timer": {"label": "Brown Chicken", "seconds": 300},
                "ingredientIds": ["oil", "protein"],
            },
            {
                "phase": "Steam Broccoli",
                "text": "Toss {broccoli} into the skillet with 2 tablespoons of water. Cover with a lid for 3 minutes until bright green and tender-crisp.",
                "timer": {"label": "Steam Broccoli", "seconds": 180},
                "ingredientIds": ["broccoli"],
            },
            {
                "phase": "Glaze",
                "text": "Uncover, pour in your {soy} and {sweetener} mixture, and toss for 1 minute until sticky and shiny.",
                "timer": {"label": "Thicken Glaze", "seconds": 60},
                "ingredientIds": ["soy", "sweetener"],
            },
        ],
    },
    {
        "id": "sweet-potato-tacos",
        "title": "Roasted Sweet Potato & Black Bean Tacos",
        "subtitle": "Caramelized cumin-spiced sweet potatoes with smoky black beans and bright lime.",
        "time": "25 min",
        "baseServings": 2,
        "tags": ["Vegetarian", "One Pan"],
        "image": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=900&q=80",
        "fallbackColor": "B85D19",
        "ingredients": [
            {
                "id": "veg",
                "qty": 2,
                "unit": "cups",
                "name": "sweet potato, diced small",
                "swaps": [
                    {"label": "Diced sweet potato (original)", "qty": 2, "unit": "cups", "name": "diced sweet potato"},
                    {"label": "Diced butternut squash", "qty": 2, "unit": "cups", "name": "diced butternut squash"},
                ],
            },
            {"id": "beans", "qty": 1, "unit": "can", "name": "black beans, drained & rinsed"},
            {"id": "cumin", "qty": 1.5, "unit": "tsp", "name": "ground cumin & chili powder"},
            {"id": "oil", "qty": 1.5, "unit": "tbsp", "name": "olive oil"},
            {
                "id": "shell",
                "qty": 6,
                "unit": "small",
                "name": "warm corn tortillas",
                "swaps": [
                    {"label": "Warm corn tortillas (original)", "qty": 6, "unit": "small", "name": "corn tortillas"},
                    {"label": "Crisp butter lettuce cups", "qty": 6, "unit": "leaves", "name": "butter lettuce cups"},
                ],
            },
            {"id": "topping", "qty": 0.5, "unit": "whole", "name": "ripe avocado, sliced"},
        ],
        "steps": [
            {
                "phase": "Roast",
                "text": "Heat oven to 425°F (220°C). Toss {veg} on a sheet pan with {oil}, {cumin}, and salt. Roast for 15 minutes until tender and caramelized at the edges.",
                "tip": "Cutting the cubes to ½-inch helps them roast evenly in 15 minutes.",
                "timer": {"label": "Roast Potatoes", "seconds": 900},
                "ingredientIds": ["veg", "oil", "cumin"],
            },
            {
                "phase": "Warm Beans",
                "text": "Scatter {beans} onto the same sheet pan for the last 3 minutes of roasting so they warm through and absorb the spices.",
                "timer": {"label": "Warm Beans", "seconds": 180},
                "ingredientIds": ["beans"],
            },
            {
                "phase": "Assemble",
                "text": "Fill {shell} with the roasted {veg} and {beans}, then top with {topping} and a squeeze of fresh lime.",
                "ingredientIds": ["shell", "veg", "beans", "topping"],
            },
        ],
    },
    {
        "id": "lemon-chickpea-bowl",
        "title": "Lemony Herb Couscous & Chickpea Bowl",
        "subtitle": "Bright, no-fuss Mediterranean pantry bowl ready in 12 minutes with zero chopping stress.",
        "time": "12 min",
        "baseServings": 2,
        "tags": ["Under 20 min", "Pantry Staples", "Vegetarian"],
        "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
        "fallbackColor": "3B6E52",
        "ingredients": [
            {
                "id": "grain",
                "qty": 1,
                "unit": "cup",
                "name": "pearl couscous",
                "swaps": [
                    {"label": "Pearl couscous (original)", "qty": 1, "unit": "cup", "name": "pearl couscous"},
                    {"label": "Quick-cooking quinoa (GF)", "qty": 1, "unit": "cup", "name": "quinoa"},
                ],
            },
            {"id": "chickpeas", "qty": 1, "unit": "can", "name": "chickpeas, rinsed & drained"},
            {"id": "lemon", "qty": 1, "unit": "whole", "name": "lemon (zest & juice)"},
            {"id": "oil", "qty": 2, "unit": "tbsp", "name": "extra-virgin olive oil"},
            {
                "id": "feta",
                "qty": 0.33,
                "unit": "cup",
                "name": "crumbled feta cheese",
                "swaps": [
                    {"label": "Crumbled feta cheese (original)", "qty": 0.33, "unit": "cup", "name": "crumbled feta"},
                    {"label": "Toasted sliced almonds (dairy-free)", "qty": 0.33, "unit": "cup", "name": "toasted almonds"},
                ],
            },
            {"id": "cucumber", "qty": 1, "unit": "cup", "name": "diced cucumber"},
        ],
        "steps": [
            {
                "phase": "Simmer Grain",
                "text": "Bring 1¼ cups salted water to a boil in a small saucepan. Stir in {grain}, cover, and simmer gently for 8 minutes until tender.",
                "timer": {"label": "Simmer Grain", "seconds": 480},
                "ingredientIds": ["grain"],
            },
            {
                "phase": "Toss Dressing",
                "text": "Fluff the warm {grain} with a fork, then toss directly in the pot with {chickpeas}, {oil}, and the zest and juice of {lemon}.",
                "ingredientIds": ["grain", "chickpeas", "oil", "lemon"],
            },
            {
                "phase": "Top & Serve",
                "text": "Divide into bowls and finish with cool {cucumber} and {feta}.",
                "ingredientIds": ["cucumber", "feta"],
            },
        ],
    },
]

async def init_db() -> None:
    t0 = time.perf_counter()
    logger.info(f"Initializing SQLite database at {DB_PATH}")
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL;")
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS recipes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT NOT NULL,
                time TEXT NOT NULL,
                base_servings INTEGER NOT NULL,
                tags_json TEXT NOT NULL,
                image TEXT NOT NULL,
                fallback_color TEXT NOT NULL,
                ingredients_json TEXT NOT NULL,
                steps_json TEXT NOT NULL,
                created_at REAL NOT NULL
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS saved_recipes (
                recipe_id TEXT PRIMARY KEY,
                saved_at REAL NOT NULL
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS user_profile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                name TEXT NOT NULL,
                default_servings INTEGER NOT NULL,
                auto_wake_lock INTEGER NOT NULL,
                meals_cooked INTEGER NOT NULL
            )
            """
        )
        await db.execute(
            """
            INSERT OR IGNORE INTO user_profile (id, name, default_servings, auto_wake_lock, meals_cooked)
            VALUES (1, 'Home Cook', 2, 0, 0)
            """
        )

        cursor = await db.execute("SELECT COUNT(*) FROM recipes")
        row = await cursor.fetchone()
        count = row[0] if row else 0

        if count == 0:
            logger.info(f"Seeding {len(INITIAL_RECIPES)} curated everyday recipes")
            now = time.time()
            for idx, r in enumerate(INITIAL_RECIPES):
                await db.execute(
                    """
                    INSERT INTO recipes (
                        id, title, subtitle, time, base_servings, tags_json,
                        image, fallback_color, ingredients_json, steps_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        r["id"],
                        r["title"],
                        r["subtitle"],
                        r["time"],
                        r["baseServings"],
                        json.dumps(r["tags"]),
                        r["image"],
                        r["fallbackColor"],
                        json.dumps(r["ingredients"]),
                        json.dumps(r["steps"]),
                        now - idx,
                    ),
                )
        await db.commit()

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(f"Database ready in {elapsed_ms:.2f}ms")

def _row_to_recipe(row: aiosqlite.Row) -> RecipeOut:
    return RecipeOut(
        id=row["id"],
        title=row["title"],
        subtitle=row["subtitle"],
        time=row["time"],
        baseServings=row["base_servings"],
        tags=json.loads(row["tags_json"]),
        image=row["image"],
        fallbackColor=row["fallback_color"],
        ingredients=json.loads(row["ingredients_json"]),
        steps=json.loads(row["steps_json"]),
    )

async def list_recipes() -> List[RecipeOut]:
    t0 = time.perf_counter()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM recipes ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        recipes = [_row_to_recipe(r) for r in rows]
    logger.debug(f"Fetched {len(recipes)} recipes in {(time.perf_counter() - t0) * 1000:.2f}ms")
    return recipes

async def create_recipe(payload: RecipeCreate) -> RecipeOut:
    t0 = time.perf_counter()
    recipe_id = payload.id or f"custom-{int(time.time() * 1000)}"
    now = time.time()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO recipes (
                id, title, subtitle, time, base_servings, tags_json,
                image, fallback_color, ingredients_json, steps_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                recipe_id,
                payload.title,
                payload.subtitle,
                payload.time,
                payload.baseServings,
                json.dumps(payload.tags),
                payload.image,
                payload.fallbackColor,
                json.dumps([ing.model_dump() for ing in payload.ingredients]),
                json.dumps([step.model_dump() for step in payload.steps]),
                now,
            ),
        )
        await db.execute(
            "INSERT OR REPLACE INTO saved_recipes (recipe_id, saved_at) VALUES (?, ?)",
            (recipe_id, now),
        )
        await db.commit()

    logger.info(f"Created and saved recipe id={recipe_id} title='{payload.title}' in {(time.perf_counter() - t0) * 1000:.2f}ms")
    return RecipeOut(id=recipe_id, **payload.model_dump(exclude={"id"}))

async def list_saved_ids() -> List[str]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT recipe_id FROM saved_recipes ORDER BY saved_at DESC")
        rows = await cursor.fetchall()
        return [r[0] for r in rows]

async def toggle_saved_recipe(recipe_id: str) -> tuple[bool, List[str]]:
    t0 = time.perf_counter()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT 1 FROM saved_recipes WHERE recipe_id = ?", (recipe_id,))
        exists = await cursor.fetchone()
        if exists:
            await db.execute("DELETE FROM saved_recipes WHERE recipe_id = ?", (recipe_id,))
            saved = False
        else:
            await db.execute(
                "INSERT INTO saved_recipes (recipe_id, saved_at) VALUES (?, ?)",
                (recipe_id, time.time()),
            )
            saved = True
        await db.commit()

    saved_ids = await list_saved_ids()
    logger.info(f"Toggled saved recipe_id={recipe_id} -> saved={saved} in {(time.perf_counter() - t0) * 1000:.2f}ms")
    return saved, saved_ids

async def get_profile() -> UserProfileOut:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM user_profile WHERE id = 1")
        row = await cursor.fetchone()
        if not row:
            return UserProfileOut()
        return UserProfileOut(
            name=row["name"],
            defaultServings=row["default_servings"],
            autoWakeLock=bool(row["auto_wake_lock"]),
            mealsCooked=row["meals_cooked"],
        )

async def update_profile(patch: UserProfileUpdate) -> UserProfileOut:
    t0 = time.perf_counter()
    current = await get_profile()
    next_name = patch.name.strip() if patch.name is not None and patch.name.strip() else current.name
    next_servings = patch.defaultServings if patch.defaultServings is not None else current.defaultServings
    next_wake = patch.autoWakeLock if patch.autoWakeLock is not None else current.autoWakeLock

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            UPDATE user_profile
            SET name = ?, default_servings = ?, auto_wake_lock = ?
            WHERE id = 1
            """,
            (next_name, next_servings, int(next_wake)),
        )
        await db.commit()

    logger.info(f"Updated kitchen profile in {(time.perf_counter() - t0) * 1000:.2f}ms")
    return UserProfileOut(
        name=next_name,
        defaultServings=next_servings,
        autoWakeLock=next_wake,
        mealsCooked=current.mealsCooked,
    )

async def increment_meals_cooked() -> UserProfileOut:
    t0 = time.perf_counter()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE user_profile SET meals_cooked = meals_cooked + 1 WHERE id = 1")
        await db.commit()
    profile = await get_profile()
    logger.info(f"Incremented meals_cooked -> {profile.mealsCooked} in {(time.perf_counter() - t0) * 1000:.2f}ms")
    return profile
```
</file>

<file path="backend/app/db/__init__.py">
```python
"""Async SQLite persistence layer."""
```
</file>

<file path="backend/app/models/schemas.py">
```python
from typing import List, Optional
from pydantic import BaseModel, Field

class IngredientSwap(BaseModel):
    label: str
    qty: float = Field(gt=0)
    unit: str
    name: str

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
    ingredients: List[Ingredient] = Field(min_length=1)
    steps: List[RecipeStep] = Field(min_length=1)

class RecipeCreate(RecipeBase):
    id: Optional[str] = None

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
```
</file>

<file path="backend/app/models/__init__.py">
```python
"""Pydantic data schemas."""
```
</file>

