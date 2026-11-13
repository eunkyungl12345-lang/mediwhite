// 채용관 테마(6) × 직군 탭(20) 전수 조합 검증 — 실제 DB 데이터 기준, 읽기 전용
const { chromium } = require('playwright'); const fs = require('fs');
const B = process.env.B || 'http://localhost:3818';
const TH = ['', 'head', 'day', 'univ', 'pay', 'new'];
const DEPTS = ["간호사","간호조무사","방사선","물리치료","작업치료사","임상병리","응급구조","치과위생사","치과기공사","영양사","임상심리사","의무기록사","원무","병원컨설팅","의사","한의사","약사","기타"];
const HEAD = /총괄|실장|팀장|관리자|과장|부장/;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage(); p.setDefaultTimeout(30000);
  await p.goto(B + '/login?mode=signup'); await p.fill('input[name=username]', 'zz_wf_qa' + (Date.now() % 100000)); await p.fill('input[name=password]', 'pass1234!');
  await p.selectOption('select[name=dept]', '방사선').catch(() => {}); await p.fill('input[name=nickname]', 'QA' + Date.now() % 1000); await p.check('input[name=age14]'); await p.check('input[name=agree]');
  await p.click('button:has-text("가입하고 입장")'); await p.waitForURL(/(home|hospitals)/);
  const read = async () => { await p.waitForSelector('.jb2-sum b'); return p.evaluate(() => {
    const vis = [...document.querySelectorAll('.jb2-list')].filter(l => !l.closest('.jb2-closed'));
    const cards = vis.flatMap(l => [...l.children]).map(c => ({ ext: c.classList.contains('ex-card'), t: c.querySelector('.jb3-t')?.textContent?.trim() ?? '', h: c.querySelector('.jb3-h')?.textContent?.trim() ?? '' }));
    const badges = {}; for (const a of document.querySelectorAll('.jb2-tabs a')) { const u = new URL(a.href); const d = u.searchParams.get('dept') ?? ''; badges[d] = Number(a.querySelector('small')?.textContent ?? 0); }
    return { cards, badges, empty: !!document.querySelector('.jb2-empty'), sum: Number(document.querySelector('.jb2-sum b')?.textContent ?? -1), closed: document.querySelectorAll('.jb2-closed .jb3').length };
  }); };
  const rows = [];
  for (const th of TH) {
    await p.goto(`${B}/jobs${th ? '?th=' + th : ''}`); const base = await read();
    for (const d of DEPTS) {
      await p.goto(`${B}/jobs?${new URLSearchParams({ ...(th ? { th } : {}), dept: d })}`); const r = await read();
      const expect = base.badges[d] ?? 0, actual = r.cards.length; const issues = [];
      if (expect !== actual) issues.push(expect > 0 && actual === 0 ? `뱃지 ${expect}인데 0건` : `뱃지 ${expect} ≠ 실제 ${actual}`);
      if (r.empty && actual > 0) issues.push('카드 있는데 빈 박스 같이 뜸');
      if (r.sum !== actual) issues.push(`'모집 중 ${r.sum}' ≠ 카드 ${actual}`);
      rows.push({ th: th || '(없음)', dept: d, expect, actual, empty: r.empty, closed: r.closed, ok: !issues.length, issues, cards: r.cards });
    }
  }
  // 복합 키워드: 총괄·실장관(전체)에 있는 '방사선사 총괄/실장' 공고가 방사선 탭에서도 빠짐없이 보이는지
  const comp = [];
  await p.goto(`${B}/jobs?th=head`); const headAll = (await read()).cards;
  const key = c => c.t + '|' + c.h;
  for (const c of headAll.filter(c => /방사선|영상의학|C-?arm/i.test(c.h) && HEAD.test(c.h))) {
    const inHeadRad = rows.find(x => x.th === 'head' && x.dept === '방사선').cards.some(x => key(x) === key(c));
    const inRad = rows.find(x => x.th === '(없음)' && x.dept === '방사선').cards.some(x => key(x) === key(c));
    comp.push({ job: `${c.t} — ${c.h}`, '총괄관×방사선탭': inHeadRad, '방사선탭': inRad, ok: inHeadRad && inRad });
  }
  fs.writeFileSync(process.env.OUT || 'qa_matrix.json', JSON.stringify({ rows: rows.map(({ cards, ...r }) => r), comp }, null, 1));
  const bad = rows.filter(r => !r.ok);
  console.log(`조합 ${rows.length}개 · 통과 ${rows.length - bad.length} · 실패 ${bad.length}`);
  for (const r of bad) console.log(`✗ [${r.th}] ${r.dept}: ${r.issues.join(' / ')} (마감 ${r.closed})`);
  console.log(`복합 키워드(방사선+총괄) ${comp.length}건 · 누락 ${comp.filter(c => !c.ok).length}`); for (const c of comp.filter(c => !c.ok)) console.log('✗', c);
  await b.close();
})();
