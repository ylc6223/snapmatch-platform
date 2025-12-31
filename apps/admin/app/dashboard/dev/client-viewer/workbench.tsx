"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Folder,
  Grid,
  Hash,
  Heart,
  Info,
  LayoutTemplate,
  Languages,
  Maximize,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PenTool,
  Save
} from "lucide-react";
import { Montserrat } from "next/font/google";

import { ThemeToggleButton, useThemeTransition } from "@/components/ui/theme-toggle-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import styles from "./lumina-theme.module.css";

type ViewMode = "grid" | "single" | "compare";

type Photo = {
  id: string;
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
  timestamp: string;
  filename: string;
};

type SelectionState = {
  liked: boolean;
  book: boolean;
  retouch: boolean;
};

type ProjectConfig = {
  packageName: string;
  maxLikes: number;
  maxBook: number;
  maxRetouch: number;
  tokenExpires: string;
};

const luminaMontserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lumina-montserrat"
});

const PROJECT_CONFIG: ProjectConfig = {
  packageName: "Wedding Platinum - 2024",
  maxLikes: 150,
  maxBook: 50,
  maxRetouch: 20,
  tokenExpires: "2d 14h left"
};

function generateMockPhotos(count: number): Photo[] {
  const photos: Photo[] = [];
  for (let index = 0; index < count; index++) {
    const isPortrait = index % 3 === 0;
    const width = isPortrait ? 600 : 900;
    const height = 600;
    const id = `img_${index + 1}`;

    photos.push({
      id,
      url: `https://picsum.photos/seed/${id}/${width}/${height}`,
      width,
      height,
      aspectRatio: width / height,
      timestamp: new Date(Date.now() - (count - index) * 60_000).toISOString(),
      filename: `DSC_${1000 + index}.jpg`
    });
  }
  return photos;
}

type Translation = {
  expires: string;
  assets: string;
  views: { grid: string; single: string; compare: string };
  stats: { liked: string; book: string; retouch: string };
  actions: { save: string; submit: string };
  nav: { collections: string; filters: string; sort: string };
  folders: { all: string; highlights: string; ceremony: string; reception: string };
  filters: { liked: string; book: string; retouch: string; untagged: string };
  sort: { time: string; name: string };
  panel: {
    noSelection: string;
    noSelectionTip: string;
    raw: string;
    pkgStatus: string;
    tip: string;
    tipText: string;
    btnLike: string;
    btnBook: string;
    btnRetouch: string;
  };
  canvas: { proof: string; brand: string; compareA: string; compareB: string };
};

type Locale = "en" | "zh";

