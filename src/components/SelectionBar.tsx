"use client";

interface SelectionBarProps {
  count: number;
  total: number;
  onClear: () => void;
  onSubmit: () => void;
}

export function SelectionBar({ count, total, onClear, onSubmit }: SelectionBarProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 ${
        count > 0 ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-gray-900 border-t border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold">
              {count} photo{count !== 1 ? "s" : ""} selected
            </span>
            <span className="text-gray-500 text-sm hidden sm:block">
              of {total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="text-gray-400 hover:text-white text-sm transition px-3 py-2"
            >
              Clear
            </button>
            <button
              onClick={onSubmit}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2 rounded-lg transition"
            >
              Submit Selections →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
