import { useEffect, useRef } from "react";
import type { AccentId, WallpaperId } from "@/types";
import { ACCENT_OPTIONS } from "@/lib/constants";

interface AnimatedBackgroundProps {
  variant: WallpaperId;
  animated: boolean;
  intensity: number;
  dark: boolean;
  accent: AccentId;
}

/** Aksana göre aurora renk paleti (marka + uyumlu tonlar). */
const PALETTES: Record<AccentId, [string, string, string]> = {
  indigo: ["#4F46E5", "#7C3AED", "#0EA5E9"],
  emerald: ["#10B981", "#14B8A6", "#84CC16"],
  gold: ["#C9A227", "#E8C766", "#10B981"],
  cyan: ["#0EA5E9", "#6366F1", "#22D3EE"],
};

function brandHex(accent: AccentId): string {
  return ACCENT_OPTIONS.find((a) => a.value === accent)?.swatch ?? "#4F46E5";
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(rgb: [number, number, number], a: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}

interface Blob {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  color: [number, number, number];
}

interface Star {
  x: number;
  y: number;
  z: number;
  tw: number;
}

/**
 * Kayan premium duvar kağıdı. Canvas 2D ile hafif bir arka plan katmanı çizer.
 * `animated` kapalıysa veya kullanıcı hareketi azaltmayı tercih ettiyse tek kare çizer.
 */
export function AnimatedBackground({
  variant,
  animated,
  intensity,
  dark,
  accent,
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paramsRef = useRef({ intensity: intensity / 100, dark, accent });
  paramsRef.current = { intensity: intensity / 100, dark, accent };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimate = animated && !reduced && variant !== "solid";

    let raf = 0;
    let last = performance.now();
    let w = 0;
    let h = 0;
    let dpr = 1;
    let blobs: Blob[] = [];
    let stars: Star[] = [];
    let gridOffset = 0;

    const palette = PALETTES[accent].map(hexToRgb);
    const brand = hexToRgb(brandHex(accent));

    const setup = () => {
      const area = w * h;
      const blobCount = area > 1_400_000 ? 5 : 4;
      blobs = Array.from({ length: blobCount }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.max(w, h) * (0.26 + Math.random() * 0.2),
        vx: (Math.random() - 0.5) * 0.09,
        vy: (Math.random() - 0.5) * 0.09,
        color: palette[i % palette.length],
      }));

      const starCount = area > 1_400_000 ? 110 : 70;
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.35 + Math.random() * 0.65,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setup();
      draw(0);
    };

    const drawAurora = (k: number) => {
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        const alpha = (paramsRef.current.dark ? 0.34 : 0.22) * k;
        g.addColorStop(0, rgba(b.color, alpha));
        g.addColorStop(1, rgba(b.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const drawMesh = (k: number) => {
      const cols = [brand, palette[1], palette[2]];
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, rgba(cols[0], 0.16 * k));
      g.addColorStop(0.5, rgba(cols[1], 0.1 * k));
      g.addColorStop(1, rgba(cols[2], 0.16 * k));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 4; i++) {
        const b = blobs[i];
        if (!b) continue;
        const rr = b.r * 0.9;
        const rg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, rr);
        rg.addColorStop(0, rgba(b.color, 0.2 * k));
        rg.addColorStop(1, rgba(b.color, 0));
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(b.x, b.y, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const drawStarfield = (k: number) => {
      const base = paramsRef.current.dark ? 0.9 : 0.5;
      for (const s of stars) {
        s.tw += 0.02;
        const a = (0.28 + 0.42 * Math.abs(Math.sin(s.tw))) * k * base * s.z;
        ctx.fillStyle = rgba(brand, a);
        const size = s.z * 1.8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      // Yakın yıldızları ince çizgilerle bağla (takımyıldız etkisi)
      ctx.strokeStyle = rgba(brand, (paramsRef.current.dark ? 0.14 : 0.08) * k);
      ctx.lineWidth = 0.6;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          if (dx * dx + dy * dy < 150 * 150) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const drawGrid = (k: number) => {
      const horizon = h * 0.7;
      ctx.strokeStyle = rgba(brand, (paramsRef.current.dark ? 0.22 : 0.14) * k);
      ctx.lineWidth = 1;

      // Yatay çizgiler — ufka doğru sıkışan perspektif
      const rows = 22;
      for (let i = 0; i < rows; i++) {
        const p = (i + (gridOffset % 1)) / rows;
        const y = horizon + Math.pow(p, 2.4) * (h - horizon);
        if (y < horizon || y > h) continue;
        ctx.globalAlpha = Math.min(1, (1 - p) * 1.4) * 0.8;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Kaçış noktasına yakınsayan dikey çizgiler
      const vanishingX = w / 2;
      const cols = 22;
      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * w * 1.6 - w * 0.3;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizon);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const glow = ctx.createRadialGradient(vanishingX, horizon, 0, vanishingX, horizon, w * 0.6);
      glow.addColorStop(0, rgba(brand, 0.16 * k));
      glow.addColorStop(1, rgba(brand, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    };

    const drawSolid = (k: number) => {
      const g = ctx.createRadialGradient(w * 0.5, -h * 0.15, 0, w * 0.5, -h * 0.15, h * 0.9);
      g.addColorStop(0, rgba(brand, 0.16 * k));
      g.addColorStop(1, rgba(brand, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    function draw(dt: number) {
      if (!ctx) return;
      const { intensity: k } = paramsRef.current;
      ctx.clearRect(0, 0, w, h);

      if (variant === "solid") {
        drawSolid(k);
        return;
      }

      // Hareket (animasyon kapalıysa dt=0 → duran kare)
      if (shouldAnimate) {
        for (const b of blobs) {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < -b.r) b.x = w + b.r;
          if (b.x > w + b.r) b.x = -b.r;
          if (b.y < -b.r) b.y = h + b.r;
          if (b.y > h + b.r) b.y = -b.r;
        }
        gridOffset += dt * 0.0016;
      }

      switch (variant) {
        case "mesh":
          drawMesh(k);
          break;
        case "starfield":
          drawStarfield(k);
          break;
        case "grid":
          drawGrid(k);
          break;
        case "aurora":
        default:
          drawAurora(k);
          break;
      }
    }

    const loop = (now: number) => {
      const dt = Math.min(now - last, 48);
      last = now;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (shouldAnimate) start();
    };

    resize();
    if (shouldAnimate) start();
    else draw(0);

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, animated, accent]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-0 z-0"
      style={{ opacity: Math.max(0.15, intensity / 100) }}
    />
  );
}
