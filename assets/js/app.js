import { uiTranslations, cvTranslations } from "./translations.js";
import { extractTextFromFile, parseResumeTextLocally, parseResumeWithAI, normalizeJsonCv } from "./parser.js";

const $ = (id) => document.getElementById(id);

const state = {
  uiLanguage: "nb",
  cvLanguage: "nb",
  experience: [{ role: "", company: "", period: "", description: "" }],
  education: [{ degree: "", institution: "", period: "" }]
};

const icons = {
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
};

function translate(key) {
  return uiTranslations[state.uiLanguage][key] ?? key;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function applyUiLanguage(language) {
  state.uiLanguage = language;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = translate(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    element.placeholder = translate(key);
  });

  renderExperienceEditor();
  renderEducationEditor();
}

function applyCvLanguage(language) {
  state.cvLanguage = language;
  const labels = cvTranslations[language];

  const headings = {
    "doc-hdr-summary": labels.summary,
    "doc-hdr-exp": labels.experience,
    "doc-hdr-edu": labels.education,
    "doc-hdr-cert": labels.certifications,
    "doc-hdr-other": labels.otherExperience,
    "doc-hdr-courses": labels.courses,
    "doc-hdr-lang": labels.languages,
    "doc-hdr-it": labels.itSkills,
    "doc-hdr-interests": labels.interests,
    "doc-hdr-ref": labels.references
  };

  Object.entries(headings).forEach(([id, text]) => {
    $(id).textContent = text;
  });

  updateNamePreview();
  updateReferencesPreview();
}

function bindTextField(inputId, outputId, sectionId) {
  const input = $(inputId);
  const output = $(outputId);
  const section = sectionId ? $(sectionId) : output;

  const update = () => {
    const value = input.value.trim();
    output.textContent = value;
    section.classList.toggle("hidden", !value);
  };

  input.addEventListener("input", update);
  update();
}

function updateNamePreview() {
  const value = $("in-name").value.trim();
  $("out-name").textContent = value || cvTranslations[state.cvLanguage].namePlaceholder;
  updatePrintButtonLabel();
}

function renderContacts() {
  const output = $("out-contacts");
  const contactIds = ["in-birth", "in-license", "in-phone", "in-email", "in-address", "in-links"];
  output.replaceChildren();

  contactIds.forEach((id) => {
    const value = $(id).value.trim();
    if (!value) return;
    output.append(createElement("span", "contact-item", value));
  });
}

function createDynamicField({ label, placeholder, value, multiline = false, onInput }) {
  const wrapper = createElement("label", "field");
  wrapper.append(createElement("span", "", label));

  const control = document.createElement(multiline ? "textarea" : "input");
  if (multiline) control.rows = 3;
  else control.type = "text";
  control.placeholder = placeholder;
  control.value = value;
  control.addEventListener("input", (event) => onInput(event.target.value));
  wrapper.append(control);

  return wrapper;
}

function createRemoveButton(onClick) {
  const button = createElement("button", "remove-entry");
  button.type = "button";
  button.setAttribute("aria-label", translate("delete"));
  button.innerHTML = `${icons.trash}<span>${translate("delete")}</span>`;
  button.addEventListener("click", onClick);
  return button;
}

function createCardActions({ onMoveUp, onMoveDown, onRemove, canMoveUp, canMoveDown }) {
  const actions = createElement("div", "repeat-card-actions");

  const btnUp = createElement("button", "reorder-btn");
  btnUp.type = "button";
  btnUp.title = translate("moveUp");
  btnUp.setAttribute("aria-label", translate("moveUp"));
  btnUp.disabled = !canMoveUp;
  btnUp.innerHTML = icons.arrowUp;
  btnUp.addEventListener("click", onMoveUp);

  const btnDown = createElement("button", "reorder-btn");
  btnDown.type = "button";
  btnDown.title = translate("moveDown");
  btnDown.setAttribute("aria-label", translate("moveDown"));
  btnDown.disabled = !canMoveDown;
  btnDown.innerHTML = icons.arrowDown;
  btnDown.addEventListener("click", onMoveDown);

  const btnRemove = createRemoveButton(onRemove);

  actions.append(btnUp, btnDown, btnRemove);
  return actions;
}

