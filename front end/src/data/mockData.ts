export interface Product {
  id: string;
  _id?: string;
  name?: string;
  title: string;
  slug?: string;
  productCode?: string;
  productType?: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number | null;
  compareAtPrice?: number | null;
  rating: number | null;
  reviews: number;
  reviewsCount?: number;
  category: string;
  categorySlug?: string;
  subcategory?: string;
  license?: string;
  licenceType?: string;
  licenceTerms?: string;
  coverImage?: string;
  thumbnail?: string;
  tags?: string[];
  features?: string[];
  includedFiles?: string[];
  softwareRequired?: string;
  requirements?: any;
  version?: string;
  isHot?: boolean;
  googleDriveFileId?: string;
  driveFileSize?: string;
  driveMimeType?: string;
  galleryImages?: string[];
  previewImages?: any;
  status?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  bestSeller?: boolean;
  featured?: boolean;
  downloadLimit?: number;
  accessDurationDays?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  metaKeywords?: string[];
  totalUnitsSold?: number;
  totalDownloads?: number;
}

export const categories = [
  {
    "id": "1",
    "name": "Healthcare",
    "count": 12,
    "description": "Medical dashboards and clinic websites",
    "image": "/images/products/healthcare_dashboard.jpg"
  },
  {
    "id": "2",
    "name": "Business Templates",
    "count": 42,
    "description": "Proposals and finance dashboards",
    "image": "/images/products/finance_dashboard.jpg"
  },
  {
    "id": "3",
    "name": "Automation",
    "count": 18,
    "description": "Workflows and CRM integrations",
    "image": "/images/products/ai_workflow.jpg"
  },
  {
    "id": "4",
    "name": "Website Kits",
    "count": 56,
    "description": "Complete React and HTML website templates",
    "image": "/images/products/saas_website.jpg"
  },
  {
    "id": "5",
    "name": "AI Prompt Bundles",
    "count": 120,
    "description": "Prompts for ChatGPT and AI tools",
    "image": "/images/products/chatgpt_library.jpg"
  },
  {
    "id": "6",
    "name": "Social Media Bundles",
    "count": 84,
    "description": "Canva templates and social kits",
    "image": "/images/products/social_media_kit.jpg"
  },
  {
    "id": "7",
    "name": "Agency Kits",
    "count": 15,
    "description": "Contracts, proposals, and CRM",
    "image": "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "8",
    "name": "Instagram Bundles",
    "count": 24,
    "description": "Grow your Instagram account",
    "image": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800"
  }
];

