/* ============================================================
   config.js
   HIER TRÄGST DU DEINE PERSÖNLICHEN EINSTELLUNGEN EIN.
   Diese Datei ist die einzige, die du nach der Einrichtung des
   Google-Formulars anpassen musst. Eine ausführliche Anleitung
   dazu steht in README.md. Anders als Schreibtraining/Sprechtraining
   braucht diese App KEINEN Cloudflare Worker (keine KI-Bewertung -
   das Lerntagebuch ist reine Selbstreflexion).
   ============================================================ */

const CONFIG = {
  // 1) Die "Formular-Antworten senden"-URL deines Google Formulars.
  //    Findest du z. B., indem du dir im Formular-Editor unter den drei
  //    Punkten "Vorschau" öffnest und dort die URL kopierst, dann am Ende
  //    "viewform" durch "formResponse" ersetzt.
  //    Beispiel: "https://docs.google.com/forms/d/e/1FAIpQLSc.../formResponse"
  //    Dies ist das allgemeine/geteilte Formular - wird als Fallback für
  //    alle Kurse verwendet, die (noch) kein eigenes Formular haben (siehe
  //    GOOGLE_FORM_ACTION_URL_BY_KURS unten).
  GOOGLE_FORM_ACTION_URL: "https://docs.google.com/forms/d/e/DEINE-FORM-ID/formResponse",

  // 1b) Optional: pro Kurs ein eigenes, separates Formular hinterlegen
  //     (gleiche Feldstruktur/entry-IDs wie beim geteilten Formular, einfach
  //     als Kopie angelegt), damit Einträge dieses Kurses nicht mit denen
  //     der anderen Kurse vermischt ankommen - wie bei Schreibtraining/
  //     Sprechtraining. Kurse ohne Eintrag hier nutzen weiterhin
  //     GOOGLE_FORM_ACTION_URL oben.
  GOOGLE_FORM_ACTION_URL_BY_KURS: {
    // Alle drei Kurse haben inzwischen ein eigenes Formular (Duplikate mit
    // identischen entry-IDs, siehe GOOGLE_FORM_ENTRY_IDS unten).
    "B1 Oberndorf (KL T. Jurtzik)": "https://docs.google.com/forms/d/e/1FAIpQLSeve0evlyU9jXJrkXHuy67VjCujet-fEWywKfBeAncTDrQiRw/formResponse",
    "BSK-B1+ Rottweil (KL T. Jurtzik)": "https://docs.google.com/forms/d/e/1FAIpQLSfX5h427oaMAsC_PrEnnKZcENXY9IU9VeWr-CLJ2pgBRWDDFA/formResponse",
    "BSK-B2 Rottweil (KL T. Jurtzik)": "https://docs.google.com/forms/d/e/1FAIpQLSeMqvbnW6G2L4pfdEtg5Sl_9RMRKa5EX4M7vi62kaWUXSmSgA/formResponse"
  },

  // 2) Die entry.XXXXXXXXX-IDs der einzelnen Formularfelder. Gelten für das
  //    geteilte Formular UND für die kursspezifischen Formulare oben, sofern
  //    diese als Kopie des geteilten Formulars angelegt wurden (Google Forms
  //    behält die entry-IDs beim Duplizieren bei).
  //    Anleitung zum Herausfinden dieser IDs steht in README.md.
  GOOGLE_FORM_ENTRY_IDS: {
    name: "entry.1001297142",
    kurs: "entry.766497337",
    datum: "entry.2109143931",
    thema: "entry.1490457020",
    gelernt: "entry.1667135733",
    schwierig: "entry.1365796381",
    ueben: "entry.1908782762",
    sicherheit: "entry.951934711",
    // Fallback-entry-ID für "Wie lange geübt (Minuten)", falls ein Kurs in
    // GOOGLE_FORM_ENTRY_IDS_MINUTEN_BY_KURS unten fehlt. Leer lassen, solange
    // kein Formular dieses Feld hat - der Fortschrittsbalken in der App
    // funktioniert auch ohne, nur landen die Minuten dann nicht zusätzlich im
    // Formular/der Tabelle.
    minuten: ""
  },

  // 2b) Das Minuten-Feld wurde nachträglich einzeln zu jedem der drei
  //     Formulare hinzugefügt (nicht beim Duplizieren mitkopiert) und hat
  //     deshalb pro Kurs eine eigene entry-ID - anders als die übrigen Felder
  //     oben, die bei allen drei Formularen identisch sind.
  GOOGLE_FORM_ENTRY_IDS_MINUTEN_BY_KURS: {
    "B1 Oberndorf (KL T. Jurtzik)": "entry.1375642204",
    "BSK-B1+ Rottweil (KL T. Jurtzik)": "entry.1138130224",
    "BSK-B2 Rottweil (KL T. Jurtzik)": "entry.1661136890"
  },

  // 3) Auswahlliste der Kurse/Gruppen, die im Dropdown der App erscheinen.
  //    Einfach anpassen/erweitern.
  KURSE: ["B1 Oberndorf (KL T. Jurtzik)", "BSK-B1+ Rottweil (KL T. Jurtzik)", "BSK-B2 Rottweil (KL T. Jurtzik)"],

  // 4) Wie viele Kapitel hat der jeweilige Kurs? Steuert die Kapitel-Auswahl
  //    im Formular sowie die Anzahl der Fortschrittsbalken ("Meine Lernzeit
  //    pro Kapitel"). Bitte bei Bedarf im Semesterverlauf anpassen (siehe
  //    auch das Kapitel-Cockpit-Artefakt für den aktuellen Stand).
  KAPITEL_ANZAHL_BY_KURS: {
    "B1 Oberndorf (KL T. Jurtzik)": 12,
    "BSK-B1+ Rottweil (KL T. Jurtzik)": 7,
    "BSK-B2 Rottweil (KL T. Jurtzik)": 12
  },

  // 5) Lernziel in Minuten pro Kapitel, gegen das der Fortschrittsbalken
  //    anzeigt (rein visuelle Orientierung, keine harte Vorgabe). Einfach
  //    anpassen, wenn du einen anderen Richtwert möchtest.
  LERNZIEL_MINUTEN_PRO_KAPITEL: 30
};
