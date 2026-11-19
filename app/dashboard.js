/* 연준 금리 전망 대시보드 렌더러.
 *
 * 데이터: fed_model/view_model.py 가 만든 JSON (schema 1).
 *   - 단독 HTML 리포트: window.__FED_DATA__ 에 내장
 *   - 앱: FED_DATA_URL(공개 데이터, config.js)과 data/latest.json(이 기기에서 실행한 분석) 중 더 최신 것.
 *         둘 다 실패하면 마지막으로 받은 데이터(기기에 보관)를 보여 준다.
 * 모든 문구는 {ko, en} 쌍이며, 상단 스위치로 언어를 바꾼다. 선택은 기기에 기억된다.
 * 점수(score)는 −3~+3, +가 인상 압력(오른쪽)이다.
 */
(function () {
  "use strict";

  var UI = {
    title: { ko: "연준 금리 전망", en: "Fed Rate Outlook" },
    meta: { ko: "{d} 기준 · 데이터 FRED · 연준 공식 발표", en: "As of {d} · Data: FRED · Federal Reserve" },
    eyebrow: { ko: "다음 1~2회 FOMC (약 2개월)", en: "Next 1–2 FOMC meetings (about 2 months)" },
    likely: { ko: "가장 가능성 높은 결정", en: "most likely decision" },
    range: { ko: "현재 기준금리 {lo}% ~ {hi}%", en: "Current target range {lo}% – {hi}%" },
    odds: { ko: "결정 확률", en: "Decision odds" },
    oddsSub: { ko: "과거 1983년 이후 금리 결정을 학습한 모델이 계산했습니다.", en: "From a model trained on every Fed decision since 1983." },
    drivers: { ko: "무엇이 금리를 움직이나", en: "What's driving rates" },
    driversSub: { ko: "각 영역이 평소(1995~2019년)보다 얼마나 벗어났는지입니다. 가운데 선이 평소 수준입니다.",
                  en: "How far each area is from normal (1995–2019). The center line is normal." },
    cutP: { ko: "인하 압력", en: "Cut pressure" },
    hikeP: { ko: "인상 압력", en: "Hike pressure" },
    rules: { ko: "적정 금리와 비교", en: "Compared with policy rules" },
    rulesSub: { ko: "물가와 고용으로 계산한 정책준칙 금리입니다. 세로선이 현재 금리, 점이 준칙 금리입니다. (중립금리 r* {r}% 가정)",
                en: "Rates implied by standard policy rules from inflation and jobs. The vertical line is today's rate; dots are the rules. (Assumes neutral rate r* = {r}%)" },
    current: { ko: "현재 {v}%", en: "Current {v}%" },
    vsNow: { ko: "현재 대비 {d}%p", en: "{d}pp vs. current" },
    comm: { ko: "연준 발언", en: "What the Fed is saying" },
    commSub: { ko: "최근 {days}일 연설·FOMC 성명·의사록 {n}건 (통화정책과 무관한 {sk}건 제외). 성명과 최근 발언일수록 크게 반영합니다.",
               en: "{n} speeches, FOMC statements and minutes from the last {days} days ({sk} unrelated to monetary policy left out). Statements and recent remarks count more." },
    tone: { ko: "톤 {t} ({l}) · 가중치 {w}", en: "Tone {t} ({l}) · weight {w}" },
    inds: { ko: "세부지표", en: "Indicators" },
    indsSub: { ko: "영역을 누르면 지표별 수치가 열립니다.", en: "Open an area to see each indicator." },
    colInd: { ko: "지표", en: "Indicator" },
    colLatest: { ko: "최신값", en: "Latest" },
    col3m: { ko: "3개월 변화", en: "3m change" },
    colAsof: { ko: "기준월", en: "As of" },
    colScale: { ko: "인하 ← 압력 → 인상", en: "Cut ← pressure → Hike" },
    indTip: { ko: "{n}: 점수 {s} · 평시평균 {m}", en: "{n}: score {s} · 1995–2019 avg {m}" },
    restricted: { ko: "출처 {s} · 원본 수치 비공개", en: "Source: {s} · raw value not shown" },
    offline: { ko: "오프라인 · 마지막으로 받은 데이터", en: "Offline · showing last downloaded data" },
    disc1: { ko: "과거 데이터로 계산한 통계 추정이며 인과관계나 미래 결과를 보장하지 않습니다. 투자 권유가 아닙니다.",
             en: "A statistical estimate from historical data. It does not imply causation or guarantee future outcomes, and it is not investment advice." },
    disc2: { ko: "2년물 금리에는 기간 프리미엄이 섞여 있어 순수한 금리 기대가 아닙니다. 정책준칙은 중립금리·자연실업률 가정에 따라 달라집니다.",
             en: "The 2-yr yield includes a term premium, so it is not a pure rate expectation. Policy rules depend on neutral-rate and natural-unemployment assumptions." },
    loading: { ko: "데이터를 불러오는 중…", en: "Loading data…" },
    failT: { ko: "데이터를 불러오지 못했습니다", en: "Couldn't load the data" },
    failB: { ko: "분석을 한 번 실행한 뒤 다시 시도하세요.", en: "Run the analysis once, then try again." },
    refresh: { ko: "새로고침", en: "Refresh" },
    pdf: { ko: "PDF 저장", en: "Save PDF" },
    jpg: { ko: "JPG 저장", en: "Save JPG" },
    jpgBusy: { ko: "이미지 만드는 중…", en: "Creating image…" },
    jpgFail: { ko: "이미지를 저장하지 못했습니다", en: "Couldn't save the image" },
    classes: { ko: ["인하", "동결", "인상"], en: ["Cut", "Hold", "Hike"] },
    // 단순화된 첫 화면
    tabOverview: { ko: "미국 연준", en: "US Fed" },
    tabKorea: { ko: "한국은행", en: "Bank of Korea" },
    tabHK: { ko: "홍콩", en: "Hong Kong" },
    tabAll: { ko: "전체", en: "All" },
    tabAssets: { ko: "자산 폴더", en: "Asset folders" },
    tabFx: { ko: "환율 폴더", en: "Currency folders" },
    tabEA: { ko: "유럽(ECB)", en: "ECB" },
    tabJP: { ko: "일본은행", en: "Bank of Japan" },
    tabCN: { ko: "중국인민은행", en: "PBoC" },
    tabCH: { ko: "스위스(SNB)", en: "SNB" },
    tabSG: { ko: "싱가포르", en: "Singapore" },
    tabPro: { ko: "경제학자 폴더", en: "Economist folders" },
    asof: { ko: "{d} 기준", en: "As of {d}" },
    dataOnly: { ko: "경제 데이터만 보면", en: "Economic data alone" },
    trust: { ko: "이 숫자는 얼마나 믿을 만한가요?", en: "How reliable is this?" },
    keyInds: { ko: "핵심 지표", en: "Key indicators" },
    keyIndsSub: { ko: "금리 결정에 가장 직접적인 6개입니다. 한 달 전과 비교했습니다.", en: "The six that matter most for rate decisions, versus a month earlier." },
    vs3m: { ko: "3개월 {v}", en: "3m {v}" },
    commMore: { ko: "전체 {n}건 보기", en: "Show all {n}" },
    allInds: { ko: "전체 지표 ({n}개)", en: "All indicators ({n})" },
    // PRO
    proBadge: { ko: "PRO", en: "PRO" },
    proPreview: { ko: "유료판 미리보기", en: "Pro preview" },
    proIntro: { ko: "유명 경제학자들의 금리 공식이 지금 무엇을 가리키는지, 그리고 과거에 얼마나 맞혔는지입니다.",
                en: "What famous economists' rate formulas point to now, and how often they were right before." },
    ours: { ko: "우리 공식", en: "Our formula" },
    oursSub: { ko: "아래 {n}개 공식의 신호를 과거 적중률만큼 가중해 합친 결과입니다.", en: "Combines the {n} formulas below, weighted by their past hit rates." },
    agree: { ko: "{a}/{n}개 공식이 같은 방향", en: "{a} of {n} formulas agree" },
    howScoredSt: { ko: "적중률 = 6개월 안 MAS 결정 방향(조이기·유지·풀기)을 맞힌 비율 · {since}년 이후 매달 평가",
                   en: "Hit rate = share of months that called the direction of MAS decisions over the next 6 months (tighten, hold, ease) · scored monthly since {since}" },
    howScored: { ko: "적중률 = 6개월 뒤 금리 방향(인상·동결·인하)을 맞힌 비율 · {since}년 이후 매달 평가",
                 en: "Hit rate = share of months the rate direction six months later (hike, hold, cut) was called right · monthly since {since}" },
    colWho: { ko: "", en: "" },
    colAll: { ko: "전체 적중률", en: "Hit rate (all)" },
    colRecent: { ko: "최근 10년", en: "Last 10 years" },
    simpleAvg: { ko: "단순 평균", en: "Simple average" },
    alwaysHold: { ko: "항상 '동결'", en: "Always 'hold'" },
    honest: { ko: "가중치를 줘도 단순 평균보다 크게 낫지 않습니다. 그래서 둘을 함께 보여 줍니다.",
              en: "Weighting doesn't clearly beat a simple average, so we show both." },
    honestBetter: { ko: "가중치를 준 쪽이 단순 평균보다 전체 {a}%p, 최근 10년 {b}%p 더 맞혔습니다. 과거 성적이라 앞으로도 그렇다는 보장은 없어 둘을 함께 보여 줍니다.",
                    en: "Weighting beat the simple average by {a}pp overall and {b}pp over the last 10 years. That's past performance, so we show both." },
    folders: { ko: "폴더", en: "Folders" },
    hitShort: { ko: "적중 {v}", en: "Hit {v}" },
    back: { ko: "← 폴더 목록", en: "← All folders" },
    recNow: { ko: "공식이 말하는 적정 금리", en: "Rate the formula suggests" },
    rateNow: { ko: "현재 금리", en: "Current rate" },
    signalNow: { ko: "6개월 신호", en: "6-month signal" },
    sAll: { ko: "전체 적중률", en: "Hit rate (all)" },
    sRecent: { ko: "최근 10년 적중률", en: "Hit rate, last 10 yrs" },
    sMove: { ko: "'움직여라' 신호 적중", en: "When it said 'move'" },
    sMoveN: { ko: "{n}회 중", en: "of {n} calls" },
    sMae: { ko: "실제 금리와 평균 차이", en: "Avg gap to actual rate" },
    chartT: { ko: "공식 vs 실제 금리", en: "Formula vs. actual rate" },
    chartTSt: { ko: "공식 압력 vs 실제 MAS 결정", en: "Formula pressure vs. actual MAS moves" },
    actual: { ko: "실제 기준금리", en: "Actual policy rate" },
    formulaL: { ko: "공식", en: "Formula" },
    marketNote: { ko: "시장은 공식이 아니라 실제 채권 가격입니다.", en: "The market is a price, not a formula." },
    proDisc: { ko: "과거 값은 최종 수정치 기준이라 당시 실제로 보던 숫자와 다를 수 있습니다. 어떤 공식도 {bank}의 실제 결정을 대신하지 않습니다.",
               en: "History uses revised data, which can differ from what was known at the time. No formula substitutes for {bankEn}'s actual decisions." },
  };
  var SIG = { ko: { "1": "인상", "0": "동결", "-1": "인하" }, en: { "1": "Hike", "0": "Hold", "-1": "Cut" } };
  var SIG_KEY = { "1": "hike", "0": "hold", "-1": "cut" };
  var CLASS_KEY = ["cut", "hold", "hike"];
  var STORE = "fed-dash-lang";
  var root = document.documentElement;
  var app = document.getElementById("app");
  var data = null;
  var pro = null;
  var view = { tab: "all", folder: null, region: "us", asset: "au" };
  // PRO도 처음엔 미국 연준 폴더부터 보여 준다
  // 싱가포르(MAS)는 금리 대신 환율 밴드를 조인다/푼다
  var SIG_ST = { ko: { "1": "조이기", "0": "유지", "-1": "풀기" }, en: { "1": "Tighten", "0": "Hold", "-1": "Ease" } };
  function stanceOn() { return view.tab === "sg" || (view.tab === "pro" && view.region === "sg"); }
  // 자산 폴더(금·석유·S&P 500)는 상승/보합/하락으로 읽는다
  var SIG_AS = { ko: { "1": "상승", "0": "보합", "-1": "하락" }, en: { "1": "Rise", "0": "Flat", "-1": "Fall" } };
  function assetOn() { return view.tab === "assets" || view.tab === "fxpro"; }
  var fromCache = false;
  var CACHE = "fed-dash-data";

  // ---------- 헬퍼 ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fill(tpl, vars) {
    return tpl.replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; });
  }
  /** 두 언어 텍스트. CSS가 현재 언어만 보여 준다 (언어 전환 시 다시 그릴 필요 없음). */
  // ---------- 언어: 한국어·영어는 문구에 직접, 중국어·스페인어는 영어 원문으로 사전(i18n.js)을 찾는다 ----------
  var LANGS = ["ko", "en", "zh", "es"];
  var LANG_NAME = { ko: "한국어", en: "English", zh: "中文", es: "Español" };
  function langsw() {  // 메뉴가 없는 화면(로그인·불러오는 중)에서 쓰는 언어 버튼
    return '<div class="langsw" role="group" aria-label="Language">' + LANGS.map(function (l) {
      return '<button type="button" data-lang="' + l + '" aria-pressed="' + (root.lang === l) + '">' + { ko: "한국어", en: "EN", zh: "中文", es: "ES" }[l] + "</button>";
    }).join("") + "</div>";
  }
  // 사전에 {이름} 자리표시자가 있는 문구는 '문장 틀'로도 쓴다: 숫자가 들어간 서버 문장("Fair rate 3.80% vs 3.00% now")을
  // 틀("Fair rate {a} vs {b} now")에 맞춰 번역하고, 끼워 넣은 값도 다시 번역한다.
  var TPL = {}, TRC = {};
  function tpls(l) {
    if (TPL[l]) return TPL[l];
    var d = (window.FED_I18N || {})[l] || {}, out = [];
    Object.keys(d).forEach(function (k) {
      if (k.indexOf("{") < 0) return;
      var names = [], lit = k.replace(/\{\w+\}/g, "").length;
      var src = k.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{(\w+)\}/g, function (_, n) { names.push(n); return "(.+?)"; });
      if (lit < 2) return;  // 자리표시자뿐인 틀은 모든 문장에 걸린다
      try { out.push({ re: new RegExp("^" + src + "$"), names: names, to: d[k], lit: lit }); } catch (e) {}
    });
    out.sort(function (a, b) { return b.lit - a.lit; });
    return (TPL[l] = out);
  }
  function trx(l, en, depth) {  // 영어 원문 → l 언어 (사전에 없으면 영어 그대로)
    if (en == null || l === "en" || en === "") return en;
    var d = (window.FED_I18N || {})[l];
    if (!d) return en;
    if (d[en] != null) return d[en];
    if ((depth || 0) > 4 || /^[\d\s.,%:\/()+\-–−×·$€¥£₩*=<>|]*$/.test(en)) return en;
    var key = l + "\u0001" + en;
    if (TRC[key] != null) return TRC[key];
    var res = en, ts = tpls(l);
    for (var i = 0; i < ts.length; i++) {
      var m = ts[i].re.exec(en);
      if (!m) continue;
      var vals = {};
      ts[i].names.forEach(function (n, j) { vals[n] = trx(l, m[j + 1], (depth || 0) + 1); });
      res = ts[i].to.replace(/\{(\w+)\}/g, function (_, n) { return vals[n] != null ? vals[n] : ""; });
      break;
    }
    return (TRC[key] = res);
  }
  function word(pair, l) {  // pair의 l 언어 문구
    return pair[l] != null ? pair[l] : l === "ko" ? pair.ko : trx(l, pair.en);
  }
  function t(pair, vars) {
    return LANGS.map(function (l) {
      var w = word(pair, l);
      return '<span class="' + l + '">' + esc(vars ? fill(w, vars) : w) + "</span>";
    }).join("");
  }
  function tipAttr(ko, en) {
    return ' data-tip-ko="' + esc(ko) + '" data-tip-en="' + esc(en) + '" data-tip-zh="' + esc(trx("zh", en)) + '" data-tip-es="' + esc(trx("es", en)) + '"';
  }
  function pct(p) { return Math.round(p * 100) + "%"; }
  function honestNote(p) {
    var h = function (x) { return x && x.score_recent && x.score && x.score.hit != null && x.score_recent.hit != null ? x : null; };
    var o = h(p.ours), s = h(p.simple_avg);
    if (o && s) {
      var a = Math.round((o.score.hit - s.score.hit) * 100), b = Math.round((o.score_recent.hit - s.score_recent.hit) * 100);
      if (a >= 5 && b >= 5) return t(UI.honestBetter, { a: a, b: b });
    }
    return t(UI.honest);
  }
  function proDisc() {
    if (view.tab === "assets" || view.tab === "fxpro") return t({ ko: "과거 값은 최종 수정치 기준입니다. 과거 성적은 미래 수익을 보장하지 않으며, 투자 권유가 아닙니다.",
                                              en: "History uses revised data. Past performance doesn't guarantee future returns. Not investment advice." });
    var r = curRegion(), b = r !== "us" && pro && pro[r] && pro[r].bank;
    return t(UI.proDisc, { bank: b ? b.ko : r === "kr" ? "한국은행" : r === "sg" ? "싱가포르 통화청(MAS)" : "연준",
                           bankEn: b ? b.en : r === "kr" ? "the Bank of Korea" : r === "sg" ? "MAS" : "the Fed" });
  }
  function num(v, d, sign) {
    if (v == null || isNaN(v)) return "–";
    d = d == null ? 2 : d;
    var s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
    if (sign) return (v >= 0 ? "+" : "−") + s;
    return (v < 0 ? "−" : "") + s;
  }
  function pos(score) {
    var lim = 3;
    return ((Math.max(-lim, Math.min(lim, score)) + lim) / (2 * lim)) * 100;
  }
  function track(score, tipKo, tipEn, small) {
    if (score == null) return '<div class="track empty" aria-hidden="true"></div>';
    return '<div class="track' + (small ? " sm" : "") + '" role="img" data-aria' + tipAttr(tipKo, tipEn) + ">" +
      '<span class="mid"></span><span class="dot" style="left:' + pos(score).toFixed(1) + '%"' + tipAttr(tipKo, tipEn) + "></span></div>";
  }

  // ---------- 섹션 ----------
  function probBar(block, strong) {
    var p = block.p, segs = "", vals = "";
    for (var i = 0; i < 3; i++) {
      segs += '<span class="seg ' + CLASS_KEY[i] + '" style="flex:' + Math.max(p[i], 0.0001).toFixed(4) + '"' +
        tipAttr(block.title.ko + " · " + UI.classes.ko[i] + " " + pct(p[i]), block.title.en + " · " + UI.classes.en[i] + " " + pct(p[i])) + "></span>";
      vals += '<span class="pv"><i class="sw ' + CLASS_KEY[i] + '"></i>' + t({ ko: UI.classes.ko[i], en: UI.classes.en[i] }) + " <b>" + pct(p[i]) + "</b></span>";
    }
    return '<div class="pb' + (strong ? " strong" : "") + '"><div class="pb-head"><span>' + t(block.title) + "</span>" +
      '<span class="pvs">' + vals + '</span></div><div class="bar">' + segs + "</div></div>";
  }

  function commItem(d) {
    var title = d.url
      ? '<a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.title) + "</a>"
      : esc(d.title);
    var tone = (d.tone >= 0 ? "+" : "") + d.tone.toFixed(2), w = d.weight.toFixed(2);
    return '<li><div class="c-meta"><span class="c-kind">' + t(d.kind) + "</span>" + esc(d.date) + " · " + esc(d.speaker) + "</div>" +
      '<div class="c-title">' + title + "</div>" +
      '<div class="c-tone">' + track(d.tone * 3, fill(UI.tone.ko, { t: tone, l: d.label.ko, w: w }), fill(UI.tone.en, { t: tone, l: d.label.en, w: w }), true) +
      '<span class="lab">' + t(d.label) + "</span></div></li>";
  }
  function commSection(comm) {
    if (!comm || !comm.items.length) return "";
    var head = '<li class="comm-head"><span></span><div class="scale-lab"><span>' + t(UI.cutP) + "</span><span>" + t(UI.hikeP) + "</span></div></li>";
    var first = comm.items.slice(0, 3).map(commItem).join("");
    var rest = comm.items.slice(3).map(commItem).join("");
    return '<section class="card comm-card"><h2>' + t(UI.comm) + '</h2><p class="sub">' +
      t(UI.commSub, { days: comm.days, n: comm.items.length, sk: comm.skipped }) + "</p>" +
      '<ul class="comm">' + head + first + "</ul>" +
      (rest ? '<details class="more"><summary><span>' + t(UI.commMore, { n: comm.items.length }) + '</span></summary><ul class="comm">' + rest + "</ul></details>" : "") +
      "</section>";
  }

  // 핵심 지표 타일용 짧은 이름 (전체 이름은 '전체 지표'에)
  var SHORT = {
    core_pce_yoy: { ko: "근원 PCE 물가", en: "Core PCE inflation" },
    core_cpi_3m: { ko: "근원 CPI (최근 3개월)", en: "Core CPI (last 3 mo.)" },
    ur: { ko: "실업률", en: "Unemployment rate" },
    icsa: { ko: "신규 실업수당 청구", en: "Jobless claims" },
    y2_spread: { ko: "2년물 − 기준금리", en: "2-yr yield − policy rate" },
    y10: { ko: "국채 10년", en: "10-yr Treasury" },
  };
  // 핵심 지표 카드의 변화: 최근 그래프 자료(hist)의 마지막 두 점 → 1개월 변화 (분기 자료면 그 간격만큼)
  function recentChg(r) {
    var h = r.hist;
    if (h && h.length > 1) {
      var a = h[h.length - 1], b = h[h.length - 2];
      if (a[1] != null && b[1] != null) {
        var pa = String(a[0]).split("-"), pb = String(b[0]).split("-");
        var m = (+pa[0] - +pb[0]) * 12 + (+pa[1] - +pb[1]);
        return { v: a[1] - b[1], m: m > 0 ? m : 1 };
      }
    }
    return r.chg3 == null ? null : { v: r.chg3, m: 3 };
  }
  function chgLabel(c, cv, won) {
    if (c.m === 1) return t(won ? { ko: "1개월 {v}원", en: "1m {v}" } : { ko: "1개월 {v}", en: "1m {v}" }, { v: cv });
    return t(won ? { ko: "{m}개월 {v}원", en: "{m}m {v}" } : { ko: "{m}개월 {v}", en: "{m}m {v}" }, { v: cv, m: c.m });
  }
  function keyTiles(d) {
    var rows = {};
    d.groups.forEach(function (g) { g.rows.forEach(function (r) { rows[r.key] = r; }); });
    var keys = d.key_indicators || [];
    if (!keys.length) return "";
    var tiles = keys.map(function (k) {
      var r = rows[k];
      if (!r) return "";
      var c1 = recentChg(r), ch = c1 == null ? "" : '<span class="tile-ch">' + chgLabel(c1, num(c1.v, 2, true)) + "</span>";
      var open = r.hist && r.hist.length > 1;
      return (open ? '<button type="button" class="tile tap" data-ind="' + esc(k) + '">' : '<div class="tile">') +
        '<div class="tile-name">' + t(SHORT[k] || r.name) + (open ? '<svg class="tile-go" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 12 7 7l3 3 4-6"/></svg>' : "") + "</div>" +
        '<div class="tile-val">' + num(r.value) + (r.value == null ? "" : '<span class="u">' + t(r.unit) + "</span>") + "</div>" +
        '<div class="tile-foot">' + ch + '<span class="lab">' + t(r.label) + "</span></div>" + (open ? "</button>" : "</div>");
    }).join("");
    return '<section class="card"><h2>' + t(UI.keyInds) + '</h2><p class="sub">' + t(UI.keyIndsSub) + " " + t({ ko: "카드를 누르면 최근 12개월 그래프가 열립니다.", en: "Tap a card for its 12-month chart." }) + '</p><div class="tiles">' + tiles + "</div></section>";
  }

  function detailSection(groups) {
    return groups.map(function (g) {
      var rows = g.rows.map(function (r) {
        var sc = num(r.score, 2, true), m = num(r.bench_mean);
        var note = r.restricted ? t(UI.restricted, { s: r.restricted }) : (r.note ? t(r.note) : "");
        return '<tr><td class="iname">' + t(r.name) + (note ? "<small>" + note + "</small>" : "") + "</td>" +
          '<td class="n">' + num(r.value) + (r.value == null ? "" : '<span class="u">' + t(r.unit) + "</span>") + "</td>" +
          '<td class="n muted">' + num(r.chg3, 2, true) + '</td><td class="muted nw">' + esc(r.asof) + "</td>" +
          '<td class="tcell">' + track(r.score, fill(UI.indTip.ko, { n: r.name.ko, s: sc, m: m }), fill(UI.indTip.en, { n: r.name.en, s: sc, m: m }), true) + "</td>" +
          '<td class="lab">' + t(r.label) + "</td></tr>";
      }).join("");
      return "<details><summary><span>" + t(g.name) + '</span><span class="sum-lab">' + t(g.label) + "</span></summary>" +
        '<div class="tbl"><table><thead><tr><th>' + t(UI.colInd) + '</th><th class="n">' + t(UI.colLatest) + '</th><th class="n">' +
        t(UI.col3m) + "</th><th>" + t(UI.colAsof) + "</th><th>" + t(UI.colScale) + "</th><th></th></tr></thead><tbody>" + rows +
        "</tbody></table></div></details>";
    }).join("");
  }

  // ---------- 전체 탭: 나라별 방향 한눈에 ----------
  // kind: "outlook" = 앞으로의 방향 판단, "last" = 판단 대신 최근 실제 결정
  function allRows() {
    var rows = [], o = data.odds && data.odds.lead && data.odds.lead.p;
    var usSig = null, usTxt = { ko: "", en: "" };
    if (o) {
      var i = o.indexOf(Math.max.apply(null, o));
      usSig = i - 1;
      usTxt = { ko: "다음 FOMC 전망 " + SIG.ko[String(usSig)] + " " + pct(o[i]), en: "Next FOMC: " + SIG.en[String(usSig)].toLowerCase() + " " + pct(o[i]) };
    }
    var m = data.meta;
    rows.push({ tab: "overview", name: UI.tabOverview, rate: num((m.target_low + m.target_high) / 2) + "%", rateNote: { ko: "목표범위 " + num(m.target_low) + "~" + num(m.target_high) + "%", en: "Target " + num(m.target_low) + "–" + num(m.target_high) + "%" },
               sig: usSig, kind: "outlook", why: usTxt });
    var fair = function (k) {
      var n = k.now;
      if (n.signal == null) return null;
      return { ko: "적정금리 " + num(n.taylor) + "% vs 현재 " + num(n.base) + "%", en: "Fair rate " + num(n.taylor) + "% vs " + num(n.base) + "% now" };
    };
    var lastMove = function (n) {
      if (!n.last_change) return { sig: 0, why: { ko: "최근 변경 없음", en: "No recent change" } };
      var up = n.last_change.to > n.last_change.from;
      return { sig: up ? 1 : -1, why: { ko: n.last_change.month + " " + (up ? "인상" : "인하") + " (" + num(n.last_change.from) + "% → " + num(n.last_change.to) + "%)",
                                        en: (up ? "Hiked " : "Cut ") + n.last_change.month + " (" + num(n.last_change.from) + "% → " + num(n.last_change.to) + "%)" } };
    };
    var add = function (tab, name, k) {
      if (!k) return;
      var f = fair(k);
      if (f) rows.push({ tab: tab, name: name, rate: num(k.now.base) + "%", sig: k.now.signal, kind: "outlook", why: f });
      else { var lm = lastMove(k.now); rows.push({ tab: tab, name: name, rate: num(k.now.base) + "%", sig: lm.sig, kind: "last", why: lm.why }); }
    };
    add("ea", UI.tabEA, data.ea);
    add("jp", UI.tabJP, data.jp);
    add("cn", UI.tabCN, data.cn);
    add("korea", UI.tabKorea, data.korea);
    add("ch", UI.tabCH, data.ch);
    if (data.hk) rows.push({ tab: "hk", name: UI.tabHK, rate: num(data.hk.now.base) + "%", sig: usSig, kind: "outlook",
                             why: { ko: "연준을 그대로 따라감", en: "Follows the Fed" } });
    if (data.sg) {
      var L = data.sg.now.last;
      rows.push({ tab: "sg", name: UI.tabSG, rate: null, sig: L.dir, kind: "last", stance: true,
                  why: { ko: L.date + " MAS 결정: " + L.text.ko, en: "MAS " + L.date + ": " + L.text.en } });
    }
    return rows;
  }
  // ---------- 오늘의 3줄 요약 · 다음 금리 결정 (전체 탭 맨 위) ----------
  var WD = { ko: ["일", "월", "화", "수", "목", "금", "토"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
  function ymd(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function todayLocal() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function dday(s) { return Math.round((ymd(s) - todayLocal()) / 864e5); }
  function calDate(n) {
    var d = ymd(n.d), md = (d.getMonth() + 1) + "/" + d.getDate();
    if (n.approx === "month") return t({ ko: (d.getMonth() + 1) + "월 중", en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()] + " (TBA)" });
    if (n.approx === "by") return t({ ko: md + "까지", en: "By " + md });
    return md + " (" + t({ ko: WD.ko[d.getDay()], en: WD.en[d.getDay()] }) + ")" + (n.approx === "est" ? t({ ko: " 예정", en: " est." }) : "");
  }
  function ddayTxt(n) {
    if (n.approx === "month") return "";
    var k = dday(n.d);
    return k === 0 ? "D-DAY" : k > 0 ? "D-" + k : t({ ko: "발표됨", en: "Done" });
  }
  function briefSection() {
    var b = data.brief;
    if (!b || !b.lines || !b.lines.length) return "";
    return '<section class="card brief"><div class="eyebrow">' + t({ ko: "오늘의 3줄 요약", en: "Today in three lines" }) + " · " + esc(b.date) + "</div><ol>" +
      b.lines.map(function (l) { return "<li>" + t(l) + "</li>"; }).join("") + "</ol>" +
      (b.compared ? "" : '<p class="note">' + t({ ko: "전날 자료가 없어 변화 비교는 빠졌습니다.", en: "No previous day to compare with yet." }) + "</p>") + "</section>";
  }
  // 지표 발표 당일 빠른 업데이트 (meetings.flash)
  var ODL = [{ ko: "인하", en: "Cut" }, { ko: "동결", en: "Hold" }, { ko: "인상", en: "Hike" }];
  function mdS(s) { var d = ymd(s); return (d.getMonth() + 1) + "/" + d.getDate(); }
  function flashSection() {
    var f = data.flash;
    if (!f || dday(f.date) < -2) return "";
    var vals = f.values.map(function (v) {
      var ym = v.asof.split("-");
      return '<div class="cr fl-v"><span>' + "<i>" + t(v.name) + "</i><small>" + t({ ko: ym[0] + "년 " + (+ym[1]) + "월 수치", en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][ym[1] - 1] + " " + ym[0] }) + "</small></span><b><span>" + num(v.value, 2) + t(v.unit) + "</span>" +
        (v.prev != null ? "<small>" + t({ ko: "직전 ", en: "prev " }) + num(v.prev, 2) + t(v.unit) + "</small>" : "") + "</b></div>";
    }).join("");
    var odds = "";
    if (f.before) {
      odds = '<div class="fl-odds">' + [2, 1, 0].map(function (i) {
        var d = Math.round((f.after[i] - f.before[i]) * 100);
        return '<div class="fl-o' + (i === f.top ? " top" : "") + '"><span>' + t(ODL[i]) + "</span><b>" + pct(f.before[i]) + " → " + pct(f.after[i]) + "</b>" +
          '<small class="' + (d > 0 ? "up" : d < 0 ? "down" : "") + '">' + (d === 0 ? t({ ko: "변화 없음", en: "no change" }) : (d > 0 ? "+" : "") + d + "%p") + "</small></div>";
      }).join("") + "</div>";
    }
    return '<section class="card flash"><div class="eyebrow">' + t({ ko: "방금 나온 지표", en: "Just released" }) + " · " + calDate({ d: f.date }) + "</div>" +
      "<h2>" + t(f.name) + "</h2>" + '<div class="cres">' + vals + "</div>" +
      (odds ? '<p class="sub">' + t({ ko: "발표 반영 후 연준 다음 결정(" + (f.fomc ? mdS(f.fomc) : "") + ") 전망 — 발표 전(" + mdS(f.before_date) + ") → 지금",
        en: "Next Fed decision odds — before (" + mdS(f.before_date) + ") → after the release" }) + "</p>" + odds : "") +
      '<p class="note"><a href="' + esc(f.source) + '" target="_blank" rel="noopener">' + t({ ko: "공식 발표 일정", en: "Official schedule" }) + "</a> · " +
      t({ ko: "발표일에는 미국 동부 오전 10시쯤 한 번 더 갱신합니다.", en: "On release days we refresh again around 10am US Eastern." }) + "</p></section>";
  }
  // 주간 요약 (meetings.weekly)
  function weeklySection() {
    var w = data.weekly;
    if (!w || !w.lines || !w.lines.length) return "";
    var md = mdS;
    return '<section class="card weekly"><div class="eyebrow">' + t({ ko: "주간 요약", en: "Week in review" }) + " · " + md(w.from) + " ~ " + md(w.to) + "</div><ul>" +
      w.lines.map(function (l) { return '<li class="wk-' + l.kind + '">' + t(l) + "</li>"; }).join("") + "</ul></section>";
  }
  // 결정 기록만 따로 (다음 결정 일정은 ☰ 메뉴의 나라별 금리 옆에 회색으로 보여 준다)
  function recordSection() {
    var r = data.calendar && data.calendar.record;
    if (!r || !r.items || !r.items.length) return "";
    return '<section class="card">' + recordHtml(r).replace('<h3 class="cal-h3">', "<h2>").replace("</h3>", "</h2>") + "</section>";
  }
  function nextDecision(tab) {  // 메뉴용 짧은 표기: "11/26 · D-7"
    var c = data.calendar, b = c && c.banks && c.banks.filter(function (x) { return x.tab === tab; })[0];
    if (!b || !b.next || !b.next.length) return "";
    var n = b.next[0];
    if (n.approx === "month" || n.approx === "by") return calDate(n);
    var d = ymd(n.d), k = dday(n.d);
    return (d.getMonth() + 1) + "/" + d.getDate() + (k >= 0 ? " · " + (k === 0 ? "D-DAY" : "D-" + k) : "");
  }
  function calSection(rows) {
    var c = data.calendar;
    if (!c || !c.banks) return "";
    var sigOf = {};
    rows.forEach(function (r) { sigOf[r.tab] = r; });
    var pin = pins(), banks = c.banks.slice().sort(function (a, b) { return (pin.indexOf(a.tab) < 0) - (pin.indexOf(b.tab) < 0); });
    var items = banks.map(function (b) {
      var n = b.next[0], r = sigOf[b.tab], dd = ddayTxt(n), soon = n.approx !== "month" && dday(n.d) >= 0 && dday(n.d) <= 7;
      var call = r && r.sig != null ? chip(r.sig, !!r.stance) + '<span class="cal-k">' + t(r.kind === "last" ? { ko: "최근 결정", en: "Latest" } : { ko: "우리 전망", en: "Our call" }) + "</span>" : "";
      var later = b.next.slice(1).map(calDate).join(" · ");
      return '<li><button type="button" class="cal-row" data-tab="' + b.tab + '">' +
        '<span class="cal-dd' + (soon ? " soon" : "") + '">' + (dd || "–") + "</span>" +
        '<span class="cal-main"><span class="cal-nm">' + (pin.indexOf(b.tab) >= 0 ? '<span class="star">★</span> ' : "") + t(b.name) + "</span>" +
        '<span class="cal-date">' + calDate(n) + (later ? '<span class="cal-later"> · ' + t({ ko: "다음 ", en: "then " }) + later + "</span>" : "") + "</span>" +
        (b.note ? '<span class="cal-note">' + t(b.note) + "</span>" : "") + "</span>" +
        '<span class="cal-call">' + call + "</span></button></li>";
    }).join("");
    return '<section class="card"><h2>' + t({ ko: "다음 금리 결정", en: "Next rate decisions" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "중앙은행이 공식 발표한 일정입니다. 날짜는 각 나라 현지 발표일이고, D-day는 오늘 날짜로 셉니다.", en: "Official schedules. Dates are local announcement days; D-day counts from today." }) + "</p>" +
      '<ul class="cal">' + items + "</ul>" + recordHtml(c.record) + "</section>";
  }
  function releaseSection() {
    var c = data.calendar;
    if (!c || !c.releases || !c.releases.length) return "";
    var rowOf = {};
    (data.groups || []).forEach(function (g) { g.rows.forEach(function (r) { rowOf[r.key] = r; }); });
    var items = c.releases.map(function (r) {
      var n = r.next[0];
      var last = r.inds.map(function (k) {
        var x = rowOf[k];
        if (!x || x.value == null) return "";
        return t(x.name) + " <b>" + num(x.value, k === "nfp_3m" ? 0 : 1) + t(x.unit) + "</b>" + (x.chg3 != null ? ' <span class="lab">(' + t({ ko: "3개월 전보다 ", en: "3m chg " }) + (Math.abs(x.chg3) < (k === "nfp_3m" ? 0.5 : 0.05) ? t({ ko: "변화 없음", en: "flat" }) : num(x.chg3, k === "nfp_3m" ? 0 : 1, true) + (x.unit.ko === "%" ? t({ ko: "%p", en: "pp" }) : t(x.unit))) + ")</span>" : "") + ' <span class="lab">' + esc(x.asof) + "</span>";
      }).filter(Boolean).join("<br>");
      return '<li class="rel"><span class="cal-dd' + (n && dday(n) <= 7 ? " soon" : "") + '">' + (n ? ddayTxt({ d: n }) : "–") + "</span>" +
        '<span class="cal-main"><span class="cal-nm">' + t(r.name) + "</span>" +
        '<span class="cal-date">' + (n ? calDate({ d: n }) : t({ ko: "다음 일정 미공지", en: "Next date not announced" })) + "</span>" +
        '<span class="cal-note">' + t({ ko: "최근 발표 · ", en: "Latest · " }) + last + "</span></span></li>";
    }).join("");
    return '<section class="card"><h2>' + t({ ko: "미국 주요 지표 발표", en: "Key US data releases" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "연준 결정에 가장 큰 영향을 주는 발표입니다. 미국 동부 오전 8시 30분(한국 밤 10시 30분, 미국 서머타임 땐 9시 30분)에 나옵니다. 발표 다음 날 아침 업데이트에 반영되고, 오늘의 3줄 요약에서 전망이 어떻게 바뀌었는지 볼 수 있습니다.",
        en: "The releases that move Fed decisions most, out at 8:30am ET. They're reflected in the next morning's update; the three-line brief shows how the outlook moved." }) + "</p>" +
      '<ul class="cal">' + items + "</ul>" +
      '<p class="note">' + t({ ko: "일정 출처: 미국 노동통계국(CPI·고용), 경제분석국(PCE, 12월분 이후는 아직 미공지). 시장 예상치는 유료 자료라 넣지 않았습니다.",
        en: "Schedules: BLS (CPI, jobs) and BEA (PCE; later dates not yet announced). Market consensus is paid data, so it isn't shown." }) + "</p></section>";
  }
  function recordHtml(r) {
    if (!r) return "";
    var SIGT = function (v) { return v == null ? "–" : chip(v, false); };
    var head = '<h3 class="cal-h3">' + t({ ko: "우리 전망 vs 실제 결과", en: "Our calls vs. actual decisions" }) + "</h3>";
    if (!r.items || !r.items.length) {
      return head + '<p class="note">' + t({ ko: "결정 전날까지 나와 있던 우리 전망과 실제 결정을 매번 기록합니다. 기록은 " + (r.since || "–") + "부터 모으고 있고, 아직 그 뒤에 결정이 없었습니다. 결정이 나오면 여기에 적중·빗나감이 쌓입니다.",
        en: "Each decision is scored against the call we had the day before. Records start " + (r.since || "–") + "; no decision has happened since. Hits and misses will appear here." }) + "</p>";
    }
    var tr = r.items.slice(0, 12).map(function (x) {
      var res = x.hit == null ? '<span class="lab">' + t({ ko: "결과 확인 중", en: "Pending" }) + "</span>" : x.hit ? '<b class="hit">' + t({ ko: "적중", en: "Hit" }) + "</b>" : '<span class="miss">' + t({ ko: "빗나감", en: "Miss" }) + "</span>";
      return "<tr><td>" + esc(x.date) + "</td><td>" + t(x.name) + "</td><td>" + SIGT(x.call) + (x.call_p ? ' <span class="lab">' + pct(x.call_p) + "</span>" : "") + "</td><td>" + SIGT(x.actual) + '</td><td class="n">' + res + "</td></tr>";
    }).join("");
    return head + (r.n ? '<p class="sub">' + t({ ko: r.n + "번 중 " + Math.round(r.hit * r.n) + "번 적중 (" + pct(r.hit) + ")", en: Math.round(r.hit * r.n) + " of " + r.n + " right (" + pct(r.hit) + ")" }) + "</p>" : "") +
      '<div class="tbl"><table class="cmp"><thead><tr><th>' + t({ ko: "결정일", en: "Date" }) + "</th><th>" + t({ ko: "중앙은행", en: "Bank" }) + "</th><th>" + t({ ko: "우리 전망", en: "Our call" }) + "</th><th>" + t({ ko: "실제", en: "Actual" }) + '</th><th class="n">' + t({ ko: "결과", en: "Result" }) + "</th></tr></thead><tbody>" + tr + "</tbody></table></div>" +
      '<p class="note">' + t({ ko: "미국은 다음 FOMC 확률 1위, 한국·유럽·일본·스위스는 적정금리 방향 신호를 결정 전날 기준으로 채점합니다. 이 나라들은 금리 통계가 월별이라 결과가 몇 주 늦게 확인될 수 있습니다.",
        en: "US: the top next-FOMC outcome; Korea, euro area, Japan, Switzerland: the fair-rate signal, both as of the day before. Those rates are monthly statistics, so results can take a few weeks to confirm." }) + "</p>";
  }
  // ---------- 관심 나라 고정 (이 기기에만 저장, 크롬 확장에선 알림·배지에도 씀) ----------
  var PINS = "fed-dash-pins";
  function tt(pair) { return word(pair, root.lang); }  // 속성·선택 상자용 평문 (현재 언어)
  function isKo() { return root.lang === "ko"; }
  function pins() { try { return JSON.parse(localStorage.getItem(PINS) || "[]"); } catch (e) { return []; } }
  function togglePin(tab) {
    var p = pins(), i = p.indexOf(tab);
    if (i >= 0) p.splice(i, 1); else p.push(tab);
    try { localStorage.setItem(PINS, JSON.stringify(p)); } catch (e) {}
    extSet({ pins: p });
  }
  // 크롬 확장 프로그램 안에서만: 알림·배지 설정을 백그라운드와 공유
  function extOn() { return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local && chrome.runtime && chrome.runtime.id; }
  function extSet(o) { try { if (extOn()) chrome.storage.local.set(o); } catch (e) {} }
  var ext = { alerts: true };
  if (extOn()) {
    try {
      chrome.storage.local.get(["alerts"], function (r) { ext.alerts = r.alerts !== false; if (view.tab === "all" && data) render(); });
      extSet({ pins: pins() });
    } catch (e) {}
  }
  function alertBox() {
    if (!extOn()) return "";
    return '<section class="card alertbox"><div><h2>' + t({ ko: "알림", en: "Alerts" }) + '</h2><p class="sub">' +
      t({ ko: "금리 결정 하루 전, 결정 결과(우리 전망 적중 여부), 연준 전망이 크게 바뀔 때, 미국 물가·고용 지표가 나온 직후, 그리고 매주 월요일 주간 요약을 알려 드립니다. 툴바 아이콘에는 다음 결정까지 남은 날(D-day)이 표시됩니다. ★로 고정한 나라를 우선으로 봅니다.",
          en: "We notify you the day before each rate decision, when results come in (and whether our call was right), when the Fed outlook shifts a lot, right after US inflation and jobs releases, and with a weekly summary on Mondays. The toolbar icon shows days to the next decision. Starred countries come first." }) +
      '</p></div><button type="button" class="tgl" data-alerts aria-pressed="' + ext.alerts + '">' + t(ext.alerts ? { ko: "켜짐", en: "On" } : { ko: "꺼짐", en: "Off" }) + "</button></section>";
  }
  // 휴대폰 홈 화면 설치 (웹앱 빌드에만 manifest가 있다 — 크롬 파일·확장·데스크톱 앱에서는 아무것도 안 함)
  var pwa = { on: !!document.querySelector('link[rel="manifest"]'), prompt: null };
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (pwa.on && "serviceWorker" in navigator && location.protocol === "https:") {
    try { navigator.serviceWorker.register("sw.js"); } catch (e) {}
  }
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); pwa.prompt = e; if (view.tab === "all" && data) render(); });
  function installBox() {
    if (!pwa.on || standalone) return "";
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (!ios && !pwa.prompt) return "";
    return '<section class="card alertbox"><div><h2>' + t({ ko: "휴대폰 홈 화면에 설치", en: "Add to your home screen" }) + '</h2><p class="sub">' +
      (ios ? t({ ko: "사파리 아래쪽 공유 버튼(□↑)을 누르고 '홈 화면에 추가'를 고르면 앱처럼 열 수 있습니다.", en: "In Safari, tap Share (□↑) and choose 'Add to Home Screen' to open it like an app." })
           : t({ ko: "버튼을 누르면 홈 화면에 앱 아이콘이 생깁니다.", en: "Tap the button to add an app icon to your home screen." })) + "</p></div>" +
      (ios ? "" : '<button type="button" class="tgl" data-install>' + t({ ko: "설치", en: "Install" }) + "</button>") + "</section>";
  }
  function countriesView() {  // 나라별 금리 → 전체: 나라 카드 모음
    var rows = allRows(), pin = pins();
    rows.sort(function (a, b) { return (pin.indexOf(a.tab) < 0) - (pin.indexOf(b.tab) < 0); });
    var cnt = { "1": 0, "0": 0, "-1": 0 };
    rows.forEach(function (r) { if (r.kind === "outlook" && r.sig != null) cnt[String(r.sig)]++; });
    var cards = rows.map(function (r) {
      var lab = r.sig == null ? '<span class="chip none">' + t({ ko: "판단 없음", en: "No call" }) + "</span>" : chip(r.sig, !!r.stance);
      var on = pin.indexOf(r.tab) >= 0;
      return '<div class="acard-w"><button type="button" class="pin" data-pin="' + r.tab + '" aria-pressed="' + on + '" aria-label="' + esc(tt(on ? { ko: "고정 해제", en: "Unpin" } : { ko: "맨 위에 고정", en: "Pin to top" })) + '">' + (on ? "★" : "☆") + "</button>" +
        '<button type="button" class="acard' + (on ? " pinned" : "") + '" data-tab="' + r.tab + '">' +
        '<span class="ac-top"><span class="ac-nm">' + t(r.name) + "</span>" + (r.rate ? '<span class="ac-rate">' + r.rate + "</span>" : "") + "</span>" +
        '<span class="ac-sig">' + lab + '<span class="ac-kind">' + t(r.kind === "last" ? { ko: "최근 결정", en: "Latest decision" } : { ko: "전망", en: "Outlook" }) + "</span></span>" +
        '<span class="ac-why">' + t(r.why) + "</span></button></div>";
    }).join("");
    return '<section class="card"><h2>' + t({ ko: "나라별 금리 방향", en: "Rate direction by country" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "전망 기준 " + cnt["1"] + "곳 인상 · " + cnt["0"] + "곳 동결 · " + cnt["-1"] + "곳 인하. 카드를 누르면 그 나라 화면으로 갑니다.",
        en: "Outlook: " + cnt["1"] + " hike · " + cnt["0"] + " hold · " + cnt["-1"] + " cut. Tap a card for that country." }) + " " + t({ ko: "☆을 누르면 그 나라를 맨 위에 고정합니다.", en: "Tap ☆ to pin a country to the top." }) + "</p>" +
      '<div class="acards">' + cards + "</div>" +
      '<p class="note">' + t({ ko: "전망: 미국은 다음 FOMC 확률, 한국·유럽·일본·스위스는 물가·고용으로 본 적정금리와 현재 금리의 차이(0.5%p 넘으면 인상·인하), 홍콩은 연준을 따라갑니다. " +
        "최근 결정: 싱가포르(환율로 정책)와 중국(공식이 맞지 않음)은 앞으로의 판단 대신 가장 최근 실제 결정을 보여 줍니다.",
        en: "Outlook: the US uses next-FOMC odds; Korea, the euro area, Japan and Switzerland compare the fair rate from inflation and jobs with today's rate (beyond 0.5pp = hike or cut); Hong Kong follows the Fed. " +
        "Latest decision: Singapore (policy via the exchange rate) and China (formulas don't fit) show their most recent actual move instead of a call." }) + "</p></section>" +
      "<footer><p>" + t(UI.disc1) + "</p></footer>";
  }
  function allView() {
    return flashSection() + briefSection() + weeklySection() + recordSection() + releaseSection() + alertBox() + installBox() + fxSection() +
      "<footer><p>" + t(UI.disc1) + "</p></footer>";
  }

  // ---------- 내 돈 계산기 (무료) ----------
  function calcState() {
    if (!view.calc) {
      var en = !isKo();
      view.calc = { loan: en ? 300000 : 30000, lrate: en ? 6.5 : 4.2, d: 0.25, dep: en ? 10000 : 1000, drate: en ? 4.0 : 3.0, fxAmt: en ? 1000 : 1000000, fxTo: null };
    }
    return view.calc;
  }
  function calcView() {
    var c = calcState(), ko = isKo();
    var bok = data.korea && data.korea.now, nextKr = null, nextUs = null;
    ((data.calendar || {}).banks || []).forEach(function (b) { if (b.key === "kr") nextKr = b; if (b.key === "us") nextUs = b; });
    var hint = function (b) {
      if (!b) return "";
      var cl = b.call && b.call.sig != null ? chip(b.call.sig, false) : "";
      return '<p class="note">' + t(b.name) + " " + t({ ko: "다음 결정 ", en: "next decision " }) + calDate(b.next[0]) + " " + ddayTxt(b.next[0]) + (cl ? " · " + t({ ko: "우리 전망 ", en: "our call " }) + cl : "") + "</p>";
    };
    var steps = [-1, -0.5, -0.25, 0.25, 0.5, 1].map(function (v) {
      return '<button type="button" data-cd="' + v + '" aria-pressed="' + (c.d === v) + '">' + (v > 0 ? "+" : "−") + Math.abs(v).toFixed(2) + "%p</button>";
    }).join("");
    var unit = t({ ko: "만원", en: "$" });
    var field = function (key, lab, val, step, suf) {
      return '<label class="cf"><span>' + t(lab) + '</span><span class="cf-in"><input type="number" inputmode="decimal" min="0" step="' + step + '" data-calc="' + key + '" value="' + val + '"><em>' + suf + "</em></span></label>";
    };
    var codes = FX_ORDER.filter(function (x) { return x !== fxBase(); });
    var to = c.fxTo && codes.indexOf(c.fxTo) >= 0 ? c.fxTo : codes[0];
    return '<section class="card"><h2>' + t({ ko: "대출 이자 계산기", en: "Loan interest" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "변동금리 대출이라면 기준금리가 움직일 때 내 월 이자가 얼마나 바뀌는지 봅니다.", en: "For a variable-rate loan: how your monthly interest changes when policy rates move." }) + "</p>" +
      '<div class="cgrid">' + field("loan", { ko: "대출 잔액", en: "Balance" }, c.loan, ko ? 100 : 1000, unit) + field("lrate", { ko: "지금 대출 금리", en: "Current rate" }, c.lrate, 0.05, "%") + "</div>" +
      '<div class="cd-row"><span>' + t({ ko: "기준금리가", en: "If rates move" }) + '</span><div class="seg-btn">' + steps + "</div></div>" +
      '<div class="cres" data-cres="loan"></div>' + hint(ko ? nextKr : nextUs) +
      '<p class="note">' + t({ ko: "이자만 계산했습니다(원금 상환 제외). 은행이 기준금리 변화를 대출 금리에 그대로, 바로 반영한다고 가정했지만, 실제로는 코픽스 등 기준 금리가 바뀌는 주기(보통 3·6개월)에 맞춰 늦게, 다르게 반영됩니다.",
        en: "Interest only (no principal). Assumes the full change passes straight to your loan rate; in practice it follows your loan's reset schedule and benchmark." }) + "</p></section>" +
      pathCard() +
      '<section class="card"><h2>' + t({ ko: "예금 이자 계산기", en: "Savings interest" }) + "</h2>" +
      '<div class="cgrid">' + field("dep", { ko: "예금액", en: "Deposit" }, c.dep, ko ? 100 : 1000, unit) + field("drate", { ko: "지금 예금 금리", en: "Current rate" }, c.drate, 0.05, "%") + "</div>" +
      '<div class="cres" data-cres="dep"></div>' +
      '<p class="note">' + t({ ko: "1년 이자 기준. 세후는 이자소득세 15.4%를 뺀 값입니다. 위에서 고른 금리 변화를 똑같이 적용했습니다.", en: "One year of interest, using the same rate change chosen above. Before tax." }) + "</p></section>" +
      '<section class="card"><h2>' + t({ ko: "환전 계산기", en: "Currency converter" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "지금 환율로 얼마인지, 그리고 지금 환율이 지난 1년 중 어느 수준인지 보여 줍니다. 기준 통화는 '전체' 탭의 환율에서 고른 통화입니다.", en: "What it's worth now, and where today's rate sits in the past year. The base currency is the one picked on the All tab." }) + "</p>" +
      '<div class="cgrid">' + field("fxAmt", { ko: FX_NAME[fxBase()].ko + " 금액", en: "Amount in " + FX_UNIT[fxBase()].en }, c.fxAmt, 1, t(FX_UNIT[fxBase()])) +
      '<label class="cf"><span>' + t({ ko: "바꿀 통화", en: "Convert to" }) + '</span><span class="cf-in"><select data-calc="fxTo">' +
      codes.map(function (x) { return '<option value="' + x + '"' + (x === to ? " selected" : "") + ">" + esc(tt(FX_NAME[x])) + "</option>"; }).join("") + "</select></span></label></div>" +
      '<div class="cres" data-cres="fx"></div>' +
      '<p class="note">' + t({ ko: "유럽중앙은행 기준환율(매매기준율에 가까운 값)입니다. 실제 환전할 때는 은행 수수료(스프레드)가 붙습니다.", en: "ECB reference rates (mid-market). Banks add a spread when you exchange." }) + "</p></section>" +
      "<footer><p>" + t({ ko: "계산 결과는 참고용 추정치입니다. 실제 금리·이자는 금융회사와 약관에 따라 다릅니다.", en: "Estimates for reference only. Actual rates depend on your lender and contract." }) + "</p></footer>";
  }
  // 앞으로 1년 기준금리 경로 → 내 변동금리 대출 이자 (meetings.rate_path)
  function pathBank() {
    var rp = data.rate_path || {}, c = calcState();
    var b = c.pb || (isKo() ? "kr" : "us");
    if (!rp[b]) b = rp.kr ? "kr" : rp.us ? "us" : null;
    return b;
  }
  function pathCard() {
    var rp = data.rate_path, b = pathBank();
    if (!rp || !b) return "";
    var btn = function (k, lab) { return rp[k] ? '<button type="button" data-cpb="' + k + '" aria-pressed="' + (k === b) + '">' + t(lab) + "</button>" : ""; };
    return '<section class="card"><h2>' + t({ ko: "앞으로 1년, 내 대출 이자는?", en: "Your loan over the next year" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "위에 넣은 대출 잔액·금리로, 기준금리가 우리 전망대로 움직이면 1년 동안 이자가 어떻게 바뀌는지 봅니다.", en: "Using the balance and rate above: what happens to your interest if policy rates follow our outlook." }) + "</p>" +
      '<div class="cd-row"><span>' + t({ ko: "기준금리", en: "Policy rate" }) + '</span><div class="seg-btn">' + btn("kr", { ko: "한국은행", en: "Bank of Korea" }) + btn("us", { ko: "미국 연준", en: "US Fed" }) + "</div></div>" +
      '<div data-cres="path"></div>' +
      '<p class="note">' + t({ ko: "가정: 우리 전망 방향으로, 정책준칙이 말하는 적정금리까지 금리 결정 2번에 한 번 0.25%p씩, 1년에 최대 1%p 움직인다고 봤습니다. 대출 금리는 기준금리 변화만큼 바로 움직인다고 가정했습니다(실제로는 코픽스 등에 따라 몇 달 늦게, 폭도 다를 수 있음). 원금 상환은 뺐습니다.",
        en: "Assumes rates move in our outlook's direction toward the policy-rule fair rate, 0.25pp at every other meeting, at most 1pp in a year, and that your loan rate moves one-for-one right away (in reality it lags with your loan's reset schedule). Interest only." }) + "</p></section>";
  }
  function pathUpdate(money) {
    var el = app.querySelector('[data-cres="path"]'), b = pathBank();
    if (!el || !b) return;
    var c = calcState(), P = data.rate_path[b], start = ymd(P.path[0].d);
    var at = function (date) { var r = P.now; P.path.forEach(function (x) { if (ymd(x.d) <= date) r = x.r; }); return r; };
    var mon = function (m) { var d = new Date(start); d.setMonth(d.getMonth() + m); return d; };
    var tot = 0, base = 0;
    for (var m = 0; m < 12; m++) { var dlt = at(mon(m)) - P.now; tot += c.loan * Math.max(c.lrate + dlt, 0) / 1200; base += c.loan * c.lrate / 1200; }
    var rows = [0, 3, 6, 12].map(function (m) {
      var pr = at(mon(m)), lr = Math.max(c.lrate + pr - P.now, 0);
      return "<tr><td>" + t(m === 0 ? { ko: "지금", en: "Now" } : { ko: m + "개월 뒤", en: "In " + m + " mo." }) + '</td><td class="n">' + num(pr, 2) + '%</td><td class="n">' + num(lr, 2) + '%</td><td class="n">' + money(c.loan * lr / 1200) + "</td></tr>";
    }).join("");
    var dir = P.total > 0 ? { ko: "인상", en: "hikes" } : P.total < 0 ? { ko: "인하", en: "cuts" } : null;
    var bn = b === "kr" ? { ko: "한국은행", en: "Bank of Korea" } : { ko: "연준", en: "the Fed" };
    var head = dir ? t({ ko: "우리 전망: " + bn.ko + "이 1년 동안 모두 " + num(Math.abs(P.total), 2) + "%p " + dir.ko + " (지금 " + num(P.now, 2) + "% → 적정금리 " + num(P.fair, 2) + "% 방향)",
                         en: "Our outlook: " + bn.en + " " + dir.en + " " + num(Math.abs(P.total), 2) + "pp in total over the year (now " + num(P.now, 2) + "%, fair rate " + num(P.fair, 2) + "%)" })
                   : t({ ko: "우리 전망: " + bn.ko + " 금리 그대로 (지금 " + num(P.now, 2) + "%)", en: "Our outlook: " + bn.en + " holds (now " + num(P.now, 2) + "%)" });
    var d = tot - base;
    el.innerHTML = '<p class="sub"><b>' + head + "</b></p>" +
      '<div class="tbl"><table class="kv path"><thead><tr><th></th><th class="n">' + t({ ko: "기준금리", en: "Policy" }) + '</th><th class="n">' + t({ ko: "내 대출 금리", en: "Your rate" }) + '</th><th class="n">' + t({ ko: "월 이자", en: "Monthly" }) + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<div class="cres"><div class="cr big"><span>' + t({ ko: "1년 이자 합계 (금리 그대로일 때와 차이)", en: "Interest over the year (vs. no change)" }) + "</span><b>" + money(tot) + " <small>(" + (d >= 0 ? "+" : "−") + money(Math.abs(d)) + ")</small></b></div></div>";
  }
  function calcUpdate() {
    var c = calcState(), ko = isKo();
    var money = function (v) {  // 한국어: 만원 단위 입력 → 원 단위로
      if (ko) { var w = Math.round(v * 10000); return w.toLocaleString("ko-KR") + "원"; }
      return "$" + Math.round(v).toLocaleString("en-US");
    };
    var el = function (k) { return app.querySelector('[data-cres="' + k + '"]'); };
    if (el("loan")) {
      var m0 = c.loan * c.lrate / 100 / 12, nr = Math.max(c.lrate + c.d, 0), m1 = c.loan * nr / 100 / 12;
      el("loan").innerHTML = '<div class="cr"><span>' + t({ ko: "지금 월 이자", en: "Monthly interest now" }) + "</span><b>" + money(m0) + "</b></div>" +
        '<div class="cr"><span>' + t({ ko: "금리 " + num(nr, 2) + "%일 때", en: "At " + num(nr, 2) + "%" }) + "</span><b>" + money(m1) + "</b></div>" +
        '<div class="cr big"><span>' + t({ ko: "한 달 차이 (1년)", en: "Change per month (per year)" }) + "</span><b>" + (m1 >= m0 ? "+" : "−") + money(Math.abs(m1 - m0)) + ' <small>(' + (m1 >= m0 ? "+" : "−") + money(Math.abs(m1 - m0) * 12) + ")</small></b></div>";
    }
    pathUpdate(money);
    if (el("dep")) {
      var y0 = c.dep * c.drate / 100, dr = Math.max(c.drate + c.d, 0), y1 = c.dep * dr / 100, tx = ko ? 0.846 : 1;
      el("dep").innerHTML = '<div class="cr"><span>' + t({ ko: "지금 1년 이자 (세후)", en: "Yearly interest now" }) + "</span><b>" + money(y0 * tx) + "</b></div>" +
        '<div class="cr"><span>' + t({ ko: "금리 " + num(dr, 2) + "%일 때 (세후)", en: "At " + num(dr, 2) + "%" }) + "</span><b>" + money(y1 * tx) + "</b></div>" +
        '<div class="cr big"><span>' + t({ ko: "1년 차이", en: "Change per year" }) + "</span><b>" + (y1 >= y0 ? "+" : "−") + money(Math.abs(y1 - y0) * tx) + "</b></div>";
    }
    var f = data.fx;
    if (el("fx") && f) {
      var base = fxBase(), codes = FX_ORDER.filter(function (x) { return x !== base; });
      var to = c.fxTo && codes.indexOf(c.fxTo) >= 0 ? c.fxTo : codes[0];
      var d = fxSeries(f.daily, base, to);  // to 1단위 = base 몇
      if (d.length > 2) {
        var v = d[d.length - 1][1], cut = new Date(new Date(d[d.length - 1][0]).getTime() - 366 * 864e5);
        var yr = d.filter(function (p) { return new Date(p[0]) >= cut; }).map(function (p) { return p[1]; });
        var hi = Math.max.apply(null, yr), lo = Math.min.apply(null, yr);
        var below = yr.filter(function (x) { return x < v; }).length / yr.length;
        var k = fxScale(v, to), got = c.fxAmt / v;
        var pos = hi > lo ? (v - lo) / (hi - lo) * 100 : 50;
        var bu = t(FX_UNIT[base]), tu = t(FX_UNIT[to]);
        el("fx").innerHTML = '<div class="cr big"><span>' + t({ ko: "받는 금액", en: "You get" }) + "</span><b>" + num(got, got >= 100 ? 0 : 2) + " " + tu + "</b></div>" +
          '<div class="cr"><span>' + t({ ko: "적용 환율 (" + d[d.length - 1][0] + ")", en: "Rate (" + d[d.length - 1][0] + ")" }) + "</span><b>" + (k > 1 ? k + " " : "1 ") + tu + " = " + num(v * k, fxDigits(v * k)) + " " + bu + "</b></div>" +
          '<div class="fxrange"><div class="fxr-bar"><span style="left:' + pos.toFixed(1) + '%"></span></div><div class="fxr-lab"><span>' + t({ ko: "1년 최저 ", en: "1y low " }) + num(lo * k, fxDigits(lo * k)) + "</span><span>" + t({ ko: "1년 최고 ", en: "1y high " }) + num(hi * k, fxDigits(hi * k)) + "</span></div></div>" +
          '<p class="sub">' + t({ ko: FX_NAME[to].ko + " 값이 지난 1년 중 " + Math.round(below * 100) + "%의 날보다 비쌉니다. " + (below >= 0.8 ? "1년 기준으로 비싼 편이라, 급하지 않다면 나눠서 바꾸는 것도 방법입니다." : below <= 0.2 ? "1년 기준으로 싼 편입니다." : "1년 기준으로 중간 수준입니다."),
            en: "The " + FX_NAME[to].en + " is pricier than on " + Math.round(below * 100) + "% of days in the past year — " + (below >= 0.8 ? "on the expensive side." : below <= 0.2 ? "on the cheap side." : "around the middle.") }) + "</p>";
      }
    }
  }

  // ---------- 주요 통화 환율 (전체 탭) ----------
  var FX_NAME = { USD: { ko: "달러", en: "US dollar" }, EUR: { ko: "유로", en: "Euro" }, JPY: { ko: "엔", en: "Japanese yen" },
                  GBP: { ko: "파운드", en: "British pound" }, CNY: { ko: "위안", en: "Chinese yuan" }, KRW: { ko: "원", en: "Korean won" }, CHF: { ko: "프랑", en: "Swiss franc" } };
  var FX_UNIT = { USD: { ko: "달러", en: "USD" }, EUR: { ko: "유로", en: "EUR" }, JPY: { ko: "엔", en: "JPY" }, GBP: { ko: "파운드", en: "GBP" },
                  CNY: { ko: "위안", en: "CNY" }, KRW: { ko: "원", en: "KRW" }, CHF: { ko: "프랑", en: "CHF" } };
  var FX_ORDER = ["KRW", "USD", "EUR", "JPY", "GBP", "CNY", "CHF"];
  var PXSRC = {};  // 기간 버튼이 다시 그릴 가격 그래프 원본 (자산 폴더·환율)
  function fxBase() { return view.fxBase || (isKo() ? "KRW" : "USD"); }
  function fxPick(base) { var p = view.fxPick; return p && p !== base ? p : base === "USD" ? "EUR" : "USD"; }
  // base 기준으로 x 1단위의 값 (1달러당 값으로 저장돼 있어 base/x 로 나눈다)
  function fxSeries(block, base, x) {
    var b = base === "USD" ? null : block[base], c = x === "USD" ? null : block[x], out = [];
    block.t.forEach(function (d, i) {
      var pb = b ? b[i] : 1, px = c ? c[i] : 1;
      if (pb != null && px != null && px !== 0) out.push([d, pb / px]);
    });
    return out;
  }
  // 엔은 관례대로 100엔 단위, 값이 너무 작은 통화(예: 달러 기준 원)는 1000단위로 보여 준다
  function fxScale(v, code) {
    var k = code === "JPY" ? 100 : 1;
    while (v * k < 0.1 && k < 1000) k *= 10;
    return k;
  }
  function fxYearAgo(d) {  // 그래프의 '1년'과 같은 시작점: 마지막 날짜에서 366일 전 이후 첫 값
    var last = new Date(d[d.length - 1][0]), cut = new Date(last.getTime() - 366 * 864e5);
    for (var i = 0; i < d.length; i++) if (new Date(d[i][0]) >= cut) return d[i][1];
    return d[0][1];
  }
  function fxDigits(v) { return v >= 100 ? 2 : v >= 1 ? 4 : 5; }
  function fxSection() {
    var f = data && data.fx;
    if (!f) return "";
    var base = fxBase(), pick = fxPick(base);
    var bb = FX_ORDER.map(function (c) {
      return '<button type="button" data-fxbase="' + c + '" aria-pressed="' + (c === base) + '">' + t(FX_NAME[c]) + "</button>";
    }).join("");
    var cards = FX_ORDER.filter(function (c) { return c !== base; }).map(function (c) {
      var d = fxSeries(f.daily, base, c);
      if (d.length < 2) return "";
      var v = d[d.length - 1][1], k = fxScale(v, c), n = d.length;
      var w = n > 5 ? (v / d[n - 6][1] - 1) * 100 : null, y = (v / fxYearAgo(d) - 1) * 100;
      var lab = y > 0.5 ? { ko: "강세", en: "Stronger" } : y < -0.5 ? { ko: "약세", en: "Weaker" } : { ko: "보합", en: "Flat" };
      return '<button type="button" class="fxcard' + (c === pick ? " cur" : "") + '" data-fxpick="' + c + '">' +
        '<span class="fx-nm">' + t({ ko: (k > 1 ? k + " " : "1 ") + FX_UNIT[c].ko, en: (k > 1 ? k + " " : "1 ") + FX_UNIT[c].en }) + "</span>" +
        '<span class="fx-v">' + num(v * k, fxDigits(v * k)) + ' <small>' + t(FX_UNIT[base]) + "</small></span>" +
        '<span class="fx-ch">' + t({ ko: "1주 ", en: "1w " }) + (w == null ? "–" : num(w, 2, true) + "%") + " · " + t({ ko: "1년 ", en: "1y " }) + num(y, 1, true) + "%</span>" +
        '<span class="fx-lab ' + (y > 0.5 ? "up" : y < -0.5 ? "down" : "") + '">' + t({ ko: FX_NAME[base].ko + " 대비 " + lab.ko, en: lab.en + " vs. " + FX_UNIT[base].en }) + "</span></button>";
    }).join("");
    var dl = fxSeries(f.daily, base, pick), ml = fxSeries(f.monthly, base, pick);
    var last = dl.length ? dl[dl.length - 1][1] : 1, k = fxScale(last, pick);
    var sc = function (arr) { return arr.map(function (p) { return [p[0], p[1] * k]; }); };
    var src = { asset: "fx", daily: sc(dl), price: sc(ml),
      zoomEyebrow: t({ ko: "주요 통화 · " + FX_NAME[base].ko + " 기준", en: "Major currencies · in " + FX_UNIT[base].en }),
      meta: { name: { ko: (k > 1 ? k + " " : "1 ") + FX_UNIT[pick].ko + " 가치", en: (k > 1 ? k + " " : "1 ") + FX_UNIT[pick].en },
              unit: FX_UNIT[base], digits: fxDigits(last * k), vlabel: { ko: "환율", en: "Rate" } } };
    return '<section class="card"><h2>' + t({ ko: "주요 통화 환율", en: "Major currencies" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "기준 통화를 고르면 나머지 통화가 기준 통화로 얼마인지 보여 줍니다. 숫자가 오르면 그 통화가 기준 통화보다 강해진 것입니다. 강세·약세는 1년 전과 비교했습니다.",
        en: "Pick a base currency to see each currency's value in it. A rising number means that currency strengthened against the base. Stronger/weaker compares with a year ago." }) + "</p>" +
      '<div class="periods fx-base" role="group" aria-label="Base currency"><span class="fx-bl">' + t({ ko: "기준", en: "Base" }) + "</span>" + bb + "</div>" +
      '<div class="fxcards">' + cards + "</div>" +
      '<h3 class="fx-h">' + t({ ko: FX_NAME[pick].ko + " · " + FX_NAME[base].ko + " 기준", en: FX_NAME[pick].en + " in " + FX_UNIT[base].en }) + "</h3>" +
      pxBlock(src) +
      '<p class="note">' + t({ ko: "출처: 유럽중앙은행(ECB) 기준환율(1999년~, 영업일 기준, " + f.asof + "까지), 미국 연준(FRED) 월평균(그 이전). 최근 10년은 일별, 그보다 오래된 구간은 월평균입니다.",
        en: "Sources: ECB reference rates (since 1999, business days, through " + f.asof + "); Federal Reserve (FRED) monthly averages before that. The last 10 years are daily; older history is monthly." }) + "</p></section>";
  }

  // 나라 탭 목록 (탭 줄의 '다른 나라'를 펼치면 카드로 보인다)
  function countryList() {
    if (!data) return [];
    var out = [];
    var lc = function (n) { return n.last_change ? { ko: "마지막 변경 " + n.last_change.month, en: "Last change " + n.last_change.month } : { ko: "", en: "" }; };
    [["ea", UI.tabEA], ["jp", UI.tabJP], ["cn", UI.tabCN]].forEach(function (x) {
      var k = data[x[0]]; if (k) out.push({ tab: x[0], name: x[1], bank: k.meta.bank, rate: num(k.now.base) + "%", sub: lc(k.now) });
    });
    if (data.korea) out.push({ tab: "korea", name: UI.tabKorea, bank: { ko: "한국은행 기준금리", en: "BOK base rate" }, rate: num(data.korea.now.base) + "%", sub: lc(data.korea.now) });
    if (data.ch) out.push({ tab: "ch", name: UI.tabCH, bank: data.ch.meta.bank, rate: num(data.ch.now.base) + "%", sub: lc(data.ch.now) });
    if (data.hk) out.push({ tab: "hk", name: UI.tabHK, bank: { ko: "홍콩금융관리국", en: "HK Monetary Authority" }, rate: num(data.hk.now.base) + "%", sub: lc(data.hk.now) });
    if (data.sg) {
      var L = data.sg.now.last;
      out.push({ tab: "sg", name: UI.tabSG, bank: { ko: "싱가포르 통화청(MAS)", en: "Monetary Authority of Singapore" },
                 rate: t({ ko: SIG_ST.ko[String(L.dir)], en: SIG_ST.en[String(L.dir)] }), sub: { ko: "최근 결정 " + L.date, en: "Latest decision " + L.date } });
    }
    return out;
  }
  function header(canRefresh) {
    // 메뉴(☰): 누르면 화면 전체에 모든 화면 목록이 뜨고, 고르면 그 화면으로 간다 (토스뱅크식)
    var cl = countryList(), proOn = pro || serverOn() || proLocked();
    var tabs = "";
    if (data && (proOn || cl.length)) {
      var item = function (tab, name, right, badge, sub) {
        var cur = tab === view.tab, when = right ? nextDecision(tab) : "";
        return '<button type="button" class="mn-item' + (cur ? " cur" : "") + '" data-tab="' + tab + '"' + (cur ? ' aria-current="page"' : "") + ">" +
          '<span class="mn-l"><span class="mn-nm">' + t(name) + (badge ? ' <span class="pro-badge">PRO</span>' : "") + "</span>" +
          (sub ? '<span class="mn-sub">' + t(sub) + "</span>" : "") + "</span>" +
          '<span class="mn-r">' + (when ? '<span class="mn-when" title="' + esc(tt({ ko: "다음 금리 결정", en: "Next rate decision" })) + '">' + when + "</span>" : "") + (right ? '<b>' + right + "</b>" : "") + '<span class="mn-chev" aria-hidden="true">›</span></span></button>';
      };
      var us = data.meta ? num((data.meta.target_low + data.meta.target_high) / 2) + "%" : "";
      var groups = [
        [{ ko: "홈", en: "Home" }, (cl.length ? item("all", UI.tabAll, "", false, { ko: "오늘 요약 · 주간 요약 · 지표 일정 · 환율", en: "Today, this week, releases, currencies" }) : "") +
          (data.fx ? item("calc", { ko: "내 돈 계산기", en: "Calculator" }, "", false, { ko: "대출·예금 이자, 환전", en: "Loans, savings, currency" }) : "")],
        [{ ko: "나라별 금리", en: "Countries" }, (cl.length ? item("countries", { ko: "전체", en: "All countries" }, "", false, { ko: "나라별 금리 방향 한눈에", en: "Every country's rate direction" }) : "") +
          item("overview", UI.tabOverview, us, false, { ko: "다음 FOMC 전망", en: "Next FOMC outlook" }) +
          cl.slice().sort(function (a, b) { var pn = pins(); return (pn.indexOf(a.tab) < 0) - (pn.indexOf(b.tab) < 0); }).map(function (x) { return item(x.tab, x.name, x.rate, false, x.bank); }).join(""),
          { ko: "회색 글씨: 다음 금리 결정일 · 남은 날", en: "Grey: next decision date · days left" }],
        [{ ko: "PRO 폴더", en: "PRO folders" }, proOn ? item("proall", { ko: "전체", en: "All PRO" }, "", true, { ko: "세 폴더의 지금 신호 한눈에", en: "Every PRO signal at a glance" }) + item("pro", UI.tabPro, "", true, { ko: "경제학자 방식별 전망·성적", en: "Calls by economist method" }) +
          ((pro && pro.au) || !pro ? item("assets", UI.tabAssets, "", true, { ko: "금·유가·S&P 500", en: "Gold, oil, S&P 500" }) : "") +
          ((pro && pro.kw) || !pro ? item("fxpro", UI.tabFx, "", true, { ko: "원·엔·유로 등 환율", en: "Won, yen, euro and more" }) : "") : ""]
      ].filter(function (g) { return g[1]; });
      var curName = view.tab === "all" ? UI.tabAll : view.tab === "countries" ? { ko: "나라별 금리", en: "Countries" } : view.tab === "proall" ? { ko: "PRO", en: "PRO" } : view.tab === "overview" ? UI.tabOverview : view.tab === "calc" ? { ko: "내 돈 계산기", en: "Calculator" } :
        view.tab === "pro" ? UI.tabPro : view.tab === "assets" ? UI.tabAssets : view.tab === "fxpro" ? UI.tabFx :
        ((cl.filter(function (x) { return x.tab === view.tab; })[0] || {}).name || UI.tabOverview);
      var proTab = ["proall", "pro", "assets", "fxpro"].indexOf(view.tab) >= 0;  // PRO 메뉴 버튼을 보여 줄 화면
      // 폴더 화면 오른쪽 끝: 그 폴더가 속한 '전체' 화면으로 가는 버튼 (PRO 폴더 → PRO 전체, 나라 → 금리 전체, 계산기 → 전체)
      var up = null;
      if (proTab && view.tab !== "proall" && proOn) up = ["proall", { ko: "PRO 전체", en: "All PRO" }];
      else if (view.tab === "overview" || cl.some(function (x) { return x.tab === view.tab; })) up = cl.length ? ["countries", { ko: "금리 전체", en: "All rates" }] : null;
      else if (view.tab === "calc" && cl.length) up = ["all", { ko: "전체", en: "Home" }];
      // 세 '전체' 화면(홈·나라별 금리·PRO)에서는 세 버튼을 메뉴 옆에 두고, 지금 화면 버튼을 눌린 모양으로
      var ALLS = [["all", { ko: "전체", en: "Home" }, true], ["countries", { ko: "금리", en: "Rates" }, !!cl.length], ["proall", { ko: "PRO", en: "PRO" }, !!proOn]];
      var gos = ALLS.some(function (x) { return x[0] === view.tab; }) ? ALLS.filter(function (x) { return x[2]; }).map(function (x) {
        var on = x[0] === view.tab;
        return '<button type="button" class="mbar-go' + (on ? " on" : "") + '" data-tab="' + x[0] + '" aria-pressed="' + on + '">' + t(x[1]) + "</button>";
      }).join("") : "";
      tabs = '<nav class="mbar' + (gos ? " has-gos" : "") + '" data-html2canvas-ignore><button type="button" class="mn-btn" data-menu aria-expanded="false" aria-controls="mn-sheet" aria-label="' + esc(tt({ ko: "메뉴 열기", en: "Open menu" })) + '">' +
        '<span class="burger" aria-hidden="true"><i></i><i></i><i></i></span></button>' +
        (proTab && proOn ? '<button type="button" class="mn-btn mn-pro" data-menu-pro aria-expanded="false" aria-controls="mn-pro" aria-label="' + esc(tt({ ko: "PRO 메뉴 열기", en: "Open PRO menu" })) + '">PRO</button>' : "") +
        (view.tab === "proall" ? "" : '<span class="mbar-cur">' + t(curName) + "</span>") +
        (up ? '<button type="button" class="mbar-go mbar-up" data-tab="' + up[0] + '">' + t(up[1]) + "</button>" : "") + (gos ? '<span class="mbar-gos">' + gos + "</span>" : "") + "</nav>" +
        '<div class="mn-sheet" data-html2canvas-ignore id="mn-sheet" role="dialog" aria-modal="true" aria-label="' + esc(tt({ ko: "메뉴", en: "Menu" })) + '" hidden><div class="mn-inner">' +
        '<div class="mn-top"><b>' + t({ ko: "메뉴", en: "Menu" }) + '</b><button type="button" class="mn-x" data-menu-close aria-label="' + esc(tt({ ko: "닫기", en: "Close" })) + '">✕</button></div>' +
        groups.map(function (g) { return '<div class="mn-group"><div class="mn-h">' + t(g[0]) + "</div>" + (g[2] ? '<div class="mn-hint">' + t(g[2]) + "</div>" : "") + g[1] + "</div>"; }).join("") +
        '<div class="mn-group mn-langs"><button type="button" class="mn-item mn-langtoggle" data-langtoggle aria-expanded="false" aria-controls="mn-langlist">' +
          '<span class="mn-l"><span class="mn-nm">Languages · ' + t({ ko: "언어", en: "Language", zh: "语言", es: "Idioma" }) + "</span></span>" +
          '<span class="mn-r"><b class="mn-curlang">' + LANGS.map(function (l) { return '<span class="' + l + '">' + LANG_NAME[l] + "</span>"; }).join("") + '</b><span class="mn-chev mn-caret" aria-hidden="true">›</span></span></button>' +
          '<div class="mn-langlist" id="mn-langlist" hidden>' +
        LANGS.map(function (l) {
          return '<button type="button" class="mn-item mn-lang" data-lang="' + l + '" aria-pressed="' + (root.lang === l) + '" lang="' + l + '"><span class="mn-l"><span class="mn-nm">' + LANG_NAME[l] + "</span></span>" +
            '<span class="mn-r"><span class="mn-check" aria-hidden="true">✓</span></span></button>';
        }).join("") + "</div></div>" +
        (auth.session ? '<div class="mn-group"><button type="button" class="mn-item mn-logout" data-auth="logout">' +
          '<span class="mn-l"><span class="mn-nm">' + t({ ko: "로그아웃", en: "Sign out" }) + '</span><span class="mn-sub">' + esc(auth.session.email || "") + "</span></span>" +
          '<span class="mn-r"><span class="mn-chev" aria-hidden="true">›</span></span></button></div>' : "") +
        "</div></div>" +
        (proTab && proOn ? '<div class="mn-sheet" data-html2canvas-ignore id="mn-pro" role="dialog" aria-modal="true" aria-label="PRO" hidden><div class="mn-inner">' +
          '<div class="mn-top"><b>PRO</b><button type="button" class="mn-x" data-menu-close aria-label="' + esc(tt({ ko: "닫기", en: "Close" })) + '">✕</button></div>' +
          '<div class="mn-group">' + item("proall", { ko: "PRO 전체", en: "All PRO" }, "", false, { ko: "세 폴더의 지금 신호 한눈에", en: "Every PRO signal at a glance" }) + item("pro", UI.tabPro, "", true, { ko: "경제학자 방식별 전망·성적", en: "Calls by economist method" }) +
          ((pro && pro.au) || !pro ? item("assets", UI.tabAssets, "", true, { ko: "금·유가·S&P 500", en: "Gold, oil, S&P 500" }) : "") +
          ((pro && pro.kw) || !pro ? item("fxpro", UI.tabFx, "", true, { ko: "원·엔·유로 등 환율", en: "Won, yen, euro and more" }) : "") + "</div></div></div>" : "");
    }
    return "<header><div class=\"brand\"><h1>" + t(UI.title) + "</h1>" +
      (data ? '<span class="meta">' + t(UI.asof, { d: data.meta.generated }) + (fromCache ? " · " + t(UI.offline) : "") + "</span>" : "") +
      '</div><div class="hdr-right">' +
      (canRefresh ? '<button type="button" class="refresh" data-refresh>' + t(UI.refresh) + "</button>" : "") +
      (tabs ? "" : langsw()) + "</div></header>" + tabs;
  }

  function overview() {
    var d = data, top = d.headline.top, lead = d.odds.lead.p;
    var areas = areaChart(d.areas);
    var reasons = d.headline.reasons.slice(0, 3).map(function (r) { return "<li>" + t(r) + "</li>"; }).join("");
    var nInds = 0;
    d.groups.forEach(function (g) { nInds += g.rows.length; });
    var dataOnly = "";
    if (d.odds.data_only) {
      var q = d.odds.data_only.p;
      dataOnly = '<p class="note">' + t(UI.dataOnly) + ": " +
        [0, 1, 2].map(function (i) { return t({ ko: UI.classes.ko[i], en: UI.classes.en[i] }) + " " + pct(q[i]); }).join(" · ") + "</p>";
    }
    return '<section class="card hero"><div class="eyebrow">' + t(UI.eyebrow) + "</div>" +
      '<div class="big"><b>' + t({ ko: UI.classes.ko[top], en: UI.classes.en[top] }) + " " + pct(lead[top]) + "</b><span>" + t(UI.likely) + "</span></div>" +
      '<div class="range">' + t(UI.range, { lo: d.meta.target_low.toFixed(2), hi: d.meta.target_high.toFixed(2) }) + "</div>" +
      "<ul>" + reasons + "</ul></section>" +
      '<section class="card"><h2>' + t(UI.odds) + "</h2>" + probBar(d.odds.lead, true) + dataOnly +
      '<details class="more"><summary><span>' + t(UI.trust) + '</span></summary><p class="note">' + t(UI.oddsSub) + " " + t(d.odds.note) + "</p></details></section>" +
      keyTiles(d) +
      '<section class="card"><h2>' + t(UI.drivers) + '</h2><p class="sub">' + t(UI.driversSub) + "</p>" +
      areas + "</section>" +
      '<section class="card indicators"><h2>' + t(UI.allInds, { n: nInds }) + '</h2><p class="sub">' + t(UI.indsSub) + "</p>" + detailSection(d.groups) + "</section>" +
      "<footer><p>" + t(UI.disc1) + "</p><p>" + t(UI.disc2) + "</p></footer>";
  }

  /** 영역별 압력: 가운데(평소)에서 왼쪽=인하, 오른쪽=인상으로 뻗는 막대 하나의 그래프. */
  function areaChart(areas, stance) {
    var LIM = 3;
    function X(v) { return ((Math.max(-LIM, Math.min(LIM, v)) + LIM) / (2 * LIM)) * 100; }
    var grid = [-2, -1, 1, 2].map(function (v) { return '<span class="ac-gl" style="left:' + X(v) + '%"></span>'; }).join("") +
      '<span class="ac-mid"></span>';
    var rows = areas.map(function (a) {
      var s = a.score, bar = "";
      if (s != null) {
        var left = Math.min(X(0), X(s)), w = Math.abs(X(s) - X(0));
        bar = '<span class="ac-bar ' + (s >= 0 ? "up" : "down") + '" style="left:' + left.toFixed(2) + "%;width:" + Math.max(w, 0.6).toFixed(2) + '%"' +
          tipAttr(a.name.ko + ": " + num(s, 2, true) + " (" + a.label.ko + ")", a.name.en + ": " + num(s, 2, true) + " (" + a.label.en + ")") + "></span>";
      }
      return '<div class="ac-row"><div class="ac-name">' + t(a.name) + '</div><div class="ac-plot">' + grid + bar + "</div>" +
        '<div class="ac-lab">' + t(a.label) + "</div></div>";
    }).join("");
    return '<div class="achart" role="img" aria-label="' + esc(areas.map(function (a) { return a.name.en + " " + num(a.score, 2, true); }).join(", ")) + '">' + rows +
      '<div class="ac-row ac-axis"><div class="ac-name"></div><div class="ac-plot">' +
      '<span class="ac-tick" style="left:0%;transform:none">' + t(stance ? { ko: "완화 압력", en: "Easing pressure" } : UI.cutP) + "</span>" +
      '<span class="ac-tick" style="left:50%">' + t({ ko: "평소", en: "Normal" }) + "</span>" +
      '<span class="ac-tick" style="left:100%;transform:translateX(-100%)">' + t(stance ? { ko: "긴축 압력", en: "Tightening pressure" } : UI.hikeP) + '</span></div><div class="ac-lab"></div></div></div>';
  }

  // ---------- PRO: 경제학자 폴더 ----------
  function chip(sig, stance) {
    var k = String(sig);
    var L = stance === "asset" ? SIG_AS : stance === true ? SIG_ST : stance === false ? SIG : assetOn() ? SIG_AS : stanceOn() ? SIG_ST : SIG;
    return '<span class="chip ' + SIG_KEY[k] + '">' + t({ ko: L.ko[k], en: L.en[k] }) + "</span>";
  }
  function pctOrDash(v) { return v == null ? "–" : pct(v); }
  var FOLDER_ICON = '<svg class="ficon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2H19.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>';

  // PRO 지역: 미국(pro) 또는 한국(pro.kr)
  var REGIONS = [["us", { ko: "미국 연준", en: "US Fed" }], ["ea", { ko: "유럽(ECB)", en: "ECB" }], ["jp", { ko: "일본은행", en: "Bank of Japan" }],
                 ["cn", { ko: "중국", en: "China" }], ["kr", { ko: "한국은행", en: "Bank of Korea" }], ["ch", { ko: "스위스", en: "Switzerland" }],
                 ["sg", { ko: "싱가포르", en: "Singapore" }], ["hk", { ko: "홍콩", en: "Hong Kong" }],
                 ["au", { ko: "금", en: "Gold" }], ["ol", { ko: "석유", en: "Oil" }], ["sp", { ko: "S&P 500", en: "S&P 500" }]];
  var ASSET_REGIONS = { au: 1, ol: 1, sp: 1 };
  var NOTE_REGIONS = { hk: 1, cn: 1 };  // 폴더 대신 설명만 보여 주는 지역
  var FX_PAIRS = ["kw", "eu", "jy", "gb", "cy", "cf"];  // 환율 폴더 (원/달러, 유로/달러, 엔/달러, 파운드/달러, 위안/달러, 프랑/달러)
  var FOLDER_REGIONS = ["kr", "sg", "ea", "ch", "jp", "au", "ol", "sp"].concat(FX_PAIRS);
  function curRegion() {
    var r = view.region;
    if (ASSET_REGIONS[r]) r = view.region = "us";
    if (NOTE_REGIONS[r]) return data && data[r] ? r : "us";
    return r !== "us" && pro && pro[r] ? r : "us";
  }
  function P() { var r = curRegion(); return r === "us" || NOTE_REGIONS[r] ? pro : pro[r]; }
  function howScoredTxt(rg) {
    var since = rg.since.slice(0, 4);
    if (rg.mode === "asset") return t({ ko: "적중률 = 6개월 뒤 가격 방향(±" + rg.meta.thresh + "% 넘게 오르면 상승, 내리면 하락, 그 사이 보합)을 맞힌 비율 · " + since + "년 이후 매달 평가",
                                        en: "Hit rate = share of months that called the price direction six months out (beyond ±" + rg.meta.thresh + "% = rise or fall, else flat) · scored monthly since " + since });
    return t(rg.mode === "stance" ? UI.howScoredSt : UI.howScored, { since: since });
  }
  function stLike(rg) { return !!rg && (rg.mode === "stance" || rg.mode === "asset"); }
  function regionOf(key) {
    if (!pro) return null;
    var m = key && /^([a-z]{2})_/.exec(key);
    return m && FOLDER_REGIONS.indexOf(m[1]) >= 0 && pro[m[1]] ? pro[m[1]] : pro;
  }
  function findFolder(key) {
    var all = pro ? pro.folders.slice() : [];
    FOLDER_REGIONS.forEach(function (r) { if (pro && pro[r]) all = all.concat(pro[r].folders); });
    return all.filter(function (x) { return x.key === key; })[0];
  }
  function regionSwitch() {
    if (!pro) return "";
    var r = curRegion();
    var avail = REGIONS.filter(function (x) { return !ASSET_REGIONS[x[0]] && (x[0] === "us" || (NOTE_REGIONS[x[0]] ? data && data[x[0]] : pro[x[0]])); });
    if (avail.length < 2) return "";
    // 나라별 폴더 묶음: 평소에는 접어 두고, 펼치면 전체 카드, 누르면 그 나라 폴더로 들어간다
    var BANK = { us: { ko: "미국 연방준비제도", en: "Federal Reserve" }, kr: { ko: "한국은행", en: "Bank of Korea" },
                 sg: { ko: "싱가포르 통화청(MAS)", en: "Monetary Authority of Singapore" }, hk: { ko: "홍콩금융관리국", en: "HK Monetary Authority" },
                 cn: { ko: "중국인민은행", en: "People's Bank of China" } };
    var cur = avail.filter(function (x) { return x[0] === r; })[0] || avail[0];
    var card = function (x) {
      var k = x[0], rg = k === "us" ? pro : pro[k], note = !!NOTE_REGIONS[k], isA = !!ASSET_REGIONS[k];
      var bank = isA ? { ko: num(rg.ref_price, rg.meta.digits) + " " + rg.meta.unit.ko, en: num(rg.ref_price, rg.meta.digits) + " " + rg.meta.unit.en } : (rg && rg.bank) || BANK[k] || x[1];
      var foot = note
        ? '<span class="lab">' + t({ ko: "공식 대신 설명", en: "Explainer only" }) + "</span>"
        : chip(rg.ours.now.signal, isA ? "asset" : k === "sg") + '<span class="lab">' + t({ ko: "공식 " + rg.folders.length + "개", en: rg.folders.length + " formulas" }) + "</span>";
      return '<button type="button" class="folder' + (k === r ? " cur" : "") + '" data-region="' + k + '"' + (k === r ? ' aria-current="true"' : "") + ">" + FOLDER_ICON +
        '<span class="f-who">' + t(bank) + "</span>" + '<span class="f-name">' + t(x[1]) + "</span>" +
        '<span class="f-foot">' + foot + "</span></button>";
    };
    var ctry = avail.filter(function (x) { return !ASSET_REGIONS[x[0]]; }), assets = avail.filter(function (x) { return ASSET_REGIONS[x[0]]; });
    var cards = ctry.map(card).join("");
    return '<details class="rpick"><summary><span class="rp-cur">' + FOLDER_ICON +
      '<span><small>' + t({ ko: "지금 보는 폴더", en: "Viewing" }) + "</small><b>" + t(cur[1]) + "</b></span></span>" +
      '<span class="sum-lab"><span class="rp-show">' + t({ ko: "나라 폴더 " + avail.length + "개 펼치기", en: "Show all " + avail.length + " country folders" }) + "</span>" +
      '<span class="rp-hide">' + t({ ko: "접기", en: "Hide" }) + "</span></span></summary>" +
      '<div class="folders rp-grid">' + cards + "</div></details>";
  }
  // 홍콩: 연준을 그대로 따라가므로 공식 폴더가 의미 없다
  function hkProNote() {
    var h = data.hk, n = h.now;
    return '<p class="pro-note"><span class="pro-badge">PRO</span> ' + t(UI.proPreview) + " · " + t(UI.proIntro) + "</p>" + regionSwitch() +
      '<section class="card"><h2>' + t({ ko: "홍콩에는 경제학자 폴더가 없습니다", en: "No economist folders for Hong Kong" }) + "</h2>" +
      '<p class="lead-p">' + t({ ko: "홍콩은 금리를 스스로 정하지 않기 때문입니다. 홍콩달러를 미국달러에 묶어 두는 연계환율제(1달러 = 7.75~7.85홍콩달러)를 쓰고 있어, 기준금리가 연준 금리에 공식으로 연결돼 있습니다.",
        en: "Because Hong Kong doesn't set its own rates. Under the Linked Exchange Rate System (US$1 = HK$7.75–7.85), its base rate is tied to the Fed's rate by formula." }) + "</p>" +
      "<ul class=\"plain\">" +
      "<li>" + t({ ko: "기준금리 = 연준 목표범위 하단 + 0.5%p (은행 간 금리가 더 높으면 그쪽). 지금 " + num(n.fed_lower) + "% + 0.5%p = " + num(n.implied) + "%.",
        en: "Base rate = Fed target lower bound + 0.5pp (or HIBOR if higher). Now " + num(n.fed_lower) + "% + 0.5pp = " + num(n.implied) + "%." }) + "</li>" +
      (n.match != null ? "<li>" + t({ ko: "2008년 4월 이후 " + pct(n.match) + "의 달에서 실제 기준금리가 이 공식과 똑같았습니다.",
        en: "Since April 2008 the actual base rate matched this formula in " + pct(n.match) + " of months." }) + "</li>" : "") +
      "<li>" + t({ ko: "그래서 물가·고용으로 '적정 금리'를 계산하는 공식은 홍콩의 실제 결정을 설명하지 못합니다. 홍콩 금리 전망은 곧 연준 전망입니다.",
        en: "So formulas that derive a 'fair rate' from inflation and jobs can't explain Hong Kong's decisions. A Hong Kong rate outlook is a Fed outlook." }) + "</li></ul>" +
      '<div class="btn-row"><button type="button" class="refresh" data-region="us">' + t({ ko: "미국 연준 폴더 보기", en: "See the US Fed folders" }) + "</button>" +
      '<button type="button" class="refresh" data-tab="hk">' + t({ ko: "홍콩 탭 보기", en: "Open the Hong Kong tab" }) + "</button></div></section>" +
      "<footer><p>" + t(UI.disc1) + "</p></footer>";
  }

  function proOverview() {
    if (curRegion() === "hk") return hkProNote();
    if (curRegion() === "cn") return cnProNote();
    var p = P(), n = p.folders.length, o = p.ours, isKr = curRegion() === "kr";
    var holdWins = p.always_hold.score.hit != null && o.score.hit != null && p.always_hold.score.hit > o.score.hit;
    var stale = isKr && p.inflation_asof && p.rate_series.length && p.inflation_asof < p.rate_series[p.rate_series.length - 1][0];
    var rows = [
      [UI.ours, o.score, o.score_recent, true],
      [UI.simpleAvg, p.simple_avg.score, p.simple_avg.score_recent],
      [p.mode === "stance" ? { ko: "항상 '유지'", en: "Always 'hold'" } : UI.alwaysHold, p.always_hold.score, p.always_hold.score_recent],
    ].map(function (r) {
      return "<tr" + (r[3] ? ' class="em"' : "") + "><td>" + t(r[0]) + '</td><td class="n">' + pctOrDash(r[1].hit) + '</td><td class="n">' + pctOrDash(r[2].hit) + "</td></tr>";
    }).join("");
    var cards = p.folders.map(function (f) {
      return '<button type="button" class="folder" data-folder="' + esc(f.key) + '">' + FOLDER_ICON +
        '<span class="f-who">' + t(f.who) + (f.year ? " · " + f.year : "") + "</span>" +
        '<span class="f-name">' + t(f.name) + "</span>" +
        '<span class="f-foot">' + chip(f.now.signal) + '<span class="lab">' + t(UI.hitShort, { v: pctOrDash(f.score.hit) }) + "</span></span></button>";
    }).join("");
    return authBar() + '<p class="pro-note"><span class="pro-badge">PRO</span> ' + t(UI.proPreview) + " · " + t(UI.proIntro) + "</p>" + regionSwitch() +
      (holdWins ? '<p class="note warn">' + t(p.mode === "stance"
        ? { ko: "MAS는 대부분의 회의에서 '유지'를 택해서, 항상 '유지'라고 답하는 쪽(" + pct(p.always_hold.score.hit) + ")이 어떤 공식보다 많이 맞혔습니다. 공식은 '언제 움직일지'를 가늠하는 참고용으로 보세요.",
            en: "MAS holds at most meetings, so always answering 'hold' (" + pct(p.always_hold.score.hit) + ") beat every formula. Use the formulas as a guide to when it might move." }
        : { ko: "이 지역에서는 항상 '동결'이라고 답하는 쪽(" + pct(p.always_hold.score.hit) + ")이 우리 공식보다 많이 맞혔습니다. 공식은 '언제 움직일지'를 가늠하는 참고용으로 보세요.",
            en: "Here, always answering 'hold' (" + pct(p.always_hold.score.hit) + ") beat our formula. Use the formulas as a guide to when rates might move." }) + "</p>" : "") +
      (stale ? '<p class="note warn">' + t({ ko: "한국은행 ECOS 키가 아직 없어 물가 자료가 " + p.inflation_asof + "까지입니다. 그래서 '지금' 신호도 그 시점 기준입니다. 키를 넣으면 최신으로 바뀝니다.",
        en: "No Bank of Korea ECOS key yet, so inflation data stops at " + p.inflation_asof + " and the 'now' signals are as of then. Adding the key brings them up to date." }) + "</p>" : "") +
      '<section class="card ours"><div class="ours-top"><div><div class="eyebrow">' + t(UI.ours) + "</div>" +
      '<div class="ours-sig">' + chip(o.now.signal) + (sigGrade(p) ? sigGrade(p).html : "") + '<span class="ours-agree">' + t(UI.agree, { a: o.now.agree, n: o.now.total }) + "</span></div>" +
      (sigGrade(p) ? '<p class="note">' + sigGrade(p).why + "</p>" : "") +
      methodNote(p) +
      '<p class="sub">' + t(UI.oursSub, { n: n }) + "</p></div></div>" +
      '<div class="tbl"><table class="cmp"><thead><tr><th></th><th class="n">' + t(UI.colAll) + '</th><th class="n">' + t(UI.colRecent) + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<p class="note">' + howScoredTxt(p) + "<br>" + honestNote(p) + "</p>" + oursAbout(p) + "</section>" +
      '<section class="card"><h2>' + t(UI.folders) + '</h2><div class="folders">' + cards + "</div></section>" +
      (curRegion() === "us" ? analogHtml(pro.analogs) : "") +
      (isKr ? "" : commSection(p.comm)) +
      (curRegion() === "us" ? memberHtml(pro.members) : "") +
      "<footer><p>" + proDisc() + "</p><p>" + t(UI.disc1) + "</p></footer>";
  }

  // 연준 위원별 발언 성향 (fed_ai_v2.member_table) — tone: +는 인상(매파) 쪽
  function memberHtml(ms) {
    if (!ms || !ms.length) return "";
    var lab = function (v) {
      return v >= 0.5 ? { ko: "강한 매파", en: "Strongly hawkish" } : v >= 0.15 ? { ko: "매파", en: "Hawkish" } : v > -0.15 ? { ko: "중립", en: "Neutral" } :
        v > -0.5 ? { ko: "비둘기", en: "Dovish" } : { ko: "강한 비둘기", en: "Strongly dovish" };
    };
    var head = '<li class="comm-head"><span></span><div class="scale-lab"><span>' + t({ ko: "인하 쪽 (비둘기)", en: "Toward cuts (dove)" }) + "</span><span>" + t({ ko: "인상 쪽 (매파)", en: "Toward hikes (hawk)" }) + "</span></div></li>";
    var rows = ms.map(function (m) {
      var tn = (m.tone >= 0 ? "+" : "") + m.tone.toFixed(2), L = lab(m.tone);
      var last = m.last ? '<a href="' + esc(m.last.url) + '" target="_blank" rel="noopener">' + esc(m.last.title) + "</a>" : "";
      return '<li><div class="c-meta"><span class="c-kind">' + t(m.role) + "</span>" + esc(m.name) + " · " + t({ ko: "연설 " + m.n + "건", en: m.n + (m.n === 1 ? " speech" : " speeches") }) + "</div>" +
        '<div class="c-title">' + (m.last ? '<small class="m-last">' + t({ ko: "최근 ", en: "Latest " }) + esc(m.last.date) + "</small> " : "") + last + "</div>" +
        '<div class="c-tone">' + track(m.tone * 3, "톤 " + tn + " · " + L.ko, "Tone " + tn + " · " + L.en, true) + '<span class="lab">' + t(L) + "</span></div></li>";
    }).join("");
    return '<section class="card comm-card"><h2>' + t({ ko: "연준 위원별 발언 성향", en: "Where each Fed official leans" }) + '</h2><p class="sub">' +
      t({ ko: "최근 연설의 문장을 분석해 위원마다 금리 인상 쪽(매파)인지 인하 쪽(비둘기)인지 점수를 매겼습니다. 최근 연설일수록 크게 반영하고, 통화정책과 무관한 연설(감독·결제 등)은 뺐습니다. 위가 가장 매파적입니다.",
          en: "We score each official's recent speeches for leaning toward hikes (hawkish) or cuts (dovish), weighting recent ones more and skipping speeches not about monetary policy. Most hawkish first." }) + "</p>" +
      '<ul class="comm">' + head + rows + "</ul>" +
      '<p class="note">' + t({ ko: "연준 이사회(의장·부의장·이사)의 연설만 들어 있습니다. 지역 연은 총재 연설은 공식 피드에 없어 빠졌습니다. 단어 기반 자동 분석이라 미묘한 뉘앙스는 놓칠 수 있습니다.",
        en: "Board members only (Chair, Vice Chairs, Governors); regional Fed presidents aren't in the official feed. Word-based scoring can miss nuance." }) + "</p></section>";
  }

  // 지금과 가장 비슷했던 과거 (analogs.py)
  // PRO 전체: 세 폴더의 지금 신호를 한 화면에 (각 줄을 누르면 그 폴더로)
  // 신호 신뢰도: 최근 10년 '우리 공식' 적중률이 단순 기준(항상 동결/보합·항상 상승)보다 얼마나 나은지,
  // (자산·환율) 과거 같은 신호 뒤 실제로 그 방향으로 간 비율이 평소보다 높은지로 강함·보통·약함을 매긴다.
  function sigGrade(p) {
    if (!p || !p.ours || !p.ours.score_recent) return null;
    var hr = p.ours.score_recent.hit, bases = [p.always_hold, p.always_up].filter(Boolean).map(function (b) { return (b.score_recent || {}).hit; }).filter(function (v) { return v != null; });
    if (hr == null || !bases.length) return null;
    var edge = hr - Math.max.apply(null, bases), o = p.outlook, lift = null, n = null;
    if (o && o.same && o.all && o.signal != null) {
      var key = o.signal > 0 ? "up" : o.signal < 0 ? "down" : "flat";
      lift = o.same[key] - o.all[key]; n = o.same.n;
    }
    var lv = edge >= 0.05 && (lift == null || (lift >= 0.05 && n >= 30)) ? "strong" : (edge < 0 || (lift != null && (lift < 0 || n < 20))) ? "weak" : "mid";
    var L = { strong: { ko: "신뢰 높음", en: "Strong" }, mid: { ko: "신뢰 보통", en: "Moderate" }, weak: { ko: "참고용", en: "Weak" } }[lv];
    var whyP = { ko: "최근 10년 적중 " + pct(hr) + " (단순 기준보다 " + (edge >= 0 ? "+" : "") + Math.round(edge * 100) + "%p)" + (lift != null ? " · 같은 신호 뒤 그 방향 " + pct(o.same[o.signal > 0 ? "up" : o.signal < 0 ? "down" : "flat"]) + " (평소 " + pct(o.all[o.signal > 0 ? "up" : o.signal < 0 ? "down" : "flat"]) + ")" : ""),
                  en: "Last 10y hit " + pct(hr) + " (" + (edge >= 0 ? "+" : "") + Math.round(edge * 100) + "pp vs. naive)" + (lift != null ? " · went that way " + pct(o.same[o.signal > 0 ? "up" : o.signal < 0 ? "down" : "flat"]) + " after this signal (usually " + pct(o.all[o.signal > 0 ? "up" : o.signal < 0 ? "down" : "flat"]) + ")" : "") };
    var why = t(whyP);
    return { lv: lv, html: '<span class="grade g-' + lv + '"' + tipAttr(L.ko + " · " + whyP.ko, L.en + " · " + whyP.en) + ">" + t(L) + "</span>", why: why };
  }
  // 결합 방법(선택기): 매달 그때까지 가장 잘 맞힌 방법을 자동으로 고른다 (combine.py)
  function methodNote(p) {
    var m = p && p.ours && p.ours.method;
    if (!m) return "";
    return '<p class="note">' + t({ ko: "지금 결합 방법: " + m.name.ko + " — 매달, 최근 10년 동안 가장 잘 맞힌 방법(가중 투표·과반 동의·최고 공식·로지스틱 회귀·항상 보합 등)을 그때까지의 정보만으로 자동 선택합니다.",
      en: "Current method: " + m.name.en + " — each month we pick whichever approach (weighted vote, consensus, best formula, logistic regression, always flat…) did best over the past 10 years, using only information available then." }) + "</p>";
  }
  // 약한 신호는 한 단어 대신 과거 확률로
  function probLine(p) {
    var o = p.outlook;
    if (!o || !o.same) return "";
    return t({ ko: "상승 " + pct(o.same.up) + " · 보합 " + pct(o.same.flat) + " · 하락 " + pct(o.same.down), en: "Rise " + pct(o.same.up) + " · flat " + pct(o.same.flat) + " · fall " + pct(o.same.down) });
  }
  function proAllView() {
    var row = function (go, name, chipHtml, right, sub) {
      return '<button type="button" class="pa-row" data-go="' + go + '"><span class="pa-l"><span class="pa-nm">' + t(name) + "</span>" +
        (sub ? '<span class="pa-sub">' + sub + "</span>" : "") + '</span><span class="pa-r">' + chipHtml + (right ? '<span class="pa-k">' + right + "</span>" : "") +
        '<span class="mn-chev" aria-hidden="true">›</span></span></button>';
    };
    // 과거에 같은 신호가 나온 뒤 6개월 동안 실제로 그 방향으로 간 비율
    var dirProb = function (a) {
      var o = a.outlook, sg = a.ours.now.signal;
      if (!o || !o.same || sg == null) return "";
      var v = sg > 0 ? o.same.up : sg < 0 ? o.same.down : o.same.flat;
      return t({ ko: "그대로 간 비율 " + pct(v), en: pct(v) + " went that way" });
    };
    var hit = function (sc) { return sc && sc.hit != null ? t({ ko: "적중 " + pct(sc.hit), en: pct(sc.hit) + " hit" }) : ""; };
    // 1) 경제학자 신호 (나라별 '우리 공식')
    var regs = [["us", pro], ["kr", pro.kr], ["ea", pro.ea], ["jp", pro.jp], ["ch", pro.ch], ["sg", pro.sg]].filter(function (x) { return x[1] && x[1].ours && x[1].ours.now; });
    var nameOf = {}; REGIONS.forEach(function (x) { nameOf[x[0]] = x[1]; });
    var econ = regs.map(function (x) {
      var o = x[1].ours, n = o.now;
      var g = sigGrade(x[1]);
      return row("pro:" + x[0], nameOf[x[0]], '<span class="' + (g && g.lv === "weak" ? "dim" : "") + '">' + chip(n.signal, x[0] === "sg") + "</span>" + (g ? g.html : ""),
        "", t({ ko: n.total + "개 중 " + n.agree + "개 동의", en: n.agree + " of " + n.total + " agree" }) + " · " + hit(o.score_recent || o.score) + (n.asof ? " · " + esc(n.asof) : ""));
    }).join("");
    // 2) 자산 6개월 전망
    var assets = ["au", "ol", "sp"].filter(function (k) { return pro[k] && pro[k].ours; }).map(function (k) {
      var a = pro[k], g = sigGrade(a), weak = g && g.lv === "weak";
      return row("assets:" + k, a.meta.name, weak ? (g ? g.html : "") : chip(a.ours.now.signal, "asset") + (g ? g.html : ""),
        "", weak ? probLine(a) : dirProb(a) + " · " + hit(a.ours.score_recent || a.ours.score));
    }).join("");
    // 3) 환율 6개월 전망
    var fxs = FX_PAIRS.filter(function (k) { return pro[k] && pro[k].ours; }).map(function (k) {
      var a = pro[k], g = sigGrade(a), weak = g && g.lv === "weak";
      return row("fxpro:" + k, a.meta.name, weak ? (g ? g.html : "") : chip(a.ours.now.signal, "asset") + (g ? g.html : ""),
        "", weak ? probLine(a) : dirProb(a) + " · " + hit(a.ours.score_recent || a.ours.score));
    }).join("");
    // 4) 비슷했던 과거
    var an = pro.analogs, anH = "";
    if (an && an.top && an.top.length) {
      var av = an.top10_avg || {}, f = function (k, u) { var v = av[k] && av[k].mean; return v == null ? "–" : num(v, u === "%" ? 1 : 2, true) + (u === "%" ? "%" : "%p"); };
      anH = row("pro:us", { ko: "가장 비슷했던 때: " + an.top[0].month, en: "Closest match: " + an.top[0].month }, "", "",
        t({ ko: "비슷한 10개 시기의 " + an.horizon + "개월 뒤 평균 — 금리 " + f("rate", "p") + " · 금 " + f("gold", "%") + " · S&P " + f("spx", "%"),
            en: "Avg. " + an.horizon + " months after the 10 closest — rate " + f("rate", "p") + " · gold " + f("gold", "%") + " · S&P " + f("spx", "%") }));
    }
    // 5) 연준 위원 성향
    var ms = pro.members, mH = "";
    if (ms && ms.length) {
      var hk = ms[0], dv = ms[ms.length - 1], sg = function (v) { return (v >= 0 ? "+" : "") + v.toFixed(2); };
      mH = row("pro:us", { ko: "연준 위원 발언 성향", en: "Fed officials' leanings" }, "", "",
        t({ ko: "가장 매파 " + hk.name + " (" + sg(hk.tone) + ")" + (ms.length > 1 ? " · 가장 비둘기 " + dv.name + " (" + sg(dv.tone) + ")" : ""),
            en: "Most hawkish " + hk.name + " (" + sg(hk.tone) + ")" + (ms.length > 1 ? " · most dovish " + dv.name + " (" + sg(dv.tone) + ")" : "") }));
    }
    var card = function (title, sub, body) { return body ? '<section class="card"><h2>' + t(title) + '</h2>' + (sub ? '<p class="sub">' + t(sub) + "</p>" : "") + '<div class="pa-list">' + body + "</div></section>" : ""; };
    return card({ ko: "경제학자 신호", en: "Economist signals" }, { ko: "나라마다 유명 경제학자 금리 공식들을 합친 '우리 공식'이 지금 가리키는 방향입니다. 신뢰도는 최근 10년 적중률이 '항상 동결'처럼 단순한 방법보다 얼마나 나은지로 매깁니다.", en: "Where our blend of famous economists' rate formulas points now. Confidence = how much its last-10-year hit rate beats a naive call like 'always hold'." }, econ) +
      card({ ko: "자산 6개월 전망", en: "Assets: six-month outlook" }, { ko: "'그대로 간 비율'은 과거에 지금과 같은 신호가 나온 뒤 6개월 동안 실제로 그 방향이었던 비율입니다. '참고용' 신호는 한 방향 대신 과거 확률(상승·보합·하락)을 보여 줍니다.", en: "'Went that way' = share of past cases with today's signal that actually did that over six months. Weak signals show past odds (rise/flat/fall) instead of one call." }, assets) +
      card({ ko: "환율 6개월 전망", en: "Currencies: six-month outlook" }, { ko: "'상승'은 각 통화쌍 숫자가 오른다는 뜻입니다 (예: 원/달러 상승 = 원화 약세).", en: "'Rise' means the quoted number goes up (e.g. USD/KRW up = weaker won)." }, fxs) +
      card({ ko: "미국 참고", en: "US extras" }, null, anH + mH) +
      "<footer><p>" + proDisc() + "</p><p>" + t(UI.disc1) + "</p></footer>";
  }

  function analogHtml(a) {
    if (!a || !a.top || !a.top.length) return "";
    var pc = function (v, u) { return v == null ? "–" : num(v, u === "%" ? 1 : 2, true) + (u === "%" ? "%" : "%p"); };
    var fv = function (v, u) { return num(v, 2) + (u === "%" ? "%" : "%p"); };
    var OUT = [["rate", { ko: "정책금리", en: "Policy rate" }, "p"], ["pce", { ko: "근원 PCE 물가", en: "Core PCE" }, "p"], ["ur", { ko: "실업률", en: "Unemployment" }, "p"],
               ["krw", { ko: "원/달러", en: "USD/KRW" }, "%"], ["gold", { ko: "금", en: "Gold" }, "%"], ["spx", { ko: "S&P 500", en: "S&P 500" }, "%"]];
    var head = "<tr><th></th><th class='n'>" + t({ ko: "지금", en: "Now" }) + " <span class='lab'>" + esc(a.asof) + "</span></th>" +
      a.top.map(function (r, i) { return "<th class='n'>" + (i + 1) + ". " + esc(r.month) + "</th>"; }).join("") + "</tr>";
    var xrows = a.feats.map(function (f) {
      return "<tr><td>" + t(f.name) + "</td><td class='n'><b>" + fv(a.now[f.key], f.unit) + "</b></td>" + a.top.map(function (r) { return "<td class='n'>" + fv(r.x[f.key], f.unit) + "</td>"; }).join("") + "</tr>";
    }).join("");
    var orows = OUT.map(function (o) {
      var av = a.top10_avg[o[0]];
      return "<tr><td>" + t(o[1]) + "</td><td class='n'>" + (av && av.mean != null ? "<b>" + pc(av.mean, o[2] === "%" ? "%" : "p") + "</b> <span class='lab'>" + t({ ko: "상승 " + pct(av.up), en: "up " + pct(av.up) }) + "</span>" : "–") + "</td>" +
        a.top.map(function (r) { return "<td class='n'>" + pc(r.after[o[0]], o[2] === "%" ? "%" : "p") + "</td>"; }).join("") + "</tr>";
    }).join("");
    return '<section class="card"><h2>' + t({ ko: "지금과 가장 비슷했던 과거", en: "Closest past periods" }) + "</h2>" +
      '<p class="sub">' + t({ ko: a.since.slice(0, 4) + "년 이후 미국의 물가·고용·금리 조합이 지금(" + a.asof + ")과 가장 가까웠던 달들입니다. 아래 표는 그 뒤 " + a.horizon + "개월 동안 어떻게 됐는지입니다.",
        en: "Months since " + a.since.slice(0, 4) + " when the US mix of inflation, jobs and rates looked most like now (" + a.asof + "), and what happened over the next " + a.horizon + " months." }) + "</p>" +
      '<div class="tbl"><table class="cmp"><thead>' + head + "</thead><tbody>" + xrows + "</tbody></table></div>" +
      '<h3 class="cal-h3">' + t({ ko: a.horizon + "개월 뒤 변화", en: "Change over the next " + a.horizon + " months" }) + "</h3>" +
      '<div class="tbl"><table class="cmp"><thead><tr><th></th><th class="n">' + t({ ko: "비슷한 10개 시기 평균", en: "Avg of 10 closest" }) + "</th>" +
      a.top.map(function (r, i) { return "<th class='n'>" + (i + 1) + ". " + esc(r.month) + "</th>"; }).join("") + "</tr></thead><tbody>" + orows + "</tbody></table></div>" +
      '<p class="note">' + t({ ko: "물가·물가 변화·실업률·실업률 변화·금리·금리 변화 6가지를 같은 무게로 비교했습니다. 비슷한 출발점에서도 결과는 크게 갈렸습니다(예: 경기침체가 왔는지에 따라). 앞날을 맞히는 공식이 아니라 '이런 경우도 있었다'를 보여 주는 참고 자료입니다. 원/달러는 1981년 이후만 있습니다.",
        en: "Six inputs weighted equally: inflation and its change, unemployment and its change, the policy rate and its change. Similar starting points led to very different outcomes (e.g., whether a recession followed). This shows what has happened before, not a forecast. USD/KRW starts in 1981." }) + "</p></section>";
  }

  // 공식 vs 실제 금리 선 그래프. opts.big = 크게 보기 창, opts.years = 최근 N년만 (0 = 전체)
  var ZOOM_YEARS = [0, 20, 10, 5];
  function lineChart(f, opts) {
    opts = opts || {};
    var W = opts.W || 720, H = opts.H || 280, L = 40, R = 10, T = 12, B = 26, FLOOR = -4;
    var actual = {}, rg = regionOf(f.key), st = !opts.actual && stLike(rg);
    (opts.actual || rg.rate_series).forEach(function (p) { actual[p[0]] = p[1]; });
    var aName = opts.actualName || (st ? (rg.mode === "asset" ? { ko: "6개월 뒤 실제 방향", en: "Actual direction 6 months on" } : { ko: "6개월 안 실제 MAS 방향", en: "Actual MAS move within 6 months" }) : UI.actual),
        dName = opts.diffName || { ko: "공식 − 실제", en: "Formula − actual" };
    var pts = f.series.filter(function (p) { return actual[p[0]] != null; });
    var nfull = pts.length, wi = null;
    if (opts.big) {  // 크게 보기: 확대 창(win) 또는 '최근 N년'
      wi = opts.win ? opts.win.slice() : opts.years ? [Math.max(0, nfull - opts.years * 12 - 1), nfull - 1] : [0, nfull - 1];
      wi[1] = Math.min(nfull - 1, wi[1]); wi[0] = Math.max(0, Math.min(wi[1] - 1, wi[0]));
      pts = pts.slice(wi[0], wi[1] + 1);
    } else if (opts.years) pts = pts.slice(-opts.years * 12);
    if (pts.length < 2) return "";
    var vals = [];
    pts.forEach(function (p) { vals.push(p[1], actual[p[0]]); });
    // 2020년 같은 극단값(예: −19%)이 차트를 납작하게 만들지 않도록 −4%에서 잘라 그린다 (읽기 값은 실제 값)
    var minV = Math.min.apply(null, vals), clipped = !st && minV < FLOOR;
    var lo = Math.max(FLOOR, Math.min(0, 2 * Math.floor(minV / 2))), hi = 2 * Math.ceil(Math.max.apply(null, vals) / 2);
    if (hi - lo < 4) hi = lo + 4;
    var ystep = 2, unit = "%";
    if (st) { lo = -3; hi = 3; ystep = 1; unit = ""; clipped = minV < lo || Math.max.apply(null, vals) > hi; }
    var span = pts.length / 12, every = span > 25 ? 5 : span > 12 ? 2 : 1;
    function X(i) { return L + (i / (pts.length - 1)) * (W - L - R); }
    function Y(v) { return T + (1 - (Math.min(Math.max(v, lo), hi) - lo) / (hi - lo)) * (H - T - B); }
    var grid = "", yt = "", xt = "";
    for (var v = lo; v <= hi; v += ystep) {
      grid += '<line class="g" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/>';
      yt += '<text class="ax" x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + (v > 0 && st ? "+" : "") + v + unit + "</text>";
    }
    if (st) [0.5, -0.5].forEach(function (b) {
      grid += '<line class="g band" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(b).toFixed(1) + '" y2="' + Y(b).toFixed(1) + '"/>';
    });
    var shortSpan = pts.length <= 30;  // 확대해서 2년 남짓이면 분기마다 '연.월'로 표시
    pts.forEach(function (p, i) {
      var yr = +p[0].slice(0, 4), mo = p[0].slice(5, 7);
      if (X(i) <= L + 14 || X(i) >= W - R - 14) return;
      if (shortSpan ? ["01", "04", "07", "10"].indexOf(mo) >= 0 : (mo === "01" && yr % every === 0))
        xt += '<text class="ax" x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + (shortSpan ? p[0].slice(2, 7).replace("-", ".") : yr) + "</text>";
    });
    function path(get) {
      return pts.map(function (p, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(get(p)).toFixed(1); }).join("");
    }
    var c = { k: f.key, x: pts.map(function (p) { return p[0]; }), a: pts.map(function (p) { return actual[p[0]]; }),
              f: pts.map(function (p) { return p[1]; }), L: L, R: R, W: W, T: T, B: B, H: H, lo: lo, hi: hi,
              nk: f.name.ko, ne: f.name.en, ak: aName.ko, ae: aName.en, dk: dName.ko, de: dName.en };
    if (st) { c.mode = "stance"; c.labs = rg.mode === "asset" ? "as" : "st"; }
    if (wi) { c.wi = wi; c.nf = nfull; }
    var n = pts.length;
    var expand = opts.big ? "" : '<button type="button" class="expand" data-zoom="' + esc(f.key) + '">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9"/></svg>' +
      t({ ko: "크게 보기", en: "Enlarge" }) + "</button>";
    var zbtn = function (k, label, title) { return '<button type="button" class="pxz" data-lzz="' + k + '" title="' + title + '" aria-label="' + title + '">' + label + "</button>"; };
    if (opts.big) expand = '<span class="pxzs">' + zbtn("in", "＋", "Zoom in") + zbtn("out", "－", "Zoom out") + (opts.win ? zbtn("reset", "⟲", "Reset") : "") + "</span>";
    var periods = !opts.big ? "" : '<div class="periods" role="group">' + ZOOM_YEARS.map(function (y) {
      return '<button type="button" data-years="' + y + '" aria-pressed="' + (!opts.win && (opts.years || 0) === y) + '">' +
        t(y ? { ko: "최근 " + y + "년", en: "Last " + y + "y" } : { ko: "전체", en: "All" }) + "</button>";
    }).join("") + "</div>";
    return '<div class="chart' + (opts.big ? " big" : "") + '" data-chart="' + esc(JSON.stringify(c)) + '">' +
      '<div class="chart-top"><div class="legend"><span><i class="lk actual"></i>' + t(aName) + "</span><span><i class=\"lk rule\"></i>" + t(f.name) + "</span></div>" + expand + "</div>" +
      periods +
      '<div class="readout" aria-live="polite"></div>' +
      '<svg class="plot" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(f.name.en) + '"' + (opts.big ? ' tabindex="0"' : "") + ">" + grid + yt + xt +
      '<line class="zero" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '"/>' +
      '<path class="l-actual" d="' + path(function (p) { return actual[p[0]]; }) + '"/>' +
      '<path class="l-rule" d="' + path(function (p) { return p[1]; }) + '"/>' +
      '<line class="xh" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '"/>' +
      '<circle class="d-actual" r="4.5" cx="0" cy="0"/><circle class="d-rule" r="4.5" cx="0" cy="0"/>' +
      '<rect class="hit" x="0" y="0" width="' + W + '" height="' + H + '"/></svg>' +
      (opts.big ? '<input type="range" class="cursor-range" id="cursor-range" min="0" max="' + (n - 1) + '" value="' + (n - 1) + '" step="1" aria-label="' + esc(t({ ko: "시점", en: "Date" }).replace(/<[^>]+>/g, " ")) + '">' +
        '<p class="hint">' + t({ ko: "그래프를 누른 채 좌우로 끌거나, 아래 막대를 움직이거나, ← → 키로 한 달씩 이동하세요 (Shift는 1년).",
                                en: "Drag across the chart, move the slider, or use ← → to step a month (Shift for a year)." }) + "</p>"
        : '<p class="hint">' + t({ ko: "그래프에 마우스를 올리면 시점별 값이 보입니다. 누르면 크게 볼 수 있습니다.",
                                   en: "Hover to read any month. Click to enlarge." }) + "</p>") +
      (clipped ? '<p class="note">' + t(st ? { ko: "±3을 넘는 값은 잘라서 표시했습니다 (위 숫자는 실제 값).", en: "Values beyond ±3 are clipped (the readout shows the actual value)." }
                                            : { ko: "−4% 아래 값은 잘라서 표시했습니다 (위 숫자는 실제 값).", en: "Values below −4% are clipped (the readout shows the actual value)." }) + "</p>" : "") + "</div>";
  }

  // 핵심 지표 12개월 그래프 (크게 보기 창 전용)
  function niceStep(range) {
    var raw = range / 4, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  function indChart(r, opts) {
    var W = opts.W, H = opts.H, L = 52, R = 28, T = 14, B = 28;
    var pts = r.hist.filter(function (p) { return p[1] != null; });
    var vals = pts.map(function (p) { return p[1]; });
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = (mx - mn) || Math.abs(mx) || 1;
    // 평소 평균(1995~2019)이 너무 멀지 않으면 기준선으로 함께 그린다
    var bm = r.bench_mean, showBm = bm != null && bm >= mn - rg && bm <= mx + rg;
    if (showBm) { mn = Math.min(mn, bm); mx = Math.max(mx, bm); }
    var step = niceStep((mx - mn) || rg), lo = Math.floor(mn / step - 0.25) * step, hi = Math.ceil(mx / step + 0.25) * step;
    var dec = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
    function X(i) { return L + (i / (pts.length - 1)) * (W - L - R); }
    function Y(v) { return T + (1 - (v - lo) / (hi - lo)) * (H - T - B); }
    var grid = "", yt = "", xt = "";
    for (var v = lo; v <= hi + step / 2; v += step) {
      grid += '<line class="g" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/>';
      yt += '<text class="ax" x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + num(v, dec) + "</text>";
    }
    var every = (W - L - R) / pts.length < 34 ? 2 : 1;
    pts.forEach(function (p, i) {
      if ((pts.length - 1 - i) % every) return;
      xt += '<text class="ax" x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + p[0].slice(2, 4) + "." + p[0].slice(5) + "</text>";
    });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join("");
    var area = line + "L" + X(pts.length - 1).toFixed(1) + " " + (H - B) + "L" + L + " " + (H - B) + "Z";
    var c = { mode: "ind", x: pts.map(function (p) { return p[0]; }), a: vals, L: L, R: R, W: W, T: T, B: B, H: H, lo: lo, hi: hi,
              bm: bm, uk: r.unit.ko, ue: r.unit.en };
    var n = pts.length;
    return '<div class="chart big ind" data-chart="' + esc(JSON.stringify(c)) + '">' +
      '<div class="chart-top"><div class="legend"><span><i class="lk rule"></i>' + t(r.bench_label ? r.name : (SHORT[r.key] || r.name)) + " (" + t(r.unit) + ")</span>" +
      (showBm ? '<span><i class="lk bench"></i>' + t(r.bench_label || { ko: "평소 평균 (1995~2019)", en: "Normal (1995–2019 avg)" }) + "</span>" : "") + "</div></div>" +
      '<div class="readout" aria-live="polite"></div>' +
      '<svg class="plot" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(r.name.en) + '" tabindex="0">' + grid + yt + xt +
      '<path class="ind-area" d="' + area + '"/>' +
      (showBm ? '<line class="bench" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(bm).toFixed(1) + '" y2="' + Y(bm).toFixed(1) + '"/>' : "") +
      '<path class="l-rule" d="' + line + '"/>' +
      pts.map(function (p, i) { return '<circle class="pt" r="3" cx="' + X(i).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '"/>'; }).join("") +
      '<line class="xh" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '"/>' +
      '<circle class="d-rule" r="5.5" cx="0" cy="0"/>' +
      '<rect class="hit" x="0" y="0" width="' + W + '" height="' + H + '"/></svg>' +
      '<input type="range" class="cursor-range" id="cursor-range" min="0" max="' + (n - 1) + '" value="' + (n - 1) + '" step="1" aria-label="Date">' +
      '<p class="hint">' + t({ ko: "그래프를 누르거나 끌어서, 또는 아래 막대나 ← → 키로 달을 옮겨 보세요.", en: "Tap or drag the chart, move the slider, or use ← → to change the month." }) + "</p>" +
      (r.note ? '<p class="note">' + t(r.note) + "</p>" : "") + "</div>";
  }

  // 그래프 읽기: 커서를 i번째 달로 옮기고 위 숫자 칸을 갱신
  function chartData(box) {
    if (!box._c) box._c = JSON.parse(box.getAttribute("data-chart"));
    return box._c;
  }
  function setCursor(box, i) {
    var c = chartData(box), n = c.x.length;
    i = Math.max(0, Math.min(n - 1, i));
    box._i = i;
    var X = c.L + (i / (n - 1)) * (c.W - c.L - c.R);
    function Y(v) { return c.T + (1 - (Math.min(Math.max(v, c.lo), c.hi) - c.lo) / (c.hi - c.lo)) * (c.H - c.T - c.B); }
    var svg = box.querySelector("svg.plot");
    var xh = svg.querySelector(".xh");
    xh.setAttribute("x1", X); xh.setAttribute("x2", X);
    function cell(lab, val, cls) {
      return '<span class="ro' + (cls ? " " + cls : "") + '"><small>' + lab + "</small><b>" + val + "</b></span>";
    }
    var lang = root.lang, pk = function (ko, en) { return lang === "ko" ? ko : trx(lang, en); };
    var vs = function (x) { return fill(word({ ko: "{x} 대비", en: "vs. {x}" }, lang), { x: x }); };
    if (c.mode === "ind") {
      var dot = svg.querySelector(".d-rule");
      dot.setAttribute("cx", X); dot.setAttribute("cy", Y(c.a[i]));
      var u = pk(c.uk, c.ue);
      if (c.raw) {  // 자산 가격 그래프: 실제 값과 % 변화
        var rv = c.raw, pc = function (a, b) { return b ? num((a / b - 1) * 100, 2, true) + "%" : "–"; };
        box.querySelector(".readout").innerHTML =
          cell(pk("시점", "Date"), c.x[i]) +
          cell(pk(c.vlk || "가격", c.vle || "Price"), num(rv[i], c.dg) + ' <span class="u">' + esc(u) + "</span>") +
          cell(pk(c.pk, c.pe), i > 0 ? pc(rv[i], rv[i - 1]) : "–") +
          cell(vs(c.x[0]), pc(rv[i], rv[0]));
        var rr = box.querySelector(".cursor-range");
        if (rr && +rr.value !== i) rr.value = i;
        return;
      }
      box.querySelector(".readout").innerHTML =
        cell(pk("시점", "Month"), c.x[i]) +
        cell(pk("값", "Value"), num(c.a[i]) + ' <span class="u">' + esc(u) + "</span>") +
        cell(pk("전월 대비", "vs. prior month"), i > 0 ? num(c.a[i] - c.a[i - 1], 2, true) : "–") +
        cell(vs(c.x[0]), num(c.a[i] - c.a[0], 2, true));
      var rg0 = box.querySelector(".cursor-range");
      if (rg0 && +rg0.value !== i) rg0.value = i;
      return;
    }
    var da = svg.querySelector(".d-actual"), dr = svg.querySelector(".d-rule");
    da.setAttribute("cx", X); da.setAttribute("cy", Y(c.a[i]));
    dr.setAttribute("cx", X); dr.setAttribute("cy", Y(c.f[i]));
    if (c.mode === "stance") {
      var LS = c.labs === "as" ? SIG_AS : SIG_ST, L2 = {}; ["1", "0", "-1"].forEach(function (k) { L2[k] = pk(LS.ko[k], LS.en[k]); }); var  fs = c.f[i] > 0.5 ? 1 : c.f[i] < -0.5 ? -1 : 0;
      box.querySelector(".readout").innerHTML =
        cell(pk("시점", "Month"), c.x[i]) +
        cell('<i class="lk rule"></i>' + esc(pk(c.nk, c.ne)), num(c.f[i], 2, true)) +
        cell(pk("신호", "Signal"), L2[String(fs)]) +
        cell('<i class="lk actual"></i>' + esc(pk(c.ak, c.ae)), L2[String(c.a[i])]);
      var rgS = box.querySelector(".cursor-range");
      if (rgS && +rgS.value !== i) rgS.value = i;
      return;
    }
    var gap = c.f[i] - c.a[i];
    var sign = gap > 0 ? "+" : gap < 0 ? "−" : "";
    box.querySelector(".readout").innerHTML =
      cell(pk("시점", "Month"), c.x[i]) +
      cell('<i class="lk actual"></i>' + esc(pk(c.ak, c.ae)), c.a[i].toFixed(2) + "%") +
      cell('<i class="lk rule"></i>' + esc(pk(c.nk, c.ne)), c.f[i].toFixed(2) + "%") +
      cell(pk(c.dk, c.de), sign + Math.abs(gap).toFixed(2) + "%p");
    var rg = box.querySelector(".cursor-range");
    if (rg && +rg.value !== i) rg.value = i;
  }
  function indexAt(box, clientX) {
    var c = chartData(box), r = box.querySelector("svg.plot").getBoundingClientRect();
    var sx = (clientX - r.left) * (c.W / r.width);
    return Math.round(((sx - c.L) / (c.W - c.L - c.R)) * (c.x.length - 1));
  }
  function initCharts(scope) {
    (scope || document).querySelectorAll(".chart").forEach(function (box) {
      box._c = null;
      var c = chartData(box);
      var keep = box._i != null ? box._i : c.x.length - 1;
      setCursor(box, keep);
    });
  }

  // 크게 보기 창
  var zoomEl = null, zoomState = null, zoomReturn = null;
  function openZoom(key, years, win, anchor) {
    var sp = chartSpec(key);
    if (!sp) return;
    var f = sp.f;
    var prevDate = anchor || null;
    if (zoomEl && zoomState && zoomState.key === key) {
      var ob = zoomEl.querySelector(".chart");
      if (!prevDate && ob && ob._i != null) prevDate = chartData(ob).x[ob._i];
    }
    var zo = zoomSize(years || 0);
    zo.actual = sp.actual; zo.actualName = sp.actualName; zo.diffName = sp.diffName; zo.win = win || null;
    showZoom({ key: key, years: years || 0, win: win || null }, t(sp.eyebrow), t(sp.title), lineChart(f, zo), prevDate);
  }
  // 그래프 키 → 그릴 내용 (경제학자 폴더 또는 한국 탭)
  function chartSpec(key) {
    if (key.indexOf("kr-") === 0) {
      var k = data && data.korea;
      if (!k) return null;
      var base = { ko: "한국 기준금리", en: "BOK base rate" };
      if (k.now.base_is_call) base = { ko: "한국 콜금리", en: "Korea call rate" };
      if (key === "kr-taylor") return { f: { key: key, name: { ko: "테일러 준칙 (한국)", en: "Taylor rule (Korea)" }, series: k.series.taylor },
        actual: k.series.base, actualName: base, eyebrow: { ko: "한국", en: "Korea" }, title: { ko: "기준금리 vs 테일러 준칙", en: "Base rate vs. Taylor rule" } };
      if (key === "kr-us") return { f: { key: key, name: { ko: "미국 기준금리", en: "US policy rate" }, series: k.series.us },
        actual: k.series.base, actualName: base, diffName: { ko: "미국 − 한국", en: "US − Korea" },
        eyebrow: { ko: "한국", en: "Korea" }, title: { ko: "한미 기준금리", en: "Korea vs. US policy rates" } };
      return null;
    }
    var cm = /^(ea|ch|jp|cn)-(taylor|us)$/.exec(key);
    if (cm && data && data[cm[1]]) {
      var q = data[cm[1]], me = q.meta;
      if (cm[2] === "taylor") return { f: { key: key, name: { ko: "테일러 준칙 (" + me.country.ko + ")", en: "Taylor rule (" + me.country.en + ")" }, series: q.series.taylor },
        actual: q.series.base, actualName: me.rate, eyebrow: me.country, title: { ko: "정책금리 vs 테일러 준칙", en: "Policy rate vs. Taylor rule" } };
      return { f: { key: key, name: { ko: "미국 기준금리", en: "US policy rate" }, series: q.series.us },
        actual: q.series.base, actualName: me.rate, diffName: { ko: "미국 − " + me.country.ko, en: "US − " + me.country.en },
        eyebrow: me.country, title: { ko: me.country.ko + "·미국 정책금리", en: me.country.en + " vs. US policy rates" } };
    }
    if (key.indexOf("hk-") === 0 && data && data.hk) {
      var h = data.hk, hkb = { ko: "홍콩 기준금리", en: "HK base rate" }, hke = { ko: "홍콩", en: "Hong Kong" };
      if (key === "hk-base") return { f: { key: key, name: { ko: "연준 공식값 (하단 + 0.5%p)", en: "Fed formula (lower bound + 0.5pp)" }, series: h.series.implied },
        actual: h.series.base, actualName: hkb, diffName: { ko: "공식 − 실제", en: "Formula − actual" }, eyebrow: hke, title: { ko: "홍콩 기준금리 vs 연준 공식값", en: "HK base rate vs. Fed formula" } };
      if (key === "hk-hibor") return { f: { key: key, name: { ko: "미국 기준금리", en: "US policy rate" }, series: h.series.us },
        actual: h.series.hibor1m, actualName: { ko: "HIBOR 1개월", en: "1-month HIBOR" }, diffName: { ko: "미국 − HIBOR", en: "US − HIBOR" },
        eyebrow: hke, title: { ko: "HIBOR vs 미국 기준금리", en: "HIBOR vs. US policy rate" } };
      return null;
    }
    if (key.indexOf("sg-") === 0 && data && data.sg) {
      var g = data.sg, sge = { ko: "싱가포르", en: "Singapore" };
      if (key === "sg-core") return { f: { key: key, name: { ko: "MAS 근원물가", en: "MAS core inflation" }, series: g.series.core },
        actual: g.series.ref, actualName: { ko: "기준 2%", en: "2% reference" }, diffName: { ko: "근원물가 − 2%", en: "Core − 2%" },
        eyebrow: sge, title: { ko: "MAS 근원물가 vs 기준 2%", en: "MAS core inflation vs. 2%" } };
      if (key === "sg-rates") return { f: { key: key, name: { ko: "미국 기준금리", en: "US policy rate" }, series: g.series.us },
        actual: g.series.tbill1y, actualName: { ko: "싱가포르 1년 단기채", en: "SGS 1-yr T-bill" }, diffName: { ko: "미국 − 싱가포르", en: "US − Singapore" },
        eyebrow: sge, title: { ko: "싱가포르 금리 vs 미국 기준금리", en: "Singapore vs. US rates" } };
      return null;
    }
    var f = pro && findFolder(key);
    var ct = f && regionOf(f.key).mode === "asset" ? { ko: "신호 vs 실제 가격 방향", en: "Signal vs. actual price direction" } : f && regionOf(f.key).mode === "stance" ? UI.chartTSt : UI.chartT;
    return f ? { f: f, eyebrow: f.who, title: { ko: ct.ko + " · " + f.name.ko, en: ct.en + " · " + f.name.en } } : null;
  }
  function openIndZoom(key) {
    var r = null;
    var pm = /^(kr|hk|sg|ea|ch|jp|cn):/.exec(key), src = pm && data ? data[pm[1] === "kr" ? "korea" : pm[1]] : null;
    if (pm) {
      (src ? src.tiles : []).forEach(function (x) { if (pm[1] + ":" + x.key === key) r = x; });
    } else {
      data && data.groups.forEach(function (g) { g.rows.forEach(function (x) { if (x.key === key) r = x; }); });
    }
    if (!r || !r.hist) return;
    var sz = zoomSize(0);
    var ZE = { kr: { ko: "한국 · 최근 12개월", en: "Korea · last 12 months" }, hk: { ko: "홍콩 · 최근 12개월", en: "Hong Kong · last 12 months" },
               sg: { ko: "싱가포르 · 최근 12개월", en: "Singapore · last 12 months" } };
    if (pm && !ZE[pm[1]] && src) ZE[pm[1]] = { ko: src.meta.country.ko + " · 최근 12개월", en: src.meta.country.en + " · last 12 months" };
    showZoom({ ind: key }, t(pm ? ZE[pm[1]] : { ko: "핵심 지표 · 최근 12개월", en: "Key indicator · last 12 months" }), t(r.name),
      indChart(r, { W: sz.W, H: Math.min(sz.H, 420) }), null);
  }
  function showZoom(state, eyebrow, title, chartHtml, prevDate) {
    if (!zoomEl) {
      zoomEl = document.createElement("div");
      zoomEl.className = "zoom";
      zoomEl.setAttribute("role", "dialog");
      zoomEl.setAttribute("aria-modal", "true");
      document.body.appendChild(zoomEl);
      zoomEl.addEventListener("click", zoomClick);
      zoomEl.addEventListener("input", function (e) {
        if (e.target.classList.contains("cursor-range")) setCursor(e.target.closest(".chart"), +e.target.value);
      });
    }
    if (!zoomState) zoomReturn = document.activeElement;
    zoomState = state;
    zoomEl.innerHTML = '<div class="zoom-panel"><div class="zoom-head"><div><div class="eyebrow">' + eyebrow + "</div><h2>" + title + "</h2></div>" +
      '<button type="button" class="zoom-close" data-zoom-close aria-label="Close">' + t({ ko: "닫기", en: "Close" }) + " ✕</button></div>" +
      chartHtml + "</div>";
    zoomEl.hidden = false;
    document.documentElement.classList.add("zoom-open");
    var box = zoomEl.querySelector(".chart");
    initCharts(zoomEl);
    if (prevDate) { var j = chartData(box).x.indexOf(prevDate); if (j >= 0) setCursor(box, j); }
    var svg = box.querySelector("svg.plot");
    if (state.px) {  // 가격·환율 그래프 크게 보기
      attachZoom(box, function (w, anc) { openPxZoom(state.px, w, anc); }, function () { openPxZoom(state.px); });
    } else if (chartData(box).wi && state.key) {  // 선 그래프: 휠·핀치 확대, 끌어서 이동
      attachZoom(box, function (w, anc) { openZoom(state.key, state.years, w, anc); }, function () { openZoom(state.key, state.years); });
    } else {
      bindDrag(box);
    }
    svg.focus({ preventScroll: true });
  }
  // 창 크기에 맞춰 그래프 좌표계를 정한다 (글자 크기가 그대로 유지되고 슬라이더까지 한 화면에 들어오도록)
  function zoomSize(years) {
    var w = Math.min(1100, innerWidth) - (innerWidth <= 640 ? 32 : 76);
    var h = Math.max(220, Math.min(560, innerHeight - (innerWidth <= 640 ? 330 : 360)));
    return { big: true, years: years, W: Math.max(300, Math.round(w)), H: Math.round(h) };
  }
  addEventListener("resize", function () {
    if (!zoomState || !zoomEl || zoomEl.hidden) return;
    if (zoomState.ind) openIndZoom(zoomState.ind); else openZoom(zoomState.key, zoomState.years);
  });
  function closeZoom() {
    if (!zoomEl || zoomEl.hidden) return;
    zoomEl.hidden = true; zoomState = null;
    document.documentElement.classList.remove("zoom-open");
    if (zoomReturn && zoomReturn.focus) zoomReturn.focus({ preventScroll: true });
  }
  function zoomClick(e) {
    if (e.target === zoomEl || e.target.closest("[data-zoom-close]")) { closeZoom(); return; }
    var yb = e.target.closest("[data-years]");
    if (yb) { openZoom(zoomState.key, +yb.dataset.years); return; }
    var pp = e.target.closest("[data-pxper]");
    if (pp && zoomState && zoomState.px) { zoomState.per = pp.dataset.pxper; openPxZoom(zoomState.px); return; }
    var pz = e.target.closest("[data-pxz]");
    if (pz && zoomState && zoomState.px) {
      var pbox = zoomEl.querySelector(".chart");
      if (pz.dataset.pxz === "reset") openPxZoom(zoomState.px);
      else zoomBy(pbox, pz.dataset.pxz === "in" ? 0.6 : 1.6, pbox._i, function (w, anc) { openPxZoom(zoomState.px, w, anc); });
      return;
    }
    var lz = e.target.closest("[data-lzz]");
    if (lz && zoomState && zoomState.key) {
      var lbox = zoomEl.querySelector(".chart"), k = lz.dataset.lzz;
      if (k === "reset") openZoom(zoomState.key, zoomState.years);
      else zoomBy(lbox, k === "in" ? 0.6 : 1.6, lbox._i, function (w, anc) { openZoom(zoomState.key, zoomState.years, w, anc); });
    }
  }
  function bindDrag(box) {
    var svg = box.querySelector("svg.plot"), dragging = false;
    svg.addEventListener("pointerdown", function (e) {
      dragging = true;
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      setCursor(box, indexAt(box, e.clientX));
      e.preventDefault();
    });
    svg.addEventListener("pointermove", function (e) {
      if (dragging || e.pointerType === "mouse") setCursor(box, indexAt(box, e.clientX));
    });
    function stop() { dragging = false; }
    svg.addEventListener("pointerup", stop);
    svg.addEventListener("pointercancel", stop);
    svg.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 12 : 1;
      if (e.key === "ArrowLeft") { setCursor(box, box._i - step); e.preventDefault(); }
      else if (e.key === "ArrowRight") { setCursor(box, box._i + step); e.preventDefault(); }
      else if (e.key === "Home") { setCursor(box, 0); e.preventDefault(); }
      else if (e.key === "End") { setCursor(box, 1e9); e.preventDefault(); }
    });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeZoom(); openMenu(false); } });
  var menuOpen = null;
  function openMenu(on, id) {
    if (!on) id = menuOpen;
    var sh = id && document.getElementById(id), btn = app.querySelector(id === "mn-pro" ? "[data-menu-pro]" : "[data-menu]");
    if (!sh) return;
    sh.hidden = !on;
    menuOpen = on ? id : null;
    document.documentElement.classList.toggle("mn-open", on);
    if (btn) btn.setAttribute("aria-expanded", String(on));
    if (on) { var c = sh.querySelector(".mn-item.cur") || sh.querySelector(".mn-x"); if (c) c.focus(); } else if (btn) btn.focus();
  }

  function aboutBlock(f) {
    var rg = regionOf(f.key), since = rg.since.slice(0, 4);
    var ab = f.about || {}, s = f.score, r = f.score_recent, hold = rg.always_hold.score.hit;
    var record = rg.mode === "asset" ? {
      ko: since + "년 이후 매달 6개월 뒤 가격 방향(±" + rg.meta.thresh + "% 기준)을 " + pctOrDash(s.hit) + " 맞혔습니다 (항상 '상승'이라고 답하면 " + pctOrDash(rg.always_up.score.hit) + "). " +
          "최근 10년 적중률은 " + pctOrDash(r.hit) + "이고, '상승·하락' 신호를 낸 " + s.move_n + "번 중 " + pctOrDash(s.move_hit) + "가 맞았습니다.",
      en: "Since " + since + " it called the price direction six months out (±" + rg.meta.thresh + "%) " + pctOrDash(s.hit) + " of the time (always saying 'rise' scores " + pctOrDash(rg.always_up.score.hit) + "). " +
          "Over the last 10 years it scored " + pctOrDash(r.hit) + ", and " + pctOrDash(s.move_hit) + " of its " + s.move_n + " rise/fall calls were right.",
    } : rg.mode === "stance" ? {
      ko: since + "년 이후 매달 6개월 안 MAS 결정 방향을 " + pctOrDash(s.hit) + " 맞혔습니다 (항상 '유지'라고 답하면 " + pctOrDash(hold) + "). " +
          "최근 10년 적중률은 " + pctOrDash(r.hit) + "이고, '조이기·풀기' 신호를 낸 " + s.move_n + "번 중 " + pctOrDash(s.move_hit) + "가 맞았습니다.",
      en: "Since " + since + " it called the direction of MAS decisions over the next six months " + pctOrDash(s.hit) + " of the time (always saying 'hold' scores " + pctOrDash(hold) + "). " +
          "Over the last 10 years it scored " + pctOrDash(r.hit) + ", and " + pctOrDash(s.move_hit) + " of its " + s.move_n + " tighten/ease calls were right.",
    } : {
      ko: since + "년 이후 매달 6개월 뒤 금리 방향을 " + pctOrDash(s.hit) + " 맞혔습니다 (항상 '동결'이라고 답하면 " + pctOrDash(hold) + "). " +
          "최근 10년 적중률은 " + pctOrDash(r.hit) + "이고, '움직여라' 신호를 낸 " + s.move_n + "번 중 " + pctOrDash(s.move_hit) + "가 맞았습니다.",
      en: "Since " + since + " it called the rate direction six months out " + pctOrDash(s.hit) + " of the time (always saying 'hold' scores " + pctOrDash(hold) + "). " +
          "Over the last 10 years it scored " + pctOrDash(r.hit) + ", and " + pctOrDash(s.move_hit) + " of its " + s.move_n + " 'move' calls were right.",
    };
    var secs = [
      [{ ko: "어떻게 계산하나", en: "How it works" }, f.explain],
      [{ ko: "배경", en: "Background" }, ab.background],
      [{ ko: "읽는 법", en: "How to read it" }, ab.read],
      [{ ko: "강점과 한계", en: "Strengths and limits" }, ab.limits],
      [{ ko: "이 앱에서의 성적", en: "Track record here" }, record],
    ];
    return detailsBlock({ ko: "이 공식 자세히 보기", en: "About this formula" }, secs);
  }

  function detailsBlock(title, secs) {
    secs = secs.filter(function (x) { return x[1]; });
    return '<details class="about"><summary><span>' + t(title) + "</span></summary>" +
      '<div class="about-body">' + secs.map(function (x) { return "<h3>" + t(x[0]) + "</h3><p>" + t(x[1]) + "</p>"; }).join("") + "</div></details>";
  }

  // 우리 공식이 개별 공식의 어떤 약점을 보완하도록 설계됐는지, 그리고 실제 성적은 어떤지
  function oursAbout(p) {
    p = p || pro;
    var since = p.since.slice(0, 4), isKr = !!pro && [pro.kr, pro.ea, pro.ch, pro.jp].indexOf(p) >= 0 && !!p, isSg = p === (pro && pro.sg), o = p.ours.score, or = p.ours.score_recent, a = p.simple_avg.score, ar = p.simple_avg.score_recent;
    var best = p.folders.slice().sort(function (x, y) { return (y.score.hit || 0) - (x.score.hit || 0); })[0];
    var bestR = p.folders.slice().sort(function (x, y) { return (y.score_recent.hit || 0) - (x.score_recent.hit || 0); })[0];
    var ahead = o.hit != null && best.score.hit != null && o.hit >= best.score.hit;
    var record = {
      ko: since + "년 이후 적중률은 우리 공식 " + pctOrDash(o.hit) + ", 단순 평균 " + pctOrDash(a.hit) + ", 가장 잘 맞힌 단일 공식(" + best.who.ko + ") " + pctOrDash(best.score.hit) + "입니다. " +
          "최근 10년은 우리 공식 " + pctOrDash(or.hit) + ", 단순 평균 " + pctOrDash(ar.hit) + ", 최고 단일 공식(" + bestR.who.ko + ") " + pctOrDash(bestR.score_recent.hit) + "입니다. " +
          (ahead ? "지금은 우리 공식이 단일 공식보다 앞서 있습니다."
                 : "솔직히 말하면 아직 '가장 잘 맞히는 공식'은 아닙니다. 우리 공식이 노리는 것은 최고 점수가 아니라, 앞으로 어느 공식이 잘 맞힐지 모르는 상황에서 한 공식에 운을 걸지 않는 것입니다. 가중 방식이 실제로 성적을 끌어올리는지는 데이터가 쌓이는 대로 계속 검증합니다."),
      en: "Since " + since + " our formula scored " + pctOrDash(o.hit) + ", the simple average " + pctOrDash(a.hit) + ", and the best single formula (" + best.who.en + ") " + pctOrDash(best.score.hit) + ". " +
          "Over the last 10 years: ours " + pctOrDash(or.hit) + ", simple average " + pctOrDash(ar.hit) + ", best single formula (" + bestR.who.en + ") " + pctOrDash(bestR.score_recent.hit) + ". " +
          (ahead ? "Right now our formula is ahead of every single formula."
                 : "To be candid, it is not yet the most accurate formula. What it aims for is not the top score but not betting on one formula when you can't know which will do best next. Whether the weighting actually lifts results is something we keep testing as data accumulates."),
    };
    var secs = [
      [{ ko: "한 공식에만 기대지 않습니다", en: "No single formula to lean on" },
       isSg ? { ko: "공식마다 틀리는 방식이 다릅니다. 근원물가 기준선과 환율판 테일러 준칙은 MAS가 이미 조여 둔 상태인지 모른 채 물가 수준만 보고, 변화 준칙은 일시적인 물가 등락에 흔들리며, 시장 금리차는 미국 금리가 크게 움직일 때 함께 흔들립니다. " +
             "여러 공식을 함께 보면 한 공식의 약점이 다른 공식으로 상쇄됩니다.",
         en: "Each formula fails in its own way. The core yardstick and the exchange-rate Taylor rule see only the level of inflation, not how tight MAS already is; the change rule swings on temporary moves; and the market gap swings when US rates move. " +
             "Looking at them together lets one formula's weak spot be offset by the others." } :
       isKr ? { ko: "공식마다 틀리는 방식이 다릅니다. 테일러·균형접근 준칙은 환율과 미국 금리를 놓치고, 개방경제 준칙은 환율이 급변할 때 과민하게 반응하며, 1차 차분 준칙은 큰 방향 전환을 늦게 잡습니다. " +
             "여러 공식을 함께 보면 한 공식의 약점이 다른 공식으로 상쇄됩니다.",
         en: "Each formula fails in its own way. Taylor and balanced-approach miss the exchange rate and US rates, the open-economy rule overreacts when the won swings, and the first-difference rule is slow at big turns. " +
             "Looking at them together lets one formula's weak spot be offset by the others." } :
       { ko: "공식마다 틀리는 시기가 다릅니다. 테일러 준칙은 제로금리 시기에 마이너스 금리를 요구했고, 맨큐 공식은 1990년대 숫자에 맞춰져 있어 요즘 금리를 높게 잡으며, 시장 금리는 뉴스에 과민 반응할 때가 있습니다. " +
             "여러 공식을 함께 보면 한 공식의 약점이 다른 공식으로 상쇄됩니다.",
         en: "Each formula fails at different times. The Taylor rule called for negative rates at the zero bound, Mankiw's rule is tuned to the 1990s and runs high today, and market rates sometimes overreact to news. " +
             "Looking at them together lets one formula's weak spot be offset by the others." }],
      [{ ko: "잘 맞혀 온 공식의 말을 더 듣습니다", en: "Listens more to formulas that have been right" },
       { ko: "단순 평균은 모든 공식을 똑같이 취급합니다. 우리 공식은 각 공식이 그동안 얼마나 맞혔는지에 따라 목소리 크기를 다르게 줍니다. " +
             "세 가지(인상·동결·인하) 중 하나를 찍어도 3번에 1번은 맞으므로, 그보다 나은 만큼만 가중치를 주고 찍기 수준인 공식은 자동으로 빠집니다.",
         en: "A simple average treats every formula the same. Ours gives each formula a louder or quieter voice depending on how often it has been right. " +
             "Guessing among three outcomes (hike, hold, cut) is right one time in three, so only the part above that counts, and a formula no better than guessing drops out automatically." }],
      [{ ko: "그때 알 수 있었던 성적만 씁니다", en: "Uses only what was known at the time" },
       { ko: "과거 어느 달의 가중치를 정할 때, 그 시점에 이미 결과가 나온 예측(6개월 이상 지난 것)만 반영합니다. 미래 결과를 미리 보고 점수를 매기면 성적이 부풀려지기 때문입니다. " +
             "기록이 5년(60개월) 쌓이기 전에는 가중치를 매기지 않습니다.",
         en: "When setting the weights for any past month, it only counts predictions whose outcome was already known then (six months or older). Peeking at later results would inflate the score. " +
             "No weights are set until five years (60 months) of record exist." }],
      [{ ko: "시대가 바뀌면 가중치도 바뀝니다", en: "Weights shift as times change" },
       { ko: "가중치는 한 번 정하고 끝나는 숫자가 아니라 매달 다시 계산됩니다. 어떤 공식이 최근 들어 잘 맞히기 시작하면 그 공식의 비중이 서서히 커집니다.",
         en: "The weights are not set once; they are recalculated every month. If a formula starts calling things right, its share grows over time." }],
      [{ ko: "확실할 때만 '움직여라'라고 말합니다", en: "Says 'move' only with conviction" },
       { ko: "가중 투표 결과가 한쪽으로 충분히 기울어야(3분의 1 이상) 인상이나 인하 신호를 냅니다. 의견이 갈리면 '동결'로 봅니다. 금리가 이미 0 근처라면 인하 신호는 내지 않습니다.",
         en: "It signals a hike or cut only when the weighted vote leans far enough one way (more than a third). A split vote reads as 'hold', and no cut is signalled when rates are already near zero." }],
      [{ ko: "실제 성적", en: "How it has actually done" }, record],
    ];
    return detailsBlock({ ko: "우리 공식은 무엇을 보완했나", en: "What our formula improves on" }, secs);
  }

  // 나라별 탭의 핵심 지표 카드 (prefix: kr/hk/sg)
  var FX_DIGITS = { usdkrw: 0, hkd: 4, usdsgd: 3 };
  function tileGrid(list, prefix) {
    return list.map(function (r) {
      var d = r.digits != null ? r.digits : FX_DIGITS[r.key] != null ? FX_DIGITS[r.key] : 2, won = r.key === "usdkrw";
      var c1 = recentChg(r), ch = c1 == null ? "" : '<span class="tile-ch">' + chgLabel(c1, num(c1.v, d, true), won) + "</span>";
      return '<button type="button" class="tile tap" data-ind="' + prefix + ":" + esc(r.key) + '">' +
        '<div class="tile-name">' + t(r.name) + '<svg class="tile-go" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 12 7 7l3 3 4-6"/></svg></div>' +
        '<div class="tile-val">' + num(r.value, d) + '<span class="u">' + t(r.unit) + "</span></div>" +
        '<div class="tile-foot">' + ch + (r.label ? '<span class="lab">' + t(r.label) + "</span>" : '<span class="lab">' + t({ ko: "참고 지표", en: "Reference only" }) + "</span>") + "</div></button>";
    }).join("");
  }
  function statBox(label, val, sub) {
    return '<div class="stat"><div class="stat-l">' + t(label) + '</div><div class="stat-v">' + val + "</div>" + (sub ? '<div class="stat-s">' + sub + "</div>" : "") + "</div>";
  }
  function specChart(key) { var c = chartSpec(key); return c ? lineChart(c.f, { actual: c.actual, actualName: c.actualName, diffName: c.diffName }) : ""; }

  // 받침에 맞는 조사 (예: 일본은행은 / ECB는, 유로존이 / 스위스가). 한글이 아니면 영문 약어 읽기로 판단.
  function josa(word, withB, withoutB) {
    var ch = word.charCodeAt(word.length - 1);
    if (ch >= 0xac00 && ch <= 0xd7a3) return word + ((ch - 0xac00) % 28 ? withB : withoutB);
    return word + (/[LMNR]$/i.test(word) ? withB : withoutB);
  }
  // ---------- ECB·일본은행·인민은행·SNB 탭 (한국 탭과 같은 구성) ----------
  function cbView(k) {
    var n = k.now, me = k.meta, cc = me.cc;
    var sub = n.last_change ? t({ ko: "마지막 변경 {m} · {a}% → {b}%", en: "Last change {m} · {a}% → {b}%" },
      { m: n.last_change.month, a: num(n.last_change.from), b: num(n.last_change.to) }) : t(me.rate);
    var sigTxt = n.signal == null ? null : n.signal > 0 ? { ko: "올릴 여지", en: "room to hike" } : n.signal < 0 ? { ko: "내릴 여지", en: "room to cut" } : { ko: "적정 수준", en: "about right" };
    var range = n.taylor != null
      ? t({ ko: "물가·고용으로 본 적정금리 " + num(n.taylor) + "% → " + sigTxt.ko, en: "Fair rate from inflation and jobs " + num(n.taylor) + "% → " + sigTxt.en })
      : n.us != null ? t({ ko: "미국 기준금리 " + num(n.us) + "% (범위 중간)", en: "US policy rate " + num(n.us) + "% (midpoint)" }) : "";
    var reasons = (k.reasons || []).map(function (r) { return "<li>" + t(r) + "</li>"; }).join("");
    var sp = n.spread;
    var spSub = sp == null ? "" : t(sp < 0 ? { ko: "미국이 {v}%p 더 높음", en: "US higher by {v}pp" } : sp > 0 ? { ko: josa(me.country.ko, "이", "가") + " {v}%p 더 높음", en: me.country.en + " higher by {v}pp" } : { ko: "같음", en: "Equal" }, { v: num(Math.abs(sp)) });
    var hasT = k.series.taylor && k.series.taylor.length;
    return '<section class="card hero"><div class="eyebrow">' + t({ ko: me.rate.ko + " · {d} 기준", en: me.rate.en + " · as of {d}" }, { d: n.base_asof }) + "</div>" +
      '<div class="big"><b>' + num(n.base) + "%</b><span>" + sub + "</span></div>" +
      '<div class="range">' + range + "</div>" + (reasons ? "<ul>" + reasons + "</ul>" : "") + "</section>" +
      '<section class="card"><h2>' + t({ ko: "금리 비교", en: "Rate comparison" }) + "</h2>" +
      '<div class="now-row">' +
      statBox({ ko: "미국 기준금리 (범위 중간)", en: "US policy rate (midpoint)" }, n.us == null ? "–" : num(n.us) + "%") +
      statBox({ ko: "금리차 (" + me.country.ko + " − 미국)", en: me.country.en + " − US gap" }, sp == null ? "–" : num(sp, 2, true) + "%p", spSub) +
      (n.taylor == null ? "" : statBox({ ko: "테일러 준칙 적정금리", en: "Taylor-rule rate" }, num(n.taylor) + "%", t({ ko: n.taylor_asof + " 기준 · " + sigTxt.ko, en: "As of " + n.taylor_asof + " · " + sigTxt.en }))) +
      "</div>" + cbAbout(k) + "</section>" +
      '<section class="card"><h2>' + t(UI.keyInds) + '</h2><p class="sub">' +
      t({ ko: me.short.ko + " 금리 결정에 직접적인 지표입니다. 한 달 전과 비교했습니다. 카드를 누르면 최근 12개월 그래프가 열립니다.",
          en: "Indicators that matter most for " + me.short.en + ", versus a month earlier. Tap a card for its 12-month chart." }) + '</p><div class="tiles">' + tileGrid(k.tiles, cc) + "</div></section>" +
      (k.areas && k.areas.length ? '<section class="card"><h2>' + t(UI.drivers) + '</h2><p class="sub">' +
        t({ ko: "각 영역이 평소(2010~2019년)보다 얼마나 벗어났는지입니다. 가운데 선이 평소 수준입니다.",
            en: "How far each area sits from normal (2010–2019). The center line is normal." }) + "</p>" + areaChart(k.areas) + "</section>" : "") +
      (hasT ? '<section class="card"><h2>' + t({ ko: "정책금리 vs 테일러 준칙", en: "Policy rate vs. Taylor rule" }) + "</h2>" +
        '<p class="sub">' + t({ ko: "공식 선이 위에 있으면 올릴 여지, 아래면 내릴 여지로 읽습니다.", en: "Formula above = room to hike; below = room to cut." }) + "</p>" + specChart(cc + "-taylor") + "</section>" : "") +
      '<section class="card"><h2>' + t({ ko: me.country.ko + "·미국 정책금리", en: me.country.en + " vs. US policy rates" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "미국 금리가 더 높으면 달러로 자금이 쏠리기 쉬워 자국 통화 약세 압력이 커집니다.",
        en: "When US rates sit higher, money tends to flow to dollars, pressuring the local currency." }) + "</p>" + specChart(cc + "-us") + "</section>" +
      "<footer><p>" + t({ ko: "출처: " + k.sources.join(", ") + ". 정책금리는 국제결제은행(BIS) 집계 기준입니다." + (hasT ? " 테일러 준칙과 압력 점수는 가정에 따라 달라지는 참고용 계산입니다." : ""),
        en: "Sources: " + k.sources.join(", ") + ". Policy rates as compiled by the BIS." + (hasT ? " The Taylor rule and pressure scores are reference calculations that depend on assumptions." : "") }) +
      "</p><p>" + t(UI.disc1) + "</p></footer>";
  }
  var CB_ABOUT = {
    ea: { ko: "ECB는 유로존 20개국의 금리를 정합니다. 2014~2022년에는 예금금리를 마이너스(최저 −0.5%)로 내렸고, 국채 매입도 함께 썼습니다. 이 탭의 정책금리는 예금금리입니다(2024년부터 ECB가 공식적으로 정책 방향을 알리는 금리).",
          en: "The ECB sets rates for 20 countries. From 2014 to 2022 it held the deposit rate below zero (as low as −0.5%) alongside bond buying. The policy rate shown is the deposit rate, the ECB's signalling rate." },
    ch: { ko: "SNB는 물가가 0~2% 사이면 안정으로 봅니다. 프랑이 안전자산이라 위기 때마다 강세가 되기 때문에, 금리와 함께 외환시장 개입(프랑 매도)을 자주 씁니다. 2015~2022년에는 정책금리가 −0.75%였습니다.",
          en: "The SNB treats 0–2% inflation as price stability. Because the franc is a safe haven that strengthens in every crisis, it often intervenes in currency markets alongside rate moves. The policy rate was −0.75% from 2015 to 2022." },
    jp: { ko: "일본은행은 2013년부터 2% 물가목표를 두고, 2016~2024년에는 마이너스 금리와 수익률곡선 통제(10년 국채 금리를 0% 근처로 묶음)를 썼습니다. 2024년에 마이너스 금리를 끝내고 금리를 올리기 시작했습니다. 2001~2006년 양적완화 시기는 정책금리 대신 실제 콜금리로 채웠습니다.",
          en: "The BOJ adopted a 2% target in 2013 and used negative rates and yield-curve control (pinning 10-yr JGBs near 0%) from 2016 to 2024, when it ended negative rates and began hiking. The 2001–2006 quantitative-easing gap is filled with the actual call rate." },
    cn: { ko: "인민은행은 물가안정목표제를 쓰지 않고, 성장 목표·고용·금융안정·환율을 함께 봅니다. 기준이 되는 금리는 1년 대출우대금리(LPR)이며, 7일 역레포 금리·지급준비율·정책 대출(MLF) 등 여러 수단을 같이 씁니다. 그래서 이 탭은 판단 없이 금리와 지표만 보여 줍니다.",
          en: "The PBoC doesn't run inflation targeting; it weighs growth targets, jobs, financial stability and the currency. The benchmark shown is the 1-year Loan Prime Rate, used alongside the 7-day reverse repo, reserve requirements and policy loans (MLF). So this tab shows rates and indicators without a call." },
  };
  function cbAbout(k) {
    var a = k.assumptions, me = k.meta, secs = [[{ ko: josa(me.short.ko, "은", "는") + " 어떻게 금리를 정하나", en: "How " + me.short.en + " sets rates" }, CB_ABOUT[me.cc]]];
    if (a.r_star != null) {
      secs.push([{ ko: "적정 금리 계산", en: "Fair-rate calculation" },
        { ko: "적정 금리 = 중립 실질금리(" + a.r_star + "%) + 근원물가 상승률 + 0.5 × (근원물가 − 물가목표 " + me.target.ko + ") + 0.5 × 경기 과열 정도. 경기 과열 정도는 실업률이 직전 5년 평균보다 낮은 만큼으로 어림합니다(1%p 낮으면 +2%). 차이가 " + a.deadband + "%p를 넘으면 '올릴/내릴 여지'로 봅니다.",
          en: "Fair rate = neutral real rate (" + a.r_star + "%) + core inflation + 0.5 × (core − target " + me.target.en + ") + 0.5 × slack. Slack is approximated by how far unemployment sits below its prior 5-year average (1pp lower = +2%). A gap beyond " + a.deadband + "pp reads as room to hike or cut." }]);
    }
    secs.push([{ ko: "압력 점수", en: "Pressure scores" },
      { ko: "각 지표가 2010~2019년 평균에서 표준편차 몇 개만큼 벗어났는지입니다. 그 시기 금리가 0% 근처에 묶여 있어 금리차 지표는 작은 변화도 크게 보이므로, 금리차는 변동 폭을 최소 0.5%p로 보고 계산합니다.",
        en: "How many standard deviations each indicator sits from its 2010–2019 average. Rates were pinned near zero then, so for rate gaps the spread is floored at 0.5pp to keep small moves from looking extreme." }]);
    return detailsBlock({ ko: "이 숫자는 어떻게 계산하나요?", en: "How are these calculated?" }, secs);
  }
  // ---------- 자산 폴더: 금·석유·S&P 500 ----------
  var PX_PERIODS = [["7d", 7, { ko: "7일", en: "7D" }], ["1m", 31, { ko: "1개월", en: "1M" }], ["3m", 92, { ko: "3개월", en: "3M" }],
                    ["1y", 366, { ko: "1년", en: "1Y" }], ["5y", 60, { ko: "5년", en: "5Y" }], ["10y", 120, { ko: "10년", en: "10Y" }], ["all", 0, { ko: "전체", en: "All" }]];
  view.px = {};
  // 가격 그래프: 월평균(오래된 구간) + 일별(최근 10년)을 이은 한 줄 위에서 기간을 고르고, 휠·핀치로 확대한다
  view.pxWin = {};
  function pxFull(p) {
    if (p._full) return p._full;
    var daily = p.daily || [], monthly = p.price || [], first = daily.length ? daily[0][0].slice(0, 7) : null, out = [];
    monthly.forEach(function (m) { if (!first || m[0] < first) out.push([m[0], m[1], 0]); });
    daily.forEach(function (d) { out.push([d[0], d[1], 1]); });
    p._full = out;
    return out;
  }
  function pxDate(s) { return new Date(s.length === 7 ? s + "-15" : s); }
  function pxWin(p, per) {
    var f = pxFull(p), n = f.length;
    if (n < 2) return null;
    if (per === "all") return [0, n - 1];
    if (["7d", "1m", "3m"].indexOf(per) >= 0 && !(p.daily && p.daily.length)) return null;  // 일별 자료가 없으면 1년부터
    var spec = PX_PERIODS.filter(function (x) { return x[0] === per; })[0];
    var days = per === "5y" ? 1827 : per === "10y" ? 3653 : spec[1];
    var cut = new Date(pxDate(f[n - 1][0]).getTime() - days * 864e5), i0 = n - 1;
    while (i0 > 0 && pxDate(f[i0 - 1][0]) >= cut) i0--;
    return [Math.min(i0, n - 2), n - 1];
  }
  function pxChart(p, per, win, size) {
    var f = pxFull(p);
    win = win || pxWin(p, per);
    if (!win || win[1] - win[0] < 1) return '<p class="note">' + t({ ko: "이 기간 자료가 없습니다.", en: "No data for this period." }) + "</p>";
    var pts = f.slice(win[0], win[1] + 1);
    var spanDays = (pxDate(pts[pts.length - 1][0]) - pxDate(pts[0][0])) / 864e5;
    var narrow = innerWidth < 640, W = narrow ? Math.max(300, innerWidth - 56) : 720, H = narrow ? 240 : 300, L = narrow ? 48 : 56, R = 16, T = 14, B = 28;
    if (size) { W = size.W; H = size.H; }
    var lg = spanDays > 365 * 15, anyM = pts.some(function (x) { return !x[2]; }), allM = pts.every(function (x) { return !x[2]; });
    var raw = pts.map(function (x) { return x[1]; }), vals = raw.map(function (v) { return lg ? Math.log(v) / Math.LN10 : v; });
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), lo, hi, ticks = [];
    if (lg) {
      lo = Math.floor(mn * 10) / 10; hi = Math.ceil(mx * 10) / 10;
      for (var e = Math.floor(lo); e <= Math.ceil(hi); e++) [1, 2, 5].forEach(function (k) { var v = Math.log(k * Math.pow(10, e)) / Math.LN10; if (v >= lo && v <= hi) ticks.push(v); });
    } else {
      var st = niceStep((mx - mn) || Math.abs(mx) || 1);
      lo = Math.floor(mn / st - 0.15) * st; hi = Math.ceil(mx / st + 0.15) * st;
      for (var v = lo; v <= hi + st / 2; v += st) ticks.push(v);
    }
    function X(i) { return L + (i / (pts.length - 1)) * (W - L - R); }
    function Y(v) { return T + (1 - (v - lo) / (hi - lo)) * (H - T - B); }
    var tickSpan = hi - lo, dgT = lg ? 0 : tickSpan < 0.05 ? 4 : tickSpan < 0.5 ? 3 : tickSpan < 5 ? 2 : tickSpan < 50 ? 1 : 0;
    var grid = "", yt = "", xt = "";
    ticks.forEach(function (v) {
      grid += '<line class="g" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/>';
      yt += '<text class="ax" x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + num(lg ? Math.pow(10, v) : v, dgT) + "</text>";
    });
    var nT = Math.min(narrow ? 4 : 6, pts.length), lastX = -1e9;
    for (var j = 0; j < nT; j++) {
      var i = Math.round(j * (pts.length - 1) / Math.max(1, nT - 1)), xx = X(i), dstr = pts[i][0];
      if (xx - lastX < 70) continue;
      lastX = xx;
      var lab = spanDays <= 400 && dstr.length > 7 ? dstr.slice(5).replace("-", ".") : spanDays <= 365 * 6 ? dstr.slice(2, 7).replace("-", ".") : dstr.slice(0, 4);
      xt += '<text class="ax" x="' + xx.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (j === 0 ? "start" : j === nT - 1 ? "end" : "middle") + '">' + lab + "</text>";
    }
    var line = vals.map(function (v, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); }).join("");
    var area = line + "L" + X(pts.length - 1).toFixed(1) + " " + (H - B) + "L" + L + " " + (H - B) + "Z";
    var c = { mode: "ind", x: pts.map(function (x) { return x[0]; }), a: vals, raw: raw, dg: p.meta.digits, L: L, R: R, W: W, T: T, B: B, H: H, lo: lo, hi: hi,
              uk: p.meta.unit.ko, ue: p.meta.unit.en, vlk: p.meta.vlabel && p.meta.vlabel.ko, vle: p.meta.vlabel && p.meta.vlabel.en,
              pk: allM ? "전월 대비" : anyM ? "직전 대비" : "전일 대비", pe: allM ? "vs. prior month" : anyM ? "vs. prior point" : "vs. prior day",
              wi: win, nf: f.length };
    var n = pts.length, chg = (raw[n - 1] / raw[0] - 1) * 100, zoomed = size ? size.zoomed : view.pxWin[p.asset];
    var zb = function (k, label, title) { return '<button type="button" class="pxz" data-pxz="' + k + '" title="' + title + '" aria-label="' + title + '">' + label + "</button>"; };
    return '<div class="chart big ind px" data-chart="' + esc(JSON.stringify(c)) + '">' +
      '<div class="chart-top"><div class="legend"><span><i class="lk rule"></i>' + t(p.meta.name) + " (" + t(p.meta.unit) + ")" +
      (allM ? " · " + t({ ko: "월평균", en: "monthly avg" }) : anyM ? " · " + t({ ko: "일별·월평균", en: "daily + monthly" }) : " · " + t({ ko: "일별", en: "daily" })) +
      (lg ? " · " + t({ ko: "로그 눈금", en: "log scale" }) : "") + "</span></div>" +
      '<span class="pxzs">' + zb("in", "＋", "Zoom in") + zb("out", "－", "Zoom out") + (zoomed ? zb("reset", "⟲", "Reset") : "") + "</span>" +
      (size ? "" : '<button type="button" class="expand" data-pxbig="' + esc(p.asset) + '"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9"/></svg>' + t({ ko: "크게 보기", en: "Enlarge" }) + "</button>") +
      '<span class="px-chg ' + (chg >= 0 ? "up" : "down") + '">' + num(chg, 1, true) + "%</span></div>" +
      '<div class="readout" aria-live="polite"></div>' +
      '<svg class="plot" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(p.meta.name.en) + '" tabindex="0">' + grid + yt + xt +
      '<path class="ind-area" d="' + area + '"/><path class="l-rule" d="' + line + '"/>' +
      '<line class="xh" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '"/><circle class="d-rule" r="5.5" cx="0" cy="0"/>' +
      '<rect class="hit" x="0" y="0" width="' + W + '" height="' + H + '"/></svg>' +
      '<input type="range" class="cursor-range" min="0" max="' + (n - 1) + '" value="' + (n - 1) + '" step="1" aria-label="Date">' +
      '<p class="hint">' + t({ ko: "휠이나 두 손가락으로 확대·축소, 확대한 뒤 끌면 좌우 이동, 더블클릭하면 원래대로. 마우스를 올리거나 한 손가락으로 끌면 시점 값이 보입니다.",
        en: "Scroll or pinch to zoom, drag to pan when zoomed, double-click to reset. Hover or drag with one finger to read values." }) + "</p></div>";
  }
  function pxBlock(p) {
    var a = p.asset, per = view.px[a] || "1y";
    PXSRC[a] = p;
    p._full = null;
    if (!p.price || !p.price.length) return '<p class="note">' + t({ ko: "공유용 페이지에는 지수 원자료를 넣지 않았습니다(S&P 다우존스 지수 사용 조건). 앱에서는 7일부터 전체 기간까지 볼 수 있습니다.",
      en: "The shared page leaves out raw index values (S&P Dow Jones Indices terms). The app shows every period from 7 days to all history." }) + "</p>";
    var btns = PX_PERIODS.map(function (x) {
      var ok = !!pxWin(p, x[0]);
      return '<button type="button" data-px="' + a + "|" + x[0] + '" aria-pressed="' + (per === x[0] && !view.pxWin[a]) + '"' + (ok ? "" : " disabled title=\"" +
        esc(t({ ko: "일별 자료가 없어 1년부터 볼 수 있습니다", en: "No daily data; available from 1 year" }).replace(/<[^>]+>/g, " ")) + "\"") + ">" + t(x[2]) + "</button>";
    }).join("");
    return '<div class="periods px-per" role="group">' + btns + '</div><div class="pxbox" data-asset="' + a + '">' + pxChart(p, per, view.pxWin[a]) + "</div>" +
      (!(p.daily && p.daily.length) ? '<p class="note">' + t({ ko: "금은 무료로 공개된 공식 일별 가격이 없어(런던 금 가격은 유료 라이선스) 세계은행 월평균으로 보여 줍니다. 7일~3개월은 일별 자료가 필요합니다.",
        en: "There's no free official daily gold price (the London price is licensed), so this uses World Bank monthly averages. 7 days to 3 months need daily data." }) + "</p>" : "");
  }
  // 확대·이동: 창(win)을 바꿔 그래프만 다시 그린다
  function pxRedraw(box, win, anchorDate) {
    var holder = box.closest(".pxbox"), a = holder && holder.dataset.asset, p = PXSRC[a];
    if (!p) return;
    var nf = pxFull(p).length;
    var len = Math.max(4, Math.min(nf - 1, win[1] - win[0]));
    var w0 = Math.max(0, Math.min(nf - 1 - len, win[0]));
    var nw = [w0, w0 + len], full = pxWin(p, view.px[a] || "1y");
    view.pxWin[a] = nw[0] === 0 && nw[1] === nf - 1 && (view.px[a] || "1y") === "all" ? null : nw;
    holder.innerHTML = pxChart(p, view.px[a] || "1y", nw);
    setLang(root.lang);
    initCharts(holder);
    mountPx(holder);
    var nb = holder.querySelector(".chart.px");
    if (nb && anchorDate) { var k = chartData(nb).x.indexOf(anchorDate); if (k >= 0) setCursor(nb, k); }
    var pr = holder.previousElementSibling;
    if (pr && pr.classList.contains("px-per")) pr.querySelectorAll("[data-px]").forEach(function (b) { b.setAttribute("aria-pressed", String(!view.pxWin[a] && b.dataset.px === a + "|" + (view.px[a] || "1y"))); });
    void full;
  }
  // ---------- 그래프 확대·이동 (가격 그래프와 크게 보기 창의 선 그래프가 같이 쓴다) ----------
  // redraw(newWin, anchorDate): 창을 바꿔 다시 그리기, reset(): 기간 기본값으로
  function zoomBy(box, factor, centerIdx, redraw) {
    var c = chartData(box), w = c.wi, len = w[1] - w[0];
    var ci = centerIdx == null ? Math.round(len / 2) : centerIdx, g = w[0] + ci;
    var nl = Math.round(len * factor);
    if (nl === len) nl = len + (factor < 1 ? -1 : 1);
    nl = Math.max(4, Math.min(c.nf - 1, nl));
    var n0 = Math.round(g - (g - w[0]) * nl / Math.max(1, len));
    n0 = Math.max(0, Math.min(c.nf - 1 - nl, n0));
    redraw([n0, n0 + nl], c.x[Math.min(ci, c.x.length - 1)]);
  }
  function attachZoom(box, redraw, reset) {
    if (box._bound) return;
    box._bound = true;
    var svg = box.querySelector("svg.plot"), rg = box.querySelector(".cursor-range");
    if (rg) rg.addEventListener("input", function () { setCursor(box, +rg.value); });
    var ptrs = {}, pan = null, pinch = null, raf = 0;
    function plotW() { var r = svg.getBoundingClientRect(), c = chartData(box); return r.width * (c.W - c.L - c.R) / c.W; }
    function later(fn) { clearTimeout(raf); raf = setTimeout(fn, 16); }  // 연속 휠·핀치를 한 번에 모아 다시 그린다
    function clampWin(w) { var c = chartData(box), len = Math.max(4, Math.min(c.nf - 1, w[1] - w[0])), a = Math.max(0, Math.min(c.nf - 1 - len, w[0])); return [a, a + len]; }
    svg.addEventListener("wheel", function (e) {
      e.preventDefault();
      var idx = indexAt(box, e.clientX), f = e.deltaY < 0 ? 0.8 : 1.25;
      later(function () { zoomBy(box, f, idx, redraw); });
    }, { passive: false });
    svg.addEventListener("dblclick", function () { reset(); });
    svg.addEventListener("pointerdown", function (e) {
      ptrs[e.pointerId] = e;
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      var ids = Object.keys(ptrs), c = chartData(box);
      if (ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]];
        pinch = { d: Math.abs(a.clientX - b.clientX) || 1, mid: (a.clientX + b.clientX) / 2, wi: c.wi.slice() };
        pan = null;
      } else if (e.pointerType === "mouse") {
        pan = { x: e.clientX, wi: c.wi.slice(), moved: false };
      } else {
        setCursor(box, indexAt(box, e.clientX));
      }
      e.preventDefault();
    });
    svg.addEventListener("pointermove", function (e) {
      if (ptrs[e.pointerId]) ptrs[e.pointerId] = e;
      var ids = Object.keys(ptrs), c = chartData(box);
      if (pinch && ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.abs(a.clientX - b.clientX) || 1;
        var len = pinch.wi[1] - pinch.wi[0], nl = Math.max(4, Math.round(len * pinch.d / d));
        var r = svg.getBoundingClientRect(), frac = Math.max(0, Math.min(1, (pinch.mid - r.left) / r.width));
        var g = pinch.wi[0] + frac * len, n0 = Math.round(g - frac * nl);
        later(function () { redraw(clampWin([n0, n0 + nl])); });
        return;
      }
      if (pan && e.buttons) {
        var dx = e.clientX - pan.x, len2 = pan.wi[1] - pan.wi[0];
        if (Math.abs(dx) > 3) pan.moved = true;
        if (pan.moved && len2 < c.nf - 1) {
          var sh = Math.round(-dx / plotW() * len2);
          later(function () { redraw(clampWin([pan.wi[0] + sh, pan.wi[1] + sh])); });
          return;
        }
      }
      if (e.pointerType === "mouse" || ids.length === 1) setCursor(box, indexAt(box, e.clientX));
    });
    function up(e) {
      if (pan && !pan.moved && e.pointerType === "mouse") setCursor(box, indexAt(box, e.clientX));
      delete ptrs[e.pointerId];
      if (Object.keys(ptrs).length < 2) pinch = null;
      if (!Object.keys(ptrs).length) pan = null;
    }
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
    svg.addEventListener("keydown", function (e) {
      if (e.key === "+" || e.key === "=") { zoomBy(box, 0.8, box._i, redraw); e.preventDefault(); }
      else if (e.key === "-" || e.key === "_") { zoomBy(box, 1.25, box._i, redraw); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { setCursor(box, box._i - (e.shiftKey ? 12 : 1)); e.preventDefault(); }
      else if (e.key === "ArrowRight") { setCursor(box, box._i + (e.shiftKey ? 12 : 1)); e.preventDefault(); }
      else if (e.key === "Home") { setCursor(box, 0); e.preventDefault(); }
      else if (e.key === "End") { setCursor(box, 1e9); e.preventDefault(); }
    });
  }
  // 크게 보기 창: 같은 가격 그래프를 창 크기로 그리고, 기간·확대는 창 안에서 따로 움직인다
  function openPxZoom(asset, win, anchor) {
    var p = PXSRC[asset];
    if (!p) return;
    var per = (zoomState && zoomState.px === asset && zoomState.per) || view.px[asset] || "1y";
    var base = pxWin(p, per), w = win || base, sz = zoomSize(0);
    var btns = PX_PERIODS.map(function (x) {
      var ok = !!pxWin(p, x[0]);
      return '<button type="button" data-pxper="' + x[0] + '" aria-pressed="' + (!win && per === x[0]) + '"' + (ok ? "" : " disabled") + ">" + t(x[2]) + "</button>";
    }).join("");
    var html = '<div class="periods px-per" role="group">' + btns + "</div>" + pxChart(p, per, w, { W: sz.W, H: sz.H, zoomed: !!win });
    var prev = anchor || null;
    if (!prev && zoomEl && zoomState && zoomState.px === asset) { var ob = zoomEl.querySelector(".chart"); if (ob && ob._i != null) prev = chartData(ob).x[ob._i]; }
    showZoom({ px: asset, per: per, win: win || null }, p.zoomEyebrow || t(p.meta.unit), t(p.meta.name), html, prev);
  }
  function pxReset(box) {
    var a = box.closest(".pxbox").dataset.asset;
    view.pxWin[a] = null;
    pxRedraw(box, pxWin(PXSRC[a], view.px[a] || "1y"));
    view.pxWin[a] = null;
    var holder = document.querySelector('.pxbox[data-asset="' + a + '"]'), pr = holder && holder.previousElementSibling;
    if (pr && pr.classList.contains("px-per")) pr.querySelectorAll("[data-px]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.px === a + "|" + (view.px[a] || "1y"))); });
    var zr = holder && holder.querySelector('[data-pxz="reset"]');
    if (zr) zr.remove();
  }
  function mountPx(scope) {
    (scope || document).querySelectorAll(".chart.px").forEach(function (box) {
      attachZoom(box, function (w, anc) { pxRedraw(box, w, anc); }, function () { pxReset(box); });
    });
  }
  function assetSwitch() {
    return '<div class="folders apick">' + (["au", "ol", "sp"].filter(function (k) { return pro && pro[k]; }).map(function (k) {
      var q = pro[k], cur = k === view.asset;
      return '<button type="button" class="folder' + (cur ? " cur" : "") + '" data-asset="' + k + '"' + (cur ? ' aria-current="true"' : "") + ">" + FOLDER_ICON +
        '<span class="f-who">' + num(q.ref_price, q.meta.digits) + " " + t(q.meta.unit) + "</span>" + '<span class="f-name">' + t(q.meta.short) + "</span>" +
        '<span class="f-foot">' + chip(q.ours.now.signal, "asset") + '<span class="lab">' + t({ ko: "공식 " + q.folders.length + "개", en: q.folders.length + " formulas" }) + "</span></span></button>";
    }).join("")) + "</div>";
  }
  function pairSwitch() {
    return '<div class="periods fx-base pairs" role="group" aria-label="Pair">' + FX_PAIRS.filter(function (k) { return pro && pro[k]; }).map(function (k) {
      return '<button type="button" data-fxp="' + k + '" aria-pressed="' + ((view.fxp || "kw") === k) + '">' + t(pro[k].meta.name) + "</button>";
    }).join("") + "</div>";
  }
  function assetOverview(p) {
    var me = p.meta, s = p.stats, o = p.outlook, lr = p.longrun, n = p.folders.length;
    var priceNow = s.daily ? s.daily.price : s.price, priceAsof = s.daily ? esc(s.daily.date) : esc(s.asof) + " " + t({ ko: "월평균", en: "monthly avg" });
    var sigTxt = function (f) { return "<li>" + t(f.name) + ": " + chip(f.now.signal, "asset") + ' <span class="lab">' + num(f.now.rec, 2, true) + "</span></li>"; };
    var pctTxt = function (v) { return v == null ? "–" : num(v, 1, true) + "%"; };
    // 확률 막대 (하락/보합/상승) — 미국 탭의 결정 확률 막대와 같은 모양
    // 확률 막대 (하락/보합/상승) — 미국 탭의 결정 확률 막대와 같은 모양
    var bar = function (d) {
      if (!d) return "";
      var ps = [d.down, d.flat, d.up], segs = "", vals = "";
      for (var i = 0; i < 3; i++) {
        var lb = { ko: SIG_AS.ko[String(i - 1)], en: SIG_AS.en[String(i - 1)] };
        segs += '<span class="seg ' + CLASS_KEY[i] + '" style="flex:' + Math.max(ps[i], 0.0001).toFixed(4) + '"></span>';
        vals += '<span class="pv"><i class="sw ' + CLASS_KEY[i] + '"></i>' + t(lb) + " <b>" + pct(ps[i]) + "</b></span>";
      }
      return '<div class="pb strong"><div class="pb-head"><span>' + t({ ko: "6개월 뒤 (과거 비슷한 신호)", en: "Six months on (similar past signals)" }) + '</span><span class="pvs">' + vals + '</span></div><div class="bar">' + segs + "</div></div>";
    };
    var best = [["always_up", { ko: "항상 '상승'", en: "Always 'rise'" }], ["always_hold", { ko: "항상 '보합'", en: "Always 'flat'" }]]
      .map(function (x) { return [x[1], p[x[0]]]; }).sort(function (a, b) { return (b[1].score.hit || 0) - (a[1].score.hit || 0); })[0];
    var baseWins = best[1].score.hit > (p.ours.score.hit || 0);
    var rows = [[UI.ours, p.ours, true], [UI.simpleAvg, p.simple_avg], [{ ko: "항상 '상승'", en: "Always 'rise'" }, p.always_up], [{ ko: "항상 '보합'", en: "Always 'flat'" }, p.always_hold]]
      .map(function (r) { return "<tr" + (r[2] ? ' class="em"' : "") + "><td>" + t(r[0]) + '</td><td class="n">' + pctOrDash(r[1].score.hit) + '</td><td class="n">' + pctOrDash(r[1].score_recent.hit) + "</td></tr>"; }).join("");
    var cards = p.folders.map(function (f) {
      return '<button type="button" class="folder" data-folder="' + esc(f.key) + '">' + FOLDER_ICON +
        '<span class="f-who">' + t(f.who) + (f.year ? " · " + f.year : "") + "</span>" + '<span class="f-name">' + t(f.name) + "</span>" +
        '<span class="f-foot">' + chip(f.now.signal, "asset") + '<span class="lab">' + t(UI.hitShort, { v: pctOrDash(f.score.hit) }) + "</span></span></button>";
    }).join("");
    var fc = p.forecasts.map(function (f) {
      return f.points.map(function (pt, i) {
        return "<tr>" + (i === 0 ? '<td rowspan="' + f.points.length + '"><b>' + t(f.who) + "</b><br><small>" + t(f.what) + "</small><br>" +
          '<a href="' + esc(f.url) + '" target="_blank" rel="noopener"><small>' + t({ ko: "출처", en: "Source" }) + " · " + esc(f.date) + "</small></a>" +
          (f.auto ? ' <span class="tagauto">' + t({ ko: "자동 갱신", en: "auto" }) + "</span>" : "") + "</td>" : "") +
          "<td>" + t(pt.label) + '</td><td class="n">' + num(pt.v, me.digits) + '</td><td class="n ' + (pt.chg >= 0 ? "up" : "down") + '">' + pctTxt(pt.chg) + "</td></tr>";
      }).join("");
    }).join("");
    var lrHtml = !lr ? "" : lr.kind === "cape"
      ? '<div class="now-row">' + statBox({ ko: "CAPE (경기조정 PER)", en: "CAPE" }, num(lr.cape, 1), t({ ko: lr.cape_asof + (lr.cape_est ? " 추정" : "") + " · " + lr.since.slice(0, 4) + "년 이후 상위 " + (100 - lr.cape_pct) + "%", en: lr.cape_asof + (lr.cape_est ? " est." : "") + " · top " + (100 - lr.cape_pct) + "% since " + lr.since.slice(0, 4) })) +
        statBox({ ko: "향후 10년 연 실질수익률 추정", en: "Est. 10-yr real return, per year" }, num(lr.pred, 1) + "%", t({ ko: "범위 " + num(lr.lo, 1) + " ~ " + num(lr.hi, 1) + "% · 과거 평균 " + num(lr.hist_avg, 1) + "%", en: "Range " + num(lr.lo, 1) + " to " + num(lr.hi, 1) + "% · history avg " + num(lr.hist_avg, 1) + "%" })) + "</div>" +
        '<p class="note">' + t({ ko: "로버트 실러의 방법: 1881년 이후 매달 'CAPE의 역수'와 그 뒤 10년 실질 총수익률(배당 포함)의 관계를 회귀로 구했습니다(설명력 R² " + lr.r2 + "). 범위는 과거 오차의 ±1 표준편차입니다." +
          (lr.cape_est ? " 실러의 이익 자료는 " + lr.cape_real_until + "까지라, 그 뒤 CAPE는 가격 변화와 지난 10년 이익 증가율로 추정했습니다." : ""),
          en: "Robert Shiller's approach: a regression of the following 10-year real total return (with dividends) on 1/CAPE, monthly since 1881 (R² " + lr.r2 + "). The range is ±1 standard deviation of past errors." +
          (lr.cape_est ? " Shiller's earnings data end in " + lr.cape_real_until + ", so later CAPE is estimated from price moves and 10-year earnings growth." : "") }) + "</p>"
      : '<div class="now-row">' + statBox({ ko: "실질 가격 수준", en: "Real price level" }, t({ ko: "상위 " + (100 - lr.pct) + "%", en: "Top " + (100 - lr.pct) + "%" }), t({ ko: lr.since.slice(0, 4) + "년 이후, 물가 반영 (평균 " + num(lr.real_avg, me.digits) + ")", en: "Since " + lr.since.slice(0, 4) + ", inflation-adjusted (avg " + num(lr.real_avg, me.digits) + ")" })) +
        statBox({ ko: "비슷한 가격 수준 뒤 5년", en: "Next 5 years from similar levels" }, num(lr.p50, 1) + "%", t({ ko: "연 실질수익률 중앙값 · 범위 " + num(lr.p10, 1) + " ~ " + num(lr.p90, 1) + "% (전체 중앙값 " + num(lr.all_p50, 1) + "%)", en: "Median real return per year · range " + num(lr.p10, 1) + " to " + num(lr.p90, 1) + "% (all-period median " + num(lr.all_p50, 1) + "%)" })) + "</div>" +
        '<p class="note">' + t({ ko: lr.since.slice(0, 4) + "년 이후 실질 가격을 다섯 구간으로 나눴을 때 지금은 " + lr.quintile + "번째(가장 비싼 쪽이 5) 구간입니다. 같은 구간이었던 " + lr.n + "개월 뒤 5년 동안의 실질수익률입니다. 비슷한 수준이 반복된 횟수가 적어 참고용입니다.",
          en: "Splitting real prices since " + lr.since.slice(0, 4) + " into fifths, today sits in band " + lr.quintile + " (5 = most expensive). These are the next-5-year real returns from the " + lr.n + " months in the same band; few independent episodes, so treat as a guide." }) + "</p>";
    var stRows = [
      [{ ko: "1개월", en: "1 month" }, s.chg["1m"]], [{ ko: "3개월", en: "3 months" }, s.chg["3m"]], [{ ko: "6개월", en: "6 months" }, s.chg["6m"]],
      [{ ko: "올해", en: "Year to date" }, s.ytd], [{ ko: "1년", en: "1 year" }, s.chg["1y"]], [{ ko: "3년", en: "3 years" }, s.chg["3y"]],
      [{ ko: "5년", en: "5 years" }, s.chg["5y"]], [{ ko: "10년", en: "10 years" }, s.chg["10y"]], [{ ko: "20년", en: "20 years" }, s.chg["20y"]],
    ].map(function (r) { return "<tr><td>" + t(r[0]) + '</td><td class="n ' + (r[1] >= 0 ? "up" : "down") + '">' + pctTxt(r[1]) + "</td></tr>"; }).join("");
    var kv = function (k, v, sub) { return "<tr><td>" + t(k) + '</td><td class="n">' + v + (sub ? "<br><small>" + sub + "</small>" : "") + "</td></tr>"; };
    var risk = kv({ ko: "연 변동성 (최근 3년)", en: "Annual volatility (3y)" }, num(s.vol, 1) + "%") +
      kv({ ko: "사상 최고 (월평균)", en: "All-time high (monthly avg)" }, num(s.ath, me.digits), t({ ko: s.ath_month + " · 지금 " + num(s.from_ath, 1, true) + "%", en: s.ath_month + " · now " + num(s.from_ath, 1, true) + "%" })) +
      kv({ ko: "최대 낙폭 (월평균)", en: "Max drawdown (monthly avg)" }, num(s.mdd, 1) + "%", esc(s.mdd_month)) +
      (s.daily ? kv({ ko: "52주 최고 / 최저 (일별)", en: "52-week high / low (daily)" }, num(s.daily.hi52, me.digits) + " / " + num(s.daily.lo52, me.digits))
               : kv({ ko: "12개월 최고 / 최저 (월평균)", en: "12-month high / low (monthly)" }, num(s.m_hi12, me.digits) + " / " + num(s.m_lo12, me.digits))) +
      kv({ ko: "연평균 수익률 (" + s.start.slice(0, 4) + "년~, 가격만)", en: "Annual growth since " + s.start.slice(0, 4) + " (price only)" }, num(s.cagr, 2) + "%", s.real_cagr != null ? t({ ko: "물가 반영 " + num(s.real_cagr, 2) + "%", en: "Inflation-adjusted " + num(s.real_cagr, 2) + "%" }) : "") +
      (s.best12 ? kv({ ko: "가장 좋았던 / 나빴던 12개월", en: "Best / worst 12 months" }, num(s.best12.v, 1, true) + "% / " + num(s.worst12.v, 1, true) + "%", esc(s.best12.month + " / " + s.worst12.month)) : "") +
      (s.pos12 != null ? kv({ ko: "12개월 수익률이 플러스였던 비율", en: "Share of positive 12-month periods" }, s.pos12 + "%", t({ ko: s.since12.slice(0, 4) + "년 이후", en: "Since " + s.since12.slice(0, 4) })) : "") +
      (s.real_pct != null ? kv({ ko: "실질 가격 백분위", en: "Real price percentile" }, s.real_pct + "%", t({ ko: s.since12.slice(0, 4) + "년 이후, 높을수록 비쌈", en: "Since " + s.since12.slice(0, 4) + "; higher = pricier" })) : "");
    return authBar() + '<p class="pro-note"><span class="pro-badge">PRO</span> ' + t(UI.proPreview) + " · " + (p.pair ? t({ ko: "주요 통화쌍의 가격 통계, 신호 공식의 과거 성적, 시장 내재 선물환, 기관 전망과 전문가·당국 발언입니다.", en: "Major currency pairs: statistics, signal track records, market-implied forwards, forecasts and official remarks." })
               : t({ ko: "금·석유·S&P 500의 가격 통계, 신호 공식의 과거 성적, 전망과 기관 전망입니다.", en: "Gold, oil and S&P 500: price statistics, signal track records, outlooks and forecasts." })) + "</p>" +
      (p.pair ? pairSwitch() : assetSwitch()) +
      '<section class="card hero"><div class="eyebrow">' + t(me.name) + " · " + priceAsof + "</div>" +
      '<div class="big"><b>' + num(priceNow, me.digits) + '</b><span>' + t(me.unit) + " · " + t({ ko: "1년 " + pctTxt(s.chg["1y"]) + " · 5년 " + pctTxt(s.chg["5y"]) + " (월평균 기준)", en: "1y " + pctTxt(s.chg["1y"]) + " · 5y " + pctTxt(s.chg["5y"]) + " (monthly avg)" }) + "</span></div>" +
      '<div class="range">' + t({ ko: "6개월 전망 (우리 공식): ", en: "6-month outlook (our blend): " }) + chip(p.ours.now.signal, "asset") + " " + (sigGrade(p) ? sigGrade(p).html + " " : "") + t(UI.agree, { a: p.ours.now.agree, n: p.ours.now.total }) + "</div>" +
      (sigGrade(p) && sigGrade(p).lv === "weak" ? '<div class="range">' + t({ ko: "신호가 약해 확률로 보세요 — 과거 같은 신호 뒤 6개월: ", en: "Weak signal — read the odds instead. Six months after this signal: " }) + probLine(p) + "</div>" : "") +
      '<ul class="sigs">' + p.folders.map(sigTxt).join("") + "</ul></section>" +
      '<section class="card"><h2>' + t({ ko: "가격 그래프", en: "Price chart" }) + "</h2>" + pxBlock(p) + "</section>" +
      '<section class="card"><h2>' + t({ ko: "6개월 전망", en: "Six-month outlook" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "'우리 공식'이 지금처럼 ", en: "When our blend said " }) + chip(o.signal, "asset") + t({ ko: " 신호였던 " + o.same.n + "개월 동안, 그 뒤 6개월 가격이 어떻게 됐는지입니다 (±" + o.thresh + "% 기준).",
        en: " (" + o.same.n + " months), here is what the price did over the next six months (±" + o.thresh + "%)." }) + "</p>" + bar(o.same) + methodNote(p) +
      '<p class="note">' + t({ ko: "6개월 뒤 수익률 중앙값 " + pctTxt(o.same.p50) + " (10~90% 범위 " + pctTxt(o.same.p10) + " ~ " + pctTxt(o.same.p90) + "). 전체 기간에는 상승 " + pct(o.all.up) + " · 보합 " + pct(o.all.flat) + " · 하락 " + pct(o.all.down) + ", 중앙값 " + pctTxt(o.all.p50) + "였습니다.",
        en: "Median six-month return " + pctTxt(o.same.p50) + " (10–90% range " + pctTxt(o.same.p10) + " to " + pctTxt(o.same.p90) + "). Over all periods: rise " + pct(o.all.up) + " · flat " + pct(o.all.flat) + " · fall " + pct(o.all.down) + ", median " + pctTxt(o.all.p50) + "." }) + "</p>" +
      ((o.signal < 0 && o.same.up > o.same.down) || (o.signal > 0 && o.same.down > o.same.up) ?
        '<p class="note warn">' + t({ ko: "주의: 과거에 이 신호가 나온 뒤에는 오히려 " + (o.signal < 0 ? "상승" : "하락") + "이 더 많았습니다. 지금 신호는 믿을 만하지 않습니다. 막대의 확률을 우선 참고하세요.",
          en: "Caution: after this signal in the past, the price more often " + (o.signal < 0 ? "rose" : "fell") + ". The current signal isn't reliable; lean on the odds in the bar." }) + "</p>" : "") +
      '<div class="tbl"><table class="cmp"><thead><tr><th></th><th class="n">' + t(UI.colAll) + '</th><th class="n">' + t(UI.colRecent) + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<p class="note">' + howScoredTxt(p) + "</p>" +
      (baseWins ? '<p class="note warn">' + t({ ko: "지금까지는 공식 없이 " + best[0].ko + "이라고 답하는 쪽(" + pct(best[1].score.hit) + ")이 우리 공식(" + pctOrDash(p.ours.score.hit) + ")보다 많이 맞혔습니다. 전망은 확률로 참고하고, 이 숫자만으로 사고팔지 마세요.",
        en: "So far, simply answering " + best[0].en + " (" + pct(best[1].score.hit) + ") beat our blend (" + pctOrDash(p.ours.score.hit) + "). Treat the outlook as odds, not a trading signal." }) + "</p>" : "") + "</section>" +
      reactionHtml(p) +
      (lr ? '<section class="card"><h2>' + t({ ko: "장기 전망", en: "Long-run view" }) + "</h2>" + lrHtml + "</section>" : "") +
      (p.forward ? '<section class="card"><h2>' + t({ ko: "시장 내재 1년 선물환", en: "Market-implied 1-year forward" }) + "</h2>" +
        '<div class="now-row">' + statBox({ ko: "1년 뒤 선물환", en: "1-year forward" }, num(p.forward.value, me.digits), t({ ko: "지금 대비 " + num(p.forward.chg, 2, true) + "%", en: num(p.forward.chg, 2, true) + "% vs. now" })) +
        statBox({ ko: "정책금리", en: "Policy rates" }, num(p.forward.i_base, 2) + "% / " + num(p.forward.i_quote, 2) + "%", t({ ko: p.forward.base.ko + " / " + p.forward.quote.ko, en: p.forward.base.en + " / " + p.forward.quote.en })) + "</div>" +
        '<p class="note">' + t({ ko: "두 나라 금리 차이만큼 선물환이 현물과 달라집니다(금리평형). 금리가 높은 통화가 선물환에서 약하게 매겨지는 것은 '예상'이라기보다 이자 차이를 맞추는 계산이며, 실제 환율이 이 값을 따라간다는 보장은 없습니다. 정책금리로 근사했습니다.",
          en: "The forward differs from spot by the interest-rate gap (interest parity). A higher-yielding currency trades weaker forward to offset the interest, not as a forecast; spot need not follow. Approximated with policy rates." }) + "</p></section>" : "") +
      (p.forecasts && p.forecasts.length ? '<section class="card"><h2>' + t({ ko: "기관 전망", en: "Institutional forecasts" }) + '</h2><p class="sub">' +
      t({ ko: "공식 기관과 주요 투자은행이 발표한 전망입니다. '지금 대비'는 최근 가격 " + num(p.ref_price, me.digits) + " 기준입니다.", en: "Forecasts from official agencies and major banks. 'vs. now' uses the latest price, " + num(p.ref_price, me.digits) + "." }) + "</p>" +
      '<div class="tbl"><table class="fc"><thead><tr><th>' + t({ ko: "기관", en: "Source" }) + "</th><th>" + t({ ko: "시점", en: "Horizon" }) + '</th><th class="n">' + t({ ko: "전망", en: "Forecast" }) + '</th><th class="n">' + t({ ko: "지금 대비", en: "vs. now" }) + "</th></tr></thead><tbody>" + fc + "</tbody></table></div>" +
      '<p class="note">' + t({ ko: "'자동 갱신'은 매일 업데이트 때 새 발표를 읽어 옵니다. 나머지는 원문 기사·보고서에서 숫자와 날짜를 확인해 넣은 것이라 새 전망이 나오면 수동으로 갱신해야 합니다. 기관 전망은 자주 바뀌고 서로 크게 다릅니다.",
        en: "'Auto' items are re-read on each daily update. Others were checked against the original article or report and need manual updates. Forecasts change often and differ widely." }) + "</p></section>" : "") +
      (p.remarks && p.remarks.length ? '<section class="card"><h2>' + t({ ko: "전문가·당국 발언", en: "Expert and official remarks" }) + '</h2><ul class="remarks">' +
        p.remarks.map(function (r) {
          return '<li><div class="rm-top"><b>' + t(r.who) + '</b><span class="rm-date">' + esc(r.date) + "</span></div><p>" + t(r.text) + "</p>" +
            '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + t({ ko: "출처: ", en: "Source: " }) + esc(r.src) + "</a></li>";
        }).join("") + "</ul>" +
        '<p class="note">' + t({ ko: "원문 기사에서 날짜와 내용을 확인해 짧게 요약했습니다. 새 발언이 나오면 갱신합니다.", en: "Summarized from the original articles with dates checked. Updated as new remarks come out." }) + "</p></section>" : "") +
      '<section class="card"><h2>' + t({ ko: "통계", en: "Statistics" }) + '</h2><div class="stgrid"><div class="tbl"><table class="kv"><thead><tr><th>' + t({ ko: "기간 수익률 (월평균 기준)", en: "Returns (monthly avg)" }) + '</th><th class="n"></th></tr></thead><tbody>' + stRows + "</tbody></table></div>" +
      '<div class="tbl"><table class="kv"><thead><tr><th>' + t({ ko: "위험과 장기 기록", en: "Risk and long-run record" }) + '</th><th class="n"></th></tr></thead><tbody>' + risk + "</tbody></table></div></div></section>" +
      '<section class="card"><h2>' + t({ ko: "신호 공식 폴더", en: "Signal folders" }) + '</h2><p class="sub">' + t({ ko: "위 '우리 공식'은 아래 " + n + "개 공식을 과거 적중률만큼 가중해 합친 결과입니다.", en: "Our blend weights these " + n + " formulas by their past hit rates." }) + '</p><div class="folders">' + cards + "</div></section>" +
      "<footer><p>" + t({ ko: "출처: " + me.src.ko + ". 기관 전망은 표의 각 출처.", en: "Sources: " + me.src.en + ". Forecasts: see each row." }) + "</p><p>" +
      t({ ko: "과거 데이터로 계산한 통계와 확률이며 미래 수익을 보장하지 않습니다. 투자 권유가 아닙니다.", en: "Statistics and odds from historical data; no guarantee of future returns. Not investment advice." }) + "</p></footer>";
  }

  // 연준이 금리를 올리거나 내린 날 이 자산·환율이 어떻게 움직였나 (meetings.py)
  function reactionHtml(p) {
    var r = p.fed_reaction, me = p.meta;
    var h2 = '<section class="card"><h2>' + t({ ko: "연준 결정일 시장 반응", en: "Market reaction on Fed decision days" }) + "</h2>";
    if (!r) {
      if (p.asset === "sp") return h2 + '<p class="sub">' + t({ ko: "S&P 500은 무료로 쓸 수 있는 일별 자료가 최근 1년뿐이라 계산하지 않았습니다.", en: "Not computed for the S&P 500: free daily data only covers the past year." }) + "</p></section>";
      return "";
    }
    var pc = function (v) { return v == null ? "–" : num(v, 2, true) + "%"; };
    var row = function (lab, x) {
      if (!x) return "";
      return '<tr><td class="nw">' + t(lab) + '</td><td class="n">' + x.n + '</td><td class="n">' + pc(x.d1) + '</td><td class="n">' + pc(x.d5) + '</td><td class="n">' + pct(x.up5) + "</td></tr>";
    };
    var nmK = me.name.ko, nmE = me.name.en;
    var recent = (r.recent || []).map(function (e) {
      return '<tr><td class="nw">' + esc(e.d) + '</td><td class="nw">' + chip(e.dir, false) + ' <span class="lab">' + (e.bp > 0 ? "+" : "−") + Math.abs(e.bp) + "bp</span></td>" + '<td class="n">' + pc(e.d1) + '</td><td class="n">' + pc(e.d5) + "</td></tr>";
    }).join("");
    var nxK = r.next_fed ? " 다음 연준 결정은 " + r.next_fed + "입니다." : "", nxE = r.next_fed ? " Next Fed decision: " + r.next_fed + "." : "";
    return h2 + '<p class="sub">' + t({ ko: r.since.slice(0, 4) + "년 이후 연준이 금리를 바꾼 날, 발표 직전 가격에서 다음 날과 5영업일 뒤까지 " + josa(nmK, "이", "가") + " 얼마나 움직였는지입니다." + nxK,
        en: "Since " + r.since.slice(0, 4) + ": how " + nmE + " moved from just before each Fed rate change to the next day and five trading days later." + nxE }) + "</p>" +
      '<div class="tbl"><table class="cmp"><thead><tr><th></th><th class="n">' + t({ ko: "횟수", en: "Times" }) + '</th><th class="n">' + t({ ko: "다음 날 평균", en: "Next day avg" }) + '</th><th class="n">' + t({ ko: "5일 평균", en: "5-day avg" }) + '</th><th class="n">' + t({ ko: "5일 뒤 상승 비율", en: "Up after 5 days" }) + "</th></tr></thead><tbody>" +
      row({ ko: "연준 인상", en: "Fed hike" }, r.hike) + row({ ko: "연준 인하", en: "Fed cut" }, r.cut) + "</tbody></table></div>" +
      (recent ? '<details class="rx-more"><summary>' + t({ ko: "최근 8번 보기", en: "Last 8 decisions" }) + '</summary><div class="tbl"><table class="cmp"><thead><tr><th>' + t({ ko: "발표일", en: "Date" }) + "</th><th>" + t({ ko: "결정", en: "Move" }) + '</th><th class="n">' + t({ ko: "다음 날", en: "Next day" }) + '</th><th class="n">' + t({ ko: "5일 뒤", en: "5 days" }) + "</th></tr></thead><tbody>" + recent + "</tbody></table></div></details>" : "") +
      '<p class="note">' + t({ ko: (p.pair ? "+는 " + nmK + " 숫자가 오른 것입니다. " : "") +
        (r.basis === "ecb_fix" ? "환율은 유럽중앙은행 기준환율(유럽 오후 2시 15분, 연준 발표 전)을 써서 발표일 값을 '발표 전'으로 봅니다. " : "가격은 미국 종가라 발표 전날 종가를 '발표 전'으로 봅니다. ") +
        "결정은 대부분 미리 예상돼 가격에 반영돼 있어서, 평균 움직임은 작고 방향도 자주 엇갈립니다. 긴급 인하(2001·2008·2020년 등)처럼 위기 때의 결정이 평균을 크게 끌어당길 수 있습니다.",
        en: (p.pair ? "+ means " + nmE + " rose. " : "") +
        (r.basis === "ecb_fix" ? "FX uses the ECB reference rate (2:15pm CET, before the Fed), so the decision-day fix counts as 'before'. " : "Prices are US closes, so the prior close counts as 'before'. ") +
        "Most decisions are expected and already priced in, so average moves are small and often mixed. Crisis cuts (2001, 2008, 2020) can pull the averages a lot." }) + "</p></section>";
  }

  // 중국: 월별 실업률이 없고 물가안정목표제가 아니라서 공식 폴더를 만들지 않는다
  function cnProNote() {
    var c = data.cn, n = c.now;
    return '<p class="pro-note"><span class="pro-badge">PRO</span> ' + t(UI.proPreview) + " · " + t(UI.proIntro) + "</p>" + regionSwitch() +
      '<section class="card"><h2>' + t({ ko: "중국에는 경제학자 폴더가 없습니다", en: "No economist folders for China" }) + "</h2>" +
      '<p class="lead-p">' + t({ ko: "경제학자 공식들은 '물가가 목표보다 높으면 올리고, 경기가 식으면 내린다'는 중앙은행을 전제로 합니다. 인민은행은 그렇게 움직이지 않아서, 공식으로 채점하면 의미 없는 숫자가 나옵니다.",
        en: "The economists' formulas assume a central bank that hikes when inflation runs above target and cuts when the economy cools. The PBoC doesn't work that way, so scoring formulas against it would produce meaningless numbers." }) + "</p>" +
      '<ul class="plain">' +
      "<li>" + t({ ko: "물가안정목표제가 아닙니다. 정부의 성장률 목표, 고용, 부동산·금융 안정, 위안화 환율을 함께 보고 결정합니다.",
        en: "It isn't an inflation targeter. Decisions weigh the government's growth target, jobs, property and financial stability, and the yuan." }) + "</li>" +
      "<li>" + t({ ko: "수단이 여러 개입니다. 1년 대출우대금리(LPR, 지금 " + num(n.base) + "%), 7일 역레포 금리, 지급준비율, 정책 대출(MLF)을 섞어 쓰고, 정해진 회의 일정도 없습니다.",
        en: "It has many tools: the 1-year LPR (now " + num(n.base) + "%), the 7-day reverse repo, reserve requirements and policy loans (MLF), with no fixed meeting calendar." }) + "</li>" +
      "<li>" + t({ ko: "공식에 넣을 월별 실업률이 공개되지 않습니다(도시 조사 실업률은 변동이 거의 없고 국제 데이터베이스에도 없습니다).",
        en: "There's no usable monthly unemployment series to feed the formulas (the surveyed urban rate barely moves and isn't in international databases)." }) + "</li></ul>" +
      '<div class="btn-row"><button type="button" class="refresh" data-tab="cn">' + t({ ko: "중국 탭 보기", en: "Open the China tab" }) + "</button></div></section>" +
      "<footer><p>" + t(UI.disc1) + "</p></footer>";
  }

  // ---------- 홍콩 탭 ----------
  function hkView(h) {
    var n = h.now, odds = data.odds && data.odds.lead && data.odds.lead.p;
    var sub = n.last_change ? t({ ko: "마지막 변경 {m} · {a}% → {b}%", en: "Last change {m} · {a}% → {b}%" },
      { m: n.last_change.month, a: num(n.last_change.from), b: num(n.last_change.to) }) : t({ ko: "홍콩금융관리국 기준금리", en: "HKMA base rate" });
    var same = n.implied != null && Math.abs(n.base - n.implied) < 0.01;
    var reasons = (h.reasons || []).map(function (r) { return "<li>" + t(r) + "</li>"; }).join("");
    var fed = odds ? t({ ko: "연준 다음 결정 전망: 인상 " + pct(odds[2]) + " · 동결 " + pct(odds[1]) + " · 인하 " + pct(odds[0]) + ". 연준이 움직이면 홍콩 기준금리도 같은 폭으로 따라갑니다.",
                        en: "Fed's next decision: hike " + pct(odds[2]) + " · hold " + pct(odds[1]) + " · cut " + pct(odds[0]) + ". When the Fed moves, Hong Kong's base rate follows by the same amount." }) : "";
    return '<section class="card hero"><div class="eyebrow">' + t({ ko: "홍콩 기준금리 · {d} 기준", en: "Hong Kong base rate · as of {d}" }, { d: n.base_asof }) + "</div>" +
      '<div class="big"><b>' + num(n.base) + "%</b><span>" + sub + "</span></div>" +
      '<div class="range">' + t(same ? { ko: "연준 목표 하단 " + num(n.fed_lower) + "% + 0.5%p와 같음 → 연준을 그대로 따라가는 중", en: "Equals Fed lower bound " + num(n.fed_lower) + "% + 0.5pp → tracking the Fed" }
                                     : { ko: "연준 공식값 " + num(n.implied) + "%보다 높음 → 은행 간 금리(HIBOR)를 따른 상태", en: "Above the Fed formula " + num(n.implied) + "% → set by HIBOR" }) + "</div>" +
      (reasons ? "<ul>" + reasons + "</ul>" : "") + "</section>" +
      '<section class="card"><h2>' + t({ ko: "연준과의 연결", en: "The link to the Fed" }) + "</h2>" +
      '<div class="now-row">' +
      statBox({ ko: "연준 목표범위 하단", en: "Fed target lower bound" }, n.fed_lower == null ? "–" : num(n.fed_lower) + "%") +
      statBox({ ko: "연준 공식값 (하단 + 0.5%p)", en: "Fed formula (lower + 0.5pp)" }, n.implied == null ? "–" : num(n.implied) + "%") +
      statBox({ ko: "HIBOR 1개월", en: "1-month HIBOR" }, n.hibor1m == null ? "–" : num(n.hibor1m) + "%") +
      (n.match != null ? statBox({ ko: "공식과 같았던 달", en: "Months matching the formula" }, pct(n.match), t({ ko: "2008년 4월 이후", en: "Since April 2008" })) : "") +
      "</div>" + (fed ? '<p class="note">' + fed + ' <button type="button" class="linkbtn" data-tab="overview">' + t({ ko: "미국 연준 전망 보기 →", en: "See the Fed outlook →" }) + "</button></p>" : "") +
      hkAbout() + "</section>" +
      '<section class="card"><h2>' + t(UI.keyInds) + '</h2><p class="sub">' +
      t({ ko: "홍콩 경기와 금융 상황을 보여 주는 지표입니다. 기준금리를 직접 움직이지는 않지만, HIBOR와 환율은 연동이 얼마나 팽팽한지 보여 줍니다. 카드를 누르면 최근 12개월 그래프가 열립니다.",
          en: "Gauges of Hong Kong's economy and money markets. They don't set the base rate, but HIBOR and the currency show how tight the peg is. Tap a card for its 12-month chart." }) + '</p><div class="tiles">' + tileGrid(h.tiles, "hk") + "</div>" +
      (h.missing && h.missing.length ? '<p class="note">' + t({ ko: "이번 갱신에서는 홍콩 통계처 접속이 막혀 " + josa(h.missing.map(function (k) { return { core: "기조 물가", ur: "실업률", cpi: "소비자물가" }[k]; }).join("·"), "을", "를") + " 빼고 보여 줍니다. 다음 갱신 때 다시 시도합니다.",
        en: "Hong Kong's statistics department couldn't be reached this time, so " + h.missing.map(function (k) { return { core: "underlying inflation", ur: "unemployment", cpi: "CPI" }[k]; }).join(" and ") + " are left out. They'll be retried next update." }) + "</p>" : "") + "</section>" +
      '<section class="card"><h2>' + t({ ko: "홍콩 기준금리 vs 연준 공식값", en: "HK base rate vs. Fed formula" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "두 선이 거의 겹칩니다. 벌어진 곳은 은행 간 금리(HIBOR)가 더 높아 그쪽을 따른 시기입니다.", en: "The lines almost overlap. Gaps are periods when HIBOR was higher and set the rate." }) + "</p>" + specChart("hk-base") + "</section>" +
      '<section class="card"><h2>' + t({ ko: "HIBOR vs 미국 기준금리", en: "HIBOR vs. US policy rate" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "HIBOR가 미국 금리보다 많이 낮으면 홍콩달러를 팔고 달러를 사려는 수요가 생겨 환율이 약세 끝(7.85)으로 밀립니다. 그때 HKMA가 개입하면 HIBOR가 올라갑니다.",
        en: "When HIBOR sits well below US rates, selling HKD for USD pays, pushing the currency to the weak end (7.85). HKMA intervention then lifts HIBOR." }) + "</p>" + specChart("hk-hibor") + "</section>" +
      "<footer><p>" + t({ ko: "출처: 홍콩금융관리국(HKMA), 홍콩 통계처(C&SD), FRED.", en: "Sources: Hong Kong Monetary Authority, Census and Statistics Department, FRED." }) + "</p><p>" + t(UI.disc1) + "</p></footer>";
  }
  function hkAbout() {
    return detailsBlock({ ko: "왜 홍콩은 연준을 따라가나요?", en: "Why does Hong Kong follow the Fed?" }, [
      [{ ko: "연계환율제", en: "The currency peg" },
       { ko: "홍콩은 1983년부터 1달러를 7.8홍콩달러 안팎(현재 7.75~7.85)에 묶어 두고 있습니다. 환율을 고정하면 금리를 따로 정할 수 없습니다. 금리가 미국과 다르면 돈이 한쪽으로 쏠려 환율이 버티지 못하기 때문입니다.",
         en: "Since 1983 Hong Kong has pegged its currency near HK$7.8 per US dollar (now 7.75–7.85). With a fixed exchange rate it can't set its own rates: if rates differ from the US, money flows one way and the peg can't hold." }],
      [{ ko: "기준금리 공식", en: "The base-rate formula" },
       { ko: "2008년 3월부터 기준금리는 '연준 목표범위 하단 + 0.5%p'와 '익일·1개월 HIBOR 5일 평균' 중 높은 쪽입니다. 그 전에는 연준 목표금리 + 1.5%p였습니다.",
         en: "Since March 2008 the base rate is the higher of 'Fed target lower bound + 0.5pp' and the 5-day average of overnight and 1-month HIBOR. Before that it was the Fed target + 1.5pp." }],
      [{ ko: "읽는 법", en: "How to read it" },
       { ko: "홍콩 기준금리를 예상하려면 연준을 보면 됩니다. 홍콩만의 변수는 HIBOR입니다. HIBOR는 은행 간 자금 사정(대형 공모주 청약, 연말 자금 수요 등)에 따라 미국 금리와 크게 벌어지기도 합니다.",
         en: "To forecast Hong Kong's base rate, watch the Fed. The local wildcard is HIBOR, which can drift far from US rates with interbank liquidity (big IPOs, year-end demand)." }],
      [{ ko: "한계", en: "Limits" },
       { ko: "이 탭은 판단을 내리지 않고 연결 구조를 보여 줍니다. 홍콩 은행들의 대출 금리(프라임 금리)는 기준금리와 따로 움직일 수 있습니다.",
         en: "This tab shows the linkage rather than making a call. Banks' prime lending rates can move separately from the base rate." }],
    ]);
  }

  // ---------- 싱가포르 탭 ----------
  function sgView(g) {
    var n = g.now, lm = n.last_move;
    var reasons = (g.reasons || []).map(function (r) { return "<li>" + t(r) + "</li>"; }).join("");
    var dec = g.decisions.map(function (d) {
      return "<tr><td>" + esc(d.date) + "</td><td>" + chip(d.dir, true) + "</td><td>" + t(d.text) + "</td></tr>";
    }).join("");
    var SW = { ko: SIG_ST.ko, en: SIG_ST.en };
    return '<section class="card hero"><div class="eyebrow">' + t({ ko: "싱가포르 통화청(MAS) · 최근 결정 {d}", en: "Monetary Authority of Singapore · latest decision {d}" }, { d: n.last.date }) + "</div>" +
      '<div class="big"><b>' + t({ ko: SW.ko[String(n.last.dir)], en: SW.en[String(n.last.dir)] }) + "</b><span>" + t(n.last.text) + "</span></div>" +
      '<div class="range">' + (lm ? t({ ko: "마지막 조정 " + lm.date + " · " + lm.text.ko, en: "Last change " + lm.date + " · " + lm.text.en }) : "") +
      (n.next ? " · " + t({ ko: "다음 정기 발표 " + n.next + " (예정)", en: "Next scheduled statement " + n.next }) : "") + "</div>" +
      (reasons ? "<ul>" + reasons + "</ul>" : "") + "</section>" +
      '<section class="card"><h2>' + t({ ko: "금리가 아니라 환율로", en: "Policy via the exchange rate" }) + "</h2>" +
      '<div class="now-row">' +
      statBox({ ko: "MAS 근원물가", en: "MAS core inflation" }, num(n.core) + "%", t({ ko: n.core_asof + " · 기준 2% 바로 아래", en: n.core_asof + " · reference just under 2%" })) +
      statBox({ ko: "싱가포르 1년 단기채", en: "SGS 1-yr T-bill" }, n.tbill1y == null ? "–" : num(n.tbill1y) + "%") +
      statBox({ ko: "미국 기준금리 (범위 중간)", en: "US policy rate (midpoint)" }, n.us == null ? "–" : num(n.us) + "%") +
      "</div>" + sgAbout() + "</section>" +
      '<section class="card"><h2>' + t({ ko: "최근 MAS 결정", en: "Recent MAS decisions" }) + '</h2><div class="tbl"><table class="dec"><thead><tr><th>' +
      t({ ko: "발표일", en: "Date" }) + "</th><th>" + t({ ko: "방향", en: "Direction" }) + "</th><th>" + t({ ko: "내용", en: "What changed" }) + "</th></tr></thead><tbody>" + dec + "</tbody></table></div>" +
      '<p class="note">' + t(g.decisions_auto ? { ko: "MAS 웹사이트의 결정 표를 매일 자동으로 읽어 갱신합니다. ", en: "Updated daily from MAS's published decision table. " }
        : { ko: "MAS 결정 표를 자동으로 읽지 못해 저장된 기록(" + g.decisions[0].date + "까지)을 보여 줍니다. ", en: "Couldn't read MAS's decision table, so this shows the stored record (through " + g.decisions[0].date + "). " }) +
      t({ ko: "출처: MAS 과거 통화정책 결정 표. 조이기 = 절상 속도 높임·밴드 중심 위로, 풀기 = 절상 속도 낮춤·0%·중심 아래로·밴드 넓힘.",
        en: "Source: MAS past monetary policy decisions. Tighten = faster appreciation or band re-centred up; ease = slower or 0% appreciation, re-centred down, or a wider band." }) +
      ' <a href="' + esc(g.decisions_url) + '" target="_blank" rel="noopener">mas.gov.sg</a></p></section>' +
      '<section class="card"><h2>' + t(UI.keyInds) + '</h2><p class="sub">' +
      t({ ko: "MAS 결정에 직접적인 지표입니다. 한 달 전과 비교했습니다. 카드를 누르면 최근 12개월 그래프가 열립니다.",
          en: "Indicators that matter most for MAS, versus a month earlier. Tap a card for its 12-month chart." }) + '</p><div class="tiles">' + tileGrid(g.tiles, "sg") + "</div></section>" +
      (g.areas && g.areas.length ? '<section class="card"><h2>' + t({ ko: "무엇이 MAS 결정을 움직이나", en: "What drives MAS decisions" }) + '</h2><p class="sub">' +
        t({ ko: "각 영역이 평소(2010~2019년)보다 얼마나 벗어났는지입니다. 긴축 압력 = 싱가포르달러를 더 빨리 절상할(조일) 쪽입니다.",
            en: "How far each area sits from normal (2010–2019). Tightening pressure = toward faster appreciation of the Singapore dollar." }) + "</p>" + areaChart(g.areas, true) + "</section>" : "") +
      '<section class="card"><h2>' + t({ ko: "MAS 근원물가 vs 기준 2%", en: "MAS core inflation vs. 2%" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "근원물가가 2%보다 한참 높을 때 MAS는 대체로 조였고, 한참 낮을 때 풀었습니다. 다만 경기가 나쁘면 물가가 높아도 기다리는 경우가 많았습니다.", en: "MAS mostly tightened when core inflation ran well above 2% and eased when it ran well below, but often waited when growth was weak." }) + "</p>" + specChart("sg-core") + "</section>" +
      '<section class="card"><h2>' + t({ ko: "싱가포르 금리 vs 미국 기준금리", en: "Singapore vs. US rates" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "싱가포르 금리는 MAS가 정하지 않고 시장에서 정해집니다. 보통 미국 금리에서 시장이 예상하는 싱가포르달러 절상 폭만큼 낮습니다.",
        en: "MAS doesn't set Singapore's rates; markets do. They usually sit below US rates by roughly the appreciation markets expect." }) + "</p>" + specChart("sg-rates") + "</section>" +
      "<footer><p>" + t({ ko: "출처: 싱가포르 통화청(MAS), 싱가포르 통계청(SingStat), FRED. 압력 점수는 가정에 따라 달라지는 참고용 계산입니다.",
        en: "Sources: Monetary Authority of Singapore, Singapore Department of Statistics, FRED. Pressure scores are reference calculations that depend on assumptions." }) + "</p><p>" + t(UI.disc1) + "</p></footer>";
  }
  function sgAbout() {
    return detailsBlock({ ko: "MAS는 어떻게 통화정책을 하나요?", en: "How does MAS run monetary policy?" }, [
      [{ ko: "기준금리가 없습니다", en: "No policy rate" },
       { ko: "싱가포르는 수입 비중이 매우 커서 물가가 환율에 크게 좌우됩니다. 그래서 MAS는 금리 대신, 주요 교역국 통화 대비 싱가포르달러 가치(S$NEER)가 움직일 수 있는 '정책 밴드'를 정합니다.",
         en: "Singapore imports so much that prices hinge on the exchange rate. So instead of a rate, MAS sets a 'policy band' for the Singapore dollar against a basket of trading partners' currencies (S$NEER)." }],
      [{ ko: "세 가지 조절 손잡이", en: "Three dials" },
       { ko: "기울기(1년에 얼마나 절상할지), 폭(얼마나 출렁여도 되는지), 중심(밴드의 위치)입니다. 절상 속도를 높이거나 중심을 올리면 '조이기', 낮추거나 0%로 두거나 중심을 내리면 '풀기'입니다.",
         en: "Slope (how fast to appreciate per year), width (how much it may swing) and centre (where the band sits). Faster appreciation or a higher centre is tightening; slower or 0%, or a lower centre, is easing." }],
      [{ ko: "발표 일정", en: "Schedule" },
       { ko: "2023년까지는 4월·10월 두 번, 2024년부터는 1·4·7·10월 네 번 발표합니다. 급할 때는 일정 밖에서도 발표합니다(2001년 9·11 이후, 2020년 3월 등).",
         en: "Twice a year (April, October) through 2023, four times (January, April, July, October) since 2024, plus off-cycle moves in emergencies (after 9/11, March 2020)." }],
      [{ ko: "한계", en: "Limits" },
       { ko: "MAS는 기울기·폭의 정확한 숫자를 공개하지 않습니다. 그래서 '얼마나 조였는지'가 아니라 '조였는지·풀었는지'만 셉니다.",
         en: "MAS doesn't publish the exact slope or width, so we count whether it tightened or eased, not by how much." }],
    ]);
  }

  // ---------- 한국 탭 ----------
  function koreaView(k) {
    var n = k.now;
    var stat = function (label, val, sub) {
      return '<div class="stat"><div class="stat-l">' + t(label) + '</div><div class="stat-v">' + val + "</div>" + (sub ? '<div class="stat-s">' + sub + "</div>" : "") + "</div>";
    };
    var baseName = n.base_is_call ? { ko: "콜금리 (기준금리 대용)", en: "Call rate (proxy for base rate)" } : { ko: "한국은행 기준금리", en: "BOK base rate" };
    var sub = n.last_change ? t({ ko: "마지막 변경 {m} · {a}% → {b}%", en: "Last change {m} · {a}% → {b}%" },
      { m: n.last_change.month, a: num(n.last_change.from), b: num(n.last_change.to) }) : t(baseName);
    var sigTxt = n.signal == null ? null : n.signal > 0 ? { ko: "올릴 여지", en: "room to hike" } : n.signal < 0 ? { ko: "내릴 여지", en: "room to cut" } : { ko: "적정 수준", en: "about right" };
    var range = n.taylor != null
      ? t({ ko: "물가·고용으로 본 적정금리 " + num(n.taylor) + "% → " + sigTxt.ko, en: "Fair rate from inflation and jobs " + num(n.taylor) + "% → " + sigTxt.en })
      : n.us != null ? t({ ko: "미국 기준금리 " + num(n.us) + "% (범위 중간)", en: "US policy rate " + num(n.us) + "% (midpoint)" }) : "";
    var reasons = (k.reasons || []).map(function (r) { return "<li>" + t(r) + "</li>"; }).join("");
    var sp = n.spread;
    var spSub = sp == null ? "" : t(sp < 0 ? { ko: "미국이 {v}%p 더 높음", en: "US higher by {v}pp" } : sp > 0 ? { ko: "한국이 {v}%p 더 높음", en: "Korea higher by {v}pp" } : { ko: "같음", en: "Equal" }, { v: num(Math.abs(sp)) });
    var tiles = tileGrid(k.tiles, "kr");
    var spec = function (key) { var c = chartSpec(key); return lineChart(c.f, { actual: c.actual, actualName: c.actualName, diffName: c.diffName }); };
    var noTaylor = !k.series.taylor.length;
    return '<section class="card hero"><div class="eyebrow">' + t({ ko: "한국은행 기준금리 · {d} 기준", en: "Bank of Korea base rate · as of {d}" }, { d: n.base_asof }) + "</div>" +
      '<div class="big"><b>' + num(n.base) + "%</b><span>" + sub + "</span></div>" +
      '<div class="range">' + range + "</div>" + (reasons ? "<ul>" + reasons + "</ul>" : "") + "</section>" +
      '<section class="card"><h2>' + t({ ko: "금리 비교", en: "Rate comparison" }) + "</h2>" +
      '<div class="now-row">' +
      stat({ ko: "미국 기준금리 (범위 중간)", en: "US policy rate (midpoint)" }, n.us == null ? "–" : num(n.us) + "%") +
      stat({ ko: "한미 금리차 (한국 − 미국)", en: "Korea − US gap" }, sp == null ? "–" : num(sp, 2, true) + "%p", spSub) +
      (n.taylor == null ? "" : stat({ ko: "테일러 준칙 적정금리", en: "Taylor-rule rate" }, num(n.taylor) + "%", t({ ko: n.taylor_asof + " 기준 · " + sigTxt.ko, en: "As of " + n.taylor_asof + " · " + sigTxt.en }))) +
      "</div>" +
      (n.base_is_call ? '<p class="note">' + t({ ko: "한국은행 ECOS 키가 아직 없어 콜금리로 기준금리를 대신하고, 물가 지표와 테일러 준칙은 비워 두었습니다.",
        en: "No Bank of Korea ECOS key yet, so the call rate stands in for the base rate and inflation and the Taylor rule are left out." }) + "</p>" : "") +
      koreaAbout(k) + "</section>" +
      '<section class="card"><h2>' + t(UI.keyInds) + '</h2><p class="sub">' +
      t({ ko: "한국은행 금리 결정에 직접적인 지표입니다. 한 달 전과 비교했습니다. 카드를 누르면 최근 12개월 그래프가 열립니다.",
          en: "Indicators that matter most for the Bank of Korea, versus a month earlier. Tap a card for its 12-month chart." }) + '</p><div class="tiles">' + tiles + "</div></section>" +
      (k.areas && k.areas.length ? '<section class="card"><h2>' + t(UI.drivers) + '</h2><p class="sub">' +
        t({ ko: "각 영역이 평소(2010~2019년)보다 얼마나 벗어났는지입니다. 가운데 선이 평소 수준입니다.",
            en: "How far each area sits from normal (2010–2019). The center line is normal." }) + "</p>" + areaChart(k.areas) + "</section>" : "") +
      (noTaylor ? "" : '<section class="card"><h2>' + t({ ko: "기준금리 vs 테일러 준칙", en: "Base rate vs. Taylor rule" }) + "</h2>" +
        '<p class="sub">' + t({ ko: "공식 선이 위에 있으면 올릴 여지, 아래면 내릴 여지로 읽습니다.", en: "Formula above = room to hike; below = room to cut." }) + "</p>" + spec("kr-taylor") + "</section>") +
      '<section class="card"><h2>' + t({ ko: "한미 기준금리", en: "Korea vs. US policy rates" }) + "</h2>" +
      '<p class="sub">' + t({ ko: "미국 금리가 한국보다 높으면 달러로 자금이 쏠리기 쉬워 원화 약세 압력이 커집니다.",
        en: "When US rates sit above Korea's, money tends to flow to dollars, pressuring the won." }) + "</p>" + spec("kr-us") + "</section>" +
      "<footer><p>" + t({ ko: "출처: " + (k.sources.indexOf("ECOS") >= 0 ? "한국은행 경제통계시스템(ECOS), " : "") + "FRED. 테일러 준칙과 압력 점수는 가정에 따라 달라지는 참고용 계산입니다.",
        en: "Sources: " + (k.sources.indexOf("ECOS") >= 0 ? "Bank of Korea ECOS, " : "") + "FRED. The Taylor rule and pressure scores are reference calculations that depend on assumptions." }) + "</p><p>" + t(UI.disc1) + "</p></footer>";
  }
  function koreaAbout(k) {
    var a = k.assumptions;
    return detailsBlock({ ko: "이 숫자는 어떻게 계산하나요?", en: "How are these calculated?" }, [
      [{ ko: "어떻게 계산하나", en: "How it works" },
       { ko: "적정 금리 = 중립 실질금리(" + a.r_star + "%) + 근원물가 상승률 + 0.5 × (근원물가 − 물가목표: 2016년부터 " + a.target + "%, 그 전엔 3%) + 0.5 × 경기 과열 정도. 경기 과열 정도는 실업률이 직전 5년 평균보다 낮은 만큼으로 어림합니다(1%p 낮으면 +2%).",
         en: "Fair rate = neutral real rate (" + a.r_star + "%) + core inflation + 0.5 × (core inflation − target: " + a.target + "% since 2016, 3% before) + 0.5 × slack. Slack is approximated by how far unemployment sits below its prior 5-year average (1pp lower = +2%)." }],
      [{ ko: "읽는 법", en: "How to read it" },
       { ko: "적정 금리가 실제 기준금리보다 " + a.deadband + "%p 넘게 높으면 '올릴 여지', 낮으면 '내릴 여지'로 봅니다. 그 사이면 '적정 수준'입니다.",
         en: "If the fair rate is more than " + a.deadband + "pp above the base rate it reads 'room to hike', more than " + a.deadband + "pp below 'room to cut', otherwise 'about right'." }],
      [{ ko: "압력 점수", en: "Pressure scores" },
       { ko: "각 지표가 2010~2019년 평균에서 표준편차 몇 개만큼 벗어났는지입니다. 물가·환율(원화 약세)·미국 금리차·국고채 3년이 기준금리보다 높을수록 인상 압력, 실업률이 높을수록 인하 압력으로 봅니다.",
         en: "How many standard deviations each indicator sits from its 2010–2019 average. Higher inflation, a weaker won, a wider US gap and 3-yr KTB above the base rate read as hike pressure; higher unemployment as cut pressure." }],
      [{ ko: "한계", en: "Limits" },
       { ko: "한국은행은 물가와 고용 외에도 환율, 가계부채, 집값, 미국 금리를 크게 고려합니다. 이 공식은 그런 요인을 담지 않으며, 중립금리와 경기 과열 정도도 추정치라 실제 결정과 차이가 클 수 있습니다.",
         en: "The Bank of Korea also weighs the exchange rate, household debt, house prices and US rates. This formula leaves those out, and the neutral rate and slack are estimates, so it can differ a lot from actual decisions." }],
    ]);
  }

  function folderDetail(f) {
    var n = f.now, s = f.score, r = f.score_recent;
    var stat = function (label, val, sub) {
      return '<div class="stat"><div class="stat-l">' + t(label) + '</div><div class="stat-v">' + val + "</div>" + (sub ? '<div class="stat-s">' + sub + "</div>" : "") + "</div>";
    };
    return '<button type="button" class="back" data-back>' + t(UI.back) + "</button>" +
      '<section class="card"><div class="eyebrow">' + t(f.who) + (f.year ? " · " + f.year : "") + "</div>" +
      '<h2 class="f-title">' + t(f.name) + "</h2><p class=\"sub\">" + t(f.idea) + "</p>" +
      aboutBlock(f) +
      '<div class="now-row">' +
      (stLike(regionOf(f.key))
        ? stat(regionOf(f.key).mode === "asset" ? { ko: "지금 신호 강도", en: "Signal strength now" } : { ko: "지금 긴축 압력", en: "Tightening pressure now" }, num(n.rec, 2, true),
               t(regionOf(f.key).mode === "asset" ? { ko: "±0.5를 넘으면 상승·하락 신호", en: "Beyond ±0.5 = rise/fall signal" } : { ko: "±0.5를 넘으면 조이기·풀기 신호", en: "Beyond ±0.5 = tighten/ease signal" })) +
          stat(UI.signalNow, chip(n.signal))
        : stat(UI.recNow, num(n.rec) + "%") + stat(UI.rateNow, num(n.rate) + "%") + stat(UI.signalNow, chip(n.signal))) + "</div></section>" +
      '<section class="card"><h2>' + t({ ko: "성적표", en: "Track record" }) + '</h2><div class="stats">' +
      stat(UI.sAll, pctOrDash(s.hit)) + stat(UI.sRecent, pctOrDash(r.hit)) +
      stat(regionOf(f.key).mode === "asset" ? { ko: "'상승·하락' 신호 적중", en: "When it said rise/fall" } : regionOf(f.key).mode === "stance" ? { ko: "'조이기·풀기' 신호 적중", en: "When it said tighten/ease" } : UI.sMove, pctOrDash(s.move_hit), t(UI.sMoveN, { n: s.move_n })) +
      (f.mae != null ? stat(UI.sMae, num(f.mae) + "%p") : "") + "</div>" +
      '<p class="note">' + howScoredTxt(regionOf(f.key)) + "</p></section>" +
      '<section class="card"><h2>' + t(regionOf(f.key).mode === "asset" ? { ko: "신호 vs 실제 가격 방향", en: "Signal vs. actual price direction" } : regionOf(f.key).mode === "stance" ? UI.chartTSt : UI.chartT) + "</h2>" +
      (regionOf(f.key).mode === "asset" ? '<p class="sub">' + t({ ko: "공식 선이 +0.5 위면 상승, −0.5 아래면 하락 신호입니다. 실제 선은 그 뒤 6개월 동안 가격이 " + regionOf(f.key).meta.thresh + "% 넘게 올랐으면 +1, 내렸으면 −1입니다.",
        en: "Formula above +0.5 = rise signal, below −0.5 = fall. The actual line is +1 if the price rose more than " + regionOf(f.key).meta.thresh + "% over the next six months, −1 if it fell that much." }) + "</p>" :
      regionOf(f.key).mode === "stance" ? '<p class="sub">' + t({ ko: "공식 선이 +0.5 위면 조이기, −0.5 아래면 풀기 신호입니다. 실제 선은 그 뒤 6개월 안 MAS가 실제로 조였으면 +1, 풀었으면 −1입니다.",
        en: "Formula above +0.5 = tighten signal, below −0.5 = ease. The actual line is +1 if MAS tightened within the next six months, −1 if it eased." }) + "</p>" : "") +
      lineChart(f) + "</section>" +
      "<footer><p>" + proDisc() + "</p></footer>";
  }

  // ---------- 비밀번호 재설정 (Supabase: 메일 링크 → 이 앱 주소#access_token…&type=recovery → 새 비밀번호) ----------
  var RESET_URL = window.FED_RESET_URL || "https://wj08kim-arch.github.io/fed-rate-data/app/";
  function readRecoveryLink() {
    var h = location.hash || "";
    if (h.indexOf("type=recovery") < 0 && h.indexOf("error_code=") < 0) return;
    var q = {};
    h.replace(/^#/, "").split("&").forEach(function (kv) { var i = kv.indexOf("="); if (i > 0) q[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")); });
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}  // 토큰을 주소창·기록에 남기지 않는다
    if (q.access_token && q.type === "recovery") auth.recovery = { access_token: q.access_token, refresh_token: q.refresh_token, expires_in: +q.expires_in || 3600 };
    else if (q.error_code) { auth.step = "forgot"; auth.msg = { ko: "비밀번호 재설정 링크가 만료됐거나 이미 사용됐습니다. 아래에서 다시 요청하세요.", en: "That reset link has expired or was already used. Request a new one below." }; }
 }
  function acctOn() { return serverOn() && (!!auth.recovery || auth.step === "forgot"); }
  function acctView() {
    var msg = auth.msg ? '<p class="note' + (auth.msgOk ? "" : " warn") + '">' + t(auth.msg) + "</p>" : "", body, title, sub;
    if (auth.recovery) {
      title = { ko: "새 비밀번호 정하기", en: "Set a new password" };
      sub = { ko: "새로 쓸 비밀번호를 두 번 입력하세요 (6자 이상).", en: "Enter your new password twice (6+ characters)." };
      body = '<form class="authf" data-authform="newpw">' +
        "<label>" + t({ ko: "새 비밀번호", en: "New password" }) + "</label>" +
        '<input name="password" type="password" minlength="6" required autocomplete="new-password">' +
        "<label>" + t({ ko: "한 번 더", en: "Repeat" }) + "</label>" +
        '<input name="password2" type="password" minlength="6" required autocomplete="new-password">' +
        '<div class="btn-row"><button type="submit" class="refresh gate-go"' + (auth.busy ? " disabled" : "") + ">" + t(auth.busy ? { ko: "바꾸는 중…", en: "Saving…" } : { ko: "비밀번호 바꾸기", en: "Change password" }) + "</button></div></form>";
    } else {
      title = { ko: "비밀번호 찾기", en: "Forgot password" };
      sub = { ko: "가입한 이메일을 넣으면 비밀번호를 새로 정하는 링크를 보내 드립니다. 메일이 안 보이면 스팸함도 확인하세요.", en: "Enter your sign-up email and we'll send a link to set a new password. Check spam if you don't see it." };
      body = '<form class="authf" data-authform="forgot">' +
        "<label>" + t({ ko: "이메일", en: "Email" }) + "</label>" +
        '<input name="email" type="email" autocomplete="email" required placeholder="name@example.com" value="' + esc(auth.email) + '">' +
        '<div class="btn-row"><button type="submit" class="refresh gate-go"' + (auth.busy ? " disabled" : "") + ">" + t(auth.busy ? { ko: "보내는 중…", en: "Sending…" } : { ko: "재설정 메일 보내기", en: "Send reset email" }) + "</button>" +
        '<button type="button" class="linkbtn" data-auth="tosignin">' + t({ ko: "로그인으로 돌아가기", en: "Back to sign in" }) + "</button></div></form>";
    }
    return '<div class="wrap gate"><div class="gate-top">' + langsw() + "</div>" +
      '<section class="card gate-card"><h1>' + t(title) + "</h1>" + '<p class="sub">' + t(sub) + "</p>" + body + msg + "</section></div>";
  }
  function forgotLink() { return '<button type="button" class="linkbtn" data-auth="toforgot">' + t({ ko: "비밀번호를 잊었어요", en: "Forgot password?" }) + "</button>"; }
  function recoverySubmit(form) {
    var kind = form.dataset.authform;
    auth.msg = null; auth.msgOk = false;
    if (kind === "forgot") {
      auth.email = form.querySelector('[name="email"]').value.trim();
      auth.busy = true; render();
      sbFetch("/auth/v1/recover?redirect_to=" + encodeURIComponent(RESET_URL), { method: "POST", body: { email: auth.email } })
        .then(function (r) {
          auth.busy = false;
          if (r.ok) { auth.msgOk = true; auth.msg = { ko: auth.email + " 로 재설정 링크를 보냈습니다 (가입된 이메일이라면). 메일의 링크를 누르면 새 비밀번호를 정하는 화면이 열립니다. 링크는 1시간 동안만 쓸 수 있습니다.", en: "If " + auth.email + " has an account, a reset link is on its way. Open it to set a new password; it works for one hour." }; }
          else if (r.status === 429) auth.msg = { ko: "요청이 너무 잦습니다. 몇 분 뒤 다시 시도하세요.", en: "Too many requests. Try again in a few minutes." };
          else auth.msg = { ko: "메일을 보내지 못했습니다 (" + r.status + "). 잠시 뒤 다시 시도하거나 관리자에게 알려 주세요.", en: "Couldn't send the email (" + r.status + "). Try again later or tell the admin." };
          render();
        }).catch(function () { auth.busy = false; auth.msg = { ko: "인터넷 연결을 확인하세요.", en: "Check your connection." }; render(); });
      return;
    }
    var pw = form.querySelector('[name="password"]').value, pw2 = form.querySelector('[name="password2"]').value;
    if (pw !== pw2) { auth.msg = { ko: "두 비밀번호가 다릅니다.", en: "The passwords don't match." }; render(); return; }
    auth.busy = true; render();
    var rc = auth.recovery;
    sbFetch("/auth/v1/user", { method: "PUT", token: rc.access_token, body: { password: pw } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }, function () { return { ok: r.ok, status: r.status, j: {} }; }); })
      .then(function (res) {
        auth.busy = false;
        if (res.ok) {
          saveSession({ access_token: rc.access_token, refresh_token: rc.refresh_token, expires_in: rc.expires_in, user: res.j });
          auth.recovery = null; auth.step = "signin"; auth.msgOk = true;
          auth.msg = { ko: "비밀번호를 바꿨습니다. 이제 새 비밀번호로 로그인됩니다.", en: "Password changed. You're signed in with the new one." };
          return fetchServerPro().then(function (p) { pro = p; render(); }, function () { if (auth.member == null) auth.member = false; render(); });
        }
        var m = String((res.j && (res.j.msg || res.j.message || res.j.error_description)) || "");
        auth.msg = /same|different/i.test(m) ? { ko: "예전과 다른 비밀번호를 정해 주세요.", en: "Choose a password different from your old one." }
          : /weak|at least|short/i.test(m) ? { ko: "비밀번호가 너무 짧거나 약합니다.", en: "That password is too short or weak." }
          : res.status === 401 || res.status === 403 ? { ko: "링크가 만료됐습니다. 비밀번호 찾기에서 다시 요청하세요.", en: "The link expired. Request a new one." }
          : { ko: "바꾸지 못했습니다 (" + res.status + "). 다시 시도하세요.", en: "Couldn't change it (" + res.status + "). Try again." };
        if (res.status === 401 || res.status === 403) { auth.recovery = null; auth.step = "forgot"; }
        render();
      }).catch(function () { auth.busy = false; auth.msg = { ko: "인터넷 연결을 확인하세요.", en: "Check your connection." }; render(); });
  }

  // 휴대폰 웹앱 잠금 (app/web/build.py가 window.FED_GATE=true를 넣는다): 로그인해야 화면이 열린다.
  // 무료 계정은 무료 화면, PRO 회원(pro_members)은 PRO 폴더까지. 화면만 가리는 장치라 공개 데이터 파일 자체를 숨기지는 않는다.
  function gateOn() { return !!window.FED_GATE && serverOn() && !(auth.session && auth.member != null); }
  function gateView() {
    var s = auth.session, msg = auth.msg ? '<p class="note warn">' + t(auth.msg) + "</p>" : "", body;
    var signup = auth.step === "signup";
    if (s) {
      body = '<p class="lead-p">' + t({ ko: "확인 중…", en: "Checking…" }) + "</p>";
    } else {
      body = '<form class="authf" data-authform="' + (signup ? "signup" : "signin") + '">' +
        "<label>" + t({ ko: "이메일", en: "Email" }) + "</label>" +
        '<input name="email" type="email" autocomplete="email" required placeholder="name@example.com" value="' + esc(auth.email) + '">' +
        "<label>" + t(signup ? { ko: "비밀번호 (6자 이상)", en: "Password (6+ characters)" } : { ko: "비밀번호", en: "Password" }) + "</label>" +
        '<input name="password" type="password" minlength="6" required autocomplete="' + (signup ? "new-password" : "current-password") + '">' +
        '<div class="btn-row"><button type="submit" class="refresh gate-go"' + (auth.busy ? " disabled" : "") + ">" +
        t(auth.busy ? { ko: "확인 중…", en: "Checking…" } : signup ? { ko: "가입하고 들어가기", en: "Sign up and enter" } : { ko: "들어가기", en: "Enter" }) + "</button>" +
        '<button type="button" class="linkbtn" data-auth="' + (signup ? "tosignin" : "tosignup") + '">' +
        t(signup ? { ko: "이미 계정이 있어요", en: "I have an account" } : { ko: "처음이에요 (무료 가입)", en: "New here? Sign up free" }) + "</button>" + (signup ? "" : forgotLink()) + "</div></form>";
    }
    return '<div class="wrap gate"><div class="gate-top">' + langsw() + "</div>" +
      '<section class="card gate-card"><h1>' + t(UI.title) + "</h1>" +
      '<p class="sub">' + t({ ko: "로그인하면 무료 화면을 볼 수 있습니다. 경제학자·자산·환율 폴더는 PRO 회원만 열립니다.", en: "Sign in to see the free screens. Economist, asset and currency folders are for PRO members." }) + "</p>" + body + msg + "</section></div>";
  }
  function render() {
    if (acctOn()) { app.innerHTML = acctView(); setLang(root.lang); return; }
    if (gateOn()) { app.innerHTML = gateView(); setLang(root.lang); return; }
    var body;
    if (window.__FED_ALL__ && pro) {
      // 공유용 PDF: 오늘의 전망 + PRO 요약 + 폴더 전체를 한 문서에
      body = overview() + '<div class="pg">' + proOverview() + "</div>" +
        pro.folders.map(function (f) { return '<div class="pg">' + folderDetail(f) + "</div>"; }).join("");
    } else if (view.tab === "korea" && data.korea) {
      body = koreaView(data.korea);
    } else if (["ea", "ch", "jp", "cn"].indexOf(view.tab) >= 0 && data[view.tab]) {
      body = cbView(data[view.tab]);
    } else if (view.tab === "hk" && data.hk) {
      body = hkView(data.hk);
    } else if (view.tab === "sg" && data.sg) {
      body = sgView(data.sg);
    } else if ((view.tab === "assets" || view.tab === "pro" || view.tab === "fxpro" || view.tab === "proall") && proLocked()) {
      body = lockedView();
    } else if ((view.tab === "assets" || view.tab === "pro" || view.tab === "fxpro" || view.tab === "proall") && !pro && serverOn()) {
      body = loginView();
    } else if (view.tab === "fxpro" && pro && pro[view.fxp || "kw"]) {
      var ff = view.folder && findFolder(view.folder);
      body = ff ? folderDetail(ff) : assetOverview(pro[view.fxp || "kw"]);
    } else if (view.tab === "assets" && pro && pro[view.asset]) {
      var fa = view.folder && findFolder(view.folder);
      body = fa ? folderDetail(fa) : assetOverview(pro[view.asset]);
    } else if (view.tab === "pro" && pro) {
      var f = view.folder && findFolder(view.folder);
      body = f ? folderDetail(f) : proOverview();
    } else if (view.tab === "proall" && pro) {
      body = proAllView();
    } else if (view.tab === "calc" && data.fx) {
      body = calcView();
    } else if (view.tab === "countries" && countryList().length) {
      body = countriesView();
    } else if (view.tab === "all" && countryList().length) {
      body = allView();
    } else {
      body = overview();
    }
    app.innerHTML = '<div class="wrap">' + header(!window.__FED_DATA__) + body + "</div>";
    setLang(root.lang);
    initCharts(app);
    mountPx(app);
    if (view.tab === "calc") calcUpdate();
    // 탭이 화면 밖에 있으면 탭 줄을 옆으로 밀어 선택된 탭이 보이게 한다
    var selTab = app.querySelector('nav.tabs [aria-selected="true"]'), nav = app.querySelector("nav.tabs");
    if (selTab && nav && (selTab.offsetLeft + selTab.offsetWidth > nav.scrollLeft + nav.clientWidth || selTab.offsetLeft < nav.scrollLeft))
      nav.scrollLeft = selTab.offsetLeft - 16;
  }

  // 불러오는 동안 보여 주는 첫 화면: 앱 로고 + 이름 (app/web/icons/192.png를 그대로 넣음)
  var LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAwKADAAQAAAABAAAAwAAAAABNOznKAAAXsklEQVR4Ae1dDXhU1Zn+cieZzCQQIAkhEAKIJQGRHwkKrBhXoWuVLS6surKKtbtuqStbdVWs7j7U8rRFUeu6i7W67doHfWSrrrRUVFzwB6xADcqPCIFVjEkwARICATL5G/Z7T5w8IWQmd2bOTebcfB/PMJO5d757znve997z+52kM2zUyxYMBqm2rp4qvzpCZRVVVLJjH+0pPUjlhw5TTc0JOtXQQK2twV5OpVw+GgQ8HovS/X7Kysqg/GE5NL7wPJo6eSyNHJ5LeUMHU+bA/mRZVjQuHTk3qbcEUMFk376zlLZ9tIc+3n2AysqrqObYCQo0NhKxJC0rSQGUlJREeImZhwDurXjhBhcMcqFyMfpSUylrUAaNzM+liyaMoWlTxlPRpEIazqLoDetRAVTwHX3DphJ6fcNW2r6rlI7W1FFLayslezzk4RdIL2TvDRr03DXbBHGGn+it7WWfnTWQiiYW0jWzp9Ps4qk0nJ8YPWWOCwDKf3/bLnrhlfW0cfN2qj5SSxbf0VNSkhPiEdhTQMt1wiOAJ0RzcwsF+WkxZHAmzbqsiG6+7iqaOW2iuimG/2X8RxwTQEtLK72xcSs9s2otbSnZTY1NzZTqTRHSx19mrvYAMYS4MmPqBFp0y1y6etZ0Sk72OJJvRwSwacsOevSp1bRp605VB/SmpHDVxpH0i1OXIoCumabmZlUlLp4+ie67YwEVz5isPbdaBfBlZTUtf/J5enntO9SEO36qV3uCxWHfQ6CxsYm8XHu4fu4V9MCdC2lE3hBtIGgTwOo1G2jZY89ReeVh8vm80pjVVkTiCAig8RwINFF+Xg4tvfe7tGDebC3AxC2AWu66XLriV/T8y+u5cWs5VlfTkltxYjwCaFsGzwRp4fVX0bIlt1Emd6nGY3EJYPfez2nxA0/wwNVe8vt8Us+PpyTkt7YRQPugIRDggbVxtHL53TRh3Gjbv+18YswCQJfm7Useo6+qa3hwQ+r6nYGVv51HIMBtg6FDsujpFfeqrtNYrhiTAF5d9x4t/uETdLohoPrzY7mw/EYQ0IEAxg/S/D5a+fDdNH/O5VG7jFoAq1/dQHf+678R6mIYvRUTBHobAYwqY5zgyZ/cRQvmR9c4jkoAa9ZtokX3rRDy93aJy/XPQSAkgmceXULz5hSfczzcF7YF8DbX+W++Yxk3PprU3J1wDuV7QaC3EMC8Mj93wb/w1FK6kqdT2DFbAsDU5Hm3PkiHjxyTOr8dVOWcXkMAbYKcwYNozW9+pqZgd5eQbidko5//H+9/nKq4twcT2MQEgURGABwFV8FZcLc761YAS1f8Wi1QkWkN3UEpxxMFAXAVi6rA3e4sogD+e81GWvXSm2qQqztHclwQSCQEMDAL7oLDkSxsG6CcJ7b9xQ3/TFWHa2V6QyQE5VjCIoCu+tycTHrrpZ/zHKKuJ9CFfQL8jGd1fskT25yah52wqEnCXIMAuAsOg8vhrEsBbOZ5/JjSjC4lMUHAZATAYXAZnO7KzhFAc0sLrVj5YvtihK5+JN8JAqYggDXmWFgDToPbne0cAax/509qJVeqV+7+ncGSv81EAFzG6kRwu7OdJQA0Gn75m9+pxQedT5S/BQGTEcCCGnAbHO9oZwlgS8knvID9E7X8rONJ8lkQMB0BLKkM8btjXs4SAFZ1YUW+rF/vCJF8dgMC4DS4/TyH5+lo7QJAWEIscoFSxAQBVBlaW1uohRuQeLVyA/IMhywx2cBtcBxcD1n75J7/fe9DquZBL78/NXRM3vscAmeY7C1qaWta/4E0IDOb/On9KYljeAYaTlF97VGqP36MxdBMySnmBT7wcD6qq2sJXL/1xmtU6SoBQO3rNmxxPApXn+OTQRnGHd7iBU5jJl1CF15STMNGjaG0/gPIk8wxnTgfeBpABEcqy2jvRx/QPn4FTp1UQjAom4rj4Pp3/uZqFblETYXAI6H42sVUd7xeIreZVJqa0trS3ES5+aPpz+ctpPPGTlJCwF1eBbRFpOKvLYmjfnh4dBXv1RUHadPaF2n/zg/5u2RFptB5ifyOyHMDB/SnTb9fqaJUqzbA9l376QgHqk2EcNWJDJ4b0wbyj53yZ3TjnQ/R6AsuUnf65qZGFdFZhenukOkzHI4E7QEcHzxsBM3/3hKaOecG1TZALcIEA8fBdXAepgSwdfsnnHGzGzgmgJ9oaQT5CyZPo7m3/oB8aelM7ibbSVSNYiZ98bcX0KXXXKcaybZ/3MsnguvgPMzCI2EHx+dP5g0NxPoOAkGu02cPHU7fWrCILK7nB3k5YbSmeoq4qnTp1ddTIQspGgFFey2d54Pr4Dy4bx3jev8XvDmFRHjQCXHi+0KF5bK/XED9B2bFRP5QDiECtAkuv/Ym8vfLMGIWAbgOzoP7FnZqwc4s2JxCrG8ggB6dvPMKaMzEi7k+b7/aEw4d+EOb4IKpM6k1impUOH9Ofw+ug/PgvoWtiRBhS3ZmcRr2xPF/hqs7hRfNoBQvxnz0NF5RnRjHjWkPjw8kuoHr4Dy4b5XsKEXo3URPs6RPGwJnKCXVR8PPHxtX1adzctCmwFMAg2fBYPTtic7+HP+bOQ/uW3tKP5fuT8fRTpwLoG/fn96PMgaBqPp6/tAW8PrTKCMzx4gpE+gOVdxHPH+p/ycOQZ1PCT8BvH6t1Z9Qmj2WR4nLhDEBcF5x/2jtCan/h0qwz7xj+1L9mYVLE8iPnKMdAO5bp3kTamkA6ydDonpEWTcGGqi5sQE00JpMtAMaTtYznxJ/TAk4gPuWjABr5UDCO0PBB07V0/FarvpqHPyE34bTJ6muplrNHk14IDiB4H7iS9UEJI1KYxLvyctdgPv3cNuvfTZ83DnAhLjq8oNUX1djVKeKCCDuojfPAUZCSz/eQgG+Y+POrceS6NMPN2vtWtWTrsheRACR8XHlUcuDu/UX9GnJ+zyfP/4FUMk8l+jQwf1UumOrWj9gEmgiAJNKS2NaUf//4+svUU1VuZrPH6trrBZrbgrQO2tWccM6oPGJEmuKovudCCA6vFxztsV99ieO1dBrq1aqnhus/IrWMJiUxP82vPIctyk+Me7uj/yKAKItdRedn5ySQhWf7aX/eXYF1R2tUlMk7LYJsCYYC2PeePFp+njzW8YtjQwVoyctu+Ch0B/y3vcQwDrguiPVdGDnNvKm+ilraD55fX6uyjAWGNnid4gCL5wL4sMO7t1F61b9B/3frhJKNjiKYFL22DkOjAkqjOQ/gxDABDbMDRo64nwaV3QpjSi4kOf1ZPOUCR9ZTH50nZ46cYwqubGLBfFlpZ9wj0+LkdWejsUiAuiIhnxWa4KxOszLM0bT+mdQqi9dDWw18ejx6ZPHqbHhNKOUxGHzeQxBPSbMBk3fSIjZOEjqv0bAw12keGFOz8m6Y1R/pratJqSqQlZ7FcgtgIkA3FKSDuQDXZy6hskcSJ4Wl9ILpAVGcWIqAiIAU0tO0q0FARGAFhjFiakIiABMLTlJtxYEpBGsBUbzncS6ksvuyHGiIiQCSNSS6aF0NXM49FYeAEvjsPjRBkfDAvuGhoDqMsXu7CaaCMDEUtOU5kBjM108uVDFyp80/huUnuazHSUI3aNNLJ4Dn5XTb3//Nr2xcataCGNagAUZCdZEJtPcNDL5/2Hht2nZ/bcp4seb/v98YS09+NNn1dPApGqRTIaLt+QN/D32yppVXETPPr6EfJqqLkUTC3mReYA3pN7F0yQ8xqAivUDGFJWehGLmYzLP6vzBbddpJ+r3v3MtDc3lYLsaA27pyXV4LyKA8Ni48kiQIyHk5mTShAvO156/3JwsunDsaN6R3YDQiF/nXgSgnQaJ7RDdnenpfurHLydsEG8/JE8AJ5AVn3oRkFUgCk95AuillXgzDAERgGEFJsnVi4AIQC+e4s0wBEQAhhWYJFcvAiIAvXiKN8MQEAEYVmCSXL0IiAD04ineDENABGBYgUly9SIgAtCLp3gzDAERgGEFJsnVi4AIQC+e4s0wBEQAhhWYJFcvAiIAvXiKN8MQEAEYVmCSXL0IyKJ4vXie5Q1z7xF1oYUXofDW1LbjbLaF5ecIzLyNUUpKsorNf5Zj+UMbAiIAbVCe7QgRE3ypKTRtykQaX3ge+TnsiN3d2RF1vKGhkfaUHqSSnfsI0Ru8LAQx/QgIqvoxJSw6n8hLDpf/yyK6bPqkuK6weetOeuCnz9CuTz+jVG/0+3jFdfE+8GNpA2guZKyHLRidT7999sdxkx9Jg4DgCz5NWmurGVbH3IkAdEPL9ZwH71pIeUMHa/MMX/Bpuw6l7crudyQC0FjGrdzYHTE8l66cWaTRa5sr+IRvXENMHwIiAH1YMjlbadiQLBo4IF2j1zZX8AnfuIaYPgREAPqwVHE1sQO72ltUo982V9im1LIdu1P75V3qUATg0oKVbNlDQARgDyc5y6UIiABcWrCSLXsIiADs4SRnuRQBEYBLC1ayZQ8BEYA9nOQslyIgAnBpwUq27CEgArCHk5zlUgREAC4tWMmWPQREAPZwkrNcioAIwKUFK9myh4AIwB5OcpZLERABuLRgJVv2EBAB2MNJznIpAkavCUbUhSBWmke54RsWnVuWaN+lnI4qW0YKAMQPNDZRepqPsgdmkEfNwbef7+amFqo5dlyFLEnVtFO6/avLmYmEgHECwIooL0dHWHzTfLpu7hU0Kj+XdzznbNh9CnwdcmTfgTL6r9Xr6A9vfaDi7yThsSDW5xAwSgDYgDk9zU/P/nwJXX3l9JgLa2BGPxrKywuvmDmFnnjmJVr22HMsIk/M/uSH5iJgVEUYwabu/6eb4iJ/56K6e9ENNH9OsapSdT4mf7sfAWMEgKoPqjs3/fU3tZfK9xZey1HcvBJ1RDuyie/QGAEgKNQFBaNoEDd6dVvBN/IpN4cjLnAVS6xvIWCMANDz069fmiOl4/elks/nlcBTjqCb2E6NEYCC0W5PT7SYO+U32nTI+T2OgFkC6HF45IJuR0AE4PYSlvxFREAEEBEeOeh2BEQAbi9hyV9EBEQAEeGRg25HQATg9hKW/EVEQAQQER456HYERABuL2HJX0QERAAR4ZGDbkdABOD2Epb8RURABBARHjnodgREAG4vYclfRAREABHhkYNuR0AE4PYSlvxFREAEEBEeOeh2BEQAbi9hyV9EBEQAEeGRg25HQATg9hKW/EVEQAQQER456HYERABuL2HJX0QERAAR4ZGDbkdABOD2Epb8RURABBARHjnodgREAG4vYclfRAREABHhkYNuR0AE4PYSlvxFREAEEBEeOeh2BEQAbi9hyV9EBEQAEeGRg25HQATg9hKW/EVEwCwBOLWPnVN+I0LfywedyrNTfh2CyxgBYBdHbG/qhLXw7jOt/IrXsNEkfGEzD90Gn/CtYzNL5BW+nDCUkUk7bhojgGTeC/izskpq5P2BdVtl1VE6XFNHVpT7DXdOh8fjoYpDh3kP4hOdD8X9N3zCN64RjyGPyCvyrNtQNigjlJUpZkxKsRfw3v1l9O4HH2vH9tXX3qW64/VkxXl79fDu8xVfHaHX3vqj9jT+gX1WHDpCuEY8hjwir8izbkPZoIzUvs26nTvkLz40HUpUOLfYJ3jpI79Wd8Jw50T7/eatu+gXz62hVC/vEabBcId++N9foD2lBzV4a3MBX4+wT4+mvYyRV+QZeddleDqhbFBGJpknLbvgIVMS7OFHa9WRWnr7/Y8of+hgyhs2mFKwS3wMVnf8JL3wynq650cr6UT9Ka5a6LkXWFYSHWd/69/9Ew3OGkgjh+eqne1jSCKdPNVAv3tzMy1+4Ak6VFXDeY2v+hNKA+roAa6uvPnONt543EejR+a1bRIYOiGK94ZAI218r4Ruv/9x2nugLOa8RnFJracmZY+do7/FpjWJ5zpr5g2zQdixY0bS+aPyKCWFRWA3F9xQPXU6QPu4sD4vO6R2iI+3WnFuCrkxzPsao+E6ZnQ+FfCrbRfKrs7s4jtOYyDQRPs/L6cD/AJhk+Os+3dxFbUtLBrDo0cOU1hCDNHgiHL47ItKhWVra7CtHLq6UAJ/Z6QAFJ5M+ObWFgLw0fa6KELx3dQJUnUuaxAsJIbOxyL9HSJ9sqa7fqRrIX1IZyw44kaU4uEbkGHdnyE8mAOWIlHoC2PeGXBUf3DzT2QDgXuCxPFggBtBT9wM4kmjE78F9610vz9q5TuRGPEpCPQkAnjagftWVmaGCKAnkZdrJQQCEAC4b+XnDeGuK7styIRIuyRCEIgbAXAe3LfGF44yru827tyLgz6PAMYrwH1r6uSx3II3tAnf54tRAIgZAeY8uG+NzM8lX6pX2gExIyk/NA0B1P/BeXDfGs4jqlmDMqQdYFopSnpjRgD1f3Ae3LcGDehPo1gJrTwYIiYI9AUEwHVwHty32GjyhDE8WmnWJKa+UFCSR2cQANfBeXBfzQCbXjRe22QwZ5IsXgUBfQhgBBichykBFE0cq2YumjaVVR8k4qmvIACOY5YuOA9TAhiWm0VTJhYQZveJCQJuRgAcB9fBeZgSAGYezpk9Q3qC3FzykjeFAHqAwHVwHqYEgA/fvPxiGpKTqeaI428xQcBtCLRy9QccB9dD1i6APO4TnX1ZETU1NYeOybsg4CoEwG1wHFwPWbsA8MXN11/Fa2NTbC8KCjmRd0Eg0RHAdE9wGxzvaGcJYMbUCwkveQp0hEg+uwEBcDrE7475OUsAWLn0/Vv/qr2B0PFE+SwImIwAGr3gdufVeWcJABm86opLqHj6JGps0h+AymQAJe3mIgAug9Pgdmc7RwBYZ7tk8d+SN4XbAjxrTkwQMBkBcBhcBqe7CqFzjgCQ2ctYLdfPvYIaODSHmCBgMgLgMLgMTndlXQoAJz5450IakZfjWBDVrhIj3wkCOhFAqBdwGFwOZ2EFgPWSP7r379TAmNSEwsEn3ycqAuAsBr7AYXA5nIUVAH5w47xZdMsN3+KqUCDc7+V7QSAhEQBnwV1wOJJFFAB+uGzJ36u1k06EJY+UMDkmCMSKALiK9b7gbnfWrQAyeenYLx65h3KHZMls0e7QlOO9jgBme4Kr4Cy42511KwA4GF94Hv1yxb2Ulpaq4lx251SOCwK9gQBinIKj4Co4a8dsCQCOruRJRE8tv0eF6Jb1w3aglXN6EgFwEuHjwVFw1a7ZFgAczptTTE/+5C41nCwisAuxnOc0AuAipjiAm+BoNJbEI2VRD/e+uu49WvzDJ+h0Q8DImPDRACTnJjYCqPOn+X208uG7af6cy6NObEwCwFU2bt5Oty95jL6qrlFBhqK+svxAEIgTAexyM5QbvE9znX9WFNWejpeNWQBwsnvv52r7npIde8nv80mExY7IymfHEECdBf38UyePo5XL76YJ40bHfK24BICr1vL2nUtX/Iqef3k977JonTPdNOaUyQ8FgS4QwPSG4JkgLeSFLcuW3Garq7MLN+1fxS2AkKfVazbQsseeo/LKw2o/rNCi49BxeRcE4kEATVXsm5bPc3uW3vtdWjBvdjzu2n+rTQDw+GVlNS1/8nl6ee07alVZKgcgFRME4kUAI7teXs6IWZ0PqEma4ef2RHstrQIIXXzTlh306FOradPWnWpNAeZjfx2FInSKvAsCERFAPb+puVmtTsRilvvuWEDFMyZH/E0sBx0RABKCutobG7fSM6vW0paS3bzCrFktSkY8RjFBIBwCiNwW4sqMqRNo0S1z6epZ0x1rWzomgFAGEYjo/W271KbUG9/fTtWHa7mxnKTGD0QMIZT69jtIj/78IN/2Ebdn1swiuvm6q2jmtIkcwNbZzVscF0DHoq04dJg2bCqh1zdsoe279tPRmjo1twhbdHr4hcxK47kjYu77jMYsbooYvcXcHZR9torVWUDXcMS22cVTafiwnB7LeI8KoGOuKr46Qtt3ltK2j/bQx7sPUFl5FdVwl2qgsVHtVg4x4AkBQYgoOiJnzmeQvY3wwbawm3wz96Wmqs0psDvLRRyifNqU8VQ0qVBtVtEbOes1AXTMLB6BtXX1VMmiKKuoopId+2hP6UEq5yfG0ZoTdKqhgYKyf0FHyBL+s8UhyLEPb3ZWBuXzHR2zMzFHf+TwXBWZLXOg2pyi1/Px/1RJydYl5F42AAAAAElFTkSuQmCC";
  function splashView() {
    return '<div class="splash" role="status" aria-live="polite"><img src="' + LOGO + '" alt="" width="96" height="96">' +
      "<b>" + t(UI.title) + '</b><span class="spin" aria-hidden="true"></span><span class="sr">' + t(UI.loading) + "</span></div>";
  }
  function renderState(titlePair, bodyPair) {
    if (acctOn()) { app.innerHTML = acctView(); setLang(root.lang); return; }
    if (gateOn()) { app.innerHTML = gateView(); setLang(root.lang); return; }
    app.innerHTML = '<div class="wrap">' + header(!window.__FED_DATA__) + '<div class="state"><b>' + t(titlePair) + "</b>" +
      (bodyPair ? t(bodyPair) : "") + "</div></div>";
    setLang(root.lang);
  }

  // ---------- 언어 ----------
  function setLang(l) {
    root.lang = l;
    document.querySelectorAll(".chart").forEach(function (box) { if (box._i != null) setCursor(box, box._i); });
    document.title = word(UI.title, l);
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === l));
    });
    document.querySelectorAll("[data-aria]").forEach(function (e) {
      e.setAttribute("aria-label", e.getAttribute("data-tip-" + l));
    });
  }

  // ---------- 데이터 ----------
  function fetchJSON(url) {
    return fetch(url + (url.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (j) { if (!j || j.schema !== 1 || !j.meta) throw new Error("schema"); return j; });
  }
  function settle(p) {
    return p.then(function (v) { return v; }, function () { return null; });
  }
  function newest(list) {
    return list.filter(Boolean).sort(function (a, b) {
      return String(b.meta.generated).localeCompare(String(a.meta.generated));
    })[0] || null;
  }
  // ---------- PRO 로그인 (Supabase: 이메일 + 비밀번호. 메일 발송(SMTP) 없이 동작) ----------
  var SB = window.FED_SUPABASE || {}, SESSION = "fed-pro-session";
  var auth = { session: null, step: "signin", email: "", msg: null, busy: false, member: null };
  readRecoveryLink();  // 비밀번호 재설정 메일의 링크로 들어왔는지
  // 로그인은 앱이 켜져 있는 동안만 유지한다 (앱을 열 때마다 PRO는 다시 로그인). 예전에 저장된 로그인 정보는 지운다
  try { localStorage.removeItem(SESSION); } catch (err) {}
  // 공유용 페이지(파일 하나로 내보낸 것)에는 PRO 데이터를 넣지 않는다. 탭은 보여 주되 앱 안내만 띄운다
  function proLocked() { return !!window.__FED_DATA__ && !pro; }
  function serverOn() { return !!(SB.url && SB.anon) && !window.__FED_DATA__; }
  function sbFetch(path, opts) {
    opts = opts || {};
    var h = { apikey: SB.anon, "Content-Type": "application/json" };
    if (opts.token) h.Authorization = "Bearer " + opts.token;
    return fetch(SB.url.replace(/\/$/, "") + path, { method: opts.method || "GET", headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: "no-store" });
  }
  function saveSession(j) {
    auth.session = j ? { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || (Date.now() / 1000 + (j.expires_in || 3600)),
                         email: (j.user && j.user.email) || auth.email } : null;
    // 기기에 저장하지 않는다 (메모리에만)
  }
  function freshToken() {
    var s = auth.session;
    if (!s) return Promise.resolve(null);
    if (s.expires_at - 60 > Date.now() / 1000) return Promise.resolve(s.access_token);
    return sbFetch("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: s.refresh_token } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (!j) { saveSession(null); return null; } saveSession(j); return j.access_token; });
  }
  // 서버의 pro.json. 로그인 안 했으면 null, 회원이 아니면 auth.member=false
  function fetchServerPro() {
    return freshToken().then(function (tok) {
      if (!tok) return null;
      return sbFetch("/storage/v1/object/authenticated/pro/pro.json?t=" + Date.now(), { token: tok }).then(function (r) {
        if (r.ok) { auth.member = true; auth.nodata = false; return r.json(); }
        // 정책상 명단에 없어도 '없는 파일'로 응답하므로, 명단(본인 행)을 따로 확인해 원인을 구분한다
        return sbFetch("/rest/v1/pro_members?select=until", { token: tok })
          .then(function (m) { return m.ok ? m.json() : []; })
          .then(function (rows) {
            auth.member = rows && rows.length > 0;
            auth.nodata = auth.member;  // 회원인데 파일을 못 받음 = 서버에 아직 데이터가 없음
            return null;
          });
      });
    });
  }
  function lockedView() {
    var asset = view.tab === "assets", fxt = view.tab === "fxpro";
    return '<section class="card"><h2>' + t(asset ? UI.tabAssets : fxt ? UI.tabFx : UI.tabPro) + ' <span class="pro-badge">PRO</span></h2>' +
      '<p class="lead-p">' + t({ ko: "PRO는 앱에서 로그인한 회원만 볼 수 있습니다.", en: "PRO is available to signed-in members in the app." }) + "</p>" +
      '<ul class="plain">' + (fxt
        ? "<li>" + t({ ko: "원/달러·유로/달러·엔/달러 등 6개 통화쌍의 통계와 확대 그래프", en: "Statistics and zoomable charts for six pairs including USD/KRW, EUR/USD and USD/JPY" }) + "</li>" +
          "<li>" + t({ ko: "추세·금리차·구매력평가 공식의 과거 적중률과 6개월 전망, 시장 내재 선물환", en: "Track records of trend, rate-gap and PPP signals, a six-month outlook and market-implied forwards" }) + "</li>" +
          "<li>" + t({ ko: "투자은행 전망과 중앙은행·재무부 발언 요약 (출처 링크)", en: "Bank forecasts and summarized central-bank and finance-ministry remarks (with sources)" }) + "</li>"
        : asset
        ? "<li>" + t({ ko: "금·석유·S&P 500의 가격 통계와 7일~전체 기간 그래프", en: "Gold, oil and S&P 500 statistics with 7-day to all-history charts" }) + "</li>" +
          "<li>" + t({ ko: "신호 공식별 과거 적중률과 6개월 전망", en: "Track records of signal formulas and a six-month outlook" }) + "</li>" +
          "<li>" + t({ ko: "세계은행·EIA·투자은행 전망 모음 (3시간마다 갱신)", en: "World Bank, EIA and bank forecasts (refreshed every three hours)" }) + "</li>"
        : "<li>" + t({ ko: "테일러·옐런 등 유명 경제학자 금리 공식이 지금 가리키는 방향", en: "Where famous economists' rate formulas (Taylor, Yellen and more) point now" }) + "</li>" +
          "<li>" + t({ ko: "공식별 과거 적중률과 '우리 공식' 종합 신호", en: "Each formula's track record and our blended signal" }) + "</li>" +
          "<li>" + t({ ko: "미국·한국·유럽·일본·스위스·싱가포르 등 나라별 폴더", en: "Folders for the US, Korea, euro area, Japan, Switzerland, Singapore and more" }) + "</li>") + "</ul>" +
      '<p class="note">' + t({ ko: "이 공유 페이지에는 PRO 데이터가 들어 있지 않습니다.", en: "This shared page doesn't include PRO data." }) + "</p></section>";
  }
  function loginView() {
    var s = auth.session, msg = auth.msg ? '<p class="note warn">' + t(auth.msg) + "</p>" : "";
    var body;
    if (s && auth.nodata) {
      body = '<p class="lead-p">' + t({ ko: s.email + " · PRO 회원 확인됐습니다. 그런데 서버에 아직 데이터가 없습니다. 3시간마다 올라가니 잠시 뒤 다시 확인하세요.",
        en: s.email + " · PRO membership confirmed, but the server has no data yet. It uploads every three hours; check again shortly." }) + "</p>" +
        '<div class="btn-row"><button type="button" class="refresh" data-auth="retry">' + t({ ko: "다시 확인", en: "Check again" }) + "</button>" +
        '<button type="button" class="refresh" data-auth="logout">' + t({ ko: "로그아웃", en: "Sign out" }) + "</button></div>";
    } else if (s && auth.member === false) {
      body = '<p class="lead-p">' + t({ ko: s.email + " 계정으로 로그인했지만 아직 PRO 회원이 아닙니다.", en: "Signed in as " + s.email + ", but this account isn't a PRO member yet." }) + "</p>" +
        '<div class="btn-row"><button type="button" class="refresh" data-auth="retry">' + t({ ko: "다시 확인", en: "Check again" }) + "</button>" +
        '<button type="button" class="refresh" data-auth="logout">' + t({ ko: "로그아웃", en: "Sign out" }) + "</button></div>";
    } else {
      var signup = auth.step === "signup";
      body = '<form class="authf" data-authform="' + (signup ? "signup" : "signin") + '">' +
        "<label>" + t({ ko: "이메일", en: "Email" }) + "</label>" +
        '<input name="email" type="email" autocomplete="email" required placeholder="name@example.com" value="' + esc(auth.email) + '">' +
        "<label>" + t(signup ? { ko: "비밀번호 (6자 이상)", en: "Password (6+ characters)" } : { ko: "비밀번호", en: "Password" }) + "</label>" +
        '<input name="password" type="password" minlength="6" required autocomplete="' + (signup ? "new-password" : "current-password") + '">' +
        '<div class="btn-row"><button type="submit" class="refresh"' + (auth.busy ? " disabled" : "") + ">" + t(signup ? { ko: "가입하기", en: "Create account" } : { ko: "로그인", en: "Sign in" }) + "</button>" +
        '<button type="button" class="linkbtn" data-auth="' + (signup ? "tosignin" : "tosignup") + '">' + t(signup ? { ko: "이미 계정이 있어요", en: "I have an account" } : { ko: "처음이에요 (가입)", en: "New here? Create an account" }) + "</button>" + (signup ? "" : forgotLink()) + "</div></form>";
    }
    return '<section class="card"><h2>' + t({ ko: "PRO 로그인", en: "PRO sign-in" }) + ' <span class="pro-badge">PRO</span></h2>' +
      '<p class="sub">' + t({ ko: "경제학자·자산·환율 폴더는 PRO 회원 전용입니다. 이메일과 비밀번호로 로그인하세요. 데이터는 3시간마다 갱신됩니다.",
        en: "Economist, asset and currency folders are for PRO members. Sign in with your email and password. Data refreshes every three hours." }) + "</p>" + body + msg + "</section>";
  }
  function authBar() {
    if (!serverOn() || !auth.session) return "";
    var g = pro && pro.generated_at ? pro.generated_at.replace("T", " ").slice(0, 16) + " UTC" : "";
    return '<p class="authbar">' + t({ ko: auth.session.email + (g ? " · 데이터 " + g : ""), en: auth.session.email + (g ? " · data " + g : "") }) +
      ' <button type="button" class="linkbtn" data-auth="logout">' + t({ ko: "로그아웃", en: "Sign out" }) + "</button></p>";
  }
  function authSubmit(form) {
    var kind = form.dataset.authform;
    auth.email = form.querySelector('[name="email"]').value.trim();
    var pw = form.querySelector('[name="password"]').value;
    auth.msg = null; auth.busy = true; render();
    var path = kind === "signup" ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
    sbFetch(path, { method: "POST", body: { email: auth.email, password: pw } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
      .then(function (res) {
        auth.busy = false;
        var j = res.j || {};
        if (res.ok && j.access_token) {
          saveSession(j); auth.step = "signin";
          return fetchServerPro().then(function (p) { pro = p; render(); }, function () { if (auth.member == null) auth.member = false; render(); });
        }
        var m = String(j.msg || j.error_description || j.message || "");
        if (res.ok && kind === "signup") auth.msg = { ko: "가입됐지만 이메일 확인이 켜져 있어 바로 로그인되지 않았습니다. 관리자에게 알려 주세요.", en: "Account created, but email confirmation is on, so you aren't signed in yet. Tell the admin." };
        else if (/already registered|already been registered|exists/i.test(m)) auth.msg = { ko: "이미 가입된 이메일입니다. 로그인해 주세요.", en: "That email is already registered. Please sign in." };
        else if (/invalid login|invalid_credentials|Invalid login/i.test(m) || res.status === 400) auth.msg = { ko: "이메일이나 비밀번호가 맞지 않습니다.", en: "Wrong email or password." };
        else if (/weak|at least/i.test(m)) auth.msg = { ko: "비밀번호가 너무 짧거나 약합니다.", en: "That password is too short or weak." };
        else auth.msg = { ko: "로그인하지 못했습니다 (" + res.status + "). 잠시 뒤 다시 시도하세요.", en: "Couldn't sign in (" + res.status + "). Try again shortly." };
        render();
      }).catch(function () { auth.busy = false; auth.msg = { ko: "인터넷 연결을 확인하세요.", en: "Check your connection." }; render(); });
  }

  function load() {
    if (window.__FED_DATA__) { data = window.__FED_DATA__; pro = window.__FED_PRO__ || null; render(); return; }
    if (!data) { if (acctOn()) app.innerHTML = acctView(); else if (gateOn()) app.innerHTML = gateView(); else app.innerHTML = splashView(); setLang(root.lang); }
    var jobs = [settle(fetchJSON("data/latest.json"))];
    if (window.FED_DATA_URL) jobs.push(settle(fetchJSON(window.FED_DATA_URL)));
    var proJob = settle((serverOn() ? fetchServerPro() : fetch("data/pro.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); }))
      .then(function (j) { if (!j || j.tier !== "pro" || !j.folders) throw new Error("pro"); return j; }));
    proJob.then(function (p) {
      pro = p;
      if (!pro && !serverOn() && (view.tab === "pro" || view.tab === "assets" || view.tab === "fxpro" || view.tab === "proall")) view.tab = "overview";
      if (data) render();
    });
    Promise.all(jobs).then(function (got) {
      var best = newest(got);
      if (best) {
        fromCache = false;
        try { localStorage.setItem(CACHE, JSON.stringify(best)); } catch (err) {}
      } else {
        try { best = JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (err) { best = null; }
        fromCache = !!best;
      }
      if (best) { data = best; render(); } else { renderState(UI.failT, UI.failB); }
    });
  }

  // ---------- 이벤트 ----------
  app.addEventListener("submit", function (e) {
    var f = e.target.closest("[data-authform]");
    if (f) { e.preventDefault(); if (f.dataset.authform === "forgot" || f.dataset.authform === "newpw") recoverySubmit(f); else authSubmit(f); }
  });
  function onCalcInput(e) {
    var x = e.target.closest && e.target.closest("[data-calc]");
    if (!x) return;
    var c = calcState(), k = x.dataset.calc;
    if (k === "fxTo") c.fxTo = x.value; else { var v = parseFloat(x.value); c[k] = isNaN(v) || v < 0 ? 0 : v; }
    calcUpdate();
  }
  app.addEventListener("input", onCalcInput);
  app.addEventListener("change", onCalcInput);
  // ---------- 좌우로 밀어서 화면 넘기기 ----------
  // 같은 묶음 안에서 이동: 세 '전체' 화면 · 나라별 금리(미국 연준·각국, 메뉴 순서) · PRO(전체·경제학자·자산·환율) · 홈(전체·계산기)
  function swipeSeq() {
    var cl = countryList(), pn = pins(), proOn = pro || serverOn() || proLocked();
    var ctry = ["overview"].concat(cl.slice().sort(function (a, b) { return (pn.indexOf(a.tab) < 0) - (pn.indexOf(b.tab) < 0); }).map(function (x) { return x.tab; }));
    var tops = ["all", "countries"].concat(proOn ? ["proall"] : []);
    var pros = proOn ? ["proall", "pro", "assets", "fxpro"] : [];
    if (tops.indexOf(view.tab) >= 0) return tops;
    if (ctry.indexOf(view.tab) >= 0) return ctry;
    if (pros.indexOf(view.tab) >= 0) return pros;
    if (view.tab === "calc") return ["all", "calc"];
    return null;
  }
  var sw = null;
  app.addEventListener("touchstart", function (e) {
    sw = null;
    if (e.touches.length !== 1 || menuOpen || zoomState || !data) return;
    // 그래프·슬라이더·옆으로 넘기는 표·입력칸 위에서 시작한 밀기는 그쪽 동작이 우선
    if (e.target.closest(".chart, svg, input, select, textarea, .tbl, .tabs, .fxcards, .seg-btn, .mbar-gos, .mn-sheet")) return;
    var tch = e.touches[0];
    sw = { x: tch.clientX, y: tch.clientY, t: Date.now() };
  }, { passive: true });
  app.addEventListener("touchend", function (e) {
    if (!sw) return;
    var tch = e.changedTouches[0], dx = tch.clientX - sw.x, dy = tch.clientY - sw.y, dt = Date.now() - sw.t;
    sw = null;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8 || dt > 800) return;
    var seq = swipeSeq();
    if (!seq) return;
    var i = seq.indexOf(view.tab), j = i + (dx < 0 ? 1 : -1);
    if (i < 0 || j < 0 || j >= seq.length) return;
    view.tab = seq[j]; view.folder = null;
    render(); scrollTo(0, 0);
    var w = app.querySelector(".wrap");
    if (w) { w.classList.remove("slide-l", "slide-r"); void w.offsetWidth; w.classList.add(dx < 0 ? "slide-l" : "slide-r"); }
  }, { passive: true });

  app.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lang]");
    if (b) {
      setLang(b.dataset.lang);
      try { localStorage.setItem(STORE, b.dataset.lang); } catch (err) {}
      if (b.classList.contains("mn-lang")) openMenu(false);
      extSet({ lang: b.dataset.lang });
      if (view.tab === "calc") { view.calc = null; render(); }  // 금액 단위(만원/$)가 언어를 따라간다
      if ((!view.fxBase && view.tab === "all" && data && data.fx) || (view.tab === "all" && extOn())) render();  // 환율 기본 기준(한국어=원, 영어=달러)이 언어를 따라가도록
      return;
    }
    if (e.target.closest("[data-refresh]")) { load(); return; }
    var ab0 = e.target.closest("[data-auth]");
    if (ab0) {
      var act = ab0.dataset.auth;
      if (act === "logout") { document.documentElement.classList.remove("mn-open"); menuOpen = null; saveSession(null); pro = null; auth.member = null; auth.nodata = false; auth.step = "signin"; render(); }
      else if (act === "tosignup") { auth.step = "signup"; auth.msg = null; render(); }
      else if (act === "toforgot") { auth.step = "forgot"; auth.msg = null; auth.msgOk = false; render(); scrollTo(0, 0); }
      else if (act === "tosignin") { auth.step = "signin"; auth.msg = null; auth.msgOk = false; render(); }
      else if (act === "retry") { fetchServerPro().then(function (p) { pro = p; render(); }); }
      return;
    }
    var lt = e.target.closest("[data-langtoggle]");
    if (lt) {
      var ll = document.getElementById("mn-langlist"), open = ll.hidden;
      ll.hidden = !open; lt.setAttribute("aria-expanded", String(open));
      if (open) ll.scrollIntoView({ block: "nearest" });
      return;
    }
    if (e.target.closest("[data-menu]")) { openMenu(true, "mn-sheet"); return; }
    if (e.target.closest("[data-menu-pro]")) { openMenu(true, "mn-pro"); return; }
    var gob = e.target.closest("[data-go]");
    if (gob) {  // PRO 전체의 줄: "탭:세부" (pro:kr, assets:au, fxpro:kw)
      var gp = gob.dataset.go.split(":");
      view.tab = gp[0]; view.folder = null;
      if (gp[0] === "pro") view.region = gp[1]; else if (gp[0] === "assets") view.asset = gp[1]; else if (gp[0] === "fxpro") view.fxp = gp[1];
      render(); scrollTo(0, 0); return;
    }
    if (e.target.closest("[data-menu-close]") || e.target.classList.contains("mn-sheet")) { openMenu(false); return; }
    var cp = e.target.closest("[data-cpick]");
    if (cp) {
      var panel = document.querySelector(".cpanel");
      if (panel) { panel.hidden = !panel.hidden; cp.setAttribute("aria-expanded", String(!panel.hidden)); }
      return;
    }
    var pb = e.target.closest("[data-pin]");
    if (pb) { togglePin(pb.dataset.pin); render(); return; }
    if (e.target.closest("[data-alerts]")) { ext.alerts = !ext.alerts; extSet({ alerts: ext.alerts }); render(); return; }
    if (e.target.closest("[data-install]") && pwa.prompt) {
      pwa.prompt.prompt();
      pwa.prompt.userChoice.then(function () { pwa.prompt = null; render(); });
      return;
    }
    var cpb = e.target.closest("[data-cpb]");
    if (cpb) {
      calcState().pb = cpb.dataset.cpb;
      app.querySelectorAll("[data-cpb]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === cpb)); });
      calcUpdate(); return;
    }
    var cdb = e.target.closest("[data-cd]");
    if (cdb) {
      calcState().d = +cdb.dataset.cd;
      app.querySelectorAll("[data-cd]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === cdb)); });
      calcUpdate(); return;
    }
    var tb = e.target.closest("[data-tab]");
    if (tb) {
      document.documentElement.classList.remove("mn-open"); menuOpen = null;
      view.tab = tb.dataset.tab; view.folder = null;
      render(); scrollTo(0, 0); return;
    }
    var fb = e.target.closest("[data-folder]");
    if (fb) { view.folder = fb.dataset.folder; render(); scrollTo(0, 0); return; }
    if (e.target.closest("[data-back]")) { view.folder = null; render(); return; }
    var fb0 = e.target.closest("[data-fxbase]");
    if (fb0) { view.fxBase = fb0.dataset.fxbase; render(); return; }
    var fp0 = e.target.closest("[data-fxpick]");
    if (fp0) { view.fxPick = fp0.dataset.fxpick; render(); return; }
    var fpb = e.target.closest("[data-fxp]");
    if (fpb) { view.fxp = fpb.dataset.fxp; view.folder = null; render(); return; }
    var ab = e.target.closest("[data-asset].folder");
    if (ab) { view.asset = ab.dataset.asset; view.folder = null; render(); return; }
    var bigb = e.target.closest("[data-pxbig]");
    if (bigb) {
      var ia = bigb.dataset.pxbig, ibox = bigb.closest(".chart.px");
      zoomState = null;
      openPxZoom(ia, view.pxWin[ia] || null, ibox && ibox._i != null ? chartData(ibox).x[ibox._i] : null);
      if (zoomState) zoomState.per = view.px[ia] || "1y";
      return;
    }
    var zb0 = e.target.closest("[data-pxz]");
    if (zb0) {
      var zbox = zb0.closest(".chart.px"), zk = zb0.dataset.pxz;
      if (zbox) {
        if (zk === "reset") pxReset(zbox);
        else zoomBy(zbox, zk === "in" ? 0.6 : 1.6, zbox._i, function (w, anc) { pxRedraw(zbox, w, anc); });
      }
      return;
    }
    var pb = e.target.closest("[data-px]");
    if (pb) {
      var pa = pb.dataset.px.split("|"), pp = PXSRC[pa[0]] || (pro && pro[pa[0]]);
      if (!pp) return;
      view.px[pa[0]] = pa[1];
      view.pxWin[pa[0]] = null;
      var boxEl = document.querySelector('.pxbox[data-asset="' + pa[0] + '"]');
      if (boxEl) { boxEl.innerHTML = pxChart(pp, pa[1]); setLang(root.lang); initCharts(boxEl); mountPx(boxEl); }
      pb.parentNode.querySelectorAll("[data-px]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === pb)); });
      return;
    }
    var rb = e.target.closest("[data-region]");
    if (rb) {
      view.region = rb.dataset.region; view.folder = null;
      render(); return;
    }
    var ib = e.target.closest("[data-ind]");
    if (ib) { openIndZoom(ib.dataset.ind); return; }
    var zb = e.target.closest("[data-zoom]");
    if (zb) { openZoom(zb.dataset.zoom); return; }
    var cb = e.target.closest(".chart:not(.big)");
    if (cb && e.target.closest("svg.plot")) { openZoom(chartData(cb).k); return; }
    var jb = e.target.closest("[data-jpg]");
    if (jb) { saveJpg(jb); return; }
    if (e.target.closest("[data-pdf]")) {
      var tw = window.__TAURI__;
      if (tw && tw.core) {
        // 앱: 인쇄 전에 세부지표를 펼치고, 시스템 인쇄 창(→ PDF로 저장)을 연다
        preparePrint();
        tw.core.invoke("print_page").catch(function () { window.print(); });
      } else {
        window.print();
      }
      return;
    }
    // 데스크탑·모바일 앱에서는 외부 링크를 시스템 브라우저로 연다
    var a = e.target.closest('a[target="_blank"]');
    var tauri = window.__TAURI__;
    if (a && tauri && tauri.core) {
      e.preventDefault();
      tauri.core.invoke("plugin:opener|open_url", { url: a.href }).catch(function () {});
    }
  });

  var tipEl = document.getElementById("tip");
  function show(e) {
    if (chartHover(e)) return;
    var el = e.target.closest("[data-tip-ko]");
    if (!el || el.hasAttribute("data-aria")) { tipEl.style.opacity = 0; return; }
    tipEl.textContent = el.getAttribute("data-tip-" + root.lang);
    var x = e.clientX + 14, y = e.clientY + 14, w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14;
    if (y + h > innerHeight - 8) y = e.clientY - h - 14;
    tipEl.style.left = x + "px"; tipEl.style.top = y + "px"; tipEl.style.opacity = 1;
  }
  function hide() { tipEl.style.opacity = 0; }
  function chartHover(e) {
    var box = e.target.closest(".chart");
    if (!box || box.classList.contains("big") || !box.querySelector("svg.plot").contains(e.target)) return false;
    if (e.pointerType === "mouse") setCursor(box, indexAt(box, e.clientX));
    hide();
    return true;
  }
  document.addEventListener("pointermove", show);
  document.addEventListener("pointerdown", show);
  document.addEventListener("pointerleave", hide);
  addEventListener("scroll", hide, { passive: true });

  // 인쇄·PDF: 접힌 세부지표를 모두 펼쳤다가 끝나면 원래대로
  var reopen = [];
  function preparePrint() {
    reopen = [];
    document.querySelectorAll("details").forEach(function (d) { if (!d.open) { reopen.push(d); d.open = true; } });
  }
  addEventListener("beforeprint", preparePrint);
  addEventListener("afterprint", function () { reopen.forEach(function (d) { d.open = false; }); reopen = []; });
  // ---------- JPG ----------
  // 이미지용 상태: 밝은 테마, 버튼·툴팁 숨김, 세부지표 펼침. 반환값은 문서 전체 높이(px).
  var prevTheme = null;
  function prepareImage(l) {
    if (l === "ko" || l === "en") setLang(l);
    preparePrint();
    prevTheme = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    root.classList.add("exporting");
    return Math.ceil(document.documentElement.scrollHeight);
  }
  function restoreImage() {
    root.classList.remove("exporting");
    if (prevTheme == null) root.removeAttribute("data-theme"); else root.setAttribute("data-theme", prevTheme);
    reopen.forEach(function (d) { d.open = false; });
    reopen = [];
  }
  /** JPG 생성 도구(fed_model/file_export.py)가 호출 */
  window.__fedPrepareImage = function (l) { return data ? prepareImage(l) : 0; };

  function fileName(ext) {
    var part = view.tab === "pro" && pro ? "_pro" + (view.folder ? "-" + view.folder : "") : view.tab !== "overview" && view.tab !== "pro" ? "_" + view.tab : "";
    return "fed-rate-outlook_" + (data ? data.meta.generated : "report") + part + "_" + root.lang + "." + ext;
  }
  function saveJpg(btn) {
    if (!window.html2canvas || btn.disabled) return;
    var label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = t(UI.jpgBusy);
    prepareImage(root.lang);
    var wrap = app.querySelector(".wrap");
    requestAnimationFrame(function () {
      window.html2canvas(wrap, {
        scale: 2, backgroundColor: getComputedStyle(document.body).backgroundColor, logging: false,
        windowWidth: wrap.scrollWidth, windowHeight: document.documentElement.scrollHeight,
      }).then(function (canvas) {
        var url = canvas.toDataURL("image/jpeg", 0.92);
        restoreImage();
        var tw = window.__TAURI__;
        if (tw && tw.core) {
          // 앱: 저장 위치를 고르는 창을 띄워 파일로 저장
          return tw.core.invoke("save_image", { dataBase64: url.split(",")[1], fileName: fileName("jpg") });
        }
        var a = document.createElement("a");
        a.href = url; a.download = fileName("jpg");
        document.body.appendChild(a); a.click(); a.remove();
      }).catch(function (err) {
        restoreImage();
        alert(word(UI.jpgFail, root.lang) + (err ? "\n" + err : ""));
      }).then(function () {
        btn.disabled = false;
        btn.innerHTML = label;
      });
    });
  }

  /** PDF 생성 도구(fed_model/file_export.py)가 호출: 언어를 정하고 인쇄용으로 펼친다. */
  window.__fedPreparePdf = function (l) { if (LANGS.indexOf(l) >= 0) setLang(l); preparePrint(); return !!data; };

  var saved = null;
  try { saved = localStorage.getItem(STORE); } catch (err) {}
  var nav = ((navigator.languages && navigator.languages[0]) || navigator.language || "").slice(0, 2).toLowerCase();
  root.lang = LANGS.indexOf(saved) >= 0 ? saved : LANGS.indexOf(root.lang) >= 0 && root.lang !== "ko" ? root.lang : nav === "ko" ? "ko" : LANGS.indexOf(nav) >= 0 ? nav : "ko";
  // 앱을 열면 항상 미국 연준 화면에서 시작한다 (마지막 탭을 복원하지 않음)
  load();
})();
