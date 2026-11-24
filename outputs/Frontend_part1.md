## REPOSITORY ARCHITECTURE

Project Structure:
```
└── frontend
    ├── .oxlintrc.json
    ├── components.json
    ├── index.html
    ├── package.json
    ├── README.md
    ├── src
    │   ├── App.css
    │   ├── App.tsx
    │   ├── components
    │   │   ├── AddRecipeScreen.tsx
    │   │   ├── CookScreen.tsx
    │   │   ├── DiscoverScreen.tsx
    │   │   ├── IngredientsDrawer.tsx
    │   │   ├── Navbar.tsx
    │   │   ├── PrepScreen.tsx
    │   │   ├── ProfileScreen.tsx
    │   │   ├── SwapModal.tsx
    │   │   └── ToastBanner.tsx
    │   ├── data
    │   │   └── seedRecipes.ts
    │   ├── hooks
    │   │   ├── useKitchenTimers.ts
    │   │   └── useWakeLock.ts
    │   ├── index.css
    │   ├── lib
    │   │   ├── api.ts
    │   │   ├── kitchenUtils.ts
    │   │   ├── logger.ts
    │   │   └── utils.ts
    │   ├── main.tsx
    │   └── types
    │       └── recipe.ts
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```

---
## CODE FILES

<file path="frontend/.oxlintrc.json">
```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```
</file>

<file path="frontend/components.json">
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "taupe",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```
</file>

<file path="frontend/index.html">
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <title>CookFlow — Simple, Kitchen-Friendly Cooking</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body class="bg-cream text-stone-900 font-sans antialiased min-h-screen flex flex-col selection:bg-terracotta-100 selection:text-terracotta-700">
    <div id="root" class="min-h-screen flex flex-col"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
</file>

<file path="frontend/package.json">
```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@base-ui/react": "^1.9.0",
    "@fontsource-variable/inter": "^5.3.0",
    "@fontsource-variable/montserrat": "^5.3.0",
    "@fontsource-variable/oxanium": "^5.3.0",
    "@tailwindcss/vite": "^4.3.5",
    "class-variance-authority": "^0.7.1",
    "cn": "^0.5.2",
    "lucide-react": "^1.79.0",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "shadcn": "^4.23.0",
    "tailwindcss": "^4.3.5",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@types/node": "^24.19.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "oxlint": "^1.90.0",
    "typescript": "~7.0.2",
    "vite": "^8.3.6"
  }
}
```
</file>

<file path="frontend/README.md">
```markdown
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
```
</file>

<file path="frontend/tsconfig.app.json">
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client", "node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    },
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```
</file>

<file path="frontend/tsconfig.json">
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```
</file>

<file path="frontend/tsconfig.node.json">
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```
</file>

<file path="frontend/vite.config.ts">
```typescript
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
```
</file>

<file path="frontend/src/App.css">
```css
.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;

  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.hero {
  position: relative;

  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }

  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }

  .framework,
  .vite {
    position: absolute;
  }

  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }

  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;

  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}

#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;

  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }

  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}

#docs {
  border-right: 1px solid var(--border);

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;

  .logo {
    height: 18px;
  }

  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }

  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;

    li {
      flex: 1 1 calc(50% - 8px);
    }

    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}

#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}

.ticks {
  position: relative;
  width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}
```
</file>

