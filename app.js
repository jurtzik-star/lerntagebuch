/* ============================================================
   app.js
   Steuert das Lerntagebuch: Name/Kurs -> neuer Eintrag mit vier festen
   Reflexionsfragen -> Speichern. Jeder Eintrag wird (a) lokal in diesem
   Browser gespeichert, damit die/der TN ihre/seine eigenen bisherigen
   Einträge wiederfindet, und (b) an ein Google Formular übermittelt,
   damit die Lehrkraft mitlesen kann - wie bei Schreibtraining/
   Sprechtraining. Keine KI-Bewertung, kein Cloudflare Worker nötig.
   ============================================================ */

(function () {
  "use strict";

  const LS_KEY_PROFILE = "lerntagebuch_profile";
  const LS_KEY_ENTRIES = "lerntagebuch_entries";

  // Deep-Linking: erlaubt anderen Apps (den drei Kurs-Apps), per Link
  // direkt Name und Kurs mitzugeben, z. B.
  // lerntagebuch.jurtzik-lernapps.de/?name=Anna+Muster&kurs=B1+Oberndorf...
  const urlParams = new URLSearchParams(window.location.search);
  const deepLink = {
    name: urlParams.get("name") || "",
    kurs: urlParams.get("kurs") || ""
  };

  const state = { name: "", kurs: "" };

  const el = {
    stepIntro: document.getElementById("step-intro"),
    stepDiary: document.getElementById("step-diary"),

    inputName: document.getElementById("input-name"),
    inputKurs: document.getElementById("input-kurs"),
    btnStart: document.getElementById("btn-start"),

    entryDate: document.getElementById("entryDate"),
    inputKapitel: document.getElementById("input-kapitel"),
    inputGelernt: document.getElementById("input-gelernt"),
    inputSchwierig: document.getElementById("input-schwierig"),
    inputUeben: document.getElementById("input-ueben"),
    inputMinuten: document.getElementById("input-minuten"),
    ratingRow: document.getElementById("ratingRow"),
    btnSave: document.getElementById("btn-save"),
    saveHint: document.getElementById("saveHint"),

    progressTotal: document.getElementById("progressTotal"),
    progressList: document.getElementById("progressList"),

    historyCount: document.getElementById("historyCount"),
    historyList: document.getElementById("historyList")
  };

  function showStep(step) {
    [el.stepIntro, el.stepDiary].forEach((s) => s.classList.add("hidden"));
    step.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  // ---------- Dynamische Fußzeile ----------
  const FOOTER_APP_NAME = "Lerntagebuch";
  function updateFooterText() {
    const footerEl = document.getElementById("appFooter");
    if (!footerEl) return;
    if (!state.kurs) {
      footerEl.textContent = "Lern-App " + FOOTER_APP_NAME + ", erstellt von Thomas Jurtzik";
      return;
    }
    footerEl.textContent = "Lern-App " + FOOTER_APP_NAME + ", Kurs: " + state.kurs + ". erstellt von Thomas Jurtzik";
  }

  // ---------- Initiales Setup ----------
  function initIntro() {
    const saved = JSON.parse(localStorage.getItem(LS_KEY_PROFILE) || "{}");
    if (saved.name) el.inputName.value = saved.name;

    el.inputKurs.innerHTML = "";
    (CONFIG.KURSE || []).forEach((k) => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = k;
      el.inputKurs.appendChild(opt);
    });
    if (saved.kurs) el.inputKurs.value = saved.kurs;

    if (deepLink.name) el.inputName.value = deepLink.name;
    if (deepLink.kurs && (CONFIG.KURSE || []).includes(deepLink.kurs)) {
      el.inputKurs.value = deepLink.kurs;
    }
  }

  function formatDatum(d) {
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  // ---------- Kapitel-Auswahl (abhängig vom gewählten Kurs) ----------
  function anzahlKapitel() {
    return (CONFIG.KAPITEL_ANZAHL_BY_KURS && CONFIG.KAPITEL_ANZAHL_BY_KURS[state.kurs]) || 12;
  }

  function populateKapitelOptions() {
    const anzahl = anzahlKapitel();
    el.inputKapitel.innerHTML = '<option value="">– kein bestimmtes Kapitel –</option>';
    for (let k = 1; k <= anzahl; k++) {
      const opt = document.createElement("option");
      opt.value = String(k);
      opt.textContent = "Kapitel " + k;
      el.inputKapitel.appendChild(opt);
    }
  }

  function resetForm() {
    el.inputKapitel.value = "";
    el.inputGelernt.value = "";
    el.inputSchwierig.value = "";
    el.inputUeben.value = "";
    el.inputMinuten.value = "";
    const checked = el.ratingRow.querySelector("input:checked");
    if (checked) checked.checked = false;
  }

  // ---------- Verlauf (lokal in diesem Browser) ----------
  function loadAllEntries() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY_ENTRIES) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveAllEntries(entries) {
    localStorage.setItem(LS_KEY_ENTRIES, JSON.stringify(entries));
  }

  function myEntries() {
    const nameKey = state.name.trim().toLowerCase();
    return loadAllEntries()
      .filter((e) => e.name.trim().toLowerCase() === nameKey && e.kurs === state.kurs)
      .sort((a, b) => new Date(b.datumIso) - new Date(a.datumIso));
  }

  function renderHistory() {
    const entries = myEntries();
    el.historyCount.textContent = entries.length ? "(" + entries.length + ")" : "";
    if (!entries.length) {
      el.historyList.innerHTML = '<p class="history-empty">Hier erscheinen deine bisherigen Einträge, sobald du den ersten gespeichert hast.</p>';
      return;
    }
    el.historyList.innerHTML = entries
      .map((entry, i) => {
        const d = new Date(entry.datumIso);
        const kurzdatum = d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
        return `
        <details class="history-entry"${i === 0 ? " open" : ""}>
          <summary>
            ${escapeHtml(kurzdatum)}
            ${entry.kapitel ? `<span class="entry-theme">– Kapitel ${escapeHtml(entry.kapitel)}</span>` : ""}
            ${entry.minuten ? `<span class="entry-minutes">${escapeHtml(String(entry.minuten))} Min</span>` : ""}
            ${entry.sicherheit ? `<span class="entry-rating">Sicherheit ${escapeHtml(entry.sicherheit)}/5</span>` : ""}
          </summary>
          <div class="entry-body">
            ${entry.gelernt ? `<h4>Was ich gelernt habe</h4><p>${escapeHtml(entry.gelernt)}</p>` : ""}
            ${entry.schwierig ? `<h4>Was schwierig war</h4><p>${escapeHtml(entry.schwierig)}</p>` : ""}
            ${entry.ueben ? `<h4>Was ich als Nächstes üben möchte</h4><p>${escapeHtml(entry.ueben)}</p>` : ""}
          </div>
        </details>`;
      })
      .join("");
  }

  // ---------- Lernzeit-Fortschritt pro Kapitel ----------
  function computeProgress() {
    const entries = myEntries();
    const totalMinuten = entries.reduce((sum, e) => sum + (Number(e.minuten) || 0), 0);
    const anzahl = anzahlKapitel();
    const ziel = CONFIG.LERNZIEL_MINUTEN_PRO_KAPITEL || 30;
    const perKapitel = {};
    for (let k = 1; k <= anzahl; k++) perKapitel[k] = 0;
    let ohneKapitel = 0;
    entries.forEach((e) => {
      const min = Number(e.minuten) || 0;
      if (!min) return;
      if (e.kapitel && perKapitel.hasOwnProperty(e.kapitel)) {
        perKapitel[e.kapitel] += min;
      } else {
        ohneKapitel += min;
      }
    });
    return { totalMinuten, anzahl, ziel, perKapitel, ohneKapitel, anzahlEintraege: entries.length };
  }

  function renderProgress() {
    const { totalMinuten, anzahl, ziel, perKapitel, ohneKapitel, anzahlEintraege } = computeProgress();

    el.progressTotal.textContent = totalMinuten > 0
      ? "Insgesamt " + totalMinuten + " Minuten geübt (in " + anzahlEintraege + (anzahlEintraege === 1 ? " Eintrag" : " Einträgen") + ")."
      : "Sobald du bei einem Eintrag Kapitel und Übungszeit angibst, siehst du hier deinen Fortschritt pro Kapitel.";

    let rows = "";
    for (let k = 1; k <= anzahl; k++) {
      const min = perKapitel[k] || 0;
      const pct = Math.max(0, Math.min(100, Math.round((min / ziel) * 100)));
      const erreicht = min >= ziel;
      rows += `
        <div class="progress-row">
          <div class="progress-label">Kapitel ${k}</div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill${erreicht ? " reached" : ""}" style="width:${pct}%"></div>
          </div>
          <div class="progress-value">${min} / ${ziel} Min${erreicht ? " ✓" : ""}</div>
        </div>`;
    }
    if (ohneKapitel > 0) {
      rows += `<p class="progress-note">+ ${ohneKapitel} Minuten aus Einträgen ohne Kapitel-Zuordnung</p>`;
    }
    el.progressList.innerHTML = rows;
  }

  // ---------- Ablauf ----------
  function startFlow() {
    state.name = el.inputName.value.trim();
    state.kurs = el.inputKurs.value;
    if (!state.name) {
      alert("Bitte gib deinen Namen ein.");
      return;
    }
    localStorage.setItem(LS_KEY_PROFILE, JSON.stringify({ name: state.name, kurs: state.kurs }));
    updateFooterText();
    el.entryDate.textContent = formatDatum(new Date());
    populateKapitelOptions();
    renderHistory();
    renderProgress();
    showStep(el.stepDiary);
  }

  el.btnStart.addEventListener("click", startFlow);

  el.btnSave.addEventListener("click", async () => {
    const gelernt = el.inputGelernt.value.trim();
    const ratingEl = el.ratingRow.querySelector("input:checked");

    if (!gelernt) {
      el.saveHint.textContent = "Bitte schreib mindestens etwas zu „Was habe ich gelernt?“.";
      el.saveHint.classList.add("error");
      el.inputGelernt.focus();
      return;
    }
    if (!ratingEl) {
      el.saveHint.textContent = "Bitte wähle noch aus, wie sicher du dich gerade fühlst (1–5).";
      el.saveHint.classList.add("error");
      return;
    }
    if (!el.inputMinuten.value) {
      el.saveHint.textContent = "Bitte gib noch an, wie lange du geübt hast.";
      el.saveHint.classList.add("error");
      el.inputMinuten.focus();
      return;
    }

    const entry = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      name: state.name,
      kurs: state.kurs,
      datumIso: new Date().toISOString(),
      kapitel: el.inputKapitel.value,
      gelernt,
      schwierig: el.inputSchwierig.value.trim(),
      ueben: el.inputUeben.value.trim(),
      minuten: Number(el.inputMinuten.value),
      sicherheit: ratingEl.value
    };

    const all = loadAllEntries();
    all.push(entry);
    saveAllEntries(all);
    renderHistory();
    renderProgress();
    resetForm();

    el.saveHint.classList.remove("error");
    el.saveHint.textContent = "Gespeichert ✓";
    setTimeout(() => {
      if (el.saveHint.textContent === "Gespeichert ✓") el.saveHint.textContent = "";
    }, 2500);

    submitToGoogleForm(entry).catch((e) => console.warn("Google-Formular-Übermittlung fehlgeschlagen:", e));
  });

  // ---------- Übermittlung an Google Formular ----------
  async function submitToGoogleForm(entry) {
    if (!CONFIG.GOOGLE_FORM_ACTION_URL || CONFIG.GOOGLE_FORM_ACTION_URL.includes("DEINE-FORM-ID")) {
      console.warn("Google-Formular ist noch nicht konfiguriert (config.js).");
      return;
    }
    const ids = CONFIG.GOOGLE_FORM_ENTRY_IDS;
    const formData = new URLSearchParams();
    formData.append(ids.name, entry.name);
    formData.append(ids.kurs, entry.kurs);
    formData.append(ids.datum, new Date(entry.datumIso).toLocaleDateString("de-DE"));
    formData.append(ids.thema, entry.kapitel ? "Kapitel " + entry.kapitel : "");
    formData.append(ids.gelernt, entry.gelernt || "");
    formData.append(ids.schwierig, entry.schwierig || "");
    formData.append(ids.ueben, entry.ueben || "");
    formData.append(ids.sicherheit, entry.sicherheit || "");
    // Minuten-Feld ist optional - wird nur mitgeschickt, wenn eine entry-ID
    // konfiguriert ist. Das Feld wurde nachträglich einzeln zu jedem Formular
    // hinzugefügt, daher zuerst die kursspezifische ID versuchen und nur bei
    // Bedarf auf die gemeinsame Fallback-ID zurückfallen.
    const minutenId =
      (CONFIG.GOOGLE_FORM_ENTRY_IDS_MINUTEN_BY_KURS && CONFIG.GOOGLE_FORM_ENTRY_IDS_MINUTEN_BY_KURS[entry.kurs]) ||
      ids.minuten;
    if (minutenId) {
      formData.append(minutenId, entry.minuten != null ? String(entry.minuten) : "");
    }

    const actionUrl =
      (CONFIG.GOOGLE_FORM_ACTION_URL_BY_KURS && CONFIG.GOOGLE_FORM_ACTION_URL_BY_KURS[entry.kurs]) ||
      CONFIG.GOOGLE_FORM_ACTION_URL;

    // no-cors: wir bekommen keine lesbare Antwort, aber die Übermittlung
    // an Google Forms funktioniert damit zuverlässig cross-origin.
    await fetch(actionUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
  }

  // ---------- Start ----------
  initIntro();
  updateFooterText();

  // Kommt man mit einem Namen per Deep-Link an (aus einer Kurs-App), muss
  // nicht extra auf "Weiter" geklickt werden.
  if (deepLink.name) {
    startFlow();
  }
})();
