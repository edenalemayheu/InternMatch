/**
 * seed.js — Deterministic demo seed data for InternMatch.
 *
 * Design constraints for an interesting demo:
 *   - NexaTech Software (cap 2) is ranked #1 by 5 students → popular company
 *   - Two student pairs produce tied scores (1.50) → tie-breaking exercised
 *   - At least two students end up unmatched (ranked only companies that didn't rank them back)
 *   - One posting (Greenfield Analytics, cap 1) ends up unfilled (no mutual interest)
 *   - One posting (Studio Nova, cap 1) fills on a lower-scoring match after the higher one matches elsewhere
 *
 * Entity IDs are stable strings so tests and api.js can hardcode references.
 */

// ── Users ────────────────────────────────────────────────────────────────────
export const SEED_USERS = [
  // Students (14)
  { id: 'u-s01', email: 'amara.osei@demo.dev',        password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s02', email: 'lucas.ferreira@demo.dev',    password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s03', email: 'priya.nair@demo.dev',        password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s04', email: 'elias.berg@demo.dev',        password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s05', email: 'fatima.al-rashid@demo.dev',  password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s06', email: 'james.owusu@demo.dev',       password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s07', email: 'sofia.chen@demo.dev',        password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s08', email: 'noah.campbell@demo.dev',     password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s09', email: 'yuki.tanaka@demo.dev',       password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s10', email: 'chloe.martin@demo.dev',      password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s11', email: 'rafael.lima@demo.dev',       password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s12', email: 'aisha.diallo@demo.dev',      password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s13', email: 'oliver.walsh@demo.dev',      password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-s14', email: 'mei.zhang@demo.dev',         password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  // Companies (6)
  { id: 'u-c01', email: 'recruit@nexatech.demo.dev',    password: 'demo1234', role: 'company', is_admin: false, profile_complete: true },
  { id: 'u-c02', email: 'recruit@studionova.demo.dev',  password: 'demo1234', role: 'company', is_admin: false, profile_complete: true },
  { id: 'u-c03', email: 'recruit@bridgeai.demo.dev',    password: 'demo1234', role: 'company', is_admin: false, profile_complete: true },
  { id: 'u-c04', email: 'recruit@vaultfin.demo.dev',    password: 'demo1234', role: 'company', is_admin: false, profile_complete: true },
  { id: 'u-c05', email: 'recruit@greenfield.demo.dev',  password: 'demo1234', role: 'company', is_admin: false, profile_complete: true },
  { id: 'u-c06', email: 'recruit@orbitux.demo.dev',     password: 'demo1234', role: 'company', is_admin: false, profile_complete: true },
  // Demo admin
  { id: 'u-admin', email: 'demo-admin@internmatch.dev', password: 'demo1234', role: 'admin', is_admin: true, profile_complete: true },
  // Quick-login aliases (same password, separate accounts for DemoGuide)
  { id: 'u-demo-student', email: 'demo-student@internmatch.dev', password: 'demo1234', role: 'student', is_admin: false, profile_complete: true },
  { id: 'u-demo-company', email: 'demo-company@internmatch.dev', password: 'demo1234', role: 'company', is_admin: false, profile_complete: true },
];

// ── Students ─────────────────────────────────────────────────────────────────
export const SEED_STUDENTS = [
  { id: 's01', user_id: 'u-s01', full_name: 'Amara Osei',
    department: 'Computer Science', year: 3,
    skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
    projects: ['Built a real-time study-group app used by 200+ students'],
    certificates: ['AWS Cloud Practitioner'],
    portfolio_url: 'https://amaraosei.dev',
    availability: 'June – August 2026',
    contact_email: 'amara.osei@demo.dev' },

  { id: 's02', user_id: 'u-s02', full_name: 'Lucas Ferreira',
    department: 'Computer Science', year: 4,
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
    projects: ['Sentiment classifier for 50k product reviews (85% accuracy)'],
    certificates: ['Google ML Crash Course'],
    portfolio_url: 'https://lucasferreira.io',
    availability: 'June – September 2026',
    contact_email: 'lucas.ferreira@demo.dev' },

  { id: 's03', user_id: 'u-s03', full_name: 'Priya Nair',
    department: 'Computer Science', year: 3,
    skills: ['React', 'TypeScript', 'Figma', 'CSS'],
    projects: ['Redesigned university portal; 40% drop in support tickets'],
    certificates: ['Meta Front-End Developer'],
    portfolio_url: 'https://priyanair.design',
    availability: 'June – August 2026',
    contact_email: 'priya.nair@demo.dev' },

  { id: 's04', user_id: 'u-s04', full_name: 'Elias Berg',
    department: 'Engineering', year: 3,
    skills: ['Python', 'Data Analysis', 'Pandas', 'Tableau'],
    projects: ['Energy consumption dashboard for campus buildings'],
    certificates: [],
    portfolio_url: '',
    availability: 'June – August 2026',
    contact_email: 'elias.berg@demo.dev' },

  { id: 's05', user_id: 'u-s05', full_name: 'Fatima Al-Rashid',
    department: 'Business', year: 2,
    skills: ['Excel', 'SQL', 'Power BI', 'Financial Modelling'],
    projects: ['Built a budget tracking tool adopted by student union'],
    certificates: ['CFA Level 1 candidate'],
    portfolio_url: '',
    availability: 'June – August 2026',
    contact_email: 'fatima.al-rashid@demo.dev' },

  { id: 's06', user_id: 'u-s06', full_name: 'James Owusu',
    department: 'Computer Science', year: 4,
    skills: ['Node.js', 'Express', 'MongoDB', 'Docker'],
    projects: ['Microservices API serving 10k daily requests'],
    certificates: ['Docker Certified Associate'],
    portfolio_url: 'https://jowusu.dev',
    availability: 'May – August 2026',
    contact_email: 'james.owusu@demo.dev' },

  { id: 's07', user_id: 'u-s07', full_name: 'Sofia Chen',
    department: 'Computer Science', year: 3,
    skills: ['React', 'GraphQL', 'Node.js', 'Figma'],
    projects: ['Open-source component library with 120 GitHub stars'],
    certificates: [],
    portfolio_url: 'https://sofia.codes',
    availability: 'June – September 2026',
    contact_email: 'sofia.chen@demo.dev' },

  { id: 's08', user_id: 'u-s08', full_name: 'Noah Campbell',
    department: 'Engineering', year: 4,
    skills: ['Python', 'C++', 'Embedded Systems', 'MATLAB'],
    projects: ['Autonomous rover prototype for robotics club'],
    certificates: ['Arduino Specialist'],
    portfolio_url: '',
    availability: 'June – August 2026',
    contact_email: 'noah.campbell@demo.dev' },

  { id: 's09', user_id: 'u-s09', full_name: 'Yuki Tanaka',
    department: 'Computer Science', year: 2,
    skills: ['Python', 'Flask', 'PostgreSQL', 'Linux'],
    projects: ['Personal finance API with OAuth2 integration'],
    certificates: [],
    portfolio_url: 'https://yukitanaka.jp',
    availability: 'June – August 2026',
    contact_email: 'yuki.tanaka@demo.dev' },

  { id: 's10', user_id: 'u-s10', full_name: 'Chloe Martin',
    department: 'Business', year: 3,
    skills: ['Marketing Analytics', 'SEO', 'Google Ads', 'SQL'],
    projects: ['Grew student newspaper readership by 60% via SEO'],
    certificates: ['Google Analytics Individual Qualification'],
    portfolio_url: '',
    availability: 'June – August 2026',
    contact_email: 'chloe.martin@demo.dev' },

  { id: 's11', user_id: 'u-s11', full_name: 'Rafael Lima',
    department: 'Computer Science', year: 4,
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    projects: ['SaaS MVP reaching $1.2k MRR before graduation'],
    certificates: ['AWS Solutions Architect Associate'],
    portfolio_url: 'https://rafaellima.dev',
    availability: 'June – September 2026',
    contact_email: 'rafael.lima@demo.dev' },

  { id: 's12', user_id: 'u-s12', full_name: 'Aisha Diallo',
    department: 'Engineering', year: 3,
    skills: ['Python', 'Data Analysis', 'Machine Learning', 'R'],
    projects: ['Predictive maintenance model for lab equipment'],
    certificates: ['Coursera ML Specialisation'],
    portfolio_url: '',
    availability: 'June – August 2026',
    contact_email: 'aisha.diallo@demo.dev' },

  // s13 & s14: will end up unmatched (rank companies that don't rank them back)
  { id: 's13', user_id: 'u-s13', full_name: 'Oliver Walsh',
    department: 'Business', year: 2,
    skills: ['Excel', 'Presentation', 'Research'],
    projects: ['Case study competition finalist'],
    certificates: [],
    portfolio_url: '',
    availability: 'June – August 2026',
    contact_email: 'oliver.walsh@demo.dev' },

  { id: 's14', user_id: 'u-s14', full_name: 'Mei Zhang',
    department: 'Engineering', year: 2,
    skills: ['Python', 'CAD', 'MATLAB'],
    projects: ['3D-printed prosthetic finger prototype'],
    certificates: [],
    portfolio_url: '',
    availability: 'June – August 2026',
    contact_email: 'mei.zhang@demo.dev' },

  // Demo quick-login student (mirrors s01 profile)
  { id: 's-demo', user_id: 'u-demo-student', full_name: 'Demo Student',
    department: 'Computer Science', year: 3,
    skills: ['React', 'Node.js'],
    projects: [],
    certificates: [],
    portfolio_url: '',
    availability: 'June – August 2026',
    contact_email: 'demo-student@internmatch.dev' },
];

// ── Companies ─────────────────────────────────────────────────────────────────
export const SEED_COMPANIES = [
  { id: 'c01', user_id: 'u-c01', company_name: 'NexaTech Software',
    industry: 'Software / SaaS', contact_person: 'Lena Hoffmann',
    logo_url: '' },
  { id: 'c02', user_id: 'u-c02', company_name: 'Studio Nova',
    industry: 'Design & UX', contact_person: 'Marco Ricci',
    logo_url: '' },
  { id: 'c03', user_id: 'u-c03', company_name: 'BridgeAI',
    industry: 'Artificial Intelligence', contact_person: 'Dara Okonkwo',
    logo_url: '' },
  { id: 'c04', user_id: 'u-c04', company_name: 'VaultFin',
    industry: 'Fintech', contact_person: 'Ananya Krishnan',
    logo_url: '' },
  // Greenfield: will end up unfilled (only ranks students who don't rank it back)
  { id: 'c05', user_id: 'u-c05', company_name: 'Greenfield Analytics',
    industry: 'Data & Analytics', contact_person: 'Thomas Webb',
    logo_url: '' },
  { id: 'c06', user_id: 'u-c06', company_name: 'OrbitUX',
    industry: 'Product Design', contact_person: 'Hana Sato',
    logo_url: '' },

  // Demo quick-login company (mirrors c02)
  { id: 'c-demo', user_id: 'u-demo-company', company_name: 'Demo Corp',
    industry: 'Software / SaaS', contact_person: 'Demo Recruiter',
    logo_url: '' },
];

// ── Postings ─────────────────────────────────────────────────────────────────
// 9 postings, capacity 1–3
// p01 (NexaTech, cap 2): hot posting — many students rank it #1
export const SEED_POSTINGS = [
  { id: 'p01', company_id: 'c01', round_id: 'round-spring-2026',
    title: 'Full-Stack Engineer Intern',
    description: 'Join our product team building the next-gen SaaS platform. You\'ll own features end-to-end from design to deployment.',
    required_department: 'Computer Science',
    required_skills: ['React', 'Node.js'],
    capacity: 2 },

  { id: 'p02', company_id: 'c01', round_id: 'round-spring-2026',
    title: 'Backend Engineer Intern',
    description: 'Work on our distributed API layer. High ownership, real production traffic.',
    required_department: 'Computer Science',
    required_skills: ['Node.js', 'PostgreSQL'],
    capacity: 1 },

  { id: 'p03', company_id: 'c02', round_id: 'round-spring-2026',
    title: 'Product Design Intern',
    description: 'Shape the visual identity of our flagship product. You\'ll run user research and design end-to-end flows.',
    required_department: 'Computer Science',
    required_skills: ['Figma', 'React'],
    capacity: 1 },

  { id: 'p04', company_id: 'c03', round_id: 'round-spring-2026',
    title: 'ML Research Intern',
    description: 'Work directly with our research team on production NLP models. Publications possible.',
    required_department: 'Computer Science',
    required_skills: ['Python', 'Machine Learning'],
    capacity: 2 },

  { id: 'p05', company_id: 'c03', round_id: 'round-spring-2026',
    title: 'Data Engineering Intern',
    description: 'Build and maintain the data pipelines that feed our AI products.',
    required_department: 'Engineering',
    required_skills: ['Python', 'Data Analysis'],
    capacity: 1 },

  { id: 'p06', company_id: 'c04', round_id: 'round-spring-2026',
    title: 'Quantitative Analyst Intern',
    description: 'Develop and back-test trading strategies using real market data.',
    required_department: 'Business',
    required_skills: ['SQL', 'Financial Modelling'],
    capacity: 1 },

  { id: 'p07', company_id: 'c05', round_id: 'round-spring-2026',
    title: 'Analytics Engineer Intern',
    description: 'Build dashboards and reporting pipelines for Fortune 500 clients.',
    required_department: 'Engineering',
    required_skills: ['Python', 'Data Analysis'],
    capacity: 1 },
  // Greenfield also has a second posting that will remain unfilled
  { id: 'p08', company_id: 'c05', round_id: 'round-spring-2026',
    title: 'Business Intelligence Intern',
    description: 'Turn raw data into executive-level insights. Tableau and SQL-heavy role.',
    required_department: 'Business',
    required_skills: ['SQL', 'Excel'],
    capacity: 1 },

  { id: 'p09', company_id: 'c06', round_id: 'round-spring-2026',
    title: 'UX Research Intern',
    description: 'Lead usability testing sessions and synthesise insights for our design system.',
    required_department: 'Computer Science',
    required_skills: ['Figma', 'React'],
    capacity: 1 },
];

// ── Round ─────────────────────────────────────────────────────────────────────
export const SEED_ROUND = {
  id: 'round-spring-2026',
  label: 'Spring 2026',
  phase: 'ranking_open',
  ranking_opens_at:   '2026-02-01',
  ranking_locks_at:   '2026-02-28',
  shortlist_locks_at: '2026-03-20',
  company_locks_at:   '2026-05-15',
  reveal_at:          '2026-06-01',
};

// ── Student rankings ─────────────────────────────────────────────────────────
// Designed so that:
//   - s01 (Amara)  ranks p01 #1 → will match p01 (NexaTech score = 1/1 + 1/1 = 2.00)
//   - s03 (Priya)  ranks p01 #1 → will match p01 (score = 1/1 + 1/2 = 1.50)
//   - s07 (Sofia)  ranks p01 #1 → will NOT match p01 (cap full), falls to p03
//   - s02 (Lucas)  ranks p04 #1 → will match p04 (score = 1/1 + 1/1 = 2.00)
//   - s12 (Aisha)  ranks p04 #1 → will match p04 (score = 1/1 + 1/2 = 1.50)
//   - s06 (James)  ranks p02 #1 → will match p02 (score = 1/1 + 1/1 = 2.00)
//   - s11 (Rafael) ranks p01 #1 → tied with s07 at 1.50 for p01 slot 2 — already filled → falls to p09
//   - s05 (Fatima) ranks p06 #1 → will match p06 (score = 1/1 + 1/1 = 2.00)
//   - s09 (Yuki)   ranks p05 #1 → will match p05 (score = 1/1 + 1/1 = 2.00)
//   - s13 (Oliver) & s14 (Mei): rank only companies that don't rank them → unmatched
export const SEED_STUDENT_RANKINGS = [
  { id: 'sr01', student_id: 's01', round_id: 'round-spring-2026', ordered_posting_ids: ['p01','p02','p04'] },
  { id: 'sr02', student_id: 's02', round_id: 'round-spring-2026', ordered_posting_ids: ['p04','p05','p01'] },
  { id: 'sr03', student_id: 's03', round_id: 'round-spring-2026', ordered_posting_ids: ['p01','p03','p09'] },
  { id: 'sr04', student_id: 's04', round_id: 'round-spring-2026', ordered_posting_ids: ['p05','p07','p04'] },
  { id: 'sr05', student_id: 's05', round_id: 'round-spring-2026', ordered_posting_ids: ['p06','p08'] },
  { id: 'sr06', student_id: 's06', round_id: 'round-spring-2026', ordered_posting_ids: ['p02','p01','p04'] },
  { id: 'sr07', student_id: 's07', round_id: 'round-spring-2026', ordered_posting_ids: ['p01','p03','p09'] },
  { id: 'sr08', student_id: 's08', round_id: 'round-spring-2026', ordered_posting_ids: ['p05','p07'] },
  { id: 'sr09', student_id: 's09', round_id: 'round-spring-2026', ordered_posting_ids: ['p05','p04'] },
  { id: 'sr10', student_id: 's10', round_id: 'round-spring-2026', ordered_posting_ids: ['p06','p08'] },
  { id: 'sr11', student_id: 's11', round_id: 'round-spring-2026', ordered_posting_ids: ['p01','p09','p02'] },
  { id: 'sr12', student_id: 's12', round_id: 'round-spring-2026', ordered_posting_ids: ['p04','p05','p07'] },
  // s13 & s14 rank p08 only — Greenfield won't rank them back → unmatched
  { id: 'sr13', student_id: 's13', round_id: 'round-spring-2026', ordered_posting_ids: ['p08','p06'] },
  { id: 'sr14', student_id: 's14', round_id: 'round-spring-2026', ordered_posting_ids: ['p07','p08'] },
];

// ── Company rankings ──────────────────────────────────────────────────────────
// NexaTech p01: ranks s01 #1, s03 #2, s07 #3, s11 #4, s06 #5
// NexaTech p02: ranks s06 #1, s01 #2, s11 #3
// Studio Nova p03: ranks s03 #1, s07 #2
// BridgeAI p04: ranks s02 #1, s12 #2, s01 #3
// BridgeAI p05: ranks s09 #1, s04 #2, s08 #3, s12 #4
// VaultFin p06: ranks s05 #1, s10 #2
// Greenfield p07 & p08: deliberately ranks only students who don't rank it back
// OrbitUX p09: ranks s11 #1, s07 #2, s03 #3
export const SEED_COMPANY_RANKINGS = [
  { id: 'cr01', posting_id: 'p01', round_id: 'round-spring-2026',
    ordered_student_ids: ['s01','s03','s07','s11','s06'], scores: {} },
  { id: 'cr02', posting_id: 'p02', round_id: 'round-spring-2026',
    ordered_student_ids: ['s06','s01','s11'], scores: {} },
  { id: 'cr03', posting_id: 'p03', round_id: 'round-spring-2026',
    ordered_student_ids: ['s03','s07'], scores: {} },
  { id: 'cr04', posting_id: 'p04', round_id: 'round-spring-2026',
    ordered_student_ids: ['s02','s12','s01'], scores: {} },
  { id: 'cr05', posting_id: 'p05', round_id: 'round-spring-2026',
    ordered_student_ids: ['s09','s04','s08','s12'], scores: {} },
  { id: 'cr06', posting_id: 'p06', round_id: 'round-spring-2026',
    ordered_student_ids: ['s05','s10'], scores: {} },
  // Greenfield ranks students who never ranked it → no mutual interest → posting unfilled
  { id: 'cr07', posting_id: 'p07', round_id: 'round-spring-2026',
    ordered_student_ids: ['s01','s02'], scores: {} },
  { id: 'cr08', posting_id: 'p08', round_id: 'round-spring-2026',
    ordered_student_ids: ['s01','s02'], scores: {} },
  { id: 'cr09', posting_id: 'p09', round_id: 'round-spring-2026',
    ordered_student_ids: ['s11','s07','s03'], scores: {} },
];

// ── Shortlists (initially all pending) ───────────────────────────────────────
// Pre-seeded as if companies have already shortlisted after ranking_locked
export const SEED_SHORTLISTS = [
  // NexaTech p01 shortlisted s01, s03, s07, s11
  { id: 'sl01', posting_id:'p01', student_id:'s01', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'scheduled', notes:'' },
  { id: 'sl02', posting_id:'p01', student_id:'s03', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'Strong portfolio' },
  { id: 'sl03', posting_id:'p01', student_id:'s07', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'Great cultural fit' },
  { id: 'sl04', posting_id:'p01', student_id:'s11', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'pending', notes:'' },
  { id: 'sl05', posting_id:'p01', student_id:'s06', round_id:'round-spring-2026', shortlist_status:'rejected',    interview_status:null, notes:'' },
  // NexaTech p02
  { id: 'sl06', posting_id:'p02', student_id:'s06', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'Excellent backend chops' },
  { id: 'sl07', posting_id:'p02', student_id:'s01', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'scheduled', notes:'' },
  { id: 'sl08', posting_id:'p02', student_id:'s11', round_id:'round-spring-2026', shortlist_status:'rejected',    interview_status:null, notes:'' },
  // Studio Nova p03
  { id: 'sl09', posting_id:'p03', student_id:'s03', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'Outstanding design work' },
  { id: 'sl10', posting_id:'p03', student_id:'s07', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'' },
  // BridgeAI p04
  { id: 'sl11', posting_id:'p04', student_id:'s02', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'ML paper quality work' },
  { id: 'sl12', posting_id:'p04', student_id:'s12', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'' },
  { id: 'sl13', posting_id:'p04', student_id:'s01', round_id:'round-spring-2026', shortlist_status:'pending',     interview_status:null, notes:'' },
  // BridgeAI p05
  { id: 'sl14', posting_id:'p05', student_id:'s09', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'' },
  { id: 'sl15', posting_id:'p05', student_id:'s04', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'scheduled', notes:'' },
  { id: 'sl16', posting_id:'p05', student_id:'s08', round_id:'round-spring-2026', shortlist_status:'rejected',    interview_status:null, notes:'' },
  { id: 'sl17', posting_id:'p05', student_id:'s12', round_id:'round-spring-2026', shortlist_status:'pending',     interview_status:null, notes:'' },
  // VaultFin p06
  { id: 'sl18', posting_id:'p06', student_id:'s05', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'Top modelling skills' },
  { id: 'sl19', posting_id:'p06', student_id:'s10', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'scheduled', notes:'' },
  // OrbitUX p09
  { id: 'sl20', posting_id:'p09', student_id:'s11', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'' },
  { id: 'sl21', posting_id:'p09', student_id:'s07', round_id:'round-spring-2026', shortlist_status:'shortlisted', interview_status:'completed', notes:'' },
  { id: 'sl22', posting_id:'p09', student_id:'s03', round_id:'round-spring-2026', shortlist_status:'pending',     interview_status:null, notes:'' },
];

// ── Notifications (pre-seeded shortlist notifications) ───────────────────────
let _nid = 1;
const makeNote = (user_id, message, type = 'info', meta = {}) => ({
  id: `n${String(_nid++).padStart(3,'0')}`,
  user_id, message, type, read: false,
  created_at: new Date('2026-03-20T10:00:00Z').toISOString(),
  meta,
});

export const SEED_NOTIFICATIONS = [
  makeNote('u-s01', 'You\'ve been shortlisted by NexaTech Software for Full-Stack Engineer Intern.', 'info',
    { company_name:'NexaTech Software', posting_title:'Full-Stack Engineer Intern', posting_id:'p01', contact_email:'recruit@nexatech.demo.dev' }),
  makeNote('u-s01', 'You\'ve been shortlisted by NexaTech Software for Backend Engineer Intern.', 'info',
    { company_name:'NexaTech Software', posting_title:'Backend Engineer Intern', posting_id:'p02', contact_email:'recruit@nexatech.demo.dev' }),
  makeNote('u-s03', 'You\'ve been shortlisted by NexaTech Software for Full-Stack Engineer Intern.', 'info',
    { company_name:'NexaTech Software', posting_title:'Full-Stack Engineer Intern', posting_id:'p01', contact_email:'recruit@nexatech.demo.dev' }),
  makeNote('u-s03', 'You\'ve been shortlisted by Studio Nova for Product Design Intern.', 'info',
    { company_name:'Studio Nova', posting_title:'Product Design Intern', posting_id:'p03', contact_email:'recruit@studionova.demo.dev' }),
  makeNote('u-s06', 'You\'ve been shortlisted by NexaTech Software for Backend Engineer Intern.', 'info',
    { company_name:'NexaTech Software', posting_title:'Backend Engineer Intern', posting_id:'p02', contact_email:'recruit@nexatech.demo.dev' }),
  makeNote('u-s07', 'You\'ve been shortlisted by NexaTech Software for Full-Stack Engineer Intern.', 'info',
    { company_name:'NexaTech Software', posting_title:'Full-Stack Engineer Intern', posting_id:'p01', contact_email:'recruit@nexatech.demo.dev' }),
  makeNote('u-s07', 'You\'ve been shortlisted by Studio Nova for Product Design Intern.', 'info',
    { company_name:'Studio Nova', posting_title:'Product Design Intern', posting_id:'p03', contact_email:'recruit@studionova.demo.dev' }),
  makeNote('u-s02', 'You\'ve been shortlisted by BridgeAI for ML Research Intern.', 'info',
    { company_name:'BridgeAI', posting_title:'ML Research Intern', posting_id:'p04', contact_email:'recruit@bridgeai.demo.dev' }),
  makeNote('u-s12', 'You\'ve been shortlisted by BridgeAI for ML Research Intern.', 'info',
    { company_name:'BridgeAI', posting_title:'ML Research Intern', posting_id:'p04', contact_email:'recruit@bridgeai.demo.dev' }),
  makeNote('u-s09', 'You\'ve been shortlisted by BridgeAI for Data Engineering Intern.', 'info',
    { company_name:'BridgeAI', posting_title:'Data Engineering Intern', posting_id:'p05', contact_email:'recruit@bridgeai.demo.dev' }),
  makeNote('u-s05', 'You\'ve been shortlisted by VaultFin for Quantitative Analyst Intern.', 'info',
    { company_name:'VaultFin', posting_title:'Quantitative Analyst Intern', posting_id:'p06', contact_email:'recruit@vaultfin.demo.dev' }),
  makeNote('u-s11', 'You\'ve been shortlisted by NexaTech Software for Full-Stack Engineer Intern.', 'info',
    { company_name:'NexaTech Software', posting_title:'Full-Stack Engineer Intern', posting_id:'p01', contact_email:'recruit@nexatech.demo.dev' }),
  makeNote('u-s11', 'You\'ve been shortlisted by OrbitUX for UX Research Intern.', 'info',
    { company_name:'OrbitUX', posting_title:'UX Research Intern', posting_id:'p09', contact_email:'recruit@orbitux.demo.dev' }),
];

// ── Master seed export ────────────────────────────────────────────────────────
export const SEED = {
  users:             SEED_USERS,
  students:          SEED_STUDENTS,
  companies:         SEED_COMPANIES,
  postings:          SEED_POSTINGS,
  round:             SEED_ROUND,
  studentRankings:   SEED_STUDENT_RANKINGS,
  companyRankings:   SEED_COMPANY_RANKINGS,
  shortlists:        SEED_SHORTLISTS,
  notifications:     SEED_NOTIFICATIONS,
  matches:           [],
};
