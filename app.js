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
    inputThema: document.getElementById("input-thema"),
    inputGelernt: document.getElementById("input-gelernt"),
    inputSchwierig: document.getElementById("input-schwierig"),
    inputUeben: document.getElementById("input-ueben"),
    ratingRow: document.getElementById("ratingRow"),
    btnSave: document.getElementById("btn-save"),
    saveHint: document.getElementById("saveHint"),

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

  function resetForm() {
    el.inputThema.value = "";
    el.inputGelernt.value = "";
    el.inputSchwierig.value = "";
    el.inputUeben.value = "";
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
            ${entry.thema ? `<span class="entry-theme">– ${escapeHtml(entry.thema)}</span>` : ""}
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
    renderHistory();
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

    const entry = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      name: state.name,
      kurs: state.kurs,
      datumIso: new Date().toISOString(),
      thema: el.inputThema.value.trim(),
      gelernt,
      schwierig: el.inputSchwierig.value.trim(),
      ueben: el.inputUeben.value.trim(),
      sicherheit: ratingEl.value
    };

    const all = loadAllEntries();
    all.push(entry);
    saveAllEntries(all);
    renderHistory();
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
    formData.append(ids.thema, entry.thema || "");
    formData.append(ids.gelernt, entry.gelernt || "");
    formData.append(ids.schwierig, entry.schwierig || "");
    formData.append(ids.ueben, entry.ueben || "");
    formData.append(ids.sicherheit, entry.sicherheit || "");

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
