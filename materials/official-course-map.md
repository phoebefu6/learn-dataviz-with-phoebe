# Official course map - learn-dataviz-with-phoebe

Six sessions, 45 minutes each, one running dataset: **Daybreak's subscription numbers** -
signups, cancellations, revenue by roast, retention by cohort. The coffee-subscription brand from
`learn-sql-with-phoebe` and the four courses shipped alongside this one, which makes this the
fifth course on the same company.

Written and verified 2026-08-26.

---

## What this course is NOT

| If the question is | The course is |
|---|---|
| How do I read a metric and question it? | `learn-data-literacy-with-phoebe` |
| How do I commission and govern dashboards? | `learn-business-intelligence-with-phoebe` |
| How do I break a metric into a driver tree? | `learn-metric-decomposition-with-phoebe` |
| What does the statistic actually mean? | `learn-statistics-with-phoebe` |
| How do I build a deck that carries a talk? | `learn-ai-ppt-with-phoebe` |
| How do I turn a set of charts into a story? | `learn-visual-storytelling-with-phoebe` |
| **Which encoding does this question need, and is the picture telling the truth?** | **this course** |

**Session 6 is deliberately not about dashboards.** Dashboard design belongs to
`learn-business-intelligence-with-phoebe`, and two courses teaching it would be the same
overlap problem that merged corporate-training into `learn-course-design-with-phoebe`. Session 6
is about publishing one chart across the containers it has to survive.

---

## Session coverage

Legend: ✓ taught in full · ◐ touched, with the depth pointed elsewhere

### 1 - What is the question?
| Source | | Covered |
|---|---|---|
| The chart's job decides the form | ✓ | magnitude, identity, polarity, change over time, one headline number |
| Sometimes it is not a chart | ✓ | a single number, a stat tile or a sentence beats a plot more often than people expect |
| One question per chart | ✓ | a chart answering three questions answers none of them well |
| Writing the question down first | ✓ | the same discipline as an objective or a design brief - it decides everything downstream |
| Statistical choice of summary | ◐ | mean against median, and what a distribution hides: `learn-statistics-with-phoebe` |

### 2 - Choosing the form
| Source | | Covered |
|---|---|---|
| Form by job | ✓ | bar for magnitude comparison, line for change, dot for sparse comparison, heatmap for a matrix |
| **Never a dual axis** | ✓ | two measures on two y-scales invite any correlation the author wants. Two charts, small multiples, or index to a common base |
| Sorting is free | ✓ | the largest single improvement available to a categorical bar chart |
| Small multiples | ✓ | when one chart with eight series should be eight charts with one |
| Pie charts, honestly | ✓ | acceptable for a part-to-whole with two or three parts; a bar is better for almost everything else |
| Chart libraries and tooling | ◐ | the method is tool-agnostic. Any library can draw any of these badly |

### 3 - Honesty · **the bench lands here**
| Source | | Covered |
|---|---|---|
| The lie factor (Tufte) | ✓ | effect in the graphic over effect in the data. **Computed live from the drawn geometry** |
| Truncated axes | ✓ | the most common distortion in professional charts. Measured: 21 percent in the data shown as 173 percent |
| Area against length | ✓ | scaling both dimensions understates as reliably as truncation overstates. Measured at 0.70 |
| 3D and gradients | ✓ | depth moves the top face away from the value; a gradient costs contrast and implies variation that is not there |
| Cherry-picked windows | ✓ | the same series over three windows telling three stories, with none of them false |
| Deliberate deception | ◐ | this session is about the distortions honest people ship by accident, which are far more common |

### 4 - Colour that works
| Source | | Covered |
|---|---|---|
| The four jobs of colour | ✓ | categorical (identity), sequential (magnitude), diverging (polarity), status (state) - one rule each |
| One series, one colour | ✓ | four hues for four bars of the same measure is colour-by-rank, and it is everywhere |
| Sequential is one hue; diverging is two plus a neutral | ✓ | never a rainbow, never a hue at the diverging midpoint |
| Colour-vision deficiency | ✓ | **a real dichromacy matrix transform**, with the palette's separation measured in OKLab |
| Contrast | ✓ | WCAG 2.1 computed on the chart's own text against its own surface |
| Never meaning in hue alone | ✓ | direct labels, position or texture as the second channel |
| Colour theory as aesthetics | ◐ | this session is about colour as an encoding, not as decoration |

