# Source provenance — mid60-tools

Усі дані в `data/*.json` відтворені дослівно з відкритого джерела. Цей файл — page-by-page мапінг наших JSON-ключів на конкретні сторінки first-party документу.

## Primary source

**Kate, M.-A., & Hegarty, D. L. (2026).** *A Review of the Clinical Utility and Psychometric Properties of the Multidimensional Inventory of Dissociation – 60-item Version (MID-60): Norms, Percentile Rankings, and Qualitative Descriptors.* OSF. <https://doi.org/10.17605/OSF.IO/E83KC>

**Ліцензія (OSF document p. 2):** «*The information in this document can be used without permission by researchers and clinicians and distributed under an open source licence.*» — формулювання без явного SPDX-ідентифікатора; **точний URL гіперлінку «open source» на стор. 2 потребує верифікації в браузері OSF** (TODO для Антона — відкрити PDF, клікнути на слово "open source" на стор. 2, зафіксувати URL і записати тут). Ми трактуємо як «attribution-required, redistribution-allowed» до уточнення.

## Mapping JSON ↔ OSF pages

| Наш ключ | Файл | OSF сторінка / розділ |
|---|---|---|
| `items[*].text_en` (60 пунктів) | `data/items.json` | стор. 18–21 (Assessment Questions) |
| `_safety_items: [22, 44, 58]` | `data/items.json` | стор. 12 (Safety Flag Section) |
| `subscales[*].items`, `cutoff`, `display_name_en` | `data/subscales.json` | стор. 6–7 (MID-60 Subscales) |
| `subscales[*].interpretive_text_en` | `data/subscales.json` | стор. 15–16 (Subscale Interpretive Text) |
| `profiles[*]` (16 категорій) — назви, family, criteria | `data/classification.json` | стор. 8–9 (Supporting Information — A priori classification rules) |
| `_key_variables` (IdentityCount, DissocRelevant, OCSDMet, HasConversion) | `data/classification.json` | стор. 8 (Supporting Information — Key Variables) |
| `_diagnostic_subscales` | `data/classification.json` | стор. 13 (Section 1 — Subscales Contributing to Profile) |
| `_norms.community` (μ=12.94, σ=13.32, n=1014) | `data/percentiles.json` | стор. 4 (MID-60 Community sample) + стор. 10 |
| `_norms.clinical` (μ=56.8, σ=18.8, n=30) | `data/percentiles.json` | стор. 4 (MID-60 Clinical samples) + стор. 10 |
| `_formula` Φ(z) × 100 | `data/percentiles.json` | стор. 10 (Percentile Calculations) |
| `percentile_table` (101 рядок) | `data/percentiles.json` | стор. 11 (Percentile Table) |
| `descriptor_bands` (None…Ext.Severe) | `data/percentiles.json` | стор. 11 (color-coded severity bands) |
| `total_score_interpretation` (0–6 … 80+) | `data/percentiles.json` | стор. 5 (MID-60 Total Score) |
| `opening`, `safety`, `diagnostic_section`, `additional_section`, `subscale_block` templates | `data/templates.json` | стор. 12–14 (Interpretive Text — Opening Summary, Safety Flag Section, Sections 1 & 2) |
| `no_elevated_subscales` | `data/templates.json` | стор. 14 (No Elevated Subscales) |
| `instructions` | `data/templates.json` | стор. 18 (форма p. 1) |
| `clinical_use_disclaimer` | `data/templates.json` | стор. 7 (MID-60 Clinical Use) |
| Composite ranking formula `0.5 × prop_excess + 0.5 × item_prop` | `mid60-engine.js:225` | стор. 13 (Subscale Selection and Ranking) |

## Known approximations (deviations from NovoPsych)

NovoPsych's exact algorithm is not fully public. Our `mid60-engine.js` mirrors OSF Technical Paper rules where they're explicit, and approximates where they're not. Known approximations:

1. **Item-level clinical threshold** (`mid60-engine.js:46`). OSF p. 13 calls for "respective item-level clinical thresholds" but doesn't define them numerically. We use `response * 10 >= subscale_cutoff`. Verified against OSF Sample Report (12 subscales):
   - **8/12 subscales match exactly**: Amnesia, AlterPerson, AngryIntrusion, PersecIntrusion, DistressMemory, Flashbacks, BodySymptoms, Seizures.
   - **4/12 differ by 1 item**: DeperDereal (we count 6, NovoPsych 5), AutoMemory (we 3, they 2), Trance (we 5, they 6), SelfConfusion (we 5, they 6).
   - Impact: only `items_at_threshold` field and the `breadth` component of the composite ranking. Subscale means, `atCutoff`, classification — all unaffected.

2. **Composite ranking sort order** (`mid60-engine.js:230`). OSF p. 13: «sorted by composite score in descending order, formula `0.5 × proportional_excess + 0.5 × item_proportion`». We follow the formula literally; NovoPsych's Sample Report sorts Persecutory before Amnesia despite Amnesia having higher composite. Our output diverges by sort order only — the same subscales appear, just rearranged.

## Derived works (not from OSF)

- **`text_uk` усіх 60 items + UA-переклад interpretive_text/templates/UI** — робочий клінічний переклад (Vilenchyk 2026, неофіційний). НЕ валідований у популяційному дослідженні. Для діагностичного звіту, дослідження або судово-психіатричної експертизи використовувати EN (Kate et al. 2021).
- **Architecture, HTML/CSS/JS UI, report renderer** — original work, MIT licensed.

## Secondary references (cited, no content reused)

- **Dell, P. F. (2006).** The Multidimensional Inventory of Dissociation (MID): A comprehensive measure of pathological dissociation. *Journal of Trauma & Dissociation*, 7(2), 77–106. <https://doi.org/10.1300/J229v07n02_06> — оригінальний MID-218.
- **Kate, M.-A., Jamieson, G., Dorahy, M. J., & Middleton, W. (2021).** Measuring Dissociative Symptoms and Experiences in an Australian College Sample Using a Short Version of the Multidimensional Inventory of Dissociation. *Journal of Trauma & Dissociation*, 22(3), 265–287. <https://doi.org/10.1080/15299732.2020.1792024> — MID-60 developer paper.
- **Kate, M.-A., Jamieson, G., & Middleton, W. (2023).** Parent-child dynamics as predictors of dissociation in adulthood. *European Journal of Trauma & Dissociation*, 7(1), 100312. <https://doi.org/10.1016/j.ejtd.2023.100312> — clinical normative sample (n=30).
- **McRoberts, K. J. (2025).** *Examining Whether There is a Relationship Between Embodied Sense of Self and Dissociative Experiences* [Unpublished Masters thesis]. University of Canterbury. — UK community sample (n=701).

## Non-affiliation

This is an **independent open-source implementation**. It is not affiliated with, endorsed by, or derived from NovoPsych Pty Ltd. Content from Kate & Hegarty (2026) is reused under the open-source licence granted by the technical paper authors on p. 2 of the document. The NovoPsych report layout, branding, and proprietary software are NOT copied; this tool generates its own report from the same underlying psychometric rules.
