# CLAUDE.md

Context voor Claude bij het werken aan deze repo. Lees dit eerst voordat je iets verandert.

---

## Wie is de eigenaar (gebruiker)

Hou hier rekening mee bij alle features, copy, en design-keuzes:

- **21 jaar**, Nederland
- Laatste jaar **HBO ICT**
- Start over ~4 maanden bij **Defensie als officier ICT**
- Sport: **BJJ** (3 goud, 2 zilver, 2 brons), MMA, kickboks, gym 4x/week
- Werkt **vr+za nacht in casino** (20:00–05:15) — slaap- en schermtijdregels werken op die dagen niet zoals doordeweeks
- Stage ma–vr 9–17
- **Doelen**: eigen coaching bedrijf voor mannen, YouTube over zijn proces, funded trading account
- **Zwaktes** (zelf benoemd): stopt na een maand met nieuwe gewoontes, revenge trading, te veel tegelijk willen, vermijdt lastige gesprekken
- **Sterktes**: hoge discipline voor zijn leeftijd, eerlijk met zichzelf

Taal: **Nederlands**, casual, schrijft met typos (bv. "hebbne", "iets aners"). Niet corrigeren, gewoon matchen op informeel niveau. Hij waardeert directe, korte antwoorden boven beleefdheid.

---

## Wat de app is

**OPERATION YOU** — een gepersonaliseerde 75-dagen self-improvement challenge tracker. Niet de standaard Andy Frisella 75 Hard (dat is hardcoded, generiek). Bij deze app vertelt de gebruiker zijn verhaal tijdens onboarding (verhaal, sterktes, zwaktes, dag-75 visie) en Claude genereert daarop een **persoonlijk manifest, schaduw-analyse en 12 unieke wetten**.

De gebruiker wil dat de app hem dwingt om dagelijks dingen te doen waar hij beter van wordt. Claude is voor feedback en hulp als hij vastloopt — geen wandelende coach die overal opspringt.

---

## Architectuur

**Eén HTML-bestand. Geen build. Geen framework. Vanilla JS.**

- `index.html` — de complete app (~210k chars, ~3800 lines)
- Alles in localStorage onder key `75h6` (legacy naam, niet doorbreken)
- AI calls direct van browser naar `api.anthropic.com/v1/messages`
- Model: `claude-sonnet-4-20250514`
- API key: of via Claude.ai runtime (auto-injected), of user brengt eigen key mee (Stats → ⚙ → API key, opgeslagen in `localStorage['75h_apikey']`)

Waarom geen framework: simpelheid, geen build-stap, hosting waar dan ook werkt, gebruiker kan zelf code begrijpen.

### State shape

```js
S = {
  profile: {name, age, daily, energy, story, strengths, weak, goal} | null,
  identity: {name, manifesto, shadow, rules: [{id, section, cat, name, sub, warn}, ...]} | null,
  startDate: 'YYYY-MM-DD' | null,
  checks: {'YYYY-MM-DD': {r1: true, r2: true, ...}},
  fails: [{date, day}],
  restarts: 0,
  entries: [{dayNum, date, photo, dream, note, checks, aiFb, ts}],
  whoop: {'YYYY-MM-DD': {rec, hrv, slp, slps, str, cal}},
  milestones: {7: true, 21: true, ...},
  dayQuotes: {'YYYY-MM-DD': {text, tone, count}},
  chat: [{role, content, ts}],
  notif: {morning: {enabled, time}, evening: {enabled, time}, lastFired: {}},
  backlog: [{id, title, desc, priority, status, notes, createdAt, updatedAt}]
}
```

### Page structuur (v13)

**4 bottom-nav tabs**:
- `today` — hoofdscherm: dagquote + 12 wetten in 5 secties
- `chat` — directe coach-chat met volledige user-context als systeem-prompt
- `journey` — Instagram-style 75-grid met foto's, badges, grades
- `stats` — 75-grid + 4 cijfers (dag/voltooid/streak/restarts)

**Settings overlay** (⚙ rechtsboven op Vandaag) bevat subpages voor:
- `spiegel` (manifest + schaduw + 12 wetten + droomwerk-log + profiel-antwoorden)
- `build` (backlog/issues)
- `whoop` (data invoer + AI training advice)
- `notif` (push reminders)
- `apikey` (API key beheer)
- Plus knoppen: profiel opnieuw invullen, wetten herschrijven, dag mislukt, challenge resetten

