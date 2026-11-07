import React from "react";
import { Upload, Trash2 } from "lucide-react";

export function PersonalSection({ cvData, setCvData, t }) {
  const handleChange = (field, value) => {
    setCvData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleChange("photo", event.target?.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    handleChange("photo", "");
  };

  return (
    <section className="form-section" aria-labelledby="personal-heading">
      <div className="section-heading">
        <span className="section-number" aria-hidden="true">
          01
        </span>
        <div>
          <h3 id="personal-heading">{t("personal")}</h3>
          <p>{t("personalHint")}</p>
        </div>
      </div>

      <div className="photo-control">
        <div className="photo-copy">
          <label htmlFor="in-photo">{t("photo")}</label>
          <span>{t("photoHint")}</span>
        </div>
        <div className="photo-actions">
          <label className="secondary-button file-button" htmlFor="in-photo">
            <Upload size={16} aria-hidden="true" />
            <span>{t("choosePhoto")}</span>
          </label>
          <input
            id="in-photo"
            className="visually-hidden"
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
          {cvData.photo && (
            <button
              id="btn-remove-photo"
              type="button"
              className="text-button danger"
              onClick={handleRemovePhoto}
            >
              <Trash2 size={15} aria-hidden="true" />
              <span>{t("remove")}</span>
            </button>
          )}
        </div>
      </div>

      <div className="form-grid">
        <label className="field field-wide" htmlFor="in-name">
          <span>{t("fullName")}</span>
          <input
            id="in-name"
            type="text"
            autoComplete="name"
            placeholder={t("fullNamePlaceholder")}
            value={cvData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </label>

        <label className="field field-wide" htmlFor="in-title">
          <span>{t("targetRole")}</span>
          <input
            id="in-title"
            type="text"
            autoComplete="organization-title"
            placeholder={t("targetRolePlaceholder")}
            value={cvData.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </label>

        <label className="field" htmlFor="in-birth">
          <span>{t("birthDate")}</span>
          <input
            id="in-birth"
            type="text"
            inputMode="numeric"
            placeholder={t("birthPlaceholder")}
            value={cvData.birth || ""}
            onChange={(e) => handleChange("birth", e.target.value)}
          />
        </label>

        <label className="field" htmlFor="in-license">
          <span>{t("license")}</span>
          <input
            id="in-license"
            type="text"
            placeholder={t("licensePlaceholder")}
            value={cvData.license || ""}
            onChange={(e) => handleChange("license", e.target.value)}
          />
        </label>

        <label className="field" htmlFor="in-email">
          <span>{t("email")}</span>
          <input
            id="in-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={cvData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </label>

        <label className="field" htmlFor="in-phone">
          <span>{t("phone")}</span>
          <input
            id="in-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+47 000 00 000"
            value={cvData.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </label>

        <label className="field field-wide" htmlFor="in-address">
          <span>{t("address")}</span>
          <input
            id="in-address"
            type="text"
            autoComplete="street-address"
            placeholder={t("addressPlaceholder")}
            value={cvData.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </label>

        <label className="field field-wide" htmlFor="in-links">
          <span>{t("links")}</span>
          <input
            id="in-links"
            type="text"
            placeholder={t("linksPlaceholder")}
            value={cvData.links || ""}
            onChange={(e) => handleChange("links", e.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
