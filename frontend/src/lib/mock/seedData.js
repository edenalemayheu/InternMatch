/**
 * seedData.js — Seed data for mock mode.
 * 16 students, 7 companies, 12 postings.
 * Rankings generated programmatically to ensure a mix of:
 *  - Mutual #1 matches
 *  - Near-misses
 *  - 2 unmatched students, 2 unmatched postings
 * Field names exactly match database.md schema.
 */

const ROUND_ID = 'round-spring-2026';

export const DEMO_ACCOUNTS = [
  { email: 'admin@internmatch.demo',    password: 'Admin123!',   role: 'admin',   is_admin: true,  id: 'u-admin' },
  { email: 'student1@internmatch.demo', password: 'Student123!', role: 'student', is_admin: false, id: 'u-s1' },
  { email: 'student2@internmatch.demo', password: 'Student123!', role: 'student', is_admin: false, id: 'u-s2' },
  { email: 'student3@internmatch.demo', password: 'Student123!', role: 'student', is_admin: false, id: 'u-s3' },
  { email: 'newstudent@internmatch.demo', password: 'Student123!', role: 'student', is_admin: false, id: 'u-s4' },
  { email: 'company1@internmatch.demo', password: 'Company123!', role: 'company', is_admin: false, id: 'u-c1' },
  { email: 'company2@internmatch.demo', password: 'Company123!', role: 'company', is_admin: false, id: 'u-c2' },
  { email: 'newcompany@internmatch.demo', password: 'Company123!', role: 'company', is_admin: false, id: 'u-c3' },
];

export const SEED_ROUND = {
  id: ROUND_ID,
  label: 'Spring 2026',
  phase: 'ranking_open',
  ranking_opens_at: '2026-02-01T00:00:00Z',
  ranking_locks_at: '2026-03-01T00:00:00Z',
  shortlist_locks_at: '2026-03-20T00:00:00Z',
  company_locks_at: '2026-05-15T00:00:00Z',
  reveal_at: '2026-06-01T00:00:00Z',
  created_at: '2026-01-15T00:00:00Z',
};

export const SEED_COMPANIES = [
  { id: 'co-1', user_id: 'u-c1', company_name: 'NexaTech', industry: 'Software', contact_person: 'Alex Rivera', logo_url: null, created_at: '2026-01-20T00:00:00Z' },
  { id: 'co-2', user_id: 'u-c2', company_name: 'DataFlow Analytics', industry: 'Data & Analytics', contact_person: 'Priya Patel', logo_url: null, created_at: '2026-01-20T00:00:00Z' },
  { id: 'co-3', user_id: null, company_name: 'CloudBridge', industry: 'Cloud Infrastructure', contact_person: 'Sam Chen', logo_url: null, created_at: '2026-01-20T00:00:00Z' },
  { id: 'co-4', user_id: null, company_name: 'GreenPath', industry: 'Sustainability Tech', contact_person: 'Maria Gomez', logo_url: null, created_at: '2026-01-20T00:00:00Z' },
  { id: 'co-5', user_id: null, company_name: 'FinWave', industry: 'Fintech', contact_person: 'Jordan Lee', logo_url: null, created_at: '2026-01-20T00:00:00Z' },
  { id: 'co-6', user_id: null, company_name: 'MedSpark', industry: 'Healthcare Tech', contact_person: 'Aisha Brown', logo_url: null, created_at: '2026-01-20T00:00:00Z' },
  { id: 'co-7', user_id: null, company_name: 'EduForward', industry: 'EdTech', contact_person: 'Tom White', logo_url: null, created_at: '2026-01-20T00:00:00Z' },
];

