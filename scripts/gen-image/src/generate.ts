/**
 * OpenAI gpt-image-2 이미지 생성 스크립트
 *
 * 사용 예시 (scripts/gen-image 디렉토리에서):
 *   pnpm install   (또는 npm install)
 *   pnpm gen -- --prompt "상담실에서 노트북으로 기록을 정리하는 따뜻한 분위기의 사진"
 *   pnpm gen -- -p "..." --size 1536x1024 --quality high --n 2 --out ./output
 *
 *   # reference 이미지로 톤·그림체 일치시키기 (1번을 만든 뒤 그것을 참조해 2번 생성)
 *   pnpm gen -- -p "..." --reference ./output/persona-1.png --filename persona-2
 *   # 여러 장 reference (콤마로 구분, 최대 4장 권장)
 *   pnpm gen -- -p "..." --reference a.png,b.png
 *
 * 옵션:
 *   --prompt, -p     생성 프롬프트 (필수)
 *   --reference, -r  참조 이미지 경로 (콤마 구분 다중 가능). 지정 시 /v1/images/edits 사용
 *   --size           1024x1024 | 1536x1024 | 1024x1536 | 2048x2048 |
 *                    2048x1152 | 3840x2160 | 2160x3840 | auto | <임의 W x H>
 *                    (기본 1024x1024)
 *   --quality        low | medium | high | auto (기본 high)
 *   --n              생성 개수 (기본 1)
 *   --format         png | jpeg | webp (기본 png)
 *   --compression    0–100 (jpeg/webp 만 적용)
 *   --background     opaque | auto
 *   --moderation     auto | low (기본 auto)
 *   --out            저장 디렉토리 (기본 ./output)
 *   --filename       파일명 prefix (기본 ISO 타임스탬프)
 *
 * env:
 *   OPENAI_API_KEY   필수 — .env 또는 셸 환경변수
 */

import dotenv from 'dotenv';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseArgs } from 'node:util';

// .env 우선순위:
//   1) scripts/gen-image/.env (이 패키지 로컬)
//   2) global-web/.env.local (글로벌 앱 공유)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.OPENAI_API_KEY) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
}

const ENDPOINT_GENERATE = 'https://api.openai.com/v1/images/generations';
const ENDPOINT_EDIT = 'https://api.openai.com/v1/images/edits';
const MODEL = 'gpt-image-2';

type Quality = 'low' | 'medium' | 'high' | 'auto';
type Format = 'png' | 'jpeg' | 'webp';
type Background = 'opaque' | 'auto';
type Moderation = 'auto' | 'low';

interface ApiResponseItem {
  b64_json?: string;
  url?: string;
  revised_prompt?: string;
}
interface ApiResponse {
  created: number;
  data: ApiResponseItem[];
}

function fail(msg: string): never {
  console.error(`\x1b[31m[gen-image] ${msg}\x1b[0m`);
  process.exit(1);
}

function info(msg: string): void {
  console.log(`\x1b[36m[gen-image]\x1b[0m ${msg}`);
}

