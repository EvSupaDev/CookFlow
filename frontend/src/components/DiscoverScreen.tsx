import { useEffect, useMemo } from "react";
import { FILTER_OPTIONS } from "@/data/seedRecipes";
import { logger } from "@/lib/logger";
import type { Recipe } from "@/types/recipe";

interface DiscoverScreenProps {
  recipes: Recipe[];
  savedIds: Set<string>;
  searchQuery: string;
  activeFilter: string;
  savedOnly: boolean;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSelectFilter: (filter: string) => void;
  onResetFilters: () => void;
  onToggleFavorite: (recipeId: string) => void;
  onOpenRecipe: (recipeId: string) => void;
  onOpenPantryGenerator: () => void;
}

export function DiscoverScreen({
  recipes,
  savedIds,
  searchQuery,
  activeFilter,
  savedOnly,
  isLoading = false,
  onSearchChange,
  onClearSearch,
  onSelectFilter,
  onResetFilters,
  onToggleFavorite,
  onOpenRecipe,
  onOpenPantryGenerator,
}: DiscoverScreenProps) {
  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (savedOnly && !savedIds.has(recipe.id)) return false;
      if (activeFilter !== "All" && !recipe.tags.includes(activeFilter)) return false;
      if (q) {
        const haystack = [
          recipe.title,
          recipe.subtitle,
          ...recipe.tags,
          ...recipe.ingredients.map((i) => i.name),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [recipes, savedIds, savedOnly, activeFilter, searchQuery]);

  useEffect(() => {
    logger.debug(
      "Discover",
      `Showing ${filteredRecipes.length}/${recipes.length} recipes (filter='${activeFilter}', savedOnly=${savedOnly}, query='${searchQuery}')`
    );
  }, [filteredRecipes.length, recipes.length, activeFilter, savedOnly, searchQuery]);

  return (
    <section className="space-y-5">
      {/* Calm, Friendly Greeting + AI Pantry Generator Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            What sounds good tonight?
          </h1>
          <p className="text-sm text-stone-600">
            Pick a meal, swap any ingredient with AI, and cook effortlessly without losing your place.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenPantryGenerator}
          className="self-start sm:self-auto shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-sage-700 hover:bg-sage-800 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 3v3M12 18v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M3 12h3M18 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
          </svg>
          <span>Cook With What I Have</span>
        </button>
      </div>

      {/* Search + Quick Filter Row */}
      <div className="space-y-3">
        <div className="relative">
          <svg
            className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by dish or ingredient (e.g., salmon, pasta, chickpeas)..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta-600/30 focus:border-terracotta-600 transition-all shadow-xs"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 1-Tap Kitchen Mood / Time Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTER_OPTIONS.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => onSelectFilter(filter)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? "bg-stone-900 text-white shadow-xs"
                    : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipe Feed Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden h-72 animate-pulse"
            >
              <div className="h-44 bg-sand" />
              <div className="p-5 space-y-2.5">
                <div className="h-4 w-2/3 bg-sand rounded-full" />
                <div className="h-3 w-full bg-cream rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {filteredRecipes.map((recipe) => {
            const isSaved = savedIds.has(recipe.id);
            const placeholderUrl = `https://placehold.co/800x500/${recipe.fallbackColor}/FAF8F5?text=${encodeURIComponent(recipe.title)}`;

            return (
              <article
                key={recipe.id}
                onClick={() => onOpenRecipe(recipe.id)}
                className="group cursor-pointer bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-stone-100 overflow-hidden">
                    <img
                      src={recipe.image}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = placeholderUrl;
                      }}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur text-white text-xs font-medium">
                      {recipe.time}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(recipe.id);
                      }}
                      aria-label={`Save ${recipe.title}`}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-xs hover:scale-105 transition-transform"
                    >
                      <svg
                        className={`w-4 h-4 ${
                          isSaved ? "fill-terracotta-600 text-terracotta-600" : "text-stone-500"
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sand text-stone-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="font-serif text-lg font-bold text-stone-900 leading-snug group-hover:text-terracotta-700 transition-colors">
                      {recipe.title}
                    </h2>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{recipe.subtitle}</p>
                  </div>
                </div>

                <div className="px-4 sm:px-5 pb-4 pt-1 flex items-center justify-between text-xs font-semibold text-terracotta-700">
                  <span>
                    {recipe.ingredients.length} ingredients • {recipe.steps.length} steps
                  </span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Cook
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-white rounded-3xl border border-stone-200/80 space-y-3">
          <p className="font-serif text-lg font-semibold text-stone-800">No recipes match that combination</p>
          <p className="text-sm text-stone-500 max-w-xs mx-auto">
            Try clearing your search or let Groq AI invent a meal from what’s in your kitchen.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-terracotta-600 text-white hover:bg-terracotta-700 transition-colors"
            >
              Show all recipes
            </button>
            <button
              type="button"
              onClick={onOpenPantryGenerator}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-sage-700 text-white hover:bg-sage-800 transition-colors"
            >
              Cook With What I Have
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
