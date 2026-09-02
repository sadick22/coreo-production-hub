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
  { id: "not_started", label: "Not Started", color: "#5b6384", bg: "rgba(91,99,132,0.15)" },
  { id: "brief_ready", label: "Brief Ready", color: "#6b8afd", bg: "rgba(107,138,253,0.12)" },
  { id: "in_production", label: "In Production", color: "#f0a030", bg: "rgba(240,160,48,0.12)" },
  { id: "in_review", label: "In Review", color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
  { id: "approved", label: "Approved", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
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
        const r = await storage.get(key);
        if (r && r.value) setData(JSON.parse(r.value)); else setData(defaultVal);
      } catch { setData(defaultVal); }
      setLoading(false);
    })();
  }, []);
  const update = useCallback(async (v) => {
    const val = typeof v === "function" ? v(data) : v;
    setData(val);
    try { await storage.set(key, JSON.stringify(val)); } catch (e) { console.error(e); }
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
    <div onClick={e => e.stopPropagation()} style={{ position: "absolute", [alignRight ? "right" : "left"]: 0, top: "110%", background: "linear-gradient(180deg,#101a3c,#0b1230)", border: "1px solid rgba(120,150,255,0.22)", borderRadius: 10, padding: 5, zIndex: 100, minWidth: 150, boxShadow: "0 12px 36px rgba(0,0,0,0.7)" }}>
      {STATUSES.map(st => (
        <button key={st.id} onClick={() => onSelect(st.id)} style={{ display: "block", width: "100%", textAlign: "left", background: current === st.id ? "rgba(120,150,255,0.1)" : "transparent", border: "none", color: st.color, padding: "8px 11px", fontSize: 11.5, cursor: "pointer", fontFamily: "inherit", borderRadius: 7 }}>
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
    <div className="brief-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="brief-modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div className="btitle">{brief.title}</div>
            <div className="bname">{brief.subtitle}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={copyAll} className={`copy-btn${copied ? " done" : ""}`}>{copied ? "Copied ✓" : "Copy Brief"}</button>
            <button onClick={onClose} className="close-btn">Close</button>
          </div>
        </div>
        {brief.sections.map((sec, i) => (
          <div key={i} className="bsec">
            <div className="bsec-h">{sec.heading}</div>
            <pre>{sec.content}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ───

export default function CoreoProductionHub() {
  const [properties, setProperties, p1] = usePersistedState("coreo-properties", INITIAL_PROPERTIES);
  const [assetStatuses, setAssetStatuses, p2] = usePersistedState("coreo-asset-statuses", {});
  const [propertySpecs, setPropertySpecs, p3] = usePersistedState("coreo-property-specs-v2", {});
  const [notes, setNotes, p4] = usePersistedState("coreo-notes", {});
  const [assetLinks, setAssetLinks, p5] = usePersistedState("coreo-asset-links", {});
  const [settings, setSettings, p6] = usePersistedState("coreo-settings", {});

  const isMobile = useIsMobile();
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState("dashboard");
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
  const [showAddModal, setShowAddModal] = useState(false);
  const emptyProp = { name: "", location: "", type: Object.keys(TYPE_COLORS)[0], zone: "The Pearl" };
  const [newProp, setNewProp] = useState(emptyProp);
  const ZONE_OPTIONS = ["The Pearl", "Central", "West Bay", "South", "North", "Downtown"];
  const addProperty = () => {
    const name = newProp.name.trim();
    if (!name) return;
    const id = (properties?.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
    setProperties(prev => [{ id, name, location: newProp.location.trim() || "—", type: newProp.type, zone: newProp.zone }, ...(prev || [])]);
    setShowAddModal(false); setNewProp(emptyProp);
  };
  const removeProperty = (id) => {
    const p = properties.find(x => x.id === id);
    if (!window.confirm(`Remove "${p?.name}" from the exclusive portfolio? This clears its tracking.`)) return;
    setProperties(prev => (prev || []).filter(x => x.id !== id));
    setAssetStatuses(prev => { const n = { ...prev }; ASSET_TYPES.forEach(a => delete n[`${id}-${a.id}`]); return n; });
  };

  const loading = p1 || p2 || p3 || p4 || p5 || p6;
  const getStatus = (pid, aid) => assetStatuses?.[`${pid}-${aid}`] || "not_started";
  const getLinks = (pid, aid) => assetLinks?.[`${pid}-${aid}`] || [];
  const setStatusDirect = (pid, aid, sid) => { setAssetStatuses(prev => ({ ...prev, [`${pid}-${aid}`]: sid })); setShowStatusMenu(null); };
  const saveLink = (pid, aid) => { if (!linkInput.trim()) return; setAssetLinks(prev => ({ ...prev, [`${pid}-${aid}`]: [...(prev?.[`${pid}-${aid}`] || []), linkInput.trim()] })); setEditingLink(null); setLinkInput(""); };
  const removeLink = (pid, aid, idx) => { setAssetLinks(prev => { const arr = [...(prev?.[`${pid}-${aid}`] || [])]; arr.splice(idx, 1); return { ...prev, [`${pid}-${aid}`]: arr }; }); };
  const detectLinkLabel = (url) => { if (!url) return "Link"; const u = url.toLowerCase(); if (u.includes("drive.google")) return "Drive"; if (u.includes("dropbox")) return "Dropbox"; if (u.includes("vimeo")) return "Vimeo"; if (u.includes("youtube") || u.includes("youtu.be")) return "YouTube"; if (u.includes("canva")) return "Canva"; if (u.includes(".pdf")) return "PDF"; if (u.includes("figma")) return "Figma"; return "Link"; };
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
  const iStyle = { width: "100%", background: "rgba(7,11,30,.6)", border: "1px solid rgba(120,150,255,.12)", color: "#eaf0ff", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
  const selStyle = { background: "rgba(7,11,30,.6)", color: "#aeb8e4", border: "1px solid rgba(120,150,255,.12)", borderRadius: 10, padding: "8px 12px", fontSize: 11, fontFamily: "inherit", cursor: "pointer" };

  const setSpec = (fieldId, val) => setPropertySpecs(prev => ({ ...prev, [selectedProperty]: { ...specs, [fieldId]: val } }));

  const renderField = (field) => (
    <div key={field.id} className="spec-field" style={field.multiline && editingSpecs ? { gridColumn: "1 / -1" } : {}}>
      <div className="flabel" style={{ color: field.essential ? "var(--ink-dim)" : "var(--ink-dim)" }}>
        {field.label}{field.essential && <span className="star">*</span>}
      </div>
      {editingSpecs ? (
        field.multiline ? (
          <textarea value={specs[field.id] || ""} onChange={e => setSpec(field.id, e.target.value)} placeholder={field.placeholder} rows={3} className="dinput" style={{ resize: "vertical" }} />
        ) : (
          <input value={specs[field.id] || ""} onChange={e => setSpec(field.id, e.target.value)} placeholder={field.placeholder} className="dinput" />
        )
      ) : (
        <div className={`fval${specs[field.id] ? "" : " empty"}`}>{specs[field.id] || "—"}</div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", color: "#ccc", fontFamily: "'Söhne', 'Helvetica Neue', sans-serif", background: "radial-gradient(1100px 600px at 82% -8%, rgba(63,179,203,0.06), transparent 60%), radial-gradient(900px 620px at 8% 10%, rgba(124,124,255,0.08), transparent 58%), linear-gradient(180deg,#0a0f26 0%, #070b1e 100%)", backgroundAttachment: "fixed" }} onClick={() => showStatusMenu && setShowStatusMenu(null)}>
      <BriefPanel brief={activeBrief} onClose={() => setActiveBrief(null)} />

      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap');
:root{
  --surface:rgba(20,30,68,0.55); --line:rgba(120,150,255,0.12); --line-2:rgba(120,150,255,0.22);
  --cyan:#3fb3cb; --cyan-2:#74ccdd; --ink:#eaf0ff; --ink-2:#aeb8e4; --ink-dim:#7581b0;
  --appr:#35f0a0; --warn:#ffb23e;
}
.nav,.nav *,.wrap,.wrap *,.overlay,.overlay *{box-sizing:border-box}
.nav{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:18px;padding:14px 22px;background:rgba(9,13,32,0.72);backdrop-filter:blur(18px);border-bottom:1px solid var(--line);font-family:'Inter',sans-serif}
.brand{display:flex;align-items:center;gap:12px}
.brand .name{font-family:'Space Grotesk';font-weight:600;font-size:17px;color:var(--ink)}
.brand .sub{font-size:11px;color:var(--ink-dim);margin-top:-2px}
.pills{display:flex;gap:6px;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}
.pill{font-size:12.5px;color:var(--ink-2);background:transparent;border:1px solid transparent;padding:8px 15px;border-radius:9px;cursor:pointer;font-family:inherit;transition:.18s}
.pill:hover{color:var(--ink);background:rgba(120,150,255,0.07)}
.pill.active{color:#04121a;background:linear-gradient(135deg,var(--cyan),#3d9bb5);box-shadow:0 0 15px rgba(34,211,238,.22);font-weight:600}
.nav-right{margin-left:auto;display:flex;align-items:center;gap:12px}
.btn-primary{font-family:inherit;font-size:12.5px;font-weight:600;color:#04121a;cursor:pointer;background:linear-gradient(135deg,var(--appr),var(--cyan));border:none;padding:10px 16px;border-radius:10px;display:flex;align-items:center;gap:7px;box-shadow:0 0 18px rgba(53,240,160,.22);transition:.18s}
.btn-primary:hover{transform:translateY(-1px)}
.wrap{position:relative;z-index:1;max-width:1400px;margin:0 auto;padding:20px 22px 60px;font-family:'Inter',sans-serif;color:var(--ink)}
.num{font-family:'Space Grotesk';font-variant-numeric:tabular-nums;font-weight:300;letter-spacing:-0.02em}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.kpi{position:relative;overflow:hidden;padding:20px 22px;border-radius:16px;background:var(--surface);border:1px solid var(--line);backdrop-filter:blur(10px)}
.kpi .lab{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-dim);font-weight:600}
.kpi .dot{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent)}
.kpi .big{font-size:44px;line-height:1;margin:14px 0 6px;color:var(--accent);text-shadow:0 0 22px var(--glow)}
.kpi .foot{font-size:12px;color:var(--ink-2)} .kpi .foot b{color:var(--ink)}
.track{height:5px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;margin-top:12px}
.track > i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--accent),var(--cyan-2))}
.grid{display:grid;grid-template-columns:1fr 372px;gap:18px;align-items:start}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:16px;backdrop-filter:blur(10px)}
.panel-h{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid var(--line)}
.panel-h .t{font-family:'Space Grotesk';font-size:14px;font-weight:600;display:flex;align-items:center;gap:9px}
.panel-h .t .ico{color:var(--cyan)}
.panel-h .meta{font-size:11px;color:var(--ink-dim)}
.filters{display:flex;gap:9px;padding:14px 18px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--line)}
.search{flex:1;min-width:170px;display:flex;align-items:center;gap:8px;background:rgba(7,11,30,.6);border:1px solid var(--line);border-radius:10px;padding:9px 12px}
.search input{flex:1;background:none;border:none;outline:none;color:var(--ink);font-family:inherit;font-size:13px}
.search input::placeholder{color:var(--ink-dim)}
.selx{background:rgba(7,11,30,.6);border:1px solid var(--line);color:var(--ink-2);border-radius:10px;padding:9px 12px;font-family:inherit;font-size:12.5px;cursor:pointer;outline:none}
.portfolio{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:13px;padding:16px 18px}
.card{position:relative;background:linear-gradient(180deg,rgba(16,24,56,.6),rgba(11,17,42,.5));border:1px solid var(--line);border-radius:14px;padding:15px;cursor:pointer;transition:.16s;overflow:visible}
.card:hover{border-color:var(--line-2);transform:translateY(-2px);box-shadow:0 12px 34px rgba(0,0,0,.4)}
.card .edge{position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--tc);border-radius:14px 0 0 14px;box-shadow:0 0 12px var(--tc)}
.tbadge{font-size:9.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--tc);background:color-mix(in srgb,var(--tc) 16%,transparent);padding:3px 8px;border-radius:6px;display:inline-block}
.card h3{font-family:'Space Grotesk';font-size:15px;font-weight:500;margin:11px 0 3px;line-height:1.25}
.card .loc{font-size:11.5px;color:var(--ink-dim)}
.strip{display:flex;gap:5px;margin-top:14px}
.seg{flex:1;text-align:center;cursor:pointer;position:relative}
.seg .bar{height:26px;border-radius:6px;transition:.18s}
.seg:hover .bar{transform:scaleY(1.1)}
.seg .cap{font-size:8.5px;color:var(--ink-dim);margin-top:5px;font-weight:600}
.cardfoot{display:flex;align-items:center;justify-content:space-between;margin-top:13px;padding-top:11px;border-top:1px solid var(--line)}
.remove{opacity:0;position:absolute;top:11px;right:11px;width:22px;height:22px;border-radius:6px;background:rgba(255,80,110,.14);border:1px solid rgba(255,80,110,.3);color:#ff8098;cursor:pointer;display:grid;place-items:center;font-size:13px;transition:.15s;z-index:5}
.card:hover .remove{opacity:1}
.add-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;border:1.5px dashed var(--line-2);border-radius:14px;cursor:pointer;color:var(--cyan);background:rgba(63,179,203,.04);min-height:100%;padding:24px;transition:.16s}
.add-card:hover{background:rgba(63,179,203,.09);border-color:var(--cyan)}
.add-card .plus{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:rgba(63,179,203,.12);font-size:22px}
.add-card span{font-size:12.5px;font-weight:600;font-family:'Space Grotesk'}
.add-card small{font-size:10.5px;color:var(--ink-dim);text-align:center}
.side{display:flex;flex-direction:column;gap:18px}
.pl-row{display:flex;align-items:center;gap:11px;padding:11px 18px}
.pl-row .plname{width:44px;flex-shrink:0;font-size:11.5px;color:var(--ink-2)}
.pl-bar{flex:1;height:16px;border-radius:5px;overflow:hidden;display:flex;background:#5b6384}
.pl-bar > i{height:100%;transition:width .5s ease}
.pl-row .tot{width:26px;text-align:right;font-family:'Space Grotesk';font-size:12px;color:var(--ink-dim)}
.legend{display:flex;flex-wrap:wrap;gap:10px 14px;padding:13px 18px 16px;border-top:1px solid var(--line)}
.legend span{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--ink-dim)}
.legend i{width:9px;height:9px;border-radius:3px}
.zrow{padding:11px 18px}
.zrow .zt{display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px}
.zrow .zt .zn{color:var(--ink-2)} .zrow .zt .zc{color:var(--ink-dim);font-family:'Space Grotesk'}
.zbar{height:6px;border-radius:3px;background:#5b6384;overflow:hidden}
.zbar>i{display:block;height:100%;background:linear-gradient(90deg,#7c7cff,var(--cyan))}
.att{padding:10px 18px 16px}
.att-item{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--line)}
.att-item:last-child{border-bottom:none}
.att-item .flag{width:8px;height:8px;border-radius:50%;background:var(--warn);box-shadow:0 0 10px var(--warn);flex-shrink:0}
.att-item .n{font-size:12.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.att-item .r{font-size:10.5px;color:var(--ink-dim)}
.overlay{position:fixed;inset:0;z-index:60;background:rgba(4,7,20,.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px}
.modal{width:100%;max-width:460px;background:linear-gradient(180deg,#101a3c,#0b1230);border:1px solid var(--line-2);border-radius:18px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.modal h2{font-size:19px;font-weight:600;margin-bottom:4px;font-family:'Space Grotesk';color:var(--ink)}
.modal .msub{font-size:12.5px;color:var(--ink-dim);margin-bottom:20px}
.field{margin-bottom:15px}
.field label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-dim);margin-bottom:6px;font-weight:600}
.field input,.field select{width:100%;background:rgba(7,11,30,.7);border:1px solid var(--line);color:var(--ink);border-radius:10px;padding:11px 13px;font-family:inherit;font-size:13.5px;outline:none}
.field input:focus,.field select:focus{border-color:var(--cyan)}
.modalact{display:flex;gap:10px;margin-top:22px}
.modalact button{flex:1;font-family:inherit;font-size:13px;font-weight:600;padding:12px;border-radius:11px;cursor:pointer}
.b-cancel{background:transparent;border:1px solid var(--line-2);color:var(--ink-2)}
.b-add{background:linear-gradient(135deg,var(--appr),var(--cyan));border:none;color:#04121a}
.emptyx{padding:40px 20px;text-align:center;color:var(--ink-dim);grid-column:1/-1}
.linkx{color:var(--cyan);cursor:pointer;background:none;border:none;font-family:inherit;font-size:inherit}
.setg-h{font-family:'Space Grotesk';font-size:24px;font-weight:600;color:var(--ink);margin-bottom:4px}
.setg-sub{font-size:13px;color:var(--ink-dim);margin-bottom:22px}
.setg-card{padding:20px 22px;margin-bottom:16px}
.setg-sec{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--cyan);font-weight:600;margin-bottom:16px}
.setg-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 0;border-top:1px solid var(--line)}
.setg-row.first{border-top:none;padding-top:0}
.setg-label{font-size:14px;color:var(--ink)}
.setg-hint{font-size:11.5px;color:var(--ink-dim);margin-top:3px;max-width:360px}
.setg-logo{width:56px;height:56px;border-radius:12px;background:rgba(7,11,30,.6);border:1px solid var(--line);display:grid;place-items:center;overflow:hidden}
.setg-logo img{max-width:44px;max-height:44px;object-fit:contain}
.setg-btn{font-family:inherit;font-size:12.5px;font-weight:600;color:#04121a;background:linear-gradient(135deg,var(--appr),var(--cyan));border:none;border-radius:9px;padding:9px 14px;cursor:pointer;text-align:center;display:inline-block}
.setg-btn.ghost{background:transparent;border:1px solid var(--line-2);color:var(--ink-2)}
.setg-btn.danger{background:transparent;border:1px solid rgba(255,80,110,.4);color:#ff8098}
.setg-foot{font-size:11.5px;color:var(--ink-dim);text-align:center;margin-top:20px}

/* ── detail page ── */
.detail{max-width:960px;margin:0 auto;padding:20px 22px 60px;font-family:'Inter',sans-serif;color:var(--ink)}
.detail *{box-sizing:border-box}
.back{background:none;border:none;color:var(--ink-dim);cursor:pointer;font-size:12px;font-family:'Inter',sans-serif;padding:0;margin-bottom:20px;display:flex;align-items:center;gap:6px;transition:.15s}
.back:hover{color:var(--cyan)}
.dhero{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;gap:14px;flex-wrap:wrap}
.dhero .typeline{font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.dhero h1{font-family:'Space Grotesk';font-size:26px;font-weight:400;color:var(--ink);margin:0;letter-spacing:-.01em}
.dhero .subloc{font-size:13px;color:var(--ink-dim);margin-top:5px;display:flex;align-items:center;gap:6px}
.dhero .score{text-align:right}
.dhero .score .big{font-family:'Space Grotesk';font-size:42px;font-weight:300;letter-spacing:-.02em}
.dhero .score .lab{font-size:10px;color:var(--ink-dim);letter-spacing:.08em;text-transform:uppercase;margin-top:2px}
.dhero .mini-strip{display:flex;gap:4px;margin-top:10px;justify-content:flex-end}
.dhero .mini-strip i{width:18px;height:6px;border-radius:3px}
.dpanel{background:var(--surface);border:1px solid var(--line);border-radius:16px;backdrop-filter:blur(10px);margin-bottom:20px;overflow:hidden}
.dpanel-h{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--line);flex-wrap:wrap;gap:8px}
.dpanel-h .sec{font-size:11px;color:var(--ink-dim);letter-spacing:.12em;text-transform:uppercase;font-weight:600;display:flex;align-items:center;gap:9px}
.dpanel-h .sec .ico{color:var(--cyan);font-size:14px}
.dpanel-h .cnt{font-size:10px;color:var(--ink-dim)}
.dpanel-body{padding:20px}
.spec-toggle{display:flex;background:rgba(7,11,30,.6);border-radius:8px;border:1px solid var(--line);overflow:hidden}
.spec-toggle button{background:transparent;color:var(--ink-dim);border:none;padding:5px 12px;font-size:10.5px;cursor:pointer;font-family:inherit;transition:.15s}
.spec-toggle button.on{background:rgba(120,150,255,.12);color:var(--ink)}
.edit-btn{background:transparent;border:1px solid var(--line-2);color:var(--ink-dim);border-radius:8px;padding:4px 14px;font-size:10.5px;cursor:pointer;font-family:inherit;transition:.15s}
.edit-btn.editing{background:rgba(53,240,160,.1);border-color:rgba(53,240,160,.3);color:var(--appr)}
.cat-tabs{display:flex;gap:0;border-bottom:1px solid var(--line);overflow-x:auto}
.cat-tab{background:transparent;color:var(--ink-dim);border:none;border-bottom:2px solid transparent;padding:10px 14px;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:.15s}
.cat-tab:hover{color:var(--ink-2)}
.cat-tab.on{color:var(--ink);border-bottom-color:var(--cyan)}
.cat-tab .cnt2{color:var(--appr);font-size:9px;margin-left:4px}
.spec-hint{font-size:10.5px;color:var(--ink-dim);margin-bottom:14px}
.spec-grid{display:grid;gap:12px}
.spec-field .flabel{font-size:10px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;display:flex;align-items:center;gap:4px}
.spec-field .flabel .star{color:var(--cyan)}
.spec-field .fval{font-size:13px;color:var(--ink);line-height:1.5}
.spec-field .fval.empty{color:var(--ink-dim);opacity:.35}
.dinput{width:100%;background:rgba(7,11,30,.6);border:1px solid var(--line);color:var(--ink);border-radius:10px;padding:9px 12px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box}
.dinput:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(63,179,203,.1)}
.dinput::placeholder{color:var(--ink-dim)}
.asset-row{background:linear-gradient(180deg,rgba(16,24,56,.5),rgba(11,17,42,.4));border:1px solid var(--line);border-radius:14px;padding:16px 20px;transition:.16s}
.asset-row:hover{border-color:var(--line-2)}
.asset-row .aheader{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.asset-row .aleft{display:flex;align-items:center;gap:14px}
.asset-row .aicon{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;font-size:20px;background:rgba(7,11,30,.5);border:1px solid var(--line)}
.asset-row .aname{font-family:'Space Grotesk';font-size:14px;font-weight:500;color:var(--ink)}
.asset-row .awarn{font-size:10px;color:var(--warn);margin-top:3px;display:flex;align-items:center;gap:5px}
.asset-row .aright{display:flex;align-items:center;gap:8px}
.brief-btn{background:rgba(63,179,203,.1);border:1px solid rgba(63,179,203,.25);color:var(--cyan);border-radius:9px;padding:6px 13px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:500;transition:.15s}
.brief-btn:hover{background:rgba(63,179,203,.18)}
.alink-area{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);padding-left:54px}
.link-btn{background:transparent;border:1px dashed var(--line-2);color:var(--ink-dim);border-radius:8px;padding:5px 12px;font-size:11px;cursor:pointer;font-family:inherit}
.link-btn:hover{border-color:var(--cyan);color:var(--cyan)}
.link-save{background:rgba(53,240,160,.1);border:1px solid rgba(53,240,160,.3);color:var(--appr);border-radius:8px;padding:5px 12px;font-size:11px;cursor:pointer;font-family:inherit}
.link-cancel{background:transparent;border:1px solid var(--line-2);color:var(--ink-dim);border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:inherit}
.link-url{font-size:11.5px;color:var(--cyan);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block}
.link-url:hover{text-decoration:underline}
.link-edit{background:none;border:none;color:var(--ink-dim);cursor:pointer;font-size:10px;font-family:inherit}
.link-edit:hover{color:var(--ink)}
.notes-input{display:flex;gap:8px}
.note-add{background:rgba(120,150,255,.1);border:1px solid var(--line-2);color:var(--ink-2);border-radius:10px;padding:9px 16px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:500;transition:.15s}
.note-add:hover{background:rgba(120,150,255,.16)}
.note-item{padding:10px 0;border-bottom:1px solid var(--line)}
.note-item:last-child{border-bottom:none}
.note-text{font-size:12.5px;color:var(--ink-2);line-height:1.5}
.note-date{font-size:10px;color:var(--ink-dim);margin-top:4px}
.brief-overlay{position:fixed;inset:0;background:rgba(4,7,20,.82);backdrop-filter:blur(6px);z-index:1000;display:flex;justify-content:center;overflow-y:auto;padding:40px 16px}
.brief-modal{background:linear-gradient(180deg,#101a3c,#0b1230);border:1px solid var(--line-2);border-radius:18px;max-width:720px;width:100%;padding:28px;align-self:flex-start;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.brief-modal .btitle{font-size:10px;letter-spacing:.15em;color:var(--cyan);text-transform:uppercase;margin-bottom:4px}
.brief-modal .bname{font-family:'Space Grotesk';font-size:22px;font-weight:400;color:var(--ink)}
.brief-modal .copy-btn{background:rgba(63,179,203,.12);border:1px solid rgba(63,179,203,.25);color:var(--cyan);border-radius:9px;padding:7px 16px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:500}
.brief-modal .copy-btn.done{background:rgba(53,240,160,.12);border-color:rgba(53,240,160,.3);color:var(--appr)}
.brief-modal .close-btn{background:transparent;border:1px solid var(--line-2);color:var(--ink-dim);border-radius:9px;padding:7px 14px;font-size:11px;cursor:pointer;font-family:inherit}
.brief-modal .bsec{margin-bottom:22px}
.brief-modal .bsec-h{font-size:10px;letter-spacing:.12em;color:var(--ink-dim);text-transform:uppercase;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid var(--line)}
.brief-modal pre{font-family:'SF Mono','Menlo','Consolas',monospace;font-size:12px;color:var(--ink-2);white-space:pre-wrap;line-height:1.7;margin:0;background:rgba(7,11,30,.6);padding:16px;border-radius:10px;border:1px solid var(--line)}

.dcols{display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start}
.dcmd{display:flex;align-items:center;gap:14px;padding:14px 18px;background:var(--surface);border:1px solid var(--line);border-radius:14px;margin-bottom:18px}
.dcmd .dedge{width:3px;height:44px;border-radius:2px;flex-shrink:0}
.dcmd .dinfo{flex:1;min-width:0}
.dcmd .tline{display:flex;align-items:center;gap:8px;margin-bottom:3px}
.dcmd .nm{font-family:'Space Grotesk';font-size:18px;font-weight:500;letter-spacing:-.01em}
.dcmd .dloc{font-size:11px;color:var(--ink-dim);margin-top:2px}
.dcmd .dright{display:flex;align-items:center;gap:14px}
.dcmd .dscore{text-align:center}
.dcmd .dscore .dbig{font-family:'Space Grotesk';font-size:30px;font-weight:300;letter-spacing:-.02em}
.dcmd .dscore .dbig span{font-size:15px;color:var(--ink-dim)}
.dcmd .dscore .dlab{font-size:8.5px;color:var(--ink-dim);text-transform:uppercase;letter-spacing:.08em}
.dmini{display:flex;gap:3px}
.dmini i{width:14px;height:5px;border-radius:3px}
.rpanel{background:var(--surface);border:1px solid var(--line);border-radius:14px;margin-bottom:14px;overflow:hidden}
.rpanel .rh{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--line);flex-wrap:wrap;gap:6px}
.rpanel .rh .rsec{font-size:10px;color:var(--ink-dim);letter-spacing:.1em;text-transform:uppercase;font-weight:600;display:flex;align-items:center;gap:7px}
.rpanel .rh .rsec .rico{color:var(--cyan);font-size:13px}
.rpanel .rbody{padding:12px 14px;max-height:420px;overflow-y:auto}
.rpanel .rbody::-webkit-scrollbar{width:4px}
.rpanel .rbody::-webkit-scrollbar-thumb{background:rgba(120,150,255,.2);border-radius:2px}
.sgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px}
.sf .sfl{font-size:9px;color:var(--ink-dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:1px}
.sf .sfl .star{color:var(--cyan)}
.sf .sfv{font-size:12px;color:var(--ink);line-height:1.4}
.sf .sfv.empty{color:var(--ink-dim);opacity:.3}
.lklist{margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}
.lkrow{display:flex;align-items:center;gap:7px;padding:3px 0}
.lktag{font-size:8.5px;font-weight:600;color:var(--cyan);background:rgba(63,179,203,0.1);padding:2px 6px;border-radius:4px;letter-spacing:.03em;flex-shrink:0}
.lkurl{font-size:11px;color:var(--cyan-2);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:none}
.lkurl:hover{text-decoration:underline}
.lkdel{background:none;border:none;color:var(--ink-dim);cursor:pointer;font-size:11px;padding:2px;flex-shrink:0}
.lkdel:hover{color:#ff8098}
.lkadd{font-size:10px;color:var(--ink-dim);margin-top:6px}
.lkadd span{border:1px dashed var(--line-2);border-radius:7px;padding:3px 10px;cursor:pointer;transition:.15s}
.lkadd span:hover{border-color:var(--cyan);color:var(--cyan)}
@media (max-width:800px){.dcols{grid-template-columns:1fr}}
@media (max-width:1080px){.grid{grid-template-columns:1fr}.side{flex-direction:row;flex-wrap:wrap}.side>.panel{flex:1;min-width:280px}}
@media (max-width:760px){.kpis{grid-template-columns:repeat(2,1fr)}.pills{display:none}}
@media (prefers-reduced-motion:reduce){.card,.seg .bar,.pl-bar>i,.btn-primary,.pill{transition:none!important}}
`}</style>

      {/* Header */}
      <div className="nav">
        <div className="brand">
          <img src={settings?.logoUrl || "https://mycoreo.com/coreo-logo.png"} alt="Coreo" style={{ height: 26, display: "block" }} />
          <div style={{ width: 1, height: 18, background: "var(--line-2)" }} />
          <div>
            <div className="name">Production <span style={{ color: "var(--cyan)" }}>Hub</span></div>
            <div className="sub">Exclusive property marketing assets</div>
          </div>
        </div>
        <div className="pills">
          {[{ id: "dashboard", label: "Dashboard" }, { id: "settings", label: "Settings" }].map(v => (
            <button key={v.id} className={"pill" + ((view === v.id && !selectedProperty) ? " active" : "")} onClick={() => { setView(v.id); setSelectedProperty(null); }}>{v.label}</button>
          ))}
        </div>
        <div className="nav-right">
          <button className="btn-primary" onClick={() => setShowAddModal(true)}><span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add Exclusive Property</button>
        </div>
      </div>

      {/* ═══ PROPERTY DETAIL ═══ */}
      {selectedProperty && propDetail ? (
        <div className="detail">
          <button className="back" onClick={() => { setSelectedProperty(null); setEditingSpecs(false); }}>← Back to portfolio</button>

          <div className="dcmd">
            <div className="dedge" style={{ background: TYPE_COLORS[propDetail.type] || "var(--ink-dim)", boxShadow: `0 0 10px ${TYPE_COLORS[propDetail.type] || "transparent"}` }} />
            <div className="dinfo">
              <div className="tline">
                <span style={{ color: TYPE_COLORS[propDetail.type] || "var(--ink-dim)", fontSize: 11 }}>#{propDetail.id}</span>
                <span className="tbadge" style={{ "--tc": TYPE_COLORS[propDetail.type] || "var(--ink-dim)" }}>{propDetail.type}</span>
              </div>
              <div className="nm">{propDetail.name}</div>
              <div className="dloc">⚲ {propDetail.location} · {propDetail.zone}</div>
            </div>
            <div className="dright">
              <div className="dmini">
                {ASSET_TYPES.map(a => {
                  const ok = getStatus(propDetail.id, a.id) === "approved";
                  return <i key={a.id} style={{ background: ok ? "#0e1d60" : "#5b6384", border: ok ? "1px solid rgba(130,150,220,0.6)" : "1px solid transparent" }} title={`${a.short} — ${ok ? "Approved" : "Not done"}`} />;
                })}
              </div>
              <div className="dscore">
                <div className="dbig" style={{ color: getProgress(propDetail.id) === 5 ? "var(--appr)" : "var(--cyan)" }}>{getProgress(propDetail.id)}<span>/5</span></div>
                <div className="dlab">Approved</div>
              </div>
            </div>
          </div>

          <div className="dcols">
            <div>
              <div className="dpanel-h" style={{ border: "none", padding: "0 0 10px" }}>
                <div className="sec"><span className="ico">▸</span> Assets & briefs</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ASSET_TYPES.map(asset => {
                  const status = getStatus(propDetail.id, asset.id);
                  const blocked = isBlocked(propDetail.id, asset.id);
                  const links = getLinks(propDetail.id, asset.id);
                  const isAdding = editingLink === `add-${propDetail.id}-${asset.id}`;
                  return (
                    <div key={asset.id} className="asset-row">
                      <div className="aheader">
                        <div className="aleft">
                          <div className="aicon">{asset.icon}</div>
                          <div>
                            <div className="aname">{asset.label}</div>
                            {blocked && status === "not_started" && <div className="awarn">⚠ Photos not approved yet — production usually starts after</div>}
                          </div>
                        </div>
                        <div className="aright">
                          <button className="brief-btn" onClick={() => setActiveBrief(generateBrief(asset.id, propDetail, specs))}>Generate brief</button>
                          <div style={{ position: "relative" }}>
                            <StatusBadge status={status} onClick={e => { e.stopPropagation(); setShowStatusMenu(showStatusMenu === `${propDetail.id}-${asset.id}` ? null : `${propDetail.id}-${asset.id}`); }} />
                            {showStatusMenu === `${propDetail.id}-${asset.id}` && (
                              <StatusMenu current={status} onSelect={sid => setStatusDirect(propDetail.id, asset.id, sid)} />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="lklist">
                        {links.map((lk, li) => (
                          <div key={li} className="lkrow">
                            <span className="lktag">{detectLinkLabel(lk)}</span>
                            <a href={lk} target="_blank" rel="noopener noreferrer" className="lkurl">{lk.replace(/^https?:\/\//, "").slice(0, 55)}{lk.length > 62 ? "..." : ""}</a>
                            <button className="lkdel" title="Remove link" onClick={() => removeLink(propDetail.id, asset.id, li)}>×</button>
                          </div>
                        ))}
                        {isAdding ? (
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                            <input value={linkInput} onChange={e => setLinkInput(e.target.value)} onKeyDown={e => e.key === "Enter" && saveLink(propDetail.id, asset.id)} placeholder="Paste link (Drive, Dropbox, Vimeo...)" autoFocus className="dinput" style={{ flex: 1, minWidth: 160, fontSize: 11, padding: "6px 10px" }} />
                            <button className="link-save" onClick={() => saveLink(propDetail.id, asset.id)}>Save</button>
                            <button className="link-cancel" onClick={() => { setEditingLink(null); setLinkInput(""); }}>Cancel</button>
                          </div>
                        ) : (
                          <div className="lkadd"><span onClick={() => { setEditingLink(`add-${propDetail.id}-${asset.id}`); setLinkInput(""); }}>+ Add link</span></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="rpanel">
                <div className="rh">
                  <div className="rsec"><span className="rico">◇</span> Specs <span style={{ fontWeight: 400, color: "var(--ink-dim)", fontSize: 9, marginLeft: 4 }}>{specMode === "essential" ? `${essFilled}/${ESSENTIAL_FIELDS.length}` : `${filledCount}/${ALL_SPEC_IDS.length}`}</span></div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <div className="spec-toggle">
                      {[{ id: "essential", label: "Essentials" }, { id: "all", label: "All" }].map(m => (
                        <button key={m.id} className={specMode === m.id ? "on" : ""} onClick={() => setSpecMode(m.id)}>{m.label}</button>
                      ))}
                    </div>
                    <button className={`edit-btn${editingSpecs ? " editing" : ""}`} onClick={() => setEditingSpecs(!editingSpecs)}>{editingSpecs ? "Done ✓" : "Edit"}</button>
                  </div>
                </div>
                <div className="rbody">
                  {specMode === "essential" ? (
                    <div className="sgrid" style={editingSpecs ? { gridTemplateColumns: "1fr" } : {}}>
                      {ESSENTIAL_FIELDS.map(field => (
                        <div key={field.id} className="sf">
                          <div className="sfl">{field.label}{field.essential && <span className="star">*</span>}</div>
                          {editingSpecs ? (
                            field.multiline ? <textarea value={specs[field.id] || ""} onChange={e => setSpec(field.id, e.target.value)} placeholder={field.placeholder} rows={2} className="dinput" style={{ resize: "vertical", fontSize: 11, padding: "6px 8px" }} />
                            : <input value={specs[field.id] || ""} onChange={e => setSpec(field.id, e.target.value)} placeholder={field.placeholder} className="dinput" style={{ fontSize: 11, padding: "6px 8px" }} />
                          ) : (
                            <div className={`sfv${specs[field.id] ? "" : " empty"}`}>{specs[field.id] || "—"}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="cat-tabs" style={{ margin: "-12px -14px 10px", padding: 0 }}>
                        {SPEC_CATEGORIES.map(cat => {
                          const filled = cat.fields.filter(f => specs[f.id]).length;
                          return (
                            <button key={cat.id} className={`cat-tab${specTab === cat.id ? " on" : ""}`} onClick={() => setSpecTab(cat.id)} style={{ fontSize: 10, padding: "8px 10px" }}>
                              {cat.label} {filled > 0 && <span className="cnt2">{filled}</span>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="sgrid" style={editingSpecs ? { gridTemplateColumns: "1fr" } : {}}>
                        {SPEC_CATEGORIES.filter(c => c.id === specTab).map(cat =>
                          cat.fields.map(field => (
                            <div key={field.id} className="sf" style={field.multiline && editingSpecs ? { gridColumn: "1 / -1" } : {}}>
                              <div className="sfl">{field.label}{field.essential && <span className="star">*</span>}</div>
                              {editingSpecs ? (
                                field.multiline ? <textarea value={specs[field.id] || ""} onChange={e => setSpec(field.id, e.target.value)} placeholder={field.placeholder} rows={2} className="dinput" style={{ resize: "vertical", fontSize: 11, padding: "6px 8px" }} />
                                : <input value={specs[field.id] || ""} onChange={e => setSpec(field.id, e.target.value)} placeholder={field.placeholder} className="dinput" style={{ fontSize: 11, padding: "6px 8px" }} />
                              ) : (
                                <div className={`sfv${specs[field.id] ? "" : " empty"}`}>{specs[field.id] || "—"}</div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="rpanel">
                <div className="rh">
                  <div className="rsec"><span className="rico">✎</span> Notes</div>
                </div>
                <div className="rbody">
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote(selectedProperty)} placeholder="Add a note…" className="dinput" style={{ flex: 1, fontSize: 11, padding: "6px 10px" }} />
                    <button className="note-add" style={{ padding: "6px 10px", fontSize: 10 }} onClick={() => addNote(selectedProperty)}>Add</button>
                  </div>
                  {propNotes.length === 0 ? <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>No notes yet</div> : (
                    <div>
                      {[...propNotes].sort((a, b) => new Date(b.date) - new Date(a.date)).map((n, i) => (
                        <div key={i} className="note-item">
                          <div className="note-text" style={{ fontSize: 11 }}>{n.text}</div>
                          <div className="note-date">{new Date(n.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      /* ═══ DASHBOARD ═══ */
      ) : view === "dashboard" ? (
        <div className="wrap">
          {(() => {
            const total = stats.total, done = stats.done;
            const pct = total ? Math.round(done / total * 100) : 0;
            const attention = (properties || []).filter(p => getStatus(p.id, "photos") === "approved" && ["teaser","overview","brochure","listing"].some(k => getStatus(p.id, k) !== "approved")).length;
            const kpi = [
              { lab: "Exclusive Properties", big: properties?.length || 0, accent: "var(--cyan)", glow: "rgba(63,179,203,.28)", foot: `across <b>${zones.length}</b> zones` },
              { lab: "Total Assets", big: total, accent: "#8fa4ff", glow: "rgba(124,124,255,.28)", foot: "5 per property" },
              { lab: "Approved", big: done, accent: "var(--appr)", glow: "rgba(53,240,160,.28)", foot: `<b>${pct}%</b> of portfolio complete`, bar: pct },
              { lab: "Needs Attention", big: attention, accent: "var(--warn)", glow: "rgba(255,178,62,.25)", foot: "photos done, follow-ups pending" },
            ];
            return (
              <div className="kpis">
                {kpi.map((k, i) => (
                  <div key={i} className="kpi" style={{ "--accent": k.accent, "--glow": k.glow }}>
                    <div className="lab"><span className="dot" />{k.lab}</div>
                    <div className="big num">{k.big}</div>
                    <div className="foot" dangerouslySetInnerHTML={{ __html: k.foot }} />
                    {k.bar !== undefined && <div className="track"><i style={{ width: k.bar + "%" }} /></div>}
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="grid">
            <div className="panel">
              <div className="panel-h">
                <div className="t"><span className="ico">◈</span> Exclusive Portfolio</div>
                <div className="meta">{filteredProperties.length} shown · {properties?.length || 0} total</div>
              </div>
              <div className="filters">
                <div className="search"><span style={{ color: "var(--ink-dim)" }}>⌕</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search property or location…" />
                </div>
                <select className="selx" value={filterZone} onChange={e => setFilterZone(e.target.value)}><option value="all">All zones</option>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select>
                <select className="selx" value={filterType} onChange={e => setFilterType(e.target.value)}><option value="all">All types</option>{types.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <select className="selx" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">All statuses</option><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="complete">Complete</option></select>
                {hasActiveFilters && <button className="linkx" onClick={() => { setSearch(""); setFilterZone("all"); setFilterType("all"); setFilterStatus("all"); }}>Clear</button>}
              </div>
              <div className="portfolio">
                {filteredProperties.length === 0 && (
                  <div className="emptyx"><b style={{ color: "var(--ink-2)", fontFamily: "'Space Grotesk'", display: "block", marginBottom: 5 }}>No property matches</b>Try a different search or zone. <button className="linkx" onClick={() => { setSearch(""); setFilterZone("all"); setFilterType("all"); setFilterStatus("all"); }}>Clear filters</button></div>
                )}
                {filteredProperties.map(prop => {
                  const doneCount = getProgress(prop.id);
                  const tcol = TYPE_COLORS[prop.type] || "#7581b0";
                  return (
                    <div key={prop.id} className="card" style={{ "--tc": tcol }} onClick={() => setSelectedProperty(prop.id)}>
                      <div className="edge" />
                      <button className="remove" title="Remove property" onClick={e => { e.stopPropagation(); removeProperty(prop.id); }}>×</button>
                      <div className="tbadge">{prop.type}</div>
                      <h3>{prop.name}</h3>
                      <div className="loc">⚲ {prop.location} · {prop.zone}</div>
                      <div className="strip">
                        {ASSET_TYPES.map(asset => {
                          const key = `dash-${prop.id}-${asset.id}`;
                          const ok = getStatus(prop.id, asset.id) === "approved";
                          return (
                            <div key={asset.id} className="seg" title={`${asset.label} — ${ok ? "Approved" : "Not done"}`} onClick={e => { e.stopPropagation(); setShowStatusMenu(showStatusMenu === key ? null : key); }}>
                              <div className="bar" style={{ background: ok ? "#0e1d60" : "#5b6384", border: ok ? "1px solid rgba(130,150,220,0.6)" : "1px solid transparent" }} />
                              <div className="cap">{asset.short}</div>
                              {showStatusMenu === key && <StatusMenu current={getStatus(prop.id, asset.id)} onSelect={sid => setStatusDirect(prop.id, asset.id, sid)} alignRight={false} />}
                            </div>
                          );
                        })}
                      </div>
                      <div className="cardfoot">
                        <div style={{ fontFamily: "'Space Grotesk'", fontSize: 13 }}><b style={{ color: "var(--appr)" }}>{doneCount}</b>/5 <span style={{ fontSize: 10, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: ".08em", marginLeft: 4 }}>Approved</span></div>
                        <div style={{ fontSize: 10, color: "var(--ink-dim)" }}>#{prop.id}</div>
                      </div>
                    </div>
                  );
                })}
                <div className="add-card" onClick={() => setShowAddModal(true)}>
                  <div className="plus">+</div><span>Add Exclusive Property</span><small>New listing to track through production</small>
                </div>
              </div>
            </div>

            <div className="side">
              <div className="panel">
                <div className="panel-h"><div className="t"><span className="ico">▤</span> Production Pipeline</div><div className="meta">approved by asset</div></div>
                <div style={{ padding: "6px 0" }}>
                  {ASSET_TYPES.map(a => {
                    const tot = properties?.length || 1;
                    const cnt = (properties || []).filter(p => getStatus(p.id, a.id) === "approved").length;
                    return (
                      <div key={a.id} className="pl-row">
                        <div className="plname">{a.short}</div>
                        <div className="pl-bar"><i style={{ width: (cnt / tot * 100) + "%", background: "#0e1d60", borderRight: "1px solid rgba(130,150,220,0.5)" }} /></div>
                        <div className="tot">{cnt}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="legend"><span><i style={{ background: "#5b6384" }} />Not done</span><span><i style={{ background: "#0e1d60", border: "1px solid rgba(130,150,220,0.6)" }} />Approved</span></div>
              </div>

              <div className="panel">
                <div className="panel-h"><div className="t"><span className="ico">◱</span> Zones</div><div className="meta">{zones.length} active</div></div>
                <div style={{ padding: "8px 0 10px" }}>
                  {(() => {
                    const map = {}; (properties || []).forEach(p => { map[p.zone] = (map[p.zone] || 0) + 1; });
                    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
                    const max = Math.max(...entries.map(e => e[1]), 1);
                    return entries.map(([z, c]) => (
                      <div key={z} className="zrow"><div className="zt"><span className="zn">{z}</span><span className="zc">{c}</span></div><div className="zbar"><i style={{ width: (c / max * 100) + "%" }} /></div></div>
                    ));
                  })()}
                </div>
              </div>

              <div className="panel">
                <div className="panel-h"><div className="t"><span className="ico">▲</span> Needs Attention</div><div className="meta">stalled after photos</div></div>
                <div className="att">
                  {(() => {
                    const items = (properties || []).filter(p => getStatus(p.id, "photos") === "approved" && ["teaser","overview","brochure","listing"].some(k => getStatus(p.id, k) !== "approved"))
                      .map(p => ({ p, idle: ["teaser","overview","brochure","listing"].filter(k => getStatus(p.id, k) !== "approved").length }))
                      .sort((a, b) => b.idle - a.idle).slice(0, 6);
                    if (!items.length) return <div style={{ color: "var(--ink-dim)", fontSize: 12, padding: "8px 0" }}>Nothing stalled. Every property with approved photos has its follow-ups done too.</div>;
                    return items.map(({ p, idle }) => (
                      <div key={p.id} className="att-item" onClick={() => setSelectedProperty(p.id)} style={{ cursor: "pointer" }}>
                        <div className="flag" />
                        <div style={{ flex: 1, minWidth: 0 }}><div className="n">{p.name}</div><div className="r">{p.location}</div></div>
                        <div style={{ fontSize: 11, color: "var(--warn)", fontFamily: "'Space Grotesk'" }}>{idle} left</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          {showAddModal && (
            <div className="overlay" onClick={e => { if (e.currentTarget === e.target) setShowAddModal(false); }}>
              <div className="modal">
                <h2>Add exclusive property</h2>
                <div className="msub">It joins the portfolio with all five assets set to Not Started.</div>
                <div className="field"><label>Property name</label><input value={newProp.name} onChange={e => setNewProp({ ...newProp, name: e.target.value })} placeholder="e.g. Porto Arabia – Tower 18" autoFocus /></div>
                <div className="field"><label>Location</label><input value={newProp.location} onChange={e => setNewProp({ ...newProp, location: e.target.value })} placeholder="e.g. Porto Arabia, The Pearl" /></div>
                <div className="field"><label>Type</label><select value={newProp.type} onChange={e => setNewProp({ ...newProp, type: e.target.value })}>{Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="field"><label>Zone</label><select value={newProp.zone} onChange={e => setNewProp({ ...newProp, zone: e.target.value })}>{ZONE_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}</select></div>
                <div className="modalact"><button className="b-cancel" onClick={() => setShowAddModal(false)}>Cancel</button><button className="b-add" onClick={addProperty}>Add property</button></div>
              </div>
            </div>
          )}
        </div>
            ) : view === "settings" ? (
        <div className="wrap">
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div className="setg-h">Settings</div>
            <div className="setg-sub">Branding and data for the Production Hub.</div>

            <div className="panel setg-card">
              <div className="setg-sec">Branding</div>
              <div className="setg-row first">
                <div>
                  <div className="setg-label">Logo</div>
                  <div className="setg-hint">PNG or SVG, shown in the top-left. Saved with your data.</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="setg-logo"><img src={settings?.logoUrl || "https://mycoreo.com/coreo-logo.png"} alt="logo" /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label className="setg-btn">Upload logo
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setSettings(prev => ({ ...(prev || {}), logoUrl: reader.result }));
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                    {settings?.logoUrl && <button className="setg-btn ghost" onClick={() => setSettings(prev => { const n = { ...(prev || {}) }; delete n.logoUrl; return n; })}>Reset to default</button>}
                  </div>
                </div>
              </div>
            </div>

            <div className="panel setg-card">
              <div className="setg-sec">Data</div>
              <div className="setg-row first">
                <div>
                  <div className="setg-label">Backup</div>
                  <div className="setg-hint">Download everything — properties, statuses, specs, notes, links — as a JSON file.</div>
                </div>
                <button className="setg-btn" onClick={() => {
                  const data = { properties, assetStatuses, propertySpecs, notes, assetLinks, settings };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                  a.download = `coreo-hub-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
                }}>Export JSON</button>
              </div>
              <div className="setg-row">
                <div>
                  <div className="setg-label">Reset statuses</div>
                  <div className="setg-hint">Sets every asset on every property back to Not Started. Specs, notes and links are kept.</div>
                </div>
                <button className="setg-btn danger" onClick={() => { if (window.confirm("Reset every asset on every property back to Not Started?")) setAssetStatuses({}); }}>Reset all statuses</button>
              </div>
            </div>

            <div className="setg-foot">Data is saved in this browser for now. Once Firebase is connected it will sync across devices and users.</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