function renderExperienceEditor() {
  const container = $("form-exp-list");
  container.replaceChildren();

  state.experience.forEach((item, index) => {
    const card = createElement("article", "repeat-card");
    const header = createElement("div", "repeat-card-header");
    header.append(createElement("span", "repeat-card-title", `${translate("entry")} ${index + 1}`));
    header.append(createCardActions({
      canMoveUp: index > 0,
      canMoveDown: index < state.experience.length - 1,
      onMoveUp: () => {
        if (index > 0) {
          const temp = state.experience[index];
          state.experience[index] = state.experience[index - 1];
          state.experience[index - 1] = temp;
          renderExperienceEditor();
          renderExperiencePreview();
        }
      },
      onMoveDown: () => {
        if (index < state.experience.length - 1) {
          const temp = state.experience[index];
          state.experience[index] = state.experience[index + 1];
          state.experience[index + 1] = temp;
          renderExperienceEditor();
          renderExperiencePreview();
        }
      },
      onRemove: () => {
        state.experience.splice(index, 1);
        renderExperienceEditor();
        renderExperiencePreview();
      }
    }));
    card.append(header);

    const fields = createElement("div", "stacked-fields");
    fields.append(createDynamicField({
      label: translate("role"),
      placeholder: translate("rolePlaceholder"),
      value: item.role,
      onInput: (value) => {
        item.role = value;
        renderExperiencePreview();
      }
    }));

    const row = createElement("div", "form-grid");
    row.append(createDynamicField({
      label: translate("company"),
      placeholder: translate("companyPlaceholder"),
      value: item.company,
      onInput: (value) => {
        item.company = value;
        renderExperiencePreview();
      }
    }));
    row.append(createDynamicField({
      label: translate("period"),
      placeholder: translate("periodPlaceholder"),
      value: item.period,
      onInput: (value) => {
        item.period = value;
        renderExperiencePreview();
      }
    }));
    fields.append(row);

    fields.append(createDynamicField({
      label: translate("responsibilities"),
      placeholder: translate("responsibilitiesPlaceholder"),
      value: item.description,
      multiline: true,
      onInput: (value) => {
        item.description = value;
        renderExperiencePreview();
      }
    }));

    card.append(fields);
    container.append(card);
  });
}

function renderExperiencePreview() {
  const output = $("out-list-exp");
  const section = $("doc-sec-exp");
  output.replaceChildren();

  const entries = state.experience.filter((item) =>
    [item.role, item.company, item.period, item.description].some((value) => value.trim())
  );

  entries.forEach((item) => {
    const entry = createElement("article", "cv-entry");
    const head = createElement("div", "cv-entry-head");
    const title = createElement("div", "cv-entry-title");

    title.append(document.createTextNode(item.role.trim() || item.company.trim()));
    if (item.role.trim() && item.company.trim()) {
      title.append(createElement("span", "cv-entry-org", ` · ${item.company.trim()}`));
    }

    head.append(title);
    if (item.period.trim()) head.append(createElement("span", "cv-entry-period", item.period.trim()));
    entry.append(head);

    if (item.description.trim()) {
      entry.append(createElement("p", "cv-entry-description pre-line", item.description.trim()));
    }

    output.append(entry);
  });

  section.classList.toggle("hidden", entries.length === 0);
}

