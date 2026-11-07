// assets/js/parser.js — Multi-format CV parser (Local Heuristic + AI Enhancement)

/**
 * Normalizes text extracted from files and strips PDF headers/footers
 */
function cleanText(text) {
  return text
    .replace(/^.*•\s*CV(?:\s+Side\s+\d+)?.*$/gim, "")
    .replace(/^(?:Side|Page)\s+\d+(?:\s+av|\s+of\s+\d+)?$/gim, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts raw text from File object based on type (.json, .txt, .md, .docx, .pdf)
 */
export async function extractTextFromFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();

  if (extension === "json") {
    const text = await file.text();
    return { type: "json", data: JSON.parse(text) };
  }

  if (extension === "txt" || extension === "md") {
    const text = await file.text();
    return { type: "text", text: cleanText(text) };
  }

  if (extension === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    if (window.mammoth) {
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      return { type: "text", text: cleanText(result.value) };
    }
    // Fallback: unzip word/document.xml if mammoth is not available
    const fallbackText = await extractDocxFallback(arrayBuffer);
    return { type: "text", text: cleanText(fallbackText) };
  }

  if (extension === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    if (window.pdfjsLib) {
      const text = await extractPdfText(arrayBuffer);
      return { type: "text", text: cleanText(text) };
    }
    throw new Error("PDF.js library is not loaded");
  }

  // Generic fallback for any other text-like files
  const text = await file.text();
  return { type: "text", text: cleanText(text) };
}

/**
 * Fallback DOCX text extractor via native DecompressionStream for word/document.xml
 */
async function extractDocxFallback(arrayBuffer) {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    let index = 0;
    while (index < bytes.length - 30) {
      // Local file header signature: 0x04034b50 ("PK\x03\x04")
      if (bytes[index] === 0x50 && bytes[index + 1] === 0x4b && bytes[index + 2] === 0x03 && bytes[index + 3] === 0x04) {
        const compressionMethod = bytes[index + 8] | (bytes[index + 9] << 8);
        const compressedSize = bytes[index + 18] | (bytes[index + 19] << 8) | (bytes[index + 20] << 16) | (bytes[index + 21] << 24);
        const fileNameLength = bytes[index + 26] | (bytes[index + 27] << 8);
        const extraFieldLength = bytes[index + 28] | (bytes[index + 29] << 8);

        const fileNameBytes = bytes.slice(index + 30, index + 30 + fileNameLength);
        const fileName = new TextDecoder().decode(fileNameBytes);

        const fileDataStart = index + 30 + fileNameLength + extraFieldLength;
        if (fileName === "word/document.xml") {
          const fileData = bytes.slice(fileDataStart, fileDataStart + compressedSize);
          let xmlString = "";
          if (compressionMethod === 8 && window.DecompressionStream) {
            const ds = new DecompressionStream("deflate-raw");
            const writer = ds.writable.getWriter();
            writer.write(fileData);
            writer.close();
            const decompressed = await new Response(ds.readable).arrayBuffer();
            xmlString = new TextDecoder().decode(decompressed);
          } else if (compressionMethod === 0) {
            xmlString = new TextDecoder().decode(fileData);
          }
          if (xmlString) {
            return xmlString.replace(/<w:p[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ");
          }
        }
        index = fileDataStart + compressedSize;
      } else {
        index++;
      }
    }
  } catch (err) {
    console.warn("Fallback docx extraction failed:", err);
  }
  return "";
}

/**
 * Extracts text from PDF using PDF.js
 */
async function extractPdfText(arrayBuffer) {
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageTexts = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY;
    let pageStr = "";
    for (const item of content.items) {
      if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
        pageStr += "\n";
      } else if (pageStr.length > 0 && !pageStr.endsWith(" ") && !pageStr.endsWith("\n")) {
        pageStr += " ";
      }
      pageStr += item.str;
      lastY = item.transform[5];
    }
    pageTexts.push(pageStr);
  }

  return cleanText(pageTexts.join("\n\n"));
}

/**
 * Standardizes raw imported JSON (from backup or external schema)
 */
