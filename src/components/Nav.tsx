import { useState, useEffect } from "react";
import type { SessionUser } from "~/lib/auth-server";

interface NavProps {
  user: SessionUser | null;
}

export function Nav({ user: initialUser }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(initialUser);

  // Client-side auth check: fetch /api/auth/me on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-600">LocalBeat</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 sm:flex">
          <a
            href="/"
            className="text-sm font-medium text-gray-700 transition-colors hover:text-indigo-600"
          >
            Browse Events
          </a>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {user.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-indigo-600"
              >
                Log In
              </a>
              <a
                href="/signup"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Sign Up
              </a>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="rounded-md p-2 text-gray-600 sm:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-2 sm:hidden">
          <a
            href="/"
            className="block rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Browse Events
          </a>
          {user ? (
            <>
              <p className="px-2 py-2 text-sm text-gray-500">
                Signed in as {user.displayName}
              </p>
              <button
                onClick={handleLogout}
                className="block w-full rounded-md px-2 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="block rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Log In
              </a>
              <a
                href="/signup"
                className="mt-1 block rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white"
              >
                Sign Up
              </a>
            </>
          )}
        </div>
      )}
    </header>
  );
}