---

## Design taal — "DOSSIER"

Cream papier + zwart inkt + rode CONFIDENTIEEL stempel. Voelt als een geheim militair dossier dat hij over zichzelf bijhoudt. Past bij defensie-traject. **Niet vriendelijk, wel serieus.**

### Palette (CSS variables in `:root`)

```
--bg:    #ebe6d8   warm cream paper
--bg2:   #e2dcca   slightly darker (cards/raised)
--bg3:   #d8d1bd   even darker (hover/active)
--bg4:   #cec5af   border/divider tone
--line:  rgba(26,26,26,0.10)
--line2: rgba(26,26,26,0.20)
--text:  #1a1a1a   near-black ink
--muted: #6b6359   faded ink
--dim:   #a39e94   very faded
--ac:    #a83a2a   classified-red stamp (accent, urgentie, stempels)
--green: #4a6b35   olive (success)
--blue:  #2b4d72   ink blue (sleep)
--orange:#a06628   ink amber (strain)
```

### Typografie

- `--mono`: `'Roboto Mono', monospace` — hoofdfont overal
- `--stamp-font`: `'Special Elite', monospace` — typewriter feel voor manifest, quote, "geschreven" momenten
- `'Courier Prime'` — voor display titels

Getallen: altijd `font-variant-numeric: tabular-nums` zodat ze uitlijnen.

### Regels van het design

- **Geen border-radius** (behalve circle progress) — alles hoekig
- **Geen glow, geen shadow, geen gradient** — papier kent geen gloed
- **Dashed borders** waar het past — geeft ouwe-rapport feel
- **Letter-spacing op caps**: `.14em` tot `.26em` voor labels en knoppen
- **`text-transform: uppercase`** op headers/labels — geen sentence case voor UI chrome
- **Body texture** is een subtiele horizontale streep-pattern (`--paper-texture`)
- **CONFIDENTIEEL stempel** schuin in rechterbovenhoek met `transform: rotate(35deg)` en rode 1.5px border

### AI prompt-stijl

Claude is een **directe, eerlijke coach**. Geen open deuren. Geen "je kunt het!". Verwijst naar gebruiker's specifieke verhaal en schaduw. Korte responses (2–5 zinnen tenzij anders gevraagd). Spreekt 'je' aan. Nederlands. Geen markdown. Eindigt vaak met één concrete opdracht voor morgen. Stelt terug-vragen i.p.v. advies dumpen. Soms is een korte zin krachtiger dan een lange.

---

## Hoe je veranderingen aanbrengt

### Voor kleine fixes / tweaks

Edit `index.html` direct. Geen build-stap. Reload de pagina, check werk.

### Voor grote features

De gebruiker werkt met een **Build-tab** in de app zelf. Hij voegt issues toe, vult ze in met beschrijving en notities, en kopieert naar Claude via "↗ Stuur naar Claude" knop. Output ziet eruit als:

```
🛠 Werk aan deze feature uit mijn OPERATION YOU backlog:

[FEATURE TITEL]
Prioriteit: High
Status: Idea → DOING

Beschrijving: ...
Mijn notities: ...

Bouw deze feature in de OPERATION YOU app. Update status naar 'done' wanneer klaar. Issue-ID: b3.
```

Wanneer je zo'n bericht krijgt: bouw de feature, presenteer als gewone code-aanpassing, en zeg er expliciet bij welke issue je hebt afgewerkt.

### Wat NIET doen

- **Geen npm/yarn/build-tooling** toevoegen — gebruiker is HBO ICT maar wil simpelheid
- **Geen framework rewrite** (React, Vue, Svelte) — eenvoud is de design choice
- **Geen externe analytics, tracking, of fonts buiten Google Fonts**
- **Geen breaking changes aan localStorage state shape** zonder migratie — gebruiker verliest dan zijn 75-dagen voortgang
- **Geen Engelse copy in UI** tenzij specifiek tactical context (bv. "OBJ-01 / CLEAR")
- **Geen kleur-flips** zonder vragen (cream/red is bewust gekozen na lange iteraties)
- **Geen vriendelijke "Geweldig!" / "Goed gedaan!" copy** — past niet bij dossier-vibe of gebruiker

### Wat altijd doen voordat je submit

