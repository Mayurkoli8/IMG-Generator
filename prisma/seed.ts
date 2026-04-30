// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CAMPAIGN_TEMPLATES = [
  {
    campaignType: "new_year",
    label: "New Year Greeting",
    sortOrder: 1,
    promptPrefix:
      "Create a premium real estate New Year greeting Instagram post",
    styleHints: JSON.stringify({
      mood: "celebratory, aspirational, warm",
      colors: "gold, champagne, deep midnight blue",
      elements: "fireworks, stars, elegant typography, luxury feel",
      composition: "center-focused with decorative borders",
    }),
    keywords: "luxury, celebration, gold, premium, festive, elegant",
    examplePrompt: "Create a Happy New Year post with a luxury property backdrop",
  },
  {
    campaignType: "festival",
    label: "Festival Greeting",
    sortOrder: 2,
    promptPrefix: "Create a premium real estate festival greeting poster",
    styleHints: JSON.stringify({
      mood: "joyful, warm, culturally rich",
      colors: "vibrant festival colors with brand palette",
      elements: "festival motifs, warm lighting, elegant frame",
      composition: "balanced with festive decorative elements",
    }),
    keywords: "festival, celebration, traditional, vibrant, warm, festive",
    examplePrompt: "Create a Diwali greeting post for a luxury real estate brand",
  },
  {
    campaignType: "property_launch",
    label: "Property Launch",
    sortOrder: 3,
    promptPrefix: "Create a premium real estate property launch announcement poster",
    styleHints: JSON.stringify({
      mood: "exciting, exclusive, prestigious",
      colors: "deep navy, gold, white, premium tones",
      elements: "architectural render, skyline, city view, bold headline",
      composition: "hero image dominant with bold text overlay",
    }),
    keywords: "launch, new project, exclusive, premium, architectural, bold",
    examplePrompt: "Create a 2BHK luxury apartment launch post with city view",
  },
  {
    campaignType: "offer_promotion",
    label: "Offer / Promotion",
    sortOrder: 4,
    promptPrefix: "Create a compelling real estate offer promotion poster",
    styleHints: JSON.stringify({
      mood: "urgent, value-driven, exciting",
      colors: "strong contrast, red accent or brand color",
      elements: "price highlight, limited time badge, property visual",
      composition: "offer price prominent, clean layout with urgency",
    }),
    keywords: "offer, discount, limited time, deal, promotion, special",
    examplePrompt: "Create a special Diwali offer post - 10% off booking amount",
  },
  {
    campaignType: "site_visit",
    label: "Site Visit Invitation",
    sortOrder: 5,
    promptPrefix: "Create an elegant site visit invitation poster for a real estate project",
    styleHints: JSON.stringify({
      mood: "inviting, professional, warm",
      colors: "warm neutrals, brand colors, welcoming tones",
      elements: "site photo, date/time placeholder, map pin icon, welcoming copy",
      composition: "welcoming layout with clear CTA",
    }),
    keywords: "visit, invitation, open house, tour, explore, welcome",
    examplePrompt: "Invite prospects for a weekend site visit to our new project",
  },
  {
    campaignType: "possession",
    label: "Possession Update",
    sortOrder: 6,
    promptPrefix: "Create a joyful possession handover announcement poster for a real estate project",
    styleHints: JSON.stringify({
      mood: "joyful, proud, milestone",
      colors: "gold, warm tones, celebratory",
      elements: "keys, home, happy family, milestone ribbon",
      composition: "celebratory layout with milestone announcement",
    }),
    keywords: "possession, handover, keys, new home, milestone, delivery",
    examplePrompt: "Announce possession ceremony for Phase 1 of our project",
  },
  {
    campaignType: "milestone",
    label: "Milestone Announcement",
    sortOrder: 7,
    promptPrefix: "Create a proud milestone announcement poster for a real estate brand",
    styleHints: JSON.stringify({
      mood: "proud, confident, trustworthy",
      colors: "gold, dark navy, professional",
      elements: "trophy, number highlight, achievement visual",
      composition: "bold number/stat as hero element",
    }),
    keywords: "milestone, achievement, proud, trust, years, sold, completed",
    examplePrompt: "Announce 500 happy families milestone for the brand",
  },
  {
    campaignType: "brand_awareness",
    label: "Brand Awareness",
    sortOrder: 8,
    promptPrefix: "Create a premium brand awareness poster for a luxury real estate company",
    styleHints: JSON.stringify({
      mood: "aspirational, premium, trustworthy",
      colors: "brand primary colors, premium tones",
      elements: "lifestyle, luxury, architecture, tagline",
      composition: "clean brand-forward layout",
    }),
    keywords: "brand, trust, premium, luxury, lifestyle, quality, legacy",
    examplePrompt: "Create a brand post highlighting our commitment to quality",
  },
  {
    campaignType: "testimonial",
    label: "Testimonial Post",
    sortOrder: 9,
    promptPrefix: "Create an elegant testimonial / customer review social media poster",
    styleHints: JSON.stringify({
      mood: "trustworthy, warm, authentic",
      colors: "soft premium tones, brand colors",
      elements: "quote marks, customer photo placeholder, stars",
      composition: "quote-centered with clear attribution space",
    }),
    keywords: "testimonial, review, happy customer, trust, quote, 5 star",
    examplePrompt: "Show a customer review with 5 stars for our project",
  },
  {
    campaignType: "project_highlight",
    label: "Project Highlight",
    sortOrder: 10,
    promptPrefix: "Create a stunning project feature highlight poster for a real estate project",
    styleHints: JSON.stringify({
      mood: "impressive, detailed, aspirational",
      colors: "architectural tones, brand palette",
      elements: "amenity icons, project photo, feature list",
      composition: "feature grid or hero with callouts",
    }),
    keywords: "amenities, features, swimming pool, gym, clubhouse, premium",
    examplePrompt: "Highlight rooftop infinity pool and clubhouse of our project",
  },
  {
    campaignType: "construction_update",
    label: "Construction Progress",
    sortOrder: 11,
    promptPrefix: "Create a professional construction progress update poster",
    styleHints: JSON.stringify({
      mood: "professional, confident, transparent",
      colors: "professional blues, greys, brand accent",
      elements: "construction photo, progress bar, timeline, percentages",
      composition: "before/after or progress timeline layout",
    }),
    keywords: "construction, progress, on schedule, update, floors, completed",
    examplePrompt: "Show 60% construction completion update for Tower A",
  },
];

async function main() {
  console.log("🌱 Seeding campaign templates...");

  for (const template of CAMPAIGN_TEMPLATES) {
    await prisma.campaignTemplate.upsert({
      where: { campaignType: template.campaignType },
      update: template,
      create: template,
    });
  }

  console.log(`✅ Seeded ${CAMPAIGN_TEMPLATES.length} campaign templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
