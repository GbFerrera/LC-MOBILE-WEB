import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function normalizeIcon(rawIcon: string) {
  const icon = String(rawIcon || "").trim();
  if (!icon) return "/logo.png";
  if (/^http:\/\//i.test(icon)) return icon.replace(/^http:\/\//i, "https://");
  if (/^https:\/\//i.test(icon)) return icon;
  if (icon.startsWith("/")) return icon;
  return `/${icon}`;
}

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name =
    String(searchParams.get("name") || "Link Callendar - Barbeiro").trim() || "Link Callendar - Barbeiro";
  const icon = normalizeIcon(String(searchParams.get("icon") || "/logo.png"));

  const manifest = {
    name,
    short_name: name,
    description: `Aplicativo da ${name}`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    orientation: "portrait",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    serviceworker: {
      src: "/notification-sw.js",
      scope: "/",
    },
    icons: [
      {
        src: icon,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: icon,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any",
      },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