export function normalizeJsonCv(raw) {
  // Check JSON Resume standard format (jsonresume.org) first
  if (raw && raw.basics) {
    const b = raw.basics;
    const profiles = (b.profiles || []).map(p => p.url || `${p.network}: ${p.username}`).join("\n");
    const links = [b.url, profiles].filter(Boolean).join("\n");

    return {
      name: b.name || "",
      title: b.label || "",
      birth: raw.birthDate || "",
      license: raw.license || "",
      phone: b.phone || "",
      email: b.email || "",
      address: [b.location?.city, b.location?.countryCode].filter(Boolean).join(", "),
      links,
      summary: b.summary || "",
      experience: Array.isArray(raw.work) ? raw.work.map(w => ({
        role: w.position || "",
        company: w.name || "",
        period: [w.startDate, w.endDate || "Present"].filter(Boolean).join(" — "),
        description: [w.summary, ...(w.highlights || [])].filter(Boolean).join("\n")
      })) : [{ role: "", company: "", period: "", description: "" }],
      education: Array.isArray(raw.education) ? raw.education.map(ed => ({
        degree: [ed.studyType, ed.area].filter(Boolean).join(" in "),
        institution: ed.institution || "",
        period: [ed.startDate, ed.endDate].filter(Boolean).join(" — ")
      })) : [{ degree: "", institution: "", period: "" }],
      certifications: Array.isArray(raw.certificates) ? raw.certificates.map(c => `${c.name} (${c.issuer})`).join("\n") : "",
      otherExperience: Array.isArray(raw.volunteer) ? raw.volunteer.map(v => `${v.position} at ${v.organization}`).join("\n") : "",
      courses: Array.isArray(raw.courses) ? raw.courses.join("\n") : "",
      languages: Array.isArray(raw.languages) ? raw.languages.map(l => `${l.language}: ${l.fluency}`).join("\n") : "",
      itSkills: Array.isArray(raw.skills) ? raw.skills.map(s => `${s.name}: ${(s.keywords || []).join(", ")}`).join("\n") : "",
      interests: Array.isArray(raw.interests) ? raw.interests.map(i => i.name).join(", ") : "",
      referencesMode: Array.isArray(raw.references) && raw.references.length > 0 ? "manual" : "none",
      referencesCustom: Array.isArray(raw.references) ? raw.references.map(r => `${r.name}: ${r.reference}`).join("\n") : ""
    };
  }

  // Check if it's our direct backup schema or general dictionary
  if (raw && (raw.name !== undefined || raw.fullName !== undefined || raw.experience !== undefined || raw.education !== undefined)) {
    return {
      name: raw.name || raw.fullName || "",
      title: raw.title || raw.targetRole || "",
      birth: raw.birth || raw.birthDate || "",
      license: raw.license || "",
      phone: raw.phone || "",
      email: raw.email || "",
      address: raw.address || "",
      links: raw.links || "",
      summary: raw.summary || "",
      experience: Array.isArray(raw.experience) ? raw.experience.map(e => ({
        role: e.role || e.title || e.position || "",
        company: e.company || e.organization || e.employer || "",
        period: e.period || e.date || e.years || "",
        description: e.description || e.responsibilities || e.summary || ""
      })) : [{ role: "", company: "", period: "", description: "" }],
      education: Array.isArray(raw.education) ? raw.education.map(e => ({
        degree: e.degree || e.studyType || e.program || "",
        institution: e.institution || e.school || e.university || "",
        period: e.period || e.date || e.years || ""
      })) : [{ degree: "", institution: "", period: "" }],
      certifications: raw.certifications || "",
      otherExperience: raw.otherExperience || "",
      courses: raw.courses || "",
      languages: raw.languages || "",
      itSkills: raw.itSkills || raw.skills || "",
      interests: raw.interests || "",
      referencesMode: raw.referencesMode || "none",
      referencesCustom: raw.referencesCustom || raw.referenceContacts || ""
    };
  }

  throw new Error("Неизвестный формат JSON резюме");
}

/**
 * Multilingual section keywords
 */
