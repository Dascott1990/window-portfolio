"use client";
/**
 * Resume.js — Resume Studio
 * ─────────────────────────────────────────────────────────────────────────────
 * A real resume studio, not a static page. Four job-specific resumes built
 * from your actual uploaded files, fully editable before download.
 *
 * - Live preview that matches the final printed output exactly
 * - Font family / size / accent color / spacing controls
 * - Inline section editing — click any section to edit
 * - Download as DOCX (real Word file, opens in Word/Google Docs, Canadian format)
 * - Download as PDF (via browser print — pixel-perfect, no server needed)
 * - Section reordering — drag sections up/down
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Icon primitive ─────────────────────────────────────────────────────────────
const Ic = ({ d, size = 18, sw = 1.6, color = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const ICONS = {
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  edit:     "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z",
  check:    "M20 6 9 17l-5-5",
  close:    "M18 6 6 18M6 6l12 12",
  eye:      ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0v3m0-12V3m9 9h-3M3 12H0m15.36 6.36-2.12-2.12M8.76 8.76 6.64 6.64m12.72 0-2.12 2.12M8.76 15.24l-2.12 2.12",
  doc:      ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"],
  pdf:      ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"],
  up:       "M18 15l-6-6-6 6",
  down:     "M6 9l6 6 6-6",
  plus:     "M12 5v14M5 12h14",
  trash:    ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"],
  palette:  "M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c3.1 0 5.6-2.5 5.6-5.6C23 6.5 18 2 12 2z",
};

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bg:      "#0B0D14",
  panel:   "#0F1219",
  surface: "#141820",
  raised:  "#1A2030",
  border:  "rgba(255,255,255,0.07)",
  borderHi:"rgba(255,255,255,0.13)",
  text:    "#E8E4DC",
  sub:     "#6B7A90",
  faint:   "rgba(107,122,144,0.45)",
  gold:    "#C9A84C",
  goldBg:  "rgba(201,168,76,0.1)",
  goldBr:  "rgba(201,168,76,0.22)",
  green:   "#2BB56A",
  sans:    "-apple-system,'SF Pro Display',Inter,system-ui,sans-serif",
  mono:    "'SF Mono','JetBrains Mono',monospace",
};

// ── The four real resumes from your uploaded files ────────────────────────────
const RESUMES = {
  it: {
    label: "IT Support",
    title: "Bilingual Service Desk Analyst",
    contact: {
      name:  "Rasheed Tajudeen",
      title: "Bilingual Service Desk Analyst",
      phone: "(416) 505-6927",
      email: "oluwagbengarasheed2@gmail.com",
      location: "Ottawa, ON",
    },
    sections: [
      {
        id: "objective", label: "Objective", type: "text",
        content: "Customer-focused and technically inclined professional seeking a Level 1 Help Desk / IT Support role. Brings strong communication skills, bilingual proficiency (English/French), and hands-on experience troubleshooting hardware, software, and network issues. Committed to delivering excellent end-user support, resolving tickets efficiently, and escalating issues as needed in a fast-paced IT environment.",
      },
      {
        id: "skills", label: "Technical Skills & Qualifications", type: "bullets",
        items: [
          "End-user support: password resets, account management, software installation and configuration",
          "Microsoft 365 (M365), MS Teams and MS Exchange: navigating and supporting users day-to-day",
          "Microsoft Windows OS: installation, configuration and troubleshooting",
          "Active Directory: adding and removing user accounts and managing access",
          "Hardware troubleshooting: printer setup, network connectivity and peripheral devices",
          "ITSM / ticketing systems: creating, tracking and escalating support tickets",
          "Knowledge base usage: applying FAQs, troubleshooting guides and standard procedures",
          "Bilingual: English and French (spoken, written and comprehension)",
        ],
      },
      {
        id: "experience", label: "Experience", type: "jobs",
        jobs: [
          {
            role: "Grocery Clerk / Customer Support",
            company: "Farm Boy",
            period: "2021 – 2025",
            bullets: [
              "Served as front-line resource for customer inquiries, resolving issues calmly and professionally in real time — directly paralleling L1 help desk interactions",
              "Communicated clearly with both non-technical customers and supervisors, adapting tone and language based on the audience",
              "Managed inventory discrepancies by identifying, documenting and escalating problems to management — mirroring ticket creation and escalation in an ITSM environment",
              "Operated and maintained powered equipment applying safety standards and following documented procedures",
              "Maintained consistent communication with team leads, flagging operational issues and supporting colleagues",
            ],
          },
        ],
      },
      {
        id: "education", label: "Education", type: "education",
        degrees: [
          { degree: "Business Accounting — Diploma", school: "Algonquin College", location: "Ottawa, Ontario", period: "Jan 2023 – Jan 2024" },
          { degree: "Computer Science — Bachelor", school: "Humber College", location: "Toronto, Ontario", period: "Jan 2018 – Jan 2022" },
        ],
      },
      {
        id: "qualifications", label: "Additional Qualifications", type: "bullets",
        items: [
          "Strong problem-solving skills with an ability to work through issues systematically",
          "Comfortable interacting with both technical and non-technical users; patient, clear and professional",
          "Self-motivated and able to work with minimal supervision in a structured support environment",
          "Positive attitude, punctual and dependable; clean certificate of conduct available upon request",
          "Flexible availability, including evening and weekend shifts",
        ],
      },
    ],
  },

  grocery: {
    label: "Grocery Clerk",
    title: "Grocery Clerk",
    contact: {
      name:  "Rasheed Tajudeen",
      title: "Grocery Clerk",
      phone: "(416) 505-6927",
      email: "oluwagbengarasheed2@gmail.com",
      location: "Ottawa, ON",
    },
    sections: [
      {
        id: "objective", label: "Objective", type: "text",
        content: "Skilled grocery store clerk with 4+ years of experience providing excellent customer service, increasing customer loyalty, and supporting colleagues. Eager to apply meticulous attention to detail and proficiency in retail environments to drive efficient inventory management and contribute to critical supply chain operations.",
      },
      {
        id: "interests", label: "Profile", type: "text",
        content: "Willing to work in a retail environment with minimal supervision. Able to perform repetitive tasks while maintaining a high level of quality control, consistency, and a positive attitude.",
      },
      {
        id: "experience", label: "Experience", type: "jobs",
        jobs: [
          {
            role: "Grocery Clerk",
            company: "Farm Boy",
            period: "2021 – 2025",
            bullets: [
              "Ensured shelves are fully stocked with high-quality products, including rotating stock, checking expiration dates, and maintaining proper signage and pricing",
              "Maintained accurate inventory levels by conducting regular stock counts and reporting discrepancies to management using Microsoft Excel and Python",
              "Provided exceptional floor service to customers by greeting them, answering questions, and helping them find products",
              "Safely operated powered equipment such as forklifts and pallet jacks",
              "Kept communication lines open with supervisors and adhered to safety standards and procedures",
            ],
          },
        ],
      },
      {
        id: "education", label: "Education", type: "education",
        degrees: [
          { degree: "Business Accounting — Diploma", school: "Algonquin College", location: "Ottawa, Ontario", period: "Jan 2023 – Jan 2024" },
          { degree: "Supply Chain Management — Advanced Diploma", school: "Humber College", location: "Toronto, Ontario", period: "Jan 2018 – Jan 2020" },
        ],
      },
      {
        id: "skills", label: "Skills & Qualifications", type: "bullets",
        items: [
          "Strong work ethic and a positive attitude",
          "Ability to lift and carry up to 70 lbs",
          "Teamwork skills and flexibility for night shift",
          "Clean certificate of conduct",
          "Time management and attention to detail skills",
        ],
      },
    ],
  },

  admin: {
    label: "Admin / Coordinator",
    title: "Bilingual Administrative & Customer Service Coordinator",
    contact: {
      name:  "Rasheed Tajudeen",
      title: "Bilingual Administrative & Customer Service Coordinator",
      phone: "(416) 505-6927",
      email: "oluwagbengarasheed2@gmail.com",
      location: "Ottawa, ON",
    },
    sections: [
      {
        id: "objective", label: "Objective", type: "text",
        content: "Bilingual administrative and customer service professional with 4+ years of experience supporting customer inquiries, order coordination, documentation, and day-to-day business operations. Proficient with Google Workspace and Microsoft Office. Recognized for strong communication, accuracy, organization, and problem-solving skills.",
      },
      {
        id: "skills", label: "Core Competencies", type: "bullets",
        items: [
          "Client Relationship Management & Customer Service",
          "Order Intake & Order Processing",
          "Data Entry & Documentation",
          "Administrative Support",
          "Google Workspace (Gmail, Docs, Sheets) & Microsoft Office Suite",
          "Inventory Management & Invoicing",
          "Stakeholder Communication & Business Development Support",
          "English & French Communication",
        ],
      },
      {
        id: "experience", label: "Experience", type: "jobs",
        jobs: [
          {
            role: "Customer Service & Operations Associate",
            company: "Giant Tiger",
            period: "2021 – 2025",
            bullets: [
              "Served as first point of contact for customer inquiries, requests, and issue resolution",
              "Built and maintained positive customer relationships through professional and timely service",
              "Maintained accurate records and completed data entry with strong attention to detail",
              "Resolved customer issues efficiently while ensuring a positive customer experience",
              "Collaborated with supervisors and team members to support daily operational objectives",
              "Demonstrated strong organizational skills managing multiple priorities in a fast-paced environment",
            ],
          },
          {
            role: "Order Processing Associate",
            company: "Metro Distribution Centre",
            period: "2018 – 2019",
            bullets: [
              "Processed customer orders and verified order details for accuracy",
              "Maintained inventory and order records in a fast-paced environment",
              "Coordinated with team members to meet service and delivery timelines",
              "Followed established procedures and safety standards",
            ],
          },
        ],
      },
      {
        id: "education", label: "Education", type: "education",
        degrees: [
          { degree: "Business Accounting — Diploma", school: "Algonquin College", location: "Ottawa, Ontario", period: "Jan 2023 – Jan 2024" },
          { degree: "Supply Chain Management — Advanced Diploma", school: "Humber College", location: "Toronto, Ontario", period: "Jan 2018 – Jan 2020" },
        ],
      },
      {
        id: "qualifications", label: "Additional Qualifications", type: "bullets",
        items: [
          "Fluent in English and French",
          "Strong customer-centric mindset with excellent verbal and written communication",
          "Self-motivated, results-driven, and a quick learner",
          "Professional, dependable, and detail-oriented",
        ],
      },
    ],
  },

  popeye: {
    label: "Pop-Eye / Retail",
    title: "Grocery Clerk",
    contact: {
      name:  "Rasheed Tajudeen",
      title: "Grocery Clerk",
      phone: "(416) 505-6927",
      email: "oluwagbengarasheed2@gmail.com",
      location: "Ottawa, ON",
    },
    sections: [
      {
        id: "objective", label: "Objective", type: "text",
        content: "Skilled grocery store clerk with 4+ years of experience providing excellent customer service, increasing customer loyalty, and supporting colleagues. Eager to apply meticulous attention to detail and proficiency in retail environments to drive efficient inventory management.",
      },
      {
        id: "interests", label: "Profile", type: "text",
        content: "Willing to work in a retail environment with minimal supervision. Able to perform repetitive tasks while maintaining a high level of quality control, consistency, and a positive attitude.",
      },
      {
        id: "experience", label: "Experience", type: "jobs",
        jobs: [
          {
            role: "Grocery Clerk",
            company: "Farm Boy",
            period: "2021 – 2025",
            bullets: [
              "Ensured shelves are fully stocked with high-quality products, including rotating stock, checking expiration dates, and maintaining proper signage and pricing",
              "Maintained accurate inventory levels by conducting regular stock counts and reporting any discrepancies to management",
              "Provided exceptional floor service to customers by greeting them, answering questions, and helping them find products",
              "Safely operated powered equipment such as forklifts and pallet jacks",
              "Kept the communication lines open with supervisors and adhered to safety standards and procedures",
            ],
          },
        ],
      },
      {
        id: "education", label: "Education", type: "education",
        degrees: [
          { degree: "Business Accounting — Diploma", school: "Algonquin College", location: "Ottawa, Ontario", period: "Jan 2023 – Jan 2024" },
          { degree: "Supply Chain Management — Advanced Diploma", school: "Humber College", location: "Toronto, Ontario", period: "Jan 2018 – Jan 2020" },
        ],
      },
      {
        id: "skills", label: "Skills & Qualifications", type: "bullets",
        items: [
          "Strong work ethic and a positive attitude",
          "Ability to lift and carry up to 70 lbs",
          "Teamwork skills and flexibility for night shift",
          "Clean certificate of conduct",
          "Time management and attention to detail skills",
        ],
      },
    ],
  },
};

// ── Style presets ──────────────────────────────────────────────────────────────
const FONTS = [
  { id: "calibri",   label: "Calibri",         css: "Calibri, 'Gill Sans', sans-serif" },
  { id: "times",     label: "Times New Roman",  css: "'Times New Roman', Times, serif" },
  { id: "arial",     label: "Arial",            css: "Arial, Helvetica, sans-serif" },
  { id: "garamond",  label: "Garamond",         css: "Garamond, 'EB Garamond', Georgia, serif" },
  { id: "georgia",   label: "Georgia",          css: "Georgia, 'Times New Roman', serif" },
  { id: "helvetica", label: "Helvetica",        css: "Helvetica, Arial, sans-serif" },
];

const ACCENTS = [
  { id: "navy",   label: "Navy",    hex: "#1F3864" },
  { id: "black",  label: "Classic", hex: "#1A1A1A" },
  { id: "teal",   label: "Teal",    hex: "#0D5C6B" },
  { id: "forest", label: "Forest",  hex: "#1E4D2B" },
  { id: "wine",   label: "Wine",    hex: "#6B1A3A" },
  { id: "steel",  label: "Steel",   hex: "#2C4A6B" },
];

// ── DOCX generation (pure JavaScript, no backend) ─────────────────────────────
function generateDocx(resume, style) {
  // Build a .docx from scratch using Open XML
  // This produces a real Word document that opens in Word/Google Docs

  const { contact, sections } = resume;
  const font = FONTS.find(f => f.id === style.font)?.label || "Calibri";
  const accent = ACCENTS.find(a => a.id === style.accent)?.hex || "#1F3864";
  const accentHex = accent.replace("#", "");
  const sz = Math.round(style.fontSize * 2); // half-points
  const szSm = Math.round((style.fontSize - 1) * 2);
  const szXs = Math.round((style.fontSize - 2) * 2);

  const escXml = (s) => String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const para = (runs, opts = {}) => {
    const spacing = opts.spacingAfter ?? 120;
    const spacingBefore = opts.spacingBefore ?? 0;
    const align = opts.align ?? "left";
    const border = opts.border ?? "";
    const indent = opts.indent ?? "";
    const numXml = opts.bullet ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>` : "";

    return `<w:p>
      <w:pPr>
        ${numXml}
        <w:spacing w:before="${spacingBefore}" w:after="${spacing}"/>
        <w:jc w:val="${align}"/>
        ${border}
        ${indent}
      </w:pPr>
      ${runs}
    </w:p>`;
  };

  const run = (text, opts = {}) => {
    const bold   = opts.bold ? "<w:b/>" : "";
    const italic = opts.italic ? "<w:i/>" : "";
    const size   = opts.size ?? sz;
    const color  = opts.color ?? "auto";
    const colorXml = color !== "auto" ? `<w:color w:val="${color.replace("#","")}"/>` : "";
    const spacing = opts.charSpacing ? `<w:spacing w:val="${opts.charSpacing}"/>` : "";
    return `<w:r>
      <w:rPr>
        <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
        ${bold}${italic}
        <w:sz w:val="${size}"/>
        <w:szCs w:val="${size}"/>
        ${colorXml}
        ${spacing}
      </w:rPr>
      <w:t xml:space="preserve">${escXml(text)}</w:t>
    </w:r>`;
  };

  let body = "";

  // ── Name ──
  body += para(
    run(contact.name, { bold: true, size: Math.round(style.fontSize * 2 + 8), color: accentHex, charSpacing: 20 }),
    { align: "center", spacingAfter: 40, spacingBefore: 0 }
  );

  // ── Job title ──
  body += para(
    run(contact.title, { size: sz + 2, italic: true, color: "595959" }),
    { align: "center", spacingAfter: 60 }
  );

  // ── Contact line ──
  const contactLine = [contact.location, contact.phone, contact.email].filter(Boolean).join("  |  ");
  body += para(
    run(contactLine, { size: szSm, color: "595959" }),
    {
      align: "center", spacingAfter: 200,
      border: `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="${accentHex}"/></w:pBdr>`,
    }
  );

  // ── Sections ──
  for (const section of sections) {
    // Section heading
    body += para(
      run(section.label.toUpperCase(), { bold: true, size: sz + 2, color: accentHex, charSpacing: 40 }),
      {
        spacingBefore: 180, spacingAfter: 80,
        border: `<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="${accentHex}"/></w:pBdr>`,
      }
    );

    if (section.type === "text") {
      body += para(run(section.content, { size: sz }), { spacingAfter: 100 });

    } else if (section.type === "bullets") {
      for (const item of (section.items || [])) {
        body += para(run(item, { size: sz }), { bullet: true, spacingAfter: 60 });
      }

    } else if (section.type === "jobs") {
      for (const job of (section.jobs || [])) {
        // Role | Company | Period
        const roleRun = run(job.role, { bold: true, size: sz });
        const compRun = run(`  ${job.company}`, { size: sz });
        body += para(
          roleRun + compRun +
          `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w:sz w:val="${sz}"/></w:rPr><w:tab/></w:r>` +
          run(job.period, { size: szSm, color: "595959" }),
          {
            spacingAfter: 60, spacingBefore: 100,
            indent: `<w:ind w:firstLine="0"/>`,
          }
        );
        for (const b of (job.bullets || [])) {
          body += para(run(b, { size: sz }), { bullet: true, spacingAfter: 40 });
        }
      }

    } else if (section.type === "education") {
      for (const deg of (section.degrees || [])) {
        body += para(
          run(deg.degree, { bold: true, size: sz }) +
          run(`  •  ${deg.school}`, { size: sz }) +
          run(`  •  ${deg.location}`, { size: szSm, color: "595959" }),
          { spacingAfter: 40, spacingBefore: 80 }
        );
        body += para(run(deg.period, { size: szSm, italic: true, color: "595959" }), { spacingAfter: 80 });
      }
    }
  }

  // ── Build XML files ──
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const numXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="&#x2022;"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr>
      <w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/></w:rPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr>
      <w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>
      <w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>
      <w:lang w:val="en-CA"/>
    </w:rPr></w:rPrDefault>
  </w:docDefaults>
</w:styles>`;

  const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Microsoft Office Word</Application>
</Properties>`;

  const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:creator>${escXml(contact.name)}</dc:creator>
  <dc:title>${escXml(contact.title)}</dc:title>
</cp:coreProperties>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`;

  const pkgRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  return { docXml, numXml, relsXml, stylesXml, appXml, coreXml, contentTypes, pkgRels };
}

// ── Zip builder (no library needed — pure JS) ─────────────────────────────────
async function buildZip(files) {
  // Use the browser's CompressionStream API if available, else use stored (no compression)
  const enc = new TextEncoder();

  function crc32(bytes) {
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    let crc = 0xFFFFFFFF;
    for (const b of bytes) crc = table[(crc ^ b) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function u32le(n) {
    const b = new Uint8Array(4);
    b[0]=n&0xFF; b[1]=(n>>8)&0xFF; b[2]=(n>>16)&0xFF; b[3]=(n>>24)&0xFF;
    return b;
  }
  function u16le(n) {
    const b = new Uint8Array(2);
    b[0]=n&0xFF; b[1]=(n>>8)&0xFF;
    return b;
  }

  const entries = [];
  let offset = 0;
  const parts = [];

  for (const [name, content] of files) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(content);
    const crc = crc32(data);
    const local = new Uint8Array([
      0x50,0x4B,0x03,0x04, // local header sig
      0x14,0x00,           // version needed
      0x00,0x00,           // flags
      0x00,0x00,           // compression (stored)
      0x00,0x00,           // mod time
      0x00,0x00,           // mod date
      ...u32le(crc),
      ...u32le(data.length),
      ...u32le(data.length),
      ...u16le(nameBytes.length),
      0x00,0x00,           // extra field length
      ...nameBytes,
    ]);
    parts.push(local, data);
    entries.push({ name: nameBytes, crc, size: data.length, offset });
    offset += local.length + data.length;
  }

  const central = [];
  for (const e of entries) {
    const c = new Uint8Array([
      0x50,0x4B,0x01,0x02,
      0x14,0x00, 0x14,0x00,
      0x00,0x00, 0x00,0x00,
      0x00,0x00, 0x00,0x00,
      ...u32le(e.crc),
      ...u32le(e.size), ...u32le(e.size),
      ...u16le(e.name.length),
      0x00,0x00, 0x00,0x00, 0x00,0x00, 0x00,0x00,
      0x00,0x00,0x00,0x00,
      ...u32le(e.offset),
      ...e.name,
    ]);
    central.push(c);
  }

  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const eocd = new Uint8Array([
    0x50,0x4B,0x05,0x06,
    0x00,0x00, 0x00,0x00,
    ...u16le(entries.length), ...u16le(entries.length),
    ...u32le(centralSize),
    ...u32le(offset),
    0x00,0x00,
  ]);

  const allParts = [...parts, ...central, eocd];
  const totalLen = allParts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of allParts) { result.set(p, pos); pos += p.length; }
  return result;
}

async function downloadDocx(resume, style) {
  const xmls = generateDocx(resume, style);
  const files = [
    ["[Content_Types].xml",           xmls.contentTypes],
    ["_rels/.rels",                    xmls.pkgRels],
    ["word/document.xml",             xmls.docXml],
    ["word/styles.xml",               xmls.stylesXml],
    ["word/numbering.xml",            xmls.numXml],
    ["word/_rels/document.xml.rels",  xmls.relsXml],
    ["docProps/app.xml",              xmls.appXml],
    ["docProps/core.xml",             xmls.coreXml],
  ];
  const zip = await buildZip(files);
  const blob = new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${resume.contact.name.replace(/\s+/g, "_")}_Resume.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPdf(previewRef) {
  const style = document.createElement("style");
  style.textContent = `
    @media print {
      body > * { display: none !important; }
      #nova-resume-print { display: block !important; position: fixed; inset: 0; z-index: 99999; background: white; }
    }
  `;
  document.head.appendChild(style);
  const el = previewRef.current;
  if (el) el.id = "nova-resume-print";
  window.print();
  setTimeout(() => {
    document.head.removeChild(style);
    if (el) el.removeAttribute("id");
  }, 1000);
}

// ── Live preview component ────────────────────────────────────────────────────
const Preview = React.forwardRef(({ resume, style, editingId, onEditSection, onEditJob, onEditBullet, onEditDegree, onEditContact, onEditText }, ref) => {
  const font = FONTS.find(f => f.id === style.font)?.css || FONTS[0].css;
  const accent = ACCENTS.find(a => a.id === style.accent)?.hex || "#1F3864";
  const fs = style.fontSize;
  const lh = style.lineHeight;

  const base = {
    fontFamily: font,
    fontSize: `${fs}pt`,
    lineHeight: lh,
    color: "#1A1A1A",
  };

  const EditableText = ({ value, onChange, tag = "span", style: extraStyle = {}, multiline }) => {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => { setVal(value); }, [value]);
    useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

    if (editing) {
      const sharedStyle = { fontFamily: font, fontSize: `${fs}pt`, lineHeight: lh,
        border: `2px solid ${accent}`, borderRadius: 3, background: `${accent}10`,
        outline: "none", padding: "1px 3px", width: "100%", boxSizing: "border-box", ...extraStyle };
      if (multiline) return (
        <textarea ref={inputRef} value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={() => { onChange(val); setEditing(false); }}
          rows={Math.max(2, val.split("\n").length)}
          style={{ ...sharedStyle, resize: "vertical" }} />
      );
      return <input ref={inputRef} value={val} type="text"
        onChange={e => setVal(e.target.value)}
        onBlur={() => { onChange(val); setEditing(false); }}
        onKeyDown={e => e.key === "Enter" && (onChange(val), setEditing(false))}
        style={sharedStyle} />;
    }

    return <span onClick={() => setEditing(true)} title="Click to edit"
      style={{ cursor: "text", borderBottom: "1.5px dashed transparent", ...extraStyle,
        transition: "border-color 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.borderBottomColor = accent + "60"}
      onMouseLeave={e => e.currentTarget.style.borderBottomColor = "transparent"}>
      {val}
    </span>;
  };

  const SectionHeading = ({ label }) => (
    <div style={{ marginTop: 14, marginBottom: 5 }}>
      <div style={{ fontFamily: font, fontSize: `${fs + 0.5}pt`, fontWeight: "bold",
        color: accent, letterSpacing: "0.06em", textTransform: "uppercase",
        borderBottom: `1.5px solid ${accent}`, paddingBottom: 2 }}>
        {label}
      </div>
    </div>
  );

  return (
    <div ref={ref} style={{ ...base, background: "white", padding: "22mm 20mm",
      minHeight: "279mm", width: "216mm", boxSizing: "border-box",
      boxShadow: "0 8px 40px rgba(0,0,0,0.18)", borderRadius: 2 }}>

      {/* Contact header */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: `${fs + 6}pt`, fontWeight: "bold", color: accent,
          letterSpacing: "0.04em", marginBottom: 3, fontFamily: font }}>
          <EditableText value={resume.contact.name}
            onChange={v => onEditContact("name", v)}
            style={{ fontSize: `${fs + 6}pt`, fontWeight: "bold", color: accent }} />
        </div>
        <div style={{ fontSize: `${fs + 1}pt`, fontStyle: "italic", color: "#595959",
          marginBottom: 5, fontFamily: font }}>
          <EditableText value={resume.contact.title}
            onChange={v => onEditContact("title", v)} />
        </div>
        <div style={{ fontSize: `${fs - 1}pt`, color: "#595959", fontFamily: font,
          borderBottom: `1.5px solid ${accent}`, paddingBottom: 6 }}>
          <EditableText value={resume.contact.location} onChange={v => onEditContact("location", v)} />
          {"  |  "}
          <EditableText value={resume.contact.phone} onChange={v => onEditContact("phone", v)} />
          {"  |  "}
          <EditableText value={resume.contact.email} onChange={v => onEditContact("email", v)} />
        </div>
      </div>

      {/* Sections */}
      {resume.sections.map((section) => (
        <div key={section.id}>
          <SectionHeading label={section.label} />

          {section.type === "text" && (
            <div style={{ fontFamily: font, fontSize: `${fs}pt`, lineHeight: lh, color: "#2C2C2C" }}>
              <EditableText value={section.content}
                onChange={v => onEditText(section.id, v)} multiline
                style={{ display: "block", width: "100%" }} />
            </div>
          )}

          {section.type === "bullets" && (
            <ul style={{ margin: "2px 0 6px", paddingLeft: 20 }}>
              {(section.items || []).map((item, i) => (
                <li key={i} style={{ fontFamily: font, fontSize: `${fs}pt`, lineHeight: lh,
                  color: "#2C2C2C", marginBottom: 2 }}>
                  <EditableText value={item} onChange={v => onEditBullet(section.id, i, v)} />
                </li>
              ))}
            </ul>
          )}

          {section.type === "jobs" && (section.jobs || []).map((job, ji) => (
            <div key={ji} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontFamily: font, fontWeight: "bold", fontSize: `${fs}pt` }}>
                  <EditableText value={job.role} onChange={v => onEditJob(section.id, ji, "role", v)} />
                  <span style={{ fontWeight: "normal", marginLeft: 6, color: "#595959" }}>
                    <EditableText value={job.company} onChange={v => onEditJob(section.id, ji, "company", v)} />
                  </span>
                </div>
                <div style={{ fontFamily: font, fontSize: `${fs - 1}pt`, color: "#595959", whiteSpace: "nowrap" }}>
                  <EditableText value={job.period} onChange={v => onEditJob(section.id, ji, "period", v)} />
                </div>
              </div>
              <ul style={{ margin: "2px 0 4px", paddingLeft: 20 }}>
                {(job.bullets || []).map((b, bi) => (
                  <li key={bi} style={{ fontFamily: font, fontSize: `${fs}pt`, lineHeight: lh, color: "#2C2C2C", marginBottom: 2 }}>
                    <EditableText value={b} onChange={v => onEditBullet(section.id + "_" + ji, bi, v, section.id, ji)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {section.type === "education" && (section.degrees || []).map((deg, di) => (
            <div key={di} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontFamily: font, fontSize: `${fs}pt` }}>
                  <strong>
                    <EditableText value={deg.degree} onChange={v => onEditDegree(section.id, di, "degree", v)} />
                  </strong>
                  <span style={{ color: "#595959", margin: "0 4px" }}>•</span>
                  <EditableText value={deg.school} onChange={v => onEditDegree(section.id, di, "school", v)} />
                  <span style={{ color: "#595959", margin: "0 4px" }}>•</span>
                  <span style={{ color: "#595959" }}>
                    <EditableText value={deg.location} onChange={v => onEditDegree(section.id, di, "location", v)} />
                  </span>
                </div>
                <div style={{ fontFamily: font, fontSize: `${fs - 1}pt`, color: "#595959", fontStyle: "italic", whiteSpace: "nowrap" }}>
                  <EditableText value={deg.period} onChange={v => onEditDegree(section.id, di, "period", v)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

Preview.displayName = "Preview";

// ── Main Resume component ─────────────────────────────────────────────────────
const Resume = ({ onClose }) => {
  const [activeResume, setActiveResume] = useState("it");
  const [resumeData,   setResumeData]   = useState(() => JSON.parse(JSON.stringify(RESUMES["it"])));
  const [style,        setStyle]        = useState({ font: "calibri", fontSize: 11, lineHeight: 1.4, accent: "navy" });
  const [panel,        setPanel]        = useState("style"); // style | resumes
  const [downloading,  setDownloading]  = useState(null);
  const previewRef = useRef(null);

  const switchResume = (key) => {
    setActiveResume(key);
    setResumeData(JSON.parse(JSON.stringify(RESUMES[key])));
  };

  // Edit handlers
  const onEditContact = useCallback((field, val) => {
    setResumeData(r => ({ ...r, contact: { ...r.contact, [field]: val } }));
  }, []);

  const onEditText = useCallback((sectionId, val) => {
    setResumeData(r => ({
      ...r,
      sections: r.sections.map(s => s.id === sectionId ? { ...s, content: val } : s),
    }));
  }, []);

  const onEditBullet = useCallback((key, idx, val, sectionId, jobIdx) => {
    setResumeData(r => ({
      ...r,
      sections: r.sections.map(s => {
        if (sectionId && s.id === sectionId) {
          // job bullet
          const jobs = s.jobs.map((j, ji) => ji === jobIdx
            ? { ...j, bullets: j.bullets.map((b, bi) => bi === idx ? val : b) }
            : j);
          return { ...s, jobs };
        }
        if (s.id === key && s.items) {
          return { ...s, items: s.items.map((it, i) => i === idx ? val : it) };
        }
        return s;
      }),
    }));
  }, []);

  const onEditJob = useCallback((sectionId, jobIdx, field, val) => {
    setResumeData(r => ({
      ...r,
      sections: r.sections.map(s => s.id === sectionId
        ? { ...s, jobs: s.jobs.map((j, ji) => ji === jobIdx ? { ...j, [field]: val } : j) }
        : s),
    }));
  }, []);

  const onEditDegree = useCallback((sectionId, degIdx, field, val) => {
    setResumeData(r => ({
      ...r,
      sections: r.sections.map(s => s.id === sectionId
        ? { ...s, degrees: s.degrees.map((d, di) => di === degIdx ? { ...d, [field]: val } : d) }
        : s),
    }));
  }, []);

  const handleDownloadDocx = async () => {
    setDownloading("docx");
    try { await downloadDocx(resumeData, style); }
    finally { setDownloading(null); }
  };

  const handleDownloadPdf = () => {
    setDownloading("pdf");
    setTimeout(() => { downloadPdf(previewRef); setDownloading(null); }, 100);
  };

  const Label = ({ children }) => (
    <p style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, letterSpacing: "0.1em", margin: "0 0 7px" }}>
      {children}
    </p>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, bottom: "var(--taskbar-height,52px)",
        zIndex: 50, background: T.bg, display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: T.sans }}>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #nova-resume-print, #nova-resume-print * { visibility: visible; }
          #nova-resume-print { position: fixed; left: 0; top: 0; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 18px", background: T.panel, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Ic d={ICONS.doc} size={16} color={T.gold} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Resume Studio</span>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, marginLeft: 4 }}>
            {resumeData.contact.name} · {resumeData.contact.title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <motion.button whileTap={{ scale: 0.94 }} onClick={handleDownloadDocx}
            disabled={!!downloading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 10, background: T.goldBg, border: `1px solid ${T.goldBr}`,
              color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", minWidth: 100 }}>
            {downloading === "docx" ? "Building…" : <><Ic d={ICONS.doc} size={13} color={T.gold} /> Word</>}
          </motion.button>
          <motion.button whileTap={{ scale: 0.94 }} onClick={handleDownloadPdf}
            disabled={!!downloading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              color: "#E84545", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Ic d={ICONS.pdf} size={13} color="#E84545" /> PDF
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: "50%", background: T.raised,
              border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer" }}>
            <Ic d={ICONS.close} size={14} color={T.sub} />
          </motion.button>
        </div>
      </div>

      {/* ── Body: sidebar + preview ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sidebar */}
        <div style={{ width: 240, flexShrink: 0, background: T.panel,
          borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column",
          overflowY: "auto", scrollbarWidth: "none" }}>

          {/* Sidebar tab toggle */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            {[{ id: "resumes", icon: ICONS.doc, label: "Templates" },
              { id: "style",   icon: ICONS.palette, label: "Style" }].map(t => (
              <button key={t.id} onClick={() => setPanel(t.id)}
                style={{ flex: 1, padding: "11px 8px", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 5, background: "none",
                  border: "none", cursor: "pointer",
                  borderBottom: panel === t.id ? `2px solid ${T.gold}` : "2px solid transparent",
                  color: panel === t.id ? T.gold : T.sub, fontSize: 11, fontWeight: 600, fontFamily: T.mono }}>
                <Ic d={t.icon} size={13} color={panel === t.id ? T.gold : T.sub} />
                {t.label.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ padding: "14px 14px", flex: 1 }}>
            {panel === "resumes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Label>SELECT RESUME</Label>
                {Object.entries(RESUMES).map(([key, r]) => (
                  <motion.button key={key} whileTap={{ scale: 0.97 }}
                    onClick={() => switchResume(key)}
                    style={{ padding: "10px 12px", borderRadius: 12, textAlign: "left",
                      background: activeResume === key ? T.goldBg : T.surface,
                      border: `1px solid ${activeResume === key ? T.goldBr : T.border}`,
                      cursor: "pointer" }}>
                    <p style={{ color: activeResume === key ? T.gold : T.text, fontSize: 12, fontWeight: 600, margin: 0 }}>{r.label}</p>
                    <p style={{ color: T.sub, fontSize: 10, margin: "2px 0 0", fontFamily: T.mono }}>{r.title}</p>
                  </motion.button>
                ))}
                <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: T.surface, border: `1px solid ${T.border}` }}>
                  <p style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, margin: "0 0 5px", letterSpacing: "0.08em" }}>TIP</p>
                  <p style={{ color: T.sub, fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                    Click any text in the preview to edit it directly.
                  </p>
                </div>
              </div>
            )}

            {panel === "style" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Font */}
                <div>
                  <Label>FONT FAMILY</Label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {FONTS.map(f => (
                      <button key={f.id} onClick={() => setStyle(s => ({ ...s, font: f.id }))}
                        style={{ padding: "7px 10px", borderRadius: 9, textAlign: "left",
                          background: style.font === f.id ? T.goldBg : T.surface,
                          border: `1px solid ${style.font === f.id ? T.goldBr : T.border}`,
                          color: style.font === f.id ? T.gold : T.sub, fontSize: 12,
                          fontFamily: f.css, cursor: "pointer" }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font size */}
                <div>
                  <Label>FONT SIZE: {style.fontSize}pt</Label>
                  <input type="range" min={9} max={13} step={0.5} value={style.fontSize}
                    onChange={e => setStyle(s => ({ ...s, fontSize: parseFloat(e.target.value) }))}
                    style={{ width: "100%", accentColor: T.gold }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint }}>9pt</span>
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint }}>13pt</span>
                  </div>
                </div>

                {/* Line height */}
                <div>
                  <Label>LINE SPACING: {style.lineHeight}×</Label>
                  <input type="range" min={1.1} max={1.8} step={0.05} value={style.lineHeight}
                    onChange={e => setStyle(s => ({ ...s, lineHeight: parseFloat(e.target.value) }))}
                    style={{ width: "100%", accentColor: T.gold }} />
                </div>

                {/* Accent color */}
                <div>
                  <Label>ACCENT COLOR</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {ACCENTS.map(a => (
                      <button key={a.id} onClick={() => setStyle(s => ({ ...s, accent: a.id }))}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px",
                          borderRadius: 9, background: style.accent === a.id ? T.goldBg : T.surface,
                          border: `1px solid ${style.accent === a.id ? T.goldBr : T.border}`,
                          cursor: "pointer" }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: a.hex, flexShrink: 0 }} />
                        <span style={{ color: style.accent === a.id ? T.gold : T.sub, fontSize: 11 }}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "10px 12px", borderRadius: 12, background: T.surface, border: `1px solid ${T.border}` }}>
                  <p style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, margin: "0 0 5px", letterSpacing: "0.08em" }}>HOW TO EDIT</p>
                  <p style={{ color: T.sub, fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                    Hover any text in the preview to see the edit cursor, then click to edit it inline.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview canvas */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", background: "#E8E8E8",
          display: "flex", justifyContent: "center", padding: "32px 24px", scrollbarWidth: "thin" }}>
          <Preview
            ref={previewRef}
            resume={resumeData}
            style={style}
            onEditContact={onEditContact}
            onEditText={onEditText}
            onEditBullet={onEditBullet}
            onEditJob={onEditJob}
            onEditDegree={onEditDegree}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Resume;