1. **Node syntax check** op de extracted JS — alle scripts via `node --check`
2. **Geen duplicate `id` attributen** in de DOM — meerdere render-functies kijken naar dezelfde IDs
3. **Null-safe DOM access** — render functies moeten bailen als element niet bestaat (subpages worden lazy gerenderd)
4. **localStorage key blijft `75h6`** (legacy) — niet hernoemen tenzij met migratie
5. **Test de happy path**: vink een wet af, voeg een entry toe, open chat, check Spiegel — werkt nog?

---

## Roadmap (in volgorde van prioriteit)

In de Build-tab van de app staan deze al als issues. Hieronder met context:

1. **Casino-modus toggle** — gebruiker werkt vrijdag+zaterdag nacht in casino. Standaardregels rond slaap/schermtijd kloppen dan niet. Niet een ontsnapping, wel realistisch.
2. **Patroon-spotter** — om de 10–14 dagen analyseert Claude data autonomously en stuurt één scherp observeerbaar patroon ("je mist regel X altijd op zondagochtenden").
3. **Foto lightbox** — fullscreen swipe carrousel voor Journey grid.
4. **Mood/energie 1-tap rating** — 1–5 schaal per dag, combineren met Whoop data om correlaties te zien.
5. **Training log** — quick log na elke sport-sessie: wat, hoe zwaar (1–10), wat geleerd. Bouwt een portfolio.
6. **Defensie-countdown** — afteller naar officieren-start, Claude refereert er soms naar.
7. **Capacitor wrapper** — voor echte App Store distributie. Pas wanneer hij zijn eigen 75 dagen heeft afgemaakt en zeker weet dat het werkt.
8. **Backend** — Supabase voor accounts/sync + API-proxy. Pas zinvol bij meerdere users.
9. **Subscription model** — via RevenueCat. Pas zinvol na user research.

---

## Deploy

- Repo op GitHub (deze)
- Cloudflare Pages auto-deployt main branch naar `*.pages.dev` URL
- Geen build command, geen output dir — root van repo is de site
- `.github/workflows/lint.yml` runt op elke push: extract JS uit `index.html`, run `node --check`

Geen custom domein gekoppeld op moment van schrijven. Suggesties: `operationyou.app`, `operationyou.nl`, `opyou.app`.

---

## Belangrijke leerlessen uit eerdere iteraties

Voor je gaat herstructureren — dit zijn dingen die al fout zijn gegaan:

1. **v11 was te druk** — gebruiker zei "het is overal zo druk veel tekst veel dingen om op te klikken". v12 bracht het terug naar 4 tabs + ⚙ settings.
2. **v11 had glowing oranje accents** — gebruiker zei "te donker, pakt me niet". v13 ging naar cream/red dossier — totaal anders.
3. **Dubbele DOM IDs caused bugs** — de `page-spiegel` en `page-whoop` divs waren niet weggehaald toen Spiegel/Whoop subpages werden. `getElementById` pakte de verborgen oude. **Check altijd op duplicate IDs.**
4. **Render functies moeten null-safe zijn** — `renderAll()` roept `renderJourney`, `renderSpiegel`, `renderWhoop` aan, maar die DOM elementen bestaan alleen op hun eigen page/subpage. Begin elke render-functie met een early return als het hoofd-element niet in DOM zit.
5. **Anthropic API endpoint** — voor browser calls met `x-api-key` heb je `anthropic-dangerous-direct-browser-access: true` header nodig. Zit al in `claudeHeaders()` en `claudeCall()`.

---

## Files in deze repo

```
.
├── index.html              # De hele app
├── CLAUDE.md               # Dit bestand — context voor Claude
├── README.md               # Voor mensen
├── LICENSE                 # MIT
├── CLOUDFLARE.md           # Deploy instructies
├── .gitignore
└── .github/
    └── workflows/
        └── lint.yml        # JS-syntax check op push
```

---

## Tone bij interactie

De gebruiker waardeert:
- Korte, eerlijke antwoorden
- Concrete next-steps in plaats van vage advies
- Pushback als hij iets vraagt wat een slecht idee is
- Erkenning van trade-offs (kosten, complexiteit, tijdsinvestering)

De gebruiker waardeert niet:
- Lange disclaimers
- "Geweldig idee!" zonder reden
- Bullet lists waar prose werkt
- Vermijden van directe meningen

Wanneer iets niet kan of te complex is: zeg dat. Geef alternatieven met trade-offs. Niet alles probleem-loos schilderen.