function renderEducationEditor() {
  const container = $("form-edu-list");
  container.replaceChildren();

  state.education.forEach((item, index) => {
    const card = createElement("article", "repeat-card");
    const header = createElement("div", "repeat-card-header");
    header.append(createElement("span", "repeat-card-title", `${translate("entry")} ${index + 1}`));
    header.append(createCardActions({
      canMoveUp: index > 0,
      canMoveDown: index < state.education.length - 1,
      onMoveUp: () => {
        if (index > 0) {
          const temp = state.education[index];
          state.education[index] = state.education[index - 1];
          state.education[index - 1] = temp;
          renderEducationEditor();
          renderEducationPreview();
        }
      },
      onMoveDown: () => {
        if (index < state.education.length - 1) {
          const temp = state.education[index];
          state.education[index] = state.education[index + 1];
          state.education[index + 1] = temp;
          renderEducationEditor();
          renderEducationPreview();
        }
      },
      onRemove: () => {
        state.education.splice(index, 1);
        renderEducationEditor();
        renderEducationPreview();
      }
    }));
    card.append(header);

    const fields = createElement("div", "stacked-fields");
    fields.append(createDynamicField({
      label: translate("degree"),
      placeholder: translate("degreePlaceholder"),
      value: item.degree,
      onInput: (value) => {
        item.degree = value;
        renderEducationPreview();
      }
    }));

    const row = createElement("div", "form-grid");
    row.append(createDynamicField({
      label: translate("institution"),
      placeholder: translate("institutionPlaceholder"),
      value: item.institution,
      onInput: (value) => {
        item.institution = value;
        renderEducationPreview();
      }
    }));
    row.append(createDynamicField({
      label: translate("period"),
      placeholder: translate("periodPlaceholder"),
      value: item.period,
      onInput: (value) => {
        item.period = value;
        renderEducationPreview();
      }
    }));
    fields.append(row);

    card.append(fields);
    container.append(card);
  });
}

function renderEducationPreview() {
  const output = $("out-list-edu");
  const section = $("doc-sec-edu");
  output.replaceChildren();

  const entries = state.education.filter((item) =>
    [item.degree, item.institution, item.period].some((value) => value.trim())
  );

  entries.forEach((item) => {
    const entry = createElement("article", "cv-entry");
    const head = createElement("div", "cv-entry-head");
    const title = createElement("div", "cv-entry-title");

    title.append(document.createTextNode(item.degree.trim() || item.institution.trim()));
    if (item.degree.trim() && item.institution.trim()) {
      title.append(createElement("span", "cv-entry-org", ` · ${item.institution.trim()}`));
    }

    head.append(title);
    if (item.period.trim()) head.append(createElement("span", "cv-entry-period", item.period.trim()));
    entry.append(head);
    output.append(entry);
  });

  section.classList.toggle("hidden", entries.length === 0);
}

function updateReferencesPreview() {
  const selected = document.querySelector('input[name="ref-mode"]:checked');
  const mode = selected?.value ?? "none";
  const customWrap = $("ref-custom-wrap");
  const section = $("doc-sec-ref");
  const output = $("out-ref");

  customWrap.classList.toggle("hidden", mode !== "manual");

  if (mode === "request") {
    output.textContent = cvTranslations[state.cvLanguage].referenceRequest;
    section.classList.remove("hidden");
    return;
  }

  if (mode === "manual") {
    const value = $("in-ref-custom").value.trim();
    output.textContent = value;
    section.classList.toggle("hidden", !value);
    return;
  }

  output.textContent = "";
  section.classList.add("hidden");
}

function sanitizeFilename(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}

function getPrintFilename() {
  const name = sanitizeFilename($("in-name").value.trim());
  const year = new Date().getFullYear();
  return name ? `${name}_CV_${year}` : `CV_${year}`;
}

function updatePrintButtonLabel() {
  $("btn-print").setAttribute("data-filename", `${getPrintFilename()}.pdf`);
}

function printCv() {
  const previousTitle = document.title;
  document.title = getPrintFilename();

  const restoreTitle = () => {
    document.title = previousTitle;
  };

  window.addEventListener("afterprint", restoreTitle, { once: true });
  window.print();
}

function bindPhotoControls() {
  const input = $("in-photo");
  const output = $("out-photo");
  const removeButton = $("btn-remove-photo");

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      output.src = String(reader.result);
      output.alt = file.name;
      output.classList.remove("hidden");
      removeButton.classList.remove("hidden");
    });
    reader.readAsDataURL(file);
  });

  removeButton.addEventListener("click", () => {
    input.value = "";
    output.removeAttribute("src");
    output.alt = "";
    output.classList.add("hidden");
    removeButton.classList.add("hidden");
  });
}

