import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  analyzeTransparentOutputQuality,
  removeUniformLightBackground,
} from '../background-removal.service.js';

async function createProductOnBackground(background: string): Promise<Buffer> {
  const productSvg = Buffer.from(`
    <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
      <rect x="38" y="28" width="52" height="74" rx="10" fill="#305872"/>
      <circle cx="64" cy="52" r="14" fill="#f2d7c9"/>
      <rect x="52" y="72" width="24" height="18" rx="5" fill="#ffbf47"/>
    </svg>
  `);

  return sharp({
    create: {
      width: 128,
      height: 128,
      channels: 3,
      background,
    },
  })
    .composite([{ input: productSvg }])
    .png()
    .toBuffer();
}

describe('background removal service', () => {
  it('removes a uniform light product-review background and passes quality gates', async () => {
    const input = await createProductOnBackground('#f8f8f8');

    const result = await removeUniformLightBackground(input);
    const metadata = await sharp(result.buffer).metadata();
    const quality = await analyzeTransparentOutputQuality(result.buffer);

    expect(result.hasTransparency).toBe(true);
    expect(metadata.hasAlpha).toBe(true);
    expect(quality.hasAlpha).toBe(true);
    expect(quality.transparentBorderRatio).toBeGreaterThanOrEqual(0.85);
    expect(quality.transparentPixelRatio).toBeGreaterThanOrEqual(0.15);
    expect(quality.transparentPixelRatio).toBeLessThanOrEqual(0.95);
    expect(quality.darkCompositeBorderLuma).toBeLessThanOrEqual(40);
  });

  it('fails closed for dark or low-confidence backgrounds', async () => {
    const input = await createProductOnBackground('#303030');

    await expect(removeUniformLightBackground(input)).rejects.toThrow(
      '균일한 밝은 배경이 아니어서 배경 제거를 중단했습니다'
    );
  });
});
