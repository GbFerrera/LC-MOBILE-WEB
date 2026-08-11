"use client"

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getContrastColor } from "@/lib/utils"
import { api } from "@/services/api"
import { useAuth } from "@/hooks/auth"
import { resetThemeStyles } from "@/lib/session-storage"

interface ColorContextType {
  primaryColor: string
  setPrimaryColor: (color: string) => void
  backgroundColor: string
  setBackgroundColor: (color: string) => void
  backgroundImageUrl: string | null
  setBackgroundImageUrl: (url: string | null) => void
  backgroundImageOpacity: number
  setBackgroundImageOpacity: (opacity: number) => void
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

function applyColorToCSS(hex: string) {
  const foregroundHex = getContrastColor(hex)

  document.documentElement.style.setProperty("--primary", hex)
  document.documentElement.style.setProperty("--primary-foreground", foregroundHex)
  document.documentElement.style.setProperty("--sidebar-primary", hex)
  document.documentElement.style.setProperty("--sidebar-primary-foreground", foregroundHex)
  document.documentElement.style.setProperty("--ring", hex)

  let themeMeta = document.querySelector('meta[name="theme-color"]')
  if (!themeMeta) {
    themeMeta = document.createElement("meta")
    themeMeta.setAttribute("name", "theme-color")
    document.head.appendChild(themeMeta)
  }
  themeMeta.setAttribute("content", hex)
}

function applyBackgroundToCSS(params: {
  backgroundColor: string
  backgroundImageUrl: string | null
  backgroundImageOpacity: number
}) {
  const opacity = Math.max(0, Math.min(1, params.backgroundImageOpacity))

  if (params.backgroundColor) {
    document.documentElement.style.setProperty("--app-bg-color", params.backgroundColor)
  } else {
    document.documentElement.style.removeProperty("--app-bg-color")
  }

  if (params.backgroundImageUrl) {
    document.documentElement.style.setProperty(
      "--app-bg-image",
      `url("${params.backgroundImageUrl}")`
    )
  } else {
    document.documentElement.style.setProperty("--app-bg-image", "none")
  }

  document.documentElement.style.setProperty("--app-bg-image-opacity", String(opacity))
}

export function ColorProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColorState] = useState("#3D583F")
  const [backgroundColor, setBackgroundColorState] = useState("")
  const [backgroundImageUrl, setBackgroundImageUrlState] = useState<string | null>(null)
  const [backgroundImageOpacity, setBackgroundImageOpacityState] = useState<number>(0.2)
  const { user } = useAuth()

  useEffect(() => {
    const savedColor = localStorage.getItem("primaryColor")
    if (savedColor) {
      setPrimaryColorState(savedColor)
      applyColorToCSS(savedColor)
    } else {
      applyColorToCSS("#3D583F")
    }

    const savedBgColor = localStorage.getItem("appBackgroundColor")
    if (savedBgColor) {
      setBackgroundColorState(savedBgColor)
    }

    const savedBgImageUrl = localStorage.getItem("appBackgroundImageUrl")
    const bgImageUrl = savedBgImageUrl || null
    if (savedBgImageUrl) setBackgroundImageUrlState(savedBgImageUrl)

    const savedBgOpacity = localStorage.getItem("appBackgroundImageOpacity")
    let bgOpacity = 0.2
    if (savedBgOpacity) {
      const parsed = Number(savedBgOpacity)
      if (!Number.isNaN(parsed)) {
        bgOpacity = Math.max(0, Math.min(1, parsed))
        setBackgroundImageOpacityState(bgOpacity)
      }
    }

    applyBackgroundToCSS({
      backgroundColor: savedBgColor || "",
      backgroundImageUrl: bgImageUrl,
      backgroundImageOpacity: bgOpacity,
    })
  }, [])

  useEffect(() => {
    if (user) return

    setPrimaryColorState("#3D583F")
    setBackgroundColorState("")
    setBackgroundImageUrlState(null)
    setBackgroundImageOpacityState(0.2)
    resetThemeStyles()
  }, [user])

  useEffect(() => {
    const handleSessionCleared = () => {
      setPrimaryColorState("#3D583F")
      setBackgroundColorState("")
      setBackgroundImageUrlState(null)
      setBackgroundImageOpacityState(0.2)
      resetThemeStyles()
    }

    window.addEventListener("appSessionCleared", handleSessionCleared)
    return () => window.removeEventListener("appSessionCleared", handleSessionCleared)
  }, [])

  useEffect(() => {
    if (!user?.company_id) return

    api
      .get("/companies/details", {
        headers: {
          company_id: String(user.company_id),
          Authorization: `Bearer ${localStorage.getItem("@linkCallendar:token") || localStorage.getItem("token") || ""}`,
        },
      })
      .then((res) => {
        const serverColor = res?.data?.primary_color
        if (serverColor && typeof serverColor === "string") {
          setPrimaryColorState(serverColor)
          localStorage.setItem("primaryColor", serverColor)
          applyColorToCSS(serverColor)
        }

        const serverBgColor = res?.data?.background_color
        if (serverBgColor && typeof serverBgColor === "string") {
          setBackgroundColorState(serverBgColor)
          localStorage.setItem("appBackgroundColor", serverBgColor)
        }

        const serverBgImageUrl = res?.data?.background_image_url
        if (serverBgImageUrl === null) {
          setBackgroundImageUrlState(null)
          localStorage.removeItem("appBackgroundImageUrl")
        } else if (serverBgImageUrl && typeof serverBgImageUrl === "string") {
          setBackgroundImageUrlState(serverBgImageUrl)
          localStorage.setItem("appBackgroundImageUrl", serverBgImageUrl)
        }

        const serverOpacity = res?.data?.background_image_opacity
        if (serverOpacity !== undefined && serverOpacity !== null && serverOpacity !== "") {
          const parsed = Number(serverOpacity)
          if (!Number.isNaN(parsed)) {
            const normalized = Math.max(0, Math.min(1, parsed))
            setBackgroundImageOpacityState(normalized)
            localStorage.setItem("appBackgroundImageOpacity", String(normalized))
          }
        }
      })
      .catch(() => {})
  }, [user?.company_id])

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color)
    localStorage.setItem("primaryColor", color)
    applyColorToCSS(color)

    if (!user?.company_id) return
    api
      .put(
        `/companies/${user.company_id}`,
        { primary_color: color },
        {
          headers: {
            company_id: String(user.company_id),
            Authorization: `Bearer ${localStorage.getItem("@linkCallendar:token") || localStorage.getItem("token") || ""}`,
          },
        }
      )
      .catch(() => {})
  }

  const setBackgroundColor = (color: string) => {
    setBackgroundColorState(color)
    if (color) localStorage.setItem("appBackgroundColor", color)
    else localStorage.removeItem("appBackgroundColor")
    applyBackgroundToCSS({ backgroundColor: color, backgroundImageUrl, backgroundImageOpacity })

    if (!user?.company_id) return
    api
      .put(
        `/companies/${user.company_id}`,
        { background_color: color || null },
        {
          headers: {
            company_id: String(user.company_id),
            Authorization: `Bearer ${localStorage.getItem("@linkCallendar:token") || localStorage.getItem("token") || ""}`,
          },
        }
      )
      .catch(() => {})
  }

  const setBackgroundImageUrl = (url: string | null) => {
    setBackgroundImageUrlState(url)
    if (url) localStorage.setItem("appBackgroundImageUrl", url)
    else localStorage.removeItem("appBackgroundImageUrl")
    applyBackgroundToCSS({ backgroundColor, backgroundImageUrl: url, backgroundImageOpacity })

    if (!user?.company_id) return
    api
      .put(
        `/companies/${user.company_id}`,
        { background_image_url: url },
        {
          headers: {
            company_id: String(user.company_id),
            Authorization: `Bearer ${localStorage.getItem("@linkCallendar:token") || localStorage.getItem("token") || ""}`,
          },
        }
      )
      .catch(() => {})
  }

  const setBackgroundImageOpacity = (opacity: number) => {
    const normalized = Math.max(0, Math.min(1, opacity))
    setBackgroundImageOpacityState(normalized)
    localStorage.setItem("appBackgroundImageOpacity", String(normalized))
    applyBackgroundToCSS({ backgroundColor, backgroundImageUrl, backgroundImageOpacity: normalized })

    if (!user?.company_id) return
    api
      .put(
        `/companies/${user.company_id}`,
        { background_image_opacity: normalized },
        {
          headers: {
            company_id: String(user.company_id),
            Authorization: `Bearer ${localStorage.getItem("@linkCallendar:token") || localStorage.getItem("token") || ""}`,
          },
        }
      )
      .catch(() => {})
  }

  useEffect(() => {
    if (primaryColor) applyColorToCSS(primaryColor)
  }, [primaryColor])

  useEffect(() => {
    applyBackgroundToCSS({ backgroundColor, backgroundImageUrl, backgroundImageOpacity })
  }, [backgroundColor, backgroundImageUrl, backgroundImageOpacity])

  return (
    <ColorContext.Provider
      value={{
        primaryColor,
        setPrimaryColor,
        backgroundColor,
        setBackgroundColor,
        backgroundImageUrl,
        setBackgroundImageUrl,
        backgroundImageOpacity,
        setBackgroundImageOpacity,
      }}
    >
      {children}
    </ColorContext.Provider>
  )
}

export function useColor() {
  const ctx = useContext(ColorContext)
  if (!ctx) throw new Error("useColor must be used within a ColorProvider")
  return ctx
}