<file path="frontend/src/App.tsx">
```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddRecipeScreen } from "@/components/AddRecipeScreen";
import { CookScreen } from "@/components/CookScreen";
import { DiscoverScreen } from "@/components/DiscoverScreen";
import { IngredientsDrawer } from "@/components/IngredientsDrawer";
import { Navbar } from "@/components/Navbar";
import { PrepScreen } from "@/components/PrepScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { SwapModal } from "@/components/SwapModal";
import { ToastBanner } from "@/components/ToastBanner";
import { SEED_RECIPES } from "@/data/seedRecipes";
import { useKitchenTimers } from "@/hooks/useKitchenTimers";
import { useWakeLock } from "@/hooks/useWakeLock";
import {
  createRecipeApi,
  fetchBootstrap,
  recordMealCookedApi,
  toggleSaveRecipeApi,
  updateProfileApi,
} from "@/lib/api";
import { logger } from "@/lib/logger";
import type { Recipe, ScreenName, UserProfile } from "@/types/recipe";

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [screen, setScreen] = useState<ScreenName>("discover");

  const [recipes, setRecipes] = useState<Recipe[]>(SEED_RECIPES);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<UserProfile>({
    name: "Home Cook",
    defaultServings: 2,
    autoWakeLock: false,
    mealsCooked: 0,
  });

  // Discover filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [savedOnly, setSavedOnly] = useState(false);

  // Active recipe prep & cook session
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(SEED_RECIPES[0].id);
  const [servings, setServings] = useState<number>(2);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [swaps, setSwaps] = useState<Record<string, number>>({});
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepCompleted, setStepCompleted] = useState<boolean>(false);

  // Overlays & toast
  const [swapModalIngId, setSwapModalIngId] = useState<string | null>(null);
  const [ingredientsDrawerOpen, setIngredientsDrawerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const nameSaveTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  const hideToast = useCallback(() => {
    setToastMessage(null);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const { timers, startTimer, togglePauseTimer, removeTimer } = useKitchenTimers({
    onTimerFinished: (label) => showToast(`Timer finished: ${label}`),
  });

  const { wakeLockActive, enableWakeLock, toggleWakeLock } = useWakeLock({
    onActivated: () => showToast("Screen will stay awake while you cook"),
  });

  // Hydrate initial recipes, saved list, and kitchen profile from FastAPI
  useEffect(() => {
    let cancelled = false;
    logger.info("App", "Bootstrapping CookFlow application state...");

    void fetchBootstrap().then((data) => {
      if (cancelled) return;
      setRecipes(data.recipes);
      setSavedIds(new Set(data.savedIds));
      setProfile(data.profile);
      setServings(data.profile.defaultServings || 2);
      if (data.recipes.length > 0) {
        setSelectedRecipeId(data.recipes[0].id);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeRecipe = useMemo(() => {
    return recipes.find((r) => r.id === selectedRecipeId) || recipes[0] || SEED_RECIPES[0];
  }, [recipes, selectedRecipeId]);

  const navigateTo = useCallback((nextScreen: ScreenName) => {
    logger.info("Navigation", `Navigating to screen='${nextScreen}'`);
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goHome = useCallback(() => {
    setSwapModalIngId(null);
    setIngredientsDrawerOpen(false);
    setActiveFilter("All");
    setSavedOnly(false);
    setSearchQuery("");
    navigateTo("discover");
  }, [navigateTo]);

  const openRecipe = useCallback(
    (recipeId: string) => {
      const target = recipes.find((r) => r.id === recipeId);
      if (!target) return;
      logger.info("Recipe", `Opening recipe '${target.title}' [id=${recipeId}]`);
      setSelectedRecipeId(target.id);
      setServings(profile.defaultServings || target.baseServings);
      setCheckedIngredients(new Set());
      setSwaps({});
      setCurrentStep(0);
      setStepCompleted(false);
      navigateTo("prep");
    },
    [recipes, profile.defaultServings, navigateTo]
  );

  const handleToggleFavorite = useCallback(
    async (recipeId: string) => {
      const wasSaved = savedIds.has(recipeId);
      // Optimistic UI update
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(recipeId);
        else next.add(recipeId);
        return next;
      });
      if (!wasSaved) {
        showToast("Saved to your recipes");
      }

      const result = await toggleSaveRecipeApi(recipeId, savedIds);
      setSavedIds(new Set(result.savedIds));
    },
    [savedIds, showToast]
  );

  const handleToggleIngredientCheck = useCallback((ingId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingId)) next.delete(ingId);
      else next.add(ingId);
      return next;
    });
  }, []);

  const handleSelectSwap = useCallback(
    (ingId: string, swapIdx: number) => {
      logger.info("Swap", `Applied swap index=${swapIdx} for ingredient='${ingId}'`);
      setSwaps((prev) => ({ ...prev, [ingId]: swapIdx }));
      setSwapModalIngId(null);
      showToast("Updated ingredient & cooking steps");
    },
    [showToast]
  );

  const handleStartCooking = useCallback(() => {
    logger.info("CookMode", `Starting step-by-step cook mode for '${activeRecipe.title}'`);
    setCurrentStep(0);
    setStepCompleted(false);
    if (profile.autoWakeLock && !wakeLockActive) {
      void enableWakeLock();
    }
    navigateTo("cook");
  }, [activeRecipe.title, profile.autoWakeLock, wakeLockActive, enableWakeLock, navigateTo]);

  const handleChangeStep = useCallback(
    (delta: number) => {
      if (stepCompleted && delta < 0) {
        setStepCompleted(false);
        return;
      }

      const next = currentStep + delta;
      if (next < 0) return;

      if (next >= activeRecipe.steps.length) {
        if (!stepCompleted) {
          logger.info("CookMode", `Completed all steps for '${activeRecipe.title}'`);
          setProfile((prev) => ({ ...prev, mealsCooked: prev.mealsCooked + 1 }));
          void recordMealCookedApi(profile).then((updated) => setProfile(updated));
        }
        setStepCompleted(true);
        return;
      }

      setCurrentStep(next);
      setStepCompleted(false);
    },
    [stepCompleted, currentStep, activeRecipe.steps.length, activeRecipe.title, profile]
  );

  const handleSaveNewRecipe = useCallback(
    async (draftPayload: Omit<Recipe, "id">) => {
      const created = await createRecipeApi(draftPayload);
      setRecipes((prev) => [created, ...prev]);
      setSavedIds((prev) => new Set([created.id, ...prev]));
      showToast("Recipe saved to CookFlow!");
      setSelectedRecipeId(created.id);
      setServings(profile.defaultServings || created.baseServings);
      setCheckedIngredients(new Set());
      setSwaps({});
      setCurrentStep(0);
      setStepCompleted(false);
      navigateTo("prep");
    },
    [profile.defaultServings, showToast, navigateTo]
  );

  const handleUpdateProfileName = useCallback(
    (nextName: string) => {
      setProfile((prev) => ({ ...prev, name: nextName }));
      if (nameSaveTimerRef.current !== null) {
        window.clearTimeout(nameSaveTimerRef.current);
      }
      nameSaveTimerRef.current = window.setTimeout(() => {
        const trimmed = nextName.trim();
        if (trimmed) {
          void updateProfileApi({ name: trimmed }, profile).then((updated) => setProfile(updated));
        }
      }, 500);
    },
    [profile]
  );

  const handleChangeDefaultServings = useCallback(
    (delta: number) => {
      const nextServings = Math.max(1, Math.min(12, profile.defaultServings + delta));
      setProfile((prev) => ({ ...prev, defaultServings: nextServings }));
      void updateProfileApi({ defaultServings: nextServings }, profile).then((updated) =>
        setProfile(updated)
      );
    },
    [profile]
  );

  const handleToggleAutoWakeLock = useCallback(() => {
    const nextAuto = !profile.autoWakeLock;
    setProfile((prev) => ({ ...prev, autoWakeLock: nextAuto }));
    void updateProfileApi({ autoWakeLock: nextAuto }, profile).then((updated) => setProfile(updated));
  }, [profile]);

  return (
    <>
      <Navbar
        screen={screen}
        savedCount={savedIds.size}
        savedOnly={savedOnly}
        timers={timers}
        onGoHome={goHome}
        onOpenAddRecipe={() => navigateTo("add")}
        onToggleSavedOnly={() => setSavedOnly((prev) => !prev)}
        onToggleProfile={() => (screen === "profile" ? goHome() : navigateTo("profile"))}
        onExitCookToPrep={() => navigateTo("prep")}
        onToggleTimerPause={togglePauseTimer}
        onRemoveTimer={removeTimer}
      />

      <ToastBanner message={toastMessage} onDismiss={hideToast} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28">
        {screen === "discover" && (
          <DiscoverScreen
            recipes={recipes}
            savedIds={savedIds}
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            savedOnly={savedOnly}
            isLoading={isLoading}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery("")}
            onSelectFilter={setActiveFilter}
            onResetFilters={() => {
              setActiveFilter("All");
              setSavedOnly(false);
              setSearchQuery("");
            }}
            onToggleFavorite={(id) => void handleToggleFavorite(id)}
            onOpenRecipe={openRecipe}
          />
        )}

        {screen === "prep" && (
          <PrepScreen
            recipe={activeRecipe}
            servings={servings}
            isSaved={savedIds.has(activeRecipe.id)}
            checkedIngredients={checkedIngredients}
            swaps={swaps}
            onBackToDiscover={() => navigateTo("discover")}
            onToggleFavorite={() => void handleToggleFavorite(activeRecipe.id)}
            onChangeServings={(delta) =>
              setServings((prev) => Math.max(1, Math.min(12, prev + delta)))
            }
            onToggleIngredientCheck={handleToggleIngredientCheck}
            onOpenSwapModal={(ingId) => setSwapModalIngId(ingId)}
            onResetSwaps={() => {
              setSwaps({});
              showToast("Original ingredients restored");
            }}
            onStartCooking={handleStartCooking}
          />
        )}

        {screen === "cook" && (
          <CookScreen
            recipe={activeRecipe}
            servings={servings}
            swaps={swaps}
            currentStep={currentStep}
            stepCompleted={stepCompleted}
            activeTimers={timers}
            wakeLockActive={wakeLockActive}
            onToggleWakeLock={() => void toggleWakeLock()}
            onOpenIngredientsDrawer={() => setIngredientsDrawerOpen(true)}
            onStartTimer={startTimer}
            onJumpToStep={(idx) => {
              setCurrentStep(idx);
              setStepCompleted(false);
            }}
            onChangeStep={handleChangeStep}
            onRestartSteps={() => {
              setCurrentStep(0);
              setStepCompleted(false);
            }}
            onBackToDiscover={() => navigateTo("discover")}
          />
        )}

        {screen === "add" && (
          <AddRecipeScreen
            existingRecipeCount={recipes.length}
            onCancel={goHome}
            onNotify={showToast}
            onSaveRecipe={handleSaveNewRecipe}
          />
        )}

        {screen === "profile" && (
          <ProfileScreen
            profile={profile}
            recipes={recipes}
            savedIds={savedIds}
            onGoHome={goHome}
            onOpenAddRecipe={() => navigateTo("add")}
            onOpenRecipe={openRecipe}
            onRemoveSaved={(id) => {
              void handleToggleFavorite(id);
              showToast("Removed from saved recipes");
            }}
            onBrowseByTag={(tag) => {
              setActiveFilter(tag);
              setSavedOnly(false);
              navigateTo("discover");
            }}
            onUpdateProfileName={handleUpdateProfileName}
            onChangeDefaultServings={handleChangeDefaultServings}
            onToggleAutoWakeLock={handleToggleAutoWakeLock}
          />
        )}
      </main>

      <SwapModal
        recipe={activeRecipe}
        ingredientId={swapModalIngId}
        servings={servings}
        currentSwapIndex={swapModalIngId ? (swaps[swapModalIngId] ?? 0) : 0}
        onSelectSwap={handleSelectSwap}
        onClose={() => setSwapModalIngId(null)}
      />

      <IngredientsDrawer
        open={ingredientsDrawerOpen}
        recipe={activeRecipe}
        servings={servings}
        checkedIngredients={checkedIngredients}
        swaps={swaps}
        onToggleIngredientCheck={handleToggleIngredientCheck}
        onClose={() => setIngredientsDrawerOpen(false)}
      />
    </>
  );
}
```
</file>

<file path="frontend/src/index.css">
```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-serif: "Fraunces", Georgia, serif;

  --color-cream: #FAF8F5;
  --color-sand: #F2EDE4;

  --color-terracotta-50: #FDF5F2;
  --color-terracotta-100: #FAE7E0;
  --color-terracotta-600: #C85A32;
  --color-terracotta-700: #A94623;

  --color-sage-50: #F3F7F4;
  --color-sage-100: #E2ECE5;
  --color-sage-700: #2E5A44;
  --color-sage-800: #234635;
}

:root {
  --background: #FAF8F5;
  --foreground: #1C1917;
  --card: #FFFFFF;
  --card-foreground: #1C1917;
  --popover: #FFFFFF;
  --popover-foreground: #1C1917;
  --primary: #C85A32;
  --primary-foreground: #FFFFFF;
  --secondary: #F2EDE4;
  --secondary-foreground: #292524;
  --muted: #F2EDE4;
  --muted-foreground: #78716C;
  --accent: #F3F7F4;
  --accent-foreground: #234635;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --border: #E7E5E4;
  --input: #E7E5E4;
  --ring: #C85A32;
  --radius: 1rem;
}

@layer base {
  html {
    scroll-behavior: smooth;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    background-color: var(--color-cream);
    color: #1C1917;
    font-family: var(--font-sans);
  }

  button:not(:disabled),
  [role="button"]:not([aria-disabled="true"]) {
    cursor: pointer;
  }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```