### 5 - Marks and anatomy
| Source | | Covered |
|---|---|---|
| Thin marks and recessive scaffolding | ✓ | the grid is visible when looked for and invisible when not |
| Direct labels over legends | ✓ | a single series needs no legend; up to four series get direct labels as well as one |
| Text wears text colours | ✓ | values and labels stay in ink; a coloured mark beside them carries identity |
| The hover layer | ✓ | an HTML chart is interactive by default - crosshair and tooltip on lines, per-mark on bars |
| The table view | ✓ | always available, and it is what discharges a contrast warning |
| Animation | ◐ | named, with the caution that animated transitions between unrelated states teach nothing |

### 6 - Publishing it
| Source | | Covered |
|---|---|---|
| The same chart in four containers | ✓ | a report, a slide, a phone, and print - each removes something the others allowed |
| Responsive charts | ✓ | scroll-lock with a swipe affordance beats squeezing labels to 4px |
| Dark mode is a second palette | ✓ | selected against the dark surface, not an automatic inversion. Ratios do not survive being flipped |
| Print and forced colours | ✓ | texture and direct labels as the fallback when hue is gone |
| The alt text and the table | ✓ | what a screen reader gets, and why the table view is not a consolation prize |
| Dashboard layout and governance | ◐ | `learn-business-intelligence-with-phoebe` - deliberately not here |

---

## The bench: `assets/dv-live.js`

One real dataset, drawn as a real chart. **Three things are genuinely measured off the rendered
output** - nothing on this widget is looked up:

1. **Lie factor**, from the actual geometry of the drawn rectangles. Truncate the axis and the
   number moves because the rectangles moved.
2. **WCAG 2.1 contrast**, computed on the chart's own text against its own surface.
3. **Colour-vision separation**, via a real dichromacy matrix transform of the palette, reported
   as an OKLab distance.

**Verified in-browser 2026-08-26. These are the numbers the session pages quote.**

| State | Lie factor | Data says | Chart shows | Worst contrast |
|---|---|---|---|---|
| the honest chart | **1.00** | 21% | 21% | 4.42:1 |
| + start the axis at 30,000 | **8.32** | 21% | **173%** | 5.35:1 |
| + scale by area instead of length | **0.70** | 21% | 15% | 5.35:1 |
| **"make it pop"** (truncate + 3D + gradient) | **8.32** | 21% | **173%** | 4.42:1 |

The area row is the one worth pausing on: **distortion runs both ways.** Area encoding
*understates* the difference as reliably as a truncated axis overstates it, and nobody ever
accuses an under-stating chart of lying.

### The palette, and its CVD numbers

The chart palette is the **validated categorical default**, run through the data-viz validator:
lightness band PASS, chroma floor PASS, CVD separation PASS (worst adjacent 9.1 protan),
normal-vision floor PASS (22.9), and a contrast WARN below 3:1 on two slots - **discharged by
direct labels, which this chart carries.** That relief is required, not optional, and the widget
provides it.

Measured live by the bench, on the same four hues:

| Vision | Worst adjacent ΔE | Reading |
|---|---|---|
| normal | 22.9 | comfortable |
| tritanopia | 23.1 | comfortable |
| deuteranopia | **10.0** | above the 8 floor, visibly compressed |
| protanopia | **9.5** | above the floor, and the closest call |

Two hues that sit 22.9 apart for most readers sit 9.5 apart for a protanope. That is the entire
argument for a second channel, and it is why the bench reports the number rather than showing a
swatch and asking you to judge.

### The anti-lever

**"Make it pop"** switches on three levers at once - truncate the axis, add depth, add a gradient
- because that is what the request means in practice. It is the most common thing anybody ever
says to a chart, and every component of it is either a distortion or a cost.

The sentence the bench gives you is not "that would be misleading". It is: *"That version shows a
21 percent difference as 173 percent. Happy to make it bolder - can we do it with colour and a
direct label instead?"*

---

## Honest limits, stated on the pages

- The **lie factor is a real measurement** of this chart, and it is a blunt instrument: it
  compares the largest and smallest item. A chart can score 1.00 and still mislead by its choice
  of window, denominator or comparison, which is why session 3 covers those separately.
- The **CVD transform is a simulation**, not what a person with that condition sees. It is a
  standard approximation and it is good enough to catch a palette that will fail.
- The **contrast figure is computed on the text this chart draws.** It is not an audit of your
  chart, it is a demonstration that the audit is arithmetic.
- Daybreak's numbers are a **teaching dataset**. The measurement code is real.

Certificates, videos and graded assessments stay with the official providers.