export const products = [
  {
    "id": "p1",
    "title": "Healthcare Management Dashboard",
    "name": "Healthcare Management Dashboard",
    "slug": "healthcare-management-dashboard",
    "description": "Complete healthcare admin dashboard for hospitals, clinics, and medical startups featuring appointment tracking, patient analytics, revenue monitoring, and responsive layouts.",
    "price": 2999,
    "category": "Healthcare",
    "rating": 4.9,
    "reviews": 1420,
    "coverImage": "/images/products/healthcare_dashboard.jpg",
    "status": "active",
    "stock": 999,
    "badge": "Best Seller",
    "tags": [
      "Healthcare",
      "Dashboard",
      "Admin",
      "Medical"
    ],
    "isBestSeller": true
  },
  {
    "id": "p2",
    "title": "Clinic Appointment Website Kit",
    "name": "Clinic Appointment Website Kit",
    "slug": "clinic-appointment-website-kit",
    "description": "Professional healthcare website kit including doctor profiles, appointment booking pages, service sections, testimonials, FAQs, and contact forms.",
    "price": 1999,
    "category": "Healthcare",
    "rating": 4.8,
    "reviews": 980,
    "coverImage": "/images/products/clinic_website.jpg",
    "status": "active",
    "stock": 999,
    "badge": "Featured",
    "tags": [
      "Healthcare",
      "Website",
      "Clinic"
    ],
    "isFeatured": true
  },
  {
    "id": "p3",
    "title": "Startup Business Proposal Pack",
    "name": "Startup Business Proposal Pack",
    "slug": "startup-business-proposal-pack",
    "description": "Professional proposal templates for startups, agencies, and enterprises including editable presentations, pricing sheets, and project timelines.",
    "price": 1499,
    "category": "Business Templates",
    "rating": 4.8,
    "reviews": 2200,
    "coverImage": "/images/products/startup_proposal.jpg",
    "status": "active",
    "stock": 999,
    "badge": "Popular",
    "tags": [
      "Business",
      "Proposal",
      "Startup"
    ],
    "isPopular": true
  },
  {
    "id": "p4",
    "title": "Business Finance Dashboard",
    "name": "Business Finance Dashboard",
    "slug": "business-finance-dashboard",
    "description": "Interactive finance dashboard for businesses featuring sales analytics, expenses, revenue forecasting, and performance metrics.",
    "price": 2499,
    "category": "Business Templates",
    "rating": 4.9,
    "reviews": 1130,
    "coverImage": "/images/products/finance_dashboard.jpg",
    "status": "active",
    "stock": 999,
    "badge": "New",
    "tags": [
      "Finance",
      "Dashboard",
      "Analytics"
    ],
    "isNewArrival": true
  },
  {
    "id": "p5",
    "title": "AI Workflow Automation Kit",
    "name": "AI Workflow Automation Kit",
    "slug": "ai-workflow-automation-kit",
    "description": "Ready-to-use automation workflows for productivity, CRM, customer support, and AI-powered business processes.",
    "price": 2799,
    "category": "Automation",
    "rating": 4.9,
    "reviews": 850,
    "coverImage": "/images/products/ai_workflow.jpg",
    "status": "active",
    "stock": 999,
    "tags": [
      "AI",
      "Automation",
      "Workflow"
    ]
  },
  {
    "id": "p6",
    "title": "Marketing Automation Suite",
    "name": "Marketing Automation Suite",
    "slug": "marketing-automation-suite",
    "description": "Automate email marketing, lead generation, CRM synchronization, and customer engagement with no-code workflows.",
    "price": 2299,
    "category": "Automation",
    "rating": 4.8,
    "reviews": 640,
    "coverImage": "/images/products/marketing_automation.jpg",
    "status": "active",
    "stock": 999,
    "tags": [
      "Marketing",
      "Automation",
      "CRM"
    ]
  },
  {
    "id": "p7",
    "title": "Modern SaaS Website Kit",
    "name": "Modern SaaS Website Kit",
    "slug": "modern-saas-website-kit",
    "description": "Professional React website template optimized for startups, SaaS products, and software businesses.",
    "price": 3499,
    "category": "Website Kits",
    "rating": 5,
    "reviews": 1200,
    "coverImage": "/images/products/saas_website.jpg",
    "status": "active",
    "stock": 999,
    "tags": [
      "SaaS",
      "Website",
      "React"
    ]
  },
  {
    "id": "p8",
    "title": "Creative Portfolio Website Kit",
    "name": "Creative Portfolio Website Kit",
    "slug": "creative-portfolio-website-kit",
    "description": "Responsive portfolio template for designers, developers, photographers, and freelancers.",
    "price": 2199,
    "category": "Website Kits",
    "rating": 4.9,
    "reviews": 950,
    "coverImage": "/images/products/portfolio_website.jpg",
    "status": "active",
    "stock": 999,
    "tags": [
      "Portfolio",
      "Website",
      "Creative"
    ]
  },
  {
    "id": "p9",
    "title": "Ultimate ChatGPT Prompt Library",
    "name": "Ultimate ChatGPT Prompt Library",
    "slug": "ultimate-chatgpt-prompt-library",
    "description": "2,000+ optimized prompts for marketing, coding, business, education, productivity, and content creation.",
    "price": 999,
    "category": "AI Prompt Bundles",
    "rating": 4.8,
    "reviews": 3100,
    "coverImage": "/images/products/chatgpt_library.jpg",
    "status": "active",
    "stock": 999,
    "tags": [
      "ChatGPT",
      "Prompts",
      "AI"
    ]
  },
  {
    "id": "p10",
    "title": "AI Business Prompt Collection",
    "name": "AI Business Prompt Collection",
    "slug": "ai-business-prompt-collection",
    "description": "Premium prompts designed for entrepreneurs, consultants, agencies, and AI-powered businesses.",
    "price": 799,
    "category": "AI Prompt Bundles",
    "rating": 4.9,
    "reviews": 1540,
    "coverImage": "/images/products/ai_business.jpg",
    "status": "active",
    "stock": 999,
    "tags": [
      "Business",
      "Prompts",
      "AI"
    ]
  },
  {
    "id": "p11",
    "title": "Complete Social Media Content Kit",
    "name": "Complete Social Media Content Kit",
    "slug": "complete-social-media-content-kit",
    "description": "500+ editable social media templates for marketing, branding, promotions, and engagement.",
    "price": 1299,
    "category": "Social Media Bundles",
    "rating": 4.7,
    "reviews": 2100,
    "coverImage": "/images/products/social_media_kit.jpg",
    "status": "active",
    "stock": 999,
    "tags": [
      "Social Media",
      "Templates",
      "Marketing"
    ]
  },
  {
    "id": "p12",
    "title": "Canva Marketing Bundle",
    "name": "Canva Marketing Bundle",
    "slug": "canva-marketing-bundle",
    "description": "Professional editable Canva templates for social campaigns, ads, stories, and promotions.",
    "price": 899,
    "category": "Social Media Bundles",
    "rating": 4.9,
    "reviews": 1850,
    "coverImage": "/images/products/canva_bundle.jpg",
    "status": "active",
    "stock": 999,
    "tags": [
      "Canva",
      "Marketing",
      "Templates"
    ]
  },
  {
    "id": "p13",
    "title": "Agency Starter Pack",
    "name": "Agency Starter Pack",
    "slug": "agency-starter-pack",
    "description": "Complete toolkit for digital agencies including CRM, proposals, invoices, onboarding, and client management.",
    "price": 3299,
    "category": "Agency Kits",
    "rating": 5,
    "reviews": 720,
    "coverImage": "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&q=80&w=800",
    "status": "active",
    "stock": 999,
    "tags": [
      "Agency",
      "Toolkit",
      "Management"
    ]
  },
  {
    "id": "p14",
    "title": "Client Management Suite",
    "name": "Client Management Suite",
    "slug": "client-management-suite",
    "description": "Professional client management system for agencies with project tracking and invoicing.",
    "price": 2899,
    "category": "Agency Kits",
    "rating": 4.8,
    "reviews": 910,
    "coverImage": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
    "status": "active",
    "stock": 999,
    "tags": [
      "Client",
      "Management",
      "System"
    ]
  },
  {
    "id": "p15",
    "title": "Instagram Growth Bundle",
    "name": "Instagram Growth Bundle",
    "slug": "instagram-growth-bundle",
    "description": "Premium collection of editable Instagram templates to increase engagement and brand visibility.",
    "price": 999,
    "category": "Instagram Bundles",
    "rating": 4.9,
    "reviews": 2450,
    "coverImage": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800",
    "status": "active",
    "stock": 999,
    "tags": [
      "Instagram",
      "Growth",
      "Templates"
    ]
  },
  {
    "id": "p16",
    "title": "Reels Creator Pack",
    "name": "Reels Creator Pack",
    "slug": "reels-creator-pack",
    "description": "High-converting Instagram Reels templates optimized for creators, influencers, and businesses.",
    "price": 799,
    "category": "Instagram Bundles",
    "rating": 4.8,
    "reviews": 1680,
    "coverImage": "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800",
    "status": "active",
    "stock": 999,
    "tags": [
      "Reels",
      "Instagram",
      "Creator"
    ]
  }
];

export const bundles = [
  {
    id: 'b1',
    title: 'The Ultimate Freelancer Bundle',
    description: 'Get everything you need to start and scale your freelance business. Includes contracts, invoices, and proposal templates.',
    price: 149.00,
    originalPrice: 250.00,
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
    itemsIncluded: 5,
    rating: 5.0
  },
  {
    id: 'b2',
    title: 'Creator AI Mastery Bundle',
    description: 'All our top-selling AI prompt packs and automation scripts in one massively discounted bundle.',
    price: 79.00,
    originalPrice: 150.00,
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800',
    itemsIncluded: 3,
    rating: 4.9
  }
];
