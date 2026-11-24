import type { Recipe } from "@/types/recipe";

export const FILTER_OPTIONS: readonly string[] = [
  "All",
  "Under 20 min",
  "One Pan",
  "Vegetarian",
  "Pantry Staples",
  "High Protein",
];

export const ADD_TAG_OPTIONS: readonly string[] = [
  "Under 20 min",
  "One Pan",
  "Vegetarian",
  "Pantry Staples",
  "High Protein",
  "Kid-Friendly",
];

export const ADD_TIME_OPTIONS: readonly string[] = ["10 min", "15 min", "20 min", "30 min", "45 min"];

export const ADD_UNIT_OPTIONS: readonly string[] = [
  "cup",
  "cups",
  "tbsp",
  "tsp",
  "oz",
  "lb",
  "cloves",
  "can",
  "whole",
  "pinch",
];

export const QUICK_STAPLES: ReadonlyArray<{ label: string; qty: string; unit: string; name: string }> = [
  { label: "+ Olive oil", qty: "1", unit: "tbsp", name: "olive oil" },
  { label: "+ Garlic", qty: "2", unit: "cloves", name: "garlic, minced" },
  { label: "+ Butter", qty: "1", unit: "tbsp", name: "butter" },
  { label: "+ Lemon", qty: "1", unit: "whole", name: "lemon, juiced" },
  { label: "+ Salt & pepper", qty: "1", unit: "pinch", name: "salt & black pepper" },
];

