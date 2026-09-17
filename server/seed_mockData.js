const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  { name: 'Automation & Workflows', slug: 'automation', description: 'Workflows, integrations and AI automation kits', image: '/images/products/ai_workflow.jpg', displayOrder: 1 },
  { name: 'Business Templates', slug: 'business-templates', description: 'Proposals, CRM, operating systems and finance dashboards', image: '/images/products/finance_dashboard.jpg', displayOrder: 2 },
  { name: 'Healthcare', slug: 'healthcare', description: 'Medical dashboards, clinic portals and healthcare websites', image: '/images/products/healthcare_dashboard.jpg', displayOrder: 3 },
  { name: 'Website Kits', slug: 'website-kits', description: 'Complete React and Next.js website templates', image: '/images/products/saas_website.jpg', displayOrder: 4 },
  { name: 'AI Prompt Bundles', slug: 'ai-prompt-bundles', description: 'Engineered prompts for ChatGPT, Claude and AI tools', image: '/images/products/chatgpt_library.jpg', displayOrder: 5 },
  { name: 'Social Media Bundles', slug: 'social-media-bundles', description: 'Canva templates, UGC creator kits and growth assets', image: '/images/products/social_media_kit.jpg', displayOrder: 6 },
  { name: 'Agency Kits', slug: 'agency-kits', description: 'Client management, contracts, proposals and agency OS', image: '/images/products/agent_kits.jpg', displayOrder: 7 },
  { name: 'Instagram Bundles', slug: 'instagram-bundles', description: 'Instagram carousels, stories, reels and growth packs', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800', displayOrder: 8 },
  { name: 'Landing Pages', slug: 'landing-pages', description: 'High-converting landing pages and seller dashboards', image: '/images/products/ecommerce_dashboard_1786372844210.jpg', displayOrder: 9 },
  { name: 'Video Editing Packs', slug: 'video-editing-packs', description: 'Cinematic LUTs, sound effects and creator assets', image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=800', displayOrder: 10 }
];

const products = [
  // 1. Automation & Workflows
  {
    name: 'Marketing Automation Suite',
    slug: 'marketing-automation-suite',
    category: 'Automation & Workflows',
    price: 2299,
    discountPrice: 1499,
    coverImage: '/images/products/marketing_automation.jpg',
    shortDescription: 'Automate email marketing, lead generation, CRM synchronization, and customer engagement with no-code workflows.',
    description: 'Complete marketing automation suite designed for modern businesses. Automate multi-channel email marketing, lead capture, CRM pipeline synchronization, and personalized customer onboarding workflows effortlessly.',
    features: ['Email automation sequences', 'Lead scoring workflows', 'CRM webhook sync', 'Multi-step funnels', 'Zapier & Make blueprints', 'Analytics tracking'],
    tags: ['Marketing', 'Automation', 'CRM', 'Workflows', 'Email Marketing', 'Zapier'],
    featured: true,
    bestSeller: false
  },
  {
    name: 'AI Workflow Automation Kit',
    slug: 'ai-workflow-automation-kit',
    category: 'Automation & Workflows',
    price: 2799,
    discountPrice: 1899,
    coverImage: '/images/products/ai_workflow.jpg',
    shortDescription: 'Ready-to-use automation workflows for productivity, CRM, customer support, and AI-powered business processes.',
    description: 'Ready-to-use automation workflows for productivity, CRM, customer support, and AI-powered business processes. Connect OpenAI, Claude, Google Workspace, and Notion in seamless end-to-end automation pipelines.',
    features: ['AI support routing', 'Automated document extraction', 'Notion auto-sync', 'Webhook integrations', 'Error handling pipelines'],
    tags: ['AI', 'Automation', 'Workflow', 'Productivity', 'ChatGPT', 'Notion'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'AI Small Business Automation Kit',
    slug: 'ai-small-business-automation-kit',
    category: 'Automation & Workflows',
    price: 1999,
    discountPrice: 1299,
    coverImage: '/images/products/ai_business_automation_1786372746195.jpg',
    shortDescription: 'Transform the way you run your small business with a complete AI-powered automation toolkit.',
    description: 'Transform the way you run your small business with a complete AI-powered automation toolkit. This system helps you streamline customer support, lead management, sales follow-ups, content creation, email communication, and everyday operations.',
    features: ['AI customer-support workflows', 'Lead management system', 'Sales follow-up workflows', 'Email automation templates', 'SOP templates', 'AI prompt library'],
    tags: ['AI', 'automation', 'small business', 'business tools', 'productivity', 'AI workflows', 'CRM'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'AI Marketing Manager System',
    slug: 'ai-marketing-manager-system',
    category: 'Automation & Workflows',
    price: 1999,
    discountPrice: 1299,
    coverImage: '/images/products/ai_marketing_manager_1786372760826.jpg',
    shortDescription: 'Build a complete AI-powered marketing workflow without needing a large marketing team.',
    description: 'Build a complete AI-powered marketing workflow without needing a large marketing team. The AI Marketing Manager System brings together customer research, competitor analysis, content strategy, SEO planning, social-media campaigns, and email marketing.',
    features: ['Customer research workflow', 'Competitor analysis system', 'Marketing strategy planner', 'SEO planning tools', 'Social media campaign planner'],
    tags: ['AI marketing', 'marketing', 'SEO', 'content marketing', 'social media', 'email marketing'],
    featured: false,
    bestSeller: false
  },

  // 2. Business Templates
  {
    name: 'Business Finance Dashboard',
    slug: 'business-finance-dashboard',
    category: 'Business Templates',
    price: 2499,
    discountPrice: 1699,
    coverImage: '/images/products/finance_dashboard.jpg',
    shortDescription: 'Interactive finance dashboard for businesses featuring sales analytics, expenses, revenue forecasting, and performance metrics.',
    description: 'Interactive finance dashboard for businesses featuring sales analytics, expenses, revenue forecasting, and performance metrics. Includes responsive charts, profit/loss calculators, cash flow breakdowns, and client invoicing summaries.',
    features: ['P&L overview', 'Revenue forecasting', 'Expense categorizer', 'Cash flow projection', 'Tax estimator', 'Exportable reports'],
    tags: ['Finance', 'Dashboard', 'Analytics', 'Excel', 'Google Sheets', 'Accounting'],
    featured: true,
    bestSeller: false
  },
  {
    name: 'Startup Business Proposal Pack',
    slug: 'startup-business-proposal-pack',
    category: 'Business Templates',
    price: 1499,
    discountPrice: 999,
    coverImage: '/images/products/startup_proposal.jpg',
    shortDescription: 'Professional proposal templates for startups, agencies, and enterprises including editable presentations, pricing sheets, and project timelines.',
    description: 'Professional proposal templates for startups, agencies, and enterprises. Includes editable pitch decks, pricing sheets, scope of work templates, project timelines, and legal contract clauses designed to convert leads into paying clients.',
    features: ['15+ Proposal layouts', 'Scope of work builder', 'Pricing table matrix', 'Client sign-off sheet', 'Brand customizable styles'],
    tags: ['Business', 'Proposal', 'Startup', 'Pitch Deck', 'Contracts'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'AI Sales & Lead Generation System',
    slug: 'ai-sales-lead-generation-system',
    category: 'Business Templates',
    price: 2199,
    discountPrice: 1399,
    coverImage: '/images/products/ai_sales_system_1786372771879.jpg',
    shortDescription: 'Turn scattered leads into an organized sales pipeline with an AI-powered lead-generation and sales system.',
    description: 'Turn scattered leads into an organized sales pipeline with an AI-powered lead-generation and sales system. Manage prospects, qualify leads, create personalized outreach, automate follow-ups, prepare proposals, and monitor conversion metrics.',
    features: ['Lead database', 'Lead qualification workflow', 'CRM pipeline', 'Cold email templates', 'LinkedIn outreach workflows', 'Follow-up sequences'],
    tags: ['sales', 'lead generation', 'CRM', 'AI sales', 'outreach', 'cold email', 'business development'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Freelancer Business OS',
    slug: 'freelancer-business-os',
    category: 'Business Templates',
    price: 1499,
    discountPrice: 999,
    coverImage: '/images/products/freelancer_os_1786372803471.jpg',
    shortDescription: 'Run your entire freelance business from one organized digital workspace.',
    description: 'Run your entire freelance business from one organized digital workspace. Manage leads, clients, projects, proposals, invoices, payments, expenses, deadlines, and business performance without juggling multiple disconnected tools.',
    features: ['Lead management', 'Client CRM', 'Project management', 'Proposal system', 'Invoice tracker', 'Payment tracker', 'Expense tracking'],
    tags: ['freelancer', 'business OS', 'freelance', 'CRM', 'client management', 'project management', 'invoices'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Freelancer Finance & Invoice System',
    slug: 'freelancer-finance-invoice-system',
    category: 'Business Templates',
    price: 699,
    discountPrice: 499,
    coverImage: '/images/products/freelancer_finance_invoice.svg',
    shortDescription: 'Keep freelance finances simple and organized with a dedicated tracking system.',
    description: 'Keep freelance finances simple and organized with a dedicated system for tracking income, expenses, invoices, client payments, outstanding balances, and profitability.',
    features: ['Invoice tracker', 'Income tracker', 'Expense tracker', 'Client payment tracker', 'Outstanding balance tracker', 'Profit tracker'],
    tags: ['freelancer', 'invoice', 'finance', 'income', 'expenses', 'payments', 'accounting'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Small Business Finance Dashboard',
    slug: 'small-business-finance-dashboard',
    category: 'Business Templates',
    price: 999,
    discountPrice: 699,
    coverImage: '/images/products/finance_dashboard_1786372857882.jpg',
    shortDescription: 'Simplify your business finances with a complete financial tracking and reporting system.',
    description: 'Simplify your business finances with a complete financial tracking and reporting system. Monitor income, expenses, profit, cash flow, invoices, outstanding payments, and financial trends through an easy-to-use dashboard.',
    features: ['Income tracker', 'Expense tracker', 'Profit and loss', 'Cash flow tracking', 'Invoice tracker', 'Outstanding payment tracker'],
    tags: ['finance', 'small business', 'accounting, cash flow', 'profit', 'expenses', 'bookkeeping'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Shopify & E-commerce Business Toolkit',
    slug: 'shopify-ecommerce-business-toolkit',
    category: 'Business Templates',
    price: 1299,
    discountPrice: 799,
    coverImage: '/images/products/shopify_ecommerce_toolkit.svg',
    shortDescription: 'Build a more organized e-commerce operation with a practical toolkit.',
    description: 'Build a more organized e-commerce operation with a practical toolkit for product research, pricing, inventory, suppliers, orders, profitability, and marketing performance.',
    features: ['Product research tracker', 'Product database', 'Inventory management', 'Supplier tracker', 'Pricing calculator', 'Profit calculator'],
    tags: ['Shopify', 'ecommerce', 'online store', 'product research', 'inventory', 'suppliers', 'profit'],
    featured: false,
    bestSeller: false
  },

  // 3. Healthcare
  {
    name: 'Clinic Appointment Website Kit',
    slug: 'clinic-appointment-website-kit',
    category: 'Healthcare',
    price: 1999,
    discountPrice: 1299,
    coverImage: '/images/products/clinic_website.jpg',
    shortDescription: 'Professional healthcare website kit including doctor profiles, appointment booking pages, service sections, testimonials, FAQs, and contact forms.',
    description: 'Professional healthcare website kit built with React and Tailwind CSS. Features doctor profile directories, appointment booking flows, medical service cards, patient testimonials, FAQs, and HIPAA-ready contact forms.',
    features: ['Doctor roster directory', 'Online appointment scheduler', 'Medical departments showcase', 'Patient reviews & ratings', 'Responsive mobile-first UI'],
    tags: ['Healthcare', 'Website', 'Clinic', 'React', 'Tailwind', 'Medical', 'Doctor'],
    featured: true,
    bestSeller: false
  },
  {
    name: 'Healthcare Management Dashboard',
    slug: 'healthcare-management-dashboard',
    category: 'Healthcare',
    price: 2999,
    discountPrice: 1999,
    coverImage: '/images/products/healthcare_dashboard.jpg',
    shortDescription: 'Complete healthcare admin dashboard for hospitals, clinics, and medical startups featuring appointment tracking, patient analytics, revenue monitoring, and responsive layouts.',
    description: 'Complete healthcare admin dashboard for hospitals, clinics, and medical startups. Features appointment queues, electronic health records (EHR) timeline, patient analytics, bed management, doctor roster scheduling, and pharmacy inventory.',
    features: ['EHR Patient record cards', 'Doctor roster scheduler', 'Bed allocation manager', 'Billing & claims dashboard', 'Multi-facility switcher'],
    tags: ['Healthcare', 'Dashboard', 'Admin', 'Medical', 'EHR', 'Hospital', 'Analytics'],
    featured: false,
    bestSeller: true
  },

  // 4. Instagram Bundles
  {
    name: 'Instagram Growth Bundle',
    slug: 'instagram-growth-bundle',
    category: 'Instagram Bundles',
    price: 999,
    discountPrice: 699,
    coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    shortDescription: 'Premium collection of editable Instagram templates to increase engagement and brand visibility.',
    description: 'Premium collection of editable Instagram templates to increase engagement and brand visibility. Includes high-converting carousel slides, aesthetic story templates, grid posts, viral hook templates, and caption copy frameworks.',
    features: ['200+ Canva Carousel templates', '150+ Story layouts', '50+ Reel cover designs', 'Viral caption swipe files', 'Brand color palettes'],
    tags: ['Instagram', 'Growth', 'Templates', 'Canva', 'Social Media', 'Carousels'],
    featured: true,
    bestSeller: false
  },
  {
    name: 'Reels Creator Pack',
    slug: 'reels-creator-pack',
    category: 'Instagram Bundles',
    price: 799,
    discountPrice: 499,
    coverImage: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800',
    shortDescription: 'High-converting Instagram Reels templates optimized for creators, influencers, and businesses.',
    description: 'High-converting Instagram Reels templates optimized for creators, influencers, and businesses. Includes viral video hooks, motion text overlays, transition blueprints, sound sync guidelines, and script outlines.',
    features: ['100+ Reels video templates', 'Viral video hook library', 'CapCut & Premiere presets', '3-second hook strategies', 'Audio sync guides'],
    tags: ['Reels', 'Instagram', 'Creator', 'TikTok', 'Shorts', 'Video Editing'],
    featured: false,
    bestSeller: false
  },

  // 5. Website Kits
  {
    name: 'Modern SaaS Website Kit',
    slug: 'modern-saas-website-kit',
    category: 'Website Kits',
    price: 3499,
    discountPrice: 2499,
    coverImage: '/images/products/saas_website.jpg',
    shortDescription: 'Professional React website template optimized for startups, SaaS products, and software businesses.',
    description: 'Professional React website template optimized for startups, SaaS products, and software businesses. Features interactive pricing comparison tables, feature showcase sections, hero animations, customer testimonials, blog layout, and dark mode support.',
    features: ['Next.js & React codebase', 'Tailwind CSS styling', 'Interactive pricing toggles', 'Bento grid feature layout', 'SEO & OpenGraph optimized'],
    tags: ['SaaS', 'Website', 'React', 'Next.js', 'Tailwind', 'Software', 'Startup'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Creative Portfolio Website Kit',
    slug: 'creative-portfolio-website-kit',
    category: 'Website Kits',
    price: 2199,
    discountPrice: 1499,
    coverImage: '/images/products/portfolio_website.jpg',
    shortDescription: 'Responsive portfolio template for designers, developers, photographers, and freelancers.',
    description: 'Responsive portfolio template for designers, developers, photographers, and freelancers. Showcase client work with interactive project modals, case study pages, skill badges, resume timeline, and built-in contact inquiry forms.',
    features: ['Masonry case study grid', 'Interactive project modal previews', 'Client testimonial slider', 'Dark & light mode', 'Fast lightweight performance'],
    tags: ['Portfolio', 'Website', 'Creative', 'Designer', 'Developer', 'Freelancer'],
    featured: false,
    bestSeller: false
  },

  // 6. AI Prompt Bundles
  {
    name: 'Ultimate ChatGPT Prompt Library',
    slug: 'ultimate-chatgpt-prompt-library',
    category: 'AI Prompt Bundles',
    price: 999,
    discountPrice: 699,
    coverImage: '/images/products/chatgpt_library.jpg',
    shortDescription: '2,000+ optimized prompts for marketing, coding, business, education, productivity, and content creation.',
    description: '2,000+ optimized prompts for marketing, coding, business, education, productivity, and content creation. Categorized by use-case with detailed context instructions, few-shot examples, and chain-of-thought frameworks.',
    features: ['2,000+ Tested prompts', '15 Distinct business categories', 'Notion database format', 'PDF quick-reference guide', 'Prompt engineering master guide'],
    tags: ['ChatGPT', 'Prompts', 'AI', 'OpenAI', 'Copywriting', 'Productivity'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'AI Business Prompt Collection',
    slug: 'ai-business-prompt-collection',
    category: 'AI Prompt Bundles',
    price: 799,
    discountPrice: 499,
    coverImage: '/images/products/ai_business.jpg',
    shortDescription: 'Premium prompts designed for entrepreneurs, consultants, agencies, and AI-powered businesses.',
    description: 'Premium prompts designed for entrepreneurs, consultants, agencies, and AI-powered businesses. Generate executive summaries, financial analyses, competitor reviews, customer personas, and cold outreach in minutes.',
    features: ['Executive strategy prompts', 'Market analysis generators', 'Cold outreach scripts', 'Customer persona builder', 'Business plan drafter'],
    tags: ['Business', 'Prompts', 'AI', 'Entrepreneur', 'Strategy', 'Consultant'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'AI Content Creation System',
    slug: 'ai-content-creation-system',
    category: 'AI Prompt Bundles',
    price: 1499,
    discountPrice: 999,
    coverImage: '/images/products/ai_content_system_1786372871748.jpg',
    shortDescription: 'Build a repeatable content engine using AI for idea generation, research, and scripting.',
    description: 'Build a repeatable content engine using AI. Move from idea generation to research, scripting, captions, publishing, and performance analysis through a structured content workflow.',
    features: ['Content idea generator', 'Research workflow', 'Hook library', 'Script workflows', 'Caption generation', 'Content calendar'],
    tags: ['AI content', 'content creation', 'ChatGPT', 'creator', 'marketing', 'content calendar'],
    featured: false,
    bestSeller: false
  },

  // 7. Social Media Bundles
  {
    name: 'Complete Social Media Content Kit',
    slug: 'complete-social-media-content-kit',
    category: 'Social Media Bundles',
    price: 1299,
    discountPrice: 899,
    coverImage: '/images/products/social_media_kit.jpg',
    shortDescription: '500+ editable social media templates for marketing, branding, promotions, and engagement.',
    description: '500+ editable social media templates for marketing, branding, promotions, and engagement across Instagram, LinkedIn, Twitter/X, and Facebook. Includes quotes, infographics, product mockups, and promotional banners.',
    features: ['500+ Canva templates', '4 Aspect ratios (1:1, 9:16, 16:9, 4:5)', '30-Day content calendar', 'Free fonts & icons included', 'Fully editable brand kit'],
    tags: ['Social Media', 'Templates', 'Marketing', 'Canva', 'Branding', 'Content Creation'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Canva Marketing Bundle',
    slug: 'canva-marketing-bundle',
    category: 'Social Media Bundles',
    price: 899,
    discountPrice: 599,
    coverImage: '/images/products/canva_bundle.jpg',
    shortDescription: 'Professional editable Canva templates for social campaigns, ads, stories, and promotions.',
    description: 'Professional editable Canva templates for social campaigns, ads, stories, and promotions. Designed specifically for digital product creators, eCommerce brands, and marketing agencies seeking high conversion rates.',
    features: ['150+ Ad creative templates', 'Story sale templates', 'Customer review graphics', 'Discount promo flyers', 'One-click Canva import'],
    tags: ['Canva', 'Marketing', 'Templates', 'Ads', 'Promo', 'Graphic Design'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Social Media Growth System',
    slug: 'social-media-growth-system',
    category: 'Social Media Bundles',
    price: 999,
    discountPrice: 699,
    coverImage: '/images/products/social_media_growth_1786372912072.jpg',
    shortDescription: 'Create a consistent social-media strategy with a complete system for planning, producing, and analyzing.',
    description: 'Create a consistent social-media strategy with a complete system for planning, producing, publishing, and analyzing content. Includes content calendars, hooks, Reel ideas, caption frameworks, and growth trackers.',
    features: ['90-day content calendar', 'Reel ideas', 'Hook library', 'Caption frameworks', 'Hashtag organizer', 'Campaign planner'],
    tags: ['social media', 'Instagram', 'TikTok', 'content calendar', 'social growth', 'marketing'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'UGC Creator Business Kit',
    slug: 'ugc-creator-business-kit',
    category: 'Social Media Bundles',
    price: 1299,
    discountPrice: 799,
    coverImage: '/images/products/ugc_creator_kit_1786372786640.jpg',
    shortDescription: 'Everything a UGC creator needs to build, manage, and grow a professional creator business.',
    description: 'Everything a UGC creator needs to build, manage, and grow a professional creator business. Create compelling brand pitches, organize campaigns, manage clients, present your portfolio, track payments, and plan content.',
    features: ['UGC portfolio structure', 'Media kit template', 'Rate card template', 'Brand pitch templates', 'Client tracker', 'Campaign tracker'],
    tags: ['UGC', 'creator', 'content creator', 'influencer', 'social media', 'brand deals', 'TikTok', 'Instagram'],
    featured: false,
    bestSeller: false
  },

  // 8. Landing Pages
  {
    name: 'Social Media Analytics Dashboard',
    slug: 'social-media-analytics-dashboard',
    category: 'Landing Pages',
    price: 899,
    discountPrice: 599,
    coverImage: '/images/products/social_media_analytics.svg',
    shortDescription: 'Understand what is actually working across your social-media channels with a centralized dashboard.',
    description: 'Understand what is actually working across your social-media channels with a centralized performance dashboard. Track followers, reach, engagement, views, content performance, and growth rates.',
    features: ['Follower tracking', 'Reach tracking', 'Engagement tracking', 'Top performing content', 'Monthly comparison', 'Analytics dashboard'],
    tags: ['social analytics', 'Instagram analytics', 'TikTok analytics', 'YouTube analytics', 'dashboard'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'E-commerce Seller Dashboard',
    slug: 'ecommerce-seller-dashboard',
    category: 'Landing Pages',
    price: 899,
    discountPrice: 599,
    coverImage: '/images/products/ecommerce_dashboard_1786372844210.jpg',
    shortDescription: 'Take control of your online store with a centralized e-commerce management dashboard.',
    description: 'Take control of your online store with a centralized e-commerce management dashboard. Track products, inventory, orders, suppliers, costs, revenue, profit margins, and product performance in one organized system.',
    features: ['Product database', 'Inventory tracker', 'Order tracker', 'Supplier tracker', 'Revenue dashboard', 'COGS tracking'],
    tags: ['ecommerce', 'seller dashboard', 'inventory', 'Shopify', 'online store', 'orders', 'profit'],
    featured: false,
    bestSeller: false
  },

  // 9. Agency Kits
  {
    name: 'Agency Starter Pack',
    slug: 'agency-starter-pack',
    category: 'Agency Kits',
    price: 3299,
    discountPrice: 2199,
    coverImage: '/images/products/agent_kits.jpg',
    shortDescription: 'Complete toolkit for digital agencies including CRM, proposals, invoices, onboarding, and client management.',
    description: 'Complete toolkit for digital agencies including CRM, proposals, invoices, onboarding, and client management. Includes standard service agreements, client questionnaires, discovery frameworks, and monthly reporting templates.',
    features: ['Client CRM database', 'Master services agreement', 'Onboarding intake forms', 'Discovery session framework', 'Monthly client report template'],
    tags: ['Agency', 'Toolkit', 'Management', 'Contracts', 'Invoices', 'Client CRM'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Client Management Suite',
    slug: 'client-management-suite',
    category: 'Agency Kits',
    price: 2899,
    discountPrice: 1899,
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    shortDescription: 'Professional client management system for agencies with project tracking and invoicing.',
    description: 'Professional client management system for agencies with project tracking and invoicing. Organize client deliverables, time tracking, invoice generation, feedback cycles, and milestone approvals in one cohesive portal.',
    features: ['Project milestone tracker', 'Client portal dashboard', 'Time & expense logger', 'Invoice generator', 'Deliverable review workflow'],
    tags: ['Client', 'Management', 'System', 'Agency', 'Project Management', 'Invoicing'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Digital Agency Operating System',
    slug: 'digital-agency-operating-system',
    category: 'Agency Kits',
    price: 2999,
    discountPrice: 1999,
    coverImage: '/images/products/agency_os_1786372831343.jpg',
    shortDescription: 'A complete operating system for digital agencies to manage clients, projects, teams, sales, and operations.',
    description: 'A complete operating system for digital agencies that need to manage clients, projects, teams, sales, finances, and recurring operations in one place. Organize client onboarding, proposals, project delivery, team responsibilities, and profitability.',
    features: ['Agency CRM', 'Sales pipeline', 'Client onboarding', 'Proposal management', 'Team management', 'SOP library', 'Financial tracking'],
    tags: ['agency', 'digital agency', 'business OS', 'client management', 'project management', 'CRM'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Real Estate Agent Business Kit',
    slug: 'real-estate-agent-business-kit',
    category: 'Agency Kits',
    price: 1399,
    discountPrice: 899,
    coverImage: '/images/products/real_estate_business_kit_1786372940636.jpg',
    shortDescription: 'A complete digital toolkit for real estate professionals to manage leads, properties, and clients.',
    description: 'A complete digital toolkit for real estate professionals to manage leads, properties, clients, marketing, follow-ups, and daily business operations. Includes lead-management tools, property trackers, social-media resources, and listing templates.',
    features: ['Real estate CRM', 'Lead tracker', 'Property database', 'Client tracker', 'Follow-up system', 'Listing templates', 'Commission tracker'],
    tags: ['real estate', 'realtor', 'property', 'CRM', 'real estate marketing', 'leads', 'listings'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Creator Content Management System',
    slug: 'creator-content-management-system',
    category: 'Agency Kits',
    price: 1199,
    discountPrice: 799,
    coverImage: '/images/products/creator_content_management.svg',
    shortDescription: 'Manage your entire content operation from one organized workspace.',
    description: 'Manage your entire content operation from one organized workspace. Capture ideas, plan content, write scripts, manage production, schedule publishing, organize assets, and monitor performance.',
    features: ['Content idea database', 'Content calendar', 'Script management', 'Production pipeline', 'Asset library', 'Publish tracker'],
    tags: ['creator', 'YouTube', 'Instagram', 'TikTok', 'content management', 'creator workflow'],
    featured: false,
    bestSeller: false
  },

  // 10. Video Editing Packs
  {
    name: 'Cinematic LUTs Vol 1',
    slug: 'cinematic-luts-vol1',
    category: 'Video Editing Packs',
    price: 1000,
    discountPrice: 499,
    coverImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=800',
    shortDescription: 'Professional cinematic color grading lookup tables (LUTs) for Premiere Pro, Final Cut, DaVinci Resolve, and mobile editing.',
    description: 'Transform your video footage instantly with 50+ professional Hollywood-grade cinematic LUTs. Designed for drone footage, vlogs, commercial shoots, and short films with balanced skin tones and rich color contrast.',
    features: ['50+ .CUBE Color Grading Presets', 'Compatible with Premiere Pro / FCPX / DaVinci Resolve', 'Rec.709 & Log profiles', 'Quick installation video guide'],
    tags: ['LUTs', 'Video Editing', 'Premiere Pro', 'DaVinci Resolve', 'Color Grading', 'Filmmaking'],
    featured: false,
    bestSeller: false
  },
  {
    name: 'Sound FX Pro Pack',
    slug: 'sound-fx-pro',
    category: 'Video Editing Packs',
    price: 500,
    discountPrice: 299,
    coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    shortDescription: '1000+ high-definition sound effects, whooshes, risers, impacts, and cinematic ambient audio assets.',
    description: '1000+ royalty-free, broadcast-quality WAV audio assets for filmmakers, YouTubers, and commercial video editors. Includes deep sub-bass impacts, smooth whoosh transitions, cinematic risers, interface beeps, and atmospheric room tones.',
    features: ['1,000+ Uncompressed 24-bit 48kHz WAV files', '12 Organized categories (Impacts, Whooshes, Risers, Glitches, etc.)', '100% Royalty-free commercial license'],
    tags: ['Sound FX', 'SFX', 'Audio', 'Video Editing', 'Filmmaking', 'YouTube'],
    featured: false,
    bestSeller: false
  }
];

const bundles = [
  {
    title: 'The Ultimate Freelancer Bundle',
    slug: 'the-ultimate-freelancer-bundle',
    description: 'Get everything you need to start and scale your freelance business. Includes contracts, invoices, proposal templates, and client onboarding kits.',
    price: 1499.00,
    originalPrice: 2499.00,
    coverImage: '/images/products/freelancer_os_1786372803471.jpg',
    itemsIncluded: 5,
    rating: 5.0,
    featured: true,
    category: 'Business Templates',
    productSlugs: ['freelancer-business-os', 'freelancer-finance-invoice-system', 'startup-business-proposal-pack', 'business-finance-dashboard']
  },
  {
    title: 'Creator AI Mastery Bundle',
    slug: 'creator-ai-mastery-bundle',
    description: 'All our top-selling AI prompt packs, automation scripts, and Instagram marketing engines in one massively discounted bundle.',
    price: 1999.00,
    originalPrice: 3299.00,
    coverImage: '/images/products/ai_marketing_manager_1786372760826.jpg',
    itemsIncluded: 4,
    rating: 4.9,
    featured: true,
    category: 'AI Prompt Bundles',
    productSlugs: ['ultimate-chatgpt-prompt-library', 'ai-business-prompt-collection', 'ai-content-creation-system', 'ai-marketing-manager-system']
  },
  {
    title: 'Digital Marketing Agency Starter Kit',
    slug: 'digital-marketing-agency-starter-kit',
    description: 'Complete client onboarding, contract templates, pitch decks, and delivery roadmaps for growing agencies.',
    price: 2499.00,
    originalPrice: 4199.00,
    coverImage: '/images/products/agency_os_1786372831343.jpg',
    itemsIncluded: 6,
    rating: 5.0,
    featured: true,
    category: 'Agency Kits',
    productSlugs: ['agency-starter-pack', 'client-management-suite', 'digital-agency-operating-system', 'real-estate-agent-business-kit']
  },
  {
    title: 'Local Business Social Media System',
    slug: 'local-business-social-media-system',
    description: 'High-converting social media creatives, Instagram carousels, and editable Canva assets for local businesses.',
    price: 699.00,
    originalPrice: 1299.00,
    coverImage: '/images/products/social_media_growth_1786372912072.jpg',
    itemsIncluded: 4,
    rating: 4.8,
    featured: true,
    category: 'Social Media Bundles',
    productSlugs: ['social-media-growth-system', 'canva-marketing-bundle', 'complete-social-media-content-kit']
  },
  {
    title: 'AI Content Creation Superpack',
    slug: 'ai-content-creation-superpack',
    description: 'Autonomous copywriting workflows, ChatGPT 4.5 prompt engineering frameworks, and video generation blueprints.',
    price: 1799.00,
    originalPrice: 2999.00,
    coverImage: '/images/products/ai_content_system_1786372871748.jpg',
    itemsIncluded: 5,
    rating: 5.0,
    featured: true,
    category: 'AI Prompt Bundles',
    productSlugs: ['ai-content-creation-system', 'ultimate-chatgpt-prompt-library', 'ai-marketing-manager-system']
  },
  {
    title: 'Real Estate & Property Pro Toolkit',
    slug: 'real-estate-property-pro-toolkit',
    description: 'Complete real estate digital marketing, lead management, and property presentation toolkit.',
    price: 1899.00,
    originalPrice: 3199.00,
    coverImage: '/images/products/real_estate_business_kit_1786372940636.jpg',
    itemsIncluded: 4,
    rating: 4.9,
    featured: true,
    category: 'Agency Kits',
    productSlugs: ['real-estate-agent-business-kit', 'agency-starter-pack', 'client-management-suite']
  },
  {
    title: 'UGC Creator & Influencer Engine',
    slug: 'ugc-creator-influencer-engine',
    description: 'Everything creators need for brand collaborations, pitch decks, media kits, and video frameworks.',
    price: 1299.00,
    originalPrice: 2299.00,
    coverImage: '/images/products/ugc_creator_kit_1786372786640.jpg',
    itemsIncluded: 4,
    rating: 4.9,
    featured: true,
    category: 'Social Media Bundles',
    productSlugs: ['ugc-creator-business-kit', 'reels-creator-pack', 'social-media-growth-system']
  },
  {
    title: 'Canva & Social Media Mega Suite',
    slug: 'canva-social-media-mega-suite',
    description: 'Massive collection of editable Canva social media graphics, ad creatives, and story templates.',
    price: 1199.00,
    originalPrice: 1999.00,
    coverImage: '/images/products/canva_bundle.jpg',
    itemsIncluded: 5,
    rating: 5.0,
    featured: true,
    category: 'Social Media Bundles',
    productSlugs: ['canva-marketing-bundle', 'complete-social-media-content-kit', 'instagram-growth-bundle']
  }
];

async function seed() {
  console.log('=== STARTING COMPLETE CATALOG SYNCHRONIZATION ===');

  // 1. Clean up duplicate and test bundles
  const validBundleSlugs = bundles.map(b => b.slug);
  const junkBundles = await prisma.bundle.findMany({
    where: { slug: { notIn: validBundleSlugs } }
  });
  console.log(`Found ${junkBundles.length} junk/duplicate bundles to remove.`);
  for (const b of junkBundles) {
    await prisma.bundleItem.deleteMany({ where: { bundleId: b.id } }).catch(() => {});
    await prisma.orderItem.deleteMany({ where: { bundleId: b.id } }).catch(() => {});
    await prisma.purchase.deleteMany({ where: { bundleId: b.id } }).catch(() => {});
    await prisma.bundle.delete({ where: { id: b.id } }).catch(() => {});
  }

  // 2. Clean up duplicate and test products
  const validProductSlugs = products.map(p => p.slug);
  const junkProducts = await prisma.product.findMany({
    where: { slug: { notIn: validProductSlugs } }
  });
  console.log(`Found ${junkProducts.length} junk/duplicate products to remove.`);
  for (const p of junkProducts) {
    await prisma.productFileHealth.deleteMany({ where: { productId: p.id } }).catch(() => {});
    await prisma.digitalDeliveryItem.deleteMany({ where: { productId: p.id } }).catch(() => {});
    await prisma.componentEntitlement.deleteMany({ where: { productId: p.id } }).catch(() => {});
    await prisma.digitalEntitlement.deleteMany({ where: { productId: p.id } }).catch(() => {});
    await prisma.review.deleteMany({ where: { productId: p.id } }).catch(() => {});
    await prisma.bundleItem.deleteMany({ where: { productId: p.id } }).catch(() => {});
    await prisma.orderItem.deleteMany({ where: { productId: p.id } }).catch(() => {});
    await prisma.purchase.deleteMany({ where: { productId: p.id } }).catch(() => {});
    await prisma.product.delete({ where: { id: p.id } }).catch(() => {});
  }

  // 3. Upsert standard categories
  const categoryMap = {};
  for (const cat of categories) {
    let existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      existing = await prisma.category.update({
        where: { id: existing.id },
        data: {
          name: cat.name,
          description: cat.description,
          image: cat.image,
          displayOrder: cat.displayOrder,
          status: 'ACTIVE',
          featured: true
        }
      });
    } else {
      existing = await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image,
          displayOrder: cat.displayOrder,
          status: 'ACTIVE',
          featured: true
        }
      });
    }
    categoryMap[cat.name] = existing.id;
  }
  console.log(`Synchronized ${categories.length} canonical categories.`);

  // Clean up orphan junk categories
  const validCatSlugs = categories.map(c => c.slug);
  const junkCats = await prisma.category.findMany({
    where: { slug: { notIn: validCatSlugs } },
    include: { _count: { select: { products: true } } }
  });
  for (const jc of junkCats) {
    if (jc._count.products === 0) {
      await prisma.category.delete({ where: { id: jc.id } }).catch(() => {});
    }
  }

  // 4. Upsert all 33 actual products
  let pIdx = 1;
  const productDbMap = {};
  for (const prod of products) {
    const catId = categoryMap[prod.category];
    if (!catId) {
      console.warn(`Category not found for product: ${prod.name}`);
      continue;
    }

    const code = `KDW-P-${pIdx.toString().padStart(6, '0')}`;
    pIdx++;

    const existingProduct = await prisma.product.findUnique({
      where: { slug: prod.slug }
    });

    const productData = {
      productCode: code,
      name: prod.name,
      slug: prod.slug,
      categoryId: catId,
      price: prod.price,
      discountPrice: prod.discountPrice || null,
      compareAtPrice: Math.round(prod.price * 1.4),
      costPrice: Math.round(prod.price * 0.3),
      shortDescription: prod.shortDescription,
      description: prod.description,
      thumbnail: prod.coverImage,
      previewImages: JSON.stringify([prod.coverImage]),
      features: JSON.stringify(prod.features),
      tags: JSON.stringify(prod.tags),
      brand: 'Kanishk Digital World',
      productType: 'DOWNLOADABLE_FILE',
      fileSize: '15.4 MB',
      version: '1.0.0',
      stock: 999,
      status: 'PUBLISHED',
      featured: Boolean(prod.featured),
      bestSeller: Boolean(prod.bestSeller),
      licenceType: 'COMMERCIAL',
      downloadLimit: 5,
      accessDurationDays: 365,
      googleDriveFileId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      driveAccessStatus: 'CONNECTED'
    };

    let savedProduct;
    if (existingProduct) {
      savedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData
      });
      console.log(`[UPDATED] ${prod.name} (₹${prod.price}, featured: ${prod.featured})`);
    } else {
      savedProduct = await prisma.product.create({
        data: productData
      });
      console.log(`[CREATED] ${prod.name} (₹${prod.price}, featured: ${prod.featured})`);
    }
    productDbMap[prod.slug] = savedProduct.id;
  }
  console.log(`Successfully synced ${products.length} products.`);

  // 5. Upsert all 8 bundles
  for (const b of bundles) {
    const bCatId = categoryMap[b.category] || Object.values(categoryMap)[0];
    const existingBundle = await prisma.bundle.findUnique({
      where: { slug: b.slug }
    });

    const bundleData = {
      title: b.title,
      slug: b.slug,
      description: b.description,
      shortDescription: b.description,
      price: b.price,
      originalPrice: b.originalPrice,
      discount: b.originalPrice - b.price,
      discountPercent: Math.round(((b.originalPrice - b.price) / b.originalPrice) * 100),
      currency: 'INR',
      coverImage: b.coverImage,
      itemsIncluded: b.itemsIncluded,
      rating: b.rating,
      featured: b.featured,
      status: 'ACTIVE',
      categoryId: bCatId,
      bundleType: 'STANDARD',
      deliveryMode: 'COMBINED_ZIP',
      googleDriveLink: 'https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      googleDriveFileId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
    };

    let savedBundle;
    if (existingBundle) {
      savedBundle = await prisma.bundle.update({
        where: { id: existingBundle.id },
        data: bundleData
      });
      console.log(`[UPDATED BUNDLE] ${b.title}`);
    } else {
      savedBundle = await prisma.bundle.create({
        data: bundleData
      });
      console.log(`[CREATED BUNDLE] ${b.title}`);
    }

    // Link bundle items
    await prisma.bundleItem.deleteMany({ where: { bundleId: savedBundle.id } }).catch(() => {});
    if (Array.isArray(b.productSlugs)) {
      for (const pSlug of b.productSlugs) {
        const prodId = productDbMap[pSlug];
        if (prodId) {
          await prisma.bundleItem.create({
            data: {
              bundleId: savedBundle.id,
              productId: prodId
            }
          }).catch(() => {});
        }
      }
    }
  }
  console.log(`Successfully synced ${bundles.length} bundles.`);

  console.log('\n=== COMPLETE CATALOG SYNCHRONIZATION FINISHED ===');
}

seed()
  .catch(e => {
    console.error('Error during synchronization:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

