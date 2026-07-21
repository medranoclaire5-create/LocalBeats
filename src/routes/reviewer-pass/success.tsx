import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { activateReviewAccess } from "~/lib/reviews";

export const Route = createFileRoute("/reviewer-pass/success")({
  component: ReviewerPassSuccessPage,
});

function ReviewerPassSuccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function activate() {
      try {
        const result = await activateReviewAccess();
        if (result.success) {
          setStatus("success");
          setMessage(result.message);
        } else {
          setStatus("error");
          setMessage("Something went wrong. Please try again.");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message ?? "Failed to activate Reviewer Pass.");
      }
    }
    activate();
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      {status === "loading" && (
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100" />
          <div className="mx-auto h-6 w-64 rounded bg-gray-200" />
        </div>
      )}

      {status === "success" && (
        <div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Thank you for purchasing the Reviewer Pass!
          </h1>
          <p className="mb-8 text-lg text-gray-600">{message}</p>
          <a
            href="/"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Browse events →
          </a>
        </div>
      )}

      {status === "error" && (
        <div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="mb-8 text-gray-600">{message}</p>
          <a
            href="/"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Browse events →
          </a>
        </div>
      )}
    </main>
  );
}
