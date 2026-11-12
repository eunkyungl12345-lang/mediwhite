#!/usr/bin/env node
/**
 * 🤖 메디잡 관리자급 공고 자동 수집 (총괄 · 실장 · 팀장)
 *
 * - 매일 새벽 5시(KST) GitHub Actions 에서 실행돼요.
 * - 메디잡 통합검색을 키워드별로 훑어 '아직 EXT_JOBS 에 없는' 공고만 골라 상세 페이지에서
 *   병원명 · 직무 · 근무지 · 근무시간 · 급여 · 마감일을 읽어 `lib/extJobs.ts` 에 덧붙여요.
 * - 추가 npm 패키지 없이 Node 20 내장 fetch 만 써요.
 * - 네트워크가 막히거나 응답이 이상하면 아무것도 고치지 않고 로그만 남기고 정상 종료(exit 0)해요.
 *
 * 실행: node scripts/scrapeJobs.mjs [--dry-run]
 *   --dry-run  파일을 고치지 않고, 새로 넣을 공고만 화면에 보여줘요.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = 'https://www.medijob.cc';
/** 검색 키워드 — 병원 현장에서 관리자급을 찾을 때 쓰는 말들 */
const KEYWORDS = ['총괄', '실장', '팀장'];
/** 키워드당 몇 쪽까지 볼지 (한 쪽 10건, 최신 등록순) */
const PAGES_PER_KEYWORD = 2;
/** 한 번에 새로 넣을 최대 건수 (사이트 예의 + 파일이 너무 길어지지 않게) */
const MAX_NEW_JOBS = 10;
const REQUEST_TIMEOUT_MS = 20000;
const SLOW_MS = 400;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const MARKER = '// 🤖 자동 수집';
/** 공고 제목에 이 말이 있어야 관리자급으로 보고 담아요 */
const ROLE_RE = /총괄|실장|팀장|부서장|부장|관리자|파트장|과장/;
/** 상근이 아닌 공고는 채용관 성격과 맞지 않아 건너뛰어요 */
const SKIP_RE = /아르바이트|알바|단기|파트타임|임시직|프리랜서/;

const log = (...a) => console.log('[scrapeJobs]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** 한국 시간 기준 오늘 (YYYY-MM-DD) */
export const kstToday = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

/* ──────────────────────────── 네트워크 ──────────────────────────── */

async function request(url, { method = 'GET', body } = {}) {
  const headers = {
    'User-Agent': UA,
    'Accept-Language': 'ko-KR,ko;q=0.9',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    Referer: `${BASE}/com/sch/com_sch_100`,
    ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' } : {}),
  };
  let lastError = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { method, headers, body, redirect: 'follow', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        log(`${lastError} — ${url}`);
        // 4xx 는 다시 두드려도 같은 답이라 한 번에서 멈춰요 (429 는 예외)
        if (res.status >= 400 && res.status < 500 && res.status !== 429) break;
        throw new Error(lastError);
      }
      return await res.text();
    } catch (err) {
      lastError = err?.message ? `${err.message}` : String(err);
      log(`요청 실패 (${attempt}/2) ${url} — ${lastError}`);
      if (attempt < 2) await sleep(1200);
    }
  }
  return null;
}

/** 통합검색 목록 한 쪽 (사이트가 쓰는 목록 조각 API 를 그대로 호출해요) */
async function fetchListPage(keyword, page) {
  const body = new URLSearchParams({
    loginId: '',
    formId: 'comSchForm02',
    formType: 'comSchForm02',
    paging: 'Y',
    page: String(page),
    rows: '10',
    sidx: 'recruitJumpDate',
    sord: 'DESC',
    codeStr: "{'basis': 'MJ017,MJ031'}",
    jobCode: '',
    jobDetailCode: '',
    recruitRegionCode: '',
    recruitRegionGuCode: '',
    searchText: keyword,
  });
  return request(`${BASE}/com/sch/com_sch_100_list_01`, { method: 'POST', body: body.toString() });
}

const fetchDetail = (id) => request(`${BASE}/com/cpn/com_cpn_100_view_02?recruitSeqno=${id}`);

/* ──────────────────────────── 파싱 ──────────────────────────── */

const ENTITIES = { '&gt;': '>', '&lt;': '<', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ' };

/** 태그를 걷어내고 글자만 남겨요 */
export function text(html = '') {
  return String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
    .replace(/[ \t\r\n\u00a0]+/g, ' ')
    .trim();
}

const byClass = (block, cls) => {
  const m = block.match(new RegExp(`<p class="${cls}"[^>]*>([\\s\\S]*?)<\\/p>`));
  return m ? text(m[1]) : '';
};

/** "2027.02.12" → "2027-02-12", 날짜가 아니면(채용시까지·상시채용) 비워요 */
export function toIsoDate(value = '') {
  const m = String(value).match(/(\d{4})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})/);
  if (!m) return undefined;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

