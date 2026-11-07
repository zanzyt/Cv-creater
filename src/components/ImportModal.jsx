import React, { useState, useEffect } from "react";
import { X, Upload, FileText, ChevronRight, Check, Play, Sparkles } from "lucide-react";
import {
  extractTextFromFile,
  parseResumeTextLocally,
  parseResumeWithAI,
  normalizeJsonCv
} from "../parser.js";

export function ImportModal({ isOpen, onClose, onApplyData, t }) {
  const [tab, setTab] = useState("file");
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("cv_gemini_api_key") || ""
  );
  const [model, setModel] = useState(
    () => localStorage.getItem("cv_gemini_model") || "gemini-3.8-flash"
  );
  const [baseUrl, setBaseUrl] = useState(
    () => localStorage.getItem("cv_gemini_baseurl") || ""
  );
  const [showVideoGuide, setShowVideoGuide] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [loaderState, setLoaderState] = useState({
    percent: 0,
    text: "",
    counter: ""
  });

  const [step, setStep] = useState("input"); // 'input' | 'review'
  const [pendingData, setPendingData] = useState(null);
  const [applyMode, setApplyMode] = useState("replace"); // 'replace' | 'merge'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleParse = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    if (apiKey) localStorage.setItem("cv_gemini_api_key", apiKey.trim());
    if (model) localStorage.setItem("cv_gemini_model", model);
    if (baseUrl) localStorage.setItem("cv_gemini_baseurl", baseUrl.trim());

    setLoaderState({
      percent: 25,
      text: t("loadingStepRead"),
      counter: ""
    });

    try {
      let rawText = "";
      let parsed = null;

      if (tab === "file") {
        if (!selectedFile) throw new Error(t("extractError"));
        const extracted = await extractTextFromFile(selectedFile);
        if (extracted.type === "json") {
          parsed = normalizeJsonCv(extracted.data);
        } else {
          rawText = extracted.text;
        }
      } else {
        rawText = pastedText.trim();
        if (!rawText) throw new Error(t("extractError"));
      }

      if (!parsed) {
        if (apiKey.trim()) {
          try {
            setLoaderState({
              percent: 50,
              text: `${t("loadingStepAi")} (${model})`,
              counter: ""
            });

            const aiResult = await parseResumeWithAI(rawText, apiKey, {
              model,
              baseUrl,
              onProgress: ({ model: m }) => {
                setLoaderState({
                  percent: 65,
                  text: `${t("loadingStepAi")} (${m})`,
                  counter: m
                });
              }
            });

            parsed = aiResult.data || aiResult;
          } catch (aiErr) {
            console.warn("AI parse failed, falling back to heuristic parser:", aiErr);
            setLoaderState({
              percent: 75,
              text: t("loadingStepDone"),
              counter: ""
            });
            parsed = parseResumeTextLocally(rawText);
          }
        } else {
          setLoaderState({
            percent: 75,
            text: t("loadingStepDone"),
            counter: ""
          });
          parsed = parseResumeTextLocally(rawText);
        }
      }

      setLoaderState({ percent: 100, text: t("extractSuccess"), counter: "" });
      setPendingData(parsed);
      setStep("review");
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message || t("extractError")
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!pendingData) return;
    onApplyData(pendingData, applyMode);
    onClose();
  };

  return (
    <div
      id="modal-import"
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-import-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-window">
        <div className="modal-header">
          <div>
            <h2 id="modal-import-title">{t("importModalTitle")}</h2>
            <p className="modal-subtitle">{t("importModalSubtitle")}</p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Lukk"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {step === "input" ? (
          <div className="modal-step">
            <div className="modal-tabs" role="tablist">
              <button
                type="button"
                className={`tab-btn ${tab === "file" ? "active" : ""}`}
                onClick={() => setTab("file")}
              >
                {t("tabFile")}
              </button>
              <button
                type="button"
                className={`tab-btn ${tab === "paste" ? "active" : ""}`}
                onClick={() => setTab("paste")}
              >
                {t("tabPaste")}
              </button>
            </div>

            {tab === "file" ? (
              <div className="tab-panel">
                <div
                  className={`dropzone ${isDragOver ? "dragover" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  <FileText className="dropzone-icon" aria-hidden="true" />
                  <p className="dropzone-title">{t("dropzoneTitle")}</p>
                  <span className="dropzone-or">{t("dropzoneOr")}</span>
                  <label htmlFor="import-file-input" className="secondary-button dropzone-btn">
                    {t("selectFile")}
                  </label>
                  <input
                    type="file"
                    id="import-file-input"
                    className="visually-hidden"
                    accept=".docx,.pdf,.json,.txt,.md"
                    onChange={handleFileSelect}
                  />
                  <p className="dropzone-hint">{t("supportedFormats")}</p>
                </div>

                {selectedFile && (
                  <div className="selected-file-banner">
                    <div className="file-info">
                      <FileText size={20} aria-hidden="true" />
                      <div>
                        <strong>{selectedFile.name}</strong>
                        <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-button danger"
                      onClick={() => setSelectedFile(null)}
                      aria-label="Fjern fil"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="tab-panel">
                <textarea
                  className="modal-textarea"
                  rows={8}
                  placeholder={t("pastePlaceholder")}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
              </div>
            )}

            <details className="ai-details">
              <summary className="ai-summary">
                <Sparkles size={17} className="sparkle-star" aria-hidden="true" />
                <span>{t("aiEnhanceTitle")}</span>
              </summary>
              <div className="ai-body">
                <p className="ai-hint">{t("aiEnhanceHint")}</p>
                <input
                  type="password"
                  className="text-input"
                  placeholder={t("apiKeyPlaceholder")}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <div className="ai-settings-row">
                  <details className="ai-advanced-details">
                    <summary className="ai-advanced-summary">
                      <ChevronRight size={13} aria-hidden="true" />
                      <span>{t("advancedSettings")}</span>
                    </summary>
                    <div className="form-grid ai-config-grid">
                      <label className="field compact-field">
                        <span className="field-label-sm">{t("modelLabel")}</span>
                        <select
                          className="select-input-sm"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                        >
                          <option value="gemini-3.8-flash">
                            {t("modelOptionFlash")}
                          </option>
                          <option value="gemini-3.5-flash-lite">
                            {t("modelOptionFlashLite")}
                          </option>
                        </select>
                      </label>
                      <label className="field compact-field">
                        <span className="field-label-sm">{t("baseUrlLabel")}</span>
                        <input
                          type="text"
                          className="text-input-sm"
                          placeholder={t("baseUrlPlaceholder")}
                          value={baseUrl}
                          onChange={(e) => setBaseUrl(e.target.value)}
                        />
                      </label>
                    </div>
                  </details>

                  <button
                    type="button"
                    className="btn-guide-toggle"
                    onClick={() => setShowVideoGuide((v) => !v)}
                  >
                    <Play size={12} aria-hidden="true" />
                    <span>{showVideoGuide ? t("closeVideo") : t("howToGetApiKey")}</span>
                  </button>
                </div>

                {showVideoGuide && (
                  <div className="api-video-guide-card">
                    <div className="video-player-frame">
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        src="./how-to-gemini-key.mp4"
                        className="guide-video-element"
                      />
                    </div>
                    <div className="video-credit-footer">
                      <div className="video-credit-source">
                        <span>{t("videoCredit")}:</span>{" "}
                        <a
                          href="https://www.youtube.com/@Geekrar"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="credit-link author-link"
                        >
                          GEEKrar ↗
                        </a>
                      </div>
                      <div className="video-credit-cta">
                        <span className="free-quota-text">
                          {t("noCreditCardNeeded")}
                        </span>
                        <a
                          href="https://aistudio.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="credit-link studio-link"
                        >
                          {t("openAiStudio")} ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </details>

            {isLoading && (
              <div className="interactive-loader">
                <div className="loader-bar-track">
                  <div
                    className="loader-bar-fill"
                    style={{ width: `${loaderState.percent}%` }}
                  />
                </div>
                <div className="loader-step-row">
                  <div className="loader-step-info">
                    <span className="loader-spinner" />
                    <span>{loaderState.text}</span>
                  </div>
                  {loaderState.counter && (
                    <span className="loader-chip">{loaderState.counter}</span>
                  )}
                </div>
              </div>
            )}

            {statusMessage && (
              <div className={`import-status-msg ${statusMessage.type}`}>
                {statusMessage.text}
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={isLoading}
                onClick={handleParse}
              >
                <Check size={16} aria-hidden="true" />
                <span>{t("btnParse")}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-step">
            <h3 className="review-title">{t("reviewTitle")}</h3>

            <div className="review-cards">
              <div className="review-card">
                <h4 className="review-card-title">{t("personal")}</h4>
                <div className="review-card-content">
                  <p>
                    <strong>{pendingData?.name || "—"}</strong>
                  </p>
                  <p>{pendingData?.title || ""}</p>
                  <p>{[pendingData?.email, pendingData?.phone, pendingData?.address].filter(Boolean).join(" · ")}</p>
                </div>
              </div>

              <div className="review-card">
                <h4 className="review-card-title">{t("experience")}</h4>
                <div className="review-card-content">
                  {pendingData?.experience?.length ? (
                    pendingData.experience.map((exp, i) => (
                      <p key={i}>
                        <strong>{exp.role || exp.company}</strong> ({exp.period})
                      </p>
                    ))
                  ) : (
                    <p>—</p>
                  )}
                </div>
              </div>

              <div className="review-card">
                <h4 className="review-card-title">{t("education")}</h4>
                <div className="review-card-content">
                  {pendingData?.education?.length ? (
                    pendingData.education.map((edu, i) => (
                      <p key={i}>
                        <strong>{edu.degree || edu.institution}</strong> ({edu.period})
                      </p>
                    ))
                  ) : (
                    <p>—</p>
                  )}
                </div>
              </div>

              <div className="review-card">
                <h4 className="review-card-title">{t("competence")}</h4>
                <div className="review-card-content">
                  <p>{pendingData?.itSkills || pendingData?.languages || pendingData?.certifications || "—"}</p>
                </div>
              </div>
            </div>

            <div className="import-mode-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="import-mode"
                  value="replace"
                  checked={applyMode === "replace"}
                  onChange={() => setApplyMode("replace")}
                />
                <span>{t("importModeReplace")}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="import-mode"
                  value="merge"
                  checked={applyMode === "merge"}
                  onChange={() => setApplyMode("merge")}
                />
                <span>{t("importModeMerge")}</span>
              </label>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setStep("input")}
              >
                {t("back")}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleApply}
              >
                <Check size={16} aria-hidden="true" />
                <span>{t("applyImport")}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