export const SEED_POSTINGS = [
  { id: 'p-1',  company_id: 'co-1', round_id: ROUND_ID, title: 'Frontend Engineer Intern',    required_department: 'Computer Science', required_skills: ['React', 'JavaScript'], capacity: 2, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-2',  company_id: 'co-1', round_id: ROUND_ID, title: 'Backend Engineer Intern',     required_department: 'Computer Science', required_skills: ['Node.js', 'PostgreSQL'], capacity: 1, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-3',  company_id: 'co-2', round_id: ROUND_ID, title: 'Data Analyst Intern',         required_department: 'Data Science',    required_skills: ['Python', 'SQL'],    capacity: 1, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-4',  company_id: 'co-2', round_id: ROUND_ID, title: 'ML Research Intern',          required_department: 'Data Science',    required_skills: ['Python', 'PyTorch'], capacity: 1, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-5',  company_id: 'co-3', round_id: ROUND_ID, title: 'DevOps Intern',               required_department: 'Computer Science', required_skills: ['Docker', 'Linux'],  capacity: 1, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-6',  company_id: 'co-3', round_id: ROUND_ID, title: 'Cloud Engineer Intern',       required_department: 'Computer Science', required_skills: ['AWS', 'Terraform'],  capacity: 1, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-7',  company_id: 'co-4', round_id: ROUND_ID, title: 'Sustainability Analyst Intern', required_department: 'Environmental Science', required_skills: ['Data Analysis', 'Excel'], capacity: 1, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-8',  company_id: 'co-5', round_id: ROUND_ID, title: 'FinTech Engineer Intern',     required_department: 'Computer Science', required_skills: ['Java', 'Spring Boot'], capacity: 1, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-9',  company_id: 'co-5', round_id: ROUND_ID, title: 'Risk & Compliance Intern',    required_department: 'Finance',         required_skills: ['Excel', 'SQL'],     capacity: 1, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-10', company_id: 'co-6', round_id: ROUND_ID, title: 'Health Data Intern',          required_department: 'Data Science',    required_skills: ['Python', 'Statistics'], capacity: 1, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-11', company_id: 'co-7', round_id: ROUND_ID, title: 'EdTech Product Intern',       required_department: 'Business',        required_skills: ['Product Management', 'Figma'], capacity: 1, created_at: '2026-01-22T00:00:00Z' },
  { id: 'p-12', company_id: 'co-7', round_id: ROUND_ID, title: 'Curriculum Design Intern',    required_department: 'Education',       required_skills: ['Content Writing', 'LMS'], capacity: 1, created_at: '2026-01-22T00:00:00Z' },
];

