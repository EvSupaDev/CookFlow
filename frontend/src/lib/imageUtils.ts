import { logger } from "@/lib/logger";

/**
 * Compresses and resizes a camera or cookbook photo on an offscreen canvas
 * so text remains legible for Groq Vision OCR while keeping payload size fast.
 */
export async function compressImageFileToDataUrl(
  file: File,
  maxDimension = 1400,
  quality = 0.84
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, or WebP).");
  }

  const t0 = performance.now();
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode the selected image."));
      element.src = objectUrl;
    });

    let targetWidth = img.naturalWidth || img.width;
    let targetHeight = img.naturalHeight || img.height;

    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      if (targetWidth >= targetHeight) {
        targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
        targetWidth = maxDimension;
      } else {
        targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
        targetHeight = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, targetWidth);
    canvas.height = Math.max(1, targetHeight);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Browser canvas context unavailable for image processing.");
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const approxKb = Math.round((dataUrl.length * 3) / 4 / 1024);
    const elapsedMs = (performance.now() - t0).toFixed(1);

    logger.info(
      "ImageUtils",
      `Prepared recipe photo '${file.name}' (${img.naturalWidth}x${img.naturalHeight} -> ${canvas.width}x${canvas.height}, ~${approxKb}KB) in ${elapsedMs}ms`
    );

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