</file>

<file path="frontend/src/main.tsx">
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```
</file>

<file path="frontend/src/components/AddRecipeScreen.tsx">
```tsx
import { useState } from "react";
import {
  ADD_TAG_OPTIONS,
  ADD_TIME_OPTIONS,
  ADD_UNIT_OPTIONS,
  QUICK_STAPLES,
} from "@/data/seedRecipes";
import { formatKitchenQuantity, parseFractionInput } from "@/lib/kitchenUtils";
import { logger } from "@/lib/logger";
import type { DraftIngredientRow, DraftStepRow, Recipe } from "@/types/recipe";

interface AddRecipeScreenProps {
  existingRecipeCount: number;
  onCancel: () => void;
  onNotify: (message: string) => void;
  onSaveRecipe: (recipe: Omit<Recipe, "id">) => Promise<void>;
}

export function AddRecipeScreen({
  existingRecipeCount,
  onCancel,
  onNotify,
  onSaveRecipe,
}: AddRecipeScreenProps) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [time, setTime] = useState("20 min");
  const [baseServings, setBaseServings] = useState(2);
  const [selectedTags, setSelectedTags] = useState<string[]>(["One Pan"]);
  const [ingredients, setIngredients] = useState<DraftIngredientRow[]>([
    { qty: "1", unit: "tbsp", name: "" },
    { qty: "2", unit: "cups", name: "" },
  ]);
  const [steps, setSteps] = useState<DraftStepRow[]>([
    { text: "", hasTimer: false, timerMins: 5 },
    { text: "", hasTimer: false, timerMins: 10 },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const quickAddStaple = (qty: string, unit: string, name: string) => {
    setIngredients((prev) => {
      const normName = name.trim().toLowerCase();
      const existingIdx = prev.findIndex(
        (item) => item.name.trim().toLowerCase() === normName && item.unit === unit
      );

      if (existingIdx !== -1) {
        const updated = [...prev];
        const currentQty = parseFractionInput(updated[existingIdx].qty);
        const addQty = parseFractionInput(qty);
        const combined = currentQty + addQty;
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: formatKitchenQuantity(combined) || String(combined),
        };
        return updated;
      }

      const emptyIdx = prev.findIndex((item) => !item.name.trim());
      if (emptyIdx !== -1) {
        const updated = [...prev];
        updated[emptyIdx] = { qty, unit, name };
        return updated;
      }

      return [...prev, { qty, unit, name }];
    });
  };

  const updateIngredient = (idx: number, field: keyof DraftIngredientRow, value: string) => {
    setIngredients((prev) =>
      prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, [field]: value } : row))
    );
  };

  const removeIngredient = (idx: number) => {
    setIngredients((prev) => {
      if (prev.length <= 1) {
        return [{ qty: "1", unit: "cup", name: "" }];
      }
      return prev.filter((_, rowIdx) => rowIdx !== idx);
    });
  };

  const updateStep = <K extends keyof DraftStepRow>(
    idx: number,
    field: K,
    value: DraftStepRow[K]
  ) => {
    setSteps((prev) =>
      prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, [field]: value } : row))
    );
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => {
      if (prev.length <= 1) {
        return [{ text: "", hasTimer: false, timerMins: 5 }];
      }
      return prev.filter((_, rowIdx) => rowIdx !== idx);
    });
  };

  const handleSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      onNotify("Please give your dish a name first");
      return;
    }

    const mergedMap = new Map<string, { qty: number; unit: string; name: string }>();
    ingredients
      .filter((item) => item.name.trim().length > 0)
      .forEach((item) => {
        const cleanName = item.name.trim();
        const key = `${cleanName.toLowerCase()}__${item.unit}`;
        const parsedQty = parseFractionInput(item.qty);
        const existing = mergedMap.get(key);
        if (existing) {
          existing.qty += parsedQty;
        } else {
          mergedMap.set(key, {
            qty: parsedQty,
            unit: item.unit,
            name: cleanName,
          });
        }
      });

    const validIngredients = Array.from(mergedMap.values()).map((item, idx) => ({
      id: `custom-ing-${idx}`,
      qty: item.qty,
      unit: item.unit,
      name: item.name,
    }));

    if (validIngredients.length === 0) {
      onNotify("Add at least one ingredient to continue");
      return;
    }

    const validSteps = steps
      .filter((s) => s.text.trim().length > 0)
      .map((s, idx) => ({
        phase: `Step ${idx + 1}`,
        text: s.text.trim(),
        timer: s.hasTimer
          ? { label: `Step ${idx + 1}`, seconds: Math.max(1, s.timerMins || 5) * 60 }
          : null,
        ingredientIds: [],
      }));

    if (validSteps.length === 0) {
      onNotify("Add at least one cooking step");
      return;
    }

    const palette = ["C85A32", "2E5A44", "B85D19", "3B6E52"];
    const color = palette[existingRecipeCount % palette.length];

    const newRecipePayload: Omit<Recipe, "id"> = {
      title: cleanTitle,
      subtitle: subtitle.trim() || "Homemade recipe saved in CookFlow.",
      time,
      baseServings,
      tags: selectedTags.length > 0 ? selectedTags : ["Home Recipe"],
      image: `https://placehold.co/900x500/${color}/FAF8F5?text=${encodeURIComponent(cleanTitle)}`,
      fallbackColor: color,
      ingredients: validIngredients,
      steps: validSteps,
    };

    setIsSaving(true);
    logger.info("AddRecipe", `Submitting custom recipe '${cleanTitle}'`);
    try {
      await onSaveRecipe(newRecipePayload);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Top Back Link */}
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Back to all recipes</span>
      </button>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Add Your Recipe
        </h1>
        <p className="text-sm text-stone-600">
          Jot down the basics—we’ll format it for easy scaling and hands-free step-by-step cooking.
        </p>
      </div>

      {/* Card 1: Dish Basics & Meal Style Checklist */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="space-y-3">
          <div>
            <label
              htmlFor="add-title-input"
              className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5"
            >
              Dish Name
            </label>
            <input
              id="add-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weeknight Garlic Shrimp Bowl"
              className="w-full px-4 py-3 bg-cream/60 border border-stone-200 rounded-2xl text-base font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta-600/30 focus:border-terracotta-600"
            />
          </div>

          <div>
            <label
              htmlFor="add-subtitle-input"
              className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5"
            >
              Short Note <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input
              id="add-subtitle-input"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g., Ready fast with pantry staples and fresh lemon."
              className="w-full px-4 py-2.5 bg-cream/60 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta-600/30 focus:border-terracotta-600"
            />
          </div>
        </div>

        {/* Quick Time & Servings Row */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-stone-500">Total Time</span>
            <div className="flex flex-wrap gap-1.5">
              {ADD_TIME_OPTIONS.map((t) => {
                const active = time === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      active
                        ? "bg-stone-900 text-white shadow-xs"
                        : "bg-cream border border-stone-200 text-stone-700 hover:bg-sand/70"
                    }`}
                  >
                    {t}
                  </button>
                );
              })
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-stone-500">Makes</span>
            <div className="inline-flex items-center gap-2.5 bg-sand/80 px-3 py-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setBaseServings((prev) => Math.max(1, prev - 1))}
                className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50 active:scale-95 transition"
                aria-label="Decrease servings"
              >
                &minus;
              </button>
              <span className="w-16 text-center text-xs font-bold text-stone-900">
                {baseServings} {baseServings === 1 ? "serving" : "servings"}
              </span>
              <button
                type="button"
                onClick={() => setBaseServings((prev) => Math.min(12, prev + 1))}
                className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50 active:scale-95 transition"
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Meal Style Checklist */}
        <div className="pt-2 border-t border-stone-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Meal Style Checklist</span>
            <span className="text-xs text-stone-400">Tap all that fit</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ADD_TAG_OPTIONS.map((tag) => {
              const checked = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    checked
                      ? "border-sage-700 bg-sage-50/80 text-sage-800"
                      : "border-stone-200 bg-cream/40 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      checked ? "bg-sage-700 border-sage-700 text-white" : "border-stone-300 bg-white"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="text-xs font-semibold truncate">{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card 2: Ingredients Checklist Builder */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-900">Ingredients Checklist</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Add items below or tap a quick-add staple to save typing.
          </p>
        </div>

        {/* 1-Tap Common Kitchen Staples */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[11px] font-semibold text-stone-400 shrink-0 mr-1">Quick add:</span>
          {QUICK_STAPLES.map((staple) => (
            <button
              key={staple.name}
              type="button"
              onClick={() => quickAddStaple(staple.qty, staple.unit, staple.name)}
              className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-sand/80 hover:bg-sand text-stone-700 transition-colors"
            >
              {staple.label}
            </button>
          ))}
        </div>

        {/* Dynamic Ingredient Rows */}
        <div className="space-y-2.5">
          {ingredients.map((row, idx) => (
            <div
              key={`draft-ing-${idx}`}
              className="flex items-center gap-2 bg-cream/60 p-2 rounded-2xl border border-stone-200/80"
            >
              <span className="w-5 h-5 rounded-md border border-stone-300 bg-white shrink-0 ml-1" />

              <input
                type="text"
                value={row.qty}
                onChange={(e) => updateIngredient(idx, "qty", e.target.value)}
                placeholder="1"
                aria-label="Amount"
                className="w-14 px-2 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-center text-stone-900 focus:outline-none focus:border-terracotta-600"
              />

              <select
                value={row.unit}
                onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                aria-label="Unit"
                className="px-2 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-700 focus:outline-none focus:border-terracotta-600"
              >
                {ADD_UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={row.name}
                onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                placeholder="Ingredient (e.g., baby spinach)"
                aria-label="Ingredient name"
                className="flex-1 min-w-0 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-600"
              />

              <button
                type="button"
                onClick={() => removeIngredient(idx)}
                aria-label="Remove ingredient"
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIngredients((prev) => [...prev, { qty: "1", unit: "cup", name: "" }])}
          className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-stone-300 hover:border-terracotta-600 hover:bg-terracotta-50/50 text-sm font-semibold text-terracotta-700 flex items-center justify-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add another ingredient</span>
        </button>
      </div>

      {/* Card 3: Cooking Steps Builder */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-900">Cooking Steps</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Break it into bite-sized actions so you never lose your place.
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={`draft-step-${idx}`}
              className="p-3.5 rounded-2xl bg-cream/60 border border-stone-200/80 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-stone-700">
                  <span className="w-5 h-5 rounded-full bg-terracotta-600 text-white text-[11px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  Step {idx + 1}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStep(idx, "hasTimer", !step.hasTimer)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      step.hasTimer
                        ? "border-sage-700 bg-sage-50 text-sage-800"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        step.hasTimer ? "bg-sage-700 border-sage-700 text-white" : "border-stone-300"
                      }`}
                    >
                      {step.hasTimer && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span>Add timer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    aria-label="Remove step"
                    className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <textarea
                rows={2}
                value={step.text}
                onChange={(e) => updateStep(idx, "text", e.target.value)}
                placeholder="Describe what to do (e.g., Sear chicken in olive oil until golden brown)..."
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-600 resize-none"
              />

              {step.hasTimer && (
                <div className="flex items-center gap-2 pt-0.5 text-xs text-sage-800">
                  <span className="font-semibold">Timer length:</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={step.timerMins}
                    onChange={(e) =>
                      updateStep(idx, "timerMins", Math.max(1, parseInt(e.target.value || "1", 10)))
                    }
                    className="w-16 px-2 py-1 bg-white border border-sage-700/30 rounded-lg font-bold text-center text-stone-900"
                  />
                  <span>minutes</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSteps((prev) => [...prev, { text: "", hasTimer: false, timerMins: 5 }])}
          className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-stone-300 hover:border-sage-700 hover:bg-sage-50/60 text-sm font-semibold text-sage-800 flex items-center justify-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add another step</span>
        </button>
      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-cream/95 backdrop-blur border-t border-stone-200/90 p-3.5 sm:p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3.5 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleSave()}
            className="flex-1 sm:flex-initial sm:min-w-[240px] py-3.5 px-6 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-60 active:scale-[0.99] text-white font-semibold text-base shadow-md shadow-terracotta-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>{isSaving ? "Saving..." : "Save Recipe"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
```
</file>

<file path="frontend/src/components/CookScreen.tsx">
```tsx
import { Fragment, useRef } from "react";
import {
  formatTimerSeconds,
  getResolvedIngredient,
  parseStepInstructionSegments,
} from "@/lib/kitchenUtils";
import type { ActiveTimer, Ingredient, Recipe } from "@/types/recipe";

interface CookScreenProps {
  recipe: Recipe;
  servings: number;
  swaps: Record<string, number>;
  currentStep: number;
  stepCompleted: boolean;
  activeTimers: ActiveTimer[];
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
  onOpenIngredientsDrawer: () => void;
  onStartTimer: (id: string, label: string, seconds: number) => void;
  onJumpToStep: (idx: number) => void;
  onChangeStep: (delta: number) => void;
  onRestartSteps: () => void;
  onBackToDiscover: () => void;
}

export function CookScreen({
  recipe,
  servings,
  swaps,
  currentStep,
  stepCompleted,
  activeTimers,
  wakeLockActive,
  onToggleWakeLock,
  onOpenIngredientsDrawer,
  onStartTimer,
  onJumpToStep,
  onChangeStep,
  onRestartSteps,
  onBackToDiscover,
}: CookScreenProps) {
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const total = recipe.steps.length;
  const step = recipe.steps[Math.min(currentStep, total - 1)];

  const timerId = `${recipe.id}-step-${currentStep}`;
  const activeStepTimer = step?.timer ? activeTimers.find((t) => t.id === timerId) : undefined;
  const timerMins = step?.timer ? Math.round(step.timer.seconds / 60) : 0;
  const timerDurationLabel = step?.timer
    ? timerMins >= 1
      ? `${timerMins} min`
      : `${step.timer.seconds} sec`
    : "";

  const stepIngredients: Ingredient[] = (step?.ingredientIds ?? [])
    .map((id) => recipe.ingredients.find((item) => item.id === id))
    .filter((item): item is Ingredient => Boolean(item));

  const segments = step ? parseStepInstructionSegments(recipe, step.text, servings, swaps) : [];
  const isLastStep = currentStep === total - 1;

  return (
    <section className="space-y-5">
      {/* Top Cook Bar: Step Progress + Screen Awake Toggle */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-terracotta-700 bg-terracotta-50 px-3 py-1 rounded-full">
            {stepCompleted ? "All Done" : `Step ${currentStep + 1} of ${total}`}
          </span>

          <button
            type="button"
            onClick={onToggleWakeLock}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              wakeLockActive
                ? "border-sage-700/40 bg-sage-50 text-sage-800"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
            title="Prevents your phone or tablet screen from dimming while cooking"
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                wakeLockActive ? "bg-sage-700" : "bg-stone-300"
              }`}
            />
            <span>{wakeLockActive ? "Screen staying awake" : "Keep screen awake"}</span>
          </button>
        </div>

        {/* Visual Segmented Step Progress Bar */}
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        >
          {recipe.steps.map((_, idx) => {
            const done = stepCompleted || idx < currentStep;
            const current = !stepCompleted && idx === currentStep;
            return (
              <button
                key={`${recipe.id}-seg-${idx}`}
                type="button"
                onClick={() => onJumpToStep(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  current ? "bg-terracotta-600" : done ? "bg-sage-700" : "bg-stone-200 hover:bg-stone-300"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Focused Step Card OR Completion Card */}
      {stepCompleted ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-7 sm:p-10 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sage-100 text-sage-700 mx-auto flex items-center justify-center">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Dinner is ready!</h2>
            <p className="text-sm text-stone-600">
              You finished {recipe.title} ({servings} {servings === 1 ? "serving" : "servings"}).
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onBackToDiscover}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold text-sm transition-colors"
            >
              Browse More Recipes
            </button>
            <button
              type="button"
              onClick={onRestartSteps}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium text-sm transition-colors"
            >
              Review Steps Again
            </button>
          </div>
        </div>
      ) : (
        <> (
          <div
            onTouchStart={(e) => {
              touchStartRef.current = {
                x: e.changedTouches[0].screenX,
                y: e.changedTouches[0].screenY,
              };
            }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].screenX - touchStartRef.current.x;
              const dy = e.changedTouches[0].screenY - touchStartRef.current.y;
              if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
                if (dx < 0) onChangeStep(1);
                else onChangeStep(-1);
              }
            }}
            className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-6 min-h-[320px] flex flex-col justify-between transition-all"
          >
            <div className="space-y-5">
              {/* Step Title / Phase + All Ingredients Trigger */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  {step.phase || `Step ${currentStep + 1}`}
                </span>

                <button
                  type="button"
                  onClick={onOpenIngredientsDrawer}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-700 bg-sage-50 hover:bg-sage-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <span>All Ingredients</span>
                </button>
              </div>

              {/* Large, High-Contrast Kitchen Instruction */}
              <p className="text-xl sm:text-2xl font-medium text-stone-900 leading-relaxed">
                {segments.map((seg, idx) =>
                  seg.type === "ingredient" ? (
                    <span
                      key={idx}
                      className="font-semibold text-terracotta-700 bg-terracotta-50 px-1.5 py-0.5 rounded-md"
                    >
                      {seg.value}
                    </span>
                  ) : (
                    <Fragment key={idx}>{seg.value}</Fragment>
                  )
                )}
              </p>

              {/* Optional Chef Tip */}
              {step.tip && (
                <div className="bg-sand/70 border border-stone-200/70 rounded-2xl p-3.5 flex items-start gap-2.5">
                  <span className="text-terracotta-600 mt-0.5 shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </span>
                  <p className="text-xs sm:text-sm text-stone-700 leading-snug">{step.tip}</p>
                </div>
              )}

              {/* Embedded 1-Tap Step Timer */}
              {step.timer && (
                <div className="pt-1">
                  {activeStepTimer ? (
                    <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-sage-50 border border-sage-700/20 text-sage-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-sage-700 animate-pulse" />
                      <span className="text-sm font-semibold">
                        {activeStepTimer.label}:{" "}
                        <span className="font-mono">{formatTimerSeconds(activeStepTimer.remaining)}</span>
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStartTimer(timerId, step.timer!.label, step.timer!.seconds)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sage-700 hover:bg-sage-800 active:scale-95 text-white text-sm font-semibold shadow-xs transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="13" r="8" />
                        <path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3M10 2h4" />
                      </svg>
                      <span>
                        Start {timerDurationLabel} timer ({step.timer.label})
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Ingredients Needed Specifically For This Step */}
            {stepIngredients.length > 0 && (
              <div className="pt-5 border-t border-stone-100 space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">For this step</p>
                <div className="flex flex-wrap gap-2">
                  {stepIngredients.map((ing) => {
                    const resolved = getResolvedIngredient(recipe, ing, servings, swaps);
                    return (
                      <span
                        key={ing.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand/80 text-stone-800 text-xs sm:text-sm"
                      >
                        <strong className="font-semibold text-stone-900">
                          {resolved.formattedQty} {resolved.unit}
                        </strong>
                        <span>{resolved.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Oversized Bottom Navigation Bar (Easy to tap with wet/messy hands) */}
          <div className="fixed bottom-0 inset-x-0 z-20 bg-cream/95 backdrop-blur border-t border-stone-200/90 p-3.5 sm:p-4">
            <div className="max-w-3xl mx-auto grid grid-cols-3 gap-3">
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => onChangeStep(-1)}
                className="col-span-1 py-3.5 px-4 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none text-stone-800 font-semibold text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeStep(1)}
                className="col-span-2 py-3.5 px-6 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 active:scale-[0.99] text-white font-semibold text-base shadow-md shadow-terracotta-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>{isLastStep ? "Finish Dish" : "Next Step"}</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
```
</file>

<file path="frontend/src/components/DiscoverScreen.tsx">
```tsx
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
      {/* Calm, Friendly Greeting */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          What sounds good tonight?
        </h1>
        <p className="text-sm text-stone-600">
          Pick a meal, swap what you’re missing, and cook without losing your place.
        </p>
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
            Try clearing your search or switching back to all everyday meals.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-terracotta-600 text-white hover:bg-terracotta-700 transition-colors"
          >
            Show all recipes
          </button>
        </div>
      )}
    </section>
  );
}
```
</file>

<file path="frontend/src/components/IngredientsDrawer.tsx">
```tsx
import { useEffect } from "react";
import { getResolvedIngredient } from "@/lib/kitchenUtils";
import type { Recipe } from "@/types/recipe";

interface IngredientsDrawerProps {
  open: boolean;
  recipe: Recipe;
  servings: number;
  checkedIngredients: Set<string>;
  swaps: Record<string, number>;
  onToggleIngredientCheck: (ingId: string) => void;
  onClose: () => void;
}

export function IngredientsDrawer({
  open,
  recipe,
  servings,
  checkedIngredients,
  swaps,
  onToggleIngredientCheck,
  onClose,
}: IngredientsDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-md max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">Full Ingredient List</h3>
            <p className="text-xs text-stone-500">
              Scaled for {servings} {servings === 1 ? "serving" : "servings"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className="divide-y divide-stone-100 overflow-y-auto py-2">
          {recipe.ingredients.map((ing) => {
            const resolved = getResolvedIngredient(recipe, ing, servings, swaps);
            const checked = checkedIngredients.has(ing.id);

            return (
              <li key={ing.id} className="py-3">
                <button
                  type="button"
                  onClick={() => onToggleIngredientCheck(ing.id)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      checked ? "bg-sage-700 border-sage-700 text-white" : "border-stone-300 bg-white"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm ${checked ? "line-through text-stone-400" : "text-stone-800"}`}>
                    <strong className="font-semibold">
                      {resolved.formattedQty} {resolved.unit}
                    </strong>{" "}
                    {resolved.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
```
</file>

<file path="frontend/src/components/Navbar.tsx">
```tsx
import { formatTimerSeconds } from "@/lib/kitchenUtils";
import type { ActiveTimer, ScreenName } from "@/types/recipe";

interface NavbarProps {
  screen: ScreenName;
  savedCount: number;
  savedOnly: boolean;
  timers: ActiveTimer[];
  onGoHome: () => void;
  onOpenAddRecipe: () => void;
  onToggleSavedOnly: () => void;
  onToggleProfile: () => void;
  onExitCookToPrep: () => void;
  onToggleTimerPause: (id: string) => void;
  onRemoveTimer: (id: string) => void;
}

export function Navbar({
  screen,
  savedCount,
  savedOnly,
  timers,
  onGoHome,
  onOpenAddRecipe,
  onToggleSavedOnly,
  onToggleProfile,
  onExitCookToPrep,
  onToggleTimerPause,
  onRemoveTimer,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur border-b border-stone-200/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Brand / Home Button (Resets filters & returns to All Recipes) */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2 text-left group focus:outline-none rounded-xl py-1 px-1.5 -ml-1.5 hover:bg-sand/70 transition-colors"
          aria-label="CookFlow Home — Back to all recipes"
          title="Back to All Recipes"
        >
          <span className="w-8 h-8 rounded-xl bg-terracotta-600 text-white flex items-center justify-center shadow-sm group-hover:bg-terracotta-700 transition-colors">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </span>
          <span className="font-serif font-bold text-lg tracking-tight text-stone-900">CookFlow</span>
        </button>

        {/* Context-Aware Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {screen === "discover" && (
            <>
              <button
                type="button"
                onClick={onOpenAddRecipe}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-terracotta-600 text-white hover:bg-terracotta-700 active:scale-95 shadow-xs transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add Recipe</span>
              </button>

              <button
                type="button"
                onClick={onToggleSavedOnly}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  savedOnly
                    ? "border-terracotta-600 bg-terracotta-50 text-terracotta-700"
                    : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 ${
                    savedOnly ? "fill-terracotta-600 text-terracotta-600" : "text-stone-400"
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                <span>Saved ({savedCount})</span>
              </button>
            </>
          )}

          {(screen === "discover" || screen === "profile") && (
            <button
              type="button"
              onClick={onToggleProfile}
              aria-label="Your Kitchen Profile"
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                screen === "profile"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <svg
                className={`w-3.5 h-3.5 ${screen === "profile" ? "text-white" : "text-stone-500"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
              <span className="hidden sm:inline">Profile</span>
            </button>
          )}

          {screen === "add" && (
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <span>Cancel</span>
            </button>
          )}

          {screen === "cook" && (
            <button
              type="button"
              onClick={onExitCookToPrep}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>Ingredients</span>
            </button>
          )}
        </div>
      </div>

      {/* Persistent Floating Active Timers Bar */}
      {timers.length > 0 && (
        <div className="bg-sage-800 text-white border-t border-sage-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {timers.map((timer) => (
              <div
                key={timer.id}
                className={`shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  timer.done ? "bg-terracotta-600 text-white animate-pulse" : "bg-white/15 text-white"
                }`}
              >
                <span>{timer.label}:</span>
                <span className="font-mono">
                  {timer.done ? "Done!" : formatTimerSeconds(timer.remaining)}
                </span>
                {!timer.done && (
                  <button
                    type="button"
                    onClick={() => onToggleTimerPause(timer.id)}
                    className="px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[11px]"
                  >
                    {timer.running ? "Pause" : "Resume"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveTimer(timer.id)}
                  aria-label="Dismiss timer"
                  className="text-white/75 hover:text-white ml-0.5"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
```
</file>

<file path="frontend/src/components/PrepScreen.tsx">
```tsx
import { Fragment } from "react";
import { getResolvedIngredient, parseStepInstructionSegments } from "@/lib/kitchenUtils";
import type { Recipe } from "@/types/recipe";

interface PrepScreenProps {
  recipe: Recipe;
  servings: number;
  isSaved: boolean;
  checkedIngredients: Set<string>;
  swaps: Record<string, number>;
  onBackToDiscover: () => void;
  onToggleFavorite: () => void;
  onChangeServings: (delta: number) => void;
  onToggleIngredientCheck: (ingId: string) => void;
  onOpenSwapModal: (ingId: string) => void;
  onResetSwaps: () => void;
  onStartCooking: () => void;
}

export function PrepScreen({
  recipe,
  servings,
  isSaved,
  checkedIngredients,
  swaps,
  onBackToDiscover,
  onToggleFavorite,
  onChangeServings,
  onToggleIngredientCheck,
  onOpenSwapModal,
  onResetSwaps,
  onStartCooking,
}: PrepScreenProps) {
  const placeholderUrl = `https://placehold.co/900x500/${recipe.fallbackColor}/FAF8F5?text=${encodeURIComponent(recipe.title)}`;
  const hasAnySwaps = Object.values(swaps).some((idx) => idx > 0);

  return (
    <section className="space-y-6">
      {/* Top Back Link */}
      <button
        type="button"
        onClick={onBackToDiscover}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>All recipes</span>
      </button>

      {/* Recipe Overview Card */}
      <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs">
        <div className="relative h-48 sm:h-56 bg-stone-200">
          <img
            src={recipe.image}
            alt={recipe.title}
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = placeholderUrl;
            }}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onToggleFavorite}
            className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow-sm flex items-center justify-center text-stone-700 hover:scale-105 transition-transform"
            aria-label="Save recipe"
          >
            <svg
              className={`w-5 h-5 ${isSaved ? "fill-terracotta-600 text-terracotta-600" : "text-stone-600"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-sand text-stone-700">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">{recipe.title}</h2>
            <p className="text-sm text-stone-600 leading-relaxed">{recipe.subtitle}</p>
          </div>

          {/* Quick Info + Instant Serving Adjuster */}
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-stone-600">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-terracotta-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <strong className="font-semibold text-stone-900">{recipe.time}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-sage-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20V10M18 20V4M6 20v-4" />
                </svg>
                <span>{recipe.steps.length} easy steps</span>
              </span>
            </div>

            {/* 1-Tap Servings Adjuster */}
            <div className="flex items-center gap-2.5 bg-sand/80 px-3 py-1.5 rounded-2xl">
              <span className="text-xs font-medium text-stone-600">Servings</span>
              <button
                type="button"
                onClick={() => onChangeServings(-1)}
                className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50 active:scale-95 transition"
                aria-label="Decrease servings"
              >
                &minus;
              </button>
              <span className="w-6 text-center text-sm font-bold text-stone-900">{servings}</span>
              <button
                type="button"
                onClick={() => onChangeServings(1)}
                className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-800 font-semibold hover:bg-stone-50 active:scale-95 transition"
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients & Smart Swaps Section */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-xl font-bold text-stone-900">Ingredients</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Tap to check off as you gather • Tap <span className="font-semibold text-terracotta-700">Swap</span> to substitute
            </p>
          </div>
          {hasAnySwaps && (
            <button
              type="button"
              onClick={onResetSwaps}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 underline underline-offset-2"
            >
              Reset swaps
            </button>
          )}
        </div>

        <ul className="divide-y divide-stone-100">
          {recipe.ingredients.map((ing) => {
            const resolved = getResolvedIngredient(recipe, ing, servings, swaps);
            const checked = checkedIngredients.has(ing.id);

            return (
              <li key={ing.id} className="py-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onToggleIngredientCheck(ing.id)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0 group"
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? "bg-sage-700 border-sage-700 text-white"
                        : "border-stone-300 bg-white group-hover:border-stone-400"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>

                  <span
                    className={`text-sm sm:text-base truncate transition-all ${
                      checked ? "line-through text-stone-400" : "text-stone-800"
                    }`}
                  >
                    <strong className={`font-semibold ${checked ? "text-stone-400" : "text-stone-900"}`}>
                      {resolved.formattedQty} {resolved.unit}
                    </strong>{" "}
                    {resolved.name}
                    {resolved.isSwapped && (
                      <span className="ml-1.5 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sage-50 text-sage-700">
                        Swapped
                      </span>
                    )}
                  </span>
                </button>

                {resolved.hasSwaps && (
                  <button
                    type="button"
                    onClick={() => onOpenSwapModal(ing.id)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      resolved.isSwapped
                        ? "border-sage-700/30 bg-sage-50 text-sage-800 hover:bg-sage-100"
                        : "border-terracotta-600/30 bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100"
                    }`}
                  >
                    {resolved.isSwapped ? "Change" : "Swap"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Quick Step Preview */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 space-y-3 shadow-xs">
        <h3 className="font-serif text-lg font-bold text-stone-900">Cooking Overview</h3>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => {
            const segments = parseStepInstructionSegments(recipe, step.text, servings, swaps);
            return (
              <li key={`${recipe.id}-preview-${i}`} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-sand text-stone-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-stone-700 leading-relaxed">
                  {segments.map((seg, segIdx) =>
                    seg.type === "ingredient" ? (
                      <span
                        key={segIdx}
                        className="font-semibold text-terracotta-700 bg-terracotta-50 px-1.5 py-0.5 rounded-md"
                      >
                        {seg.value}
                      </span>
                    ) : (
                      <Fragment key={segIdx}>{seg.value}</Fragment>
                    )
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Sticky Bottom Action Bar: 1-Click to Step-by-Step Cook Mode */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-cream/95 backdrop-blur border-t border-stone-200/90 p-3.5 sm:p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <p className="text-xs text-stone-500">Everything updates automatically</p>
            <p className="text-sm font-semibold text-stone-900">
              {servings} {servings === 1 ? "serving" : "servings"} • {recipe.steps.length} easy steps
            </p>
          </div>
          <button
            type="button"
            onClick={onStartCooking}
            className="w-full sm:w-auto flex-1 sm:flex-initial sm:min-w-[240px] py-3.5 px-6 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 active:scale-[0.99] text-white font-semibold text-base shadow-md shadow-terracotta-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>Start Step-by-Step Cooking</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
```
</file>

<file path="frontend/src/components/ProfileScreen.tsx">
```tsx
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
```
</file>

<file path="frontend/src/components/SwapModal.tsx">
```tsx
import { useEffect } from "react";
import { formatKitchenQuantity } from "@/lib/kitchenUtils";
import type { Recipe } from "@/types/recipe";

interface SwapModalProps {
  recipe: Recipe;
  ingredientId: string | null;
  servings: number;
  currentSwapIndex: number;
  onSelectSwap: (ingredientId: string, swapIndex: number) => void;
  onClose: () => void;
}

export function SwapModal({
  recipe,
  ingredientId,
  servings,
  currentSwapIndex,
  onSelectSwap,
  onClose,
}: SwapModalProps) {
  const ingredient = ingredientId ? recipe.ingredients.find((i) => i.id === ingredientId) : null;

  useEffect(() => {
    if (!ingredient || !ingredient.swaps) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ingredient, onClose]);

  if (!ingredient || !ingredient.swaps) return null;

  const scale = servings / Math.max(1, recipe.baseServings);

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl border border-stone-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-700">Kitchen Swap</span>
            <h3 className="font-serif text-xl font-bold text-stone-900 mt-0.5">Substitute for {ingredient.name}</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Choose a substitute—we’ll update your measurements and steps automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {ingredient.swaps.map((opt, idx) => {
            const selected = idx === currentSwapIndex;
            const scaledQty = formatKitchenQuantity(opt.qty * scale);
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onSelectSwap(ingredient.id, idx)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                  selected
                    ? "border-terracotta-600 bg-terracotta-50/70 ring-1 ring-terracotta-600"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-stone-900">{opt.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Uses {scaledQty} {opt.unit} {opt.name}
                  </p>
                </div>
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    selected ? "border-terracotta-600 bg-terracotta-600 text-white" : "border-stone-300"
                  }`}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```
</file>

<file path="frontend/src/components/ToastBanner.tsx">
```tsx
interface ToastBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function ToastBanner({ message, onDismiss }: ToastBannerProps) {
  if (!message) return null;

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 transition-all"
      role="status"
    >
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-terracotta-600 animate-ping shrink-0" />
        <p className="text-sm font-medium leading-snug">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-stone-400 hover:text-white px-2 py-1 rounded-lg"
      >
        Dismiss
      </button>
    </div>
  );
}
```
</file>

<file path="frontend/src/data/seedRecipes.ts">
```typescript
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
```
</file>

<file path="frontend/src/hooks/useKitchenTimers.ts">
```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import { playGentleChime } from "@/lib/kitchenUtils";
import { logger } from "@/lib/logger";
import type { ActiveTimer } from "@/types/recipe";

interface UseKitchenTimersOptions {
  onTimerFinished?: (label: string) => void;
}

export function useKitchenTimers({ onTimerFinished }: UseKitchenTimersOptions = {}) {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const onFinishedRef = useRef(onTimerFinished);
  onFinishedRef.current = onTimerFinished;

  const hasRunningTimers = timers.some((t) => t.running && !t.done);

  useEffect(() => {
    if (!hasRunningTimers) return;

    const intervalId = window.setInterval(() => {
      const newlyCompletedLabels: string[] = [];

      setTimers((prev) =>
        prev.map((timer) => {
          if (!timer.running || timer.done) return timer;
          const nextRemaining = timer.remaining - 1;
          if (nextRemaining <= 0) {
            newlyCompletedLabels.push(timer.label);
            return {
              ...timer,
              remaining: 0,
              running: false,
              done: true,
            };
          }
          return {
            ...timer,
            remaining: nextRemaining,
          };
        })
      );

      if (newlyCompletedLabels.length > 0) {
        playGentleChime();
        for (const label of newlyCompletedLabels) {
          logger.info("Timers", `Timer finished: '${label}'`);
          onFinishedRef.current?.(label);
        }
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [hasRunningTimers]);

  const startTimer = useCallback((id: string, label: string, seconds: number) => {
    setTimers((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      logger.info("Timers", `Started timer '${label}' (${seconds}s) [id=${id}]`);
      return [
        ...prev,
        {
          id,
          label,
          remaining: seconds,
          total: seconds,
          running: true,
          done: false,
        },
      ];
    });
  }, []);

  const togglePauseTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.done) return t;
        const nextRunning = !t.running;
        logger.info("Timers", `${nextRunning ? "Resumed" : "Paused"} timer '${t.label}' (${t.remaining}s left)`);
        return { ...t, running: nextRunning };
      })
    );
  }, []);

  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) {
        logger.info("Timers", `Dismissed timer '${target.label}'`);
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  return {
    timers,
    startTimer,
    togglePauseTimer,
    removeTimer,
  };
}
```
</file>

<file path="frontend/src/hooks/useWakeLock.ts">
```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";

interface UseWakeLockOptions {
  onActivated?: () => void;
}

export function useWakeLock({ onActivated }: UseWakeLockOptions = {}) {
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const activeRef = useRef(false);
  activeRef.current = wakeLockActive;

  const requestSentinel = useCallback(async () => {
    try {
      if ("wakeLock" in navigator && navigator.wakeLock) {
        sentinelRef.current = await navigator.wakeLock.request("screen");
        logger.info("WakeLock", "Acquired native Screen Wake Lock sentinel");
      } else {
        logger.debug("WakeLock", "Native Screen Wake Lock API unavailable; maintaining logical state");
      }
    } catch (err) {
      logger.warn("WakeLock", "Wake lock request blocked or unsupported in current context", err);
    }
  }, []);

  const enableWakeLock = useCallback(async () => {
    if (activeRef.current) return;
    await requestSentinel();
    setWakeLockActive(true);
    onActivated?.();
  }, [onActivated, requestSentinel]);

  const disableWakeLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
        logger.info("WakeLock", "Released Screen Wake Lock sentinel");
      } catch (err) {
        logger.warn("WakeLock", "Error releasing Screen Wake Lock sentinel", err);
      }
      sentinelRef.current = null;
    }
    setWakeLockActive(false);
  }, []);

  const toggleWakeLock = useCallback(async () => {
    if (activeRef.current) {
      await disableWakeLock();
    } else {
      await enableWakeLock();
    }
  }, [disableWakeLock, enableWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && activeRef.current) {
        void requestSentinel();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [requestSentinel]);

  return {
    wakeLockActive,
    enableWakeLock,
    disableWakeLock,
    toggleWakeLock,
  };
}
```
</file>

<file path="frontend/src/lib/api.ts">
```typescript
import { SEED_RECIPES } from "@/data/seedRecipes";
import { logger } from "@/lib/logger";
import type { Recipe, UserProfile } from "@/types/recipe";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api";

export interface BootstrapPayload {
  recipes: Recipe[];
  savedIds: string[];
  profile: UserProfile;
  offlineFallback?: boolean;
}

export interface SaveTogglePayload {
  recipeId: string;
  saved: boolean;
  savedIds: string[];
}

export interface ProfilePatchPayload {
  name?: string;
  defaultServings?: number;
  autoWakeLock?: boolean;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = init?.method ?? "GET";
  const t0 = performance.now();

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const elapsedMs = (performance.now() - t0).toFixed(1);
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    logger.error("API", `${method} ${path} failed (${response.status}) in ${elapsedMs}ms: ${errorText}`);
    throw new Error(`API ${method} ${path} failed with status ${response.status}`);
  }

  const data = (await response.json()) as T;
  logger.debug("API", `${method} ${path} -> ${response.status} (${elapsedMs}ms)`);
  return data;
}

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  try {
    const data = await requestJson<BootstrapPayload>("/bootstrap");
    logger.info(
      "API",
      `Hydrated from FastAPI: ${data.recipes.length} recipes, ${data.savedIds.length} saved`
    );
    return { ...data, offlineFallback: false };
  } catch (err) {
    logger.warn(
      "API",
      "FastAPI backend unreachable; falling back to local seed recipes until backend starts",
      err
    );
    return {
      recipes: [...SEED_RECIPES],
      savedIds: [],
      profile: {
        name: "Home Cook",
        defaultServings: 2,
        autoWakeLock: false,
        mealsCooked: 0,
      },
      offlineFallback: true,
    };
  }
}

export async function createRecipeApi(recipe: Omit<Recipe, "id"> & { id?: string }): Promise<Recipe> {
  try {
    return await requestJson<Recipe>("/recipes", {
      method: "POST",
      body: JSON.stringify(recipe),
    });
  } catch (err) {
    const fallbackId = recipe.id ?? `custom-${Date.now()}`;
    logger.warn("API", `Offline fallback: saved custom recipe locally (${fallbackId})`, err);
    return { ...recipe, id: fallbackId };
  }
}

export async function toggleSaveRecipeApi(
  recipeId: string,
  currentSavedIds: Set<string>
): Promise<SaveTogglePayload> {
  try {
    return await requestJson<SaveTogglePayload>(`/recipes/${encodeURIComponent(recipeId)}/save`, {
      method: "POST",
    });
  } catch (err) {
    const next = new Set(currentSavedIds);
    const willSave = !next.has(recipeId);
    if (willSave) next.add(recipeId);
    else next.delete(recipeId);
    logger.warn("API", `Offline fallback: toggled saved=${willSave} for ${recipeId}`, err);
    return {
      recipeId,
      saved: willSave,
      savedIds: Array.from(next),
    };
  }
}

export async function updateProfileApi(
  patch: ProfilePatchPayload,
  fallbackCurrent: UserProfile
): Promise<UserProfile> {
  try {
    return await requestJson<UserProfile>("/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  } catch (err) {
    logger.warn("API", "Offline fallback: updated kitchen profile in memory", err);
    return {
      ...fallbackCurrent,
      ...patch,
    };
  }
}

export async function recordMealCookedApi(fallbackCurrent: UserProfile): Promise<UserProfile> {
  try {
    return await requestJson<UserProfile>("/profile/meals-cooked", {
      method: "POST",
    });
  } catch (err) {
    logger.warn("API", "Offline fallback: incremented mealsCooked in memory", err);
    return {
      ...fallbackCurrent,
      mealsCooked: fallbackCurrent.mealsCooked + 1,
    };
  }
}
```
</file>

<file path="frontend/src/lib/kitchenUtils.ts">
```typescript
import type { Ingredient, Recipe, ResolvedIngredient } from "@/types/recipe";
import { logger } from "@/lib/logger";

export interface StepSegment {
  type: "text" | "ingredient";
  value: string;
}

const FRACTION_TABLE: ReadonlyArray<{ val: number; label: string }> = [
  { val: 0, label: "" },
  { val: 0.25, label: "¼" },
  { val: 0.33, label: "⅓" },
  { val: 0.5, label: "½" },
  { val: 0.66, label: "⅔" },
  { val: 0.75, label: "¾" },
  { val: 1, label: "" },
];

/**
 * Converts decimal quantities into readable cookbook fractions (e.g., 1.5 -> "1 ½", 0.33 -> "⅓").
 */
export function formatKitchenQuantity(rawQty: number): string {
  if (!rawQty || rawQty <= 0) return "";
  const whole = Math.floor(rawQty + 0.02);
  const frac = rawQty - whole;

  let closest = FRACTION_TABLE[0];
  let minDiff = Number.POSITIVE_INFINITY;

  for (const entry of FRACTION_TABLE) {
    const diff = Math.abs(frac - entry.val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  const adjustedWhole = closest.val === 1 ? whole + 1 : whole;
  if (adjustedWhole === 0 && closest.label) return closest.label;
  if (adjustedWhole > 0 && closest.label) return `${adjustedWhole} ${closest.label}`;
  if (adjustedWhole > 0) return `${adjustedWhole}`;
  return rawQty.toFixed(1).replace(/\.0$/, "");
}

/**
 * Parses user-typed quantities including unicode fractions ("1 ½") and slash fractions ("1 1/2", "3/4").
 */
export function parseFractionInput(str: string): number {
  const cleaned = String(str ?? "").trim();
  if (!cleaned) return 1;

  const unicodeMap: Record<string, number> = {
    "¼": 0.25,
    "⅓": 1 / 3,
    "½": 0.5,
    "⅔": 2 / 3,
    "¾": 0.75,
  };

  for (const [sym, val] of Object.entries(unicodeMap)) {
    if (cleaned.includes(sym)) {
      const wholePart = cleaned.replace(sym, "").trim();
      const whole = wholePart ? parseFloat(wholePart) : 0;
      return (Number.isNaN(whole) ? 0 : whole) + val;
    }
  }

  if (cleaned.includes("/")) {
    const parts = cleaned.split(/\s+/);
    let total = 0;
    for (const part of parts) {
      if (part.includes("/")) {
        const [num, den] = part.split("/").map(Number);
        if (den && !Number.isNaN(num) && !Number.isNaN(den)) {
          total += num / den;
        }
      } else {
        const whole = parseFloat(part);
        if (!Number.isNaN(whole)) total += whole;
      }
    }
    return total > 0 ? total : 1;
  }

  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;
}

/**
 * Resolves an ingredient's scaled quantity, unit, and active swap.
 */
export function getResolvedIngredient(
  recipe: Recipe,
  ingredient: Ingredient,
  servings: number,
  swaps: Record<string, number>
): ResolvedIngredient {
  const swapIdx = swaps[ingredient.id] ?? 0;
  const activeVariant =
    ingredient.swaps && ingredient.swaps[swapIdx] ? ingredient.swaps[swapIdx] : ingredient;
  const scale = servings / Math.max(1, recipe.baseServings);
  const scaledQty = activeVariant.qty * scale;
  const formattedQty = formatKitchenQuantity(scaledQty);

  return {
    id: ingredient.id,
    formattedQty,
    unit: activeVariant.unit,
    name: activeVariant.name,
    isSwapped: swapIdx > 0,
    hasSwaps: Array.isArray(ingredient.swaps) && ingredient.swaps.length > 1,
    fullPhrase: `${formattedQty} ${activeVariant.unit} ${activeVariant.name}`.replace(/\s+/g, " ").trim(),
  };
}

/**
 * Splits step instruction templates like "Sear {protein} in {fat}" into typed JSX-safe segments.
 */
export function parseStepInstructionSegments(
  recipe: Recipe,
  rawText: string,
  servings: number,
  swaps: Record<string, number>
): StepSegment[] {
  const segments: StepSegment[] = [];
  const tokenRegex = /\{([a-zA-Z0-9_-]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: rawText.slice(lastIndex, match.index) });
    }

    const ingId = match[1];
    const ing = recipe.ingredients.find((item) => item.id === ingId);
    if (ing) {
      const resolved = getResolvedIngredient(recipe, ing, servings, swaps);
      segments.push({ type: "ingredient", value: resolved.fullPhrase });
    } else {
      segments.push({ type: "text", value: match[0] });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    segments.push({ type: "text", value: rawText.slice(lastIndex) });
  }

  return segments;
}

export function formatTimerSeconds(sec: number): string {
  const safeSec = Math.max(0, Math.floor(sec));
  const mins = Math.floor(safeSec / 60);
  const rem = safeSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export function getInitials(name: string): string {
  const words = String(name || "HC")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "HC";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Plays a gentle two-note synthesized chime (D5 -> A5) via Web Audio API when a timer completes.
 */
export function playGentleChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes = [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.22);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.22 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.22 + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.22);
      osc.stop(ctx.currentTime + idx * 0.22 + 0.95);
    });
    logger.debug("AudioChime", "Played timer completion chime");
  } catch (err) {
    logger.warn("AudioChime", "Unable to play synthesized chime", err);
  }
}
```
</file>

<file path="frontend/src/lib/logger.ts">
```typescript
type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

class CookFlowLogger {
  private readonly prefix = "[CookFlow]";

  private format(level: LogLevel, scope: string, message: string): string {
    const ts = new Date().toISOString();
    return `${ts} ${this.prefix}[${level}][${scope}] ${message}`;
  }

  debug(scope: string, message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.debug(this.format("DEBUG", scope, message), meta);
    } else {
      console.debug(this.format("DEBUG", scope, message));
    }
  }

  info(scope: string, message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.info(this.format("INFO", scope, message), meta);
    } else {
      console.info(this.format("INFO", scope, message));
    }
  }

  warn(scope: string, message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.warn(this.format("WARN", scope, message), meta);
    } else {
      console.warn(this.format("WARN", scope, message));
    }
  }

  error(scope: string, message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.error(this.format("ERROR", scope, message), meta);
    } else {
      console.error(this.format("ERROR", scope, message));
    }
  }
}

export const logger = new CookFlowLogger();
```
</file>

<file path="frontend/src/lib/utils.ts">
```typescript
export { cn } from "cn"
```
</file>

<file path="frontend/src/types/recipe.ts">
```typescript
export type ScreenName = "discover" | "prep" | "cook" | "add" | "profile";

export interface IngredientSwap {
  label: string;
  qty: number;
  unit: string;
  name: string;
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
  ingredients: Ingredient[];
  steps: RecipeStep[];
}

export interface ResolvedIngredient {
  id: string;
  formattedQty: string;
  unit: string;
  name: string;
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
```
</file>