/** "서울 > 광진구" · "서울\n서초구" → "서울 광진구" */
const cleanRegion = (value = '') => text(value).replace(/\s*>\s*/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * 목록 HTML → 공고 요약 배열
 * @returns {{id:number, hospital:string, region:string, jobs:string, title:string, deadline:string, until?:string}[]}
 */
export function parseList(html = '') {
  const rows = [];
  for (const block of html.match(/<div class="US_li">[\s\S]*?<\/div>/g) ?? []) {
    const id = Number((block.match(/recruitSeqno=(\d+)/) ?? block.match(/'recruitSeqno'\s*:\s*(\d+)/) ?? [])[1]);
    if (!id) continue;
    const deadline = byClass(block, 'US6');
    rows.push({
      id,
      hospital: byClass(block, 'US2'),
      region: cleanRegion(byClass(block, 'US3')),
      jobs: byClass(block, 'US4'),
      title: byClass(block, 'US5'),
      deadline,
      until: toIsoDate(deadline),
    });
  }
  return rows;
}

/** 상세 페이지 <dt>라벨</dt><dd>값</dd> 한 칸 */
export function detailField(html, label) {
  const re = new RegExp(`<dt[^>]*>\\s*${label}\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`);
  const m = html.match(re);
  return m ? m[1] : '';
}

/** "월급 400 ~ 420 만원" → "월급 400~420만원" · "회사내규에 따름" → "회사 내규" */
export function formatPay(pay = '') {
  const raw = text(pay);
  if (!raw) return '';
  if (/회사\s*내규|내규에\s*따름/.test(raw)) return '회사 내규';
  return raw.replace(/\s*~\s*/g, '~').replace(/\s*만\s*원/g, '만원').replace(/\s+/g, ' ').trim();
}

/** "09시 00분 ~ 18시 00분" → "09:00~18:00" */
const clock = (s = '') =>
  s
    .replace(/(\d{1,2})\s*시\s*(\d{2})\s*분/g, (_, h, mi) => `${String(h).padStart(2, '0')}:${mi}`)
    .replace(/\s*~\s*/g, '~');

/** 근무시간을 한 줄로 — 길면 요약(제목 줄)만 남겨요 */
export function formatHours(raw = '') {
  const html = String(raw);
  const summary = text((html.match(/<span[^>]*>([\s\S]*?)<\/span>/i) ?? [])[1] ?? '');
  const items = [...html.matchAll(/<li[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/li>/g)].map(
    (m) => `${text(m[1])} ${clock(text(m[2]))}`.trim(),
  );
  const full = [summary, ...items].filter(Boolean).join(' · ');
  if (full && full.length <= 44) return full;
  if (summary) return summary;
  const first = items.slice(0, 2).join(' · ');
  if (first.length <= 44) return first;
  return `${first.slice(0, 43).replace(/[\s·]+$/, '')}…`;
}

/** 제목에서 직무 이름을 뽑아요: "방사선사 총괄팀장" · "총괄실장" · "원무팀장" */
export function roleOf(title = '', jobs = '') {
  const t = text(title);
  const jobName = text(jobs).replace(/\s*외\s*\d+$/, '').trim();
  const m = t.match(/((?:방사선|물리치료|임상병리|간호|원무|행정|상담|검진|피부|코디|도수|수술실|대외협력|마케팅)\S{0,3}\s*)?(총괄\s*(?:실장|팀장)|부서장|실장|팀장|관리자|부장|과장)/);
  if (m && m[0].trim()) {
    const role = m[0].replace(/\s+/g, ' ').trim();
    // 제목에 직무가 빠진 "팀장"류는 직종 이름을 붙여요 (임상병리사 팀장)
    if (/^(팀장|실장|관리자|부장|과장)$/.test(role) && jobName) return `${jobName} ${role}`;
    return role;
  }
  return text(jobs) || '관리자';
}

/**
 * 상세 페이지 HTML → 채용관에 넣을 공고
 * @returns {{pay:string, area:string, time:string, dept:string, note:string, until?:string}}
 */
export function parseDetail(html = '', row = {}) {
  const jobTypes = [...String(detailField(html, '직종')).matchAll(/<em[^>]*>([\s\S]*?)<\/em>\s*:\s*<span>([\s\S]*?)<\/span>/g)].map((m) => ({
    name: text(m[1]),
    pay: text(m[2]),
  }));
  const withAmount = jobTypes.find((j) => /\d/.test(j.pay));
  const pay = formatPay((withAmount ?? jobTypes[0])?.pay ?? '') || '면접 협의';

  const region = cleanRegion(detailField(html, '근무지역')) || row.region || '';
  const subway = text(detailField(html, '지하철'));
  const station = (subway.match(/([가-힣0-9]+역)/) ?? [])[1];
  const walk = (subway.match(/도보\s*(\d+)\s*분/) ?? [])[1];
  const area = [region, station && (walk ? `${station} 도보 ${walk}분` : station)].filter(Boolean).join(' · ');

  const hours = formatHours(detailField(html, '근무시간'));
  const duty = text(detailField(html, '담당업무'));
  const empType = text(html.match(/<dd id="recruitTypeName"[^>]*>([\s\S]*?)<\/dd>/)?.[1] ?? '');
  const career = text(detailField(html, '경력'));

  const untilRaw = text(
    (html.match(/<span class="icon">마감일<\/span>[\s\S]{0,600}?<span class="text">([\s\S]*?)<\/span>/) ?? [])[1] ?? '',
  );
  const until = toIsoDate(untilRaw ?? '') ?? row.until;

  const noteParts = [duty || empType, career && career !== '경력무관' ? career : ''].filter(Boolean);
  const note = noteParts.join(' · ') || text(row.title);
  const years = (career.match(/(\d+)\s*년/) ?? [])[1];
  const warn = career.includes('무관') || !years ? undefined : `경력 ${years}년 이상`;

  return {
    pay,
    area,
    time: hours || '공고 참조',
    dept: roleOf(row.title, row.jobs),
    note: note.length > 48 ? `${note.slice(0, 47).trim()}…` : note,
    warn,
    empType,
    until,
  };
}

/* ──────────────────────────── 파일 쓰기 ──────────────────────────── */

const q = (v) => JSON.stringify(String(v ?? ''));

export function renderEntry(job) {
  const parts = [
    `id: ${job.id}`,
    `h: ${q(job.h)}`,
    `dept: ${q(job.dept)}`,
    `k: ${q(job.k || "총괄")}`,
    `area: ${q(job.area)}`,
    `time: ${q(job.time)}`,
    `pay: ${q(job.pay)}`,
  ];
  if (job.until) parts.push(`until: ${q(job.until)}`);
  parts.push(`note: ${q(job.note)}`);
  if (job.warn) parts.push(`warn: ${q(job.warn)}`);
  return `  { ${parts.join(', ')} },`;
}

/** EXT_JOBS 에 새 공고를 넣고 EXT_CHECKED 를 오늘로 갱신한 소스 */
export function applyToSource(source, jobs, today) {
  let out = source;
  const arrayStart = out.indexOf('export const EXT_JOBS: ExtJob[] = [');
  if (arrayStart < 0) throw new Error('EXT_JOBS 배열을 찾지 못했어요');
  const arrayEnd = out.indexOf('\n];', arrayStart);
  if (arrayEnd < 0) throw new Error('EXT_JOBS 배열의 끝을 찾지 못했어요');

  if (jobs.length) {
    const lines = jobs.map(renderEntry);
    const markerAt = out.indexOf(MARKER, arrayStart);
    if (markerAt >= 0 && markerAt < arrayEnd) {
      // 자동 수집 묶음이 이미 있으면 그 아래(최신이 위로)에 넣어요
      const lineEnd = out.indexOf('\n', markerAt) + 1;
      out = `${out.slice(0, lineEnd)}${lines.join('\n')}\n${out.slice(lineEnd)}`;
    } else {
      const spot = out.indexOf('\n];', arrayStart);
      const head = `${MARKER} (메디잡 검색: ${KEYWORDS.join('·')}, ${today})`;
      out = `${out.slice(0, spot)}\n  ${head}\n${lines.join('\n')}${out.slice(spot)}`;
    }
  }

  out = out.replace(/export const EXT_CHECKED = "\d{4}-\d{2}-\d{2}";/, `export const EXT_CHECKED = "${today}";`);
  return out;
}

/* ──────────────────────────── 실행 ──────────────────────────── */

export async function main(argv = process.argv.slice(2)) {
  const dryRun = argv.includes('--dry-run') || process.env.DRY_RUN === '1';
  const filePath = process.env.EXT_JOBS_PATH || path.join(process.cwd(), 'lib/extJobs.ts');
  const today = kstToday();
  const summary = [];

  const source = await readFile(filePath, 'utf8');
  const existing = new Set([...source.matchAll(/^\s*\{ id: (\d+)/gm)].map((m) => Number(m[1])));
  log(`등록된 공고 ${existing.size}건 · 오늘 ${today}${dryRun ? ' (dry-run)' : ''}`);

  // 1) 키워드별로 목록을 훑어 후보를 모아요
  const candidates = new Map();
  let pagesRead = 0;
  for (const keyword of KEYWORDS) {
    for (let page = 1; page <= PAGES_PER_KEYWORD; page++) {
      const html = await fetchListPage(keyword, page);
      if (!html) {
        log(`'${keyword}' ${page}쪽을 받지 못했어요`);
        break;
      }
      let rows = parseList(html);
      if (!rows.length) {
        if (page === 1) log(`'${keyword}' 1쪽에 공고가 없어요 (차단·개편 여부 확인 필요)`);
        break;
      }
      pagesRead += 1;
      for (const row of rows) {
        if (!ROLE_RE.test(row.title)) continue;
        if (SKIP_RE.test(row.title)) continue;
        if (existing.has(row.id) || candidates.has(row.id)) continue;
        candidates.set(row.id, { ...row, keyword });
      }
      if (rows.length < 10) break;
      await sleep(SLOW_MS);
    }
    await sleep(SLOW_MS);
  }

  if (!pagesRead) {
    log('목록을 한 쪽도 읽지 못했어요 — 파일은 그대로 두고 종료합니다.');
    summary.push(`❌ 메디잡 목록을 읽지 못했습니다. (${today})`);
  } else {
    log(`목록 ${pagesRead}쪽 확인 · 신규 후보 ${candidates.size}건`);
    summary.push(`🔎 목록 ${pagesRead}쪽 · 신규 후보 ${candidates.size}건 (${today})`);
  }

  // 2) 후보 상세를 읽어 공고로 만들어요
  const jobs = [];
  for (const row of [...candidates.values()].slice(0, MAX_NEW_JOBS)) {
    const html = await fetchDetail(row.id);
    if (!html) {
      log(`#${row.id} 상세를 받지 못해 건너뛰어요`);
      continue;
    }
    const detail = parseDetail(html, row);
    if (detail.empType && /파트|아르바이트|임시|프리랜서/.test(detail.empType)) {
      log(`#${row.id} ${detail.empType} — 상근이 아니라 건너뛰어요`);
      continue;
    }
    jobs.push({ id: row.id, h: row.hospital, ...detail });
    await sleep(SLOW_MS);
  }

  for (const job of jobs) log(`+ ${job.id} ${job.h} · ${job.dept} · ${job.area} · ${job.pay}${job.until ? ` · ~${job.until}` : ''}`);
  if (jobs.length) summary.push(...jobs.map((j) => `➕ ${j.h} — ${j.dept} (${j.area})`));
  else log('새로 넣을 공고가 없어요.');

  if (dryRun) {
    log('dry-run 이라 파일은 고치지 않았어요.');
    await writeSummary(summary);
    return { added: jobs.length, wrote: false };
  }

  if (!pagesRead) {
    // 읽지 못한 날은 '확인한 날'도 갱신하지 않아요 (엉뚱하게 마감 숨김이 일어나지 않게)
    await writeSummary(summary);
    return { added: 0, wrote: false, failed: true };
  }

  const next = applyToSource(source, jobs, today);
  if (next === source) {
    log('바뀐 내용이 없어요.');
    await writeSummary(summary);
    return { added: 0, wrote: false };
  }
  await writeFile(filePath, next, 'utf8');
  log(`파일 저장 완료 — 새 공고 ${jobs.length}건, 확인일 ${today}`);
  summary.push(`✅ ${jobs.length ? `${jobs.length}건 추가` : '새 공고 없음'} · 확인일 ${today} 갱신`);
  await writeSummary(summary);
  return { added: jobs.length, wrote: true };
}

async function writeSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY || !lines.length) return;
  try {
    await writeFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`, { flag: 'a' });
  } catch {
    /* 요약은 없어도 괜찮아요 */
  }
}

// 직접 실행됐을 때만 돌아요 (테스트에서 import 할 수 있게)
const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main()
    .catch((err) => log('예상치 못한 오류 — 파일은 그대로 두고 종료합니다.', err?.stack ?? err))
    .finally(() => {
      process.exitCode = 0; // 수집이 안 된 날에도 워크플로우는 조용히 끝나요
    });
}
