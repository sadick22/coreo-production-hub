import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { storage } from "./lib/storage.js";

const ASSET_TYPES = [
  { id: "photos", label: "Photos", icon: "📷", short: "PHO" },
  { id: "teaser", label: "Teaser", icon: "🎬", short: "TEA" },
  { id: "overview", label: "Overview", icon: "🎥", short: "OVR" },
  { id: "brochure", label: "Brochure", icon: "📖", short: "BRO" },
  { id: "listing", label: "Listing Sheet", icon: "📄", short: "LST" },
];

const STATUSES = [
  { id: "not_started", label: "Not Started", color: "#3a3a3a", bg: "#1a1a1a" },
  { id: "brief_ready", label: "Brief Ready", color: "#6b8afd", bg: "#1a2240" },
  { id: "in_production", label: "In Production", color: "#f0a030", bg: "#2a2010" },
  { id: "in_review", label: "In Review", color: "#c084fc", bg: "#231a30" },
  { id: "approved", label: "Approved", color: "#4ade80", bg: "#1a2a1a" },
];

const TYPE_COLORS = {
  "Residential": "#6b8afd",
  "Residential Compound": "#4ade80",
  "Residential Villas": "#34d399",
  "Retail / Mall": "#f0a030",
  "Commercial / Office": "#c084fc",
  "Commercial / Medical": "#e879f9",
  "Mixed Use": "#f472b6",
  "Mixed Use – Shops & Offices": "#fb923c",
  "Mixed Use – Residential & Commercial": "#f97316",
};

const SPEC_CATEGORIES = [
  {
    id: "general", label: "General",
    fields: [
      { id: "marketing_title", label: "Marketing Title", placeholder: "e.g. Waterfront Living at The Pearl", essential: true },
      { id: "description", label: "Description", placeholder: "Short marketing description", multiline: true, essential: true },
      { id: "availability", label: "Availability", placeholder: "e.g. Immediate, Q3 2026" },
      { id: "condition", label: "Condition", placeholder: "e.g. Brand New, Renovated, As-Is" },
      { id: "furnished", label: "Furnished", placeholder: "e.g. Fully, Semi, Unfurnished", essential: true },
    ]
  },
  {
    id: "dimensions", label: "Dimensions",
    fields: [
      { id: "total_area_sqm", label: "Total Area (sqm)", placeholder: "e.g. 450", essential: true },
      { id: "plot_size_sqm", label: "Plot Size (sqm)", placeholder: "e.g. 600" },
      { id: "built_up_area", label: "Built-Up Area (sqm)", placeholder: "e.g. 380" },
      { id: "floors", label: "Floors / Levels", placeholder: "e.g. 3, G+2" },
      { id: "units", label: "Total Units", placeholder: "e.g. 120 apartments" },
      { id: "bedrooms", label: "Bedrooms", placeholder: "e.g. 3, or 1-4 (range)", essential: true },
      { id: "bathrooms", label: "Bathrooms", placeholder: "e.g. 4", essential: true },
      { id: "living_areas", label: "Living Areas", placeholder: "e.g. Open plan, Majlis + living" },
      { id: "kitchen", label: "Kitchen", placeholder: "e.g. Open, Closed, European" },
      { id: "balcony_terrace", label: "Balcony / Terrace", placeholder: "e.g. 2 balconies, rooftop" },
      { id: "storage", label: "Storage / Maid Room", placeholder: "e.g. Maid room + storage" },
    ]
  },
  {
    id: "financial", label: "Financial",
    fields: [
      { id: "asking_price", label: "Asking Price (QAR)", placeholder: "e.g. 2,500,000", essential: true },
      { id: "price_per_sqm", label: "Price / sqm", placeholder: "e.g. 12,500 QAR" },
      { id: "rental_price", label: "Rental Price (QAR/yr)", placeholder: "e.g. 180,000", essential: true },
      { id: "service_charge", label: "Service Charge", placeholder: "e.g. 45 QAR/sqm/yr" },
      { id: "lease_terms", label: "Lease Terms", placeholder: "e.g. 1-3 years, renewable" },
      { id: "payment_plan", label: "Payment Plan", placeholder: "e.g. 60/40, Lease-to-own" },
    ]
  },
  {
    id: "features", label: "Features",
    fields: [
      { id: "parking", label: "Parking", placeholder: "e.g. 2 covered, basement", essential: true },
      { id: "pool", label: "Pool", placeholder: "e.g. Private, Shared, Infinity", essential: true },
      { id: "gym", label: "Gym / Fitness", placeholder: "e.g. On-site gym, tennis court" },
      { id: "security", label: "Security", placeholder: "e.g. 24/7, CCTV, gated" },
      { id: "elevator", label: "Elevator", placeholder: "e.g. 2 passenger + 1 service" },
      { id: "ac_type", label: "AC System", placeholder: "e.g. Central, Split unit" },
      { id: "view", label: "View", placeholder: "e.g. Sea view, Marina, City skyline", essential: true },
      { id: "garden", label: "Garden / Outdoor", placeholder: "e.g. Landscaped, BBQ area" },
      { id: "smart_home", label: "Smart Home", placeholder: "e.g. Automated lighting" },
      { id: "additional_amenities", label: "Other Amenities", placeholder: "e.g. Concierge, kids area, spa", multiline: true },
    ]
  },
  {
    id: "building", label: "Building",
    fields: [
      { id: "year_built", label: "Year Built", placeholder: "e.g. 2019" },
      { id: "developer", label: "Developer", placeholder: "e.g. UDC, Barwa" },
      { id: "materials", label: "Key Materials", placeholder: "e.g. Marble floors, glass facades" },
      { id: "ceiling_height", label: "Ceiling Height", placeholder: "e.g. 3.2m" },
      { id: "energy_rating", label: "Energy / GSAS", placeholder: "e.g. GSAS 3-star" },
    ]
  },
  {
    id: "contact", label: "Contact",
    fields: [
      { id: "landlord_name", label: "Landlord / Owner", placeholder: "Name" },
      { id: "landlord_contact", label: "Landlord Contact", placeholder: "Phone / Email" },
      { id: "assigned_agent", label: "Assigned Agent", placeholder: "Coreo agent name", essential: true },
      { id: "listing_ref", label: "Listing Ref", placeholder: "e.g. CRE-2026-0022" },
    ]
  },
];

const ALL_SPEC_IDS = SPEC_CATEGORIES.flatMap(c => c.fields.map(f => f.id));
const ESSENTIAL_FIELDS = SPEC_CATEGORIES.flatMap(c => c.fields.filter(f => f.essential));

const INITIAL_PROPERTIES = [
  { id: 1, name: "Porto Arabia – Tower 22", location: "Porto Arabia, The Pearl", type: "Residential", zone: "The Pearl" },
  { id: 2, name: "Porto Arabia – Tower 30", location: "Porto Arabia, The Pearl", type: "Residential", zone: "The Pearl" },
  { id: 3, name: "Porto Arabia – Tower 23", location: "Porto Arabia, The Pearl", type: "Residential", zone: "The Pearl" },
  { id: 4, name: "Viva Bahriya – Tower 2", location: "Viva Bahriya, The Pearl", type: "Residential", zone: "The Pearl" },
  { id: 5, name: "Barzan 3 Compound", location: "Mamoura", type: "Residential Compound", zone: "Central" },
  { id: 6, name: "Barzan 2 Compound", location: "Madinet Khalifa", type: "Residential Compound", zone: "Central" },
  { id: 7, name: "Diamond Compound WBL", location: "West Bay Lagoon", type: "Residential Compound", zone: "West Bay" },
  { id: 8, name: "12 Villas – St 15", location: "West Bay Lagoon", type: "Residential Compound", zone: "West Bay" },
  { id: 9, name: "Dar Al Salam Compound", location: "Abu Hamour", type: "Residential Compound", zone: "South" },
  { id: 10, name: "Nine Pearls Compound", location: "Al Waab", type: "Residential Compound", zone: "Central" },
  { id: 11, name: "Dar Al Salam Shopping Mall", location: "Abu Hamour", type: "Retail / Mall", zone: "South" },
  { id: 12, name: "43 Villas Dar Al Salam 2", location: "Mesaimeer", type: "Residential Villas", zone: "South" },
  { id: 13, name: "11 Villa Compound", location: "Al Waab", type: "Residential Compound", zone: "Central" },
  { id: 14, name: "15 Villas Compound", location: "Ain Khaled", type: "Residential Villas", zone: "North" },
  { id: 15, name: "New Office Building", location: "Old Al Ghanim", type: "Commercial / Office", zone: "Downtown" },
  { id: 16, name: "Old Office Building", location: "Old Al Ghanim", type: "Commercial / Office", zone: "Downtown" },
  { id: 17, name: "38 Res/Commercial Villas", location: "West Bay", type: "Mixed Use", zone: "West Bay" },
  { id: 18, name: "Hyper A – Shopping Mall", location: "Ain Khaled", type: "Retail / Mall", zone: "North" },
  { id: 19, name: "Hyper C – Shopping Mall", location: "Mesaimeer", type: "Retail / Mall", zone: "South" },
  { id: 20, name: "Al Thuraya Buildings", location: "Salwa Road", type: "Mixed Use – Shops & Offices", zone: "South" },
  { id: 21, name: "West Corner Building", location: "Midmac Roundabout", type: "Mixed Use – Shops & Offices", zone: "Central" },
  { id: 22, name: "Doha Building Msheireb", location: "Msheireb", type: "Mixed Use – Residential & Commercial", zone: "Downtown" },
  { id: 23, name: "Medical Plaza Building", location: "D Ring", type: "Commercial / Medical", zone: "Central" },
  { id: 24, name: "Al Hilal Office Building", location: "Al Hilal", type: "Commercial / Office", zone: "Central" },
  { id: 25, name: "Hyper B – Shopping Mall", location: "Mesaimeer", type: "Retail / Mall", zone: "South" },
];

