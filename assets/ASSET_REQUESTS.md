# 🎨 Asset Requests for ComfyUI / Stable Diffusion

This document specifies image asset requirements for Experiment Lens.
All functional UI components currently utilize vector SVG icons (Lucide React) and programmatic canvas visualizations (Apache ECharts) without blocking core workflows.

If customized promotional banners, open graph preview cards, or marketing visuals are generated via ComfyUI, please follow the specifications below.

---

## 1. Open Graph / Social Preview Card (og-image.png)

- **Target File Path**: `public/og-image.png`
- **Dimensions**: `1200 x 630 px` (Aspect Ratio: 1.91:1)
- **Format**: PNG / WebP, 8-bit sRGB, lossless or high quality (q > 90)
- **Visual Style**: Clean dark analytical workbench theme (`#020617` base), high contrast precision charts, minimal tech aesthetic, subtle grid lines, Bloomberg / Datadog terminal feel. No fantasy elements, no cartoon characters.
- **Suggested ComfyUI Prompt**:
  ```text
  masterpiece, best quality, ultra-detailed, professional data science terminal,
  sleek dark analytics dashboard interface, high-tech financial workbench,
  clean statistical normal distribution curves, subtle blue and amber accents,
  precision telemetry graphs, minimalist typography, modern data studio,
  matte dark gray background, crisp edges, 8k resolution, cinematic lighting,
  vector precision
  ```
- **Negative Prompt**:
  ```text
  blurry, low quality, oversaturated neon, cartoon, 3d render, characters, faces,
  hand, text watermark, glitter, sparkling particles, decorative noise, cluttered
  ```

---

## 2. Favicon & App Icon (favicon.svg / icon-512.png)

- **Target File Path**: `public/favicon.svg` and `public/icon-512.png`
- **Dimensions**: `512 x 512 px` (Vector SVG preferred)
- **Visual Style**: Precision scientific lens / compass reticle with dual proportion test intersection.
- **Suggested ComfyUI Prompt**:
  ```text
  minimalist vector logo, precision scientific experiment reticle,
  geometric lens emblem, sleek blue cyan gradient on solid dark slate background,
  modern software icon, app icon, clean outline, flat design, sharp geometry
  ```
- **Negative Prompt**:
  ```text
  complex gradient, 3d bevel, realistic photo, shadows, text, noise
  ```
