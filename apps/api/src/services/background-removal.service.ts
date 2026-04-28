import sharp from 'sharp';

export interface TransparentBackgroundQuality {
  width: number;
  height: number;
  hasAlpha: boolean;
  transparentPixelRatio: number;
  transparentBorderRatio: number;
  opaqueCenterOrSubjectRatio: number;
  darkCompositeBorderLuma: number;
  edgeBackgroundLuma: number;
  edgeBackgroundStdDev: number;
}

interface RawImage {
  data: Buffer;
  width: number;
  height: number;
}

interface BackgroundEstimate {
  r: number;
  g: number;
  b: number;
  luma: number;
  stdDev: number;
}

const TRANSPARENT_ALPHA = 16;
const OPAQUE_ALPHA = 240;
const DARK_BACKGROUND = { r: 10, g: 10, b: 11 };

function pixelOffset(width: number, x: number, y: number): number {
  return (y * width + x) * 4;
}

function luma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function colorDistance(data: Buffer, offset: number, bg: BackgroundEstimate): number {
  const dr = data[offset] - bg.r;
  const dg = data[offset + 1] - bg.g;
  const db = data[offset + 2] - bg.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function* borderCoordinates(width: number, height: number): Generator<[number, number]> {
  for (let x = 0; x < width; x++) {
    yield [x, 0];
    yield [x, height - 1];
  }

  for (let y = 1; y < height - 1; y++) {
    yield [0, y];
    yield [width - 1, y];
  }
}

async function decodeRgba(buffer: Buffer): Promise<RawImage> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    width: info.width,
    height: info.height,
  };
}

function estimateEdgeBackground(raw: RawImage): BackgroundEstimate {
  const samples: Array<[number, number, number]> = [];

  for (const [x, y] of borderCoordinates(raw.width, raw.height)) {
    const offset = pixelOffset(raw.width, x, y);
    samples.push([raw.data[offset], raw.data[offset + 1], raw.data[offset + 2]]);
  }

  const count = Math.max(samples.length, 1);
  const mean = samples.reduce(
    (acc, [r, g, b]) => {
      acc.r += r;
      acc.g += g;
      acc.b += b;
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );
  mean.r /= count;
  mean.g /= count;
  mean.b /= count;

  const variance =
    samples.reduce((acc, [r, g, b]) => {
      const dr = r - mean.r;
      const dg = g - mean.g;
      const db = b - mean.b;
      return acc + (dr * dr + dg * dg + db * db) / 3;
    }, 0) / count;

  return {
    ...mean,
    luma: luma(mean.r, mean.g, mean.b),
    stdDev: Math.sqrt(variance),
  };
}

function assertLightUniformBackground(bg: BackgroundEstimate): void {
  const channelSpread = Math.max(bg.r, bg.g, bg.b) - Math.min(bg.r, bg.g, bg.b);

  if (bg.luma < 210 || channelSpread > 35 || bg.stdDev > 24) {
    throw new Error('균일한 밝은 배경이 아니어서 배경 제거를 중단했습니다');
  }
}

function floodFillEdgeBackground(raw: RawImage, bg: BackgroundEstimate): Uint8Array {
  const pixelCount = raw.width * raw.height;
  const backgroundMask = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const tolerance = Math.max(30, Math.min(64, bg.stdDev * 2 + 24));
  let head = 0;
  let tail = 0;

  const tryEnqueue = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= raw.width || y >= raw.height) return;

    const index = y * raw.width + x;
    if (backgroundMask[index]) return;

    const offset = pixelOffset(raw.width, x, y);
    if (raw.data[offset + 3] <= TRANSPARENT_ALPHA) return;
    if (colorDistance(raw.data, offset, bg) > tolerance) return;

    backgroundMask[index] = 1;
    queue[tail++] = index;
  };

  for (const [x, y] of borderCoordinates(raw.width, raw.height)) {
    tryEnqueue(x, y);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % raw.width;
    const y = Math.floor(index / raw.width);

    tryEnqueue(x + 1, y);
    tryEnqueue(x - 1, y);
    tryEnqueue(x, y + 1);
    tryEnqueue(x, y - 1);
  }

  return backgroundMask;
}

async function featherAlphaMask(
  backgroundMask: Uint8Array,
  width: number,
  height: number
): Promise<Buffer> {
  const alpha = Buffer.alloc(width * height);
  for (let i = 0; i < backgroundMask.length; i++) {
    alpha[i] = backgroundMask[i] ? 0 : 255;
  }

  return sharp(alpha, {
    raw: {
      width,
      height,
      channels: 1,
    },
  })
    .blur(0.6)
    .extractChannel(0)
    .raw()
    .toBuffer();
}