const TRANSLATIONS: Record<Locale, Translation> = {
  en: {
    expires: "Expires",
    assets: "ASSETS",
    views: { grid: "Grid View", single: "Single View", compare: "Compare View" },
    stats: { liked: "Likes", book: "Album", retouch: "Retouch" },
    actions: { save: "Save Draft", submit: "SUBMIT SELECTION" },
    nav: { collections: "Collections", filters: "Smart Filters", sort: "Sort By" },
    folders: {
      all: "All Photos",
      highlights: "Highlights",
      ceremony: "Ceremony",
      reception: "Reception"
    },
    filters: { liked: "Liked", book: "For Album", retouch: "To Retouch", untagged: "Untagged" },
    sort: { time: "Time", name: "Name" },
    panel: {
      noSelection: "No Photo Selected",
      noSelectionTip: "Select a photo from the canvas or filmstrip to view details and apply tags.",
      raw: "RAW",
      pkgStatus: "Package Status",
      tip: "Tip",
      tipText: "Use arrow keys to navigate. Press SPACE to toggle zoom in Single view.",
      btnLike: "Like",
      btnBook: "Album",
      btnRetouch: "Retouch"
    },
    canvas: {
      proof: "PROOF",
      brand: "LUMINA",
      compareA: "A (Selected)",
      compareB: "B (Compare)"
    }
  },
  zh: {
    expires: "剩余有效期",
    assets: "张照片",
    views: { grid: "网格视图", single: "单张精细", compare: "对比模式" },
    stats: { liked: "喜欢", book: "入册", retouch: "精修" },
    actions: { save: "保存草稿", submit: "提交选片" },
    nav: { collections: "作品集", filters: "智能筛选", sort: "排序方式" },
    folders: {
      all: "全部照片",
      highlights: "高光时刻",
      ceremony: "婚礼仪式",
      reception: "晚宴接待"
    },
    filters: { liked: "已选喜欢", book: "入册精选", retouch: "要求精修", untagged: "未标记" },
    sort: { time: "拍摄时间", name: "文件名称" },
    panel: {
      noSelection: "未选择照片",
      noSelectionTip: "请在画布或下方胶片条中选择照片以查看详情并进行标记。",
      raw: "RAW原片",
      pkgStatus: "套餐额度使用",
      tip: "提示",
      tipText: "使用键盘方向键切换照片。在单张视图下按空格键可放大查看细节。",
      btnLike: "喜欢",
      btnBook: "入册",
      btnRetouch: "精修"
    },
    canvas: {
      proof: "样片",
      brand: "LUMINA",
      compareA: "A (当前选择)",
      compareB: "B (对比参考)"
    }
  }
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatPill({
  label,
  count,
  max,
  className
}: {
  label: string;
  count: number;
  max: number;
  className?: string;
}) {
  const isOver = count > max;

  return (
    <div className={cn("flex h-8 items-center gap-3 px-3", className)}>
      <span className="w-12 truncate text-right text-xs font-semibold tracking-wider opacity-70">
        {label}
      </span>
      <span className={cn("font-mono text-[13px] leading-none", isOver && "text-lumina-amber")}>
        {count}
        <span className="opacity-40">/{max}</span>
      </span>
    </div>
  );
}

function LeftNavItem({
  id,
  label,
  icon: Icon,
  active,
  count,
  onSelect
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  count?: number;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        "group flex h-10 w-full items-center justify-between border-l-2 px-4 text-xs transition-all",
        active
          ? "border-lumina-primary bg-lumina-block font-medium text-white"
          : "text-lumina-muted hover:bg-lumina-block-hover hover:text-lumina-paper border-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          size={16}
          className={cn(
            active ? "text-lumina-primary" : "group-hover:text-lumina-paper/90 transition-colors"
          )}
        />
        <span>{label}</span>
      </div>
      {typeof count === "number" ? (
        <span className="font-mono text-[10px] opacity-40">{count}</span>
      ) : null}
    </button>
  );
}

function CanvasBadge({
  active,
  className,
  icon: Icon
}: {
  active?: boolean;
  className: string;
  icon: React.ComponentType<{ size?: number; fill?: string }>;
}) {
  if (!active) return null;
  return (
    <div
      className={cn(
        "flex size-5 items-center justify-center rounded-full text-white shadow-sm ring-1 ring-black/20",
        className
      )}
    >
      <Icon size={10} fill="currentColor" />
    </div>
  );
}

function UsageBar({
  label,
  current,
  max,
  barClassName
}: {
  label: string;
  current: number;
  max: number;
  barClassName: string;
}) {
  const pct = Math.min((current / max) * 100, 100);
  const isFull = current >= max;

  return (
    <div className="mb-5">
      <div className="mb-2 flex justify-between text-[10px] font-bold tracking-wider uppercase">
        <span className="text-lumina-muted/90">{label}</span>
        <span className={cn("font-mono", isFull ? "text-lumina-amber" : "text-lumina-paper/80")}>
          {current}/{max}
        </span>
      </div>
      <div className="bg-lumina-block h-1.5 w-full overflow-hidden rounded-full shadow-inner">
        <div
          className={cn("h-full transition-all duration-500 ease-out", barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LuminaSelectWorkbench() {
  const { resolvedTheme, setTheme } = useTheme();
  const { startTransition } = useThemeTransition();
  const currentTheme = resolvedTheme === "dark" ? "dark" : "light";

  const [photos] = React.useState(() => generateMockPhotos(150));
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [activeId, setActiveId] = React.useState<string | null>(() => photos[0]?.id ?? null);
  const [selections, setSelections] = React.useState<Record<string, SelectionState>>({});
  const [filter, setFilter] = React.useState<string>("all");
  const [lang, setLang] = React.useState<Locale>("zh");
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = React.useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = React.useState(false);
  const filmstripRef = React.useRef<HTMLDivElement>(null);

  const t: Translation = TRANSLATIONS[lang];

  const selectionCounts = React.useMemo(() => {
    let liked = 0;
    let book = 0;
    let retouch = 0;
    for (const selection of Object.values(selections)) {
      if (selection.liked) liked++;
      if (selection.book) book++;
      if (selection.retouch) retouch++;
    }
    return { liked, book, retouch };
  }, [selections]);

  const filteredPhotos = React.useMemo(() => {
    if (filter === "liked") return photos.filter((photo) => selections[photo.id]?.liked);
    if (filter === "book") return photos.filter((photo) => selections[photo.id]?.book);
    if (filter === "retouch") return photos.filter((photo) => selections[photo.id]?.retouch);
    if (filter === "untagged") {
      return photos.filter((photo) => {
        const selection = selections[photo.id];
        return !selection?.liked && !selection?.book && !selection?.retouch;
      });
    }
    return photos;
  }, [filter, photos, selections]);

  const activePhoto = React.useMemo(
    () => photos.find((photo) => photo.id === activeId) ?? null,
    [activeId, photos]
  );

  const handleToggleSelection = React.useCallback((id: string, key: keyof SelectionState) => {
    setSelections((prev) => {
      const current = prev[id] ?? { liked: false, book: false, retouch: false };
      return { ...prev, [id]: { ...current, [key]: !current[key] } };
    });
  }, []);

  const handleSelectPhoto = React.useCallback((id: string) => {
    setActiveId(id);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeId) return;

      if (event.key === "1") handleToggleSelection(activeId, "liked");
      if (event.key === "2") handleToggleSelection(activeId, "book");
      if (event.key === "3") handleToggleSelection(activeId, "retouch");

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        const currentIndex = filteredPhotos.findIndex((photo) => photo.id === activeId);
        if (currentIndex >= 0 && currentIndex < filteredPhotos.length - 1) {
          setActiveId(filteredPhotos[currentIndex + 1]?.id ?? null);
        }
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        const currentIndex = filteredPhotos.findIndex((photo) => photo.id === activeId);
        if (currentIndex > 0) {
          setActiveId(filteredPhotos[currentIndex - 1]?.id ?? null);
        }
      }

      if (event.key === "g") setViewMode("grid");
      if (event.key === "s") setViewMode("single");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeId, filteredPhotos, handleToggleSelection]);

  React.useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`lumina-filmstrip-${activeId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  const canvas = React.useMemo(() => {
    if (viewMode === "single") {
      const photo = filteredPhotos.find((p) => p.id === activeId) ?? filteredPhotos[0];
      if (!photo) {
        return (
          <div className="flex h-full items-center justify-center text-gray-500">
            {t.panel.noSelection}
          </div>
        );
      }

      return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#050505] p-8">
          <div className="relative max-h-full max-w-full shadow-2xl">
            <img
              src={photo.url}
              className="border-lumina-graphite max-h-[calc(100svh-12rem)] max-w-full border object-contain shadow-2xl"
              alt="Main view"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20 select-none">
              <div className="-rotate-12 text-6xl font-black tracking-widest text-white mix-blend-overlay">
                {t.canvas.proof}
              </div>
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-8 p-8">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-center">
                    <span className="-rotate-12 text-xl font-bold text-white/10">
                      {t.canvas.brand}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === "compare") {
      const activeIdx = filteredPhotos.findIndex((photo) => photo.id === activeId);
      const first = filteredPhotos[activeIdx >= 0 ? activeIdx : 0];
      const second =
        filteredPhotos[activeIdx >= 0 && activeIdx + 1 < filteredPhotos.length ? activeIdx + 1 : 0];

      if (!first) return null;

      return (
        <div className="grid h-full w-full grid-cols-2 gap-4 p-4">
          {[first, second].filter(Boolean).map((photo, index) => (
            <div
              key={photo.id}
              className="border-lumina-graphite bg-lumina-block relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border"
            >
              <img
                src={photo.url}
                className="max-h-full max-w-full object-contain"
                alt={photo.filename}
              />
              <div className="border-lumina-graphite absolute top-4 left-4 rounded border bg-black/60 px-3 py-1.5 font-mono text-xs font-medium text-gray-200 backdrop-blur">
                {index === 0 ? t.canvas.compareA : t.canvas.compareB}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="lumina-scrollbar bg-lumina-ink h-full overflow-y-auto p-6">
        <div className="mx-auto max-w-[1600px] columns-1 gap-5 sm:columns-2 md:columns-3 xl:columns-4">
          {filteredPhotos.map((photo) => {
            const isActive = photo.id === activeId;
            const selection = selections[photo.id];

            return (
              <div
                key={photo.id}
                onClick={() => handleSelectPhoto(photo.id)}
                className={cn(
                  "group relative mb-4 cursor-pointer break-inside-avoid overflow-hidden rounded-lg border-2 transition-all duration-200",
                  isActive
                    ? "border-lumina-primary z-10 scale-[1.02] shadow-[0_0_0_4px_rgba(0,202,224,0.18)]"
                    : "hover:border-lumina-graphite border-transparent hover:scale-[1.01]"
                )}
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="bg-lumina-slate block h-auto w-full"
                  loading="lazy"
                />
                <div
                  className={cn(
                    "absolute inset-0 bg-black/0 transition-colors duration-300",
                    isActive ? "bg-transparent" : "group-hover:bg-black/20"
                  )}
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                  <CanvasBadge active={selection?.liked} className="bg-lumina-amber" icon={Heart} />
                  <CanvasBadge active={selection?.book} className="bg-blue-600" icon={BookOpen} />
                  <CanvasBadge
                    active={selection?.retouch}
                    className="bg-lumina-retouch"
                    icon={PenTool}
                  />
                </div>
                <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-gray-200 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                  {photo.filename}
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-24" />
      </div>
    );
  }, [activeId, filteredPhotos, handleSelectPhoto, selections, t, viewMode]);

  return (
    <div
      className={cn(
        luminaMontserrat.variable,
        styles.luminaTheme,
        "bg-lumina-ink text-lumina-paper selection:bg-lumina-primary fixed inset-0 z-[60] flex h-svh w-screen flex-col overflow-hidden selection:text-white"
      )}
    >
      <header className="border-lumina-graphite bg-lumina-panel z-50 flex h-14 items-center justify-between border-b shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all select-none">
        <div className="flex h-full items-center">
          <div className="hover:bg-lumina-slate flex h-full w-14 items-center justify-center transition-colors">
            <Link
              href="/dashboard"
              className="group flex size-full items-center justify-center"
              title="返回后台"
            >
              <div className="bg-lumina-primary size-5 rounded-sm shadow-lg transition-transform group-hover:scale-110" />
            </Link>
          </div>

          <div className="flex h-full min-w-[240px] flex-col justify-center px-5">
            <h1 className="max-w-[200px] truncate text-sm leading-tight font-bold tracking-tight">
              {PROJECT_CONFIG.packageName}
            </h1>
            <div className="text-lumina-muted/90 mt-0.5 flex items-center gap-2 font-mono text-[10px]">
              <span className="text-lumina-amber font-medium tabular-nums">
                {PROJECT_CONFIG.tokenExpires} {t.expires}
              </span>
              <span className="opacity-30">|</span>
              <span className="tabular-nums">
                {photos.length} {t.assets}
              </span>
            </div>
          </div>

          <div className="flex h-full items-center gap-1 px-3">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-2 transition-all",
                viewMode === "grid"
                  ? "bg-lumina-block ring-lumina-graphite text-white shadow-sm ring-1"
                  : "text-lumina-muted hover:bg-lumina-block-hover hover:text-lumina-paper"
              )}
              title={t.views.grid}
            >
              <Grid size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className={cn(
                "rounded-md p-2 transition-all",
                viewMode === "single"
                  ? "bg-lumina-block ring-lumina-graphite text-white shadow-sm ring-1"
                  : "text-lumina-muted hover:bg-lumina-block-hover hover:text-lumina-paper"
              )}
              title={t.views.single}
            >
              <Maximize size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compare")}
              className={cn(
                "rounded-md p-2 transition-all",
                viewMode === "compare"
                  ? "bg-lumina-block ring-lumina-graphite text-white shadow-sm ring-1"
                  : "text-lumina-muted hover:bg-lumina-block-hover hover:text-lumina-paper"
              )}
              title={t.views.compare}
            >
              <LayoutTemplate size={18} />
            </button>
          </div>
        </div>

        <div className="flex h-full items-center">
          <StatPill
            label={t.stats.liked}
            count={selectionCounts.liked}
            max={PROJECT_CONFIG.maxLikes}
            className="text-lumina-paper"
          />
          <StatPill
            label={t.stats.book}
            count={selectionCounts.book}
            max={PROJECT_CONFIG.maxBook}
            className="text-blue-400"
          />
          <StatPill
            label={t.stats.retouch}
            count={selectionCounts.retouch}
            max={PROJECT_CONFIG.maxRetouch}
            className="text-lumina-retouch"
          />
        </div>

        <div className="flex h-full items-center gap-2 pr-5">
          <button
            type="button"
            aria-label="切换语言"
            onClick={() => setLang((current) => (current === "en" ? "zh" : "en"))}
            className="border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:text-white"
            title={lang === "en" ? "切换到中文" : "Switch to English"}
          >
            <Languages size={16} />
          </button>

          <ThemeToggleButton
            theme={currentTheme}
            start="top-right"
            className="border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 h-9 w-9 rounded-md hover:text-white"
            onClick={() =>
              startTransition(() => setTheme(currentTheme === "dark" ? "light" : "dark"))
            }
          />

          <button
            type="button"
            onClick={() => setIsRightPanelCollapsed((prev) => !prev)}
            className="border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 flex h-9 w-9 items-center justify-center rounded-md border transition-colors"
            aria-label={isRightPanelCollapsed ? "展开右侧面板" : "收起右侧面板"}
          >
            {isRightPanelCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 flex h-9 w-28 items-center justify-center gap-2 rounded-md border px-0 text-xs font-medium shadow-sm transition-all hover:text-white"
            >
              <Save size={14} />
              {t.actions.save}
            </button>
            <button
              type="button"
              className="border-lumina-border-default bg-lumina-primary hover:bg-lumina-primary-hover flex h-9 w-40 items-center justify-center gap-2 rounded-md border px-0 text-xs font-bold text-black shadow-[0_12px_30px_rgba(0,202,224,0.22)] transition-all"
            >
              {t.actions.submit}
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            "border-lumina-graphite bg-lumina-slate flex h-full shrink-0 flex-col border-r transition-[width] duration-200",
            isLeftPanelCollapsed ? "w-0 overflow-hidden border-r-0" : "w-64"
          )}
        >
          <div className="py-4">
            <div className="text-lumina-muted/90 mb-1 flex items-center justify-between px-5 py-2 text-[10px] font-bold tracking-widest uppercase">
              {t.nav.collections}
              <button
                type="button"
                aria-label="收起左侧面板"
                onClick={() => setIsLeftPanelCollapsed(true)}
                className="text-lumina-muted hover:text-lumina-paper hover:bg-lumina-block-hover -mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
            <LeftNavItem
              id="all"
              label={t.folders.all}
              icon={Hash}
              active={filter === "all"}
              count={500}
              onSelect={setFilter}
            />
            <LeftNavItem
              id="highlights"
              label={t.folders.highlights}
              icon={Folder}
              active={filter === "highlights"}
              count={45}
              onSelect={setFilter}
            />
            <LeftNavItem
              id="ceremony"
              label={t.folders.ceremony}
              icon={Folder}
              active={filter === "ceremony"}
              count={120}
              onSelect={setFilter}
            />
            <LeftNavItem
              id="reception"
              label={t.folders.reception}
              icon={Folder}
              active={filter === "reception"}
              count={210}
              onSelect={setFilter}
            />
          </div>

          <div className="bg-lumina-graphite mx-5 my-2 h-px opacity-60" />

          <div className="py-4">
            <div className="text-lumina-muted/90 mb-1 flex items-center justify-between px-5 py-2 text-[10px] font-bold tracking-widest uppercase">
              {t.nav.filters}
              <Filter size={12} className="opacity-50" />
            </div>
            <LeftNavItem
              id="liked"
              label={t.filters.liked}
              icon={Heart}
              active={filter === "liked"}
              onSelect={setFilter}
            />
            <LeftNavItem
              id="book"
              label={t.filters.book}
              icon={BookOpen}
              active={filter === "book"}
              onSelect={setFilter}
            />
            <LeftNavItem
              id="retouch"
              label={t.filters.retouch}
              icon={PenTool}
              active={filter === "retouch"}
              onSelect={setFilter}
            />
            <LeftNavItem
              id="untagged"
              label={t.filters.untagged}
              icon={Filter}
              active={filter === "untagged"}
              onSelect={setFilter}
            />
          </div>

          <div className="border-lumina-graphite bg-lumina-panel mt-auto border-t p-5">
            <div className="text-lumina-muted/90 mb-3 text-[10px] font-bold tracking-widest uppercase">
              {t.nav.sort}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/90 flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 text-xs shadow-sm transition-all"
              >
                <Clock size={12} /> {t.sort.time}
              </button>
              <button
                type="button"
                className="text-lumina-muted hover:text-lumina-paper hover:bg-lumina-block-hover flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent bg-transparent py-2 text-xs transition-all"
              >
                <Hash size={12} /> {t.sort.name}
              </button>
            </div>
          </div>
        </aside>

        <main className="bg-lumina-ink relative flex min-w-0 flex-1 flex-col">
          <div
            className={cn(
              "relative min-h-0 flex-1 overflow-hidden",
              isLeftPanelCollapsed && "pl-14"
            )}
          >
            {canvas}
          </div>
          <div className="border-lumina-graphite bg-lumina-panel relative z-40 flex h-24 shrink-0 border-t">
            <button
              type="button"
              className="border-lumina-graphite hover:bg-lumina-block-hover text-lumina-muted z-10 flex h-full w-8 items-center justify-center border-r bg-transparent"
            >
              <ChevronLeft size={16} />
            </button>
            <div
              ref={filmstripRef}
              className="lumina-scrollbar flex flex-1 items-center gap-2 overflow-x-auto px-2"
            >
              {filteredPhotos.map((photo) => {
                const isActive = photo.id === activeId;
                const selection = selections[photo.id];

                return (
                  <div
                    key={photo.id}
                    id={`lumina-filmstrip-${photo.id}`}
                    onClick={() => handleSelectPhoto(photo.id)}
                    className={cn(
                      "group relative aspect-square h-16 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-all",
                      isActive
                        ? "border-lumina-amber ring-lumina-amber/20 ring-2"
                        : "border-transparent hover:border-gray-600"
                    )}
                  >
                    <img
                      src={photo.url}
                      alt={photo.id}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 flex h-4 w-full items-center justify-center gap-1 bg-black/60 backdrop-blur-sm">
                      {selection?.liked ? (
                        <div className="bg-lumina-amber size-1.5 rounded-full" />
                      ) : null}
                      {selection?.book ? (
                        <div className="size-1.5 rounded-full bg-blue-500" />
                      ) : null}
                      {selection?.retouch ? (
                        <div className="bg-lumina-retouch size-1.5 rounded-full" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="border-lumina-graphite hover:bg-lumina-block-hover text-lumina-muted z-10 flex h-full w-8 items-center justify-center border-l bg-transparent"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {isLeftPanelCollapsed ? (
            <div className="pointer-events-none absolute top-1/2 left-3 z-50 -translate-y-1/2">
              <div className="border-lumina-graphite bg-lumina-panel pointer-events-auto flex flex-col gap-1 rounded-md border p-1 shadow-[0_14px_50px_rgba(0,0,0,0.55)]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="展开左侧面板"
                      onClick={() => setIsLeftPanelCollapsed(false)}
                      className="border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:text-white"
                    >
                      <PanelLeftOpen size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="border-lumina-graphite bg-lumina-panel text-lumina-paper shadow-lg"
                  >
                    展开左侧面板
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className={cn(
                        "border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:text-white",
                        filter === "all" && "ring-lumina-border-default ring-2"
                      )}
                      aria-label={t.folders.all}
                    >
                      <Folder size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="border-lumina-graphite bg-lumina-panel text-lumina-paper shadow-lg"
                  >
                    {t.folders.all}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setFilter("liked")}
                      className={cn(
                        "border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:text-white",
                        filter === "liked" && "ring-lumina-border-default ring-2"
                      )}
                      aria-label={t.filters.liked}
                    >
                      <Heart size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="border-lumina-graphite bg-lumina-panel text-lumina-paper shadow-lg"
                  >
                    {t.filters.liked}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setFilter("book")}
                      className={cn(
                        "border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:text-white",
                        filter === "book" && "ring-lumina-border-default ring-2"
                      )}
                      aria-label={t.filters.book}
                    >
                      <BookOpen size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="border-lumina-graphite bg-lumina-panel text-lumina-paper shadow-lg"
                  >
                    {t.filters.book}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setFilter("retouch")}
                      className={cn(
                        "border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:text-white",
                        filter === "retouch" && "ring-lumina-border-default ring-2"
                      )}
                      aria-label={t.filters.retouch}
                    >
                      <PenTool size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="border-lumina-graphite bg-lumina-panel text-lumina-paper shadow-lg"
                  >
                    {t.filters.retouch}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setFilter("untagged")}
                      className={cn(
                        "border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:text-white",
                        filter === "untagged" && "ring-lumina-border-default ring-2"
                      )}
                      aria-label={t.filters.untagged}
                    >
                      <Filter size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="border-lumina-graphite bg-lumina-panel text-lumina-paper shadow-lg"
                  >
                    {t.filters.untagged}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          ) : null}
        </main>

        <aside
          className={cn(
            "lumina-scrollbar border-lumina-graphite bg-lumina-slate flex h-full shrink-0 flex-col overflow-y-auto border-l transition-[width] duration-200",
            isRightPanelCollapsed ? "w-0 border-l-0" : "w-80"
          )}
        >
          {!activePhoto ? (
            <div
              className={cn(
                "flex flex-1 flex-col items-center justify-center p-8 text-center",
                isRightPanelCollapsed ? "hidden" : "text-gray-500"
              )}
            >
              <div className="border-lumina-graphite bg-lumina-block text-lumina-muted mb-6 flex size-20 items-center justify-center rounded-full shadow-inner ring-1">
                <Info size={40} />
              </div>
              <h3 className="mb-2 text-sm font-medium text-gray-200">{t.panel.noSelection}</h3>
              <p className="max-w-[200px] text-xs leading-relaxed">{t.panel.noSelectionTip}</p>
            </div>
          ) : (
            <div className={cn(isRightPanelCollapsed ? "hidden" : "flex flex-1 flex-col")}>
              <div className="border-lumina-graphite bg-lumina-block border-b p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="truncate font-mono text-sm text-gray-100">
                    {activePhoto.filename}
                  </h2>
                  <span className="border-lumina-graphite bg-lumina-block text-lumina-muted rounded border px-2 py-0.5 text-[10px] font-bold tracking-wide">
                    {t.panel.raw}
                  </span>
                </div>
                <div className="text-lumina-muted/90 font-mono text-[11px]">
                  {activePhoto.width} x {activePhoto.height}px • 24MB
                </div>
              </div>

              <div className="grid gap-4 p-6">
                <button
                  type="button"
                  onClick={() => handleToggleSelection(activePhoto.id, "liked")}
                  className={cn(
                    "group flex items-center justify-between rounded-lg border p-4 transition-all duration-200",
                    selections[activePhoto.id]?.liked
                      ? "border-lumina-amber bg-lumina-amber text-lumina-ink shadow-lumina-amber/20 shadow-lg"
                      : "border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 hover:border-lumina-graphite/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Heart
                      size={18}
                      className={cn(selections[activePhoto.id]?.liked && "fill-lumina-ink")}
                    />
                    <span className="text-xs font-bold tracking-wide uppercase">
                      {t.panel.btnLike}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] opacity-60">[1]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleSelection(activePhoto.id, "book")}
                  className={cn(
                    "group flex items-center justify-between rounded-lg border p-4 transition-all duration-200",
                    selections[activePhoto.id]?.book
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 hover:border-lumina-graphite/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen
                      size={18}
                      className={cn(selections[activePhoto.id]?.book && "fill-white")}
                    />
                    <span className="text-xs font-bold tracking-wide uppercase">
                      {t.panel.btnBook}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] opacity-60">[2]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleSelection(activePhoto.id, "retouch")}
                  className={cn(
                    "group flex items-center justify-between rounded-lg border p-4 transition-all duration-200",
                    selections[activePhoto.id]?.retouch
                      ? "border-lumina-retouch bg-lumina-retouch shadow-lumina-retouch/15 text-lumina-ink shadow-lg"
                      : "border-lumina-graphite bg-lumina-block hover:bg-lumina-block-hover text-lumina-paper/80 hover:border-lumina-graphite/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <PenTool size={18} />
                    <span className="text-xs font-bold tracking-wide uppercase">
                      {t.panel.btnRetouch}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] opacity-60">[3]</span>
                </button>
              </div>

              <div className="bg-lumina-graphite mx-6 my-2 h-px opacity-60" />

              <div className="p-6">
                <h3 className="text-lumina-muted/90 mb-6 text-[10px] font-bold tracking-widest uppercase">
                  {t.panel.pkgStatus}
                </h3>
                <UsageBar
                  label={t.stats.liked}
                  current={selectionCounts.liked}
                  max={PROJECT_CONFIG.maxLikes}
                  barClassName="bg-lumina-amber"
                />
                <UsageBar
                  label={t.stats.book}
                  current={selectionCounts.book}
                  max={PROJECT_CONFIG.maxBook}
                  barClassName="bg-blue-500"
                />
                <UsageBar
                  label={t.stats.retouch}
                  current={selectionCounts.retouch}
                  max={PROJECT_CONFIG.maxRetouch}
                  barClassName="bg-lumina-retouch"
                />
              </div>

              <div className="border-lumina-graphite bg-lumina-panel mt-auto border-t p-6">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-lumina-primary mt-0.5" />
                  <p className="text-lumina-muted/90 text-[11px] leading-relaxed">
                    <span className="text-lumina-paper font-bold">{t.panel.tip}:</span>{" "}
                    {t.panel.tipText}
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
