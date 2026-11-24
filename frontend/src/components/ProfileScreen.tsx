import { FILTER_OPTIONS } from "@/data/seedRecipes";
import { getInitials } from "@/lib/kitchenUtils";
import type { Recipe, UserProfile } from "@/types/recipe";

interface ProfileScreenProps {
  profile: UserProfile;
  recipes: Recipe[];
  savedIds: Set<string>;
  onGoHome: () => void;
  onOpenAddRecipe: () => void;
  onOpenRecipe: (recipeId: string) => void;
  onRemoveSaved: (recipeId: string) => void;
  onBrowseByTag: (tag: string) => void;
  onUpdateProfileName: (name: string) => void;
  onChangeDefaultServings: (delta: number) => void;
  onToggleAutoWakeLock: () => void;
}

export function ProfileScreen({
  profile,
  recipes,
  savedIds,
  onGoHome,
  onOpenAddRecipe,
  onOpenRecipe,
  onRemoveSaved,
  onBrowseByTag,
  onUpdateProfileName,
  onChangeDefaultServings,
  onToggleAutoWakeLock,
}: ProfileScreenProps) {
  const createdCount = recipes.filter((r) => r.id.startsWith("custom-")).length;
  const savedRecipes = recipes.filter((r) => savedIds.has(r.id));

  return (
    <section className="space-y-6">
      {/* Top Back Link */}
      <button
        type="button"
        onClick={onGoHome}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Back to all recipes</span>
      </button>

      {/* Cook Identity & Quick Kitchen Stats */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-terracotta-600 text-white font-serif font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
            {getInitials(profile.name)}
          </div>
          <div className="flex-1 min-w-0">
            <label
              htmlFor="profile-name-input"
              className="block text-[11px] font-bold uppercase tracking-wider text-stone-400"
            >
              Your Kitchen Name
            </label>
            <input
              id="profile-name-input"
              type="text"
              value={profile.name}
              onChange={(e) => onUpdateProfileName(e.target.value)}
              placeholder="Your name or kitchen"
              className="w-full mt-0.5 font-serif text-xl sm:text-2xl font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-200 focus:border-terracotta-600 focus:outline-none py-0.5 transition-colors"
            />
            <p className="text-xs text-stone-500 mt-0.5">Tap your name above to personalize</p>
          </div>
        </div>

        {/* 3-Column Kitchen Activity Summary */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-stone-100">
          <div className="bg-cream/80 rounded-2xl p-3 text-center">
            <p className="font-serif text-xl font-bold text-stone-900">{savedIds.size}</p>
            <p className="text-xs text-stone-500 mt-0.5">Saved</p>
          </div>
          <div className="bg-cream/80 rounded-2xl p-3 text-center">
            <p className="font-serif text-xl font-bold text-stone-900">{createdCount}</p>
            <p className="text-xs text-stone-500 mt-0.5">My Recipes</p>
          </div>
          <div className="bg-cream/80 rounded-2xl p-3 text-center">
            <p className="font-serif text-xl font-bold text-stone-900">{profile.mealsCooked}</p>
            <p className="text-xs text-stone-500 mt-0.5">Cooked</p>
          </div>
        </div>
      </div>

      {/* Kitchen Defaults & Comfort Settings */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-900">Kitchen Preferences</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Set your defaults so every recipe opens ready for your table.
          </p>
        </div>

        <div className="divide-y divide-stone-100">
          {/* Default Household Servings */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-900">Default Household Servings</p>
              <p className="text-xs text-stone-500">Automatically scales ingredients when you open a recipe</p>
            </div>
            <div className="flex items-center gap-2 bg-sand/80 px-2.5 py-1.5 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => onChangeDefaultServings(-1)}
                className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50 active:scale-95 transition"
                aria-label="Decrease default servings"
              >
                &minus;
              </button>
              <span className="w-6 text-center text-sm font-bold text-stone-900">{profile.defaultServings}</span>
              <button
                type="button"
                onClick={() => onChangeDefaultServings(1)}
                className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50 active:scale-95 transition"
                aria-label="Increase default servings"
              >
                +
              </button>
            </div>
          </div>

          {/* Auto Keep Screen Awake */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-900">Keep Screen Awake Automatically</p>
              <p className="text-xs text-stone-500">Prevents screen dimming as soon as you start cooking</p>
            </div>
            <button
              type="button"
              onClick={onToggleAutoWakeLock}
              role="switch"
              aria-checked={profile.autoWakeLock}
              className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 flex items-center ${
                profile.autoWakeLock ? "bg-sage-700" : "bg-stone-200"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  profile.autoWakeLock ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Everyday Food Focus Shortcuts */}
          <div className="pt-3.5 space-y-2.5">
            <div>
              <p className="text-sm font-semibold text-stone-900">My Cooking Style</p>
              <p className="text-xs text-stone-500">Tap a style to browse matching meals anytime</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.filter((f) => f !== "All").map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onBrowseByTag(tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-cream border border-stone-200 text-stone-700 hover:border-terracotta-600 hover:bg-terracotta-50/60 hover:text-terracotta-700 transition-colors"
                >
                  {tag} &rarr;
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Recipes List in Profile */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">Saved Recipes</h2>
            <p className="text-xs text-stone-500 mt-0.5">Meals you’ve bookmarked for later</p>
          </div>
          <button
            type="button"
            onClick={onOpenAddRecipe}
            className="text-xs font-semibold text-terracotta-700 hover:text-terracotta-600"
          >
            + Add New
          </button>
        </div>

        {savedRecipes.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-cream/70 border border-dashed border-stone-200 space-y-2.5">
            <p className="text-sm font-medium text-stone-700">No saved recipes yet</p>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Tap the heart icon on any recipe you want to keep handy for later.
            </p>
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-terracotta-600 text-white hover:bg-terracotta-700 transition-colors"
            >
              Browse Recipes
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {savedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => onOpenRecipe(recipe.id)}
                className="cursor-pointer p-3.5 rounded-2xl border border-stone-200/80 bg-cream/40 hover:bg-sand/50 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-serif font-bold text-sm sm:text-base text-stone-900 truncate">
                    {recipe.title}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {recipe.time} • {recipe.ingredients.length} ingredients
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSaved(recipe.id);
                    }}
                    aria-label={`Unsave ${recipe.title}`}
                    className="p-2 rounded-full text-terracotta-600 hover:bg-terracotta-50 transition-colors"
                    title="Remove from saved"
                  >
                    <svg
                      className="w-4 h-4 fill-terracotta-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </button>
                  <span className="text-xs font-semibold text-terracotta-700">Cook &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
