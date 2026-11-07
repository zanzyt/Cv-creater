import React from "react";
import { Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

export function EducationSection({ education, setEducation, t }) {
  const handleAdd = () => {
    setEducation((prev) => [
      ...prev,
      { degree: "", institution: "", period: "" }
    ]);
  };

  const handleUpdate = (index, field, value) => {
    setEducation((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemove = (index) => {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setEducation((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const handleMoveDown = (index) => {
    setEducation((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  return (
    <section className="form-section" aria-labelledby="education-heading">
      <div className="section-heading with-action">
        <div className="section-title-group">
          <span className="section-number" aria-hidden="true">
            04
          </span>
          <div>
            <h3 id="education-heading">{t("education")}</h3>
            <p>{t("educationHint")}</p>
          </div>
        </div>
        <button
          id="btn-add-edu"
          type="button"
          className="secondary-button compact-button"
          onClick={handleAdd}
        >
          <Plus size={16} aria-hidden="true" />
          <span>{t("add")}</span>
        </button>
      </div>

      <div id="form-edu-list" className="repeat-list">
        {education.map((item, index) => (
          <article key={index} className="repeat-card">
            <div className="repeat-card-header">
              <span className="repeat-card-title">
                {t("entry")} {index + 1}
              </span>
              <div className="repeat-card-actions">
                <button
                  type="button"
                  className="reorder-btn"
                  title={t("moveUp")}
                  aria-label={t("moveUp")}
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                >
                  <ChevronUp size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="reorder-btn"
                  title={t("moveDown")}
                  aria-label={t("moveDown")}
                  disabled={index === education.length - 1}
                  onClick={() => handleMoveDown(index)}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="remove-entry"
                  aria-label={t("delete")}
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  <span>{t("delete")}</span>
                </button>
              </div>
            </div>

            <div className="stacked-fields">
              <label className="field">
                <span>{t("degree")}</span>
                <input
                  type="text"
                  placeholder={t("degreePlaceholder")}
                  value={item.degree || ""}
                  onChange={(e) => handleUpdate(index, "degree", e.target.value)}
                />
              </label>

              <div className="form-grid">
                <label className="field">
                  <span>{t("institution")}</span>
                  <input
                    type="text"
                    placeholder={t("institutionPlaceholder")}
                    value={item.institution || ""}
                    onChange={(e) =>
                      handleUpdate(index, "institution", e.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>{t("period")}</span>
                  <input
                    type="text"
                    placeholder={t("periodPlaceholder")}
                    value={item.period || ""}
                    onChange={(e) => handleUpdate(index, "period", e.target.value)}
                  />
                </label>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
