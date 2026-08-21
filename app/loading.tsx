export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        aria-label="Chargement"
        className="h-9 w-9 animate-spin rounded-full border-2 border-beige-dark border-t-or"
      />
    </div>
  );
}
