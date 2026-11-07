import React, { useState, useEffect, useCallback } from "react";
import { uiTranslations, cvTranslations } from "./translations.js";
import { Header } from "./components/Header.jsx";
import { PersonalSection } from "./components/PersonalSection.jsx";
import { SummarySection } from "./components/SummarySection.jsx";
import { ExperienceSection } from "./components/ExperienceSection.jsx";
import { EducationSection } from "./components/EducationSection.jsx";
import { CompetenceSection } from "./components/CompetenceSection.jsx";
import { ReferencesSection } from "./components/ReferencesSection.jsx";
import { CvPreview } from "./components/CvPreview.jsx";
import { ImportModal } from "./components/ImportModal.jsx";

const STORAGE_KEY = "cv_studio_state_v2";

const initialCvData = {
  photo: "",
  name: "",
  title: "",
  birth: "",
  license: "",
  email: "",
  phone: "",
  address: "",
  links: "",
  summary: "",
  certifications: "",
  otherExperience: "",
  courses: "",
  languages: "",
  itSkills: "",
  interests: "",
  referencesMode: "none",
  referencesCustom: ""
};

export default function App() {
  const [uiLang, setUiLang] = useState(() => {
    return localStorage.getItem("cv_ui_lang") || "nb";
  });

  const [cvLang, setCvLang] = useState(() => {
    return localStorage.getItem("cv_doc_lang") || "nb";
  });

  const [cvData, setCvData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialCvData, ...(parsed.cvData || {}) };
      }
    } catch (e) {
      console.warn("Failed to load CV state:", e);
    }
    return initialCvData;
  });

  const [experience, setExperience] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.experience) && parsed.experience.length > 0) {
          return parsed.experience;
        }
      }
    } catch (e) {}
    return [{ role: "", company: "", period: "", description: "" }];
  });

  const [education, setEducation] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.education) && parsed.education.length > 0) {
          return parsed.education;
        }
      }
    } catch (e) {}
    return [{ degree: "", institution: "", period: "" }];
  });

  const [cvStyle, setCvStyle] = useState(() => {
    return localStorage.getItem("cv_doc_style") || "standard";
  });

  const [isImportOpen, setIsImportOpen] = useState(false);

  // Sync language and style selections to localStorage & document
  useEffect(() => {
    localStorage.setItem("cv_ui_lang", uiLang);
    document.documentElement.lang = uiLang;
  }, [uiLang]);

  useEffect(() => {
    localStorage.setItem("cv_doc_lang", cvLang);
  }, [cvLang]);

  useEffect(() => {
    localStorage.setItem("cv_doc_style", cvStyle);
  }, [cvStyle]);

  // Persist CV state to localStorage
  useEffect(() => {
    try {
      const stateToSave = { cvData, experience, education };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Auto-save failed:", e);
    }
  }, [cvData, experience, education]);

  const t = useCallback(
    (key) => {
      return uiTranslations[uiLang]?.[key] ?? key;
    },
    [uiLang]
  );

  const cvLabels = cvTranslations[cvLang] || cvTranslations.nb;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const exportPayload = {
      version: "2.0",
      exportDate: new Date().toISOString(),
      ...cvData,
      experience,
      education
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const nameSlug = (cvData.name || "cv")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    a.href = url;
    a.download = `${nameSlug}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyData = (parsed, mode) => {
    if (mode === "replace") {
      setCvData({
        photo: cvData.photo, // Preserve uploaded portrait
        name: parsed.name || "",
        title: parsed.title || "",
        birth: parsed.birth || "",
        license: parsed.license || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        address: parsed.address || "",
        links: parsed.links || "",
        summary: parsed.summary || "",
        certifications: parsed.certifications || "",
        otherExperience: parsed.otherExperience || "",
        courses: parsed.courses || "",
        languages: parsed.languages || "",
        itSkills: parsed.itSkills || "",
        interests: parsed.interests || "",
        referencesMode: parsed.referencesMode || "none",
        referencesCustom: parsed.referencesCustom || ""
      });

      if (parsed.experience?.length) {
        setExperience(parsed.experience);
      }
      if (parsed.education?.length) {
        setEducation(parsed.education);
      }
    } else {
      // Merge mode
      setCvData((prev) => ({
        ...prev,
        name: prev.name || parsed.name || "",
        title: prev.title || parsed.title || "",
        birth: prev.birth || parsed.birth || "",
        license: prev.license || parsed.license || "",
        email: prev.email || parsed.email || "",
        phone: prev.phone || parsed.phone || "",
        address: prev.address || parsed.address || "",
        links: prev.links || parsed.links || "",
        summary: prev.summary || parsed.summary || "",
        certifications: prev.certifications || parsed.certifications || "",
        otherExperience: prev.otherExperience || parsed.otherExperience || "",
        courses: prev.courses || parsed.courses || "",
        languages: prev.languages || parsed.languages || "",
        itSkills: prev.itSkills || parsed.itSkills || "",
        interests: prev.interests || parsed.interests || "",
        referencesCustom: prev.referencesCustom || parsed.referencesCustom || ""
      }));

      if (parsed.experience?.length) {
        setExperience((prev) => [...prev, ...parsed.experience]);
      }
      if (parsed.education?.length) {
        setEducation((prev) => [...prev, ...parsed.education]);
      }
    }
  };

  return (
    <div className="app-root">
      <a className="skip-link no-print" href="#main-content">
        {t("skipToContent")}
      </a>

      <Header
        uiLang={uiLang}
        setUiLang={setUiLang}
        cvLang={cvLang}
        setCvLang={setCvLang}
        t={t}
        onOpenImport={() => setIsImportOpen(true)}
        onExportJson={handleExportJson}
        onPrint={handlePrint}
      />

      <main id="main-content" className="workspace">
        <aside
          id="cv-editor"
          className="editor-panel no-print"
          aria-labelledby="editor-heading"
        >
          <div className="editor-intro">
            <div>
              <p className="eyebrow">{t("editorEyebrow")}</p>
              <h2 id="editor-heading">{t("editorTitle")}</h2>
            </div>
          </div>

          <PersonalSection cvData={cvData} setCvData={setCvData} t={t} />
          <SummarySection cvData={cvData} setCvData={setCvData} t={t} />
          <ExperienceSection
            experience={experience}
            setExperience={setExperience}
            t={t}
          />
          <EducationSection
            education={education}
            setEducation={setEducation}
            t={t}
          />
          <CompetenceSection cvData={cvData} setCvData={setCvData} t={t} />
          <ReferencesSection cvData={cvData} setCvData={setCvData} t={t} />
        </aside>

        <CvPreview
          cvData={cvData}
          experience={experience}
          education={education}
          cvLabels={cvLabels}
          cvStyle={cvStyle}
          setCvStyle={setCvStyle}
          t={t}
        />
      </main>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onApplyData={handleApplyData}
        t={t}
      />
    </div>
  );
}