export const SEED_STUDENTS = [
  // Demo accounts
  { id: 's-1',  user_id: 'u-s1', full_name: 'Alex Kim',      department: 'Computer Science', year: '3rd year', skills: ['React', 'JavaScript', 'Node.js'],   portfolio_url: 'https://alexkim.dev', availability: 'Full-time summer', contact_email: 'student1@internmatch.demo', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-2',  user_id: 'u-s2', full_name: 'Priya Sharma',  department: 'Data Science',     year: '4th year', skills: ['Python', 'SQL', 'Machine Learning'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'student2@internmatch.demo', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-3',  user_id: 'u-s3', full_name: 'Jordan Taylor', department: 'Business',         year: '2nd year', skills: ['Excel', 'Presentation', 'Marketing'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'student3@internmatch.demo', created_at: '2026-01-25T00:00:00Z' },
  // s-4 has no profile (newstudent)
  // Additional students for rich demo
  { id: 's-5',  user_id: null, full_name: 'Sam Chen',       department: 'Computer Science', year: '3rd year', skills: ['React', 'TypeScript', 'GraphQL'], portfolio_url: 'https://samchen.io', availability: 'Full-time summer', contact_email: 'sam@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-6',  user_id: null, full_name: 'Fatima Al-Zahra', department: 'Data Science',    year: '4th year', skills: ['Python', 'PyTorch', 'SQL'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'fatima@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-7',  user_id: null, full_name: 'Luca Rossi',     department: 'Computer Science', year: '3rd year', skills: ['Docker', 'Linux', 'Kubernetes'], portfolio_url: 'https://lucarossi.dev', availability: 'Full-time summer', contact_email: 'luca@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-8',  user_id: null, full_name: 'Aisha Johnson',  department: 'Computer Science', year: '4th year', skills: ['AWS', 'Terraform', 'Python'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'aisha@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-9',  user_id: null, full_name: 'Wei Zhang',      department: 'Data Science',     year: '3rd year', skills: ['Python', 'Statistics', 'R'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'wei@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-10', user_id: null, full_name: 'Emma Wilson',    department: 'Computer Science', year: '2nd year', skills: ['Node.js', 'PostgreSQL', 'Express'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'emma@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-11', user_id: null, full_name: 'Carlos Mendez',  department: 'Finance',          year: '3rd year', skills: ['Excel', 'SQL', 'Financial Modeling'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'carlos@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-12', user_id: null, full_name: 'Sophie Martin',  department: 'Computer Science', year: '4th year', skills: ['Java', 'Spring Boot', 'REST APIs'], portfolio_url: 'https://sophiemartin.fr', availability: 'Full-time summer', contact_email: 'sophie@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-13', user_id: null, full_name: 'Omar Hassan',    department: 'Data Science',     year: '3rd year', skills: ['Python', 'SQL', 'Tableau'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'omar@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-14', user_id: null, full_name: 'Nina Patel',     department: 'Business',         year: '3rd year', skills: ['Product Management', 'Figma', 'Agile'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'nina@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-15', user_id: null, full_name: 'Tom Eriksson',   department: 'Environmental Science', year: '3rd year', skills: ['Data Analysis', 'Excel', 'GIS'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'tom@demo.com', created_at: '2026-01-25T00:00:00Z' },
  { id: 's-16', user_id: null, full_name: 'Mei Li',         department: 'Computer Science', year: '2nd year', skills: ['React', 'CSS', 'JavaScript'], portfolio_url: null, availability: 'Full-time summer', contact_email: 'mei@demo.com', created_at: '2026-01-25T00:00:00Z' },
];

// Student rankings for "mid-round" and "match day" presets
// Designed to produce: several mutual #1, 2 unmatched students (s-3, s-16), 2 unmatched postings (p-9, p-12)
export const SEED_STUDENT_RANKINGS = [
  { id: 'sr-1',  student_id: 's-1',  round_id: ROUND_ID, ordered_posting_ids: ['p-1', 'p-2', 'p-5'], locked_at: null },
  { id: 'sr-2',  student_id: 's-2',  round_id: ROUND_ID, ordered_posting_ids: ['p-4', 'p-3', 'p-10'], locked_at: null },
  { id: 'sr-3',  student_id: 's-3',  round_id: ROUND_ID, ordered_posting_ids: ['p-11'], locked_at: null }, // will be unmatched
  { id: 'sr-5',  student_id: 's-5',  round_id: ROUND_ID, ordered_posting_ids: ['p-1', 'p-6'], locked_at: null },
  { id: 'sr-6',  student_id: 's-6',  round_id: ROUND_ID, ordered_posting_ids: ['p-4', 'p-3', 'p-10'], locked_at: null },
  { id: 'sr-7',  student_id: 's-7',  round_id: ROUND_ID, ordered_posting_ids: ['p-5', 'p-6'], locked_at: null },
  { id: 'sr-8',  student_id: 's-8',  round_id: ROUND_ID, ordered_posting_ids: ['p-6', 'p-5'], locked_at: null },
  { id: 'sr-9',  student_id: 's-9',  round_id: ROUND_ID, ordered_posting_ids: ['p-10', 'p-3'], locked_at: null },
  { id: 'sr-10', student_id: 's-10', round_id: ROUND_ID, ordered_posting_ids: ['p-2', 'p-8'], locked_at: null },
  { id: 'sr-11', student_id: 's-11', round_id: ROUND_ID, ordered_posting_ids: ['p-9', 'p-3'], locked_at: null },
  { id: 'sr-12', student_id: 's-12', round_id: ROUND_ID, ordered_posting_ids: ['p-8', 'p-2'], locked_at: null },
  { id: 'sr-13', student_id: 's-13', round_id: ROUND_ID, ordered_posting_ids: ['p-3', 'p-4', 'p-10'], locked_at: null },
  { id: 'sr-14', student_id: 's-14', round_id: ROUND_ID, ordered_posting_ids: ['p-11', 'p-7'], locked_at: null },
  { id: 'sr-15', student_id: 's-15', round_id: ROUND_ID, ordered_posting_ids: ['p-7', 'p-11'], locked_at: null },
  { id: 'sr-16', student_id: 's-16', round_id: ROUND_ID, ordered_posting_ids: ['p-1'], locked_at: null }, // will be unmatched (p-1 already filled by s-1 + s-5)
];

// Company rankings for "match day" preset
export const SEED_COMPANY_RANKINGS = [
  { id: 'cr-1',  posting_id: 'p-1',  round_id: ROUND_ID, ordered_student_ids: ['s-1', 's-5', 's-16'], scores: null, locked_at: null },
  { id: 'cr-2',  posting_id: 'p-2',  round_id: ROUND_ID, ordered_student_ids: ['s-1', 's-10'], scores: null, locked_at: null },
  { id: 'cr-3',  posting_id: 'p-3',  round_id: ROUND_ID, ordered_student_ids: ['s-2', 's-13', 's-11'], scores: null, locked_at: null },
  { id: 'cr-4',  posting_id: 'p-4',  round_id: ROUND_ID, ordered_student_ids: ['s-6', 's-2'], scores: null, locked_at: null },
  { id: 'cr-5',  posting_id: 'p-5',  round_id: ROUND_ID, ordered_student_ids: ['s-7', 's-8'], scores: null, locked_at: null },
  { id: 'cr-6',  posting_id: 'p-6',  round_id: ROUND_ID, ordered_student_ids: ['s-8', 's-7'], scores: null, locked_at: null },
  { id: 'cr-7',  posting_id: 'p-7',  round_id: ROUND_ID, ordered_student_ids: ['s-15', 's-14'], scores: null, locked_at: null },
  { id: 'cr-8',  posting_id: 'p-8',  round_id: ROUND_ID, ordered_student_ids: ['s-12', 's-10'], scores: null, locked_at: null },
  // p-9: company has no ranking → unmatched posting
  { id: 'cr-10', posting_id: 'p-10', round_id: ROUND_ID, ordered_student_ids: ['s-9', 's-2', 's-6'], scores: null, locked_at: null },
  { id: 'cr-11', posting_id: 'p-11', round_id: ROUND_ID, ordered_student_ids: ['s-14', 's-3'], scores: null, locked_at: null },
  // p-12: company has no ranking → unmatched posting
];

// Shortlists for "mid-round" and later presets
export const SEED_SHORTLISTS = [
  // p-1: NexaTech shortlists s-1 and s-5
  { id: 'sl-1', posting_id: 'p-1', student_id: 's-1', round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-10T00:00:00Z' },
  { id: 'sl-2', posting_id: 'p-1', student_id: 's-5', round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-10T00:00:00Z' },
  { id: 'sl-3', posting_id: 'p-1', student_id: 's-16', round_id: ROUND_ID, shortlist_status: 'rejected',   updated_at: '2026-03-10T00:00:00Z' },
  // p-2: NexaTech
  { id: 'sl-4', posting_id: 'p-2', student_id: 's-1',  round_id: ROUND_ID, shortlist_status: 'pending',    updated_at: '2026-03-10T00:00:00Z' },
  { id: 'sl-5', posting_id: 'p-2', student_id: 's-10', round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-10T00:00:00Z' },
  // p-3: DataFlow
  { id: 'sl-6', posting_id: 'p-3', student_id: 's-2',  round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-12T00:00:00Z' },
  { id: 'sl-7', posting_id: 'p-3', student_id: 's-13', round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-12T00:00:00Z' },
  // p-4: DataFlow
  { id: 'sl-8', posting_id: 'p-4', student_id: 's-6',  round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-12T00:00:00Z' },
  { id: 'sl-9', posting_id: 'p-4', student_id: 's-2',  round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-12T00:00:00Z' },
  // p-5
  { id: 'sl-10', posting_id: 'p-5', student_id: 's-7', round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-15T00:00:00Z' },
  // p-6
  { id: 'sl-11', posting_id: 'p-6', student_id: 's-8', round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-15T00:00:00Z' },
  // p-7
  { id: 'sl-12', posting_id: 'p-7', student_id: 's-15', round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-15T00:00:00Z' },
  // p-8
  { id: 'sl-13', posting_id: 'p-8', student_id: 's-12', round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-18T00:00:00Z' },
  // p-10
  { id: 'sl-14', posting_id: 'p-10', student_id: 's-9', round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-18T00:00:00Z' },
  // p-11
  { id: 'sl-15', posting_id: 'p-11', student_id: 's-14', round_id: ROUND_ID, shortlist_status: 'shortlisted', updated_at: '2026-03-18T00:00:00Z' },
];

export const SEED_NOTIFICATIONS = [];
export const SEED_MATCHES = [];