const DEPS = { teaser: ["photos"], overview: ["photos"], brochure: ["photos"], listing: ["photos"] };

// ─── Brief Generator ───

function generateBrief(assetId, prop, specs) {
  const s = specs || {};
  const nm = s.marketing_title || prop.name;
  const loc = prop.location;
  const typ = prop.type;
  const isRes = typ.includes("Residential") || typ.includes("Villa");
  const isCompound = typ.includes("Compound") || typ.includes("Villa");
  const isComm = typ.includes("Commercial") || typ.includes("Office") || typ.includes("Medical");
  const isRetail = typ.includes("Retail") || typ.includes("Mall");

  const sl = (label, val) => val ? `  ${label}: ${val}` : null;
  const ctx = [
    sl("Property", nm), sl("Location", loc), sl("Type", typ),
    sl("Area", s.total_area_sqm ? s.total_area_sqm + " sqm" : null),
    sl("Bedrooms", s.bedrooms), sl("Bathrooms", s.bathrooms),
    sl("Floors", s.floors), sl("Units", s.units),
    sl("Condition", s.condition), sl("View", s.view), sl("Materials", s.materials),
  ].filter(Boolean).join("\n");

  if (assetId === "photos") {
    const ext = [
      "Building facade (wide, straight-on + 3/4 angle)",
      "Main entrance / lobby approach",
      "Signage / branding elements",
      isCompound ? "Compound gate / entry point" : null,
      isCompound ? "Streetscape within compound" : null,
      s.garden ? `Garden / outdoor (${s.garden})` : "Landscaping / outdoor areas",
      s.pool ? `Pool area (${s.pool})` : null,
      s.parking ? `Parking (${s.parking})` : "Parking area",
      "Building at golden hour (if scheduling allows)",
    ].filter(Boolean);
    const int = isRetail ? [
      "Main entrance / atrium", "Corridor / mall walkway (multiple angles)",
      "Anchor tenant spaces", "Common areas / seating",
      "Escalators / elevators", "Loading / back-of-house access",
      "Restrooms", "Signage / wayfinding",
    ] : isComm ? [
      "Reception / lobby", "Open office floor (wide + detail)",
      "Individual office units", "Meeting rooms",
      "Corridor / circulation", "Pantry / break area",
      "Restroom", s.elevator ? `Elevator (${s.elevator})` : "Elevator / stairwell",
    ] : [
      "Living room (wide + detail)", s.kitchen ? `Kitchen (${s.kitchen})` : "Kitchen (wide + counter detail)",
      "Master bedroom + en-suite", s.bedrooms ? `Bedrooms (${s.bedrooms} total)` : "Additional bedrooms",
      s.bathrooms ? `Bathrooms (${s.bathrooms} total)` : "Bathrooms",
      s.living_areas || "Dining area", s.balcony_terrace ? `Balcony/terrace (${s.balcony_terrace})` : "Balcony / terrace",
      s.storage ? `Storage/maid (${s.storage})` : null, "Corridor / hallway", "Entrance / foyer",
    ].filter(Boolean);
    const det = [
      s.materials ? `Materials & finishes (${s.materials})` : "Materials & finishes (flooring, countertops, fixtures)",
      "Door handles / hardware", "Light fixtures / switches",
      s.smart_home ? `Smart home (${s.smart_home})` : null,
      s.ceiling_height ? `Ceiling (height: ${s.ceiling_height})` : "Ceiling detail",
    ].filter(Boolean);
    const life = [
      s.view ? `View shots (${s.view})` : "View from property",
      "Natural light entering spaces (morning or late afternoon)",
      "Window framing / light patterns",
      isCompound ? "Community feel / shared spaces" : null,
      s.pool ? "Pool reflection / water detail" : null,
    ].filter(Boolean);

    return {
      title: "PHOTO BRIEF", subtitle: nm,
      sections: [
        { heading: "PROPERTY CONTEXT", content: ctx },
        { heading: "MINIMUM REQUIREMENT", content: "  20+ high-resolution images covering all categories below" },
        { heading: "SHOOTING NOTES", content: "  Shoot during golden hour for exteriors (if possible)\n  All interiors: lights ON, curtains OPEN, AC units OFF\n  Wide angle (16-24mm) for rooms, 35-50mm for details\n  Tripod mandatory for all interior wide shots\n  Vertical shots for social media in addition to landscape" + (isCompound ? "\n  Capture compound context: proximity, shared facilities" : "") },
        { heading: `EXTERIOR (${ext.length} shots)`, content: ext.map(x => `  → ${x}`).join("\n") },
        { heading: `INTERIOR (${int.length} shots)`, content: int.map(x => `  → ${x}`).join("\n") },
        { heading: `DETAILS (${det.length} shots)`, content: det.map(x => `  → ${x}`).join("\n") },
        { heading: `LIFESTYLE (${life.length} shots)`, content: life.map(x => `  → ${x}`).join("\n") },
      ],
    };
  }

  if (assetId === "teaser") {
    const moodMap = {
      "Residential": "Warm, aspirational, intimate. Natural light, calm energy.",
      "Residential Compound": "Community, security, family-oriented. Warm and grounded.",
      "Residential Villas": "Private, exclusive, spacious. Slow, cinematic movement.",
      "Retail / Mall": "Dynamic, commercial energy. Movement and activity.",
      "Commercial / Office": "Professional, modern, efficient. Clean and structured.",
      "Commercial / Medical": "Trust, precision, professionalism. Clean whites and blues.",
      "Mixed Use": "Versatile, urban, connected. Multiple moods in one.",
    };
    const mood = Object.entries(moodMap).find(([k]) => typ.includes(k))?.[1] || moodMap["Residential"];

    const seq = isRetail ? [
      "[0:00-0:05] Exterior approach / entrance reveal — Drone or gimbal, slow push-in",
      "[0:05-0:15] Interior walkthrough / atrium — Gimbal, wide lens",
      "[0:15-0:25] Retail spaces / storefronts — Tracking shot, warm lighting",
      "[0:25-0:35] Detail montage: signage, textures, activity — Handheld, shallow DOF",
      "[0:35-0:45] Upper levels / escalators / movement — Overhead or angle shot",
      "[0:45-0:55] Exterior wide at golden hour + logo — Drone pullback",
    ] : isComm ? [
      "[0:00-0:08] Building exterior / approach — Drone or ground-level, morning light",
      "[0:08-0:18] Lobby / reception — Gimbal, clean lines emphasized",
      "[0:18-0:30] Office spaces / meeting rooms — Gimbal flow-through",
      "[0:30-0:40] Details: materials, light, windows — Macro + shallow DOF",
      "[0:40-0:50] View from office / corridor — Static or slow pan",
      "[0:50-0:60] Exterior pullback + branding — Drone ascend",
    ] : [
      "[0:00-0:05] Opening: light entering space / curtain / window — Static, natural sound",
      `[0:05-0:12] ${isCompound ? "Compound entrance / gate" : "Building exterior"} — Drone or gimbal approach`,
      "[0:12-0:22] Interior flow: living to kitchen to bedroom — Gimbal, continuous",
      "[0:22-0:32] Detail montage: materials, fixtures, textures — Handheld, shallow DOF",
      `[0:32-0:42] ${s.view ? `View reveal (${s.view})` : "Balcony / outdoor reveal"} — Gimbal push-out`,
      `[0:42-0:52] ${s.pool ? "Pool / outdoor lifestyle" : "Garden / compound exterior"} — Drone + ground`,
      "[0:52-0:60] Closing: golden hour exterior + Coreo — Drone pullback, fade to logo",
    ];

    return {
      title: "TEASER BRIEF", subtitle: nm,
      sections: [
        { heading: "PROPERTY CONTEXT", content: ctx },
        { heading: "FORMAT", content: "  Duration: 30-60 seconds\n  Aspect: 9:16 (Reels) + 16:9 (Website)\n  Delivery: Color graded final, H.265, 4K" },
        { heading: "MOOD & TONE", content: `  ${mood}` },
        { heading: "COLOR GRADING", content: "  Warm tones, lifted shadows, desaturated highlights\n  Luxury real estate / boutique hotel aesthetic\n  Avoid: Over-saturated, HDR look, corporate flat" },
        { heading: "MUSIC DIRECTION", content: "  Tempo: Slow to mid (70-100 BPM)\n  Style: Ambient electronic, minimal piano, or cinematic strings\n  Avoid: Generic stock, vocals, aggressive beats\n  Source: Artlist or Musicbed" },
        { heading: "SHOT SEQUENCE", content: seq.map(x => `  ${x}`).join("\n\n") },
        { heading: "MANDATORY", content: "  → Coreo logo at end (3 sec, white on dark)\n  → Property name + location overlay\n  → No voiceover (music + ambient only)\n  → Minimum 1 drone shot" },
      ],
    };
  }

  if (assetId === "overview") {
    const zones = isRetail ? [
      "[0:00-0:25] Exterior & Entrance — Full building, main entrance, parking",
      "[0:25-0:55] Ground Floor — Atrium, anchor spaces, walkway flow",
      "[0:55-1:20] Upper Levels — Additional retail, offices, escalators",
      "[1:20-1:40] Back of House — Loading, service areas, utility",
      "[1:40-2:00] Amenities — Restrooms, prayer room, management",
      "[2:00-2:30] Closing — Exterior recap, branding",
    ] : isComm ? [
      "[0:00-0:25] Exterior & Approach — Facade, entrance, parking",
      "[0:25-0:50] Lobby & Reception — Reception, directory, elevators",
      "[0:50-1:30] Office Floors — Representative units, open/partitioned",
      "[1:30-1:55] Meeting & Common — Rooms, pantry, corridors",
      "[1:55-2:10] Technical — Server room, utility, fire exits",
      "[2:10-2:30] Closing — View, dusk exterior, branding",
    ] : [
      `[0:00-0:20] Exterior — ${isCompound ? "Gate, streetscape, villa exterior" : "Building, entrance, lobby"}`,
      "[0:20-0:50] Living & Dining — Full space, light, layout",
      `[0:50-1:10] Kitchen — ${s.kitchen ? `${s.kitchen}, appliances` : "Layout, appliances, storage"}`,
      "[1:10-1:35] Master Suite — Bedroom, en-suite, wardrobe",
      `[1:35-2:00] Bedrooms & Baths — All rooms, ${s.bathrooms || "bathrooms"}, corridors`,
      `[2:00-2:20] Outdoor — ${[s.balcony_terrace, s.garden, s.pool].filter(Boolean).join(", ") || "Balcony, terrace, outdoor"}`,
      "[2:20-2:45] Closing — Neighborhood context, branding",
    ];

    return {
      title: "OVERVIEW BRIEF", subtitle: nm,
      sections: [
        { heading: "PROPERTY CONTEXT", content: ctx },
        { heading: "FORMAT", content: "  Duration: 2-3 minutes\n  Aspect: 16:9 (primary) + 9:16 (social cut)\n  Delivery: Color graded, H.265, 4K\n  Style: Informative, clear, structured" },
        { heading: "APPROACH", content: "  Continuous flow through the property. Each space fully visible.\n  Minimal editing, no fast cuts. Clean and informative.\n  Camera movement intentional, not rushed.\n  Optional: Agent walkthrough or clean VO in post." },
        { heading: "ZONE BREAKDOWN", content: zones.map(x => `  ${x}`).join("\n\n") },
        { heading: "MANDATORY", content: "  → Clear view of EVERY room/space\n  → Coreo branding (intro + outro)\n  → Property name, location, specs on screen\n  → Consistent lighting (all lights on)" },
      ],
    };
  }

  if (assetId === "brochure") {
    const pages = isRetail ? [
      "Page 1 — COVER: Hero exterior, property name, Coreo branding",
      "Page 2 — INTRO: Mall positioning, target tenants, commercial context",
      "Page 3-4 — GALLERY: Full-bleed interior + exterior (4-6 photos)",
      "Page 5 — FLOOR PLANS: Ground + upper levels, tenant zones",
      "Page 6 — KEY SPECS: GLA, unit sizes, floors, parking, loading",
      "Page 7 — LOCATION: Map, accessibility, traffic flow",
      "Page 8 — TENANT MIX: Available units, size range, lease terms",
      "Page 9 — CONTACT: Agent, QR code, Coreo branding",
    ] : isComm ? [
      "Page 1 — COVER: Building exterior, name, Coreo branding",
      "Page 2 — INTRO: Building positioning, business district",
      "Page 3-4 — GALLERY: Offices, lobby, meeting rooms (4-6 photos)",
      "Page 5 — FLOOR PLANS: Typical floor + available units",
      "Page 6 — SPECS: Area, ceiling, AC, IT infrastructure",
      "Page 7 — LOCATION: Map, landmarks, transport",
      "Page 8 — AVAILABILITY: Unit schedule, pricing, terms",
      "Page 9 — CONTACT: Agent, QR code, Coreo branding",
    ] : [
      "Page 1 — COVER: Hero image (best interior/view), name, Coreo",
      `Page 2 — INTRO: ${s.description ? s.description.slice(0, 80) + "..." : "Storytelling description, lifestyle, emotional hook"}`,
      "Page 3-4 — GALLERY: Living spaces + exterior (4-6 photos)",
      "Page 5-6 — GALLERY: Bedrooms, kitchen, baths, details (4-6 photos)",
      `Page 7 — KEY FEATURES: ${[s.total_area_sqm && `${s.total_area_sqm}sqm`, s.bedrooms && `${s.bedrooms}BR`, s.bathrooms && `${s.bathrooms}BA`, s.parking, s.pool, s.view].filter(Boolean).join(" | ") || "Area, beds, baths, parking, pool, view"}`,
      "Page 8 — FLOOR PLAN: Layout with room labels + dimensions",
      `Page 9 — LOCATION: Map, ${loc}, neighborhood, distances`,
      `Page 10 — ${isCompound ? "COMMUNITY: Compound facilities, security" : "BUILDING: Facilities, management, services"}`,
      `Page 11 — PRICING: ${[s.asking_price && `${s.asking_price} QAR`, s.rental_price && `${s.rental_price} QAR/yr`, s.payment_plan].filter(Boolean).join(" / ") || "Price, payment plan, lease terms"}`,
      "Page 12 — CONTACT: Agent photo, phone, email, QR, Coreo logo",
    ];

    return {
      title: "BROCHURE BRIEF", subtitle: nm,
      sections: [
        { heading: "PROPERTY CONTEXT", content: ctx },
        { heading: "FORMAT", content: `  Pages: ${pages.length}\n  Size: A4 landscape or 210x280mm\n  Print: CMYK, 300dpi, 3mm bleed\n  Digital: RGB, screen-optimized` },
        { heading: "DESIGN DIRECTION", content: "  Clean, minimal, editorial\n  Sans-serif primary, generous whitespace\n  Coreo brand palette, dark accents on light\n  Full-bleed images, no borders or frames\n  Avoid: Decorative elements, stock imagery, clutter" },
        { heading: "COPY TONE", content: "  Premium but accessible. Confident, not aggressive.\n  Lifestyle and value, not just specs.\n  Short paragraphs, strategic pull quotes." },
        { heading: "PAGE STRUCTURE", content: pages.map(x => `  ${x}`).join("\n\n") },
        { heading: "DEPENDENCIES", content: "  → Final photo selection (approved set)\n  → Floor plan (landlord or measured)\n  → Confirmed pricing\n  → Agent headshot + contact" },
      ],
    };
  }

  if (assetId === "listing") {
    return {
      title: "LISTING SHEET BRIEF", subtitle: nm,
      sections: [
        { heading: "PROPERTY CONTEXT", content: ctx },
        { heading: "FORMAT", content: "  Size: A4 portrait, single page\n  Delivery: PDF (print + digital)\n  Must work printed in B&W (check contrast)" },
        { heading: "LAYOUT", content: [
          "  TOP THIRD:",
          `    Hero image (best shot)`,
          `    Property: ${nm}`,
          `    Location: ${loc}`,
          `    Type: ${typ}`,
          "",
          "  MIDDLE THIRD:",
          "    Key specs grid:",
          s.total_area_sqm ? `      Area: ${s.total_area_sqm} sqm` : "      Area: [TBC]",
          isRes && s.bedrooms ? `      Bedrooms: ${s.bedrooms}` : isRes ? "      Bedrooms: [TBC]" : null,
          isRes && s.bathrooms ? `      Bathrooms: ${s.bathrooms}` : isRes ? "      Bathrooms: [TBC]" : null,
          s.parking ? `      Parking: ${s.parking}` : "      Parking: [TBC]",
          s.floors ? `      Floors: ${s.floors}` : null,
          s.units ? `      Units: ${s.units}` : null,
          s.furnished ? `      Furnished: ${s.furnished}` : null,
          "",
          `    Price: ${s.asking_price || s.rental_price || "[TBC]"} ${s.asking_price ? "QAR" : s.rental_price ? "QAR/year" : ""}`,
          "",
          `    Description (2-3 lines):`,
          `    ${s.description || "[From property visit or brochure]"}`,
          "",
          "  BOTTOM THIRD:",
          "    Secondary image (exterior / lifestyle)",
          `    Agent: ${s.assigned_agent || "[Agent name]"}`,
          "    Contact: Coreo phone + email",
          "    QR code linking to full listing",
          "    Coreo logo + tagline",
        ].filter(Boolean).join("\n") },
        { heading: "DESIGN RULES", content: "  → Max 2 images\n  → Max 3 font sizes\n  → Coreo brand colors only\n  → White background, dark text\n  → QR bottom-right, min 20x20mm\n  → Readable at arm's length (print)" },
        { heading: "DEPENDENCIES", content: "  → 2 approved photos\n  → Confirmed pricing\n  → Agent assignment\n  → Property description" },
      ],
    };
  }

  return { title: "BRIEF", subtitle: nm, sections: [{ heading: "INFO", content: "Template not available." }] };
}