function exportCurrentCv() {
  const selectedRef = document.querySelector('input[name="ref-mode"]:checked');
  const cvData = {
    name: $("in-name").value.trim(),
    title: $("in-title").value.trim(),
    birth: $("in-birth").value.trim(),
    license: $("in-license").value.trim(),
    phone: $("in-phone").value.trim(),
    email: $("in-email").value.trim(),
    address: $("in-address").value.trim(),
    links: $("in-links").value.trim(),
    summary: $("in-summary").value.trim(),
    experience: state.experience.filter((item) => Object.values(item).some((v) => v.trim())),
    education: state.education.filter((item) => Object.values(item).some((v) => v.trim())),
    certifications: $("in-cert").value.trim(),
    otherExperience: $("in-other").value.trim(),
    courses: $("in-courses").value.trim(),
    languages: $("in-lang").value.trim(),
    itSkills: $("in-it").value.trim(),
    interests: $("in-interests").value.trim(),
    referencesMode: selectedRef ? selectedRef.value : "none",
    referencesCustom: $("in-ref-custom").value.trim()
  };

  const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cvData, null, 2));
  const filename = `${getPrintFilename()}.json`;
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function showReviewStep(data, aiNotice = null) {
  const stepInput = $("import-step-input");
  const stepReview = $("import-step-review");
  stepInput.classList.add("hidden");
  stepReview.classList.remove("hidden");

  let aiStatusEl = $("review-ai-status");
  if (!aiStatusEl) {
    aiStatusEl = createElement("div", "review-ai-status");
    aiStatusEl.id = "review-ai-status";
    stepReview.prepend(aiStatusEl);
  }
  if (aiNotice) {
    aiStatusEl.className = `review-ai-status ${aiNotice.type}`;
    aiStatusEl.textContent = aiNotice.text;
    aiStatusEl.classList.remove("hidden");
  } else {
    aiStatusEl.classList.add("hidden");
  }

  // Personal
  const personalEl = $("review-personal");
  personalEl.replaceChildren();
  const nameLine = createElement("div", "", data.name || "—");
  if (data.title) nameLine.append(createElement("span", "review-pill", ` · ${data.title}`));
  personalEl.append(nameLine);

  const contactItems = [data.email, data.phone, data.address].filter(Boolean);
  if (contactItems.length > 0) {
    personalEl.append(createElement("div", "review-pill", contactItems.join(" · ")));
  }

  // Experience
  const expEl = $("review-experience");
  expEl.replaceChildren();
  const expEntries = (data.experience || []).filter((e) => e.role || e.company);
  expEl.append(createElement("div", "review-pill review-badge-green", `${translate("entriesCount")} ${expEntries.length}`));
  expEntries.slice(0, 3).forEach((e) => {
    expEl.append(createElement("div", "", `• ${[e.role, e.company, e.period].filter(Boolean).join(" | ")}`));
  });

  // Education
  const eduEl = $("review-education");
  eduEl.replaceChildren();
  const eduEntries = (data.education || []).filter((e) => e.degree || e.institution);
  eduEl.append(createElement("div", "review-pill review-badge-green", `${translate("entriesCount")} ${eduEntries.length}`));
  eduEntries.slice(0, 3).forEach((e) => {
    eduEl.append(createElement("div", "", `• ${[e.degree, e.institution, e.period].filter(Boolean).join(" | ")}`));
  });

  // Competence
  const compEl = $("review-competence");
  compEl.replaceChildren();
  const compItems = [];
  if (data.itSkills) compItems.push(translate("itSkills"));
  if (data.languages) compItems.push(translate("languages"));
  if (data.courses) compItems.push(translate("courses"));
  if (data.certifications) compItems.push(translate("certifications"));
  if (data.summary) compItems.push(translate("summary"));
  if (data.otherExperience) compItems.push(translate("projectsCompetence"));
  if (compItems.length > 0) {
    compEl.append(createElement("div", "review-pill", compItems.join(", ")));
  } else {
    compEl.textContent = "—";
  }
}

