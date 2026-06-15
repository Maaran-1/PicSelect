import Link from "next/link";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { name?: string; count?: string };
}) {
  const name = searchParams.name || "there";
  const count = parseInt(searchParams.count || "0", 10);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Checkmark */}
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-white text-2xl font-bold mb-2">
          All done, {decodeURIComponent(name)}!
        </h1>
        <p className="text-gray-400 text-base mb-2">
          Your selection of{" "}
          <span className="text-white font-semibold">
            {count} photo{count !== 1 ? "s" : ""}
          </span>{" "}
          has been submitted successfully.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Your photographer will be notified and will get back to you soon.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left mb-6">
          <p className="text-gray-300 text-sm font-medium mb-1">What happens next?</p>
          <ul className="text-gray-500 text-sm space-y-1">
            <li>→ Your photographer reviews your selections</li>
            <li>→ They edit and deliver the chosen photos</li>
            <li>→ You&apos;ll receive the final images</li>
          </ul>
        </div>

        <Link
          href="/"
          className="text-gray-400 hover:text-white text-sm transition underline underline-offset-4"
        >
          ← Go back to gallery
        </Link>
      </div>
    </div>
  );
}
