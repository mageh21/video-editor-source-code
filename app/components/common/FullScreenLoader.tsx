import clsx from "clsx";

interface FullScreenLoaderProps {
  message?: string;
  subtle?: boolean;
}

export function FullScreenLoader({ message = "Loading...", subtle = false }: FullScreenLoaderProps) {
  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        subtle ? "bg-black/40 backdrop-blur" : "bg-black/90"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-t-white border-white/30 rounded-full animate-spin" />
        <p className="text-sm text-gray-300 tracking-wide uppercase">{message}</p>
      </div>
    </div>
  );
}

export default FullScreenLoader;
