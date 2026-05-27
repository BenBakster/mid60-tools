// MID-60 scoring engine.
// Pure functions; no DOM access; no I/O. Pass in the loaded JSON
// (items.json, subscales.json, classification.json, percentiles.json)
// and an array of 60 responses (0–10, indexed by item id 1..60).
//
// Source for all rules: Kate & Hegarty 2026 OSF Technical Paper.

(function (root) {
  'use strict';

  // ---------- raw scores ----------

  function mean(arr) {
    if (!arr.length) return 0;
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
  }

  // responses: { 1: 0..10, 2: 0..10, ... 60: 0..10 }
  function computeRawScores(responses, items, subscales) {
    var values = [];
    for (var i = 1; i <= 60; i++) {
      var v = responses[i];
      if (typeof v !== 'number' || isNaN(v)) v = 0;
      values.push(v);
    }
    var totalMean = mean(values) * 10;

    var subMeans = {};
    var atCutoff = {};
    var itemsAtThreshold = {};

    Object.keys(subscales).forEach(function (key) {
      var sub = subscales[key];
      var ids = sub.items;
      var sum = 0;
      var nAtItemThreshold = 0;
      for (var j = 0; j < ids.length; j++) {
        var resp = responses[ids[j]];
        if (typeof resp !== 'number' || isNaN(resp)) resp = 0;
        sum += resp;
        // item-level clinical threshold = subscale cutoff / 10
        // (subscale mean = mean(items) * 10; an item "contributes"
        //  when its raw response * 10 >= cutoff)
        if (resp * 10 >= sub.cutoff) nAtItemThreshold++;
      }
      var m = (sum / ids.length) * 10;
      subMeans[key] = m;
      atCutoff[key] = m >= sub.cutoff;
      itemsAtThreshold[key] = nAtItemThreshold;
    });

    return {
      totalMean: totalMean,
      subscaleMeans: subMeans,
      atCutoff: atCutoff,
      itemsAtThreshold: itemsAtThreshold
    };
  }

  // ---------- percentiles ----------

  // Approximation of the standard normal CDF (Abramowitz & Stegun 26.2.17).
  function normalCdf(x) {
    var t = 1 / (1 + 0.2316419 * Math.abs(x));
    var d = 0.3989422804014327 * Math.exp(-x * x / 2);
    var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return x >= 0 ? 1 - p : p;
  }

  function percentileFromNorms(score, mu, sigma) {
    var z = (score - mu) / sigma;
    return normalCdf(z) * 100;
  }

  // OSF table is the published reference; we prefer it over our own CDF
  // approximation when the score is an integer 0..100.
  function lookupPercentileTable(score, percentileTable) {
    var rounded = Math.round(score);
    if (rounded < 0) rounded = 0;
    if (rounded > 100) rounded = 100;
    var row = percentileTable[rounded];
    return { community: row.community, clinical: row.clinical };
  }

  function computePercentiles(totalMean, percentilesData) {
    var tableResult = lookupPercentileTable(totalMean, percentilesData.percentile_table);
    var formulaResult = {
      community: percentileFromNorms(
        totalMean,
        percentilesData._norms.community.mu,
        percentilesData._norms.community.sigma
      ),
      clinical: percentileFromNorms(
        totalMean,
        percentilesData._norms.clinical.mu,
        percentilesData._norms.clinical.sigma
      )
    };
    return {
      community: tableResult.community,
      clinical: tableResult.clinical,
      formula_community: formulaResult.community,
      formula_clinical: formulaResult.clinical
    };
  }

  function L(obj, field, lang) {
    if (!obj) return '';
    var v = obj[field + '_' + lang];
    if (v !== undefined && v !== null) return v;
    var en = obj[field + '_en'];
    if (en !== undefined && en !== null) return en;
    return obj[field] || '';
  }

  function getDescriptor(totalMean, bands, lang) {
    lang = lang || 'en';
    var s = Math.round(totalMean);
    for (var i = 0; i < bands.length; i++) {
      if (s >= bands[i].min && s <= bands[i].max) return L(bands[i], 'label', lang);
    }
    return L(bands[bands.length - 1], 'label', lang);
  }

  function getTotalScoreInterpretation(totalMean, ranges, lang) {
    lang = lang || 'en';
    var s = Math.round(totalMean);
    for (var i = 0; i < ranges.length; i++) {
      if (s >= ranges[i].min && s <= ranges[i].max) return L(ranges[i], 'text', lang);
    }
    return '';
  }

  // ---------- safety flags ----------

  // Items 22, 44, 58 — any response >= 1 raises a flag.
  function safetyFlags(responses, items, lang) {
    lang = lang || 'en';
    var flags = [];
    items.forEach(function (item) {
      if (item.safety_flag) {
        var v = responses[item.id];
        if (typeof v === 'number' && v >= 1) {
          flags.push({ id: item.id, text: L(item, 'text', lang), response: v });
        }
      }
    });
    flags.sort(function (a, b) { return a.id - b.id; });
    return flags;
  }

  // ---------- 16-category classification ----------

  function computeKeyVars(atCutoff) {
    var identitySubs = ['AlterPerson', 'AngryIntrusion', 'PersecIntrusion'];
    var dissocRelevant = ['AlterPerson', 'AngryIntrusion', 'PersecIntrusion', 'DeperDereal', 'AutoMemory', 'Amnesia'];
    var identityCount = 0;
    identitySubs.forEach(function (s) { if (atCutoff[s]) identityCount++; });
    var anyDissoc = dissocRelevant.some(function (s) { return atCutoff[s]; });
    var hasConversion = atCutoff.Seizures || atCutoff.BodySymptoms;
    return {
      identityCount: identityCount,
      anyDissocRelevant: anyDissoc,
      hasConversion: hasConversion
    };
  }

  // returns true if all listed subscales are at cutoff
  function allAt(atCutoff, list) {
    if (!list || !list.length) return true;
    return list.every(function (s) { return atCutoff[s] === true; });
  }
  function anyAt(atCutoff, list) {
    if (!list || !list.length) return false;
    return list.some(function (s) { return atCutoff[s] === true; });
  }
  function noneAt(atCutoff, list) {
    if (!list || !list.length) return true;
    return list.every(function (s) { return atCutoff[s] !== true; });
  }

  function evalCriteria(criteria, ctx) {
    if (criteria.default) return true;

    if (typeof criteria.total_min === 'number' && ctx.totalMean < criteria.total_min) return false;
    if (criteria.at_cutoff && !allAt(ctx.atCutoff, criteria.at_cutoff)) return false;
    if (criteria.not_at_cutoff && !noneAt(ctx.atCutoff, criteria.not_at_cutoff)) return false;
    if (criteria.any_at_cutoff && !anyAt(ctx.atCutoff, criteria.any_at_cutoff)) return false;
    if (typeof criteria.identity_count_min === 'number' && ctx.identityCount < criteria.identity_count_min) return false;
    if (typeof criteria.dissoc_relevant_min === 'number' && criteria.dissoc_relevant_min >= 1 && !ctx.anyDissocRelevant) return false;
    if (criteria.dissoc_relevant_min === 0 && ctx.anyDissocRelevant) return false;
    if (criteria.has_conversion === true && !ctx.hasConversion) return false;
    if (criteria.no_conversion === true && ctx.hasConversion) return false;
    if (criteria.ocsd_met === true && !ctx.ocsdMet) return false;
    if (criteria.ocsd_met === false && ctx.ocsdMet) return false;

    if (criteria.any_of && criteria.any_of.length) {
      var ok = criteria.any_of.some(function (sub) { return evalCriteria(sub, ctx); });
      if (!ok) return false;
    }
    return true;
  }

  function classify(totalMean, atCutoff, classificationData, lang) {
    lang = lang || 'en';
    var key = computeKeyVars(atCutoff);
    var ocsdMet = (totalMean >= 15) && key.anyDissocRelevant;
    var ctx = {
      totalMean: totalMean,
      atCutoff: atCutoff,
      identityCount: key.identityCount,
      anyDissocRelevant: key.anyDissocRelevant,
      hasConversion: key.hasConversion,
      ocsdMet: ocsdMet
    };

    function pack(p) {
      return {
        id: p.id,
        name: L(p, 'name', lang),
        name_en: p.name_en,
        family: L(p, 'family', lang),
        key: key,
        ocsdMet: ocsdMet
      };
    }

    for (var i = 0; i < classificationData.profiles.length; i++) {
      var p = classificationData.profiles[i];
      if (evalCriteria(p.criteria, ctx)) return pack(p);
    }
    return pack(classificationData.profiles[classificationData.profiles.length - 1]);
  }

  // ---------- composite ranking ----------
  // (0.5 * proportional_excess) + (0.5 * item_proportion)
  // proportional_excess = (score - cutoff) / cutoff
  // item_proportion = items_at_threshold / total_items

  function compositeScore(subKey, subscaleMeans, subscales, itemsAtThreshold) {
    var sub = subscales[subKey];
    var score = subscaleMeans[subKey];
    var propExcess = (score - sub.cutoff) / sub.cutoff;
    var nItems = sub.items.length;
    var itemProp = itemsAtThreshold[subKey] / nItems;
    return 0.5 * propExcess + 0.5 * itemProp;
  }

  function rankElevatedSubscales(atCutoff, subscaleMeans, subscales, itemsAtThreshold, diagnosticList) {
    var diagSet = {};
    (diagnosticList || []).forEach(function (k) { diagSet[k] = true; });

    var diagnosticElevated = [];
    var additionalElevated = [];

    Object.keys(atCutoff).forEach(function (key) {
      if (!atCutoff[key]) return;
      var entry = {
        key: key,
        score: subscaleMeans[key],
        cutoff: subscales[key].cutoff,
        items_at_threshold: itemsAtThreshold[key],
        total_items: subscales[key].items.length,
        composite: compositeScore(key, subscaleMeans, subscales, itemsAtThreshold)
      };
      if (diagSet[key]) diagnosticElevated.push(entry);
      else additionalElevated.push(entry);
    });

    function byCompositeDesc(a, b) { return b.composite - a.composite; }
    diagnosticElevated.sort(byCompositeDesc);
    additionalElevated.sort(byCompositeDesc);

    return {
      diagnostic: diagnosticElevated.slice(0, 4),
      additional: additionalElevated.slice(0, 3)
    };
  }

  // ---------- highest-endorsed items per subscale ----------

  function highestEndorsedItems(subKey, responses, items, subscales, limit, lang) {
    lang = lang || 'en';
    var ids = subscales[subKey].items;
    var rows = [];
    ids.forEach(function (id) {
      var item = items.find(function (x) { return x.id === id; });
      var v = responses[id];
      if (typeof v !== 'number' || isNaN(v)) v = 0;
      rows.push({ id: id, response: v, text: item ? L(item, 'text', lang) : '' });
    });
    rows.sort(function (a, b) {
      if (b.response !== a.response) return b.response - a.response;
      return a.id - b.id;
    });
    return rows.slice(0, limit || 3);
  }

  // ---------- top-level convenience ----------

  function scoreAssessment(responses, dataPack, lang) {
    lang = lang || 'en';
    var raw = computeRawScores(responses, dataPack.items, dataPack.subscales);
    var perc = computePercentiles(raw.totalMean, dataPack.percentiles);
    var descriptor = getDescriptor(raw.totalMean, dataPack.percentiles.descriptor_bands, lang);
    var interp = getTotalScoreInterpretation(raw.totalMean, dataPack.percentiles.total_score_interpretation, lang);
    var flags = safetyFlags(responses, dataPack.items, lang);
    var classification = classify(raw.totalMean, raw.atCutoff, dataPack.classification, lang);

    var diagSubs = dataPack.classification._diagnostic_subscales[String(classification.id)] || [];
    var ranked = rankElevatedSubscales(raw.atCutoff, raw.subscaleMeans, dataPack.subscales, raw.itemsAtThreshold, diagSubs);

    return {
      raw: raw,
      percentiles: perc,
      descriptor: descriptor,
      total_interpretation: interp,
      safety_flags: flags,
      classification: classification,
      ranked_subscales: ranked
    };
  }

  var api = {
    computeRawScores: computeRawScores,
    computePercentiles: computePercentiles,
    getDescriptor: getDescriptor,
    getTotalScoreInterpretation: getTotalScoreInterpretation,
    safetyFlags: safetyFlags,
    classify: classify,
    compositeScore: compositeScore,
    rankElevatedSubscales: rankElevatedSubscales,
    highestEndorsedItems: highestEndorsedItems,
    scoreAssessment: scoreAssessment,
    normalCdf: normalCdf
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MID60 = api;
})(typeof window !== 'undefined' ? window : globalThis);