const SECTION_HEADERS = {
  summary: [
    "о себе", "обо мне", "профиль", "резюме", "ключевые квалификации", "профессиональное резюме", "кратко о себе",
    "sammendrag", "nøkkelkvalifikasjoner", "om meg", "profil", "profesjonell profil",
    "summary", "professional summary", "about me", "profile", "overview", "objective", "key qualifications"
  ],
  experience: [
    "опыт работы", "опыт", "трудовая деятельность", "места работы", "профессиональный опыт",
    "arbeidserfaring", "erfaring", "arbeidsforhold", "praksis", "yrkeserfaring",
    "work experience", "experience", "employment history", "professional experience", "work history"
  ],
  education: [
    "образование", "учеба", "высшее образование", "академическое образование",
    "utdanning", "utdannelse", "skolegang", "studier",
    "education", "academic background", "studies", "academic history"
  ],
  certifications: [
    "сертификаты", "дипломы", "допуски", "лицензии", "аттестаты", "дипломы и сертификаты",
    "sertifiseringer", "sertifikater", "fagbrev", "autorisasjoner", "lisenser",
    "certifications", "certificates", "licenses", "credentials"
  ],
  languagesAndCertifications: [
    "språk og sertifikater", "språk og sertifiseringer", "languages and certifications", "языки и сертификаты"
  ],
  otherExperience: [
    "другой опыт", "волонтерство", "волонтёрство", "общественная деятельность", "прочая деятельность", "проекты", "собственные проекты",
    "annet arbeid", "frivillig arbeid", "verv", "annen erfaring", "tillitsverv", "annen praktisk erfaring", "praktisk erfaring",
    "egne prosjekter", "egne prosjekter og utviklingserfaring", "prosjekter", "utviklingserfaring",
    "other experience", "volunteering", "volunteer experience", "extracurricular", "projects", "personal projects"
  ],
  courses: [
    "курсы", "тренинги", "повышение квалификации", "семинары",
    "kurs", "etterutdanning", "kurs og opplæring", "kompetansehevende kurs",
    "courses", "trainings", "workshops", "professional training"
  ],
  languages: [
    "языки", "владение языками", "иностранные языки",
    "språk", "språkkunnskaper", "språkferdigheter",
    "languages", "language proficiency", "languages spoken"
  ],
  itSkills: [
    "it-навыки", "навыки", "ключевые навыки", "технологии", "стек технологий", "инструменты", "программы", "технические навыки",
    "it-kunnskaper", "it-ferdigheter", "digitale ferdigheter", "nøkkelkompetanse", "ferdigheter", "teknologier", "teknisk kompetanse", "tekniske ferdigheter",
    "it skills", "skills", "technical skills", "technologies", "tools & technologies", "competencies", "key skills", "technical competence"
  ],
  interests: [
    "интересы", "хобби", "увлечения",
    "interesser", "fritidsinteresser", "hobbyer",
    "interests", "hobbies", "activities"
  ],
  references: [
    "рекомендации", "рекомендатели",
    "referanser",
    "references"
  ],
  links: [
    "ссылки", "профессиональные ссылки", "lenker", "links", "nettsteder"
  ]
};

/**
 * Checks if a line is likely a section header
 */
