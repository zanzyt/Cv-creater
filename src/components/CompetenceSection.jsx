import React from "react";

export function CompetenceSection({ cvData, setCvData, t }) {
  const handleChange = (field, value) => {
    setCvData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <section className="form-section" aria-labelledby="competence-heading">
      <div className="section-heading">
        <span className="section-number" aria-hidden="true">
          05
        </span>
        <div>
          <h3 id="competence-heading">{t("competence")}</h3>
          <p>{t("competenceHint")}</p>
        </div>
      </div>
      <div className="stacked-fields">
        <label className="field" htmlFor="in-cert">
          <span>{t("certifications")}</span>
          <textarea
            id="in-cert"
            rows={3}
            placeholder={t("certificationsPlaceholder")}
            value={cvData.certifications || ""}
            onChange={(e) => handleChange("certifications", e.target.value)}
          />
        </label>

        <label className="field" htmlFor="in-other">
          <span>{t("otherExperience")}</span>
          <textarea
            id="in-other"
            rows={3}
            placeholder={t("otherExperiencePlaceholder")}
            value={cvData.otherExperience || ""}
            onChange={(e) => handleChange("otherExperience", e.target.value)}
          />
        </label>

        <label className="field" htmlFor="in-courses">
          <span>{t("courses")}</span>
          <textarea
            id="in-courses"
            rows={3}
            placeholder={t("coursesPlaceholder")}
            value={cvData.courses || ""}
            onChange={(e) => handleChange("courses", e.target.value)}
          />
        </label>

        <div className="form-grid">
          <label className="field" htmlFor="in-lang">
            <span>{t("languages")}</span>
            <textarea
              id="in-lang"
              rows={3}
              placeholder={t("languagesPlaceholder")}
              value={cvData.languages || ""}
              onChange={(e) => handleChange("languages", e.target.value)}
            />
          </label>
          <label className="field" htmlFor="in-it">
            <span>{t("itSkills")}</span>
            <textarea
              id="in-it"
              rows={3}
              placeholder={t("itSkillsPlaceholder")}
              value={cvData.itSkills || ""}
              onChange={(e) => handleChange("itSkills", e.target.value)}
            />
          </label>
        </div>

        <label className="field" htmlFor="in-interests">
          <span>{t("interests")}</span>
          <input
            id="in-interests"
            type="text"
            placeholder={t("interestsPlaceholder")}
            value={cvData.interests || ""}
            onChange={(e) => handleChange("interests", e.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
