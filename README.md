# MID-60-tools

Self-hosted скринер дисоціативних розладів. Локальний клон [NovoPsych MID-60](https://novopsych.com/assessments/diagnosis/multidimensional-inventory-of-dissociation-60-item-version-mid-60/) для приватної практики: 60 пунктів самозвіту → клінічний звіт з ймовірним профілем (1 з 16), композитно-ранжованими підшкалами і дослівними інтерпретативними абзацами з OSF Technical Paper. UA + EN. Все рахується у браузері — жодних зовнішніх запитів.

**Статус:** v0.4 · продакшн у моїй практиці з травня 2026 · парний до [ampd-tools](https://github.com/BenBakster/ampd-tools)

## Для чого

- Скринінг перед SCID-D / DDIS / TADS-I. **Не діагноз.**
- Україномовний пацієнт + не хочеться платити NovoPsych і віддавати PHI зовні.
- Той самий share-flow і bot-gate, що у [ampd-tools](https://github.com/BenBakster/ampd-tools).

## Як запустити

```bash
cd mid60-tools
python3 -m http.server 8080
# → http://localhost:8080
```

`file://` не працює — JSON завантажується через `fetch()`.

## Що показує звіт

У порядку читання:

1. **Safety flag** — якщо спрацював будь-який з пп. 22 / 44 / 58 (самоушкодження / суїцидальні думки / прокинутися з лезом). Далі — за C-SSRS, не за рештою звіту.
2. **Загальний бал × 10** → ступінь тяжкості (Немає … Надзвичайна) + перцентилі community і clinical.
3. **Ймовірний профіль** з 16 — hierarchical алгоритм. Це **гіпотеза**, маршрутизує до структурного інтерв'ю.
4. **Топ-підшкали** за композитом `0.5 × tightness + 0.5 × breadth` — breadth важить нарівні з висотою.
5. **Інтерпретативні абзаци** — дослівно з OSF, можна цитувати у власному звіті.
6. **Endorsed items** — пацієнтські відповіді ≥ subscale cutoff для кожної підшкали at cutoff.

Повна методологія для лікаря — **[docs/MID-60-clinical-guide.pdf](docs/MID-60-clinical-guide.pdf)** (22 стор. UA). Практичний гід з DD-confound'ами і diferential — **[docs/INTERPRETATION.md](docs/INTERPRETATION.md)**.

## Чого інструмент НЕ робить

- Не пропонує ICD-/DSM-код.
- Не оцінює правдоподібність відповідей (валідність — на лікареві).
- Не зберігає звіт ніде поза вкладкою браузера — для архіву Ctrl+P → PDF.
- Не друкує висновок з підписом — це screening-output, не офіційний документ.

## PHI

- Все в браузері. `sessionStorage` тримає чернетку 1 год; `localStorage` — тільки мову UI.
- `.gitignore` виключає `responses/`, `*.responses.json`, `*.session.json`.
- Кнопка **«Надіслати лікарю»** (`🧠` на сторінці звіту) → POST на whitelisted endpoint бота, TTL=1 год, тільки для пацієнтів зі списку bookings. Той самий патерн, що в [ampd-tools — Share через Telegram-бот](https://github.com/BenBakster/ampd-tools#share-через-telegram-бот).

## Коли UA, коли EN

- **UA** — для скринінгу україномовних пацієнтів (дає природніше читання; пункти безпеки без пом'якшення).
- **EN** — для офіційних звітів, дослідження, судово-психіатричної експертизи (валідована Kate et al. 2021; UA психометричної валідації не проходив).

Перемикач — у верхньому правому куті.

## Джерела і ліцензія

- **Зміст інструменту:** [Kate & Hegarty 2026 OSF Technical Paper](https://doi.org/10.17605/OSF.IO/E83KC) — пункти, підшкали, межі, класифікація, інтерпретативний текст. Open-source per p. 2 документа. Page-by-page мапінг JSON↔OSF — **[docs/SOURCE.md](docs/SOURCE.md)**.
- **MID-60 developer paper:** Kate, Jamieson, Dorahy & Middleton, 2021. *J Trauma & Dissociation* 22(3): 265–287.
- **Програма (HTML/JS/CSS):** MIT.
- **UA переклад:** Claude Opus 4.7 + я. Неофіційний. Стиль — «ви» + активне дієслово (як DASS/PHQ-UA).

Не афілійовано з NovoPsych Pty Ltd.

## Внесок

PR на `data/items.json` (`text_uk`) або `data/subscales.json` (`interpretive_text_uk`). Канонічний UI — `index.html`.
