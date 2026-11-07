import React from "react";
import { Palette } from "lucide-react";

export function CvPreview({
  cvData,
  experience,
  education,
  cvLabels,
  cvStyle = "standard",
  setCvStyle,
  t
}) {
  const contactItems = [
    { label: cvLabels.birth, value: cvData.birth },
    { label: cvLabels.license, value: cvData.license },
    { label: cvLabels.phone, value: cvData.phone },
    { label: cvLabels.email, value: cvData.email },
    { label: cvLabels.address, value: cvData.address },
    { label: cvLabels.links, value: cvData.links }
  ].filter((item) => Boolean(item.value?.trim()));

  const activeExp = (experience || []).filter((item) =>
    [item.role, item.company, item.period, item.description].some((v) =>
      (v || "").trim()
    )
  );

  const activeEdu = (education || []).filter((item) =>
    [item.degree, item.institution, item.period].some((v) => (v || "").trim())
  );

  const getReferenceText = () => {
    const mode = cvData.referencesMode || "none";
    if (mode === "request") return cvLabels.referencesNotice;
    if (mode === "manual") return cvData.referencesCustom || "";
    return "";
  };

  const refText = getReferenceText();

  return (
    <section className="preview-column" aria-label="Forhåndsvisning av CV">
      <div className="preview-toolbar no-print">
        <div className="preview-status-indicator">
          <span className="preview-status-dot" aria-hidden="true" />
          <span>{t("livePreview")}</span>
        </div>

        <div className="preview-toolbar-actions">
          <div className="cv-style-picker">
            <Palette size={14} aria-hidden="true" className="style-picker-icon" />
            <label htmlFor="cv-style-select" className="visually-hidden">
              {t("cvStyleLabel")}
            </label>
            <select
              id="cv-style-select"
              className="cv-style-select"
              value={cvStyle}
              onChange={(e) => setCvStyle?.(e.target.value)}
              title={t("cvStyleLabel")}
            >
              <option value="standard">{t("styleStandard")}</option>
              <option value="modern">{t("styleModern")}</option>
              <option value="sidebar">{t("styleSidebar")}</option>
              <option value="classic">{t("styleClassic")}</option>
            </select>
          </div>
          <span className="a4-label">A4</span>
        </div>
      </div>

      <div className="preview-stage">
        {cvStyle === "sidebar" ? (
          /* ==========================================
             BERGEN SIDEBAR STYLE (2-COLUMN GRID)
             ========================================== */
          <article
            id="cv-preview"
            className="cv-page cv-style-sidebar"
            aria-label="CV preview"
          >
            <aside className="cv-sidebar-col">
              {cvData.photo && (
                <div className="sidebar-photo-wrap">
                  <img
                    id="out-photo"
                    className="cv-photo sidebar-photo"
                    src={cvData.photo}
                    alt="Portrett"
                  />
                </div>
              )}

              {contactItems.length > 0 && (
                <div className="sidebar-block">
                  <h3 className="sidebar-section-title">
                    {cvLabels.personal || "Kontakt"}
                  </h3>
                  <div className="sidebar-contacts">
                    {contactItems.map((c, i) => (
                      <div key={i} className="sidebar-contact-item">
                        <span className="sidebar-contact-val">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(cvData.itSkills?.trim() || cvData.languages?.trim()) && (
                <>
                  {cvData.itSkills?.trim() && (
                    <div className="sidebar-block">
                      <h3 className="sidebar-section-title">
                        {cvLabels.itSkills}
                      </h3>
                      <p className="sidebar-text pre-line">{cvData.itSkills.trim()}</p>
                    </div>
                  )}
                  {cvData.languages?.trim() && (
                    <div className="sidebar-block">
                      <h3 className="sidebar-section-title">
                        {cvLabels.languages}
                      </h3>
                      <p className="sidebar-text pre-line">{cvData.languages.trim()}</p>
                    </div>
                  )}
                </>
              )}

              {cvData.certifications?.trim() && (
                <div className="sidebar-block">
                  <h3 className="sidebar-section-title">
                    {cvLabels.certifications}
                  </h3>
                  <p className="sidebar-text pre-line">
                    {cvData.certifications.trim()}
                  </p>
                </div>
              )}

              {cvData.interests?.trim() && (
                <div className="sidebar-block">
                  <h3 className="sidebar-section-title">
                    {cvLabels.interests}
                  </h3>
                  <p className="sidebar-text">{cvData.interests.trim()}</p>
                </div>
              )}

              {refText && (
                <div className="sidebar-block">
                  <h3 className="sidebar-section-title">
                    {cvLabels.references}
                  </h3>
                  <p className="sidebar-text pre-line">{refText}</p>
                </div>
              )}
            </aside>

            <main className="cv-main-col">
              <header className="cv-main-header">
                <h1 id="out-name" className="sidebar-cv-name">
                  {cvData.name?.trim() || cvLabels.namePlaceholder}
                </h1>
                {cvData.title?.trim() && (
                  <p id="out-title" className="sidebar-cv-role">
                    {cvData.title.trim()}
                  </p>
                )}
              </header>

              {cvData.summary?.trim() && (
                <section id="doc-sec-summary" className="cv-section">
                  <h2 id="doc-hdr-summary">{cvLabels.summary}</h2>
                  <p id="out-summary" className="pre-line">
                    {cvData.summary.trim()}
                  </p>
                </section>
              )}

              {activeExp.length > 0 && (
                <section id="doc-sec-exp" className="cv-section">
                  <h2 id="doc-hdr-exp">{cvLabels.experience}</h2>
                  <div id="out-list-exp" className="cv-list">
                    {activeExp.map((item, idx) => (
                      <article key={idx} className="cv-entry">
                        <div className="cv-entry-head">
                          <div className="cv-entry-title">
                            {item.role?.trim() || item.company?.trim()}
                            {item.role?.trim() && item.company?.trim() && (
                              <span className="cv-entry-org">
                                {" "}
                                · {item.company.trim()}
                              </span>
                            )}
                          </div>
                          {item.period?.trim() && (
                            <span className="cv-entry-period">
                              {item.period.trim()}
                            </span>
                          )}
                        </div>
                        {item.description?.trim() && (
                          <p className="cv-entry-description pre-line">
                            {item.description.trim()}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {activeEdu.length > 0 && (
                <section id="doc-sec-edu" className="cv-section">
                  <h2 id="doc-hdr-edu">{cvLabels.education}</h2>
                  <div id="out-list-edu" className="cv-list">
                    {activeEdu.map((item, idx) => (
                      <article key={idx} className="cv-entry">
                        <div className="cv-entry-head">
                          <div className="cv-entry-title">
                            {item.degree?.trim() || item.institution?.trim()}
                            {item.degree?.trim() && item.institution?.trim() && (
                              <span className="cv-entry-org">
                                {" "}
                                · {item.institution.trim()}
                              </span>
                            )}
                          </div>
                          {item.period?.trim() && (
                            <span className="cv-entry-period">
                              {item.period.trim()}
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {cvData.otherExperience?.trim() && (
                <section id="doc-sec-other" className="cv-section">
                  <h2 id="doc-hdr-other">{cvLabels.otherExperience}</h2>
                  <p id="out-other" className="pre-line">
                    {cvData.otherExperience.trim()}
                  </p>
                </section>
              )}

              {cvData.courses?.trim() && (
                <section id="doc-sec-courses" className="cv-section">
                  <h2 id="doc-hdr-courses">{cvLabels.courses}</h2>
                  <p id="out-courses" className="pre-line">
                    {cvData.courses.trim()}
                  </p>
                </section>
              )}
            </main>
          </article>
        ) : (
          /* ==========================================
             SINGLE-COLUMN STYLES (STANDARD, MODERN, CLASSIC)
             ========================================== */
          <article
            id="cv-preview"
            className={`cv-page cv-style-${cvStyle}`}
            aria-label="CV preview"
          >
            <header className="cv-header">
              {cvData.photo && (
                <img
                  id="out-photo"
                  className="cv-photo"
                  src={cvData.photo}
                  alt="Portrett"
                />
              )}
              <div className="cv-identity">
                <h1 id="out-name">
                  {cvData.name?.trim() || cvLabels.namePlaceholder}
                </h1>
                {cvData.title?.trim() && (
                  <p id="out-title" className="cv-role">
                    {cvData.title.trim()}
                  </p>
                )}
                {contactItems.length > 0 && (
                  <div id="out-contacts" className="cv-contacts">
                    {contactItems.map((c, i) => (
                      <span key={i} className="contact-item">
                        {c.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {cvData.summary?.trim() && (
              <section id="doc-sec-summary" className="cv-section">
                <h2 id="doc-hdr-summary">{cvLabels.summary}</h2>
                <p id="out-summary" className="pre-line">
                  {cvData.summary.trim()}
                </p>
              </section>
            )}

            {activeExp.length > 0 && (
              <section id="doc-sec-exp" className="cv-section">
                <h2 id="doc-hdr-exp">{cvLabels.experience}</h2>
                <div id="out-list-exp" className="cv-list">
                  {activeExp.map((item, idx) => (
                    <article key={idx} className="cv-entry">
                      <div className="cv-entry-head">
                        <div className="cv-entry-title">
                          {item.role?.trim() || item.company?.trim()}
                          {item.role?.trim() && item.company?.trim() && (
                            <span className="cv-entry-org">
                              {" "}
                              · {item.company.trim()}
                            </span>
                          )}
                        </div>
                        {item.period?.trim() && (
                          <span className="cv-entry-period">
                            {item.period.trim()}
                          </span>
                        )}
                      </div>
                      {item.description?.trim() && (
                        <p className="cv-entry-description pre-line">
                          {item.description.trim()}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeEdu.length > 0 && (
              <section id="doc-sec-edu" className="cv-section">
                <h2 id="doc-hdr-edu">{cvLabels.education}</h2>
                <div id="out-list-edu" className="cv-list">
                  {activeEdu.map((item, idx) => (
                    <article key={idx} className="cv-entry">
                      <div className="cv-entry-head">
                        <div className="cv-entry-title">
                          {item.degree?.trim() || item.institution?.trim()}
                          {item.degree?.trim() && item.institution?.trim() && (
                            <span className="cv-entry-org">
                              {" "}
                              · {item.institution.trim()}
                            </span>
                          )}
                        </div>
                        {item.period?.trim() && (
                          <span className="cv-entry-period">
                            {item.period.trim()}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {cvData.certifications?.trim() && (
              <section id="doc-sec-cert" className="cv-section">
                <h2 id="doc-hdr-cert">{cvLabels.certifications}</h2>
                <p id="out-cert" className="pre-line">
                  {cvData.certifications.trim()}
                </p>
              </section>
            )}

            {cvData.otherExperience?.trim() && (
              <section id="doc-sec-other" className="cv-section">
                <h2 id="doc-hdr-other">{cvLabels.otherExperience}</h2>
                <p id="out-other" className="pre-line">
                  {cvData.otherExperience.trim()}
                </p>
              </section>
            )}

            {cvData.courses?.trim() && (
              <section id="doc-sec-courses" className="cv-section">
                <h2 id="doc-hdr-courses">{cvLabels.courses}</h2>
                <p id="out-courses" className="pre-line">
                  {cvData.courses.trim()}
                </p>
              </section>
            )}

            {(cvData.languages?.trim() || cvData.itSkills?.trim()) && (
              <div className="cv-two-column">
                {cvData.languages?.trim() && (
                  <section id="doc-sec-lang" className="cv-section">
                    <h2 id="doc-hdr-lang">{cvLabels.languages}</h2>
                    <p id="out-lang" className="pre-line">
                      {cvData.languages.trim()}
                    </p>
                  </section>
                )}
                {cvData.itSkills?.trim() && (
                  <section id="doc-sec-it" className="cv-section">
                    <h2 id="doc-hdr-it">{cvLabels.itSkills}</h2>
                    <p id="out-it" className="pre-line">
                      {cvData.itSkills.trim()}
                    </p>
                  </section>
                )}
              </div>
            )}

            {cvData.interests?.trim() && (
              <section id="doc-sec-interests" className="cv-section">
                <h2 id="doc-hdr-interests">{cvLabels.interests}</h2>
                <p id="out-interests">{cvData.interests.trim()}</p>
              </section>
            )}

            {refText && (
              <section id="doc-sec-ref" className="cv-section">
                <h2 id="doc-hdr-ref">{cvLabels.references}</h2>
                <p id="out-ref" className="pre-line">
                  {refText}
                </p>
              </section>
            )}
          </article>
        )}
      </div>
    </section>
  );
}
