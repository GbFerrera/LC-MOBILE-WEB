"use client";

import { useColor } from "@/contexts/ColorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESET_COLORS = [
  "#3D573F",
  "#6366F1",
  "#3B82F6",
  "#10B981",
  "#E11D48",
  "#8B5CF6",
];

export function AppearanceSettingsSection() {
  const {
    primaryColor,
    setPrimaryColor,
    backgroundColor,
    setBackgroundColor,
    backgroundImageOpacity,
    setBackgroundImageOpacity,
  } = useColor();

  return (
    <div className="space-y-4 rounded-xl border bg-white/80 p-4 backdrop-blur">
      <h3 className="font-semibold text-gray-900">Aparência</h3>

      <div className="space-y-2">
        <Label>Cor principal</Label>
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
        <Label>Opacidade da imagem de fundo ({Math.round(backgroundImageOpacity * 100)}%)</Label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={backgroundImageOpacity}
          onChange={(e) => setBackgroundImageOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
