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
