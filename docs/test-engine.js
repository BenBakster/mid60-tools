// Node.js smoke test for mid60-engine against the OSF sample report.
// Run: node docs/test-engine.js

var fs = require('fs');
var path = require('path');

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'));
}

require('../mid60-engine.js');
var MID60 = global.MID60;

var items       = loadJson('data/items.json').items;
var subscales   = loadJson('data/subscales.json').subscales;
var classification = loadJson('data/classification.json');
var percentiles = loadJson('data/percentiles.json');
var sample      = loadJson('docs/sample_responses.json');

// JSON object keys are strings — engine expects numeric ids.
var responses = {};
Object.keys(sample.responses).forEach(function (k) {
  responses[parseInt(k, 10)] = sample.responses[k];
});

var dataPack = {
  items: items,
  subscales: subscales,
  classification: classification,
  percentiles: percentiles
};

var result = MID60.scoreAssessment(responses, dataPack);

var expected = sample._expected;

console.log('=== Total ===');
console.log('  actual  total_mean =', result.raw.totalMean.toFixed(2));
console.log('  expected total_mean =', expected.total_mean);
console.log('  descriptor          =', result.descriptor);

console.log('=== Percentiles (table lookup at rounded score) ===');
console.log('  community (table)   =', result.percentiles.community);
console.log('  community (formula) =', result.percentiles.formula_community.toFixed(2));
console.log('  expected            =', expected.community_percentile);
console.log('  clinical  (table)   =', result.percentiles.clinical);
console.log('  clinical  (formula) =', result.percentiles.formula_clinical.toFixed(2));
console.log('  expected            =', expected.clinical_percentile);

console.log('=== Subscale means ===');
var subErrors = 0;
Object.keys(expected.subscale_means).forEach(function (key) {
  var actual = result.raw.subscaleMeans[key];
  var exp = expected.subscale_means[key];
  var ok = Math.abs(actual - exp) < 0.1;
  if (!ok) subErrors++;
  console.log(
    '  ' + (ok ? 'OK ' : 'XX ') +
    key.padEnd(18) +
    ' actual=' + actual.toFixed(2).padStart(6) +
    ' expected=' + String(exp).padStart(6) +
    (result.raw.atCutoff[key] ? ' [at cutoff]' : '')
  );
});

var nAtCutoff = Object.values(result.raw.atCutoff).filter(Boolean).length;
console.log('  subscales at cutoff:', nAtCutoff, 'of 12 (expected 12)');

console.log('=== Classification ===');
console.log('  actual   =', result.classification.id, result.classification.name);
console.log('  expected =', expected.classification);
console.log('  identity count =', result.classification.key.identityCount);

console.log('=== Safety flags ===');
result.safety_flags.forEach(function (f) {
  console.log('  item', f.id, '=', f.response + '/10');
});

console.log('=== Ranked subscales ===');
console.log('  diagnostic (top 4):');
result.ranked_subscales.diagnostic.forEach(function (e) {
  console.log('    ' + e.key + ' composite=' + e.composite.toFixed(3) +
              ' score=' + e.score.toFixed(1) + '/' + e.cutoff +
              ' items=' + e.items_at_threshold + '/' + e.total_items);
});
console.log('  additional (top 3):');
result.ranked_subscales.additional.forEach(function (e) {
  console.log('    ' + e.key + ' composite=' + e.composite.toFixed(3) +
              ' score=' + e.score.toFixed(1) + '/' + e.cutoff +
              ' items=' + e.items_at_threshold + '/' + e.total_items);
});

var totalOk = Math.abs(result.raw.totalMean - expected.total_mean) < 0.05;
var classOk = result.classification.name.indexOf('Dissociative Identity Disorder') >= 0;
var cutoffOk = nAtCutoff === 12;
var commOk = Math.abs(result.percentiles.community - expected.community_percentile) < 0.1;
var clinOk = Math.abs(result.percentiles.clinical - expected.clinical_percentile) < 0.5;

// ---------- edge case: all zeros ----------
console.log('\n=== Edge case: all zeros ===');
var zeros = {};
for (var i = 1; i <= 60; i++) zeros[i] = 0;
var Z = MID60.scoreAssessment(zeros, dataPack);
var zeroOk =
  Z.raw.totalMean === 0 &&
  Object.values(Z.raw.atCutoff).every(function (b) { return b === false; }) &&
  Z.classification.id === 16 &&  // Non-Clinical
  Z.safety_flags.length === 0;
