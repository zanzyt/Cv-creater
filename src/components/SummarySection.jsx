import React from "react";

export function SummarySection({ cvData, setCvData, t }) {
  return (
    <section className="form-section" aria-labelledby="summary-heading">
      <div className="section-heading">
        <span className="section-number" aria-hidden="true">
          02
        </span>
        <div>
          <h3 id="summary-heading">{t("summary")}</h3>
          <p>{t("summaryHint")}</p>
        </div>
      </div>
      <label className="field" htmlFor="in-summary">
        <span>{t("summaryLabel")}</span>
        <textarea
          id="in-summary"
          rows={4}
          placeholder={t("summaryPlaceholder")}
          value={cvData.summary || ""}
          onChange={(e) =>
            setCvData((prev) => ({ ...prev, summary: e.target.value }))
          }
        />
      </label>
    </section>
  );
}
