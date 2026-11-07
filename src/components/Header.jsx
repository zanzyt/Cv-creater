import React from "react";
import { Upload, Download, Printer } from "lucide-react";

export function Header({
  uiLang,
  setUiLang,
  cvLang,
  setCvLang,
  t,
  onOpenImport,
  onExportJson,
  onPrint
}) {
  return (
    <header className="app-header no-print">
      <div className="header-inner">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            CV
          </div>
          <div className="brand-copy">
            <h1 id="ui-title">{t("appTitle")}</h1>
            <p className="standards-line">
              <span>{t("standard")}</span>{" "}
              <a
                href="https://utdanning.no/utdanningsvalg_artikkel_slik_skriver_du_cv"
                target="_blank"
                rel="noopener noreferrer"
              >
                Utdanning.no<span className="external-mark" aria-hidden="true">↗</span>
              </a>{" "}
              <span aria-hidden="true">&amp;</span>{" "}
              <a
                href="https://arbeidsplassen.nav.no/slik-skriver-du-en-god-cv"
                target="_blank"
                rel="noopener noreferrer"
              >
                NAV<span className="external-mark" aria-hidden="true">↗</span>
              </a>
            </p>
          </div>
        </div>

        <div className="toolbar" aria-label="Dokumentinnstillinger">
          <label className="select-control" htmlFor="sel-ui-lang">
            <span>{t("uiLanguage")}</span>
            <select
              id="sel-ui-lang"
              value={uiLang}
              onChange={(e) => setUiLang(e.target.value)}
            >
              <option value="nb">Bokmål</option>
              <option value="nn">Nynorsk</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </label>

          <label className="select-control" htmlFor="sel-cv-lang">
            <span>{t("cvLanguage")}</span>
            <select
              id="sel-cv-lang"
              value={cvLang}
              onChange={(e) => setCvLang(e.target.value)}
            >
              <option value="nb">Norsk (Bokmål)</option>
              <option value="nn">Norsk (Nynorsk)</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </label>

          <button
            type="button"
            className="toolbar-button"
            onClick={onOpenImport}
            id="btn-import-modal"
          >
            <Upload size={18} aria-hidden="true" />
            <span>{t("importCv")}</span>
          </button>

          <button
            type="button"
            className="toolbar-button"
            onClick={onExportJson}
            id="btn-export-json"
          >
            <Download size={18} aria-hidden="true" />
            <span>{t("exportJson")}</span>
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={onPrint}
            id="btn-print"
          >
            <Printer size={18} aria-hidden="true" />
            <span>{t("downloadPdf")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