console.log('  total=' + Z.raw.totalMean + ' cutoffs=' + Object.values(Z.raw.atCutoff).filter(Boolean).length +
            ' class=' + Z.classification.id + ' safety=' + Z.safety_flags.length);

// ---------- edge case: all tens ----------
console.log('=== Edge case: all tens ===');
var tens = {};
for (var j = 1; j <= 60; j++) tens[j] = 10;
var Tt = MID60.scoreAssessment(tens, dataPack);
var tenOk =
  Tt.raw.totalMean === 100 &&
  Object.values(Tt.raw.atCutoff).every(function (b) { return b === true; }) &&
  Tt.classification.id === 1 &&  // DID
  Tt.safety_flags.length === 3 &&
  Tt.descriptor.toLowerCase().indexOf('severe') >= 0;
console.log('  total=' + Tt.raw.totalMean + ' cutoffs=' + Object.values(Tt.raw.atCutoff).filter(Boolean).length +
            ' class=' + Tt.classification.id + ' safety=' + Tt.safety_flags.length + ' descriptor=' + Tt.descriptor);

// ---------- edge case: OCSD profile (#9) ----------
// Має класифікуватися як #9: total>=15 AND >=1 dissoc-relevant @cutoff
// AND Flashbacks NOT @cutoff AND no conversion AND не потрапив у #1-8.
// Конструкція: Amnesia at cutoff (без identity → не DID/OSDD) +
// Trance (підкручує total, але Trance не dissoc-relevant і не gate).
console.log('=== Edge case: OCSD (profile #9) ===');
var ocsd = {};
for (var ki = 1; ki <= 60; ki++) ocsd[ki] = 0;
[42, 45, 48, 58].forEach(function (id) { ocsd[id] = 10; });      // Amnesia
[21, 27, 30, 32, 41, 51].forEach(function (id) { ocsd[id] = 10; }); // Trance — щоб total>=15
var O = MID60.scoreAssessment(ocsd, dataPack);
var ocsdOk = O.classification.id === 9;
console.log('  total=' + O.raw.totalMean.toFixed(1) + ' class=' + O.classification.id + ' (' + O.classification.name_en + ')');

// ---------- edge case: pure DP/DR (#8) ----------
console.log('=== Edge case: DP/DR disorder (#8) ===');
var dp = {};
for (var di = 1; di <= 60; di++) dp[di] = 0;
[2, 7, 9, 13, 25, 47, 50, 53].forEach(function (id) { dp[id] = 10; });
dp[6] = 10;  // щоб total >= 15
var D = MID60.scoreAssessment(dp, dataPack);
var dpOk = D.classification.id === 8;
console.log('  total=' + D.raw.totalMean.toFixed(1) + ' class=' + D.classification.id + ' (' + D.classification.name_en + ')');

// ---------- edge case: out-of-range total ----------
console.log('=== Edge case: out-of-range clamp ===');
var clampOk = MID60.getDescriptor(-5, dataPack.percentiles.descriptor_bands, 'en') === 'None' &&
              MID60.getDescriptor(150, dataPack.percentiles.descriptor_bands, 'en').indexOf('Severe') >= 0;
console.log('  desc(-5) =', MID60.getDescriptor(-5, dataPack.percentiles.descriptor_bands, 'en'));
console.log('  desc(150) =', MID60.getDescriptor(150, dataPack.percentiles.descriptor_bands, 'en'));

console.log('\n=== Summary ===');
console.log('  total      :', totalOk ? 'PASS' : 'FAIL');
console.log('  comm pct   :', commOk ? 'PASS' : 'FAIL');
console.log('  clin pct   :', clinOk ? 'PASS' : 'FAIL');
console.log('  subscales  :', subErrors === 0 ? 'PASS' : 'FAIL (' + subErrors + ' errors)');
console.log('  cutoffs    :', cutoffOk ? 'PASS' : 'FAIL');
console.log('  class      :', classOk ? 'PASS' : 'FAIL');
console.log('  all-zeros  :', zeroOk ? 'PASS' : 'FAIL');
console.log('  all-tens   :', tenOk ? 'PASS' : 'FAIL');
console.log('  clamp      :', clampOk ? 'PASS' : 'FAIL');
console.log('  ocsd #9    :', ocsdOk ? 'PASS' : 'FAIL');
console.log('  dp/dr #8   :', dpOk ? 'PASS' : 'FAIL');

process.exit(totalOk && classOk && cutoffOk && commOk && clinOk && subErrors === 0 && zeroOk && tenOk && clampOk && ocsdOk && dpOk ? 0 : 1);