export async function analyzeTransparentOutputQuality(
  buffer: Buffer
): Promise<TransparentBackgroundQuality> {
  const metadata = await sharp(buffer).metadata();
  const raw = await decodeRgba(buffer);
  const totalPixels = raw.width * raw.height;
  let transparentPixels = 0;
  let borderPixels = 0;
  let transparentBorderPixels = 0;
  let darkCompositeBorderLumaSum = 0;
  let centerNonTransparentPixels = 0;
  let centerOpaquePixels = 0;
  let minAlpha = 255;

  const centerLeft = Math.floor(raw.width * 0.25);
  const centerRight = Math.ceil(raw.width * 0.75);
  const centerTop = Math.floor(raw.height * 0.25);
  const centerBottom = Math.ceil(raw.height * 0.75);

  for (let y = 0; y < raw.height; y++) {
    for (let x = 0; x < raw.width; x++) {
      const offset = pixelOffset(raw.width, x, y);
      const alpha = raw.data[offset + 3];
      minAlpha = Math.min(minAlpha, alpha);

      if (alpha <= TRANSPARENT_ALPHA) {
        transparentPixels++;
      }

      if (x >= centerLeft && x < centerRight && y >= centerTop && y < centerBottom) {
        if (alpha > TRANSPARENT_ALPHA) {
          centerNonTransparentPixels++;
          if (alpha >= OPAQUE_ALPHA) {
            centerOpaquePixels++;
          }
        }
      }
    }
  }

  for (const [x, y] of borderCoordinates(raw.width, raw.height)) {
    const offset = pixelOffset(raw.width, x, y);
    const alpha = raw.data[offset + 3];
    const alphaRatio = alpha / 255;
    const compositedR = raw.data[offset] * alphaRatio + DARK_BACKGROUND.r * (1 - alphaRatio);
    const compositedG = raw.data[offset + 1] * alphaRatio + DARK_BACKGROUND.g * (1 - alphaRatio);
    const compositedB = raw.data[offset + 2] * alphaRatio + DARK_BACKGROUND.b * (1 - alphaRatio);

    borderPixels++;
    if (alpha <= TRANSPARENT_ALPHA) {
      transparentBorderPixels++;
    }
    darkCompositeBorderLumaSum += luma(compositedR, compositedG, compositedB);
  }

  const edgeBackground = estimateEdgeBackground(raw);

  return {
    width: raw.width,
    height: raw.height,
    hasAlpha: metadata.hasAlpha === true && minAlpha < 255,
    transparentPixelRatio: transparentPixels / totalPixels,
    transparentBorderRatio: transparentBorderPixels / Math.max(borderPixels, 1),
    opaqueCenterOrSubjectRatio:
      centerNonTransparentPixels > 0 ? centerOpaquePixels / centerNonTransparentPixels : 0,
    darkCompositeBorderLuma: darkCompositeBorderLumaSum / Math.max(borderPixels, 1),
    edgeBackgroundLuma: edgeBackground.luma,
    edgeBackgroundStdDev: edgeBackground.stdDev,
  };
}

export function assertTransparentOutputQuality(quality: TransparentBackgroundQuality): void {
  if (!quality.hasAlpha) {
    throw new Error('투명 채널이 없습니다');
  }

  if (quality.transparentPixelRatio < 0.15 || quality.transparentPixelRatio > 0.95) {
    throw new Error('투명 픽셀 비율이 품질 기준을 벗어났습니다');
  }

  if (quality.transparentBorderRatio < 0.85) {
    throw new Error('외곽 배경이 충분히 제거되지 않았습니다');
  }

  if (quality.opaqueCenterOrSubjectRatio < 0.6) {
    throw new Error('중앙 피사체가 과도하게 지워졌습니다');
  }

  if (quality.darkCompositeBorderLuma > 40) {
    throw new Error('어두운 배경 합성 시 외곽 밝기가 너무 높습니다');
  }
}

export async function removeUniformLightBackground(
  buffer: Buffer
): Promise<{ buffer: Buffer; hasTransparency: true; quality: TransparentBackgroundQuality }> {
  const raw = await decodeRgba(buffer);
  const background = estimateEdgeBackground(raw);
  assertLightUniformBackground(background);

  const backgroundMask = floodFillEdgeBackground(raw, background);
  const featheredAlpha = await featherAlphaMask(backgroundMask, raw.width, raw.height);
  const outputRaw = Buffer.alloc(raw.width * raw.height * 4);

  for (let i = 0; i < raw.width * raw.height; i++) {
    const offset = i * 4;
    outputRaw[offset] = raw.data[offset];
    outputRaw[offset + 1] = raw.data[offset + 1];
    outputRaw[offset + 2] = raw.data[offset + 2];
    outputRaw[offset + 3] = featheredAlpha[i];
  }

  const output = await sharp(outputRaw, {
    raw: {
      width: raw.width,
      height: raw.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
  const quality = await analyzeTransparentOutputQuality(output);
  assertTransparentOutputQuality(quality);

  return { buffer: output, hasTransparency: true, quality };
}