function applyCvData(data, mode = "replace") {
  const setVal = (id, val) => {
    const input = $(id);
    if (!input) return;
    if (mode === "replace" || !input.value.trim()) {
      input.value = val || "";
      input.dispatchEvent(new Event("input"));
    }
  };

  setVal("in-name", data.name);
  setVal("in-title", data.title);
  setVal("in-birth", data.birth);
  setVal("in-license", data.license);
  setVal("in-phone", data.phone);
  setVal("in-email", data.email);
  setVal("in-address", data.address);
  setVal("in-links", data.links);
  setVal("in-summary", data.summary);
  setVal("in-cert", data.certifications);
  setVal("in-other", data.otherExperience);
  setVal("in-courses", data.courses);
  setVal("in-lang", data.languages);
  setVal("in-it", data.itSkills);
  setVal("in-interests", data.interests);

  if (mode === "replace") {
    state.experience = (data.experience && data.experience.length > 0)
      ? data.experience
      : [{ role: "", company: "", period: "", description: "" }];

    state.education = (data.education && data.education.length > 0)
      ? data.education
      : [{ degree: "", institution: "", period: "" }];
  } else {
    if (data.experience && data.experience.length > 0) {
      const validNew = data.experience.filter((e) => e.role || e.company);
      if (validNew.length > 0) {
        state.experience = state.experience.filter((e) => Object.values(e).some((v) => v.trim())).concat(validNew);
        if (state.experience.length === 0) {
          state.experience = [{ role: "", company: "", period: "", description: "" }];
        }
      }
    }
    if (data.education && data.education.length > 0) {
      const validNew = data.education.filter((e) => e.degree || e.institution);
      if (validNew.length > 0) {
        state.education = state.education.filter((e) => Object.values(e).some((v) => v.trim())).concat(validNew);
        if (state.education.length === 0) {
          state.education = [{ degree: "", institution: "", period: "" }];
        }
      }
    }
  }

  if (data.referencesMode) {
    const radio = document.querySelector(`input[name="ref-mode"][value="${data.referencesMode}"]`);
    if (radio) {
      radio.checked = true;
      if (data.referencesCustom) {
        $("in-ref-custom").value = data.referencesCustom;
      }
      updateReferencesPreview();
    }
  }

  updateNamePreview();
  renderContacts();
  renderExperienceEditor();
  renderExperiencePreview();
  renderEducationEditor();
  renderEducationPreview();
}

let selectedImportFile = null;
let currentImportTab = "file";
let pendingParsedData = null;

