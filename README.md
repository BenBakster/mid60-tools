# MID-60-tools

Self-hosted скоринговий рушій для **Multidimensional Inventory of Dissociation – 60-item version (MID-60)**. Парний до [ampd-tools](https://github.com/BenBakster/ampd-tools) — vanilla HTML, без збірки, без сервера, усе рахується у браузері клієнта.

## Що всередині

- 60-пунктовий опитувальник для самозаповнення (UK за замовчуванням — літературний клінічний переклад; EN валідований — перемикач у верхньому правому куті)
- Скоринг: total mean × 10, 12 середніх по підшкалах, severity bands
- Перцентилі: community (Φ(z), μ=12.94 σ=13.32) + clinical (μ=56.8 σ=18.8)
- 16-категорійна Probable Profile Classification (Kate 2025)
- Safety flag (пункти 22 / 44 / 58) — авто-сповіщення про self-harm / суїцидальні думки
- Composite ranking `(score-cutoff)/cutoff + items_at_threshold/N` для вибору top-підшкал
- Дослівні interpretive paragraphs з OSF Technical Paper
- Print-to-PDF звіт

## Ліцензія та джерела

- **Software** — MIT.
- **Instrument content** — open-source ліцензія Kate & Hegarty 2026 ([OSF E83KC](https://doi.org/10.17605/OSF.IO/E83KC)). Пункти, прив'язка до підшкал, cutoff'и, правила класифікації, норми, interpretive text — усе дослівно з цього документа.
- MID-60 developer paper: Kate, Jamieson, Dorahy & Middleton, 2021. *J Trauma & Dissociation* 22(3): 265-287.

## Клінічне попередження

Скринінг, не діагноз. Використовувати лише в зв'язці з клінічним інтерв'ю і (за показаннями) SCID-D / DDIS / TADS-I. При спрацьованому safety flag — стандартний протокол оцінки суїцидального ризику.

## Структура

```
mid60-tools/
  index.html              # опитувальник + рендер звіту
  mid60-engine.js         # чистий рушій скорингу (без DOM)
  data/
    items.json            # 60 пунктів: text / subscale / safety flag
    subscales.json        # 12 підшкал: items / cutoff / interpretive text
    classification.json   # 16 діагностичних профілів + правила
    percentiles.json      # OSF percentile table (стор. 11)
    templates.json        # шаблони звіту + disclaimers
  docs/
    SOURCE.md             # звірка контенту з OSF сторінками
    test-engine.js        # тести рушія (звірка з OSF Sample Report)
    sample_responses.json # debug-дані для ?debug=1
```

## Roadmap

- [x] v0.1 — single-page HTML, локальне self-administration
- [x] v0.2 — літературний український переклад 60 пунктів + UI, перемикач EN/UK
- [x] v0.3 — audit fixes (3 blockers + 13 majors + ~15 minors)
- [ ] v0.4 — Telegram-бот gate у стилі ampd-tools (whitelist + PHI ≤ 1 год)
- [ ] v0.5 — мультиадміністраційний line plot для лонгітюду

## Український переклад

Claude Opus 4.7 + MD Psychiatrist Vilenchyk Anton, UA. Неофіційний — не валідований у популяційному дослідженні. Стиль: друга особа «ви» з активним дієсловом (як у DASS/PHQ-UA). Safety items 22/44/58 — без пом'якшення. Для офіційного звіту рекомендовано EN (валідована Kate et al. 2021), але для скринінгу україномовних пацієнтів UA дає природніше читання.
