import hashlib
import json
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

import aiosqlite

from app.core.logger import logger
from app.models.schemas import (
    IngredientSwap,
    RecipeCreate,
    RecipeOut,
    UserProfileOut,
    UserProfileUpdate,
)

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
        "authorCredit": "CookFlow Kitchen",
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
        "authorCredit": "CookFlow Kitchen",
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
        "authorCredit": "CookFlow Kitchen",
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
        "authorCredit": "CookFlow Kitchen",
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
        "authorCredit": "CookFlow Kitchen",
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


def _normalize_text(val: str) -> str:
    cleaned = re.sub(r"\{[a-zA-Z0-9_-]+\}", "", str(val or "").lower())
    cleaned = re.sub(r"[^a-z0-9\s]", " ", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def compute_recipe_fingerprints(
    title: str,
    ingredients: Sequence[Dict[str, Any]],
    steps: Sequence[str],
) -> Tuple[str, str]:
    """Returns (full_content_hash, body_structure_hash) for exact duplicate recipe detection."""
    norm_title = _normalize_text(title)
    ing_tokens = sorted(
        f"{_normalize_text(str(i.get('name', '')))}:{_normalize_text(str(i.get('unit', '')))}:{round(float(i.get('qty', 1)), 2)}"
        for i in ingredients
        if _normalize_text(str(i.get("name", "")))
    )
    step_tokens = [_normalize_text(s) for s in steps if _normalize_text(s)]

    body_sig = f"{'|'.join(ing_tokens)}||{'|'.join(step_tokens)}"
    full_sig = f"{norm_title}||{body_sig}"

    full_hash = hashlib.sha256(full_sig.encode("utf-8")).hexdigest()[:32]
    body_hash = hashlib.sha256(body_sig.encode("utf-8")).hexdigest()[:32]
    return full_hash, body_hash


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
                author_credit TEXT NOT NULL DEFAULT '',
                content_hash TEXT NOT NULL DEFAULT '',
                ingredients_json TEXT NOT NULL,
                steps_json TEXT NOT NULL,
                created_at REAL NOT NULL
            )
            """
        )

        # Safe schema migration for existing cookflow.db databases
        col_cursor = await db.execute("PRAGMA table_info(recipes)")
        existing_cols = {row[1] for row in await col_cursor.fetchall()}
        if "author_credit" not in existing_cols:
            logger.info("Migrating SQLite recipes table: adding 'author_credit' column")
            await db.execute("ALTER TABLE recipes ADD COLUMN author_credit TEXT NOT NULL DEFAULT ''")
        if "content_hash" not in existing_cols:
            logger.info("Migrating SQLite recipes table: adding 'content_hash' column")
            await db.execute("ALTER TABLE recipes ADD COLUMN content_hash TEXT NOT NULL DEFAULT ''")

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
            CREATE TABLE IF NOT EXISTS ai_swap_cache (
                cache_key TEXT PRIMARY KEY,
                recipe_id TEXT NOT NULL,
                ingredient_id TEXT NOT NULL,
                preference TEXT NOT NULL,
                swaps_json TEXT NOT NULL,
                created_at REAL NOT NULL
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
                full_hash, _ = compute_recipe_fingerprints(
                    r["title"],
                    r["ingredients"],
                    [s["text"] for s in r["steps"]],
                )
                await db.execute(
                    """
                    INSERT INTO recipes (
                        id, title, subtitle, time, base_servings, tags_json,
                        image, fallback_color, author_credit, content_hash,
                        ingredients_json, steps_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                        r.get("authorCredit", "CookFlow Kitchen"),
                        full_hash,
                        json.dumps(r["ingredients"]),
                        json.dumps(r["steps"]),
                        now - idx,
                    ),
                )
        else:
            # Backfill content_hash for any pre-migration rows
            db.row_factory = aiosqlite.Row
            unhashed_cur = await db.execute(
                "SELECT id, title, ingredients_json, steps_json FROM recipes WHERE content_hash = ''"
            )
            unhashed_rows = await unhashed_cur.fetchall()
            for urow in unhashed_rows:
                ings = json.loads(urow["ingredients_json"])
                stps = [s.get("text", "") for s in json.loads(urow["steps_json"])]
                full_hash, _ = compute_recipe_fingerprints(urow["title"], ings, stps)
                await db.execute(
                    "UPDATE recipes SET content_hash = ? WHERE id = ?",
                    (full_hash, urow["id"]),
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
        authorCredit=row["author_credit"] if "author_credit" in row.keys() else "",
        ingredients=json.loads(row["ingredients_json"]),
        steps=json.loads(row["steps_json"]),
    )