function matchSectionHeader(line) {
  const clean = line.replace(/^[#*\-•>\s]+|[#:*\-•\s]+$/g, "").trim().toLowerCase();
  if (clean.length < 2 || clean.length > 60) return null;

  for (const [sectionKey, keywords] of Object.entries(SECTION_HEADERS)) {
    for (const kw of keywords) {
      if (clean === kw || clean === `${kw}:` || clean.startsWith(`${kw} /`) || clean.endsWith(`/ ${kw}`)) {
        return sectionKey;
      }
    }
  }
  return null;
}

/**
 * Date range regex supporting months (including Norwegian and Russian) and running periods
 */
const DATE_RANGE_REGEX = /(?:(?:[a-zа-яёøæå]+[\s,]+)?(?:19|20)[0-9]{2}\s*[-–—/]\s*(?:(?:[a-zа-яёøæå]+[\s,]+)?(?:19|20)[0-9]{2}|наст(?:оящее)?\.?\s*время|present|current|today|nå|d\.d\.?|dags dato)|(?:[a-zа-яёøæå]+\s*[-–—/]\s*[a-zа-яёøæå]+\s+(?:19|20)[0-9]{2})|(?:(?:0?[1-9]|1[0-2])[./-][0-9]{4}\s*[-–—/]\s*(?:(?:0?[1-9]|1[0-2])[./-][0-9]{4}|наст|present|nå|d\.d\.?))|(?:(?:19|20)[0-9]{2}\s*[-–—/]\s*(?:(?:19|20)[0-9]{2}|наст|present|nå|d\.d\.?))|\(pågående\)|\(ongoing\))/i;

/**
 * Local Heuristic Parser for raw resume text
 */
export function parseResumeTextLocally(rawText) {
  const cleanedText = cleanText(rawText);
  const lines = cleanedText.split("\n").map(l => l.trim()).filter(Boolean);

  const parsed = {
    name: "",
    title: "",
    birth: "",
    license: "",
    phone: "",
    email: "",
    address: "",
    links: "",
    summary: "",
    experience: [],
    education: [],
    certifications: "",
    otherExperience: "",
    courses: "",
    languages: "",
    itSkills: "",
    interests: "",
    referencesMode: "none",
    referencesCustom: ""
  };

  // 1. Extract contact details via regex from entire text
  const emailMatch = cleanedText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) parsed.email = emailMatch[0];

  const phoneMatch = cleanedText.match(/(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})/);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, "").length >= 7) {
    parsed.phone = phoneMatch[0].trim();
  }

  // Two-line contact pairs (e.g. "Bosted\nSelbu, Trøndelag" or "Født\n16.09.2009")
  for (let i = 0; i < lines.length - 1; i++) {
    const l = lines[i].toLowerCase();
    const next = lines[i + 1];
    if (["bosted", "adresse", "город", "адрес", "location", "address"].includes(l) && next.length < 80) {
      if (!parsed.address) parsed.address = next;
    }
    if (["født", "дата рождения", "birth date", "date of birth", "born"].includes(l)) {
      const dm = next.match(/[0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}/);
      if (dm && !parsed.birth) parsed.birth = dm[0];
    }
    if (["førerkort", "водительской удостоверение", "водительские права", "driver license", "driving license"].includes(l)) {
      if (!parsed.license) parsed.license = next;
    }
  }

  // Single-line birth
  if (!parsed.birth) {
    const birthMatch = cleanedText.match(/(?:дата\s*рождения|fødselsdato|født|date\s*of\s*birth|born)[:\s]*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4})/i);
    if (birthMatch) parsed.birth = birthMatch[1];
  }

  // Single-line license
  if (!parsed.license) {
    const licenseMatch = cleanedText.match(/(?:водительские\s*права|førerkort|driving\s*licen[sc]e)[:\s]*([^\n,.]+)/i) ||
                         cleanedText.match(/(?:klasse|категория|category)\s*([A-Z0-9,\s+]+)/i);
    if (licenseMatch) parsed.license = licenseMatch[1].trim();
  }

  // Single-line address
  if (!parsed.address) {
    const addressMatch = cleanedText.match(/(?:город|адрес|adresse|bosted|location|address)[:\s]*([^\n,]+(?:,\s*[^\n,]+)?)/i);
    if (addressMatch) parsed.address = addressMatch[1].trim();
  }

  // Links: LinkedIn, GitHub, Telegram, portfolio (filtering out email domains like gmail.com)
  const linkMatches = cleanedText.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/[\w-]+|github\.com\/[\w-]+|t\.me\/[\w-]+|[a-zA-Z0-9-]+\.(?:com|no|org|io|dev|ru|me)(?:\/[^\s|]*)?)/gi) || [];
  const validLinks = linkMatches.filter(link => {
    const low = link.toLowerCase();
    return !low.includes("@") && !low.includes("gmail.com") && !low.includes("mail.ru") && !low.includes("outlook.com") && !low.includes("yahoo.com") && !low.includes("google.com");
  });
  parsed.links = [...new Set(validLinks)].slice(0, 3).join("\n");

  // 2. Segment text into sections
  const sections = {};
  let currentSection = "header";
  sections[currentSection] = [];

  for (const line of lines) {
    const matchedSec = matchSectionHeader(line);
    if (matchedSec) {
      currentSection = matchedSec;
      if (!sections[currentSection]) sections[currentSection] = [];
    } else {
      sections[currentSection].push(line);
    }
  }

  // 3. Extract Name & Target Role from header section
  const headerLines = (sections.header || []).filter(l => {
    const low = l.toLowerCase();
    return !low.includes("@") && !low.includes("http") && !low.includes("github") && !low.includes("linkedin") &&
           !["bosted", "telefon", "e-post", "født", "adresse", "город", "телефон"].includes(low) &&
           !l.match(/^\+?[0-9\s\-()]{7,}$/) && !l.match(/^[0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}$/);
  });

  if (headerLines.length > 0) {
    parsed.name = headerLines[0].replace(/^[#*\s]+|[#*\s]+$/g, "");
  }
  if (headerLines.length > 1) {
    parsed.title = headerLines[1].replace(/^[#*\s]+|[#*\s]+$/g, "");
  }

  // 4. Populate text sections
  if (sections.summary) parsed.summary = sections.summary.join("\n");
  if (sections.itSkills) parsed.itSkills = sections.itSkills.join("\n");
  if (sections.courses) parsed.courses = sections.courses.join("\n");
  if (sections.interests) parsed.interests = sections.interests.join("\n");
  if (sections.otherExperience) parsed.otherExperience = sections.otherExperience.join("\n");

  // Handle combined or separate languages and certifications
  if (sections.languagesAndCertifications) {
    const langLines = [];
    const certLines = [];
    sections.languagesAndCertifications.forEach(line => {
      const low = line.toLowerCase();
      if (low.includes("certificate") || low.includes("sertifikat") || low.includes("fagbrev") || low.includes("autorisasjon") || low.includes("ef set")) {
        certLines.push(line);
      } else {
        langLines.push(line);
      }
    });
    if (langLines.length > 0) parsed.languages = langLines.join("\n");
    if (certLines.length > 0) parsed.certifications = certLines.join("\n");
  } else {
    if (sections.languages) parsed.languages = sections.languages.join("\n");
    if (sections.certifications) parsed.certifications = sections.certifications.join("\n");
  }

  // Links section if present
  if (sections.links && sections.links.length > 0) {
    const sectionLinks = sections.links
      .map(l => l.replace(/^(?:github|linkedin|portfolio)[:\s]*/i, "").trim())
      .filter(l => l && !l.toLowerCase().includes("gmail.com"));
    if (sectionLinks.length > 0 && !parsed.links) {
      parsed.links = sectionLinks.join("\n");
    }
  }

  // 5. Parse Work Experience items
  if (sections.experience && sections.experience.length > 0) {
    parsed.experience = parseExperienceBlocks(sections.experience);
  }
  if (!parsed.experience || parsed.experience.length === 0) {
    parsed.experience = [{ role: "", company: "", period: "", description: "" }];
  }

  // 6. Parse Education items
  if (sections.education && sections.education.length > 0) {
    parsed.education = parseEducationBlocks(sections.education);
  }
  if (!parsed.education || parsed.education.length === 0) {
    parsed.education = [{ degree: "", institution: "", period: "" }];
  }

  // 7. References
  if (sections.references && sections.references.length > 0) {
    const refText = sections.references.join(" ").toLowerCase();
    if (refText.includes("по запросу") || refText.includes("forespørsel") || refText.includes("request")) {
      parsed.referencesMode = "request";
    } else {
      parsed.referencesMode = "manual";
      parsed.referencesCustom = sections.references.join("\n");
    }
  }

  return parsed;
}

/**
 * Splits experience lines into individual structured job entries
 */
function parseExperienceBlocks(lines) {
  const entries = [];
  let currentEntry = null;

  for (const line of lines) {
    // Check if line contains piped experience format: "Company – Role | Location | Date"
    // e.g. "Corner AB – service-/butikkmedarbeider | Morast, Värmland | mai 2025–september 2026"
    if (line.includes("|") && DATE_RANGE_REGEX.test(line)) {
      if (currentEntry) entries.push(currentEntry);
      const parts = line.split("|").map(p => p.trim());
      const leftPart = parts[0];
      const periodPart = parts.find(p => DATE_RANGE_REGEX.test(p)) || "";

      let company = "";
      let role = "";
      const dashParts = leftPart.split(/[\u2013\u2014–-]/);
      if (dashParts.length >= 2) {
        company = dashParts[0].trim();
        role = dashParts.slice(1).join(" - ").trim();
      } else {
        role = leftPart;
      }

      currentEntry = {
        role,
        company,
        period: periodPart,
        description: ""
      };
    } else if (DATE_RANGE_REGEX.test(line) && !line.includes("|")) {
      if (currentEntry) entries.push(currentEntry);
      const match = line.match(DATE_RANGE_REGEX);
      const period = match ? match[0] : "";
      const leftover = line.replace(DATE_RANGE_REGEX, "").replace(/[|•·\-,–—]/g, " ").trim();
      currentEntry = {
        role: leftover,
        company: "",
        period,
        description: ""
      };
    } else {
      if (currentEntry) {
        if (!currentEntry.company && !line.startsWith("•") && !line.startsWith("-") && line.length < 50) {
          currentEntry.company = line;
        } else {
          currentEntry.description = currentEntry.description ? `${currentEntry.description}\n${line}` : line;
        }
      }
    }
  }

  if (currentEntry) entries.push(currentEntry);
  return entries;
}

/**
 * Splits education lines into structured education entries
 */
function parseEducationBlocks(lines) {
  const entries = [];
  let currentEntry = null;

  for (const line of lines) {
    // e.g. "Selbu videregående skole — VG2 Elenergi og ekom (pågående)"
    // e.g. "Eidskog ungdomsskole — august 2022–juni 2025"
    const dashMatch = line.split(/[\u2013\u2014–—]\s*/);
    const hasDate = DATE_RANGE_REGEX.test(line);

    if (dashMatch.length >= 2) {
      if (currentEntry) entries.push(currentEntry);
      const inst = dashMatch[0].trim();
      const right = dashMatch.slice(1).join(" — ").trim();

      let period = "";
      let degree = right;
      const dateMatch = right.match(DATE_RANGE_REGEX);
      if (dateMatch) {
        period = dateMatch[0].replace(/[()]/g, "").trim();
        degree = right.replace(DATE_RANGE_REGEX, "").replace(/[()]/g, "").trim();
        if (!degree) {
          if (inst.toLowerCase().includes("ungdomsskole")) degree = "Ungdomsskole";
          else if (inst.toLowerCase().includes("videregående")) degree = "Videregående skole";
          else degree = inst;
        }
      }

      currentEntry = {
        institution: inst,
        degree: degree || inst,
        period
      };
    } else if (currentEntry && !currentEntry.period && hasDate) {
      const match = line.match(DATE_RANGE_REGEX);
      currentEntry.period = match ? match[0] : "";
    } else if (currentEntry) {
      if (!currentEntry.degree || currentEntry.degree === currentEntry.institution) {
        currentEntry.degree = line;
      }
    }
  }

  if (currentEntry) entries.push(currentEntry);
  return entries;
}

/**
 * Extracts and parses JSON from raw AI text output (supports markdown code blocks)
 */
function extractJsonFromAiResponse(rawOutput) {
  try {
    return JSON.parse(rawOutput);
  } catch (e) {
    const codeBlockMatch = rawOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }
    const braceMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      return JSON.parse(braceMatch[0].trim());
    }
    throw e;
  }
}

/**
 * Discovers available Gemini models for the user's API key via ListModels
 */
async function discoverModelEndpoints(apiKey) {
  const candidates = [];
  const cleanKey = apiKey.trim();

  // 1. Query v1beta models list
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      const valid = (listData.models || []).filter(m => m.supportedGenerationMethods?.includes("generateContent"));
      const sorted = valid.sort((a, b) => {
        const score = (m) => (m.name.includes("flash") ? 3 : m.name.includes("pro") ? 2 : 1);
        return score(b) - score(a);
      });
      for (const m of sorted) {
        candidates.push({ version: "v1beta", model: m.name.replace(/^models\//, "") });
      }
    }
  } catch (err) {
    console.warn("Failed to query v1beta models:", err);
  }

  // 2. Query v1 models list
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${cleanKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      const valid = (listData.models || []).filter(m => m.supportedGenerationMethods?.includes("generateContent"));
      for (const m of valid) {
        candidates.push({ version: "v1", model: m.name.replace(/^models\//, "") });
      }
    }
  } catch (err) {
    console.warn("Failed to query v1 models:", err);
  }

  // 3. Static fallback list if ListModels is empty or blocked
  if (candidates.length === 0) {
    candidates.push(
      { version: "v1beta", model: "gemini-3.8-flash" },
      { version: "v1beta", model: "gemini-3.5-flash-lite" },
      { version: "v1beta", model: "gemini-3-flash" },
      { version: "v1beta", model: "gemini-2.5-flash" }
    );
  }

  return candidates;
}

/**
 * Parses CV using Gemini Flash API for maximum precision on complex documents
 */
export async function parseResumeWithAI(text, apiKey, options = {}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("API key is required for AI parsing");
  }

  const cleanKey = apiKey.trim();
  const selectedModel = options.model || "gemini-3.8-flash";
  const customBaseUrl = options.baseUrl ? options.baseUrl.trim().replace(/\/+$/, "") : "";
  const onProgress = options.onProgress;

  const prompt = `You are a professional CV parser. Extract all candidate information from the text below and output strictly valid JSON matching this schema.
Do NOT include markdown formatting or explanations. Output pure JSON only.

Schema:
{
  "name": "Full name",
  "title": "Desired role or current profession",
  "birth": "Date of birth (e.g. 16.09.2009)",
  "license": "Driver license if present",
  "phone": "Phone number",
  "email": "Email address",
  "address": "Location / city / municipality",
  "links": "Links (GitHub, LinkedIn, Portfolio) separated by newlines",
  "summary": "Profile / summary paragraph",
  "experience": [
    {
      "role": "Job title / role",
      "company": "Company / employer",
      "period": "Period (e.g. mai 2025 – september 2026)",
      "description": "Responsibilities and achievements"
    }
  ],
  "education": [
    {
      "degree": "Degree or study line (e.g. VG2 Elenergi og ekom)",
      "institution": "School or university (e.g. Selbu videregående skole)",
      "period": "Period (e.g. pågående or 2022 — 2025)"
    }
  ],
  "certifications": "Certificates and authorizations (e.g. EF SET English Certificate)",
  "otherExperience": "Projects (e.g. Selvstendig programvareutvikling), volunteering, or server drift",
  "courses": "Courses separated by newlines",
  "languages": "Language skills (e.g. Norsk: Flytende, Engelsk: B2)",
  "itSkills": "IT tools, programming languages, technologies, and system skills",
  "interests": "Hobbies and leisure interests",
  "referencesMode": "none or request or manual",
  "referencesCustom": "Contact info of references if listed"
}

Resume Text:
"""
${text.slice(0, 30000)}
"""`;

  // Active models on Google AI Studio (filter out deprecated 2.0 and 1.5)
  const candidateModels = [
    selectedModel,
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3-flash",
    "gemini-2.5-flash"
  ].filter(m => m && !m.includes("2.0") && !m.includes("1.5"));
  const uniqueModels = [...new Set(candidateModels)];

  let lastError = null;
  const baseHost = customBaseUrl || "https://generativelanguage.googleapis.com";

  const configsToTry = [
    {
      temperature: 0.1,
      responseMimeType: "application/json",
      maxOutputTokens: 3500
    },
    {
      temperature: 0.1,
      maxOutputTokens: 3500
    }
  ];

  for (const model of uniqueModels) {
    onProgress?.({ stage: "connecting", model });

    for (const config of configsToTry) {
      const endpointsToTry = [
        `${baseHost}/v1beta/models/${model}:generateContent?key=${cleanKey}`,
        `${baseHost}/v1/models/${model}:generateContent?key=${cleanKey}`
      ];

      for (const endpoint of endpointsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const response = await fetch(endpoint, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": cleanKey
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: config
            })
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            const rawOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawOutput) {
              const parsedJson = extractJsonFromAiResponse(rawOutput);
              return {
                data: normalizeJsonCv(parsedJson),
                usedModel: model
              };
            }
          } else if (response.status === 400 || response.status === 404) {
            const errorData = await response.json().catch(() => ({}));
            lastError = new Error(errorData.error?.message || `HTTP ${response.status}`);
            continue;
          } else {
            const errorData = await response.json().catch(() => ({}));
            lastError = new Error(errorData.error?.message || `HTTP ${response.status}`);
          }
        } catch (err) {
          if (err.name === "AbortError") {
            lastError = new Error(`Modell ${model} svarte ikke innen 12 sekunder (tidsavbrudd)`);
          } else {
            lastError = err;
          }
        }
      }
    }

    // 3. Optional OpenAI-compatible chat/completions if using a custom gateway
    if (customBaseUrl) {
      const openAiUrl = customBaseUrl.endsWith("/chat/completions") ? customBaseUrl : `${customBaseUrl}/v1/chat/completions`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(openAiUrl, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cleanKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 3500
          })
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          const rawOutput = result.choices?.[0]?.message?.content;
          if (rawOutput) {
            const parsedJson = extractJsonFromAiResponse(rawOutput);
            return {
              data: normalizeJsonCv(parsedJson),
              usedModel: model
            };
          }
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error("AI parsing failed on all model candidates");
}
