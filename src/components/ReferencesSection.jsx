import React from "react";

export function ReferencesSection({ cvData, setCvData, t }) {
  const mode = cvData.referencesMode || "none";

  const handleModeChange = (newMode) => {
    setCvData((prev) => ({ ...prev, referencesMode: newMode }));
  };

  const handleCustomChange = (value) => {
    setCvData((prev) => ({ ...prev, referencesCustom: value }));
  };

  return (
    <section className="form-section" aria-labelledby="references-heading">
      <div className="section-heading">
        <span className="section-number" aria-hidden="true">
          06
        </span>
        <div>
          <h3 id="references-heading">{t("references")}</h3>
          <p>{t("referencesHint")}</p>
        </div>
      </div>

      <fieldset className="reference-options">
        <legend className="visually-hidden">{t("referencesMode")}</legend>
        <label className="reference-option">
          <input
            type="radio"
            name="ref-mode"
            value="none"
            checked={mode === "none"}
            onChange={() => handleModeChange("none")}
          />
          <span>{t("refNone")}</span>
        </label>
        <label className="reference-option">
          <input
            type="radio"
            name="ref-mode"
            value="request"
            checked={mode === "request"}
            onChange={() => handleModeChange("request")}
          />
          <span>{t("refRequest")}</span>
        </label>
        <label className="reference-option">
          <input
            type="radio"
            name="ref-mode"
            value="manual"
            checked={mode === "manual"}
            onChange={() => handleModeChange("manual")}
          />
          <span>{t("refManual")}</span>
        </label>
      </fieldset>

      {mode === "manual" && (
        <label id="ref-custom-wrap" className="field" htmlFor="in-ref-custom">
          <span>{t("referenceContacts")}</span>
          <textarea
            id="in-ref-custom"
            rows={3}
            placeholder={t("referenceContactsPlaceholder")}
            value={cvData.referencesCustom || ""}
            onChange={(e) => handleCustomChange(e.target.value)}
          />
        </label>
      )}
    </section>
  );
}
