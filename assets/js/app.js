import { uiTranslations, cvTranslations } from "./translations.js";

const $ = (id) => document.getElementById(id);

const state = {
  uiLanguage: "ru",
  cvLanguage: "nb",
  experience: [{ role: "", company: "", period: "", description: "" }],
  education: [{ degree: "", institution: "", period: "" }]
};

const icons = {
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/></svg>'
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

function renderExperienceEditor() {
  const container = $("form-exp-list");
  container.replaceChildren();

  state.experience.forEach((item, index) => {
    const card = createElement("article", "repeat-card");
    const header = createElement("div", "repeat-card-header");
    header.append(createElement("span", "repeat-card-title", `${translate("entry")} ${index + 1}`));
    header.append(createRemoveButton(() => {
      state.experience.splice(index, 1);
      renderExperienceEditor();
      renderExperiencePreview();
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
    header.append(createRemoveButton(() => {
      state.education.splice(index, 1);
      renderEducationEditor();
      renderEducationPreview();
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
  applyUiLanguage(state.uiLanguage);
  applyCvLanguage(state.cvLanguage);
  renderContacts();
  renderExperiencePreview();
  renderEducationPreview();
  updateReferencesPreview();
}

initialize();
