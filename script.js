const state = {
  mode: "light",
  count: 10,
  anchorIndex: 5,
  anchorHex: "#0BBBD6",
  palette: [],
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
  previewBadge: document.getElementById("previewBadge"),
  previewHeading: document.getElementById("previewHeading"),
  previewDescription: document.getElementById("previewDescription"),
  previewPrimaryAction: document.getElementById("previewPrimaryAction"),
  previewSecondaryAction: document.getElementById("previewSecondaryAction"),
  previewStatus: document.getElementById("previewStatus"),
  previewMetricList: document.getElementById("previewMetricList"),
  previewSceneTab: document.getElementById("previewSceneTab"),
  previewSceneKicker: document.getElementById("previewSceneKicker"),
  previewSceneTitle: document.getElementById("previewSceneTitle"),
  previewSceneDescription: document.getElementById("previewSceneDescription"),
  previewScenePrimaryAction: document.getElementById("previewScenePrimaryAction"),
  previewSceneSecondaryAction: document.getElementById("previewSceneSecondaryAction"),
  previewAccentLabel: document.getElementById("previewAccentLabel"),
  previewAnchorName: document.getElementById("previewAnchorName"),
  previewAnchorValue: document.getElementById("previewAnchorValue"),
  previewChipRow: document.getElementById("previewChipRow"),
  previewDeepLabel: document.getElementById("previewDeepLabel"),
  previewDeepTitle: document.getElementById("previewDeepTitle"),
  previewDeepValue: document.getElementById("previewDeepValue"),
  exportMeta: document.getElementById("exportMeta"),
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
  const isElevated = refs.heroCard.classList.contains("is-elevated");
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
      const eased = Math.pow(t, 0.82);
      const tail = Math.pow(t, 3.1) * 0.11;
      const l = clamp(0.988 - 0.69 * eased - tail, 0.1, 0.988);
      const cWeight = clamp(
        0.22 +
          1.06 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.9)), 0.88) -
          Math.max(0, t - 0.82) * 0.26,
        0.14,
        1.12,
      );
      return { l, cWeight };
    }

    const eased = Math.pow(t, 0.9);
    const lift = Math.pow(1 - t, 3) * 0.025;
    const l = clamp(0.082 + 0.74 * eased + 0.12 * Math.pow(t, 2.25) + lift, 0.065, 0.968);
    const cWeight = clamp(
      0.18 +
        0.98 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.96)), 0.84) -
        Math.max(0, t - 0.86) * 0.2,
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
  const { upper: upperLimit, lower: lowerLimit } = getAdaptiveLightnessLimits(anchorOklch, mode);
  const maxBrighterDelta = brighterDeltas.length ? Math.max(...brighterDeltas, 0) : 0;
  const maxDeeperDelta = deeperDeltas.length ? Math.min(...deeperDeltas, 0) : 0;
  const lightenScale = maxBrighterDelta > 0 ? Math.min(1, (upperLimit - anchorOklch.l) / maxBrighterDelta) : 1;
  const darkenScale = maxDeeperDelta < 0 ? Math.min(1, (anchorOklch.l - lowerLimit) / Math.abs(maxDeeperDelta)) : 1;

  const rawSteps = blueprint.map((step, index) => {
    if (index === anchorIndex) {
      return {
        index,
        l: anchorOklch.l,
        c: anchorOklch.c,
        h: anchorOklch.h,
        isAnchor: true,
      };
    }

    const delta = step.l - anchorTarget;
    const scaledL = anchorOklch.l + delta * (delta > 0 ? lightenScale : darkenScale);
    const stepDistance = Math.abs(index - anchorIndex) / Math.max(count - 1, 1);
    const hue = getAdaptiveHue(anchorOklch.h, stepDistance, delta, anchorOklch.c);
    const chroma = getAdaptiveStepChroma({
      anchorOklch,
      anchorWeight,
      stepWeight: step.cWeight,
      scaledL,
      distance: stepDistance,
      delta,
      mode,
    });
    return {
      index,
      l: clamp(scaledL, lowerLimit, upperLimit),
      c: chroma,
      h: hue,
      isAnchor: false,
    };
  });

  return smoothStepProfiles(rawSteps, anchorIndex).map((step) => {
    if (step.isAnchor) {
      return { index: step.index, hex: formatHex(anchorHex), oklch: anchorOklch };
    }

    const hex = fitOklchToHex({
      l: step.l,
      c: step.c,
      h: step.h,
    });

    return { index: step.index, hex };
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

function showGlobalMessage(text, tone = "success") {
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

  window.requestAnimationFrame(() => {
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

  const previewScenes = {
    app: {
      badge: "APP / 移动应用",
      heading: "看这组颜色放进移动应用后，按钮、标签和卡片是否协调",
      description: "适合看工具类、效率类、会员类 APP 的常见落位。重点判断主按钮够不够稳、功能标签会不会发灰、深色卡片还能不能清楚。",
      primaryAction: "开通会员",
      secondaryAction: "稍后再看",
      status: "移动应用场景",
      sceneTab: "Member Center",
      sceneKicker: "APP 首页",
      sceneTitle: "会员权益、功能标签和主按钮的真实落位",
      sceneDescription: "模拟应用首页里最常用的几个角色：主 CTA、标签、权益卡片和深色信息块，看它能不能直接用在产品界面里。",
      scenePrimaryAction: "立即开通",
      sceneSecondaryAction: "查看权益",
      accentLabel: "主强调色",
      deepLabel: "深色卡片",
      deepTitle: "夜间信息块",
      metrics: [
        { label: "主按钮", note: "主操作是否足够稳定抓眼", role: "accent" },
        { label: "次级按钮", note: "弱一级操作是否仍然清晰", role: "soft" },
        { label: "功能标签", note: "轻量信息是否还能被看见", role: "tag" },
        { label: "深色卡片", note: "深背景里的文字是否清楚", role: "deepInfo" },
      ],
      chips: [
        { label: "会员标签", role: "tag" },
        { label: "浅底高亮", role: "second" },
        { label: "状态提醒", role: "accentNext" },
      ],
    },
    site: {
      badge: "Site / 网站页面",
      heading: "看这组颜色进入网站页面后，首屏 CTA、说明标签和内容分区是否顺畅",
      description: "适合看官网、活动页、产品介绍站点的常见落位。重点判断品牌感够不够、浅底模块会不会脏、CTA 按钮是否有转化感。",
      primaryAction: "立即预约",
      secondaryAction: "浏览案例",
      status: "网站页面场景",
      sceneTab: "Landing Hero",
      sceneKicker: "SITE 首屏",
      sceneTitle: "首屏 CTA、说明标签和内容分区的真实落位",
      sceneDescription: "模拟官网首屏里最常见的几个角色：主 CTA、浅底信息区、说明标签和深色内容模块，看它适不适合用来做品牌站。",
      scenePrimaryAction: "立即咨询",
      sceneSecondaryAction: "查看案例",
      accentLabel: "主 CTA",
      deepLabel: "深色内容区",
      deepTitle: "长内容模块",
      metrics: [
        { label: "主 CTA", note: "首屏转化按钮是否够抓眼", role: "accent" },
        { label: "浅底区块", note: "大面积浅底是否干净稳定", role: "first" },
        { label: "说明标签", note: "重点信息是否有记忆点", role: "tag" },
        { label: "深色模块", note: "长文内容区是否还舒服", role: "deepInfo" },
      ],
      chips: [
        { label: "导航高亮", role: "tag" },
        { label: "信息分区", role: "soft" },
        { label: "辅助标签", role: "accentNext" },
      ],
    },
  };

  const scene = previewScenes[state.previewScene] ?? previewScenes.app;
  const first = palette[0]?.hex ?? "#FFFFFF";
  const second = palette[Math.min(1, palette.length - 1)]?.hex ?? first;
  const soft = palette[Math.max(Math.min(state.anchorIndex - 2, palette.length - 1), 0)]?.hex ?? second;
  const tag = palette[Math.max(Math.floor((palette.length - 1) / 3), 0)]?.hex ?? soft;
  const nearDark = palette[Math.max(palette.length - 2, 0)]?.hex ?? "#111111";
  const darkest = palette[palette.length - 1]?.hex ?? nearDark;
  const accent = palette[state.anchorIndex]?.hex ?? state.anchorHex;
  const accentNext = palette[Math.min(state.anchorIndex + 1, palette.length - 1)]?.hex ?? accent;
  const deepInfo = palette[Math.min(state.anchorIndex + 3, palette.length - 1)]?.hex ?? darkest;

  const sceneRoleMap = {
    first,
    second,
    soft,
    tag,
    accent,
    accentNext,
    deepInfo,
  };

  if (refs.previewBadge) refs.previewBadge.textContent = scene.badge;
  if (refs.previewHeading) refs.previewHeading.textContent = scene.heading;
  if (refs.previewDescription) refs.previewDescription.textContent = scene.description;
  if (refs.previewPrimaryAction) refs.previewPrimaryAction.textContent = scene.primaryAction;
  if (refs.previewSecondaryAction) refs.previewSecondaryAction.textContent = scene.secondaryAction;
  if (refs.previewStatus) refs.previewStatus.textContent = scene.status;
  if (refs.previewSceneTab) refs.previewSceneTab.textContent = scene.sceneTab;
  if (refs.previewSceneKicker) refs.previewSceneKicker.textContent = scene.sceneKicker;
  if (refs.previewSceneTitle) refs.previewSceneTitle.textContent = scene.sceneTitle;
  if (refs.previewSceneDescription) refs.previewSceneDescription.textContent = scene.sceneDescription;
  if (refs.previewScenePrimaryAction) refs.previewScenePrimaryAction.textContent = scene.scenePrimaryAction;
  if (refs.previewSceneSecondaryAction) refs.previewSceneSecondaryAction.textContent = scene.sceneSecondaryAction;
  if (refs.previewAccentLabel) refs.previewAccentLabel.textContent = scene.accentLabel;
  if (refs.previewDeepLabel) refs.previewDeepLabel.textContent = scene.deepLabel;
  if (refs.previewDeepTitle) refs.previewDeepTitle.textContent = scene.deepTitle;

  if (refs.previewAnchorName) {
    refs.previewAnchorName.textContent = `color-${state.anchorIndex + 1}`;
  }

  if (refs.previewAnchorValue) {
    refs.previewAnchorValue.textContent = formatDisplayValue(accent);
  }

  if (refs.previewDeepValue) {
    refs.previewDeepValue.textContent = formatDisplayValue(deepInfo);
  }

  if (refs.previewMetricList) {
    const placements = scene.metrics.map((item) => {
      const hex = sceneRoleMap[item.role] ?? accent;
      return {
        ...item,
        hex,
        value: formatDisplayValue(hex),
      };
    });

    refs.previewMetricList.innerHTML = placements
      .map(
        (item) => `
          <div class="preview-metric-item">
            <span class="preview-metric-swatch" style="--preview-metric-swatch:${item.hex}; --preview-metric-ink:${pickReadableText(item.hex)}"></span>
            <div class="preview-metric-copy">
              <span class="preview-metric-name">${item.label}</span>
              <span class="preview-metric-note">${item.note}</span>
            </div>
            <span class="preview-metric-value">${item.value}</span>
          </div>
        `,
      )
      .join("");
  }

  if (refs.previewChipRow) {
    const chips = scene.chips.map((chip) => ({
      label: chip.label,
      hex: sceneRoleMap[chip.role] ?? accentNext,
    }));

    refs.previewChipRow.innerHTML = chips
      .map(
        (chip) => `
          <span
            class="preview-chip"
            style="--preview-chip-bg:${chip.hex}; --preview-chip-ink:${pickReadableText(chip.hex)}"
          >
            ${chip.label}
          </span>
        `,
      )
      .join("");
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
  } else {
    refs.previewStage.style.setProperty("--preview-ink", first);
    refs.previewStage.style.setProperty("--preview-muted", "rgba(255, 255, 255, 0.6)");
    refs.previewStage.style.setProperty("--preview-accent", accentNext);
    refs.previewStage.style.setProperty("--preview-accent-2", accent);
    refs.previewStage.style.setProperty("--preview-accent-ink", pickReadableText(accentNext));
    refs.previewStage.style.setProperty("--preview-surface", nearDark);
    refs.previewStage.style.setProperty("--preview-surface-soft", accent);
    refs.previewStage.style.setProperty("--preview-surface-secondary", tag);
    refs.previewStage.style.setProperty("--preview-surface-deep", darkest);
    refs.previewStage.style.setProperty("--preview-surface-deep-ink", pickReadableText(darkest));
    refs.previewStage.style.setProperty("--preview-outline", "rgba(255, 255, 255, 0.08)");
  }
}

function renderBand(container, palette, prefix) {
  container.style.gridTemplateColumns = `repeat(${palette.length}, minmax(0, 1fr))`;
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
  syncHeroCardFrame();
  syncHeroReserve();
  syncHeroShadow();
  syncHeroCardFrame();
  syncHeroReserve();
  scheduleScaleIndicatorSync();
  scheduleHeroMotionReady();

  const tokenText = buildTokens(palette, neutralPalette);
  refs.tokensOutput.value = tokenText;
  if (refs.tokensPreview) {
    refs.tokensPreview.textContent = tokenText;
  }
  if (refs.exportMeta) {
    refs.exportMeta.textContent = `当前参考：色阶 ${state.anchorIndex + 1} / ${state.count} 阶`;
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
  showGlobalMessage(didCopy ? "变量输出已复制" : "复制失败，请重试", didCopy ? "success" : "error");
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