function setupImportModal() {
  const modal = $("modal-import");
  const btnOpen = $("btn-import-modal");
  const btnClose = $("btn-close-modal");
  const btnCancel = $("btn-cancel-modal");
  const btnExport = $("btn-export-json");
  const tabBtnFile = $("tab-btn-file");
  const tabBtnPaste = $("tab-btn-paste");
  const panelFile = $("panel-file");
  const panelPaste = $("panel-paste");
  const dropzone = $("import-dropzone");
  const fileInput = $("import-file-input");
  const btnRemoveFile = $("btn-remove-selected-file");
  const fileBanner = $("selected-file-banner");
  const fileNameEl = $("selected-file-name");
  const fileSizeEl = $("selected-file-size");
  const pastedTextEl = $("import-pasted-text");
  const apiKeyEl = $("import-api-key");
  const btnParse = $("btn-parse-data");
  const statusMsgEl = $("import-status-msg");
  const stepInput = $("import-step-input");
  const stepReview = $("import-step-review");
  const btnBack = $("btn-back-to-input");
  const btnApply = $("btn-apply-import");
  const btnVideoToggle = $("btn-toggle-video-guide");
  const videoGuideCard = $("vanilla-video-guide-card");
  if (btnVideoToggle && videoGuideCard) {
    btnVideoToggle.addEventListener("click", () => {
      videoGuideCard.classList.toggle("hidden");
    });
  }

  const savedKey = localStorage.getItem("cv_gemini_api_key");
  if (savedKey) apiKeyEl.value = savedKey;
  const savedModel = localStorage.getItem("cv_gemini_model");
  if (savedModel && $("import-api-model")) {
    if (["gemini-3.8-flash", "gemini-3.5-flash-lite"].includes(savedModel)) {
      $("import-api-model").value = savedModel;
    } else {
      $("import-api-model").value = "gemini-3.8-flash";
    }
  }
  const savedBaseUrl = localStorage.getItem("cv_gemini_baseurl");
  if (savedBaseUrl && $("import-api-baseurl")) $("import-api-baseurl").value = savedBaseUrl;

  const openModal = () => {
    modal.classList.remove("hidden");
    resetImportStep();
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  };

  const resetImportStep = () => {
    stepInput.classList.remove("hidden");
    stepReview.classList.add("hidden");
    statusMsgEl.className = "import-status-msg hidden";
    statusMsgEl.textContent = "";
    btnParse.disabled = false;
  };

  const switchTab = (tab) => {
    currentImportTab = tab;
    if (tab === "file") {
      tabBtnFile.classList.add("active");
      tabBtnPaste.classList.remove("active");
      panelFile.classList.remove("hidden");
      panelPaste.classList.add("hidden");
    } else {
      tabBtnPaste.classList.add("active");
      tabBtnFile.classList.remove("active");
      panelPaste.classList.remove("hidden");
      panelFile.classList.add("hidden");
    }
  };

  const selectFile = (file) => {
    if (!file) return;
    selectedImportFile = file;
    fileNameEl.textContent = file.name;
    const kb = (file.size / 1024).toFixed(1);
    fileSizeEl.textContent = `${kb} KB`;
    fileBanner.classList.remove("hidden");
    statusMsgEl.className = "import-status-msg hidden";
  };

  const removeFile = () => {
    selectedImportFile = null;
    fileInput.value = "";
    fileBanner.classList.add("hidden");
  };

  btnOpen.addEventListener("click", openModal);
  btnClose.addEventListener("click", closeModal);
  btnCancel.addEventListener("click", closeModal);
  btnExport.addEventListener("click", exportCurrentCv);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  tabBtnFile.addEventListener("click", () => switchTab("file"));
  tabBtnPaste.addEventListener("click", () => switchTab("paste"));

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
  });

  btnRemoveFile.addEventListener("click", removeFile);

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  });

  btnParse.addEventListener("click", async () => {
    btnParse.disabled = true;

    const setLoaderState = ({ percent, stepText, counterText }) => {
      statusMsgEl.className = "import-status-msg loading";
      statusMsgEl.innerHTML = `
        <div class="interactive-loader">
          <div class="loader-bar-track">
            <div class="loader-bar-fill" style="width: ${percent}%;"></div>
          </div>
          <div class="loader-step-row">
            <div class="loader-step-info">
              <span class="loader-spinner"></span>
              <span>${stepText}</span>
            </div>
            ${counterText ? `<span class="loader-chip">${counterText}</span>` : ""}
          </div>
        </div>
      `;
      statusMsgEl.classList.remove("hidden");
    };

    let timerInterval = null;
    const selectedModel = $("import-api-model")?.value || "gemini-3.8-flash";

    setLoaderState({
      percent: 25,
      stepText: translate("loadingStepRead"),
      counterText: ""
    });

    try {
      let rawText = "";
      let parsed = null;
      const apiKey = apiKeyEl.value.trim();
      if (apiKey) {
        localStorage.setItem("cv_gemini_api_key", apiKey);
      }
      if ($("import-api-model")) {
        localStorage.setItem("cv_gemini_model", $("import-api-model").value);
      }
      if ($("import-api-baseurl")) {
        localStorage.setItem("cv_gemini_baseurl", $("import-api-baseurl").value.trim());
      }

      if (currentImportTab === "file") {
        if (!selectedImportFile) {
          throw new Error(translate("extractError"));
        }
        const extracted = await extractTextFromFile(selectedImportFile);
        if (extracted.type === "json") {
          parsed = normalizeJsonCv(extracted.data);
        } else {
          rawText = extracted.text;
        }
      } else {
        rawText = pastedTextEl.value.trim();
        if (!rawText) {
          throw new Error(translate("extractError"));
        }
      }

      let aiNotice = null;
      if (!parsed) {
        if (apiKey) {
          try {
            const customBaseUrl = $("import-api-baseurl")?.value?.trim() || "";
            const startTime = Date.now();

            setLoaderState({
              percent: 45,
              stepText: `${translate("loadingStepAi")} (${selectedModel})`,
              counterText: "0s"
            });

            timerInterval = setInterval(() => {
              const elapsed = Math.floor((Date.now() - startTime) / 1000);
              const progress = Math.min(92, 45 + elapsed * 5);
              let stepText = `${translate("loadingStepAi")} (${selectedModel})`;
              if (elapsed >= 3 && elapsed < 7) {
                stepText = translate("loadingStepStream");
              } else if (elapsed >= 7) {
                stepText = translate("loadingStepDone");
              }
              setLoaderState({
                percent: progress,
                stepText,
                counterText: `${elapsed}s`
              });
            }, 300);

            const aiResult = await parseResumeWithAI(rawText, apiKey, {
              model: selectedModel,
              baseUrl: customBaseUrl,
              onProgress: ({ stage, model }) => {
                if (stage === "connecting") {
                  setLoaderState({
                    percent: 50,
                    stepText: `${translate("loadingStepAi")} (${model})`,
                    counterText: model
                  });
                }
              }
            });

            clearInterval(timerInterval);
            timerInterval = null;

            parsed = aiResult.data || aiResult;
            const modelName = aiResult.usedModel || selectedModel;
            aiNotice = { type: "info", text: translate("extractSuccess") };
          } catch (aiErr) {
            if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
            }
            console.warn("AI parsing failed, falling back to local parser:", aiErr);
            aiNotice = null;
            parsed = parseResumeTextLocally(rawText);
          }
        } else {
          parsed = parseResumeTextLocally(rawText);
        }
      }

      setLoaderState({
        percent: 100,
        stepText: translate("loadingStepDone"),
        counterText: "100%"
      });

      pendingParsedData = parsed;
      setTimeout(() => {
        showReviewStep(parsed, aiNotice);
      }, 350);
    } catch (err) {
      if (timerInterval) clearInterval(timerInterval);
      statusMsgEl.className = "import-status-msg error";
      statusMsgEl.textContent = err.message || translate("extractError");
    } finally {
      if (timerInterval) clearInterval(timerInterval);
      btnParse.disabled = false;
    }
  });

  btnBack.addEventListener("click", () => {
    stepReview.classList.add("hidden");
    stepInput.classList.remove("hidden");
  });

  btnApply.addEventListener("click", () => {
    if (!pendingParsedData) return;
    const mode = document.querySelector('input[name="import-mode"]:checked')?.value || "replace";
    applyCvData(pendingParsedData, mode);
    closeModal();
  });
}