// ─── Hooks & Components ───

function usePersistedState(key, defaultVal) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(key);
        if (r && r.value) setData(JSON.parse(r.value)); else setData(defaultVal);
      } catch { setData(defaultVal); }
      setLoading(false);
    })();
  }, []);
  const update = useCallback(async (v) => {
    const val = typeof v === "function" ? v(data) : v;
    setData(val);
    try { await window.storage.set(key, JSON.stringify(val)); } catch (e) { console.error(e); }
  }, [data, key]);
  return [data, update, loading];
}

function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth < 700 : false);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 700);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

const BOOT_LINES = [
  "> COREO SYSTEMS v2.0",
  "> Initializing EPMAS module ...",
  "> Loading property database ......... OK",
  "> Syncing asset statuses ............ OK",
  "> Mounting brief generator .......... OK",
  "> Authentication required.",
];

const ACCESS_CODE = "EPMASACCESS2026";

function BootScreen({ onDone }) {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState("typing");
  const [pwd, setPwd] = useState("");
  const [denied, setDenied] = useState(0);
  const [fading, setFading] = useState(false);
  const [scramble, setScramble] = useState("");
  const [lockedIn, setLockedIn] = useState(false);
  const [flash, setFlash] = useState(false);
  const [particles, setParticles] = useState([]);
  const [variant, setVariant] = useState(0);
  const [reels, setReels] = useState(["◇", "◇", "◇"]);
  const [count, setCount] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = "01COREOアイウエオカキクケコ$#@%&";
    const fontSize = 14;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array(cols).fill(0).map(() => Math.floor(Math.random() * -40));
    const iv = setInterval(() => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontSize + "px monospace";
      drops.forEach((y, i) => {
        ctx.fillStyle = Math.random() > 0.95 ? "#4ade80" : "#0f3d1e";
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 50);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const full = BOOT_LINES.join("\n");
    let i = 0;
    const iv = setInterval(() => {
      i += 2;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(iv);
        setTimeout(() => setPhase("password"), 300);
      }
    }, 14);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (phase === "password") setTimeout(() => inputRef.current?.focus(), 50); }, [phase]);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const mkParticles = (n, fn) => setParticles(Array.from({ length: n }, (_, i) => fn(i)));

  const runScramble = (delay = 0) => {
    setTimeout(() => {
      const target = "WELCOME TO THE EPMAS DASHBOARD";
      const glyphs = "!<>-_\\/[]{}=+*^?#$%&01";
      let frame = 0;
      const iv = setInterval(() => {
        frame++;
        const lc = Math.floor(frame / 2);
        let out = "";
        for (let i = 0; i < target.length; i++) {
          out += i < lc ? target[i] : (target[i] === " " ? " " : glyphs[Math.floor(Math.random() * glyphs.length)]);
        }
        setScramble(out);
        if (lc >= target.length) { clearInterval(iv); setLockedIn(true); }
      }, 30);
    }, delay);
  };

  const submit = () => {
    if (pwd.trim() !== ACCESS_CODE) { setDenied(d => d + 1); setPwd(""); inputRef.current?.focus(); return; }
    const v = Math.floor(Math.random() * 10);
    setVariant(v);
    setPhase("granted");
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
    let totalMs = 4400;

    if (v === 0) {
      // 0 — MATRIX BREACH: burst vert + décodage
      runScramble();
      mkParticles(60, i => ({ id: i, left: "50%", top: "52%", w: rnd(4, 10), h: rnd(4, 10), color: pick(["#4ade80", "#a7f3d0", "#22c55e"]), dx: rnd(-350, 350), dy: rnd(-380, 200), rot: rnd(-360, 360), delay: rnd(0, 0.2), dur: 1.4, anim: "burst" }));
    } else if (v === 1) {
      // 1 — ARCADE LEVEL UP: pixels rétro 8-bit
      runScramble(200);
      mkParticles(45, i => ({ id: i, left: "50%", top: "52%", w: 8, h: 8, color: pick(["#facc15", "#f87171", "#60a5fa", "#4ade80", "#f0abfc"]), dx: rnd(-320, 320), dy: rnd(-340, 160), rot: 0, delay: rnd(0, 0.3), dur: 1.2, anim: "burst" }));
    } else if (v === 2) {
      // 2 — SLOT MACHINE: rouleaux 7-7-7 + pluie de pièces
      let t = 0;
      const spin = setInterval(() => { t++; setReels(r => r.map((x, idx) => t > 12 + idx * 8 ? "7" : pick(["◆", "7", "★", "●", "♠"]))); if (t > 30) clearInterval(spin); }, 70);
      setTimeout(() => {
        mkParticles(50, i => ({ id: i, left: rnd(5, 95) + "%", top: "-4%", w: rnd(6, 10), h: rnd(6, 10), color: pick(["#facc15", "#fde68a", "#f59e0b"]), dx: rnd(-30, 30), dy: rnd(400, 850), rot: rnd(-720, 720), delay: rnd(0, 0.5), dur: rnd(1.2, 2), anim: "burst" }));
        runScramble();
      }, 2300);
      totalMs = 6600;
    } else if (v === 3) {
      // 3 — HYPERSPACE: traînées d'étoiles + zoom
      mkParticles(70, i => ({ id: i, left: "50%", top: "50%", w: 2, h: rnd(14, 40), color: pick(["#ffffff", "#93c5fd", "#dbeafe"]), dx: 0, dy: rnd(250, 750), rot: rnd(0, 360), delay: rnd(0, 0.5), dur: rnd(0.7, 1.2), anim: "streak" }));
      runScramble(500);
    } else if (v === 4) {
      // 4 — GLITCH: texte corrompu RGB
      runScramble();
    } else if (v === 5) {
      // 5 — SYNTHWAVE: néon rose/cyan qui grésille
      runScramble(300);
    } else if (v === 6) {
      // 6 — DOSSIER CLASSIFIÉ: tampon rouge
      runScramble();
    } else if (v === 7) {
      // 7 — LANCEMENT FUSÉE: compte à rebours + décollage
      setCount(3);
      setTimeout(() => setCount(2), 700);
      setTimeout(() => setCount(1), 1400);
      setTimeout(() => {
        setCount(null);
        mkParticles(35, i => ({ id: i, left: "50%", top: "58%", w: rnd(3, 7), h: rnd(3, 7), color: pick(["#f97316", "#facc15", "#fca5a5"]), dx: rnd(-70, 70), dy: rnd(80, 280), rot: 0, delay: rnd(0, 0.4), dur: 1.2, anim: "burst" }));
        runScramble(500);
      }, 2100);
      totalMs = 6800;
    } else if (v === 8) {
      // 8 — LOOT LÉGENDAIRE: coffre qui tremble puis explose
      setTimeout(() => {
        mkParticles(55, i => ({ id: i, left: "50%", top: "48%", w: rnd(5, 9), h: rnd(5, 9), color: pick(["#facc15", "#fde68a", "#a78bfa", "#f0abfc"]), dx: rnd(-330, 330), dy: rnd(-350, 250), rot: rnd(-540, 540), delay: 0, dur: 1.4, anim: "burst" }));
        runScramble();
      }, 1700);
      totalMs = 6200;
    } else {
      // 9 — FEU D'ARTIFICE: bouquets multiples
      for (let b = 0; b < 5; b++) {
        setTimeout(() => {
          const lx = rnd(15, 85), ly = rnd(12, 55);
          setParticles(prev => [...prev, ...Array.from({ length: 24 }, (_, i) => {
            const ang = (i / 24) * Math.PI * 2; const d = rnd(60, 160);
            return { id: `${b}-${i}`, left: lx + "%", top: ly + "%", w: 4, h: 4, color: pick(["#f87171", "#facc15", "#60a5fa", "#4ade80", "#f0abfc"]), dx: Math.cos(ang) * d, dy: Math.sin(ang) * d + 40, rot: 0, delay: 0, dur: 1.3, anim: "burst" };
          })]);
        }, b * 450);
      }
      runScramble(600);
      totalMs = 5400;
    }

    setTimeout(() => setFading(true), totalMs - 500);
    setTimeout(onDone, totalMs);
  };

  const mono = { fontFamily: "'SF Mono', 'Menlo', 'Consolas', monospace" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 2000, opacity: fading ? 0 : 1, transition: "opacity 0.5s ease" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <pre style={{ ...mono, fontSize: 13, color: "#4ade80", lineHeight: 1.8, margin: 0, textShadow: "0 0 8px rgba(74, 222, 128, 0.5)", whiteSpace: "pre-wrap" }}>
            {typed}{phase === "typing" && <span style={{ animation: "blink 0.8s steps(1) infinite" }}>█</span>}
          </pre>

          {phase === "password" && (
            <div style={{ marginTop: 16 }}>
              {denied > 0 && (
                <div style={{ ...mono, fontSize: 13, color: "#f87171", textShadow: "0 0 8px rgba(248, 113, 113, 0.5)", marginBottom: 10, animation: "shake 0.3s ease" }}>
                  {"> ACCESS DENIED — INVALID CODE"}{denied > 1 ? ` [${denied}]` : ""}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...mono, fontSize: 13, color: "#4ade80", textShadow: "0 0 8px rgba(74, 222, 128, 0.5)", whiteSpace: "nowrap" }}>{"> ENTER ACCESS CODE:"}</span>
                <input
                  ref={inputRef} type="password" value={pwd}
                  onChange={e => setPwd(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  autoComplete="off" spellCheck={false}
                  style={{ ...mono, flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #1a4d2a", outline: "none", color: "#4ade80", fontSize: 14, letterSpacing: "0.3em", padding: "2px 4px", caretColor: "#4ade80", textShadow: "0 0 8px rgba(74, 222, 128, 0.5)" }}
                />
                <button onClick={submit} style={{ ...mono, background: "rgba(74, 222, 128, 0.08)", border: "1px solid #1a4d2a", color: "#4ade80", borderRadius: 3, padding: "4px 12px", fontSize: 11, cursor: "pointer", letterSpacing: "0.1em" }}>ENTER</button>
              </div>
            </div>
          )}

          {phase === "granted" && (() => {
            const sz = "clamp(11px, 2.8vw, 24px)";
            const FLASHC = ["74, 222, 128", "250, 204, 21", "250, 204, 21", "147, 197, 253", "34, 211, 238", "240, 171, 252", "239, 68, 68", "249, 115, 22", "192, 132, 252", "255, 255, 255"];
            const SUBS = [
              { t: "★ ACCESS UNLOCKED ★", c: "#facc15" },
              { t: "▲ +1000 XP — NEW STAGE UNLOCKED ▲", c: "#4ade80" },
              { t: "7 · 7 · 7 — JACKPOT PAYOUT: FULL ACCESS", c: "#facc15" },
              { t: "HYPERSPACE JUMP COMPLETE — WELCOME ABOARD", c: "#93c5fd" },
              { t: "SIGNAL RESTORED — TRANSMISSION STABLE", c: "#22d3ee" },
              { t: "NIGHT DRIVE MODE — INITIATED", c: "#f0abfc" },
              { t: "CLEARANCE LEVEL 5 — EYES ONLY", c: "#ef4444" },
              { t: "ORBIT REACHED — ALL SYSTEMS GO", c: "#fdba74" },
              { t: "LEGENDARY ITEM ACQUIRED", c: "#c084fc" },
              { t: "GRAND FINALE — ENJOY THE SHOW", c: "#ffffff" },
            ];
            const TXT = [
              { color: "#4ade80", textShadow: "0 0 20px rgba(74, 222, 128, 0.8), 0 0 40px rgba(74, 222, 128, 0.4)", animation: lockedIn ? "jackpotPulse 0.8s ease infinite" : "none" },
              { color: "#facc15", textShadow: "3px 3px 0 #7c2d12", animation: "arcadeBounce 0.5s ease" },
              { color: "#fde68a", textShadow: "0 0 25px rgba(250, 204, 21, 0.9)", animation: lockedIn ? "jackpotPulse 0.7s ease infinite" : "none" },
              { color: "#e0f2fe", textShadow: "0 0 24px rgba(147, 197, 253, 0.9)", animation: "zoomFar 0.8s ease-out" },
              null,
              { background: "linear-gradient(180deg, #f0abfc 30%, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 12px rgba(240, 171, 252, 0.7))", animation: "neonFlicker 2s linear infinite" },
              { color: "#e5e5e5" },
              { color: "#fdba74", textShadow: "0 0 20px rgba(249, 115, 22, 0.8)", animation: lockedIn ? "jackpotPulse 0.8s ease infinite" : "none" },
              { color: "#e9d5ff", textShadow: "0 0 24px rgba(167, 139, 250, 0.9)", animation: lockedIn ? "jackpotPulse 0.8s ease infinite" : "none" },
              { color: "#ffffff", textShadow: "0 0 20px rgba(255, 255, 255, 0.9)", animation: lockedIn ? "jackpotPulse 0.9s ease infinite" : "none" },
            ];
            return (
              <>
                {flash && <div style={{ position: "fixed", inset: 0, background: `radial-gradient(circle, rgba(${FLASHC[variant]}, 0.55), rgba(0, 0, 0, 0) 70%)`, animation: "flashOut 0.5s ease forwards", pointerEvents: "none", zIndex: 3 }} />}
                {particles.map(p => (
                  <span key={p.id} style={{ position: "fixed", left: p.left, top: p.top, width: p.w, height: p.h, background: p.color, borderRadius: 1, opacity: 0, pointerEvents: "none", zIndex: 3, "--dx": p.dx + "px", "--dy": p.dy + "px", "--rot": p.rot + "deg", animation: `${p.anim} ${p.dur}s cubic-bezier(0.1, 0.8, 0.3, 1) ${p.delay}s forwards` }} />
                ))}
                <pre style={{ ...mono, fontSize: 13, color: "#4ade80", lineHeight: 1.8, margin: "8px 0 0", textShadow: "0 0 8px rgba(74, 222, 128, 0.5)", whiteSpace: "pre-wrap" }}>
                  {"> Verifying access .................. GRANTED"}
                </pre>

                {variant === 2 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
                    {reels.map((r, i) => (
                      <div key={i} style={{ ...mono, width: 54, height: 64, background: "#0a0a0a", border: "2px solid #facc15", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "#facc15", boxShadow: "0 0 18px rgba(250, 204, 21, 0.35)" }}>{r}</div>
                    ))}
                  </div>
                )}
                {variant === 7 && count !== null && (
                  <div key={count} style={{ ...mono, fontSize: 64, fontWeight: 700, color: "#fdba74", textAlign: "center", marginTop: 24, textShadow: "0 0 30px rgba(249, 115, 22, 0.8)", animation: "countPop 0.6s ease" }}>{count}</div>
                )}
                {variant === 7 && count === null && (
                  <div style={{ fontSize: 48, textAlign: "center", marginTop: 12, animation: "riseUp 1.8s ease-in forwards" }}>🚀</div>
                )}
                {variant === 8 && !scramble && (
                  <div style={{ fontSize: 60, textAlign: "center", marginTop: 24, animation: "chestShake 0.18s linear infinite" }}>🎁</div>
                )}

                {scramble && (
                  variant === 4 ? (
                    <div style={{ position: "relative", marginTop: 32, textAlign: "center" }}>
                      <div style={{ ...mono, position: "absolute", inset: 0, fontSize: sz, fontWeight: 700, color: "#22d3ee", letterSpacing: "0.12em", whiteSpace: "nowrap", opacity: 0.6, animation: "glitchJit 0.4s steps(2) infinite" }}>{scramble}</div>
                      <div style={{ ...mono, position: "absolute", inset: 0, fontSize: sz, fontWeight: 700, color: "#f87171", letterSpacing: "0.12em", whiteSpace: "nowrap", opacity: 0.6, animation: "glitchJit 0.35s steps(2) infinite reverse" }}>{scramble}</div>
                      <div style={{ ...mono, position: "relative", fontSize: sz, fontWeight: 700, color: "#ffffff", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>{scramble}</div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 32, ...mono, fontSize: sz, fontWeight: 700, letterSpacing: "0.12em", textAlign: "center", whiteSpace: "nowrap", ...TXT[variant] }}>
                      {scramble}
                    </div>
                  )
                )}

                {variant === 6 && lockedIn && (
                  <div style={{ ...mono, margin: "18px auto 0", width: "fit-content", padding: "6px 18px", border: "3px solid #ef4444", color: "#ef4444", fontSize: 16, fontWeight: 700, letterSpacing: "0.2em", transform: "rotate(-8deg)", animation: "stampIn 0.25s ease-in", borderRadius: 4 }}>ACCESS GRANTED</div>
                )}
                {lockedIn && (
                  <div style={{ ...mono, fontSize: 11, color: SUBS[variant].c, letterSpacing: "0.3em", textAlign: "center", marginTop: 16, textShadow: `0 0 14px ${SUBS[variant].c}88`, animation: "welcomeIn 0.4s ease", whiteSpace: "nowrap" }}>
                    {SUBS[variant].t}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes welcomeIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @keyframes flashOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes burst { 0% { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; } }
        @keyframes streak { 0% { transform: translate(-50%, -50%) rotate(var(--rot)) translateY(0) scaleY(0.3); opacity: 0.9; } 100% { transform: translate(-50%, -50%) rotate(var(--rot)) translateY(var(--dy)) scaleY(1.5); opacity: 0; } }
        @keyframes jackpotPulse { 0%, 100% { transform: scale(1); text-shadow: 0 0 20px rgba(74, 222, 128, 0.8), 0 0 40px rgba(74, 222, 128, 0.4); } 50% { transform: scale(1.06); text-shadow: 0 0 30px rgba(74, 222, 128, 1), 0 0 70px rgba(74, 222, 128, 0.7), 0 0 110px rgba(250, 204, 21, 0.4); } }
        @keyframes arcadeBounce { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @keyframes zoomFar { from { transform: scale(5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes glitchJit { 0%, 100% { transform: translate(0, 0); } 20% { transform: translate(-3px, 2px); } 40% { transform: translate(3px, -2px); } 60% { transform: translate(-2px, -1px); } 80% { transform: translate(2px, 2px); } }
        @keyframes neonFlicker { 0%, 18%, 22%, 25%, 54%, 56%, 100% { opacity: 1; } 20%, 24%, 55% { opacity: 0.35; } }
        @keyframes stampIn { from { transform: rotate(-8deg) scale(3); opacity: 0; } to { transform: rotate(-8deg) scale(1); opacity: 1; } }
        @keyframes riseUp { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-70vh); opacity: 0; } }
        @keyframes chestShake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-7deg); } 75% { transform: rotate(7deg); } }
        @keyframes countPop { from { transform: scale(1.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

function ProgressBar({ value, max, color = "#6b8afd", height = 4 }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ width: "100%", height, background: "#1a1a1a", borderRadius: height / 2 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: height / 2, transition: "width 0.5s ease" }} />
    </div>
  );
}

function StatusBadge({ status, onClick, small, disabled }) {
  const s = STATUSES.find(st => st.id === status) || STATUSES[0];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: s.bg, color: s.color, border: `1px solid ${s.color}22`, borderRadius: 4,
      padding: small ? "2px 6px" : "4px 10px", fontSize: small ? 10 : 11, fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "0.02em", whiteSpace: "nowrap",
      opacity: disabled ? 0.4 : 1,
    }}>{s.label}{!disabled && " ▾"}</button>
  );
}

function StatusMenu({ current, onSelect, alignRight = true }) {
  return (
    <div onClick={e => e.stopPropagation()} style={{ position: "absolute", [alignRight ? "right" : "left"]: 0, top: "110%", background: "#181818", border: "1px solid #2a2a2a", borderRadius: 6, padding: 4, zIndex: 100, minWidth: 140, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
      {STATUSES.map(st => (
        <button key={st.id} onClick={() => onSelect(st.id)} style={{ display: "block", width: "100%", textAlign: "left", background: current === st.id ? "#222" : "transparent", border: "none", color: st.color, padding: "7px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", borderRadius: 3 }}>
          {current === st.id ? "● " : "○ "}{st.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, color = "#fff" }) {
  return (
    <div style={{ background: "#111", border: "1px solid #222", borderRadius: 8, padding: "14px 18px", flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 300, color, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function BriefPanel({ brief, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!brief) return null;
  const copyAll = () => {
    const text = `${brief.title}\n${brief.subtitle}\n${"=".repeat(50)}\n\n` +
      brief.sections.map(s => `${s.heading}\n${"-".repeat(s.heading.length)}\n${s.content}`).join("\n\n");
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", overflowY: "auto", padding: "40px 16px" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0e0e0e", border: "1px solid #222", borderRadius: 10, maxWidth: 720, width: "100%", padding: 24, alignSelf: "flex-start" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#6b8afd", textTransform: "uppercase", marginBottom: 4 }}>{brief.title}</div>
            <div style={{ fontSize: 20, color: "#eee", fontWeight: 300 }}>{brief.subtitle}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={copyAll} style={{ background: copied ? "#1a2a1a" : "#1a2240", border: `1px solid ${copied ? "#4ade8033" : "#6b8afd33"}`, color: copied ? "#4ade80" : "#6b8afd", borderRadius: 4, padding: "6px 14px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>{copied ? "Copied ✓" : "Copy Brief"}</button>
            <button onClick={onClose} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#666", borderRadius: 4, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
          </div>
        </div>
        {brief.sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#555", textTransform: "uppercase", marginBottom: 8, borderBottom: "1px solid #1a1a1a", paddingBottom: 4 }}>{sec.heading}</div>
            <pre style={{ fontFamily: "'SF Mono', 'Menlo', 'Consolas', monospace", fontSize: 12, color: "#bbb", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0, background: "#0a0a0a", padding: 14, borderRadius: 6, border: "1px solid #151515" }}>{sec.content}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ───

export default function CoreoProductionHub() {
  const [properties,, p1] = usePersistedState("coreo-properties", INITIAL_PROPERTIES);
  const [assetStatuses, setAssetStatuses, p2] = usePersistedState("coreo-asset-statuses", {});
  const [propertySpecs, setPropertySpecs, p3] = usePersistedState("coreo-property-specs-v2", {});
  const [notes, setNotes, p4] = usePersistedState("coreo-notes", {});
  const [assetLinks, setAssetLinks, p5] = usePersistedState("coreo-asset-links", {});

  const isMobile = useIsMobile();
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState("dashboard");
  const [reportTab, setReportTab] = useState("pipeline");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingSpecs, setEditingSpecs] = useState(false);
  const [specMode, setSpecMode] = useState("essential");
  const [noteInput, setNoteInput] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  const [linkInput, setLinkInput] = useState("");
  const [activeBrief, setActiveBrief] = useState(null);
  const [specTab, setSpecTab] = useState("general");

  const loading = p1 || p2 || p3 || p4 || p5;
  const getStatus = (pid, aid) => assetStatuses?.[`${pid}-${aid}`] || "not_started";
  const getLink = (pid, aid) => assetLinks?.[`${pid}-${aid}`] || "";
  const setStatusDirect = (pid, aid, sid) => { setAssetStatuses(prev => ({ ...prev, [`${pid}-${aid}`]: sid })); setShowStatusMenu(null); };
  const saveLink = (pid, aid) => { setAssetLinks(prev => ({ ...prev, [`${pid}-${aid}`]: linkInput.trim() })); setEditingLink(null); setLinkInput(""); };
  const getProgress = (id) => ASSET_TYPES.reduce((n, a) => n + (getStatus(id, a.id) === "approved" ? 1 : 0), 0);
  const addNote = (pid) => { if (!noteInput.trim()) return; setNotes(prev => ({ ...prev, [`${pid}`]: [...(prev?.[`${pid}`] || []), { text: noteInput.trim(), date: new Date().toISOString() }] })); setNoteInput(""); };
  const isBlocked = (pid, aid) => (DEPS[aid] || []).some(d => getStatus(pid, d) !== "approved");

  const stats = useMemo(() => {
    if (!properties) return { total: 0, done: 0, inProg: 0, notStarted: 0 };
    const total = properties.length * 5; let done = 0, inProg = 0;
    properties.forEach(p => ASSET_TYPES.forEach(a => { const st = getStatus(p.id, a.id); if (st === "approved") done++; else if (st !== "not_started") inProg++; }));
    return { total, done, inProg, notStarted: total - done - inProg };
  }, [properties, assetStatuses]);

  const zones = useMemo(() => properties ? [...new Set(properties.map(p => p.zone))].sort() : [], [properties]);
  const types = useMemo(() => properties ? [...new Set(properties.map(p => p.type))].sort() : [], [properties]);
  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    const q = search.trim().toLowerCase();
    return properties.filter(p => {
      if (q && !p.name.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q)) return false;
      if (filterType !== "all" && p.type !== filterType) return false;
      if (filterZone !== "all" && p.zone !== filterZone) return false;
      if (filterStatus !== "all") {
        const ss = ASSET_TYPES.map(a => getStatus(p.id, a.id));
        if (filterStatus === "complete" && !ss.every(x => x === "approved")) return false;
        if (filterStatus === "in_progress" && !ss.some(x => x !== "not_started" && x !== "approved")) return false;
        if (filterStatus === "not_started" && !ss.every(x => x === "not_started")) return false;
      }
      return true;
    });
  }, [properties, search, filterType, filterZone, filterStatus, assetStatuses]);

  const hasActiveFilters = search || filterType !== "all" || filterZone !== "all" || filterStatus !== "all";

  if (!booted) return <BootScreen onDone={() => setBooted(true)} />;

  if (loading) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontFamily: "'Söhne', 'Helvetica Neue', sans-serif" }}>
      <div style={{ fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}>Loading Production Hub</div>
    </div>
  );

  const propDetail = selectedProperty ? properties.find(p => p.id === selectedProperty) : null;
  const specs = propertySpecs?.[selectedProperty] || {};
  const propNotes = notes?.[`${selectedProperty}`] || [];
  const filledCount = ALL_SPEC_IDS.filter(f => specs[f]).length;
  const essFilled = ESSENTIAL_FIELDS.filter(f => specs[f.id]).length;
  const iStyle = { width: "100%", background: "#0a0a0a", border: "1px solid #1c1c1c", color: "#ccc", borderRadius: 4, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };
  const selStyle = { background: "#111", color: "#888", border: "1px solid #222", borderRadius: 4, padding: "7px 10px", fontSize: 11, fontFamily: "inherit", cursor: "pointer" };

  const setSpec = (fieldId, val) => setPropertySpecs(prev => ({ ...prev, [selectedProperty]: { ...specs, [fieldId]: val } }));

  const renderField = (field) => (
    <div key={field.id} style={field.multiline && editingSpecs ? { gridColumn: "1 / -1" } : {}}>
      <div style={{ fontSize: 10, color: field.essential ? "#6b8afd88" : "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
        {field.label}{field.essential && <span style={{ color: "#6b8afd", marginLeft: 3 }}>*</span>}
      </div>
      {editingSpecs ? (
        field.multiline ? (
          <textarea value={specs[field.id] || ""} onChange={e => setSpec(field.id, e.target.value)} placeholder={field.placeholder} rows={3} style={{ ...iStyle, resize: "vertical" }} />
        ) : (
          <input value={specs[field.id] || ""} onChange={e => setSpec(field.id, e.target.value)} placeholder={field.placeholder} style={iStyle} />
        )
      ) : (
        <div style={{ fontSize: 13, color: specs[field.id] ? "#ccc" : "#262626", lineHeight: 1.5 }}>{specs[field.id] || "—"}</div>
      )}
    </div>
  );

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#ccc", fontFamily: "'Söhne', 'Helvetica Neue', sans-serif" }} onClick={() => showStatusMenu && setShowStatusMenu(null)}>
      <BriefPanel brief={activeBrief} onClose={() => setActiveBrief(null)} />

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: isMobile ? "12px 16px" : "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="https://mycoreo.com/coreo-logo.png" alt="Coreo" style={{ height: 26, display: "block" }} />
          <div style={{ width: 1, height: 16, background: "#222" }} />
          <div style={{ fontSize: 13, color: "#999" }}>Exclusive Properties Marketing Assets</div>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {[{ id: "dashboard", label: "Dashboard" }, { id: "reports", label: "Reports" }].map(v => (
            <button key={v.id} onClick={() => { setView(v.id); setSelectedProperty(null); }} style={{
              background: view === v.id && !selectedProperty ? "#1a1a1a" : "transparent",
              color: view === v.id && !selectedProperty ? "#fff" : "#555",
              border: "none", borderRadius: 4, padding: "6px 14px", fontSize: 11, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: "0.04em",
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* ═══ PROPERTY DETAIL ═══ */}
      {selectedProperty && propDetail ? (
        <div style={{ padding: isMobile ? 16 : 24, maxWidth: 960, margin: "0 auto" }}>
          <button onClick={() => { setSelectedProperty(null); setEditingSpecs(false); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: 0, marginBottom: 20 }}>← Back</button>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: TYPE_COLORS[propDetail.type] || "#666", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>#{propDetail.id} · {propDetail.type}</div>
              <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 300, color: "#eee", margin: 0 }}>{propDetail.name}</h1>
              <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{propDetail.location}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 200, color: "#4ade80" }}>{getProgress(propDetail.id)}/5</div>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase" }}>Assets Done</div>
            </div>
          </div>

          {/* SPECS */}
          <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #1a1a1a", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>Property Specs</span>
                <span style={{ fontSize: 10, color: "#333" }}>{specMode === "essential" ? `${essFilled}/${ESSENTIAL_FIELDS.length} essential` : `${filledCount}/${ALL_SPEC_IDS.length}`}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ display: "flex", background: "#0a0a0a", borderRadius: 4, border: "1px solid #1c1c1c", overflow: "hidden" }}>
                  {[{ id: "essential", label: "Essentials" }, { id: "all", label: "All fields" }].map(m => (
                    <button key={m.id} onClick={() => setSpecMode(m.id)} style={{
                      background: specMode === m.id ? "#1a1a1a" : "transparent", color: specMode === m.id ? "#ccc" : "#444",
                      border: "none", padding: "4px 10px", fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                    }}>{m.label}</button>
                  ))}
                </div>
                <button onClick={() => setEditingSpecs(!editingSpecs)} style={{
                  background: editingSpecs ? "#1a2a1a" : "none", border: `1px solid ${editingSpecs ? "#4ade8033" : "#333"}`,
                  color: editingSpecs ? "#4ade80" : "#666", borderRadius: 4, padding: "3px 12px", fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                }}>{editingSpecs ? "Done" : "Edit"}</button>
              </div>
            </div>

            {specMode === "essential" ? (
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 10, color: "#444", marginBottom: 14 }}>These 12 fields feed the generated briefs. Fill them first — the rest is optional detail under "All fields".</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : editingSpecs ? "1fr 1fr" : "1fr 1fr 1fr", gap: editingSpecs ? 12 : 10 }}>
                  {ESSENTIAL_FIELDS.map(renderField)}
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1a1a1a", overflowX: "auto" }}>
                  {SPEC_CATEGORIES.map(cat => {
                    const filled = cat.fields.filter(f => specs[f.id]).length;
                    return (
                      <button key={cat.id} onClick={() => setSpecTab(cat.id)} style={{
                        background: specTab === cat.id ? "#0e0e0e" : "transparent", color: specTab === cat.id ? "#ddd" : "#444",
                        border: "none", borderBottom: specTab === cat.id ? "2px solid #6b8afd" : "2px solid transparent",
                        padding: "10px 14px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                      }}>
                        {cat.label} {filled > 0 && <span style={{ color: "#4ade80", fontSize: 9, marginLeft: 4 }}>{filled}</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding: 20 }}>
                  {SPEC_CATEGORIES.filter(c => c.id === specTab).map(cat => (
                    <div key={cat.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : editingSpecs ? "1fr 1fr" : "1fr 1fr 1fr", gap: editingSpecs ? 12 : 10 }}>
                      {cat.fields.map(renderField)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ASSETS */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Assets & Briefs</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ASSET_TYPES.map(asset => {
                const status = getStatus(propDetail.id, asset.id);
                const deps = DEPS[asset.id] || [];
                const blocked = isBlocked(propDetail.id, asset.id);
                const link = getLink(propDetail.id, asset.id);
                const editLink = editingLink === `${propDetail.id}-${asset.id}`;
                return (
                  <div key={asset.id} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 18 }}>{asset.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, color: "#ddd" }}>{asset.label}</div>
                          {blocked && status === "not_started" && <div style={{ fontSize: 10, color: "#f0a030", marginTop: 2 }}>⚠ Photos not approved yet — production usually starts after</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => setActiveBrief(generateBrief(asset.id, propDetail, specs))} style={{
                          background: "#1a2240", border: "1px solid #6b8afd22", color: "#6b8afd", borderRadius: 4,
                          padding: "4px 10px", fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                        }}>Generate Brief</button>
                        <div style={{ position: "relative" }}>
                          <StatusBadge status={status} onClick={e => { e.stopPropagation(); setShowStatusMenu(showStatusMenu === `${propDetail.id}-${asset.id}` ? null : `${propDetail.id}-${asset.id}`); }} />
                          {showStatusMenu === `${propDetail.id}-${asset.id}` && (
                            <StatusMenu current={status} onSelect={sid => setStatusDirect(propDetail.id, asset.id, sid)} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, paddingLeft: isMobile ? 0 : 30 }}>
                      {editLink ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <input value={linkInput} onChange={e => setLinkInput(e.target.value)} onKeyDown={e => e.key === "Enter" && saveLink(propDetail.id, asset.id)} placeholder="Paste link (Drive, Dropbox, Vimeo...)" autoFocus style={{ flex: 1, minWidth: 180, ...iStyle, fontSize: 11, padding: "5px 8px" }} />
                          <button onClick={() => saveLink(propDetail.id, asset.id)} style={{ background: "#1a2a1a", border: "1px solid #4ade8033", color: "#4ade80", borderRadius: 4, padding: "5px 10px", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
                          <button onClick={() => { setEditingLink(null); setLinkInput(""); }} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 4, padding: "5px 8px", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        </div>
                      ) : link ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#6b8afd", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 200 : 400 }}>{link.length > 55 ? link.slice(0, 55) + "..." : link}</a>
                          <button onClick={() => { setEditingLink(`${propDetail.id}-${asset.id}`); setLinkInput(link); }} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>edit</button>
                          <button onClick={() => setAssetLinks(prev => { const n = { ...prev }; delete n[`${propDetail.id}-${asset.id}`]; return n; })} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>remove</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingLink(`${propDetail.id}-${asset.id}`); setLinkInput(""); }} style={{ background: "none", border: "1px dashed #222", color: "#444", borderRadius: 4, padding: "4px 10px", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>+ Add link</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NOTES */}
          <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Notes & Feedback</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote(selectedProperty)} placeholder="Add a note..." style={{ flex: 1, ...iStyle }} />
              <button onClick={() => addNote(selectedProperty)} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#888", borderRadius: 4, padding: "8px 14px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
            </div>
            {propNotes.length === 0 ? <div style={{ fontSize: 12, color: "#333" }}>No notes yet</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[...propNotes].sort((a, b) => new Date(b.date) - new Date(a.date)).map((n, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{n.text}</div>
                    <div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>{new Date(n.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      /* ═══ DASHBOARD ═══ */
      ) : view === "dashboard" ? (
        <div style={{ padding: isMobile ? 16 : 24, maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <StatCard label="Total" value={stats.total} sub={`${properties?.length || 0} properties`} />
            <StatCard label="Approved" value={stats.done} color="#4ade80" sub={`${stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%`} />
            <StatCard label="In Progress" value={stats.inProg} color="#f0a030" />
            <StatCard label="Not Started" value={stats.notStarted} color="#555" />
          </div>
          <ProgressBar value={stats.done} max={stats.total} color="#4ade80" height={3} />

          {/* Search + Filters */}
          <div style={{ display: "flex", gap: 10, marginTop: 20, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search property or location..."
              style={{ ...iStyle, width: isMobile ? "100%" : 260, background: "#111", border: "1px solid #222" }}
            />
            <select value={filterZone} onChange={e => setFilterZone(e.target.value)} style={selStyle}><option value="all">All Zones</option>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selStyle}><option value="all">All Types</option>{types.map(t => <option key={t} value={t}>{t}</option>)}</select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selStyle}><option value="all">All Statuses</option><option value="not_started">Not Started</option><option value="in_progress">In Progress</option><option value="complete">Complete</option></select>
            {hasActiveFilters && (
              <button onClick={() => { setSearch(""); setFilterZone("all"); setFilterType("all"); setFilterStatus("all"); }} style={{ background: "none", border: "none", color: "#6b8afd", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Clear ({filteredProperties.length})</button>
            )}
          </div>

          {filteredProperties.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#444", fontSize: 13 }}>No property matches. <button onClick={() => { setSearch(""); setFilterZone("all"); setFilterType("all"); setFilterStatus("all"); }} style={{ background: "none", border: "none", color: "#6b8afd", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Clear filters</button></div>
          )}

          {isMobile ? (
            /* ── Mobile: stacked cards ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredProperties.map(prop => {
                const prog = getProgress(prop.id);
                return (
                  <div key={prop.id} onClick={() => setSelectedProperty(prop.id)} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 14px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13, color: "#ddd" }}>{prop.name}</div>
                        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{prop.location}</div>
                      </div>
                      <div style={{ fontSize: 11, color: prog === 5 ? "#4ade80" : "#666" }}>{prog}/5</div>
                    </div>
                    <div style={{ marginTop: 8 }}><ProgressBar value={prog} max={5} color={prog === 5 ? "#4ade80" : "#6b8afd"} height={3} /></div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                      {ASSET_TYPES.map(a => { const c = STATUSES.find(x => x.id === getStatus(prop.id, a.id)); return (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: c?.color || "#333" }} />
                          <span style={{ fontSize: 8, color: "#444" }}>{a.short}</span>
                        </div>
                      ); })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Desktop: grid table ── */
            <>
              <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 120px repeat(5, 92px)", padding: "8px 12px", borderBottom: "1px solid #1a1a1a" }}>
                <div style={{ fontSize: 10, color: "#444" }}>#</div>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase" }}>Property</div>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase" }}>Progress</div>
                {ASSET_TYPES.map(a => <div key={a.id} style={{ fontSize: 10, color: "#444", textAlign: "center", textTransform: "uppercase" }}>{a.short}</div>)}
              </div>
              {filteredProperties.map(prop => {
                const prog = getProgress(prop.id);
                return (
                  <div key={prop.id} onClick={() => setSelectedProperty(prop.id)} style={{ display: "grid", gridTemplateColumns: "36px 1fr 120px repeat(5, 92px)", padding: "10px 12px", borderBottom: "1px solid #111", alignItems: "center", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#111"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontSize: 11, color: "#444" }}>{prop.id}</div>
                    <div>
                      <div style={{ fontSize: 13, color: "#ddd" }}>{prop.name}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: "#555" }}>{prop.location}</span>
                        <span style={{ fontSize: 9, color: TYPE_COLORS[prop.type] || "#555", background: (TYPE_COLORS[prop.type] || "#555") + "15", padding: "1px 5px", borderRadius: 3 }}>{prop.type}</span>
                      </div>
                    </div>
                    <div style={{ paddingRight: 12 }}><ProgressBar value={prog} max={5} color={prog === 5 ? "#4ade80" : "#6b8afd"} height={3} /><div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>{prog}/5</div></div>
                    {ASSET_TYPES.map(asset => {
                      const key = `dash-${prop.id}-${asset.id}`;
                      return (
                        <div key={asset.id} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, position: "relative" }} onClick={e => e.stopPropagation()}>
                          <StatusBadge status={getStatus(prop.id, asset.id)} small onClick={e => { e.stopPropagation(); setShowStatusMenu(showStatusMenu === key ? null : key); }} />
                          {getLink(prop.id, asset.id) && <span style={{ fontSize: 9, color: "#6b8afd" }}>🔗</span>}
                          {showStatusMenu === key && (
                            <StatusMenu current={getStatus(prop.id, asset.id)} onSelect={sid => setStatusDirect(prop.id, asset.id, sid)} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

      /* ═══ REPORTS (Pipeline + Zones merged) ═══ */
      ) : view === "reports" ? (
        <div style={{ padding: isMobile ? 16 : 24, maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "#111", borderRadius: 6, padding: 3, width: "fit-content" }}>
            {[{ id: "pipeline", label: "By Asset Type" }, { id: "zones", label: "By Zone" }].map(t => (
              <button key={t.id} onClick={() => setReportTab(t.id)} style={{
                background: reportTab === t.id ? "#1e1e1e" : "transparent", color: reportTab === t.id ? "#ddd" : "#555",
                border: "none", borderRadius: 4, padding: "6px 14px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              }}>{t.label}</button>
            ))}
          </div>

          {reportTab === "pipeline" ? (
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, flexDirection: isMobile ? "column" : "row" }}>
              {ASSET_TYPES.map(asset => {
                const byS = {}; STATUSES.forEach(s => { byS[s.id] = []; }); properties?.forEach(p => { byS[getStatus(p.id, asset.id)]?.push(p); });
                return (
                  <div key={asset.id} style={{ minWidth: isMobile ? "auto" : 200, flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#aaa", padding: "8px 12px", background: "#111", borderRadius: "6px 6px 0 0", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 8 }}><span>{asset.icon}</span> {asset.label}</div>
                    <div style={{ background: "#0e0e0e", borderRadius: "0 0 6px 6px", padding: 8 }}>
                      {STATUSES.map(st => (
                        <div key={st.id}>{byS[st.id].length > 0 && (<>
                          <div style={{ fontSize: 9, color: st.color, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 4px 4px" }}>{st.label} ({byS[st.id].length})</div>
                          {byS[st.id].map(p => (
                            <div key={p.id} onClick={() => setSelectedProperty(p.id)} style={{ padding: "6px 8px", marginBottom: 3, borderRadius: 4, background: st.bg, cursor: "pointer", fontSize: 11, color: "#bbb" }}>
                              <span style={{ color: "#555", marginRight: 6 }}>#{p.id}</span>{p.name}
                            </div>
                          ))}
                        </>)}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {zones.map(zone => {
                const zp = properties?.filter(p => p.zone === zone) || [];
                const zd = zp.reduce((a, p) => a + getProgress(p.id), 0);
                return (
                  <div key={zone} style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 14, color: "#ddd" }}>{zone} <span style={{ color: "#444", fontSize: 12 }}>({zp.length})</span></div>
                      <div style={{ fontSize: 11, color: "#555" }}>{zd}/{zp.length * 5}</div>
                    </div>
                    <ProgressBar value={zd} max={zp.length * 5} color="#6b8afd" height={3} />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8, marginTop: 10 }}>
                      {zp.map(p => (
                        <div key={p.id} onClick={() => setSelectedProperty(p.id)} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 14px", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "#333"} onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1a"}>
                          <div style={{ fontSize: 12, color: "#ccc" }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: "#555", marginTop: 2, marginBottom: 6 }}>{p.location}</div>
                          <div style={{ display: "flex", gap: 4 }}>
                            {ASSET_TYPES.map(a => { const c = STATUSES.find(x => x.id === getStatus(p.id, a.id)); return <div key={a.id} title={`${a.label}: ${c?.label}`} style={{ width: 8, height: 8, borderRadius: "50%", background: c?.color || "#333" }} />; })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
