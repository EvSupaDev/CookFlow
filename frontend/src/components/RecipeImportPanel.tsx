import { useRef, useState } from "react";
import { importRawRecipeApi, importRecipeImageApi } from "@/lib/api";
import { compressImageFileToDataUrl } from "@/lib/imageUtils";
import { logger } from "@/lib/logger";
import type { ParsedRecipeDraft } from "@/types/recipe";

interface RecipeImportPanelProps {
  onDraftImported: (draft: ParsedRecipeDraft, sourceLabel: string) => void;
}

export function RecipeImportPanel({ onDraftImported }: RecipeImportPanelProps) {
  const [mode, setMode] = useState<"none" | "photo" | "text">("none");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [sourceHint, setSourceHint] = useState("");
  const [rawPasteText, setRawPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFile = async (file: File) => {
    setIsImporting(true);
    setError(null);
    try {
      const compressedUrl = await compressImageFileToDataUrl(file);
      setPhotoPreviewUrl(compressedUrl);
      const parsed = await importRecipeImageApi(compressedUrl, sourceHint);
      onDraftImported(parsed, "Cookbook photo");
      setMode("none");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not read recipe from photo.";
      logger.error("RecipeImportPanel", `Photo scan failed: ${msg}`);
      setError(msg);
    } finally {
      setIsImporting(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleTextSubmit = async () => {
    const text = rawPasteText.trim();
    if (text.length < 10) {
      setError("Paste a recipe snippet with at least a few ingredients or steps.");
      return;
    }

    setIsImporting(true);
    setError(null);
    try {
      const parsed = await importRawRecipeApi(text);
      onDraftImported(parsed, "Recipe text");
      setRawPasteText("");
      setMode("none");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not parse recipe text.";
      logger.error("RecipeImportPanel", `Text parse failed: ${msg}`);
      setError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Trigger Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === "photo" ? "none" : "photo"));
            setError(null);
          }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold shadow-xs transition-all ${
            mode === "photo"
              ? "bg-stone-900 text-white"
              : "bg-terracotta-600 hover:bg-terracotta-700 text-white"
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          <span>Scan Book / Photo (AI)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === "text" ? "none" : "text"));
            setError(null);
          }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold shadow-xs transition-all ${
            mode === "text"
              ? "bg-stone-900 text-white"
              : "bg-sage-700 hover:bg-sage-800 text-white"
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 3v3M12 18v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M3 12h3M18 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
          </svg>
          <span>Paste Recipe Text (AI)</span>
        </button>
      </div>

      {/* Photo / Cookbook Vision Scanner Drawer */}
      {mode === "photo" && (
        <div
          onPaste={(e) => {
            const file = e.clipboardData?.files?.[0];
            if (file && file.type.startsWith("image/")) {
              e.preventDefault();
              void handleImageFile(file);
            }
          }}
          className="bg-terracotta-50/70 rounded-3xl border border-terracotta-600/25 p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-terracotta-700">
                Cookbook &amp; Recipe Photo Scanner (Groq Vision)
              </span>
              <p className="text-xs text-stone-600 mt-0.5">
                Take a photo, upload an image, or paste a screenshot (Ctrl+V). You must credit the original author before saving.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode("none")}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-2 py-1"
            >
              Close
            </button>
          </div>

          <div>
            <label
              htmlFor="photo-source-hint"
              className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1"
            >
              Book or Author Name <span className="font-normal text-stone-400">(optional hint)</span>
            </label>
            <input
              id="photo-source-hint"
              type="text"
              value={sourceHint}
              onChange={(e) => setSourceHint(e.target.value)}
              placeholder="e.g., Salt Fat Acid Heat — Samin Nosrat"
              className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-600"
            />
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageFile(file);
            }}
            className="hidden"
          />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageFile(file);
            }}
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isImporting}
              onClick={() => cameraInputRef.current?.click()}
              className="py-3.5 px-4 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              <span>{isImporting ? "Scanning..." : "Take Photo"}</span>
            </button>

            <button
              type="button"
              disabled={isImporting}
              onClick={() => uploadInputRef.current?.click()}
              className="py-3.5 px-4 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-60 text-stone-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{isImporting ? "Scanning..." : "Choose Image"}</span>
            </button>
          </div>

          {photoPreviewUrl && (
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-stone-200">
              <img
                src={photoPreviewUrl}
                alt="Scanned recipe preview"
                className="w-12 h-12 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-stone-800 truncate">Last scanned recipe photo</p>
                <p className="text-[11px] text-stone-500">
                  {isImporting ? "Extracting ingredients & steps..." : "Processed into recipe draft"}
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200/80 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Raw Text AI Importer Drawer */}
      {mode === "text" && (
        <div className="bg-sage-50/80 rounded-3xl border border-sage-700/25 p-5 space-y-3.5 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sage-800">
                Smart Recipe Text Importer (Groq AI)
              </span>
              <p className="text-xs text-stone-600 mt-0.5">
                Paste copied recipe text or notes—AI extracts ingredients, steps, timers, and author credit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode("none")}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-2 py-1"
            >
              Close
            </button>
          </div>

          <textarea
            rows={4}
            value={rawPasteText}
            onChange={(e) => setRawPasteText(e.target.value)}
            placeholder="Paste raw recipe text here..."
            className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-sage-700 resize-none"
          />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200/80 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isImporting}
              onClick={() => void handleTextSubmit()}
              className="px-4 py-2 rounded-xl bg-sage-700 hover:bg-sage-800 disabled:opacity-60 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {isImporting ? "Parsing Recipe..." : "Auto-Fill Form with AI"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
