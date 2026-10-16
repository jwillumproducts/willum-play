# Willum Play – MVP

## Idé
En simpel browserbaseret spilplatform fra JWillum Kids, der lærer små børn at bruge tastatur, PlayStation-controller og senere touch på tablet/mobil gennem korte, hyggelige 2D-spil. Barnet øver én bevægelse eller knap ad gangen, mens forældrene vælger bane. De første baner træner finmotorik: koblingen mellem det barnet ser, og det fingrene gør. Barnet må blive på banen så længe det vil.

## Mål
- Lære grundlæggende spilkontrol og øje-hånd-koordination.
- Lade børn udvikle sig fra højre/venstre til flere knapper, i deres eget tempo.
- Give forældre kontrol over hvilke taster der er med, uden at gøre opsætningen besværlig.
- Fungere direkte i browseren uden konto eller installation.

## Første skærm: Vælg enhed
Vis store, letforståelige valg:
1. **Computer** – tastatur.
2. **PlayStation-controller** – controller tilsluttet computeren.
3. **Tablet/mobil** – store touchknapper nederst på skærmen.

**Computer**, **controller** og **tablet/mobil** kan vælges. Valget gemmes lokalt og kan ændres via forældremenuen. På telefon vises et venligt overlay i portræt, der beder om landskab. Tastatur på computer er uændret.

## Forældreopsætning
Forældrene vælger bane før spilstart. Der er ingen tidsgrænse og ingen afslutning.

| Bane | Kamera | Ny tast | Hvad barnet oplever |
|---|---|---|---|
| 1. Gå | Set fra siden | Højre/venstre | Kyllingen går med det samme |
| 2. Hop | Set fra siden | Space | Kyllingen hopper. Underlaget fortsætter |
| 3. Fire retninger | Set ovenfra | Op/ned | Kyllingen går i fire retninger |
| 4. Handling | Set ovenfra | Enter | En synlig handling, for eksempel et pik |

Hver bane viser kun den nye tast. Tidligere taster virker stadig. Forældrene kan altid vælge bane manuelt. Et forslag om næste bane kan komme senere, men skal ikke tvinge barnet videre.

Små opgaver (gå hen til et æg, hop over en stamme, find en nøgle) hører til en senere udvidelse, når bevægelsen sidder.

## Første minispil: Kyllingegården
En lille kylling bevæger sig gennem et roligt 2D-landskab, tegnet som enkle former.

- **Bane 1:** Gå til højre og venstre. Kyllingen følger tasterne med det samme.
- **Bane 2:** Space får kyllingen til at hoppe. Underlaget fortsætter, så hoppet er en bevægelse barnet kan øve.
- **Bane 3:** Set ovenfra. Op og ned kommer til, sammen med højre og venstre.
- **Bane 4:** Enter udløser en synlig handling, for eksempel et pik.

Bevægelse giver rolig lyd og et lille visuelt svar. Æg og buske kan reagere, når kyllingen rører dem, og banen bliver ved. Ingen liv, nederlag, reklamer eller tidspres.

## Spilsystem
Byg systemet, så flere minispil senere kan bruge samme fundament:

- **Input Manager:** Oversætter tastatur, controller og touchknapper til handlinger (`moveLeft`, `moveRight`, `moveUp`, `moveDown`, `jump`, `interact`).
- **Level Config:** Bestemmer kamera, hvilke handlinger der er tændt, og hvilken ny tast der vises.
- **Game Loop:** Opdaterer figur, bevægelse og simple kollisioner.
- **Progress:** Gemmer valgt enhed og valgt bane lokalt.

Minispil skal bruge fælles systemer, ikke hver deres controller- og tastaturkode.

Opgaver som `reachTarget`, `collectItem`, `jumpObstacle` og `interact` hører til et senere Task System. Det bygges først, når den frie leg fungerer.

## Design
- Enkle former tegnet direkte på canvas: bløde former, få farver og ingen billedfiler.
- Store figurer og meget lidt tekst i selve spillet.
- Vis kun den nye tast. Tidligere taster virker stadig.
- Rolige animationer, diskrete lyde og tydelig feedback, når kyllingen bevæger sig eller rører noget.
- Store knapper i forældremenuer og et enkelt pause-/tilbagevalg.
- Ingen figurer, navne, musik eller billeder kopieret fra Peppa Pig eller andre spil.

## Teknologi
- **TypeScript + Vite** til en enkel webapp.
- **HTML Canvas 2D** til spilgrafik og animationer.
- **Keyboard Events** på computer.
- **Gamepad API** til kompatible PlayStation- og Xbox-controllere forbundet til computeren via USB/Bluetooth.
- **Pointer/touch events** til iPad og mobil med store knapper nederst (venstre, højre, op, ned, hop, handling). Kun de oplåste knapper vises. Multitouch, så venstre og hop kan holdes samtidig.
- **localStorage** til valgt enhed, valgt bane og øvrige lokale indstillinger.
- Statisk hosting; ingen backend nødvendig til MVP.

## Udviklingsrækkefølge

### Fase 1 – Første spilbare MVP
- Første skærm med valg af enhed.
- Enkel forældremenu med fire baner.
- Ét minispil: Kyllingegården som fri leg.
- Tastaturstyring og feedback på alle fire baner.
- Lokal lagring af valgt enhed og valgt bane.
- Simpelt responsivt layout til computerskærm.

**Færdig når:** En forælder kan vælge Computer og en bane, og barnet kan bevæge kyllingen med kun de taster banen viser, uden tidsgrænse og uden afslutning.

### Fase 2 – PlayStation-controller
- Aktivér Controller på første skærm.
- Registrér controller, vis forbindelsesstatus og test knapper.
- Map D-pad/venstre stick til bevægelse, ✕ til hop og en valgt knap til interaktion.
- Vis controllerknapper i spillet i stedet for tastaturikoner.
- Test DualShock 4 og DualSense via USB og Bluetooth på understøttede browsere.

### Fase 3 – iPad og mobil
- Aktivér Tablet/mobil på første skærm.
- Tilføj store touchkontroller og tilpas spilfladen til mindre skærme (plads til knapbjælke og safe-area).
- På telefon: overlay i portræt, spil og knapper i landskab. Tablets kan spille i begge retninger, når layoutet passer.
- Test både portræt-/landskabsformat og touch-adfærd.

### Fase 4 – Udvidelse
- Flere minispil, fx Bilbanen og Skattejagten.
- Task System med små opgaver (`reachTarget`, `collectItem`, `jumpObstacle`, `interact`), når bevægelsen sidder.
- Eventuelt et forslag om næste bane, som forælderen kan vælge fra.
- Børneprofiler og mere detaljeret forældreoverblik, hvis behovet opstår.

## Uden for første MVP
Login, cloud-synkronisering, multiplayer, avanceret grafik, betalingsfunktioner, annoncer, online-scores og AI-baseret tilpasning.

## Prioritet
**Hold spillet lille, roligt og uden konto.** Arkitekturen deles af tastatur, controller og touch. Flere minispil og opgaver kommer senere.
