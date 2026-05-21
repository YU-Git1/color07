const state = {
  mode: "light",
  count: 10,
  anchorIndex: 5,
  anchorHex: "#0BBBD6",
  palette: [],
  previewFormat: "hex",
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
  anchorSelect: document.getElementById("anchorSelect"),
  anchorColorPicker: document.getElementById("anchorColorPicker"),
  anchorColorTrigger: document.getElementById("anchorColorTrigger"),
  anchorSwatch: document.getElementById("anchorSwatch"),
  anchorHexInput: document.getElementById("anchorHexInput"),
  anchorHexSizer: document.getElementById("anchorHexSizer"),
  statusText: document.getElementById("statusText"),
  scaleBandGroup: document.getElementById("scaleBandGroup"),
  scaleBand: document.getElementById("scaleBand"),
  scaleBandIndicator: document.getElementById("scaleBandIndicator"),
  neutralScaleBand: document.getElementById("neutralScaleBand"),
  previewStage: document.getElementById("previewStage"),
  previewFormatToggle: document.getElementById("previewFormatToggle"),
  previewMetricList: document.getElementById("previewMetricList"),
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
let anchorStepResizeObserver = null;
const browserDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const faviconVersion = "20260520-2";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function buildStepName(prefix, index) {
  return `${prefix}-${index + 1}`;
}

function updateAnchorOptions() {
  refs.anchorSelect.innerHTML = Array.from({ length: state.count }, (_, index) => {
    return `<option value="${index}" ${index === state.anchorIndex ? "selected" : ""}>${index + 1}</option>`;
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
  refs.anchorSelect.value = String(state.anchorIndex);
  refs.statusText.innerHTML = `当前以 色阶 ${state.anchorIndex + 1} 为参考`;
  syncAnchorHexWidth(state.anchorHex);
  syncCountStepper();
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
  const nearDark = palette[Math.max(palette.length - 2, 0)]?.hex ?? "#111111";
  const darkest = palette[palette.length - 1]?.hex ?? nearDark;
  const accent = palette[state.anchorIndex]?.hex ?? state.anchorHex;
  const accentNext = palette[Math.min(state.anchorIndex + 1, palette.length - 1)]?.hex ?? accent;

  if (refs.previewMetricList) {
    const placements = [
      { label: `当前锚点 color-${state.anchorIndex + 1}`, value: formatDisplayValue(accent) },
      { label: "浅底强调", value: formatDisplayValue(first) },
      {
        label: "状态标签",
        value: formatDisplayValue(palette[Math.max(Math.floor((palette.length - 1) / 3), 0)]?.hex ?? accent),
      },
      { label: "深色文字", value: formatDisplayValue(darkest) },
    ];

    refs.previewMetricList.innerHTML = placements
      .map(
        (item) => `
          <div class="preview-metric-item">
            <span class="preview-metric-name">${item.label}</span>
            <span class="preview-metric-value">${item.value}</span>
          </div>
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
  } else {
    refs.previewStage.style.setProperty("--preview-ink", first);
    refs.previewStage.style.setProperty("--preview-muted", "rgba(255, 255, 255, 0.6)");
    refs.previewStage.style.setProperty("--preview-accent", accentNext);
    refs.previewStage.style.setProperty("--preview-accent-2", accent);
    refs.previewStage.style.setProperty("--preview-accent-ink", pickReadableText(accentNext));
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

refs.anchorSelect.addEventListener("change", (event) => {
  state.anchorIndex = Number(event.target.value);
  render();
});

refs.anchorColorTrigger.addEventListener("click", () => {
  hideTooltip(refs.anchorColorTrigger);
  refs.anchorColorPicker.click();
});

refs.anchorColorPicker.addEventListener("input", (event) => {
  applyAnchor(state.anchorIndex, event.target.value);
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
