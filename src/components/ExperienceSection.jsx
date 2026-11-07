import React from "react";
import { Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

export function ExperienceSection({ experience, setExperience, t }) {
  const handleAdd = () => {
    setExperience((prev) => [
      ...prev,
      { role: "", company: "", period: "", description: "" }
    ]);
  };

  const handleUpdate = (index, field, value) => {
    setExperience((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemove = (index) => {
    setExperience((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setExperience((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const handleMoveDown = (index) => {
    setExperience((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  return (
    <section className="form-section" aria-labelledby="experience-heading">
      <div className="section-heading with-action">
        <div className="section-title-group">
          <span className="section-number" aria-hidden="true">
            03
          </span>
          <div>
            <h3 id="experience-heading">{t("experience")}</h3>
            <p>{t("experienceHint")}</p>
          </div>
        </div>
        <button
          id="btn-add-exp"
          type="button"
          className="secondary-button compact-button"
          onClick={handleAdd}
        >
          <Plus size={16} aria-hidden="true" />
          <span>{t("add")}</span>
        </button>
      </div>

      <div id="form-exp-list" className="repeat-list">
        {experience.map((item, index) => (
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
                  disabled={index === experience.length - 1}
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
                <span>{t("role")}</span>
                <input
                  type="text"
                  placeholder={t("rolePlaceholder")}
                  value={item.role || ""}
                  onChange={(e) => handleUpdate(index, "role", e.target.value)}
                />
              </label>

              <div className="form-grid">
                <label className="field">
                  <span>{t("company")}</span>
                  <input
                    type="text"
                    placeholder={t("companyPlaceholder")}
                    value={item.company || ""}
                    onChange={(e) => handleUpdate(index, "company", e.target.value)}
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

              <label className="field">
                <span>{t("responsibilities")}</span>
                <textarea
                  rows={3}
                  placeholder={t("responsibilitiesPlaceholder")}
                  value={item.description || ""}
                  onChange={(e) =>
                    handleUpdate(index, "description", e.target.value)
                  }
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
