# Lerntagebuch – Einrichtung

Neue, eigenständige App für das digitale Lerntagebuch, das im
BAMF-Kurskonzept unter Abschnitt 6 ("Lernen mit digitalen Medien") als
Beispiel für digitale Medien genannt wird. Anders als Schreibtraining/
Sprechtraining ist das hier **reine Selbstreflexion ohne KI-Bewertung** -
es gibt keinen Cloudflare Worker und keine Bewertungslogik. Die App
funktioniert kursübergreifend (B1, BSK-B1+, BSK-B2) und wird per
Deep-Link mit Name und Kurs aus den drei Kurs-Apps heraus geöffnet.

## Wie es funktioniert

1. TN geben (beim ersten Mal, oder per Deep-Link automatisch vorbefüllt)
   Name und Kurs ein.
2. Danach sehen sie ein kurzes Formular mit vier festen Reflexionsfragen:
   - Woran haben wir gerade gearbeitet? (Kapitel/Thema, optional)
   - Was habe ich heute / in dieser Einheit gelernt?
   - Was war für mich schwierig?
   - Was möchte ich als Nächstes besonders üben?
   - dazu eine 5-stufige Selbsteinschätzung ("Wie sicher fühle ich mich
     gerade insgesamt?").
3. Nach dem Speichern erscheint der Eintrag sofort in der Liste "Meine
   bisherigen Einträge" darunter (nur die eigenen, gefiltert nach Name +
   Kurs) - für die TN selbst zum Nachlesen/Nachverfolgen des eigenen
   Lernfortschritts.
4. Gleichzeitig wird der Eintrag an ein Google Formular übermittelt,
   damit du als Lehrkraft mitlesen kannst - genau wie bei Schreib-/
   Sprechtraining.

Die Einträge liegen **nur lokal im jeweiligen Browser** des TN
(`localStorage`, kein Server, kein Geräte-Sync) - fürs Nachlesen durch
die/den TN selbst reicht das; für die Übersicht der Lehrkraft dient das
Google Formular als zentrale Sammelstelle.

## Was du jetzt tun musst

1. **Google Formular anlegen.** Ein neues Formular mit folgenden Feldern
   (Reihenfolge egal, Feldtyp jeweils "Kurze Antwort" bzw. "Absatz"):
   Name, Kurs, Datum, Thema, Was habe ich gelernt, Was war schwierig, Was
   möchte ich üben, Sicherheit (1-5). Anschließend im Formular-Editor
   unter den drei Punkten "Vorschau" öffnen, die URL kopieren und am Ende
   `viewform` durch `formResponse` ersetzen - das ist deine
   `GOOGLE_FORM_ACTION_URL` in `config.js`.

2. **entry.XXXXXXXXX-IDs herausfinden.** Formular-Vorschau öffnen,
   Rechtsklick → "Seitenquelltext anzeigen" (oder Entwicklertools →
   Elemente), nach `entry.` suchen - jedes Eingabefeld hat eine eigene
   `entry.1234567890`-Nummer. Diese acht IDs in
   `GOOGLE_FORM_ENTRY_IDS` in `config.js` eintragen (name, kurs, datum,
   thema, gelernt, schwierig, ueben, sicherheit).

3. **Optional: eigenes Formular pro Kurs.** Genau wie bei Schreib-/
   Sprechtraining kannst du das Formular einmal duplizieren pro Kurs
   (behält die entry-IDs bei) und die jeweilige URL in
   `GOOGLE_FORM_ACTION_URL_BY_KURS` eintragen, damit die drei Kurse nicht
   in einer gemeinsamen Tabelle landen. Kurse ohne eigenen Eintrag dort
   nutzen weiterhin die gemeinsame `GOOGLE_FORM_ACTION_URL`.

4. **Hosting/Domain.** Wie bei den anderen Apps: eigenes GitHub-Repo
   (z. B. "lerntagebuch"), GitHub Pages aktivieren, bei Bedarf eigene
   Subdomain (`lerntagebuch.jurtzik-lernapps.de`) mit Cloudflare Access
   davor - die Deep-Link-Kacheln in B1/BSK-B1+/BSK-B2 gehen bereits von
   genau dieser Adresse aus (`LERNTAGEBUCH_BASE_URL` in den jeweiligen
   `index.html`-Dateien der drei Kurs-Apps). Falls du eine andere Adresse
   verwendest, dort die Konstante entsprechend anpassen.

5. **Kein Worker nötig.** Diese App braucht - anders als Schreib-/
   Sprechtraining - keinen Cloudflare Worker und keinen API-Key. Es
   reicht, die vier Dateien (`index.html`, `style.css`, `app.js`,
   `config.js`) zusammen hochzuladen.

## Deep-Link aus den Kurs-Apps

Bereits eingebaut: eine "📔 Lerntagebuch"-Kachel im Hauptmenü von B1,
BSK-B1+ und BSK-B2 (gleich neben "✍️ Schreiben"/"🗣️ Sprechen"), die per
Deep-Link (`?name=...&kurs=...`) direkt hierher verlinkt und Name/Kurs
automatisch vorbefüllt - die/der TN landet ohne weiteren Klick direkt im
neuen Eintrag. Zusätzlich gibt es in allen drei Apps einen passenden
Neuigkeiten-Eintrag, der die neue Kachel kurz erklärt.

## Weitere Anpassungen

Die drei festen Reflexionsfragen sowie die 5-stufige Skala sind aktuell
fest im Code (`index.html`/`app.js`) hinterlegt - eine Änderung der
Formulierungen oder der Skala erfordert eine kleine Anpassung dort, ist
aber unabhängig von den Kurs-Apps oder dem Google Formular.

## Was getestet wurde

Playwright-Test deckt ab: Namens-/Kurseingabe und Wechsel zum
Eintragsformular, Validierungsfehler bei fehlendem Text zu "Was habe ich
gelernt?" bzw. fehlender Sicherheitsauswahl, erfolgreiches Speichern
(Formular wird geleert, neuer Eintrag erscheint oben in der Liste,
Zähler "(1)"/"(2)" korrekt), sowie Deep-Link mit vorbefülltem Name/Kurs
inkl. korrekter Fußzeile. Zusätzlich wurde die Übermittlung an das
Google Formular (no-cors POST) nach demselben Muster wie bei Schreib-/
Sprechtraining eingebaut, konnte aber mangels Zugriff auf ein echtes
Formular nur strukturell (URL-Aufbau, Feld-Mapping), nicht live getestet
werden - bitte nach dem Eintragen der echten entry-IDs einmal live einen
Testeintrag speichern und im Formular/der verknüpften Tabelle
kontrollieren.

Für die drei Kurs-Apps wurde zusätzlich per Playwright-Test bestätigt,
dass die neue "📔 Lerntagebuch"-Kachel in allen drei Apps (B1, BSK-B1+,
BSK-B2) sichtbar ist und beim Klick ein neuer Tab mit der korrekten
Lerntagebuch-URL inkl. richtigem Namen und kursspezifischem Kurs-Wert
geöffnet wird - ohne die bestehenden Schreiben-/Sprechen-Kacheln oder
sonstige Funktionen der drei Apps zu beeinträchtigen.