async def find_duplicate_recipe(
    title: str,
    ingredients: Sequence[Dict[str, Any]],
    steps: Sequence[str],
) -> Optional[Tuple[RecipeOut, str]]:
    """Checks if an identical or near-identical recipe already exists in SQLite."""
    t0 = time.perf_counter()
    candidate_full_hash, candidate_body_hash = compute_recipe_fingerprint_pair(title, ingredients, steps)
    norm_candidate_title = _normalize_text(title)
    cand_ing_names = {
        _normalize_text(str(i.get("name", "")))
        for i in ingredients
        if _normalize_text(str(i.get("name", "")))
    }
    cand_step_blob = " ".join(_normalize_text(s) for s in steps)

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM recipes ORDER BY created_at DESC")
        rows = await cursor.fetchall()

    for row in rows:
        existing_ings = json.loads(row["ingredients_json"])
        existing_steps = [s.get("text", "") for s in json.loads(row["steps_json"])]
        ex_full_hash, ex_body_hash = compute_recipe_fingerprints(
            row["title"], existing_ings, existing_steps
        )

        if candidate_full_hash == ex_full_hash:
            logger.info(
                f"Duplicate recipe MATCH (exact fingerprint) with id={row['id']} in {(time.perf_counter() - t0) * 1000:.2f}ms"
            )
            return _row_to_recipe(row), f"This exact recipe already exists in CookFlow as '{row['title']}'."

        if len(cand_ing_names) >= 2 and candidate_body_hash == ex_body_hash:
            logger.info(
                f"Duplicate recipe MATCH (identical ingredients & steps) with id={row['id']} in {(time.perf_counter() - t0) * 1000:.2f}ms"
            )
            return _row_to_recipe(row), f"A recipe with these exact ingredients and steps is already saved as '{row['title']}'."

        norm_ex_title = _normalize_text(row["title"])
        if norm_candidate_title and norm_candidate_title == norm_ex_title:
            ex_ing_names = {
                _normalize_text(str(i.get("name", "")))
                for i in existing_ings
                if _normalize_text(str(i.get("name", "")))
            }
            if cand_ing_names and ex_ing_names:
                overlap = len(cand_ing_names & ex_ing_names) / max(len(cand_ing_names), len(ex_ing_names))
                if overlap >= 0.8:
                    logger.info(
                        f"Duplicate recipe MATCH (same title + {overlap:.0%} ingredient overlap) with id={row['id']}"
                    )
                    return _row_to_recipe(row), f"'{row['title']}' with the same ingredients has already been added."

        ex_step_blob = " ".join(_normalize_text(s) for s in existing_steps)
        if len(cand_step_blob) > 40 and cand_step_blob == ex_step_blob:
            logger.info(f"Duplicate recipe MATCH (identical step instructions) with id={row['id']}")
            return _row_to_recipe(row), f"These exact cooking instructions are already saved under '{row['title']}'."

    return None


def compute_recipe_fingerprint_pair(
    title: str,
    ingredients: Sequence[Dict[str, Any]],
    steps: Sequence[str],
) -> Tuple[str, str]:
    return compute_recipe_fingerprints(title, ingredients, steps)


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
    ing_dicts = [ing.model_dump() for ing in payload.ingredients]
    step_dicts = [step.model_dump() for step in payload.steps]
    full_hash, _ = compute_recipe_fingerprints(
        payload.title,
        ing_dicts,
        [s["text"] for s in step_dicts],
    )
    clean_credit = payload.authorCredit.strip()

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO recipes (
                id, title, subtitle, time, base_servings, tags_json,
                image, fallback_color, author_credit, content_hash,
                ingredients_json, steps_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                clean_credit,
                full_hash,
                json.dumps(ing_dicts),
                json.dumps(step_dicts),
                now,
            ),
        )
        await db.execute(
            "INSERT OR REPLACE INTO saved_recipes (recipe_id, saved_at) VALUES (?, ?)",
            (recipe_id, now),
        )
        await db.commit()

    logger.info(
        f"Created and saved recipe id={recipe_id} title='{payload.title}' credit='{clean_credit}' in {(time.perf_counter() - t0) * 1000:.2f}ms"
    )
    base_data = payload.model_dump(exclude={"id", "autoTag", "requiresAuthorCredit"})
    base_data["authorCredit"] = clean_credit
    return RecipeOut(id=recipe_id, **base_data)


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


async def get_cached_swaps(cache_key: str) -> Optional[List[IngredientSwap]]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT swaps_json FROM ai_swap_cache WHERE cache_key = ?",
            (cache_key,),
        )
        row = await cursor.fetchone()
        if not row:
            return None
        raw_list = json.loads(row[0])
        return [IngredientSwap(**item) for item in raw_list]


async def save_cached_swaps(
    cache_key: str,
    recipe_id: str,
    ingredient_id: str,
    preference: str,
    swaps: List[IngredientSwap],
) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT OR REPLACE INTO ai_swap_cache (
                cache_key, recipe_id, ingredient_id, preference, swaps_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                cache_key,
                recipe_id,
                ingredient_id,
                preference,
                json.dumps([s.model_dump() for s in swaps]),
                time.time(),
            ),
        )
        await db.commit()
