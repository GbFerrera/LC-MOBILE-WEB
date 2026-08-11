"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/auth";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/Login": "Login",
  "/login": "Login",
  "/agenda": "Agenda",
  "/agenda/grade": "Agenda",
  "/clientes": "Clientes",
  "/comandas": "Comandas",
  "/financas": "Financeiro",
  "/transactions": "Transações",
  "/produtos": "Produtos",
  "/equipe": "Equipe",
  "/commissions": "Comissões",
  "/metas": "Metas",
  "/assinaturas": "Assinaturas",
  "/assinaturas/planos": "Planos",
  "/remuneration": "Remuneração",
  "/ajustes": "Ajustes",
};

function resolvePageName(pathname: string) {
  if (pageNames[pathname]) return pageNames[pathname];
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  if (pageNames[normalized]) return pageNames[normalized];
  const parts = normalized.split("/").filter(Boolean);
  for (let i = parts.length - 1; i >= 1; i -= 1) {
    const partial = `/${parts.slice(0, i).join("/")}`;
    if (pageNames[partial]) return pageNames[partial];
  }
  return "";
}

function normalizeAssetUrl(rawUrl: string) {
  const url = String(rawUrl || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    if (typeof window !== "undefined" && window.location.protocol === "https:" && /^http:\/\//i.test(url)) {
      return url.replace(/^http:\/\//i, "https://");
    }
    return url;
  }

  const baseRaw = String(api.defaults.baseURL || "").replace(/\/$/, "");
  const base =
    typeof window !== "undefined" && window.location.protocol === "https:" && /^http:\/\//i.test(baseRaw)
      ? baseRaw.replace(/^http:\/\//i, "https://")
      : baseRaw;
  if (!base) return url;
  if (url.startsWith("/")) return `${base}${url}`;
  return `${base}/${url}`;
}

function applyFavicon(rawHref: string) {
  if (typeof document === "undefined") return;
  const href = normalizeAssetUrl(rawHref);
  if (!href) return;

  const rels = ["icon", "shortcut icon", "apple-touch-icon"];
  rels.forEach((rel) => {
    const links = Array.from(document.querySelectorAll(`link[rel="${rel}"]`)) as HTMLLinkElement[];
    const link =
      links[0] ||
      (() => {
        const el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
        return el;
      })();

    link.href = href;
    if (rel === "icon" || rel === "shortcut icon") link.sizes = "any";
    if (rel !== "apple-touch-icon") {
      const lower = href.toLowerCase();
      if (lower.endsWith(".png")) link.type = "image/png";
      else if (lower.endsWith(".svg")) link.type = "image/svg+xml";
      else if (lower.endsWith(".ico")) link.type = "image/x-icon";
      else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) link.type = "image/jpeg";
      else link.removeAttribute("type");
    }
  });
}

export function DynamicHead() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [companyName, setCompanyName] = React.useState<string>("");
  const [companyLogoUrl, setCompanyLogoUrl] = React.useState<string>("");

  const pageName = React.useMemo(() => (pathname ? resolvePageName(pathname) : ""), [pathname]);
  const appName = React.useMemo(
    () => (companyName || "Link Callendar").trim() || "Link Callendar",
    [companyName]
  );

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = pageName ? `${appName} - ${pageName}` : appName;

    const metaAppleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    if (metaAppleTitle) metaAppleTitle.content = appName;

    const metaAppName = document.querySelector('meta[name="application-name"]') as HTMLMetaElement | null;
    if (metaAppName) metaAppName.content = appName;
  }, [appName, pageName, pathname]);

  React.useEffect(() => {
    let mounted = true;

    const loadCompanyDetails = async () => {
      if (!user?.company_id) return;
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("@linkCallendar:token");
        const res = await api.get("/companies/details", {
          headers: {
            company_id: String(user.company_id),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!mounted) return;
        const name = res?.data?.name;
        if (typeof name === "string" && name.trim()) setCompanyName(name.trim());
        const logoUrl = res?.data?.logo_url;
        if (typeof logoUrl === "string" && logoUrl.trim()) setCompanyLogoUrl(logoUrl);
      } catch {}
    };

    loadCompanyDetails();
    const handler = () => loadCompanyDetails();
    window.addEventListener("companyContextChanged", handler as EventListener);
    window.addEventListener("navigationContextChanged", handler as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("companyContextChanged", handler as EventListener);
      window.removeEventListener("navigationContextChanged", handler as EventListener);
    };
  }, [user?.company_id]);

  React.useLayoutEffect(() => {
    if (!companyLogoUrl) return;
    applyFavicon(companyLogoUrl);
    requestAnimationFrame(() => applyFavicon(companyLogoUrl));
  }, [companyLogoUrl, pathname]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const icon = companyLogoUrl ? normalizeAssetUrl(companyLogoUrl) : "/logo.png";
    const manifestHref = `/manifest.webmanifest?name=${encodeURIComponent(appName)}&icon=${encodeURIComponent(
      icon
    )}&v=${Date.now()}`;

    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = manifestHref;
  }, [appName, companyLogoUrl]);

  return null;
}
