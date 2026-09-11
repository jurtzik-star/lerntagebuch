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
2. Danach sehen sie ein kurzes Formular:
   - Zu welchem Kapitel gehört diese Einheit? (Dropdown 1 bis N, je nach
     Kurs, optional - "kein bestimmtes Kapitel" geht auch)
   - Was habe ich heute / in dieser Einheit gelernt?
   - Was war für mich schwierig?
   - Was möchte ich als Nächstes besonders üben?
   - Wie lange habe ich in dieser Einheit geübt? (Dropdown 5-90 Minuten,
     Pflichtfeld)
   - dazu eine 5-stufige Selbsteinschätzung ("Wie sicher fühle ich mich
     gerade insgesamt?").
3. Nach dem Speichern erscheint der Eintrag sofort in der Liste "Meine
   bisherigen Einträge" darunter (nur die eigenen, gefiltert nach Name +
   Kurs) - für die TN selbst zum Nachlesen/Nachverfolgen des eigenen
   Lernfortschritts. Direkt darüber zeigt ein neuer Abschnitt "Meine
   Lernzeit pro Kapitel" für jedes Kapitel des gewählten Kurses einen
   Fortschrittsbalken - Summe der eingetragenen Minuten aus allen eigenen
   Einträgen zu diesem Kapitel, gegen ein Lernziel (Default 30 Minuten pro
   Kapitel, siehe `LERNZIEL_MINUTEN_PRO_KAPITEL` in `config.js`), mit einem
   ✓ sobald das Ziel erreicht ist. Minuten aus Einträgen ohne Kapitelbezug
   fließen nur in die Gesamtsumme oben, nicht in einen einzelnen Balken.
4. Gleichzeitig wird der Eintrag an ein Google Formular übermittelt,
   damit du als Lehrkraft mitlesen kannst - genau wie bei Schreib-/
   Sprechtraining. Das gewählte Kapitel wird dabei weiterhin im bisherigen
   "Thema"-Feld des Formulars übertragen (z. B. "Kapitel 3"), dafür ist
   keine Formular-Änderung nötig.

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

Die Reflexionsfragen sowie die 5-stufige Skala sind aktuell fest im Code
(`index.html`/`app.js`) hinterlegt - eine Änderung der Formulierungen oder
der Skala erfordert eine kleine Anpassung dort, ist aber unabhängig von
den Kurs-Apps oder dem Google Formular.

## Neu: Lernzeit-Fortschritt pro Kapitel

TN wählen bei jedem Eintrag jetzt zusätzlich ein Kapitel (Dropdown statt
Freitext, wie zuvor bei "Thema") und wie lange sie geübt haben
(Pflichtfeld). Daraus baut die App direkt im Formular einen
Fortschrittsbalken pro Kapitel - rein lokal aus den eigenen
`localStorage`-Einträgen berechnet, kein Server nötig. Zwei Dinge dazu in
`config.js`:

- `KAPITEL_ANZAHL_BY_KURS` legt fest, wie viele Kapitel das Dropdown und
  die Fortschrittsbalken pro Kurs anzeigen (aktuell B1: 12, BSK-B1+: 7,
  BSK-B2: 12, passend zum Kapitel-Cockpit-Artefakt) - bei Bedarf im
  Semesterverlauf anpassen.
- `LERNZIEL_MINUTEN_PRO_KAPITEL` (Default 30) ist der Richtwert, gegen den
  der Balken pro Kapitel läuft; rein visuelle Orientierung, keine harte
  Vorgabe.

Das gewählte Kapitel wird weiterhin im bestehenden "Thema"-Feld des
Google Formulars übertragen (z. B. "Kapitel 3") - dafür musste an den
drei Formularen nichts geändert werden. Die Übungsminuten selbst sind
ebenfalls bereits eingerichtet: du hast in allen drei Formularen ein
eigenes Feld "Wie lange geübt (Minuten)" ergänzt, die drei
kursspezifischen `entry.XXXXXXXXX`-IDs sind in
`GOOGLE_FORM_ENTRY_IDS_MINUTEN_BY_KURS` in `config.js` eingetragen (pro
Kurs eine andere ID, da das Feld nachträglich einzeln hinzugefügt wurde,
nicht beim Duplizieren mitkopiert) und live gegen alle drei Formulare
getestet - die Lehrkraft sieht die Minuten damit auch direkt im
Formular/der Tabelle.

## Was getestet wurde

Playwright-Test deckt ab: Namens-/Kurseingabe und Wechsel zum
Eintragsformular, Validierungsfehler bei fehlendem Text zu "Was habe ich
gelernt?", fehlender Sicherheitsauswahl bzw. fehlender Minuten-Angabe,
erfolgreiches Speichern (Formular wird geleert, neuer Eintrag erscheint
oben in der Liste, Zähler "(1)"/"(2)" korrekt), sowie Deep-Link mit
vorbefülltem Name/Kurs inkl. korrekter Fußzeile. Zusätzlich wurde die
Übermittlung an das Google Formular (no-cors POST) nach demselben Muster
wie bei Schreib-/Sprechtraining eingebaut und live gegen die drei echten
Formulare getestet (siehe Verlauf oben).

Für den neuen Fortschritts-Balken zusätzlich per Playwright getestet:
Kapitel-Dropdown zeigt die richtige Anzahl Kapitel je nach Kurs (z. B. 7
bei BSK-B1+), Speichern ohne Minuten-Auswahl wird abgelehnt, mehrere
Einträge zum selben Kapitel werden korrekt aufsummiert (inkl. ✓-Markierung
bei Erreichen des Lernziels), Einträge ohne Kapitelbezug fließen nur in
die Gesamtsumme, nicht in einen einzelnen Balken - keine JS-Fehler in der
Konsole.

Für die drei Kurs-Apps wurde zusätzlich per Playwright-Test bestätigt,
dass die neue "📔 Lerntagebuch"-Kachel in allen drei Apps (B1, BSK-B1+,
BSK-B2) sichtbar ist und beim Klick ein neuer Tab mit der korrekten
Lerntagebuch-URL inkl. richtigem Namen und kursspezifischem Kurs-Wert
geöffnet wird - ohne die bestehenden Schreiben-/Sprechen-Kacheln oder
sonstige Funktionen der drei Apps zu beeinträchtigen.
