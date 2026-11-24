import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddRecipeScreen } from "@/components/AddRecipeScreen";
import { CookScreen } from "@/components/CookScreen";
import { DiscoverScreen } from "@/components/DiscoverScreen";
import { IngredientsDrawer } from "@/components/IngredientsDrawer";
import { KitchenRescueDrawer } from "@/components/KitchenRescueDrawer";
import { Navbar } from "@/components/Navbar";
import { PantryGeneratorModal } from "@/components/PantryGeneratorModal";
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
  readOfflineAiSwaps,
  recordMealCookedApi,
  toggleSaveRecipeApi,
  updateProfileApi,
  writeOfflineAiSwaps,
} from "@/lib/api";
import { logger } from "@/lib/logger";
import type { IngredientSwap, Recipe, ScreenName, UserProfile } from "@/types/recipe";

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
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
  const [aiSwapsByRecipe, setAiSwapsByRecipe] = useState<
    Record<string, Record<string, IngredientSwap[]>>
  >(() => readOfflineAiSwaps());
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepCompleted, setStepCompleted] = useState<boolean>(false);

  // Overlays & toast
  const [swapModalIngId, setSwapModalIngId] = useState<string | null>(null);
  const [ingredientsDrawerOpen, setIngredientsDrawerOpen] = useState<boolean>(false);
  const [kitchenRescueOpen, setKitchenRescueOpen] = useState<boolean>(false);
  const [rescueIngredientContext, setRescueIngredientContext] = useState<string | null>(null);
  const [pantryModalOpen, setPantryModalOpen] = useState<boolean>(false);
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

  const hydrateState = useCallback(
    async (isManualRetry = false) => {
      if (isManualRetry) setIsReconnecting(true);
      try {
        const data = await fetchBootstrap();
        const nextOffline = Boolean(data.offlineFallback);
        setRecipes(data.recipes);
        setSavedIds(new Set(data.savedIds));
        setProfile(data.profile);
        setServings((prev) => (isManualRetry ? prev : data.profile.defaultServings || 2));
        if (!isManualRetry && data.recipes.length > 0) {
          setSelectedRecipeId(data.recipes[0].id);
        }
        setIsOffline(nextOffline);

        if (isManualRetry) {
          if (nextOffline) {
            showToast("Still offline—local changes remain saved on this device");
          } else if ((data.syncedOfflineCount ?? 0) > 0) {
            showToast(`Back online! Synced ${data.syncedOfflineCount} offline recipe(s)`);
          } else {
            showToast("Back online and connected to CookFlow server");
          }
        }
      } finally {
        setIsLoading(false);
        if (isManualRetry) setIsReconnecting(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    logger.info("App", "Bootstrapping CookFlow application state...");
    void hydrateState(false);
  }, [hydrateState]);

  // Automatically retry connection when the browser reports network restoration
  useEffect(() => {
    const handleBrowserOnline = () => {
      logger.info("Network", "Browser 'online' event detected; verifying backend connectivity...");
      void hydrateState(true);
    };
    const handleBrowserOffline = () => {
      logger.warn("Network", "Browser 'offline' event detected; switching to Offline Mode");
      setIsOffline(true);
      showToast("You're offline—saved recipes & timers still work");
    };

    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);
    return () => {
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
    };
  }, [hydrateState, showToast]);

  const activeRecipe = useMemo(() => {
    return recipes.find((r) => r.id === selectedRecipeId) || recipes[0] || SEED_RECIPES[0];
  }, [recipes, selectedRecipeId]);

  const activeRecipeAiSwaps = useMemo(() => {
    return aiSwapsByRecipe[activeRecipe.id] ?? {};
  }, [aiSwapsByRecipe, activeRecipe.id]);

  const navigateTo = useCallback((nextScreen: ScreenName) => {
    logger.info("Navigation", `Navigating to screen='${nextScreen}'`);
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goHome = useCallback(() => {
    setSwapModalIngId(null);
    setIngredientsDrawerOpen(false);
    setKitchenRescueOpen(false);
    setRescueIngredientContext(null);
    setPantryModalOpen(false);
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
      setRescueIngredientContext(null);
      navigateTo("prep");
    },
    [recipes, profile.defaultServings, navigateTo]
  );

  const handleToggleSavedOnly = useCallback(() => {
    if (screen !== "discover") {
      logger.info("Navigation", "Jumping from recipe to Saved recipes feed");
      setSavedOnly(true);
      navigateTo("discover");
      return;
    }
    setSavedOnly((prev) => !prev);
  }, [screen, navigateTo]);

  const handleOpenAssistant = useCallback((ingredientPhrase: string | null = null) => {
    logger.info(
      "KitchenRescue",
      ingredientPhrase
        ? `Opening Kitchen Rescue with ingredient context: '${ingredientPhrase}'`
        : "Opening Kitchen Rescue assistant"
    );
    setRescueIngredientContext(ingredientPhrase);
    setKitchenRescueOpen(true);
  }, []);

  const handleToggleFavorite = useCallback(
    async (recipeId: string) => {
      const wasSaved = savedIds.has(recipeId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(recipeId);
        else next.add(recipeId);
        return next;
      });
      if (!wasSaved) {
        showToast(isOffline ? "Saved locally (Offline Mode)" : "Saved to your recipes");
      }

      const result = await toggleSaveRecipeApi(recipeId, savedIds);
      setSavedIds(new Set(result.savedIds));
      setIsOffline(Boolean(result.offline));
    },
    [savedIds, isOffline, showToast]
  );

  const handleToggleIngredientCheck = useCallback((ingId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingId)) next.delete(ingId);
      else next.add(ingId);
      return next;
    });
  }, []);

  const handleAiSwapsLoaded = useCallback(
    (ingId: string, incomingSwaps: IngredientSwap[], cached: boolean) => {
      setAiSwapsByRecipe((prev) => {
        const recipeMap = prev[activeRecipe.id] ?? {};
        const existingList = recipeMap[ingId] ?? [];
        const seen = new Set(existingList.map((s) => s.name.trim().toLowerCase()));
        const merged = [...existingList];
        for (const candidate of incomingSwaps) {
          const key = candidate.name.trim().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(candidate);
          }
        }
        const updatedAll = {
          ...prev,
          [activeRecipe.id]: {
            ...recipeMap,
            [ingId]: merged,
          },
        };
        writeOfflineAiSwaps(updatedAll);
        return updatedAll;
      });
      if (cached) {
        logger.debug("Swap", `Served cached AI swaps for '${ingId}'`);
      }
    },
    [activeRecipe.id]
  );

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
          void recordMealCookedApi(profile).then((res) => {
            setProfile(res.profile);
            setIsOffline(res.offline);
          });
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
    async (
      draftPayload: Omit<Recipe, "id"> & {
        autoTag?: boolean;
        requiresAuthorCredit?: boolean;
      }
    ) => {
      const { recipe: created, offline } = await createRecipeApi(draftPayload);
      setIsOffline(offline);
      setRecipes((prev) => [created, ...prev]);
      setSavedIds((prev) => new Set([created.id, ...prev]));
      showToast(
        offline
          ? "Saved offline! Will sync automatically when reconnected."
          : "Recipe saved to CookFlow!"
      );
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

  const handlePantryRecipeGenerated = useCallback(
    (generated: Recipe) => {
      setPantryModalOpen(false);
      setRecipes((prev) => [generated, ...prev]);
      setSavedIds((prev) => new Set([generated.id, ...prev]));
      showToast(`Created "${generated.title}" with Groq AI!`);
      setSelectedRecipeId(generated.id);
      setServings(generated.baseServings || profile.defaultServings || 2);
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
          void updateProfileApi({ name: trimmed }, profile).then((res) => {
            setProfile(res.profile);
            setIsOffline(res.offline);
          });
        }
      }, 500);
    },
    [profile]
  );

  const handleChangeDefaultServings = useCallback(
    (delta: number) => {
      const nextServings = Math.max(1, Math.min(12, profile.defaultServings + delta));
      setProfile((prev) => ({ ...prev, defaultServings: nextServings }));
      void updateProfileApi({ defaultServings: nextServings }, profile).then((res) => {
        setProfile(res.profile);
        setIsOffline(res.offline);
      });
    },
    [profile]
  );

  const handleToggleAutoWakeLock = useCallback(() => {
    const nextAuto = !profile.autoWakeLock;
    setProfile((prev) => ({ ...prev, autoWakeLock: nextAuto }));
    void updateProfileApi({ autoWakeLock: nextAuto }, profile).then((res) => {
      setProfile(res.profile);
      setIsOffline(res.offline);
    });
  }, [profile]);

  return (
    <>
      <Navbar
        screen={screen}
        savedCount={savedIds.size}
        savedOnly={savedOnly}
        isOffline={isOffline}
        isReconnecting={isReconnecting}
        timers={timers}
        onGoHome={goHome}
        onOpenAddRecipe={() => navigateTo("add")}
        onToggleSavedOnly={handleToggleSavedOnly}
        onToggleProfile={() => (screen === "profile" ? goHome() : navigateTo("profile"))}
        onOpenAssistant={() => handleOpenAssistant(null)}
        onRetryConnection={() => void hydrateState(true)}
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
            onOpenPantryGenerator={() => setPantryModalOpen(true)}
          />
        )}

        {screen === "prep" && (
          <PrepScreen
            recipe={activeRecipe}
            servings={servings}
            isSaved={savedIds.has(activeRecipe.id)}
            checkedIngredients={checkedIngredients}
            swaps={swaps}
            aiSwapsByIng={activeRecipeAiSwaps}
            onBackToDiscover={() => navigateTo("discover")}
            onToggleFavorite={() => void handleToggleFavorite(activeRecipe.id)}
            onChangeServings={(delta) =>
              setServings((prev) => Math.max(1, Math.min(12, prev + delta)))
            }
            onToggleIngredientCheck={handleToggleIngredientCheck}
            onOpenSwapModal={(ingId) => setSwapModalIngId(ingId)}
            onAskAboutIngredient={(phrase) => handleOpenAssistant(phrase)}
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
            aiSwapsByIng={activeRecipeAiSwaps}
            currentStep={currentStep}
            stepCompleted={stepCompleted}
            activeTimers={timers}
            wakeLockActive={wakeLockActive}
            onToggleWakeLock={() => void toggleWakeLock()}
            onOpenIngredientsDrawer={() => setIngredientsDrawerOpen(true)}
            onOpenKitchenRescue={() => handleOpenAssistant(null)}
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
            existingRecipes={recipes}
            onCancel={goHome}
            onNotify={showToast}
            onOpenExistingRecipe={openRecipe}
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
        aiSwaps={swapModalIngId ? (activeRecipeAiSwaps[swapModalIngId] ?? []) : []}
        onAiSwapsLoaded={handleAiSwapsLoaded}
        onSelectSwap={handleSelectSwap}
        onClose={() => setSwapModalIngId(null)}
      />

      <IngredientsDrawer
        open={ingredientsDrawerOpen}
        recipe={activeRecipe}
        servings={servings}
        checkedIngredients={checkedIngredients}
        swaps={swaps}
        aiSwapsByIng={activeRecipeAiSwaps}
        onToggleIngredientCheck={handleToggleIngredientCheck}
        onClose={() => setIngredientsDrawerOpen(false)}
      />

      <KitchenRescueDrawer
        open={kitchenRescueOpen}
        recipe={activeRecipe}
        servings={servings}
        swaps={swaps}
        aiSwapsByIng={activeRecipeAiSwaps}
        currentStepIndex={currentStep}
        focusedIngredient={rescueIngredientContext}
        onClearFocusedIngredient={() => setRescueIngredientContext(null)}
        onClose={() => setKitchenRescueOpen(false)}
      />

      <PantryGeneratorModal
        open={pantryModalOpen}
        defaultServings={profile.defaultServings}
        onClose={() => setPantryModalOpen(false)}
        onRecipeGenerated={handlePantryRecipeGenerated}
      />
    </>
  );
}

export default App;
