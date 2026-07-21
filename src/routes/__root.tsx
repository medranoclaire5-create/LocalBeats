import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getCurrentUser } from "~/lib/auth-server";
import { Nav } from "~/components/Nav";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LocalBeat — Discover Local Events" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  loader: () => getCurrentUser(),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  const user = Route.useLoaderData();

  return (
    <RootDocument>
      <Nav user={user ?? null} />
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
