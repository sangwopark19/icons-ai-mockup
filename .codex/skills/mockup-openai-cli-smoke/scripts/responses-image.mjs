#!/usr/bin/env node
import fs from 'fs';

function usage() {
  console.log(`Usage:
  OPENAI_API_KEY=... node responses-image.mjs --prompt "..." --out out.png [--quality high] [--action auto|generate|edit] [--previous-response-id rsp_123]

Notes:
  - Uses Responses API with the hosted image_generation tool
  - Top-level model is gpt-5.4, not gpt-image-2
  - Install SDK first: pnpm --filter @mockup-ai/api add openai
`);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

let prompt = '';
let out = '';
let quality = 'high';
let action = 'auto';
let previousResponseId = '';

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--prompt') prompt = args[++i] ?? '';
  else if (arg === '--out') out = args[++i] ?? '';
  else if (arg === '--quality') quality = args[++i] ?? 'high';
  else if (arg === '--action') action = args[++i] ?? 'auto';
  else if (arg === '--previous-response-id') previousResponseId = args[++i] ?? '';
  else {
    console.error(`Unknown argument: ${arg}`);
    usage();
    process.exit(1);
  }
}

if (!process.env.OPENAI_API_KEY || !prompt || !out) {
  usage();
  process.exit(1);
}

const { default: OpenAI } = await import('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await client.responses.create({
  model: 'gpt-5.4',
  ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
  input: prompt,
  tools: [
    {
      type: 'image_generation',
      quality,
      action,
    },
  ],
});

const imageCall = response.output.find((item) => item.type === 'image_generation_call');
if (!imageCall?.result) {
  console.error('No image_generation_call result found');
  console.error(JSON.stringify(response.output, null, 2));
  process.exit(1);
}

fs.writeFileSync(out, Buffer.from(imageCall.result, 'base64'));
console.error(`response.id: ${response.id}`);
console.error(`image_call.id: ${imageCall.id}`);
if (imageCall.revised_prompt) {
  console.error(`revised_prompt: ${imageCall.revised_prompt}`);
}
console.log(`saved: ${out}`);
