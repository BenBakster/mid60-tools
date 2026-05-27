# MID-60-tools

Self-hosted scoring engine for the **Multidimensional Inventory of Dissociation – 60-item version (MID-60)**. Парный к [ampd-tools](https://github.com/BenBakster/ampd-tools) — vanilla HTML, без сборки, без сервера, всё считается клиентом.

## Что внутри

- 60-пунктовая форма заполнения (UK за замовчуванням — літературний клінічний переклад; EN валідований — переключач у верхньому правому куті)
- Скоринг: total mean × 10, 12 subscale means, severity bands
- Перцентили: community (Φ(z), μ=12.94 σ=13.32) + clinical (μ=56.8 σ=18.8)
- 16-категорийная Probable Profile Classification (Kate 2025)
- Safety flag (items 22 / 44 / 58) — авто-оповещение о self-harm/suicidal ideation
- Composite ranking (`(score-cutoff)/cutoff + items_at_threshold/N`) для выбора top субшкал
- Дословные interpretive paragraphs из OSF Technical Paper
- Print-to-PDF отчёт

## Лицензия и источники

- **Software** — MIT.
- **Instrument content** — open-source licence Kate & Hegarty 2026 ([OSF E83KC](https://doi.org/10.17605/OSF.IO/E83KC)). Items, subscale assignments, cutoffs, classification rules, norms, interpretive text — всё дословно из этого документа.
- MID-60 developer paper: Kate, Jamieson, Dorahy & Middleton, 2021. *J Trauma & Dissociation* 22(3): 265-287.

## Клиническое предупреждение

Скрининг, не диагноз. Использовать только в связке с клиническим интервью и (при показаниях) SCID-D / DDIS / TADS-I. При сработавшем safety flag — стандартный протокол оценки суицидального риска.

## Структура

```
mid60-tools/
  index.html        # форма
  report.html       # отчёт (рендерится из URL-hash или localStorage)
  data/
    items.json      # 60 items: text/subscale/safety flag
    subscales.json  # 12 subscales: items/cutoff/interpretive text
    classification.json   # 16 диагностических профилей + правила
    percentiles.json      # OSF percentile table (стр. 11)
  docs/
    SOURCE.md       # сверка нашего content с OSF страницами
```

## Roadmap

- [x] v0.1 — single-page HTML, локальный self-administration
- [x] v0.2 — літературний український переклад 60 items + UI, переключач EN/UK
- [ ] v0.3 — Telegram-бот gate в стилі ampd-tools (whitelist + PHI ≤ 1ч)
- [ ] v0.4 — мультиадміністраційний line plot для лонгітюду

## Український переклад

Робочий клінічний переклад (Vilenchyk 2026, неофіційний — не валідований у популяційному дослідженні). Стиль: друге лице «ви» з активним дієсловом, як у DASS/PHQ-UA. Safety items 22/44/58 — без пом'якшення. Для офіційного звіту досі рекомендовано EN-первинна мова (вона валідована Kate et al. 2021), але для скринінгу україномовних пацієнтів — UA дає природніше читання.