export const SEED_RECIPES: Recipe[] = [
  {
    id: "tuscan-salmon",
    title: "15-Minute Garlic Butter Tuscan Salmon",
    subtitle: "Crispy pan-seared salmon in a rich sun-dried tomato, spinach, and garlic cream sauce.",
    time: "15 min",
    baseServings: 2,
    tags: ["Under 20 min", "High Protein", "One Pan"],
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
    fallbackColor: "C85A32",
    ingredients: [
      {
        id: "protein",
        qty: 2,
        unit: "fillets",
        name: "salmon (skin-on or skinless)",
        swaps: [
          { label: "Salmon fillets (original)", qty: 2, unit: "fillets", name: "salmon" },
          { label: "Boneless chicken breasts (halved)", qty: 2, unit: "cutlets", name: "thin chicken cutlets" },
          { label: "Extra-firm tofu slabs", qty: 8, unit: "oz", name: "pressed tofu slabs" },
        ],
      },
      {
        id: "fat",
        qty: 1.5,
        unit: "tbsp",
        name: "unsalted butter",
        swaps: [
          { label: "Unsalted butter (original)", qty: 1.5, unit: "tbsp", name: "unsalted butter" },
          { label: "Extra-virgin olive oil", qty: 1.5, unit: "tbsp", name: "olive oil" },
        ],
      },
      { id: "garlic", qty: 3, unit: "cloves", name: "garlic, minced" },
      { id: "tomatoes", qty: 0.33, unit: "cup", name: "sun-dried tomatoes, chopped" },
      {
        id: "cream",
        qty: 0.5,
        unit: "cup",
        name: "heavy cream",
        swaps: [
          { label: "Heavy cream (original)", qty: 0.5, unit: "cup", name: "heavy cream" },
          { label: "Full-fat coconut milk (dairy-free)", qty: 0.5, unit: "cup", name: "coconut milk" },
          { label: "Half-and-half + 1 tsp flour", qty: 0.5, unit: "cup", name: "half-and-half" },
        ],
      },
      {
        id: "greens",
        qty: 2,
        unit: "cups",
        name: "fresh baby spinach",
        swaps: [
          { label: "Fresh baby spinach (original)", qty: 2, unit: "cups", name: "baby spinach" },
          { label: "Chopped lacinato kale", qty: 2, unit: "cups", name: "chopped kale" },
        ],
      },
      { id: "parm", qty: 0.25, unit: "cup", name: "grated Parmesan cheese" },
    ],
    steps: [
      {
        phase: "Sear",
        text: "Pat {protein} dry with a paper towel and season with salt and pepper. Melt {fat} in a large skillet over medium-high heat and sear for 4 minutes per side until golden, then transfer to a plate.",
        tip: "Avoid moving the fish for the first 3 minutes so it releases cleanly from the pan.",
        timer: { label: "Sear First Side", seconds: 240 },
        ingredientIds: ["protein", "fat"],
      },
      {
        phase: "Aromatics",
        text: "Lower heat to medium. Add {garlic} and {tomatoes} to the same skillet and stir for 1 minute until fragrant.",
        tip: "Keep the garlic moving so it turns golden and sweet, not bitter.",
        timer: { label: "Sauté Garlic", seconds: 60 },
        ingredientIds: ["garlic", "tomatoes"],
      },
      {
        phase: "Simmer Sauce",
        text: "Pour in {cream} and bring to a gentle bubble. Fold in {greens} and {parm}, stirring for 2 minutes until wilted and glossy.",
        timer: { label: "Simmer Sauce", seconds: 120 },
        ingredientIds: ["cream", "greens", "parm"],
      },
      {
        phase: "Finish",
        text: "Nestle {protein} back into the warm skillet, spoon the creamy sauce over top, and warm through for 1 minute before serving.",
        ingredientIds: ["protein"],
      },
    ],
  },
  {
    id: "creamy-tomato-pasta",
    title: "One-Pot Creamy Tomato & Basil Pasta",
    subtitle: "Everything simmers together in one pot so the starch creates a velvety, restaurant-style sauce.",
    time: "20 min",
    baseServings: 2,
    tags: ["One Pan", "Vegetarian", "Pantry Staples"],
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
    fallbackColor: "A94623",
    ingredients: [
      {
        id: "pasta",
        qty: 8,
        unit: "oz",
        name: "penne or rigatoni pasta",
        swaps: [
          { label: "Penne or rigatoni (original)", qty: 8, unit: "oz", name: "penne pasta" },
          { label: "Chickpea pasta (high-protein)", qty: 8, unit: "oz", name: "chickpea pasta" },
          { label: "Gluten-free fusilli", qty: 8, unit: "oz", name: "gluten-free fusilli" },
        ],
      },
      { id: "tomatoes", qty: 14, unit: "oz", name: "crushed tomatoes (1 can)" },
      { id: "broth", qty: 2, unit: "cups", name: "vegetable broth" },
      { id: "garlic", qty: 3, unit: "cloves", name: "garlic, thinly sliced" },
      { id: "oil", qty: 1, unit: "tbsp", name: "olive oil" },
      {
        id: "herb",
        qty: 0.5,
        unit: "cup",
        name: "fresh basil leaves, torn",
        swaps: [
          { label: "Fresh basil leaves (original)", qty: 0.5, unit: "cup", name: "fresh basil leaves" },
          { label: "Dried Italian seasoning", qty: 1.5, unit: "tsp", name: "dried Italian seasoning" },
        ],
      },
      {
        id: "cheese",
        qty: 0.33,
        unit: "cup",
        name: "grated Parmesan",
        swaps: [
          { label: "Grated Parmesan (original)", qty: 0.33, unit: "cup", name: "grated Parmesan" },
          { label: "Nutritional yeast (vegan)", qty: 3, unit: "tbsp", name: "nutritional yeast" },
        ],
      },
    ],
    steps: [
      {
        phase: "Combine",
        text: "Add {pasta}, {tomatoes}, {broth}, {garlic}, {oil}, and a big pinch of salt to a wide pot or deep skillet.",
        tip: "Make sure the pasta is mostly submerged in the liquid before turning on the heat.",
        ingredientIds: ["pasta", "tomatoes", "broth", "garlic", "oil"],
      },
      {
        phase: "Boil & Simmer",
        text: "Bring to a lively boil over high heat, then reduce to medium-low and simmer uncovered for 11 minutes, stirring every few minutes so nothing sticks.",
        timer: { label: "Simmer Pasta", seconds: 660 },
        ingredientIds: ["pasta"],
      },
      {
        phase: "Finish",
        text: "Remove from heat while a splash of saucy liquid remains. Stir in {cheese} and {herb} until creamy and glossy.",
        tip: "The sauce thickens rapidly as it cools for 1 minute—add a splash of warm water if needed.",
        ingredientIds: ["cheese", "herb"],
      },
    ],
  },
  {
    id: "honey-ginger-chicken",
    title: "Crispy Honey-Ginger Chicken & Broccoli",
    subtitle: "Sweet, savory, and sticky weeknight stir-fry that beats takeout in 18 minutes flat.",
    time: "18 min",
    baseServings: 2,
    tags: ["Under 20 min", "High Protein"],
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    fallbackColor: "2E5A44",
    ingredients: [
      {
        id: "protein",
        qty: 12,
        unit: "oz",
        name: "boneless chicken thighs, bite-sized",
        swaps: [
          { label: "Chicken thighs (original)", qty: 12, unit: "oz", name: "chicken thigh pieces" },
          { label: "Extra-firm tofu, cubed", qty: 14, unit: "oz", name: "cubed tofu" },
        ],
      },
      { id: "broccoli", qty: 3, unit: "cups", name: "broccoli florets" },
      {
        id: "soy",
        qty: 2.5,
        unit: "tbsp",
        name: "low-sodium soy sauce",
        swaps: [
          { label: "Low-sodium soy sauce (original)", qty: 2.5, unit: "tbsp", name: "soy sauce" },
          { label: "Tamari (gluten-free)", qty: 2.5, unit: "tbsp", name: "tamari" },
        ],
      },
      {
        id: "sweetener",
        qty: 2,
        unit: "tbsp",
        name: "honey",
        swaps: [
          { label: "Honey (original)", qty: 2, unit: "tbsp", name: "honey" },
          { label: "Pure maple syrup", qty: 2, unit: "tbsp", name: "maple syrup" },
        ],
      },
      { id: "ginger", qty: 1, unit: "tbsp", name: "fresh ginger, grated" },
      { id: "oil", qty: 1, unit: "tbsp", name: "neutral cooking oil" },
    ],
    steps: [
      {
        phase: "Whisk Glaze",
        text: "In a small bowl, stir together {soy}, {sweetener}, {ginger}, and 2 tablespoons of water so your glaze is ready to pour.",
        ingredientIds: ["soy", "sweetener", "ginger"],
      },
      {
        phase: "Brown Protein",
        text: "Heat {oil} in a large skillet over high heat. Add {protein} in a single layer and cook for 5 minutes, turning once, until deeply browned.",
        timer: { label: "Brown Chicken", seconds: 300 },
        ingredientIds: ["oil", "protein"],
      },
      {
        phase: "Steam Broccoli",
        text: "Toss {broccoli} into the skillet with 2 tablespoons of water. Cover with a lid for 3 minutes until bright green and tender-crisp.",
        timer: { label: "Steam Broccoli", seconds: 180 },
        ingredientIds: ["broccoli"],
      },
      {
        phase: "Glaze",
        text: "Uncover, pour in your {soy} and {sweetener} mixture, and toss for 1 minute until sticky and shiny.",
        timer: { label: "Thicken Glaze", seconds: 60 },
        ingredientIds: ["soy", "sweetener"],
      },
    ],
  },
  {
    id: "sweet-potato-tacos",
    title: "Roasted Sweet Potato & Black Bean Tacos",
    subtitle: "Caramelized cumin-spiced sweet potatoes with smoky black beans and bright lime.",
    time: "25 min",
    baseServings: 2,
    tags: ["Vegetarian", "One Pan"],
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=900&q=80",
    fallbackColor: "B85D19",
    ingredients: [
      {
        id: "veg",
        qty: 2,
        unit: "cups",
        name: "sweet potato, diced small",
        swaps: [
          { label: "Diced sweet potato (original)", qty: 2, unit: "cups", name: "diced sweet potato" },
          { label: "Diced butternut squash", qty: 2, unit: "cups", name: "diced butternut squash" },
        ],
      },
      { id: "beans", qty: 1, unit: "can", name: "black beans, drained & rinsed" },
      { id: "cumin", qty: 1.5, unit: "tsp", name: "ground cumin & chili powder" },
      { id: "oil", qty: 1.5, unit: "tbsp", name: "olive oil" },
      {
        id: "shell",
        qty: 6,
        unit: "small",
        name: "warm corn tortillas",
        swaps: [
          { label: "Warm corn tortillas (original)", qty: 6, unit: "small", name: "corn tortillas" },
          { label: "Crisp butter lettuce cups", qty: 6, unit: "leaves", name: "butter lettuce cups" },
        ],
      },
      { id: "topping", qty: 0.5, unit: "whole", name: "ripe avocado, sliced" },
    ],
    steps: [
      {
        phase: "Roast",
        text: "Heat oven to 425°F (220°C). Toss {veg} on a sheet pan with {oil}, {cumin}, and salt. Roast for 15 minutes until tender and caramelized at the edges.",
        tip: "Cutting the cubes to ½-inch helps them roast evenly in 15 minutes.",
        timer: { label: "Roast Potatoes", seconds: 900 },
        ingredientIds: ["veg", "oil", "cumin"],
      },
      {
        phase: "Warm Beans",
        text: "Scatter {beans} onto the same sheet pan for the last 3 minutes of roasting so they warm through and absorb the spices.",
        timer: { label: "Warm Beans", seconds: 180 },
        ingredientIds: ["beans"],
      },
      {
        phase: "Assemble",
        text: "Fill {shell} with the roasted {veg} and {beans}, then top with {topping} and a squeeze of fresh lime.",
        ingredientIds: ["shell", "veg", "beans", "topping"],
      },
    ],
  },
  {
    id: "lemon-chickpea-bowl",
    title: "Lemony Herb Couscous & Chickpea Bowl",
    subtitle: "Bright, no-fuss Mediterranean pantry bowl ready in 12 minutes with zero chopping stress.",
    time: "12 min",
    baseServings: 2,
    tags: ["Under 20 min", "Pantry Staples", "Vegetarian"],
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    fallbackColor: "3B6E52",
    ingredients: [
      {
        id: "grain",
        qty: 1,
        unit: "cup",
        name: "pearl couscous",
        swaps: [
          { label: "Pearl couscous (original)", qty: 1, unit: "cup", name: "pearl couscous" },
          { label: "Quick-cooking quinoa (GF)", qty: 1, unit: "cup", name: "quinoa" },
        ],
      },
      { id: "chickpeas", qty: 1, unit: "can", name: "chickpeas, rinsed & drained" },
      { id: "lemon", qty: 1, unit: "whole", name: "lemon (zest & juice)" },
      { id: "oil", qty: 2, unit: "tbsp", name: "extra-virgin olive oil" },
      {
        id: "feta",
        qty: 0.33,
        unit: "cup",
        name: "crumbled feta cheese",
        swaps: [
          { label: "Crumbled feta cheese (original)", qty: 0.33, unit: "cup", name: "crumbled feta" },
          { label: "Toasted sliced almonds (dairy-free)", qty: 0.33, unit: "cup", name: "toasted almonds" },
        ],
      },
      { id: "cucumber", qty: 1, unit: "cup", name: "diced cucumber" },
    ],
    steps: [
      {
        phase: "Simmer Grain",
        text: "Bring 1¼ cups salted water to a boil in a small saucepan. Stir in {grain}, cover, and simmer gently for 8 minutes until tender.",
        timer: { label: "Simmer Grain", seconds: 480 },
        ingredientIds: ["grain"],
      },
      {
        phase: "Toss Dressing",
        text: "Fluff the warm {grain} with a fork, then toss directly in the pot with {chickpeas}, {oil}, and the zest and juice of {lemon}.",
        ingredientIds: ["grain", "chickpeas", "oil", "lemon"],
      },
      {
        phase: "Top & Serve",
        text: "Divide into bowls and finish with cool {cucumber} and {feta}.",
        ingredientIds: ["cucumber", "feta"],
      },
    ],
  },
];
