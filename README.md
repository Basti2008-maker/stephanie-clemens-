# Stephanie & Clemens – Hochzeitswebsite

RSVP-Portal für die Hochzeit am 26. Juni 2027. Gebaut mit Next.js (App Router),
TypeScript, Tailwind CSS und Prisma (SQLite/libSQL über [Turso](https://turso.tech)).

## Warum Turso statt einer lokalen SQLite-Datei?

Vercel-Serverless-Funktionen haben ein **read-only Dateisystem** (außer einem
flüchtigen `/tmp`, das bei jedem Cold Start zurückgesetzt wird). Eine normale
SQLite-Datei oder JSON-Datei würde dort ihre Daten also nicht dauerhaft
speichern. [Turso](https://turso.tech) ist eine gehostete, SQLite-kompatible
Datenbank (libSQL), die genau dieses Problem löst – der Code bleibt fast
identisch zu "normalem" SQLite/Prisma.

**Für die lokale Entwicklung brauchst du gar keinen Turso-Account:** Der
libSQL-Client kann genauso gut eine lokale Datei (`file:./dev.db`) verwenden.
Turso wird erst für das Produktions-Deployment auf Vercel benötigt.

## Voraussetzungen

- [Node.js](https://nodejs.org) Version 20 oder neuer
- npm (wird mit Node.js installiert)

## 1. Lokale Installation

```bash
npm install
```

Kopiere `.env.example` zu `.env` und trage ein Admin-Passwort ein:

```bash
cp .env.example .env
```

```
ADMIN_PASSWORD=dein-sicheres-passwort
DATABASE_URL="file:./dev.db"
```

Datenbankschema lokal anlegen:

```bash
npm run db:push
```

Entwicklungsserver starten:

```bash
npm run dev
```

Die Seite läuft nun unter [http://localhost:3000](http://localhost:3000).
Auf der Startseite gibt es ein Code-Feld:

- Gäste-Code (`NEXT_PUBLIC_RSVP_CODE`, Standard `26.6.27`) → Anmeldeformular
- Admin-Code (`ADMIN_PASSWORD`) → Admin-Bereich

Direkte Aufrufe funktionieren ebenfalls: `/` (Startseite), `/rsvp` (Formular),
`/admin` (Admin, mit Passwortabfrage falls nicht angemeldet).

## 2. Zugangs-Codes setzen

Der **Admin-Code** wird ausschließlich über die Umgebungsvariable
`ADMIN_PASSWORD` gesetzt, niemals im Code. Er dient auch als geheimer Schlüssel,
mit dem die Login-Session signiert wird – wähle also einen langen, zufälligen
Wert.

Der **Gäste-Code** steht in `NEXT_PUBLIC_RSVP_CODE` (Standard `26.6.27`). Er darf
öffentlich sein, da er nur eine einfache Zugangshürde zum Formular ist.

- Lokal: in `.env` eintragen (Datei wird nicht committet, siehe `.gitignore`)
- Auf Vercel: als Environment Variables im Projekt-Dashboard setzen (siehe unten)

## 3. Produktionsdatenbank mit Turso einrichten

**Einfachster Weg (empfohlen):** Im Vercel-Dashboard unter
**Storage → Marketplace → Turso** die Integration hinzufügen. Sie legt die
Datenbank an und setzt `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` automatisch –
beide Namen werden vom Code direkt erkannt. Danach neu deployen und einmal
`/api/health` aufrufen: Die Tabelle wird dabei automatisch angelegt.

**Alternativ manuell per CLI:**

1. Turso CLI installieren und einloggen (einmalig):
   ```bash
   npm install -g @tursodatabase/cli
   turso auth login
   ```
2. Datenbank erstellen:
   ```bash
   turso db create stephanie-clemens-hochzeit
   ```
3. Zugangsdaten holen:
   ```bash
   turso db show stephanie-clemens-hochzeit --url
   turso db tokens create stephanie-clemens-hochzeit
   ```
   Die URL beginnt mit `libsql://…`, das Token ist ein langer String.
4. Schema in der Turso-Datenbank anlegen (einmalig, von deinem Rechner aus):
   ```bash
   DATABASE_URL="libsql://<deine-db>.turso.io" DATABASE_AUTH_TOKEN="<dein-token>" npx prisma db push
   ```

## 4. Deployment auf Vercel

1. Projekt zu GitHub pushen.
2. Auf [vercel.com](https://vercel.com) ein neues Projekt aus dem Repository anlegen.
3. Unter **Settings → Environment Variables** folgende Variablen setzen:

   | Variable                      | Wert                                  |
   | ------------------------------ | -------------------------------------- |
   | `ADMIN_PASSWORD`                | dein sicherer Admin-Code               |
   | `NEXT_PUBLIC_RSVP_CODE`         | Gäste-Code, z. B. `26.6.27`            |
   | `DATABASE_URL`                  | `libsql://<deine-db>.turso.io`         |
   | `DATABASE_AUTH_TOKEN`           | dein Turso-Token                       |
   | `NEXT_PUBLIC_WEDDING_DATE`      | z. B. `2027-06-26T14:00:00`            |
   | `NEXT_PUBLIC_WEDDING_LOCATION`  | z. B. `Schloss Musterstadt`            |

4. Deploy auslösen. `prisma generate` läuft automatisch über das
   `postinstall`-Skript in `package.json`.

Location und Uhrzeit lassen sich später jederzeit ändern, indem du
`NEXT_PUBLIC_WEDDING_DATE` / `NEXT_PUBLIC_WEDDING_LOCATION` in Vercel anpasst
und neu deployst – ohne Codeänderung.

## Funktionsübersicht

- **Startseite**: Namen, Datum, Location (Platzhalter), Live-Countdown und ein
  Code-Eingabefeld. Der Gäste-Code (`NEXT_PUBLIC_RSVP_CODE`, Standard `26.6.27`)
  führt zum Anmeldeformular, der Admin-Code (`ADMIN_PASSWORD`) öffnet den
  Admin-Bereich.
- **Anmeldeseite** (`/rsvp`): Formular mit Vorname, Nachname, E-Mail, Telefon
  und Adresse (Straße, PLZ, Ort, Land). Client- und serverseitige Validierung
  (Zod), Honeypot-Feld gegen Spam-Bots.
- **Bestätigungsseite** (`/rsvp/success`): Dankestext nach dem Absenden.
- **Admin-Bereich** (`/admin`): Passwortgeschützt. Tabelle aller Anmeldungen mit
  Suche (Name/E-Mail), Sortierung (Anmeldedatum, Name, Ort), Export als `.xlsx`
  und einem „Zurücksetzen"-Knopf mit Sicherheitsabfrage, der alle Anmeldungen
  löscht.

## Sicherheit

- Admin-Passwort liegt ausschließlich in Umgebungsvariablen.
- Login-Session ist ein HMAC-signiertes, `httpOnly`-Cookie (8 Stunden gültig).
- Passwortvergleich und Session-Signaturprüfung laufen zeitkonstant
  (`crypto.timingSafeEqual`), um Timing-Angriffe zu erschweren.
- `.env`-Dateien und die lokale `dev.db` sind über `.gitignore` von Git
  ausgeschlossen – niemals Secrets committen.

## Nützliche Skripte

```bash
npm run dev         # Entwicklungsserver
npm run build        # Produktions-Build
npm run start         # Produktions-Server (nach build)
npm run db:push       # Prisma-Schema in die Datenbank pushen
npm run db:studio     # Prisma Studio (Datenbank im Browser ansehen)
```