function initialize() {
  $("sel-ui-lang").addEventListener("change", (event) => applyUiLanguage(event.target.value));
  $("sel-cv-lang").addEventListener("change", (event) => applyCvLanguage(event.target.value));
  $("btn-print").addEventListener("click", printCv);

  $("in-name").addEventListener("input", updateNamePreview);
  $("in-title").addEventListener("input", () => {
    const value = $("in-title").value.trim();
    $("out-title").textContent = value;
    $("out-title").classList.toggle("hidden", !value);
  });

  ["in-birth", "in-license", "in-phone", "in-email", "in-address", "in-links"].forEach((id) => {
    $(id).addEventListener("input", renderContacts);
  });

  bindTextField("in-summary", "out-summary", "doc-sec-summary");
  bindTextField("in-cert", "out-cert", "doc-sec-cert");
  bindTextField("in-other", "out-other", "doc-sec-other");
  bindTextField("in-courses", "out-courses", "doc-sec-courses");
  bindTextField("in-lang", "out-lang", "doc-sec-lang");
  bindTextField("in-it", "out-it", "doc-sec-it");
  bindTextField("in-interests", "out-interests", "doc-sec-interests");

  $("btn-add-exp").addEventListener("click", () => {
    state.experience.push({ role: "", company: "", period: "", description: "" });
    renderExperienceEditor();
  });

  $("btn-add-edu").addEventListener("click", () => {
    state.education.push({ degree: "", institution: "", period: "" });
    renderEducationEditor();
  });

  document.querySelectorAll('input[name="ref-mode"]').forEach((radio) => {
    radio.addEventListener("change", updateReferencesPreview);
  });
  $("in-ref-custom").addEventListener("input", updateReferencesPreview);

  bindPhotoControls();
  setupImportModal();
  applyUiLanguage(state.uiLanguage);
  applyCvLanguage(state.cvLanguage);
  renderContacts();
  renderExperiencePreview();
  renderEducationPreview();
  updateReferencesPreview();
}

initialize();
