const state = {
  mode: "light",
  count: 10,
  anchorIndex: 5,
  anchorHex: "#0BBBD6",
  palette: [],
  exportFormat: "design",
  previewFormat: "hex",
  previewScene: "app",
  colorPickerModel: "rgb",
  colorPickerHue: 188,
};

const sampleColors = ["#0BBBD6", "#4F46E5", "#22C55E", "#F97316", "#E11D48", "#A855F7"];
const countOptions = Array.from({ length: 14 }, (_, index) => index + 3);
const minCount = countOptions[0];
const maxCount = countOptions[countOptions.length - 1];

const refs = {
  body: document.body,
  appShell: document.querySelector(".app-shell"),
  heroCard: document.querySelector(".hero-card"),
  modeToggleMobile: document.getElementById("modeToggleMobile"),
  favicon: document.getElementById("appFavicon"),
  modeToggle: document.getElementById("modeToggle"),
  countValue: document.getElementById("countValue"),
  countIncreaseBtn: document.getElementById("countIncreaseBtn"),
  countDecreaseBtn: document.getElementById("countDecreaseBtn"),
  anchorSelectTrigger: document.getElementById("anchorSelectTrigger"),
  anchorSelectValue: document.getElementById("anchorSelectValue"),
  anchorSelectMenu: document.getElementById("anchorSelectMenu"),
  anchorColorPicker: document.getElementById("anchorColorPicker"),
  anchorColorTrigger: document.getElementById("anchorColorTrigger"),
  anchorColorPopover: document.getElementById("anchorColorPopover"),
  anchorSwatch: document.getElementById("anchorSwatch"),
  anchorHexInput: document.getElementById("anchorHexInput"),
  anchorHexSizer: document.getElementById("anchorHexSizer"),
  colorPickerSv: document.getElementById("colorPickerSv"),
  colorPickerSvThumb: document.getElementById("colorPickerSvThumb"),
  colorPickerHue: document.getElementById("colorPickerHue"),
  colorPickerPreviewSwatch: document.getElementById("colorPickerPreviewSwatch"),
  colorPickerEyeDropper: document.getElementById("colorPickerEyeDropper"),
  colorPickerChannel1: document.getElementById("colorChannel1"),
  colorPickerChannel2: document.getElementById("colorChannel2"),
  colorPickerChannel3: document.getElementById("colorChannel3"),
  colorPickerChannelGrid: document.getElementById("colorPickerChannelGrid"),
  colorPickerChannelLabel1: document.getElementById("colorChannelLabel1"),
  colorPickerChannelLabel2: document.getElementById("colorChannelLabel2"),
  colorPickerChannelLabel3: document.getElementById("colorChannelLabel3"),
  statusText: document.getElementById("statusText"),
  scaleBandGroup: document.getElementById("scaleBandGroup"),
  scaleBand: document.getElementById("scaleBand"),
  scaleBandIndicator: document.getElementById("scaleBandIndicator"),
  neutralScaleBand: document.getElementById("neutralScaleBand"),
  previewStage: document.getElementById("previewStage"),
  previewFormatToggle: document.getElementById("previewFormatToggle"),
  previewSceneToggle: document.getElementById("previewSceneToggle"),
  previewSystemCanvas: document.getElementById("previewSystemCanvas"),
  exportFormatToggle: document.getElementById("exportFormatToggle"),
  exportFormatNote: document.getElementById("exportFormatNote"),
  exportMetaLabel: document.getElementById("exportMetaLabel"),
  exportMeta: document.getElementById("exportMeta"),
  exportHeroStat: document.getElementById("exportHeroStat"),
  exportHeroAnchor: document.getElementById("exportHeroAnchor"),
  tokensPreview: document.getElementById("tokensPreview"),
  tokensOutput: document.getElementById("tokensOutput"),
  copyTokensBtn: document.getElementById("copyTokensBtn"),
  copyFeedback: document.getElementById("copyFeedback"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  tooltip: null,
  messageLayer: null,
  message: null,
  messageIcon: null,
  messageText: null,
};

let scrollEffectFrame = 0;
let scaleIndicatorFrame = 0;
let heroMotionReadyFrame = 0;
let heroResizeSyncTimer = 0;
let scaleIndicatorResizeSyncTimer = 0;
let previewCarouselSyncFrame = 0;
let anchorMenuOpen = false;
let colorPopoverOpen = false;
let colorPickerDraggingSv = false;
let anchorStepResizeObserver = null;
const browserDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const faviconVersion = "20260520-2";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function getScrollContainer() {
  return refs.body || document.body;
}

function getScrollTop() {
  const scrollContainer = getScrollContainer();
  return scrollContainer?.scrollTop || window.pageYOffset || document.documentElement.scrollTop || 0;
}

function syncViewportScrollbarWidth() {
  const bodyClientWidth = refs.body?.clientWidth || document.body?.clientWidth || 0;
  const scrollbarWidth = Math.max(0, window.innerWidth - bodyClientWidth);
  document.documentElement.style.setProperty("--viewport-scrollbar-width", `${scrollbarWidth}px`);
}

function syncDocumentFavicon() {
  if (!refs.favicon) return;
  refs.favicon.href = browserDarkScheme.matches
    ? `./icon-dark.png?v=${faviconVersion}`
    : `./icon-light.png?v=${faviconVersion}`;
}

function syncHeroCardFrame() {
  if (!refs.heroCard || !refs.appShell) return;

  const shellRect = refs.appShell.getBoundingClientRect();
  const rootStyles = getComputedStyle(document.documentElement);
  const shrink = parseFloat(rootStyles.getPropertyValue("--hero-scroll-shrink")) || 48;
  const isMobileViewport = window.matchMedia("(max-width: 640px)").matches;
  const isElevated = !isMobileViewport && refs.heroCard.classList.contains("is-elevated");
  const width = Math.max(0, shellRect.width - (isElevated ? shrink : 0));
  const left = shellRect.left + (isElevated ? shrink / 2 : 0);

  refs.heroCard.style.left = `${left}px`;
  refs.heroCard.style.width = `${width}px`;
  refs.heroCard.style.transform = "none";
}

function scheduleHeroMotionReady() {
  if (!refs.heroCard || refs.heroCard.classList.contains("is-motion-ready") || heroMotionReadyFrame) return;
  heroMotionReadyFrame = window.requestAnimationFrame(() => {
    heroMotionReadyFrame = 0;
    refs.heroCard.classList.add("is-motion-ready");
  });
}

function syncHeroResizeMotion() {
  if (!refs.heroCard || !refs.heroCard.classList.contains("is-motion-ready")) return;

  refs.heroCard.classList.add("is-resize-sync");

  if (heroResizeSyncTimer) {
    window.clearTimeout(heroResizeSyncTimer);
  }

  heroResizeSyncTimer = window.setTimeout(() => {
    refs.heroCard?.classList.remove("is-resize-sync");
    heroResizeSyncTimer = 0;
  }, 120);
}

function syncScaleIndicatorResizeMotion() {
  if (!refs.scaleBandIndicator) return;

  refs.scaleBandIndicator.classList.add("is-resize-sync");

  if (scaleIndicatorResizeSyncTimer) {
    window.clearTimeout(scaleIndicatorResizeSyncTimer);
  }

  scaleIndicatorResizeSyncTimer = window.setTimeout(() => {
    refs.scaleBandIndicator?.classList.remove("is-resize-sync");
    scaleIndicatorResizeSyncTimer = 0;
  }, 96);
}

function getPreviewCarouselElements() {
  const carousel = refs.previewSystemCanvas?.querySelector("[data-preview-carousel]");
  const strip = carousel?.querySelector("[data-preview-strip]");
  const cards = strip ? Array.from(strip.querySelectorAll(".preview-phone-card")) : [];
  const dots = carousel ? Array.from(carousel.querySelectorAll("[data-preview-page]")) : [];

  if (!carousel || !strip || cards.length === 0 || dots.length === 0) {
    return null;
  }

  return { carousel, strip, cards, dots };
}

function syncPreviewMobileCarouselState() {
  const elements = getPreviewCarouselElements();
  if (!elements) return;

  const { strip, cards, dots } = elements;
  const stripCenter = strip.scrollLeft + strip.clientWidth / 2;
  let activeIndex = 0;
  let minDistance = Number.POSITIVE_INFINITY;

  cards.forEach((card, index) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const distance = Math.abs(cardCenter - stripCenter);
    if (distance < minDistance) {
      minDistance = distance;
      activeIndex = index;
    }
  });

  dots.forEach((dot, index) => {
    const isActive = index === activeIndex;
    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function schedulePreviewMobileCarouselSync() {
  if (previewCarouselSyncFrame) return;
  previewCarouselSyncFrame = window.requestAnimationFrame(() => {
    previewCarouselSyncFrame = 0;
    syncPreviewMobileCarouselState();
  });
}

function initPreviewMobileCarousel() {
  const elements = getPreviewCarouselElements();
  if (!elements) return;

  const { strip, cards, dots } = elements;

  if (!strip.dataset.carouselBound) {
    strip.dataset.carouselBound = "true";
    strip.addEventListener("scroll", schedulePreviewMobileCarouselSync, { passive: true });
  }

  dots.forEach((dot, index) => {
    if (dot.dataset.carouselBound) return;
    dot.dataset.carouselBound = "true";
    dot.addEventListener("click", () => {
      const card = cards[index];
      if (!card) return;
      strip.scrollTo({
        left: card.offsetLeft,
        behavior: "smooth",
      });
    });
  });

  schedulePreviewMobileCarouselSync();
}

function ensureMessage() {
  if (refs.messageLayer && refs.message && refs.messageIcon && refs.messageText) {
    return refs.message;
  }

  const layer = document.createElement("div");
  layer.className = "app-message-layer";

  const message = document.createElement("div");
  message.className = "app-message";
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");

  const icon = document.createElement("span");
  icon.className = "app-message-icon";
  icon.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.className = "app-message-text";

  message.append(icon, text);
  layer.append(message);
  document.body.appendChild(layer);

  refs.messageLayer = layer;
  refs.message = message;
  refs.messageIcon = icon;
  refs.messageText = text;

  return message;
}

function normalizeHex(value) {
  if (!value) return null;
  const cleaned = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return `#${cleaned
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned}`;
  }
  return null;
}

function formatHex(hex) {
  const normalized = normalizeHex(hex);
  return normalized ? normalized.toUpperCase() : null;
}

function componentToHex(component) {
  return Math.round(clamp(component, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const raw = normalized.slice(1);
  return {
    r: parseInt(raw.slice(0, 2), 16) / 255,
    g: parseInt(raw.slice(2, 4), 16) / 255,
    b: parseInt(raw.slice(4, 6), 16) / 255,
  };
}

function rgbToHex({ r, g, b }) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`.toUpperCase();
}

function blendHex(startHex, endHex, amount) {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  if (!start || !end) return formatHex(startHex) ?? startHex;

  const weight = clamp(amount, 0, 1);
  return rgbToHex({
    r: lerp(start.r, end.r, weight),
    g: lerp(start.g, end.g, weight),
    b: lerp(start.b, end.b, weight),
  });
}

function rgbTo255({ r, g, b }) {
  return {
    r: Math.round(clamp(r, 0, 1) * 255),
    g: Math.round(clamp(g, 0, 1) * 255),
    b: Math.round(clamp(b, 0, 1) * 255),
  };
}

function rgbToHsb({ r, g, b }) {
  const red = clamp(r, 0, 1);
  const green = clamp(g, 0, 1);
  const blue = clamp(b, 0, 1);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === red) {
      h = ((green - blue) / delta) % 6;
    } else if (max === green) {
      h = (blue - red) / delta + 2;
    } else {
      h = (red - green) / delta + 4;
    }
    h *= 60;
  }

  if (h < 0) {
    h += 360;
  }

  return {
    h: Math.round(h),
    s: Math.round(max === 0 ? 0 : (delta / max) * 100),
    b: Math.round(max * 100),
  };
}

function rgbToHsl({ r, g, b }) {
  const red = clamp(r, 0, 1);
  const green = clamp(g, 0, 1);
  const blue = clamp(b, 0, 1);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * lightness - 1));

    if (max === red) {
      h = ((green - blue) / delta) % 6;
    } else if (max === green) {
      h = (blue - red) / delta + 2;
    } else {
      h = (red - green) / delta + 4;
    }

    h *= 60;
  }

  if (h < 0) {
    h += 360;
  }

  return {
    h: Math.round(h),
    s: Math.round(clamp(s, 0, 1) * 100),
    l: Math.round(clamp(lightness, 0, 1) * 100),
  };
}

function hsbToRgb({ h, s, b }) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 100) / 100;
  const brightness = clamp(b, 0, 100) / 100;
  const chroma = brightness * saturation;
  const segment = hue / 60;
  const second = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = brightness - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment >= 0 && segment < 1) {
    red = chroma;
    green = second;
  } else if (segment < 2) {
    red = second;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = second;
  } else if (segment < 4) {
    green = second;
    blue = chroma;
  } else if (segment < 5) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }

  return {
    r: red + match,
    g: green + match,
    b: blue + match,
  };
}

function hslToRgb({ h, s, l }) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const second = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment >= 0 && segment < 1) {
    red = chroma;
    green = second;
  } else if (segment < 2) {
    red = second;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = second;
  } else if (segment < 4) {
    green = second;
    blue = chroma;
  } else if (segment < 5) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }

  return {
    r: red + match,
    g: green + match,
    b: blue + match,
  };
}

function srgbToLinear(value) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value) {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
}

function rgbToOklch({ r, g, b }) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  const labL = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const b2 = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  const c = Math.sqrt(a * a + b2 * b2);
  const h = ((Math.atan2(b2, a) * 180) / Math.PI + 360) % 360;

  return { l: labL, c, h };
}

function oklchToRgb({ l, c, h }) {
  const angle = (h * Math.PI) / 180;
  const a = c * Math.cos(angle);
  const b = c * Math.sin(angle);

  const l2 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m2 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s2 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const lr = 4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2;
  const lg = -1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2;
  const lb = -0.0041960863 * l2 - 0.7034186147 * m2 + 1.707614701 * s2;

  return {
    r: linearToSrgb(lr),
    g: linearToSrgb(lg),
    b: linearToSrgb(lb),
  };
}

function isInGamut(rgb) {
  return rgb.r >= 0 && rgb.r <= 1 && rgb.g >= 0 && rgb.g <= 1 && rgb.b >= 0 && rgb.b <= 1;
}

function fitOklchToHex(oklch) {
  let chroma = oklch.c;
  for (let attempt = 0; attempt < 28; attempt += 1) {
    const rgb = oklchToRgb({ ...oklch, c: chroma });
    if (isInGamut(rgb)) {
      return rgbToHex(rgb);
    }
    chroma *= 0.9;
  }
  const clipped = oklchToRgb({ ...oklch, c: 0 });
  return rgbToHex({
    r: clamp(clipped.r, 0, 1),
    g: clamp(clipped.g, 0, 1),
    b: clamp(clipped.b, 0, 1),
  });
}

function getMaxChromaForLh(l, h) {
  let low = 0;
  let high = 0.4;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const middle = (low + high) / 2;
    if (isInGamut(oklchToRgb({ l, c: middle, h }))) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return low;
}

function getRelativeLuminance({ r, g, b }) {
  const toLinear = (channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function pickReadableText(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#141414";
  return getRelativeLuminance(rgb) > 0.42 ? "#141414" : "#FFFFFF";
}

function formatDisplayValue(hex, format = state.previewFormat) {
  const normalized = formatHex(hex);
  if (!normalized) return "";

  if (format === "hex") {
    return normalized;
  }

  const rgb = hexToRgb(normalized);
  if (!rgb) return normalized;

  if (format === "rgb") {
    const value = rgbTo255(rgb);
    return `${value.r}, ${value.g}, ${value.b}`;
  }

  if (format === "hsl") {
    const hsl = rgbToHsl(rgb);
    return `${hsl.h}°, ${hsl.s}, ${hsl.l}`;
  }

  const hsb = rgbToHsb(rgb);
  return `${hsb.h}°, ${hsb.s}, ${hsb.b}`;
}

function buildBlueprint(count, mode) {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0 : index / (count - 1);

    if (mode === "light") {
      const eased = Math.pow(t, 0.84);
      const tail = Math.pow(t, 3.6) * 0.075;
      const l = clamp(0.985 - 0.73 * eased - tail, 0.11, 0.985);
      const cWeight = clamp(
        0.24 +
          1.02 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.92)), 0.9) -
          Math.max(0, t - 0.84) * 0.3,
        0.14,
        1.12,
      );
      return { l, cWeight };
    }

    const eased = Math.pow(t, 0.88);
    const lift = Math.pow(1 - t, 3.2) * 0.03;
    const l = clamp(0.09 + 0.81 * eased + lift, 0.07, 0.965);
    const cWeight = clamp(
      0.2 +
        0.96 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.94)), 0.82) -
        Math.max(0, t - 0.88) * 0.22,
      0.14,
      1.08,
    );
    return { l, cWeight };
  });
}

function getAdaptiveLightnessLimits(anchorOklch, mode) {
  const anchorIntensity = clamp(anchorOklch.c / Math.max(getMaxChromaForLh(anchorOklch.l, anchorOklch.h), 0.001), 0, 1);

  if (mode === "light") {
    return {
      lower: lerp(0.085, 0.11, anchorIntensity),
      upper: lerp(0.992, 0.975, anchorIntensity),
    };
  }

  return {
    lower: lerp(0.055, 0.078, anchorIntensity),
    upper: lerp(0.972, 0.948, anchorIntensity),
  };
}

function getAdaptiveHue(anchorHue, distance, delta, anchorChroma) {
  if (anchorChroma < 0.028 || distance === 0) {
    return anchorHue;
  }

  const coolRegion = anchorHue >= 140 && anchorHue <= 320;
  const warmShift = coolRegion ? 1 : -1;
  const shiftStrength = Math.pow(distance, 0.9) * (delta > 0 ? 4 : 6);
  const nextHue = anchorHue + warmShift * shiftStrength * (delta > 0 ? 0.55 : -0.45);
  return (nextHue + 360) % 360;
}

function interpolateHue(fromHue, toHue, amount) {
  const delta = ((toHue - fromHue + 540) % 360) - 180;
  return (fromHue + delta * amount + 360) % 360;
}

function smoothStepProfiles(steps, anchorIndex) {
  if (steps.length <= 2) {
    return steps;
  }

  let smoothed = steps.map((step) => ({ ...step }));

  for (let pass = 0; pass < 2; pass += 1) {
    smoothed = smoothed.map((step, index, source) => {
      if (index === 0 || index === source.length - 1 || index === anchorIndex) {
        return step;
      }

      const previous = source[index - 1];
      const next = source[index + 1];
      const averageChroma = (previous.c + step.c + next.c) / 3;
      const averageHue = interpolateHue(interpolateHue(previous.h, step.h, 0.5), next.h, 2 / 3);

      return {
        ...step,
        c: lerp(step.c, averageChroma, 0.34),
        h: step.c < 0.02 ? step.h : interpolateHue(step.h, averageHue, 0.28),
      };
    });
  }

  return smoothed;
}

function getAdaptiveStepChroma({
  anchorOklch,
  anchorWeight,
  stepWeight,
  scaledL,
  distance,
  delta,
  mode,
}) {
  const anchorMaxChroma = Math.max(getMaxChromaForLh(anchorOklch.l, anchorOklch.h), 0.001);
  const anchorIntensity = clamp(anchorOklch.c / anchorMaxChroma, 0, 1);
  const relativeWeight = Math.pow((stepWeight + 0.08) / (anchorWeight + 0.08), 0.9);
  const distanceFade = 1 - Math.pow(distance, 1.08) * lerp(0.16, 0.34, anchorIntensity);
  const brightRetention = delta > 0 ? lerp(0.88, 0.56, anchorIntensity) : 1;
  const shadowRetention = delta < 0 ? lerp(0.92, 0.74, anchorIntensity) : 1;
  const edgeFade = scaledL > 0.91 ? 1 - (scaledL - 0.91) * 3.1 : 1;
  const floorFade = scaledL < 0.14 ? 1 - (0.14 - scaledL) * 2 : 1;
  const neutralSupport = anchorIntensity < 0.24 ? lerp(1.26, 1, anchorIntensity / 0.24) : 1;
  const modeBias = mode === "light" ? 1 : 0.95;
  const adaptiveHue = getAdaptiveHue(anchorOklch.h, distance, delta, anchorOklch.c);
  const safeMaxChroma = getMaxChromaForLh(scaledL, adaptiveHue) * (mode === "light" ? 0.92 : 0.88);
  const rawChroma =
    anchorOklch.c *
    relativeWeight *
    distanceFade *
    brightRetention *
    shadowRetention *
    edgeFade *
    floorFade *
    neutralSupport *
    modeBias;

  return clamp(rawChroma, 0, Math.max(0, safeMaxChroma));
}

function buildPalette(anchorHex, anchorIndex, count, mode) {
  const anchorRgb = hexToRgb(anchorHex);
  const anchorOklch = rgbToOklch(anchorRgb);
  const blueprint = buildBlueprint(count, mode);
  const lightnessProfile = blueprint.map((step) => step.l);
  const anchorTarget = lightnessProfile[anchorIndex];
  const anchorWeight = blueprint[anchorIndex]?.cWeight ?? 1;
  const brighterDeltas = lightnessProfile.filter((value) => value > anchorTarget).map((value) => value - anchorTarget);
  const deeperDeltas = lightnessProfile.filter((value) => value < anchorTarget).map((value) => value - anchorTarget);
  const upperLimit = mode === "light" ? 0.985 : 0.965;
  const lowerLimit = mode === "light" ? 0.11 : 0.07;
  const maxBrighterDelta = brighterDeltas.length ? Math.max(...brighterDeltas, 0) : 0;
  const maxDeeperDelta = deeperDeltas.length ? Math.min(...deeperDeltas, 0) : 0;
  const lightenScale = maxBrighterDelta > 0 ? Math.min(1, (upperLimit - anchorOklch.l) / maxBrighterDelta) : 1;
  const darkenScale = maxDeeperDelta < 0 ? Math.min(1, (anchorOklch.l - lowerLimit) / Math.abs(maxDeeperDelta)) : 1;

  return blueprint.map((step, index) => {
    if (index === anchorIndex) {
      return { index, hex: formatHex(anchorHex), oklch: anchorOklch };
    }

    const delta = step.l - anchorTarget;
    const scaledL = anchorOklch.l + delta * (delta > 0 ? lightenScale : darkenScale);
    const stepDistance = Math.abs(index - anchorIndex) / Math.max(count - 1, 1);
    const relativeWeight = Math.pow((step.cWeight + 0.08) / (anchorWeight + 0.08), 0.88);
    const fadeByDistance = 1 - Math.pow(stepDistance, 1.18) * 0.2;
    const fadeForBrights = scaledL > 0.9 ? 1 - (scaledL - 0.9) * 3.8 : 1;
    const fadeForShadows = scaledL < 0.16 ? 1 - (0.16 - scaledL) * 1.8 : 1;
    const modeBias = mode === "light" ? 1 : 0.94;
    const chroma = clamp(
      anchorOklch.c * relativeWeight * fadeByDistance * fadeForBrights * fadeForShadows * modeBias,
      0,
      0.34,
    );
    const hex = fitOklchToHex({
      l: clamp(scaledL, lowerLimit, upperLimit),
      c: chroma,
      h: anchorOklch.h,
    });

    return { index, hex };
  });
}

function buildNeutralPalette(count, mode) {
  return buildBlueprint(count, mode).map((step, index) => {
    const hex = fitOklchToHex({
      l: clamp(step.l, mode === "light" ? 0.11 : 0.07, mode === "light" ? 0.985 : 0.965),
      c: 0,
      h: 0,
    });
    return { index, hex };
  });
}

function buildVariableLines(palette, prefix) {
  return palette.map((step) => `  --${prefix}-${step.index + 1}: ${step.hex};`).join("\n");
}

function buildTokens(palette, neutralPalette) {
  return [":root {", buildVariableLines(palette, "color"), "", buildVariableLines(neutralPalette, "gray"), "}"].join("\n");
}

function buildDesignSummary(palette, neutralPalette) {
  const colorLines = palette.map((step) => `${buildStepName("color", step.index)}  ${step.hex}`);
  const grayLines = neutralPalette.map((step) => `${buildStepName("gray", step.index)}   ${step.hex}`);
  return [
    "色阶清单",
    `当前参考：color-${state.anchorIndex + 1} / ${state.count} 阶`,
    "",
    "彩色色阶",
    ...colorLines,
    "",
    "中性色阶",
    ...grayLines,
  ].join("\n");
}

function buildJsonTokens(palette, neutralPalette) {
  const toGroup = (items, prefix) =>
    Object.fromEntries(items.map((step) => [buildStepName(prefix, step.index), step.hex]));

  return JSON.stringify(
    {
      meta: {
        anchor: buildStepName("color", state.anchorIndex),
        count: state.count,
      },
      color: toGroup(palette, "color"),
      gray: toGroup(neutralPalette, "gray"),
    },
    null,
    2,
  );
}

function getExportPayloads(palette, neutralPalette) {
  return {
    design: {
      label: "设计清单",
      note: "最适合先自己看，或直接发给设计师确认色阶。",
      text: buildDesignSummary(palette, neutralPalette),
    },
    css: {
      label: "CSS 变量",
      note: "复制进样式文件后，前端可以直接按变量名接入。",
      text: buildTokens(palette, neutralPalette),
    },
    json: {
      label: "JSON 对象",
      note: "适合继续喂给插件、脚本或 AI 工具做下一步处理。",
      text: buildJsonTokens(palette, neutralPalette),
    },
  };
}

function buildStepName(prefix, index) {
  return `${prefix}-${index + 1}`;
}

function updateAnchorOptions() {
  if (!refs.anchorSelectMenu) return;

  refs.anchorSelectMenu.innerHTML = Array.from({ length: state.count }, (_, index) => {
    const isActive = index === state.anchorIndex;
    return `
      <button
        type="button"
        class="toolbar-anchor-option ${isActive ? "is-active" : ""}"
        data-anchor-option="${index}"
        role="option"
        aria-selected="${String(isActive)}"
      >
        ${index + 1}
      </button>
    `;
  }).join("");
}

function syncCountStepper() {
  refs.countValue.textContent = String(state.count);
  refs.countIncreaseBtn.disabled = state.count >= maxCount;
  refs.countDecreaseBtn.disabled = state.count <= minCount;
}

function setModeState(value) {
  refs.modeToggle.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === value);
  });
  refs.modeToggleMobile?.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === value);
  });
}

function setPreviewFormatState(value) {
  if (!refs.previewFormatToggle) return;
  refs.previewFormatToggle.querySelectorAll("[data-format]").forEach((button) => {
    const isActive = button.dataset.format === value;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function setPreviewSceneState(value) {
  if (!refs.previewSceneToggle) return;
  refs.previewSceneToggle.querySelectorAll("[data-scene]").forEach((button) => {
    const isActive = button.dataset.scene === value;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function setExportFormatState(value) {
  if (!refs.exportFormatToggle) return;
  refs.exportFormatToggle.querySelectorAll("[data-export-format]").forEach((button) => {
    const isActive = button.dataset.exportFormat === value;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function ensureTooltip() {
  if (refs.tooltip) return refs.tooltip;
  const tooltip = document.createElement("div");
  tooltip.className = "app-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.setAttribute("aria-hidden", "true");
  document.body.appendChild(tooltip);
  refs.tooltip = tooltip;
  return tooltip;
}

function getTooltipText(target) {
  return target?.dataset?.tooltip?.trim() ?? "";
}

function positionTooltip(target) {
  const tooltip = refs.tooltip;
  if (!tooltip || !target) return;

  const rect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const gap = 8;
  const viewportPadding = 12;
  const left = clamp(
    rect.left + rect.width / 2 - tooltipRect.width / 2,
    viewportPadding,
    window.innerWidth - tooltipRect.width - viewportPadding,
  );

  let top = rect.top - tooltipRect.height - gap;
  if (top < viewportPadding) {
    top = Math.min(rect.bottom + gap, window.innerHeight - tooltipRect.height - viewportPadding);
  }

  tooltip.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
}

function hideTooltip(target) {
  if (!refs.tooltip) return;
  if (target && refs.tooltipTarget !== target) return;
  refs.tooltip.classList.remove("is-visible");
  refs.tooltip.setAttribute("aria-hidden", "true");
  refs.tooltip.style.transform = "translate3d(-9999px, -9999px, 0)";
  refs.tooltipTarget = null;
}

function positionGlobalMessage(anchor) {
  const message = refs.message;
  if (!message) return;

  const viewportPadding = 12;
  const gap = 10;
  const messageRect = message.getBoundingClientRect();
  const anchorRect = anchor?.getBoundingClientRect?.();

  let left = Math.round((window.innerWidth - messageRect.width) / 2);
  let top = 24;
  let isBelow = false;

  if (anchorRect) {
    left = clamp(
      anchorRect.left + anchorRect.width / 2 - messageRect.width / 2,
      viewportPadding,
      window.innerWidth - messageRect.width - viewportPadding,
    );
    top = anchorRect.top - messageRect.height - gap;

    if (top < viewportPadding) {
      top = Math.min(anchorRect.bottom + gap, window.innerHeight - messageRect.height - viewportPadding);
      isBelow = true;
    }
  }

  message.style.left = `${Math.round(left)}px`;
  message.style.top = `${Math.round(top)}px`;
  message.classList.toggle("is-below", isBelow);
}

function showGlobalMessage(text, tone = "success", anchor = null) {
  const message = ensureMessage();
  const icon = refs.messageIcon;
  const textNode = refs.messageText;

  if (!message || !icon || !textNode) return;

  if (message.hideTimer) {
    window.clearTimeout(message.hideTimer);
  }

  message.classList.remove("is-success", "is-error", "is-visible");
  message.classList.add(tone === "error" ? "is-error" : "is-success");

  icon.textContent = tone === "error" ? "!" : "✓";
  textNode.textContent = text;
  refs.messageAnchor = anchor instanceof Element ? anchor : null;
  positionGlobalMessage(refs.messageAnchor);

  window.requestAnimationFrame(() => {
    positionGlobalMessage(refs.messageAnchor);
    message.classList.add("is-visible");
  });

  message.hideTimer = window.setTimeout(() => {
    message.classList.remove("is-visible");
  }, 1600);
}

function showTooltip(target) {
  if (!target || target.disabled) return;
  const text = getTooltipText(target);
  if (!text) return;

  const tooltip = ensureTooltip();
  refs.tooltipTarget = target;
  tooltip.textContent = text;
  tooltip.setAttribute("aria-hidden", "false");
  tooltip.classList.add("is-visible");
  positionTooltip(target);
}

function bindTooltips() {
  document.querySelectorAll("[data-tooltip]").forEach((target) => {
    target.addEventListener("pointerenter", () => {
      showTooltip(target);
    });

    target.addEventListener("pointerleave", () => {
      hideTooltip(target);
    });

    target.addEventListener("focus", () => {
      showTooltip(target);
    });

    target.addEventListener("blur", () => {
      hideTooltip(target);
    });

    target.addEventListener("pointerdown", () => {
      hideTooltip(target);
    });
  });
}

function syncInputs() {
  refs.anchorColorPicker.value = state.anchorHex;
  refs.anchorHexInput.value = state.anchorHex;
  refs.anchorSwatch.style.background = state.anchorHex;
  if (refs.anchorSelectValue) {
    refs.anchorSelectValue.textContent = String(state.anchorIndex + 1);
  }
  refs.statusText.innerHTML = `当前以 色阶 ${state.anchorIndex + 1} 为参考`;
  syncAnchorHexWidth(state.anchorHex);
  syncCountStepper();
  syncColorPopover();
}

function syncColorPopover() {
  if (!refs.anchorColorPopover) return;

  const rgb = hexToRgb(state.anchorHex);
  if (!rgb) return;

  const hsb = rgbToHsb(rgb);
  const hsl = rgbToHsl(rgb);
  const hue = hsb.s === 0 ? state.colorPickerHue : hsb.h;
  state.colorPickerHue = hue;

  refs.colorPickerSv?.style.setProperty("--picker-hue-color", `hsl(${hue} 100% 50%)`);
  refs.colorPickerPreviewSwatch && (refs.colorPickerPreviewSwatch.style.background = state.anchorHex);

  if (refs.colorPickerHue) {
    refs.colorPickerHue.value = String(hue);
  }

  if (refs.colorPickerSvThumb) {
    refs.colorPickerSvThumb.style.left = `${hsb.s}%`;
    refs.colorPickerSvThumb.style.top = `${100 - hsb.b}%`;
  }

  const isHexModel = state.colorPickerModel === "hex";
  const isHsbModel = state.colorPickerModel === "hsb";
  const isHslModel = state.colorPickerModel === "hsl";
  const labels = isHexModel ? ["HEX", "", ""] : isHsbModel ? ["H", "S", "B"] : isHslModel ? ["H", "S", "L"] : ["R", "G", "B"];
  const values = isHexModel
    ? [state.anchorHex.replace(/^#/, ""), "", ""]
    : isHsbModel
      ? [hsb.h, hsb.s, hsb.b]
      : isHslModel
        ? [hsl.h, hsl.s, hsl.l]
        : Object.values(rgbTo255(rgb));

  [refs.colorPickerChannelLabel1, refs.colorPickerChannelLabel2, refs.colorPickerChannelLabel3].forEach((label, index) => {
    if (label) label.textContent = labels[index];
  });

  const channelInputs = [refs.colorPickerChannel1, refs.colorPickerChannel2, refs.colorPickerChannel3];
  const channelFields = channelInputs.map((input) => input?.closest(".color-picker-channel"));

  refs.colorPickerChannelGrid?.classList.toggle("is-hex-mode", isHexModel);

  channelFields.forEach((field, index) => {
    if (!field) return;
    field.hidden = false;
    field.style.display = "";
  });

  channelInputs.forEach((input, index) => {
    if (!input) return;

    if (isHexModel) {
      input.type = "text";
      input.inputMode = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.removeAttribute("min");
      input.removeAttribute("max");
      input.removeAttribute("step");
      if (index === 0) {
        input.maxLength = 6;
      } else {
        input.removeAttribute("maxLength");
      }
      input.disabled = isHexModel && index > 0;
      input.value = String(values[index]);
      return;
    }

    input.type = "number";
    input.inputMode = "numeric";
    input.removeAttribute("maxLength");
    input.min = "0";
    input.max = isHsbModel || isHslModel ? (index === 0 ? "360" : "100") : "255";
    input.disabled = false;
    input.value = String(values[index]);
  });

  document.querySelectorAll("[data-color-model]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.colorModel === state.colorPickerModel);
  });
}

function focusColorPickerHexInput() {
  if (!refs.colorPickerChannel1) return;
  window.setTimeout(() => {
    refs.colorPickerChannel1?.focus();
    refs.colorPickerChannel1?.select?.();
  }, 0);
}

function restoreColorPickerValueIfNeeded() {
  if (state.colorPickerModel !== "hex" || !refs.colorPickerChannel1) return;
  const nextHex = normalizeHex(refs.colorPickerChannel1.value ?? "");
  if (nextHex) return;
  syncColorPopover();
}

function setColorPopoverOpen(nextOpen) {
  colorPopoverOpen = Boolean(nextOpen);
  if (!refs.anchorColorPopover) return;
  refs.anchorColorPopover.hidden = !colorPopoverOpen;
  if (colorPopoverOpen) {
    state.colorPickerModel = "hex";
    syncColorPopover();
    focusColorPickerHexInput();
  }
}

function applyPickerHsb(nextHsb) {
  const rgb = hsbToRgb(nextHsb);
  state.colorPickerHue = nextHsb.h;
  applyAnchor(state.anchorIndex, rgbToHex(rgb));
}

function updatePickerSvFromPointer(clientX, clientY) {
  if (!refs.colorPickerSv) return;
  const rect = refs.colorPickerSv.getBoundingClientRect();
  const x = clamp((clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((clientY - rect.top) / rect.height, 0, 1);
  const current = rgbToHsb(hexToRgb(state.anchorHex));
  applyPickerHsb({
    h: state.colorPickerHue,
    s: Math.round(x * 100),
    b: Math.round((1 - y) * 100),
  });
}

function applyPickerChannelInputs() {
  if (state.colorPickerModel === "hex") {
    const nextHex = normalizeHex(refs.colorPickerChannel1?.value ?? "");
    if (!nextHex) return;
    applyAnchor(state.anchorIndex, nextHex);
    return;
  }

  const values = [refs.colorPickerChannel1, refs.colorPickerChannel2, refs.colorPickerChannel3].map((input) =>
    Number.parseFloat(input?.value ?? "0"),
  );

  if (values.some((value) => Number.isNaN(value))) return;

  if (state.colorPickerModel === "hsb") {
    applyPickerHsb({
      h: clamp(values[0], 0, 360),
      s: clamp(values[1], 0, 100),
      b: clamp(values[2], 0, 100),
    });
    return;
  }

  if (state.colorPickerModel === "hsl") {
    applyAnchor(
      state.anchorIndex,
      rgbToHex(
        hslToRgb({
          h: clamp(values[0], 0, 360),
          s: clamp(values[1], 0, 100),
          l: clamp(values[2], 0, 100),
        }),
      ),
    );
    return;
  }

  applyAnchor(
    state.anchorIndex,
    rgbToHex({
      r: clamp(values[0], 0, 255) / 255,
      g: clamp(values[1], 0, 255) / 255,
      b: clamp(values[2], 0, 255) / 255,
    }),
  );
}

function setAnchorMenuOpen(nextOpen) {
  anchorMenuOpen = Boolean(nextOpen);
  refs.anchorSelectTrigger?.setAttribute("aria-expanded", String(anchorMenuOpen));
  refs.anchorSelectMenu?.parentElement?.classList.toggle("is-open", anchorMenuOpen);
}

function syncAnchorHexWidth(value) {
  if (!refs.anchorHexSizer || !refs.anchorHexInput) return;
  refs.anchorHexSizer.textContent = value;
  const textWidth = refs.anchorHexSizer.getBoundingClientRect().width;
  refs.anchorHexInput.style.width = `${Math.ceil(textWidth + 16)}px`;
}

function syncHeroReserve() {
  if (!refs.heroCard) return;
  const rootStyles = getComputedStyle(document.documentElement);
  const gap = parseFloat(rootStyles.getPropertyValue("--hero-gap")) || 24;
  document.documentElement.style.setProperty("--hero-reserve", `${Math.ceil(refs.heroCard.offsetHeight + gap)}px`);
}

function syncHeroShadow() {
  if (!refs.heroCard) return;
  const scrollTop = getScrollTop();
  refs.heroCard.classList.toggle("is-elevated", scrollTop > 6);
}

function getScaleStepByIndex(index) {
  if (!refs.scaleBand) return null;
  return refs.scaleBand.querySelector(`.scale-band-step[data-index="${index}"]`);
}

function setScaleIndicatorFollowing(isFollowing) {
  refs.scaleBandIndicator?.classList.toggle("is-following", Boolean(isFollowing));
}

function positionScaleIndicator(step) {
  if (!refs.scaleBandIndicator || !refs.scaleBandGroup || !step) return;

  const groupRect = refs.scaleBandGroup.getBoundingClientRect();
  const stepRect = step.getBoundingClientRect();
  const indicatorWidth = refs.scaleBandIndicator.offsetWidth || 16;
  const maxLeft = Math.max(groupRect.width - indicatorWidth, 0);
  const left = clamp(stepRect.left - groupRect.left + stepRect.width / 2 - indicatorWidth / 2, 0, maxLeft);
  const top = Math.max(stepRect.bottom - groupRect.top + 12, 0);

  refs.scaleBandIndicator.style.transform = `translate3d(${left.toFixed(3)}px, ${top.toFixed(3)}px, 0)`;
  refs.scaleBandIndicator.classList.add("is-visible");
}

function syncScaleIndicatorToAnchor() {
  const anchorStep = getScaleStepByIndex(state.anchorIndex);
  positionScaleIndicator(anchorStep);
}

function scheduleScaleIndicatorSync() {
  if (scaleIndicatorFrame) return;
  scaleIndicatorFrame = window.requestAnimationFrame(() => {
    scaleIndicatorFrame = 0;
    syncScaleIndicatorToAnchor();
  });
}

function syncAnchorStepObserver() {
  anchorStepResizeObserver?.disconnect();
  anchorStepResizeObserver = null;

  const anchorStep = getScaleStepByIndex(state.anchorIndex);
  if (!anchorStep || typeof ResizeObserver === "undefined") return;

  anchorStepResizeObserver = new ResizeObserver(() => {
    scheduleScaleIndicatorSync();
  });

  anchorStepResizeObserver.observe(anchorStep);
}

function renderPreviewShowcase(palette) {
  if (!refs.previewStage) return;

  const first = palette[0]?.hex ?? "#FFFFFF";
  const second = palette[Math.min(1, palette.length - 1)]?.hex ?? first;
  const soft = palette[Math.max(Math.min(state.anchorIndex - 2, palette.length - 1), 0)]?.hex ?? second;
  const tag = palette[Math.max(Math.floor((palette.length - 1) / 3), 0)]?.hex ?? soft;
  const nearDark = palette[Math.max(palette.length - 2, 0)]?.hex ?? "#111111";
  const darkest = palette[palette.length - 1]?.hex ?? nearDark;
  const accent = palette[state.anchorIndex]?.hex ?? state.anchorHex;
  const accentNext = palette[Math.min(state.anchorIndex + 1, palette.length - 1)]?.hex ?? accent;
  const deepInfo = palette[Math.min(state.anchorIndex + 3, palette.length - 1)]?.hex ?? darkest;
  const darkInk = blendHex(darkest, "#FFFFFF", 0.12);
  const lightCardBg = blendHex(first, "#FFFFFF", 0.18);
  const lightPanelBg = blendHex(second, "#FFFFFF", 0.14);
  const lightPanelAlt = blendHex(soft, "#FFFFFF", 0.18);
  const lightPanelStrong = blendHex(soft, second, 0.38);
  const lightHeroStart = blendHex(first, "#FFFFFF", 0.18);
  const lightHeroEnd = blendHex(second, soft, 0.34);
  const lightControlBg = blendHex(second, "#FFFFFF", 0.18);
  const lightTopbarBg = blendHex(first, "#FFFFFF", 0.08);
  const darkShellBg = blendHex(first, "#020304", 0.58);
  const darkCardBg = blendHex(second, "#050607", 0.5);
  const darkPanelBg = blendHex(tag, darkCardBg, 0.84);
  const darkPanelAlt = blendHex(second, darkCardBg, 0.34);
  const darkPanelStrong = blendHex(accent, darkCardBg, 0.74);
  const darkHeroStart = blendHex(accent, darkCardBg, 0.8);
  const darkHeroEnd = blendHex(tag, darkCardBg, 0.7);
  const darkControlBg = blendHex(second, darkCardBg, 0.28);
  const darkTopbarBg = blendHex(second, darkShellBg, 0.58);
  const darkIconBg = blendHex(accent, darkCardBg, 0.86);
  const darkToggleOff = blendHex(darkInk, darkCardBg, 0.82);

  const sceneRoleMap = {
    first,
    second,
    soft,
    tag,
    accent,
    accentNext,
    deepInfo,
  };

  if (refs.previewSystemCanvas) {
    const appMarkup = `
      <div class="preview-app-demo">
        <div class="preview-app-demo-glow preview-app-demo-glow-left"></div>
        <div class="preview-app-demo-glow preview-app-demo-glow-right"></div>
        <div class="preview-app-demo-shell">
          <div class="preview-app-demo-copy">
            <span class="preview-app-demo-kicker">APP 场景 / 跑步类产品</span>
            <h3>案例演示</h3>
            <p>把当前色阶直接放进更接近真实产品的跑步 APP 界面里，先看气质、层级和可读性，再决定是否输出。</p>
          </div>

          <div class="preview-phone-carousel" data-preview-carousel>
            <div class="preview-phone-strip" data-preview-strip>
            <article class="preview-phone-card preview-phone-card-left">
              <div class="preview-phone-status">
                <span class="preview-phone-brand">燃跑</span>
                <span class="preview-phone-icon">9:41</span>
              </div>

              <div class="preview-phone-panel preview-phone-hero-card preview-run-home-hero">
                <div class="preview-run-badge-row">
                  <span class="preview-inline-chip" style="--preview-chip-bg:${accentNext}; --preview-chip-ink:${pickReadableText(accentNext)}">户外跑</span>
                  <span class="preview-run-weather">23°C · 微风 · 空气优</span>
                </div>

                <div class="preview-run-cover">
                  <div class="preview-run-cover-glow"></div>
                  <div class="preview-run-cover-track"></div>
                  <div class="preview-run-cover-dot dot-1"></div>
                  <div class="preview-run-cover-dot dot-2"></div>
                  <div class="preview-run-cover-dot dot-3"></div>
                </div>

                <div class="preview-run-hero-main">
                  <span class="preview-run-hero-label">今日训练目标</span>
                  <strong>5.20<span> km</span></strong>
                  <p>状态不错，适合完成一次轻松恢复跑。</p>
                </div>

                <div class="preview-run-hero-meta">
                  <div>
                    <span>建议时长</span>
                    <strong>32 分钟</strong>
                  </div>
                  <div>
                    <span>最佳时段</span>
                    <strong>18:30</strong>
                  </div>
                  <div>
                    <span>训练类型</span>
                    <strong>恢复跑</strong>
                  </div>
                </div>

                <div class="preview-phone-action-row">
                  <button type="button" class="preview-phone-action preview-phone-action-primary">开始跑步</button>
                  <button type="button" class="preview-phone-action preview-phone-action-secondary">AI 热身</button>
                </div>
              </div>

              <div class="preview-run-map-card">
                <div class="preview-run-map-route"></div>
                <div class="preview-run-map-point start"></div>
                <div class="preview-run-map-point end"></div>
                <div class="preview-run-map-copy">
                  <strong>滨江轻松跑路线</strong>
                  <span>5.1 km · 红绿灯少 · 路况平稳</span>
                </div>
              </div>

              <div class="preview-run-shortcut-grid">
                <div class="preview-run-shortcut-card">
                  <span class="preview-run-shortcut-icon">训</span>
                  <strong>训练计划</strong>
                  <em>按目标自动安排</em>
                </div>
                <div class="preview-run-shortcut-card">
                  <span class="preview-run-shortcut-icon">路</span>
                  <strong>推荐路线</strong>
                  <em>附近 3 条可跑</em>
                </div>
                <div class="preview-run-shortcut-card">
                  <span class="preview-run-shortcut-icon">恢</span>
                  <strong>跑后恢复</strong>
                  <em>拉伸 8 分钟</em>
                </div>
              </div>

              <div class="preview-phone-panel">
                <div class="preview-phone-section-head">
                  <strong>今日推荐课程</strong>
                  <span>为你定制</span>
                </div>
                <div class="preview-run-course-card">
                  <div class="preview-run-course-copy">
                    <strong>10 公里进阶节奏跑</strong>
                    <em>提升耐力与配速稳定性</em>
                  </div>
                  <div class="preview-run-course-side">
                    <span>42 分钟</span>
                    <strong>Lv.2</strong>
                  </div>
                </div>
                <div class="preview-run-note-list">
                  <div class="preview-run-note-item">
                    <span class="preview-activity-dot"></span>
                    <div class="preview-activity-copy">
                      <strong>跑鞋剩余寿命 86 km</strong>
                      <em>建议本周训练后检查缓震反馈</em>
                    </div>
                  </div>
                  <div class="preview-run-note-item">
                    <span class="preview-activity-dot"></span>
                    <div class="preview-activity-copy">
                      <strong>你已经连续打卡 6 天</strong>
                      <em>今天完成目标即可解锁本周徽章</em>
                    </div>
                  </div>
                </div>
              </div>

              <div class="preview-phone-nav">
                <span class="is-active">首页</span>
                <span>运动</span>
                <span>我的</span>
              </div>
            </article>

            <article class="preview-phone-card preview-phone-card-center">
              <div class="preview-phone-status preview-phone-status-center">
                <span>←</span>
                <strong>运动数据</strong>
                <span class="preview-inline-chip preview-inline-chip-soft" style="--preview-chip-bg:${soft}; --preview-chip-ink:${pickReadableText(soft)}">本周</span>
              </div>

              <div class="preview-phone-panel preview-run-data-hero">
                <div class="preview-run-data-total">
                  <span>累计跑量</span>
                  <strong>26.4 km</strong>
                  <em>较上周 +12%</em>
                </div>

                <div class="preview-transfer-stats">
                  <div><span>平均配速</span><strong>5'18"</strong></div>
                  <div><span>训练时长</span><strong>3h 42m</strong></div>
                  <div><span>消耗热量</span><strong>2140 kcal</strong></div>
                </div>
              </div>

              <div class="preview-phone-panel preview-run-highlight-card">
                <div class="preview-run-highlight-copy">
                  <span>本次最佳表现</span>
                  <strong>10 km 配速进入 5'10"</strong>
                  <em>相比上个周期更稳定</em>
                </div>
                <div class="preview-run-highlight-ring">
                  <span>87</span>
                  <em>状态分</em>
                </div>
              </div>

              <div class="preview-phone-panel">
                <div class="preview-phone-section-head">
                  <strong>近 7 天趋势</strong>
                  <span>跑量 / km</span>
                </div>
                <div class="preview-run-chart">
                  <div class="preview-run-chart-bar"><span style="height:42%"></span><em>一</em></div>
                  <div class="preview-run-chart-bar"><span style="height:68%"></span><em>二</em></div>
                  <div class="preview-run-chart-bar"><span style="height:36%"></span><em>三</em></div>
                  <div class="preview-run-chart-bar"><span style="height:84%"></span><em>四</em></div>
                  <div class="preview-run-chart-bar"><span style="height:58%"></span><em>五</em></div>
                  <div class="preview-run-chart-bar"><span style="height:92%"></span><em>六</em></div>
                  <div class="preview-run-chart-bar"><span style="height:26%"></span><em>日</em></div>
                </div>
              </div>

              <div class="preview-phone-panel preview-file-list-card">
                <div class="preview-phone-section-head">
                  <strong>核心指标</strong>
                  <span>本次训练周期</span>
                </div>
                <div class="preview-run-metric-list">
                  <div class="preview-run-metric-item">
                    <div class="preview-run-metric-copy">
                      <strong>轻松跑配速</strong>
                      <em>状态稳定，呼吸与步频都比较顺</em>
                    </div>
                    <span>5'24"</span>
                  </div>
                  <div class="preview-run-metric-item">
                    <div class="preview-run-metric-copy">
                      <strong>平均心率</strong>
                      <em>长距离阶段略高，建议明天恢复跑</em>
                    </div>
                    <span>148</span>
                  </div>
                  <div class="preview-run-metric-item">
                    <div class="preview-run-metric-copy">
                      <strong>平均步频</strong>
                      <em>进入舒服区间，整体节奏更连贯</em>
                    </div>
                    <span>178</span>
                  </div>
                </div>
              </div>

              <div class="preview-phone-nav">
                <span>首页</span>
                <span class="is-active">运动</span>
                <span>我的</span>
              </div>
            </article>

            <article class="preview-phone-card preview-phone-card-right">
              <div class="preview-phone-status">
                <div class="preview-right-brand">
                  <strong>我的</strong>
                  <span>个人中心</span>
                </div>
                <span class="preview-toggle-pill is-on"></span>
              </div>

              <div class="preview-phone-panel preview-run-profile-card">
                <div class="preview-run-profile-top">
                  <span class="preview-run-profile-avatar" style="--avatar-bg:${first}; --avatar-ink:${pickReadableText(first)}">余</span>
                  <div class="preview-run-profile-copy">
                    <strong>余燃</strong>
                    <span>Lv.4 跑者 · 连续跑步 6 天</span>
                  </div>
                </div>

                <div class="preview-stat-strip">
                  <div class="preview-stat-mini">
                    <span>累计里程</span>
                    <strong>428 km</strong>
                  </div>
                  <div class="preview-stat-mini">
                    <span>本月打卡</span>
                    <strong>14 天</strong>
                  </div>
                </div>

                <div class="preview-run-medal-row">
                  <span class="preview-run-medal">5K</span>
                  <span class="preview-run-medal">10K</span>
                  <span class="preview-run-medal">PB</span>
                </div>
              </div>

              <div class="preview-phone-panel preview-run-photo-card">
                <div class="preview-run-photo"></div>
                <div class="preview-run-photo-copy">
                  <strong>西湖夜跑计划</strong>
                  <span>完成 3 次夜跑可获得限定奖牌</span>
                </div>
              </div>

              <div class="preview-phone-panel">
                <div class="preview-phone-section-head">
                  <strong>我的装备</strong>
                  <span>设备与鞋款</span>
                </div>
                <div class="preview-device-list">
                  <div class="preview-device-row">
                    <div class="preview-device-copy">
                      <strong>Apple Watch</strong>
                      <em>最近同步 8 分钟前，心率上传正常</em>
                    </div>
                    <span class="preview-inline-chip preview-inline-chip-soft" style="--preview-chip-bg:${soft}; --preview-chip-ink:${pickReadableText(soft)}">已连接</span>
                  </div>
                  <div class="preview-device-row">
                    <div class="preview-device-copy">
                      <strong>Nike Pegasus 41</strong>
                      <em>累计 514 km，建议 80 km 后检查更换</em>
                    </div>
                    <span class="preview-inline-chip preview-inline-chip-soft" style="--preview-chip-bg:${tag}; --preview-chip-ink:${pickReadableText(tag)}">鞋况良好</span>
                  </div>
                </div>
              </div>

              <div class="preview-phone-panel">
                <div class="preview-phone-section-head">
                  <strong>常用入口</strong>
                  <span>个人服务</span>
                </div>
                <div class="preview-run-menu-list">
                  <div class="preview-run-menu-item"><strong>训练计划</strong><span>查看本周安排</span></div>
                  <div class="preview-run-menu-item"><strong>奖牌与成就</strong><span>解锁 5 公里新 PB</span></div>
                  <div class="preview-run-menu-item"><strong>订单与会员</strong><span>课程、活动与订阅管理</span></div>
                </div>
              </div>

              <div class="preview-phone-nav">
                <span>首页</span>
                <span>运动</span>
                <span class="is-active">我的</span>
              </div>
            </article>
            </div>
            <div class="preview-phone-pager" aria-label="当前页面提示器">
              <button type="button" class="preview-phone-page-dot is-active" data-preview-page="0" aria-label="查看第 1 页"></button>
              <button type="button" class="preview-phone-page-dot" data-preview-page="1" aria-label="查看第 2 页"></button>
              <button type="button" class="preview-phone-page-dot" data-preview-page="2" aria-label="查看第 3 页"></button>
            </div>
          </div>
        </div>
      </div>
    `;

    const formMarkup = `
      <div class="preview-app-demo preview-app-demo-form">
        <div class="preview-app-demo-glow preview-app-demo-glow-left"></div>
        <div class="preview-app-demo-glow preview-app-demo-glow-right"></div>
        <div class="preview-app-demo-shell">
          <div class="preview-app-demo-copy">
            <span class="preview-app-demo-kicker">Form Preview</span>
            <h3>色阶进入表单和设置流程后的预演效果</h3>
            <p>这里重点看输入框、切换器、主按钮、提示区和聊天式表单反馈是否顺畅，提前判断这组色能不能稳定落地。</p>
          </div>

          <div class="preview-phone-carousel" data-preview-carousel>
            <div class="preview-phone-strip" data-preview-strip>
            <article class="preview-phone-card">
              <div class="preview-phone-status preview-phone-status-center">
                <span>←</span>
                <strong>Profile</strong>
                <span>⋯</span>
              </div>

              <div class="preview-form-hero">
                <span class="preview-form-hero-avatar" style="--avatar-bg:${accent}; --avatar-ink:${pickReadableText(accent)}">AL</span>
                <strong>Andrew Jordan</strong>
                <span>Designer / Product Team</span>
              </div>

              <div class="preview-form-list">
                <div class="preview-form-row"><span>Full name</span><strong>Andrew Jordan</strong></div>
                <div class="preview-form-row"><span>Email</span><strong>andrew@studio.co</strong></div>
                <div class="preview-form-row"><span>Country</span><strong>United States</strong></div>
                <div class="preview-form-row"><span>Language</span><strong>English</strong></div>
              </div>

              <button type="button" class="preview-phone-cta">Save Changes</button>
            </article>

            <article class="preview-phone-card preview-phone-card-center">
              <div class="preview-phone-status preview-phone-status-center">
                <span>←</span>
                <strong>Notification</strong>
                <span></span>
              </div>

              <div class="preview-settings-list">
                <div class="preview-setting-item"><div><strong>General Notification</strong><span>Daily updates and reminders</span></div><span class="preview-toggle-pill is-on"></span></div>
                <div class="preview-setting-item"><div><strong>Sound</strong><span>Play system sound when alert arrives</span></div><span class="preview-toggle-pill"></span></div>
                <div class="preview-setting-item"><div><strong>Vibrate</strong><span>Mobile device vibration feedback</span></div><span class="preview-toggle-pill is-on"></span></div>
                <div class="preview-setting-item"><div><strong>Special Offers</strong><span>Promotions and beta invitations</span></div><span class="preview-toggle-pill"></span></div>
              </div>

              <div class="preview-inline-banner">
                <strong>Current Accent</strong>
                <span>${formatDisplayValue(accent)} 用作主操作和开关高亮</span>
              </div>
            </article>

            <article class="preview-phone-card">
              <div class="preview-phone-status preview-phone-status-center">
                <span>←</span>
                <strong>Help Center</strong>
                <span>⋯</span>
              </div>

              <div class="preview-chip-row preview-chip-row-form">
                <span class="preview-chip" style="--preview-chip-bg:${soft}; --preview-chip-ink:${pickReadableText(soft)}">Refund</span>
                <span class="preview-chip" style="--preview-chip-bg:${tag}; --preview-chip-ink:${pickReadableText(tag)}">Login</span>
                <span class="preview-chip" style="--preview-chip-bg:${accent}; --preview-chip-ink:${pickReadableText(accent)}">Shipping</span>
              </div>

              <div class="preview-chat-list">
                <div class="preview-chat-bubble is-incoming">Hi, we can help with your recent order. What do you need?</div>
                <div class="preview-chat-bubble is-outgoing">I want to change the shipping address before dispatch.</div>
                <div class="preview-chat-bubble is-incoming">Sure. Please confirm your latest city and postcode.</div>
              </div>

              <div class="preview-chat-input">
                <span>Type your question...</span>
                <button type="button" class="preview-chat-send">Send</button>
              </div>
            </article>
            </div>
            <div class="preview-phone-pager" aria-label="当前页面提示器">
              <button type="button" class="preview-phone-page-dot is-active" data-preview-page="0" aria-label="查看第 1 页"></button>
              <button type="button" class="preview-phone-page-dot" data-preview-page="1" aria-label="查看第 2 页"></button>
              <button type="button" class="preview-phone-page-dot" data-preview-page="2" aria-label="查看第 3 页"></button>
            </div>
          </div>
        </div>
      </div>
    `;

    refs.previewSystemCanvas.innerHTML = state.previewScene === "form" ? formMarkup : appMarkup;
  }

  if (state.mode === "light") {
    refs.previewStage.style.setProperty("--preview-ink", darkest);
    refs.previewStage.style.setProperty("--preview-muted", "rgba(20, 20, 20, 0.6)");
    refs.previewStage.style.setProperty("--preview-accent", accent);
    refs.previewStage.style.setProperty("--preview-accent-2", accentNext);
    refs.previewStage.style.setProperty("--preview-accent-ink", pickReadableText(accent));
    refs.previewStage.style.setProperty("--preview-surface", first);
    refs.previewStage.style.setProperty("--preview-surface-soft", second);
    refs.previewStage.style.setProperty("--preview-surface-secondary", soft);
    refs.previewStage.style.setProperty("--preview-surface-deep", deepInfo);
    refs.previewStage.style.setProperty("--preview-surface-deep-ink", pickReadableText(deepInfo));
    refs.previewStage.style.setProperty("--preview-outline", "rgba(20, 20, 20, 0.08)");
    refs.previewStage.style.setProperty("--preview-shell-bg", first);
    refs.previewStage.style.setProperty("--preview-topbar-bg", lightTopbarBg);
    refs.previewStage.style.setProperty("--preview-card-bg", lightCardBg);
    refs.previewStage.style.setProperty("--preview-card-border", "rgba(20, 20, 20, 0.08)");
    refs.previewStage.style.setProperty("--preview-card-shadow", "0 28px 60px rgba(20, 20, 20, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)");
    refs.previewStage.style.setProperty("--preview-panel-bg", lightPanelBg);
    refs.previewStage.style.setProperty("--preview-panel-bg-alt", lightPanelAlt);
    refs.previewStage.style.setProperty("--preview-panel-strong", lightPanelStrong);
    refs.previewStage.style.setProperty("--preview-panel-border", "rgba(20, 20, 20, 0.08)");
    refs.previewStage.style.setProperty("--preview-panel-hero-start", lightHeroStart);
    refs.previewStage.style.setProperty("--preview-panel-hero-end", lightHeroEnd);
    refs.previewStage.style.setProperty("--preview-control-bg", lightControlBg);
    refs.previewStage.style.setProperty("--preview-icon-bg", blendHex(accent, "#FFFFFF", 0.8));
    refs.previewStage.style.setProperty("--preview-icon-ink", blendHex(darkest, "#FFFFFF", 0.12));
    refs.previewStage.style.setProperty("--preview-toggle-off", "rgba(20, 20, 20, 0.16)");
    refs.previewStage.style.setProperty("--preview-ring-border", "rgba(20, 20, 20, 0.1)");
    refs.previewStage.style.setProperty("--preview-loader-track", blendHex(accent, "#FFFFFF", 0.76));
    refs.previewStage.style.setProperty("--preview-backdrop", `linear-gradient(135deg, ${first} 0%, ${soft} 48%, ${second} 100%)`);
  } else {
    refs.previewStage.style.setProperty("--preview-ink", darkInk);
    refs.previewStage.style.setProperty("--preview-muted", "rgba(255, 255, 255, 0.6)");
    refs.previewStage.style.setProperty("--preview-accent", accent);
    refs.previewStage.style.setProperty("--preview-accent-2", accentNext);
    refs.previewStage.style.setProperty("--preview-accent-ink", pickReadableText(accent));
    refs.previewStage.style.setProperty("--preview-surface", darkCardBg);
    refs.previewStage.style.setProperty("--preview-surface-soft", darkPanelBg);
    refs.previewStage.style.setProperty("--preview-surface-secondary", darkPanelAlt);
    refs.previewStage.style.setProperty("--preview-surface-deep", first);
    refs.previewStage.style.setProperty("--preview-surface-deep-ink", darkInk);
    refs.previewStage.style.setProperty("--preview-outline", "rgba(255, 255, 255, 0.1)");
    refs.previewStage.style.setProperty("--preview-shell-bg", darkShellBg);
    refs.previewStage.style.setProperty("--preview-topbar-bg", darkTopbarBg);
    refs.previewStage.style.setProperty("--preview-card-bg", darkCardBg);
    refs.previewStage.style.setProperty("--preview-card-border", "rgba(255, 255, 255, 0.08)");
    refs.previewStage.style.setProperty("--preview-card-shadow", "0 28px 64px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.04)");
    refs.previewStage.style.setProperty("--preview-panel-bg", darkPanelBg);
    refs.previewStage.style.setProperty("--preview-panel-bg-alt", darkPanelAlt);
    refs.previewStage.style.setProperty("--preview-panel-strong", darkPanelStrong);
    refs.previewStage.style.setProperty("--preview-panel-border", "rgba(255, 255, 255, 0.08)");
    refs.previewStage.style.setProperty("--preview-panel-hero-start", darkHeroStart);
    refs.previewStage.style.setProperty("--preview-panel-hero-end", darkHeroEnd);
    refs.previewStage.style.setProperty("--preview-control-bg", darkControlBg);
    refs.previewStage.style.setProperty("--preview-icon-bg", darkIconBg);
    refs.previewStage.style.setProperty("--preview-icon-ink", blendHex(darkInk, "#FFFFFF", 0.16));
    refs.previewStage.style.setProperty("--preview-toggle-off", darkToggleOff);
    refs.previewStage.style.setProperty("--preview-ring-border", "rgba(255, 255, 255, 0.12)");
    refs.previewStage.style.setProperty("--preview-loader-track", blendHex(accentNext, darkCardBg, 0.72));
    refs.previewStage.style.setProperty(
      "--preview-backdrop",
      `radial-gradient(circle at 18% 14%, ${blendHex(accent, "#FFFFFF", 0.18)} 0%, transparent 28%), radial-gradient(circle at 84% 78%, ${blendHex(tag, "#FFFFFF", 0.08)} 0%, transparent 26%), linear-gradient(145deg, ${blendHex(first, "#020304", 0.52)} 0%, ${blendHex(second, "#040506", 0.44)} 42%, ${blendHex(tag, "#060709", 0.4)} 100%)`,
    );
  }
}

function renderBand(container, palette, prefix) {
  container.style.setProperty("--step-count", String(palette.length));
  container.style.gridTemplateColumns = `repeat(${palette.length}, minmax(var(--scale-step-min, 0px), 1fr))`;
  container.innerHTML = palette
    .map((step) => {
      const name = buildStepName(prefix, step.index);
      const isAnchor = prefix === "color" && step.index === state.anchorIndex;
      const displayValue = formatDisplayValue(step.hex);
      return `
        <button
          type="button"
          class="scale-band-step ${isAnchor ? "is-anchor" : ""}"
          style="background:${step.hex}; --step-ink:${pickReadableText(step.hex)}"
          data-index="${step.index}"
          data-name="${name}"
          data-hex="${step.hex}"
          aria-label="${name} ${step.hex}，点击复制"
        >
          <span class="scale-step-value">${displayValue}</span>
          <span class="scale-step-name">${name}</span>
        </button>
      `;
    })
    .join("");
}

function render() {
  hideTooltip();
  setScaleIndicatorFollowing(false);
  syncDocumentFavicon();
  syncViewportScrollbarWidth();
  refs.body.dataset.theme = state.mode;
  const pageBg = state.mode === "dark" ? "#0f0f0f" : "#f2f2f2";
  document.documentElement.style.backgroundColor = pageBg;
  refs.body.style.backgroundColor = pageBg;
  document.documentElement.style.colorScheme = state.mode;
  updateAnchorOptions();
  setModeState(state.mode);
  setExportFormatState(state.exportFormat);
  setPreviewFormatState(state.previewFormat);
  setPreviewSceneState(state.previewScene);
  syncInputs();

  const palette = buildPalette(state.anchorHex, state.anchorIndex, state.count, state.mode);
  const neutralPalette = buildNeutralPalette(state.count, state.mode);
  state.palette = palette;

  renderBand(refs.scaleBand, palette, "color");
  renderBand(refs.neutralScaleBand, neutralPalette, "gray");
  syncAnchorStepObserver();
  syncScaleIndicatorToAnchor();
  renderPreviewShowcase(palette);
  initPreviewMobileCarousel();
  syncHeroCardFrame();
  syncHeroReserve();
  syncHeroShadow();
  syncHeroCardFrame();
  syncHeroReserve();
  scheduleScaleIndicatorSync();
  scheduleHeroMotionReady();

  const exportPayloads = getExportPayloads(palette, neutralPalette);
  const exportPayload = exportPayloads[state.exportFormat] ?? exportPayloads.design;
  refs.tokensOutput.value = exportPayload.text;
  if (refs.tokensPreview) {
    refs.tokensPreview.textContent = exportPayload.text;
  }
  if (refs.exportMetaLabel) {
    refs.exportMetaLabel.textContent = exportPayload.label;
  }
  if (refs.exportHeroStat) {
    refs.exportHeroStat.textContent = exportPayload.label;
  }
  if (refs.exportFormatNote) {
    refs.exportFormatNote.textContent = exportPayload.note;
  }
  const anchorText = `色阶 ${state.anchorIndex + 1} / ${state.count} 阶`;
  if (refs.exportMeta) {
    refs.exportMeta.textContent = `当前参考：${anchorText}`;
  }
  if (refs.exportHeroAnchor) {
    refs.exportHeroAnchor.textContent = anchorText;
  }
}

function applyAnchor(index, nextHex) {
  const normalized = formatHex(nextHex);
  if (!normalized) return;
  const nextHsb = rgbToHsb(hexToRgb(normalized));
  if (nextHsb.s > 0) {
    state.colorPickerHue = nextHsb.h;
  }
  state.anchorIndex = clamp(index, 0, state.count - 1);
  state.anchorHex = normalized;
  render();
}

function remapAnchorIndex(nextCount) {
  if (state.count === 1) {
    state.anchorIndex = 0;
    return;
  }
  const ratio = state.anchorIndex / Math.max(state.count - 1, 1);
  state.anchorIndex = Math.round(ratio * Math.max(nextCount - 1, 1));
}

function updateCount(nextCount) {
  if (!Number.isFinite(nextCount) || nextCount === state.count) return;
  const boundedCount = clamp(nextCount, minCount, maxCount);
  if (boundedCount === state.count) return;
  remapAnchorIndex(boundedCount);
  state.count = boundedCount;
  render();
}

function fallbackCopyText(text) {
  const fallbackInput = document.createElement("textarea");
  fallbackInput.value = text;
  fallbackInput.setAttribute("readonly", "");
  fallbackInput.style.position = "fixed";
  fallbackInput.style.left = "-9999px";
  fallbackInput.style.top = "0";
  document.body.appendChild(fallbackInput);
  fallbackInput.focus();
  fallbackInput.select();
  fallbackInput.setSelectionRange(0, fallbackInput.value.length);
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    fallbackInput.remove();
  }
}

async function copyText(text) {
  if (fallbackCopyText(text)) {
    return true;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function showCopyFeedback(button, message, didCopy) {
  if (!button) return;
  if (button.copyFeedbackTimer) {
    window.clearTimeout(button.copyFeedbackTimer);
  }
  if (refs.copyFeedback) {
    refs.copyFeedback.textContent = message;
  }
  button.classList.remove("is-copied", "is-copy-failed");
  button.classList.add(didCopy ? "is-copied" : "is-copy-failed");
  button.copyFeedbackTimer = window.setTimeout(() => {
    button.classList.remove("is-copied", "is-copy-failed");
  }, 1200);
}

function showScaleCopyFeedback(step, didCopy) {
  if (!step) return;
  if (step.copyFeedbackTimer) {
    window.clearTimeout(step.copyFeedbackTimer);
  }
  step.dataset.feedback = didCopy ? "已复制" : "复制失败";
  step.classList.remove("is-copied", "is-copy-failed");
  step.classList.add(didCopy ? "is-copied" : "is-copy-failed");
  step.copyFeedbackTimer = window.setTimeout(() => {
    step.classList.remove("is-copied", "is-copy-failed");
    step.dataset.feedback = "";
  }, 1200);
}

function bindScaleBandInteractions(container) {
  container.addEventListener("click", async (event) => {
    const step = event.target.closest(".scale-band-step");
    if (!step) return;
    const didCopy = await copyText(step.dataset.hex);
    showGlobalMessage(
      didCopy ? `${step.dataset.name} 已复制：${step.dataset.hex}` : "复制失败，请重试",
      didCopy ? "success" : "error",
      step,
    );
  });

  if (container !== refs.scaleBand) return;

  container.addEventListener("pointerover", (event) => {
    const step = event.target.closest(".scale-band-step");
    if (!step || !container.contains(step)) return;
    if (Number(step.dataset.index) === state.anchorIndex) {
      setScaleIndicatorFollowing(true);
    }
    scheduleScaleIndicatorSync();
  });

  container.addEventListener("pointerout", (event) => {
    const step = event.target.closest(".scale-band-step");
    if (!step || !container.contains(step)) return;
    const relatedStep =
      event.relatedTarget instanceof Element ? event.relatedTarget.closest(".scale-band-step") : null;
    if (relatedStep === step) return;
    scheduleScaleIndicatorSync();
  });

  container.addEventListener("focusin", (event) => {
    const step = event.target.closest(".scale-band-step");
    if (!step || !container.contains(step)) return;
    if (Number(step.dataset.index) === state.anchorIndex) {
      setScaleIndicatorFollowing(true);
    }
    scheduleScaleIndicatorSync();
  });

  container.addEventListener("focusout", (event) => {
    const step = event.target.closest(".scale-band-step");
    if (!step || !container.contains(step)) return;
    scheduleScaleIndicatorSync();
  });

  container.addEventListener("transitionend", (event) => {
    const step = event.target.closest(".scale-band-step");
    if (!step || !container.contains(step) || event.propertyName !== "height") return;
    if (Number(step.dataset.index) === state.anchorIndex && !step.matches(":hover, :focus-visible")) {
      setScaleIndicatorFollowing(false);
    }
    scheduleScaleIndicatorSync();
  });
}

refs.modeToggle.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (!button) return;
  state.mode = button.dataset.mode;
  render();
});

refs.modeToggleMobile?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (!button) return;
  state.mode = button.dataset.mode;
  render();
});

refs.countIncreaseBtn.addEventListener("click", () => {
  updateCount(state.count + 1);
  refs.countIncreaseBtn.blur();
});

refs.countDecreaseBtn.addEventListener("click", () => {
  updateCount(state.count - 1);
  refs.countDecreaseBtn.blur();
});

refs.anchorSelectTrigger?.addEventListener("click", () => {
  setAnchorMenuOpen(!anchorMenuOpen);
});

refs.anchorSelectMenu?.addEventListener("click", (event) => {
  const option = event.target.closest("[data-anchor-option]");
  if (!option) return;
  state.anchorIndex = Number(option.dataset.anchorOption);
  setAnchorMenuOpen(false);
  render();
});

refs.anchorColorTrigger.addEventListener("click", () => {
  hideTooltip(refs.anchorColorTrigger);
  setColorPopoverOpen(!colorPopoverOpen);
});

refs.anchorColorPicker.addEventListener("input", (event) => {
  applyAnchor(state.anchorIndex, event.target.value);
});

refs.colorPickerHue?.addEventListener("input", (event) => {
  const current = rgbToHsb(hexToRgb(state.anchorHex));
  applyPickerHsb({
    h: Number(event.target.value),
    s: current.s,
    b: current.b,
  });
});

refs.colorPickerSv?.addEventListener("pointerdown", (event) => {
  colorPickerDraggingSv = true;
  updatePickerSvFromPointer(event.clientX, event.clientY);
});

window.addEventListener("pointermove", (event) => {
  if (!colorPickerDraggingSv) return;
  updatePickerSvFromPointer(event.clientX, event.clientY);
});

window.addEventListener("pointerup", () => {
  colorPickerDraggingSv = false;
});

document.querySelector(".color-picker-model-toggle")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-color-model]");
  if (!button) return;
  state.colorPickerModel = button.dataset.colorModel;
  syncColorPopover();
});

[refs.colorPickerChannel1, refs.colorPickerChannel2, refs.colorPickerChannel3].forEach((input) => {
  input?.addEventListener("change", applyPickerChannelInputs);
});

refs.colorPickerEyeDropper?.addEventListener("click", async () => {
  if ("EyeDropper" in window) {
    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      applyAnchor(state.anchorIndex, result.sRGBHex);
      return;
    } catch {
      return;
    }
  }

  refs.anchorColorPicker.click();
});

refs.anchorColorPopover?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const interactiveTarget = target.closest("input, button, label, .color-picker-sv, .color-picker-tools");
  if (interactiveTarget) return;
  restoreColorPickerValueIfNeeded();
});

refs.anchorHexInput.addEventListener("input", (event) => {
  syncAnchorHexWidth(event.target.value);
  const maybeHex = normalizeHex(event.target.value);
  if (maybeHex) {
    applyAnchor(state.anchorIndex, maybeHex);
  }
});

refs.anchorHexInput.addEventListener("blur", () => {
  refs.anchorHexInput.value = state.anchorHex;
  syncAnchorHexWidth(state.anchorHex);
});

refs.copyTokensBtn.addEventListener("click", async () => {
  hideTooltip(refs.copyTokensBtn);
  const didCopy = await copyText(refs.tokensOutput.value);
  showGlobalMessage(
    didCopy ? "变量输出已复制" : "复制失败，请重试",
    didCopy ? "success" : "error",
    refs.copyTokensBtn,
  );
});

refs.shuffleBtn.addEventListener("click", () => {
  hideTooltip(refs.shuffleBtn);
  const next = sampleColors[Math.floor(Math.random() * sampleColors.length)];
  applyAnchor(state.anchorIndex, next);
});

document.addEventListener("click", (event) => {
  if (!anchorMenuOpen) return;
  if (refs.anchorSelectMenu?.parentElement?.contains(event.target)) return;
  setAnchorMenuOpen(false);
});

document.addEventListener("click", (event) => {
  if (!colorPopoverOpen) return;
  if (refs.anchorColorPopover?.contains(event.target) || refs.anchorColorTrigger?.contains(event.target)) return;
  setColorPopoverOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && anchorMenuOpen) {
    setAnchorMenuOpen(false);
    refs.anchorSelectTrigger?.focus();
  }
  if (event.key === "Escape" && colorPopoverOpen) {
    setColorPopoverOpen(false);
    refs.anchorColorTrigger?.focus();
  }
});

bindScaleBandInteractions(refs.scaleBand);
bindScaleBandInteractions(refs.neutralScaleBand);

if (refs.previewFormatToggle) {
  refs.previewFormatToggle.addEventListener("click", (event) => {
    const button = event.target.closest("[data-format]");
    if (!button) return;
    state.previewFormat = button.dataset.format;
    render();
  });
}

if (refs.exportFormatToggle) {
  refs.exportFormatToggle.addEventListener("click", (event) => {
    const button = event.target.closest("[data-export-format]");
    if (!button) return;
    state.exportFormat = button.dataset.exportFormat;
    render();
  });
}

if (refs.previewSceneToggle) {
  refs.previewSceneToggle.addEventListener("click", (event) => {
    const button = event.target.closest("[data-scene]");
    if (!button) return;
    state.previewScene = button.dataset.scene;
    render();
  });
}

function handleScrollEffects() {
  syncHeroShadow();
  syncHeroCardFrame();
  if (refs.tooltipTarget) {
    positionTooltip(refs.tooltipTarget);
  }
  if (refs.message?.classList.contains("is-visible")) {
    positionGlobalMessage(refs.messageAnchor);
  }
}

function scheduleScrollEffects() {
  if (scrollEffectFrame) return;
  scrollEffectFrame = window.requestAnimationFrame(() => {
    scrollEffectFrame = 0;
    handleScrollEffects();
  });
}

window.addEventListener("resize", () => {
  syncHeroResizeMotion();
  syncScaleIndicatorResizeMotion();
  syncViewportScrollbarWidth();
  syncHeroCardFrame();
  syncHeroReserve();
  syncScaleIndicatorToAnchor();
  syncAnchorStepObserver();
  schedulePreviewMobileCarouselSync();
  if (refs.message?.classList.contains("is-visible")) {
    positionGlobalMessage(refs.messageAnchor);
  }
});
window.addEventListener("resize", () => {
  if (refs.tooltipTarget) {
    positionTooltip(refs.tooltipTarget);
  }
});
window.addEventListener("scroll", scheduleScrollEffects, { passive: true });
document.addEventListener("scroll", scheduleScrollEffects, { passive: true, capture: true });
getScrollContainer().addEventListener("scroll", scheduleScrollEffects, { passive: true });
if (typeof browserDarkScheme.addEventListener === "function") {
  browserDarkScheme.addEventListener("change", syncDocumentFavicon);
} else if (typeof browserDarkScheme.addListener === "function") {
  browserDarkScheme.addListener(syncDocumentFavicon);
}

bindTooltips();
render();
