# learn-dataviz-with-phoebe

**Six sessions, one dataset. Which encoding the question needs, and whether the picture is telling
the truth.**

Live: https://phoebefu6.github.io/learn-dataviz-with-phoebe/

Daybreak's roast revenue differs by 21 percent. A chart nobody thought was dishonest shows it as
173 percent - because somebody asked to make it pop and an axis default changed.

Running dataset: **Daybreak's subscription numbers**, the fifth course on the same company.

## What this course is not

| Question | Course |
|---|---|
| How do I read a metric and question it? | `learn-data-literacy-with-phoebe` |
| How do I commission and govern dashboards? | `learn-business-intelligence-with-phoebe` |
| What does the statistic mean? | `learn-statistics-with-phoebe` |
| How do I turn a set of charts into a story? | `learn-visual-storytelling-with-phoebe` |
| **Which encoding, and is it true?** | **here** |

**Session 6 is deliberately not about dashboards** - that is business-intelligence's job, and two
courses teaching one subject disagree with each other eventually.

## Sessions

1. What is the question? - the five jobs, and when it is not a chart
2. Choosing the form - form by job, sorting, and never a dual axis
3. **Honesty** - the lie-factor bench
4. Colour that works - four jobs, and a real CVD transform
5. Marks and anatomy - subtraction, direct labels, the table view
6. Publishing it - four containers, dark mode, print, alt text

## The bench

`assets/dv-live.js`. One real dataset, drawn as a real chart, with **three things measured off the
rendered output** - nothing looked up:

- **Lie factor** from the actual drawn geometry
- **WCAG 2.1 contrast** on the chart's own text against its own surface
- **Colour-vision separation** via a real dichromacy matrix, as an OKLab distance

Verified in-browser:

| State | Lie factor | Data | Chart shows |
|---|---|---|---|
| honest | **1.00** | 21% | 21% |
| axis from 30,000 | **8.32** | 21% | **173%** |
| area encoding | **0.70** | 21% | 15% |

The area row matters: **distortion runs both ways**, and nobody has ever complained that a chart
made a difference look too small.

CVD on the palette: normal 22.9 → tritan 23.1 → **deutan 10.0, protan 9.5**. Above the floor of 8,
and less than half the separation most readers get - which is the whole argument for a second
channel.

The palette is the validated categorical default: lightness, chroma, CVD separation and
normal-vision floor all PASS; the contrast WARN on two slots is discharged by direct labels, which
the chart carries.

## Structure

```
index.html                        landing, mindmap, paths
courses/01..06-*.html             the six sessions
assets/style.css                  editorial-bold, slate-teal + terracotta (PAGE chrome)
assets/dv-live.js                 the bench, and the chart palette (separate from the chrome)
assets/app.js  assets/mindmap.js
materials/official-course-map.md  source map, every constant, the palette report, honest limits
```

Static HTML, no build step:

```bash
python3 -m http.server 8000
```

by Phoebe Fu · part of [Learn with Phoebe](https://phoebefu6.github.io/learn-with-phoebe/)
