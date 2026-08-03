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

// Vérifie si une image est (à peu près) carrée — utilisé pour la photo de
// profil, où l'on préfère avertir plutôt que bloquer, pour ne pas frustrer
// la personne si son fichier n'est pas parfaitement carré.
export function checkIsSquareish(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = img.width / img.height;
      URL.revokeObjectURL(url);
      resolve(ratio > 0.9 && ratio < 1.1);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(true); // en cas d'échec de lecture, ne pas bloquer inutilement
    };
    img.src = url;
  });
}
