"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useColor } from "@/contexts/ColorContext";
import { useAuth } from "@/hooks/auth";
import { api } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const PRESET_COLORS = [
  "#3D573F",
  "#6366F1",
  "#3B82F6",
  "#10B981",
  "#E11D48",
  "#8B5CF6",
];

export function AppearanceSettingsSection() {
  const { user } = useAuth();
  const {
    primaryColor,
    setPrimaryColor,
    backgroundColor,
    setBackgroundColor,
    backgroundImageUrl,
    setBackgroundImageUrl,
    backgroundImageOpacity,
    setBackgroundImageOpacity,
  } = useColor();

  const [bgImageUrlDraft, setBgImageUrlDraft] = useState(backgroundImageUrl || "");
  const [isUploadingBgImage, setIsUploadingBgImage] = useState(false);

  useEffect(() => {
    setBgImageUrlDraft(backgroundImageUrl || "");
  }, [backgroundImageUrl]);

  const authHeaders = () => ({
    company_id: user?.company_id?.toString() || "0",
    Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("@linkCallendar:token") || ""}`,
  });

  return (
    <div className="space-y-4 rounded-xl border bg-white/80 p-4 backdrop-blur">
      <h3 className="font-semibold text-gray-900">Aparência</h3>

      <div className="space-y-2">
        <Label>Cor principal</Label>
        <p className="text-sm text-muted-foreground">Define a cor principal do sistema e barra superior</p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-12 w-16 rounded border"
          />
          <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="h-8 w-8 rounded-full border"
              style={{ backgroundColor: color }}
              onClick={() => setPrimaryColor(color)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cor de fundo</Label>
        <p className="text-sm text-muted-foreground">Cor de fundo das telas (sincroniza com o painel)</p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={backgroundColor || "#F1F1E7"}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="h-12 w-16 rounded border"
          />
          <Input
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            placeholder="#F1F1E7"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Imagem de fundo</Label>
        <Input
          value={bgImageUrlDraft}
          onChange={(e) => setBgImageUrlDraft(e.target.value)}
          placeholder="Cole a URL (opcional)"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBackgroundImageUrl(bgImageUrlDraft.trim() ? bgImageUrlDraft.trim() : null)}
          >
            Aplicar URL
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!backgroundImageUrl}
            onClick={async () => {
              try {
                await api.delete("/companies/background", { headers: authHeaders() });
              } catch {}
              setBackgroundImageUrl(null);
            }}
          >
            Remover
          </Button>
        </div>
        <Input
          type="file"
          accept="image/*"
          disabled={isUploadingBgImage}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              setIsUploadingBgImage(true);
              const base64Image: string = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ""));
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });

              const resp = await api.post(
                "/companies/background",
                { base64Image, opacity: backgroundImageOpacity },
                { headers: authHeaders() }
              );
              setBackgroundImageUrl(resp.data?.background_image_url || null);
              if (resp.data?.background_image_opacity !== undefined && resp.data?.background_image_opacity !== null) {
                setBackgroundImageOpacity(Number(resp.data.background_image_opacity));
              }
            } catch {
              toast.error("Erro ao enviar imagem de fundo");
            } finally {
              setIsUploadingBgImage(false);
              e.target.value = "";
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Opacidade da imagem de fundo ({Math.round(backgroundImageOpacity * 100)}%)</Label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(backgroundImageOpacity * 100)}
          onChange={(e) => setBackgroundImageOpacity(Number(e.target.value) / 100)}
          className="w-full"
        />
      </div>

      <div
        className="relative overflow-hidden rounded-xl border aspect-[16/9]"
        style={{ backgroundColor: backgroundColor || "transparent" }}
      >
        {backgroundImageUrl ? (
          <img
            src={backgroundImageUrl}
            alt="Preview do plano de fundo"
            className="h-full w-full object-cover"
            style={{ opacity: backgroundImageOpacity }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Nenhuma imagem configurada
          </div>
        )}
      </div>
    </div>
  );
}