function ok(msg: string): void {
  console.log(`\x1b[32m[gen-image]\x1b[0m ${msg}`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      prompt: { type: 'string', short: 'p' },
      reference: { type: 'string', short: 'r' },
      size: { type: 'string', default: '1024x1024' },
      quality: { type: 'string', default: 'high' },
      n: { type: 'string', default: '1' },
      format: { type: 'string', default: 'png' },
      compression: { type: 'string' },
      background: { type: 'string' },
      moderation: { type: 'string' },
      out: { type: 'string', default: 'output' },
      filename: { type: 'string' },
    },
    allowPositionals: false,
  });

  if (!values.prompt) fail('--prompt (-p) 가 필요합니다.');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) fail('OPENAI_API_KEY 가 환경변수에 없습니다. .env 에 추가해 주세요.');

  const quality = values.quality as Quality;
  if (!['low', 'medium', 'high', 'auto'].includes(quality)) {
    fail(`--quality 는 low | medium | high | auto 중 하나여야 합니다. 받은 값: ${quality}`);
  }

  const format = values.format as Format;
  if (!['png', 'jpeg', 'webp'].includes(format)) {
    fail(`--format 은 png | jpeg | webp 중 하나여야 합니다. 받은 값: ${format}`);
  }

  const n = Number(values.n);
  if (!Number.isInteger(n) || n < 1) fail(`--n 은 1 이상의 정수여야 합니다. 받은 값: ${values.n}`);

  // gpt-image-2 는 항상 base64 (b64_json) 로 응답하며 response_format 파라미터를 지원하지 않는다.
  // 공통 파라미터 — body(JSON, generate) / FormData(multipart, edit) 양쪽에서 같은 값을 사용한다.
  const compression =
    values.compression !== undefined ? Number(values.compression) : undefined;
  if (compression !== undefined) {
    if (!Number.isInteger(compression) || compression < 0 || compression > 100) {
      fail(`--compression 은 0–100 사이의 정수여야 합니다. 받은 값: ${values.compression}`);
    }
  }
  if (values.background && !['opaque', 'auto'].includes(values.background)) {
    fail(`--background 는 opaque | auto 중 하나여야 합니다. 받은 값: ${values.background}`);
  }
  if (values.moderation && !['auto', 'low'].includes(values.moderation)) {
    fail(`--moderation 은 auto | low 중 하나여야 합니다. 받은 값: ${values.moderation}`);
  }

  const referencePaths = values.reference
    ? values.reference
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  info(`model=${MODEL} size=${values.size} quality=${quality} n=${n} format=${format}${referencePaths.length ? ` reference=${referencePaths.length}장` : ''}`);
  info(`prompt: ${(values.prompt as string).slice(0, 120)}${(values.prompt as string).length > 120 ? '...' : ''}`);

  const t0 = Date.now();
  let res: Response;

  if (referencePaths.length > 0) {
    // /v1/images/edits — multipart/form-data, image[] 필드로 reference 첨부
    const fd = new FormData();
    fd.append('model', MODEL);
    fd.append('prompt', values.prompt as string);
    fd.append('size', values.size as string);
    fd.append('quality', quality);
    fd.append('n', String(n));
    fd.append('output_format', format);
    if (compression !== undefined) fd.append('output_compression', String(compression));
    if (values.background) fd.append('background', values.background);
    if (values.moderation) fd.append('moderation', values.moderation);

    for (const refPath of referencePaths) {
      const abs = path.resolve(refPath);
      const buf = await readFile(abs);
      const ext = path.extname(abs).toLowerCase();
      const mime =
        ext === '.png' ? 'image/png' :
        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
        ext === '.webp' ? 'image/webp' :
        'application/octet-stream';
      const blob = new Blob([new Uint8Array(buf)], { type: mime });
      // OpenAI edits 엔드포인트는 image[] 배열 필드를 받는다.
      fd.append('image[]', blob, path.basename(abs));
      info(`  reference: ${path.relative(process.cwd(), abs)}`);
    }

    res = await fetch(ENDPOINT_EDIT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    });
  } else {
    // /v1/images/generations — JSON body
    const body: Record<string, unknown> = {
      model: MODEL,
      prompt: values.prompt,
      size: values.size,
      quality,
      n,
      output_format: format,
    };
    if (compression !== undefined) body.output_compression = compression;
    if (values.background) body.background = values.background as Background;
    if (values.moderation) body.moderation = values.moderation as Moderation;

    res = await fetch(ENDPOINT_GENERATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    fail(`API 오류 ${res.status} ${res.statusText}\n${text}`);
  }

  const json = (await res.json()) as ApiResponse;
  if (!json.data || json.data.length === 0) fail('응답에 data 가 없습니다.');

  info(`응답 수신 (${((Date.now() - t0) / 1000).toFixed(1)}s) — ${json.data.length} 장`);

  const outDir = path.resolve(values.out ?? 'output');
  await mkdir(outDir, { recursive: true });

  const stamp = values.filename ?? new Date().toISOString().replace(/[:.]/g, '-');
  const ext = format === 'jpeg' ? 'jpg' : format;

  for (let i = 0; i < json.data.length; i++) {
    const item = json.data[i];
    if (!item) continue;
    const idx = String(i + 1).padStart(2, '0');
    const filename = json.data.length === 1 ? `${stamp}.${ext}` : `${stamp}-${idx}.${ext}`;
    const filePath = path.join(outDir, filename);

    if (item.b64_json) {
      await writeFile(filePath, Buffer.from(item.b64_json, 'base64'));
    } else if (item.url) {
      const r = await fetch(item.url);
      if (!r.ok) fail(`이미지 다운로드 실패: ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      await writeFile(filePath, buf);
    } else {
      fail(`응답 항목 ${idx} 에 b64_json 도 url 도 없습니다.`);
    }

    ok(`saved → ${path.relative(process.cwd(), filePath)}`);
    if (item.revised_prompt) info(`revised_prompt: ${item.revised_prompt}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
