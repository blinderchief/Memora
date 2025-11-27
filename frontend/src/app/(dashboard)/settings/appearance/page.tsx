"use client";

import { useState } from "react";
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Type,
  Layout,
  Eye,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const themes = [
  {
    id: "light",
    name: "Light",
    icon: Sun,
    preview: "bg-white border-slate-200",
    accent: "bg-slate-900",
  },
  {
    id: "dark",
    name: "Dark",
    icon: Moon,
    preview: "bg-slate-900 border-slate-700",
    accent: "bg-white",
  },
  {
    id: "system",
    name: "System",
    icon: Monitor,
    preview: "bg-gradient-to-r from-white to-slate-900 border-slate-400",
    accent: "bg-violet-500",
  },
];

const accentColors = [
  { id: "violet", name: "Violet", color: "bg-violet-500" },
  { id: "blue", name: "Blue", color: "bg-blue-500" },
  { id: "emerald", name: "Emerald", color: "bg-emerald-500" },
  { id: "orange", name: "Orange", color: "bg-orange-500" },
  { id: "pink", name: "Pink", color: "bg-pink-500" },
  { id: "cyan", name: "Cyan", color: "bg-cyan-500" },
];

export default function AppearancePage() {
  const [selectedTheme, setSelectedTheme] = useState("system");
  const [selectedAccent, setSelectedAccent] = useState("violet");
  const [fontSize, setFontSize] = useState("medium");
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Appearance
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Customize the look and feel of Memora
        </p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {themes.map((theme) => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedTheme === theme.id
                      ? "border-violet-500 bg-violet-500/5"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div
                    className={`h-24 rounded-lg border ${theme.preview} mb-3`}
                  >
                    <div className="p-2 space-y-1">
                      <div className={`h-2 w-12 rounded ${theme.accent}`} />
                      <div className="h-2 w-20 rounded bg-slate-300 dark:bg-slate-600" />
                      <div className="h-2 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {theme.name}
                    </span>
                  </div>
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Accent Color
          </CardTitle>
          <CardDescription>
            Personalize buttons, links, and highlights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((accent) => (
              <button
                key={accent.id}
                onClick={() => setSelectedAccent(accent.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedAccent === accent.id
                    ? "border-violet-500 bg-violet-500/5"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <div className={`h-4 w-4 rounded-full ${accent.color}`} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {accent.name}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography
          </CardTitle>
          <CardDescription>
            Adjust text size for better readability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Font Size
              </p>
              <p className="text-sm text-slate-500">
                Choose your preferred text size
              </p>
            </div>
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-slate-600 dark:text-slate-400">Preview:</p>
            <p
              className={`mt-2 text-slate-900 dark:text-white ${
                fontSize === "small"
                  ? "text-sm"
                  : fontSize === "large"
                    ? "text-lg"
                    : "text-base"
              }`}
            >
              The quick brown fox jumps over the lazy dog. Memora helps you
              remember everything that matters.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Layout
          </CardTitle>
          <CardDescription>
            Configure the interface layout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Compact Mode
              </p>
              <p className="text-sm text-slate-500">
                Reduce spacing for more content density
              </p>
            </div>
            <Switch checked={compactMode} onCheckedChange={setCompactMode} />
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility
          </CardTitle>
          <CardDescription>
            Settings for improved accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Animations
              </p>
              <p className="text-sm text-slate-500">
                Enable smooth transitions and animations
              </p>
            </div>
            <Switch checked={animations} onCheckedChange={setAnimations} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Reduced Motion
              </p>
              <p className="text-sm text-slate-500">
                Minimize motion for vestibular disorders
              </p>
            </div>
            <Switch
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Reset to Defaults
              </p>
              <p className="text-sm text-slate-500">
                Restore all appearance settings to their original values
              </p>
            </div>
            <Button variant="outline">Reset All</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
