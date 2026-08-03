export const MAX_SALON_PHOTOS = 5;
export const MAX_IMAGE_SIZE_MB = 3;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Format non supporté. Utilisez une image JPG, PNG ou WebP.";
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `Fichier trop lourd (max ${MAX_IMAGE_SIZE_MB} Mo).`;
  }
  return null;
}

// Recadre automatiquement une image en carré (recadrage centré), pour la
// photo de profil du salon. Redimensionne aussi à une taille raisonnable
// (600x600 max) pour garder des fichiers légers.
export function cropToSquare(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const targetSize = Math.min(side, 600);

      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Impossible de traiter l'image."));
        return;
      }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, targetSize, targetSize);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Impossible de traiter l'image."));
            return;
          }
          resolve(new File([blob], file.name, { type: blob.type }));
        },
        file.type === "image/png" ? "image/png" : "image/jpeg",
        0.9
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire cette image."));
    };
    img.src = url;
  });
}
