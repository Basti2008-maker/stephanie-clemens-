# Echo — Hyper-Personalized Music AI (Prototype)

Ein interaktiver, klickbarer Prototyp der App-Idee aus `Echo AI - Startup.pdf` und
`Eco-Ai.pdf`: eine KI-Musik-App mit Music-DNA-Analyse, stimmungsbasierten
Playlists, einem Tinder-Style Swipe-Discovery (eigener Haupt-Tab), einem
Party-Host-Modus mit echtem QR-Code, einem Musik-Assistenten, sozialen Features,
Musik-Biofeedback, einem Creator-Hub, einer **echten Spotify-Anbindung** (echte
Hörhistorie treibt deine Musik-DNA) und einem Freemium/Premium-Modell.

Untere Navigation: **Home · Discover · Swipe · Assistent · Profil**
(das ursprüngliche "AI DJ"-Feature wurde auf Wunsch entfernt und durch Swipe
als eigenen Tab ersetzt).

## Starten

**Einfach `index.html` doppelklicken.** Die gesamte App (HTML + CSS + JS) steckt
in dieser einen Datei — kein Server, kein `npm install`, keine Internetverbindung
nötig, funktioniert in jedem modernen Browser.

**Ausnahme: Echter Spotify-Login braucht den lokalen Server** (`http://127.0.0.1:8080`,
siehe „Spotify verbinden" unten) — Spotify akzeptiert keine `file://`-Adresse
als Rücksprungziel. Alles andere funktioniert auch per Doppelklick.

Der Party-Modus (siehe unten) kann optional ebenfalls einen kleinen lokalen Server nutzen,
damit mehrere Browser-Tabs/Geräte sich eine Party wirklich teilen. Ohne Server
funktioniert der Party-Modus trotzdem (lokaler Fallback), nur eben nicht
geräteübergreifend. Server starten (nutzt nur eingebaute Windows-Bordmittel,
kein Node/Python nötig):

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Dann [http://localhost:8080](http://localhost:8080) öffnen.

## Was ist umgesetzt

Alle Kernfunktionen aus den beiden PDFs plus deine zusätzlichen Wünsche, als
funktionierender Prototyp:

- **Music-DNA-Analyse**: Onboarding-Quiz (Genres, Energie, Discovery-Offenheit,
  Lieblings-Jahrzehnte, Hörkontexte) erzeugt ein Musik-DNA-Profil, visualisiert
  als Radar-Chart.
- **Stimmungs- & kontextbasierte Anpassung**: Mood- und Kontext-Picker auf der
  Startseite generieren sofort passende Playlists.
- **Hyper-personalisierte Playlists**: "Für dich gemacht", genre-basierte Reihen,
  Community-Empfehlungen — alle live aus dem DNA-Profil berechnet.
- **Zeitreise-Playlist**: Playlist-Generator nach Jahrzehnt.
- **Swipe & Entdecke** (Tinder-Modell, eigener Haupt-Tab in der Navigation):
  Kartenstapel zum Wischen (Maus/Touch-Drag oder Buttons) — jeder Like/Skip
  verfeinert deine Musik-DNA sofort sichtbar (Genre-Gewichte verschieben sich live).
- **Party-Modus**: Als Host eine Party starten → echter, selbst-berechneter
  QR-Code (kein externer Dienst, keine Internetverbindung nötig) + Beitritts-Code.
  Gäste scannen/tippen den Code, ihre Musik-DNA wird mit der Gruppe geteilt, Echo
  berechnet eine **gemischte Musik-DNA der ganzen Gruppe** und daraus eine
  Playlist für alle. Funktioniert sofort über mehrere Browser-Tabs/Fenster;
  über mehrere Geräte hinweg, wenn alle im selben WLAN sind und den Server
  erreichen (siehe „Party-Modus im Detail" unten).
- **KI-Musik-Assistent**: Chat-Interface, das Playlists baut, Stimmungen trifft,
  neue Musik vorschlägt, in den Party-Modus/Swipe-Tab weiterleitet und das
  eigene DNA-Profil erklärt.
- **Musik-Biofeedback**: Simuliertes Wearable ("Flexify"), das eine
  Pulskurve erzeugt und Energie/Tempo-Gefühl der Musik in Echtzeit daran anpasst.
- **Soziale Funktionen**: Musik-DNA-Vergleich mit Freunden (Ähnlichkeits-%,
  Radar-Overlay), Freundes-Aktivität, wöchentliche Musik-Challenge.
- **Creator Hub**: Exklusive Release-Events mit Countdown & RSVP,
  KI-Musik-Coaching-Insights.
- **Freemium/Premium**: Werbebanner im Free-Tier, Premium-Paywall mit
  Feature-Vergleich, In-App-Popups, die gezielt auf einzelne Features hinweisen.
- **Echte Spotify-Anbindung**: Login mit deinem echten Spotify-Account (OAuth,
  Passwort sieht Echo nie). Holt deine echten Top-Songs, zuletzt gehörte Songs
  und Top-Artists, baut daraus deine **echte Musik-DNA** (Genres aus deinen
  echten Lieblingskünstlern, nicht aus dem Quiz geraten) und spielt echte
  30-Sekunden-Previews mit echtem Cover ab. Treibt danach automatisch alle
  bestehenden Features an (Empfehlungen, Swipe, Party-Blending, Stimmungs-Mixe).
  Setup siehe „Spotify verbinden" unten. Apple Music/SoundCloud bleiben Demo
  (siehe Einschränkungen unten).

## Party-Modus im Detail

1. Host tippt auf „Party-Modus" → „Party starten". Ein 6-stelliger Code plus
   echter QR-Code wird generiert (eigener, von Grund auf geschriebener
   QR-Encoder — Version 1, alphanumerisch, Reed-Solomon-Fehlerkorrektur, keine
   externe Bibliothek, kein Internet nötig).
2. Gäste tippen den Code ein (oder scannen den QR, wenn der Link erreichbar ist)
   → ihre Musik-DNA wird der Party hinzugefügt.
3. Der Host sieht die Gästeliste live wachsen und ein Radar-Chart der
   **gemischten** Musik-DNA der ganzen Gruppe.
4. „Playlist für alle starten" mischt eine Playlist, die auf das gemeinsame
   Profil optimiert ist.

**Reichweite ehrlich eingeordnet:** Ohne Server (`serve.ps1`) läuft das komplett
lokal im Browser (localStorage) — ein zweiter Tab auf demselben Rechner kann
beitreten, ein anderes Gerät nicht. Mit laufendem `serve.ps1` gibt es echte
Server-Endpunkte (`/api/party/*`), die eine Party wirklich über mehrere
Tabs/Fenster hinweg synchronisieren; das habe ich in diesem Environment auch
tatsächlich mit zwei Browser-Tabs gegenseitig getestet. Für echte Handys im
selben WLAN müsste der Server zusätzlich auf die LAN-IP statt nur `localhost`
gebunden werden (in `serve.ps1` anpassbar) — das habe ich bewusst nicht
automatisch gemacht, weil es je nach Windows-Firewall/Rechte-Konfiguration
unterschiedlich funktioniert und ich das nicht ungefragt ändern wollte.

## Spotify verbinden (echte Hörhistorie)

Das ist eine **echte** Anbindung — kein Demo. Damit Spotify weiß, dass die
Anfrage von deiner eigenen App kommt, brauchst du einmalig einen **kostenlosen**
Spotify-Entwickler-Zugang (dauert ca. 5 Minuten):

1. Auf [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   mit deinem normalen Spotify-Account einloggen (Premium nicht nötig).
2. **„Create app"** klicken.
   - App name: beliebig, z.B. „Echo Music DNA"
   - App description: beliebig, z.B. „Persönlicher Musikgeschmack-Prototyp"
   - **Redirect URI**: exakt `http://127.0.0.1:8080/` eintragen und auf „Add" klicken
     (muss genau so geschrieben sein, inkl. Schrägstrich am Ende)
   - Bei „Which API/SDKs are you planning to use?" **„Web API"** ankreuzen
   - Nutzungsbedingungen akzeptieren, **„Save"**
3. Auf der App-Seite **„Settings"** öffnen — dort steht deine **Client ID**
   (kein Secret nötig, das ist bewusst so gebaut).
4. Die App über den lokalen Server starten (**nicht** per Doppelklick — Spotify
   akzeptiert kein `file://` als Rücksprung-Adresse):
   ```powershell
   powershell -ExecutionPolicy Bypass -File serve.ps1
   ```
   und dann **genau** `http://127.0.0.1:8080` öffnen (nicht `localhost` — muss
   exakt zur Redirect-URI oben passen).
5. In der App: Profil → Verbundene Dienste → Spotify → „Verbinden" → deine
   Client-ID einfügen → „Mit Spotify anmelden". Du landest auf Spotifys echter
   Login-Seite, meldest dich dort an und wirst zurückgeschickt.

**Wichtig (Spotifys eigene Einschränkung, nicht meine):** Solange deine
Spotify-App im „Development Mode" ist (Standard, keine zusätzlichen Schritte
nötig), kannst du dich selbst damit anmelden. Willst du, dass auch andere
Personen (z.B. Familie) sich anmelden können, musst du deren Spotify-E-Mail-
Adresse im Dashboard unter „User Management" hinzufügen (bis zu 25 Personen),
sonst lehnt Spotify den Login ab.

Danach: „Aktualisieren" im Profil holt jederzeit deine neuesten Daten erneut.
„Trennen" meldet ab und stellt deine ursprüngliche Quiz-DNA wieder her.

**Ehrlicher Hinweis zu Grenzen:** Ich konnte den kompletten Login-Vorgang in
dieser Umgebung nicht Ende-zu-Ende mit einem echten Spotify-Account testen
(kein Zugang zu echten Zugangsdaten hier) — die komplette Logik davor und
danach (Code-Austausch, Datenverarbeitung, DNA-Berechnung, Wiedergabe) habe ich
aber einzeln mit realistischen Beispieldaten durchgetestet. Falls beim echten
Login etwas nicht klappt, sag mir die genaue Fehlermeldung, dann schaue ich
mir das an.

## Bewusste Vereinfachungen (wichtig zu wissen)

Das hier ist ein **Klick-Prototyp für Demo/Pitch-Zwecke**, kein produktionsreifes
Produkt. Folgendes ist bewusst simuliert statt echt umgesetzt — eine echte
Version wäre ein mehrmonatiges Projekt mit Musiklizenzen, echtem ML-Training und
nativen Apps:

- **Musik**: Alle "Songs" sind zufällig generierte Platzhalter-Titel/Artists.
  Die Audiowiedergabe ist eine **live im Browser synthetisierte** Instrumental-Loop
  (Web Audio API — echte Kicks/Bässe/Leads, kein Sample), kein echter
  Musikkatalog (keine Lizenzen nötig, funktioniert aber wirklich: Play/Pause,
  Crossfade, Tempo/Energie-Modulation sind live hörbar).
- **Spotify**: Echt angebunden (siehe eigener Abschnitt oben) — einzige
  Einschränkung ist, dass du einmalig eine kostenlose Spotify-App registrieren
  musst (Spotifys Anforderung, nicht umgehbar).
- **Apple Music/SoundCloud**: Die "Verbinden"-Buttons im Profil aktivieren nur
  lokal einen Demo-Zustand. Apple Music bräuchte eine kostenpflichtige Apple
  Developer Membership (99$/Jahr) **und** einen Backend-Server, der einen
  signierten Entwickler-Token verwaltet (ein Private Key darf nie im Browser
  landen) — SoundCloud hat aktuell kaum noch offene API-Neuregistrierungen.
  Beides kann ich nicht automatisch für dich einrichten, weil dafür eigene
  Accounts/Zugangsdaten bei diesen Anbietern nötig sind.
- **KI-Assistent**: Ein einfaches, regelbasiertes Intent-System (Keyword-Matching),
  kein LLM.
- **Stimmungserkennung**: Manuelle Auswahl statt echter Kamera-/Sensor-Analyse.
- **Biofeedback**: Simulierte Pulskurve statt echter Wearable-Anbindung.
- **Zahlung**: "Premium aktivieren" schaltet nur lokal einen Demo-Zustand frei —
  es gibt keine echte Zahlungsabwicklung.
- **Speicherung**: Dein Profil/Fortschritt liegt in `localStorage` deines
  Browsers (kein Backend-Datenbank, kein Cross-Device-Sync außerhalb des
  Party-Modus).
- **QR-Code**: Selbst geschriebener Encoder, keine externe Bibliothek. Ich habe
  ihn intern gegengeprüft (exakte Belegung aller 233 Funktionsmodule, korrekte
  Platzierung von Suchmustern/Timing/Formatinfo), konnte das Scannen mit einer
  echten Handykamera in dieser Umgebung aber nicht selbst testen (kein Kamera-
  zugriff hier) — bitte einmal kurz mit deinem Handy gegentesten. Der Code steht
  daneben immer auch als großer Text, falls Scannen doch nicht klappen sollte.

## Projektstruktur

```
index.html    Die komplette, einzige Quelle der Wahrheit — HTML, CSS (<style>)
              und JS (<script>) in einer Datei. Alle Änderungen passieren hier.
serve.ps1     Optionaler lokaler Server (Windows-Bordmittel) inkl. Party-API
js/*.js, style.css   Historische Quelldateien aus einem früheren Entwicklungsstand
              (nicht mehr von index.html geladen, seither NICHT mehr aktuell
              gehalten — z.B. existiert js/dj.js absichtlich nicht mehr, weil das
              AI-DJ-Feature entfernt wurde). Nicht als Referenz verwenden, nur
              zur Historie.
```

`index.html` ist bewusst ein **einziges, selbst-enthaltenes File ohne externe
Referenzen** (kein `<link>`, kein `<script src>`) — das schließt jedes Risiko
aus, dass beim Doppelklick irgendwelche Datei-Pfade oder Lade-Reihenfolgen
Probleme machen. Alles läuft als klassische (Nicht-Modul-)Scripts, komplett
ohne Build-Step (kein React/Vite/npm) — dadurch läuft es garantiert überall,
ganz ohne Node.js/Python-Installation.

## Naming

Die PDFs verwenden "Echo AI", "Eco AI" und "Troq" uneinheitlich als Markenname.
Ich habe mich für **"Echo"** entschieden. Umbenennen ist einfach: Suche/Ersetze
"Echo" in `index.html`.
