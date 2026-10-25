// @vitest-environment jsdom
// Workflow regressions against the API service used by the app. Vitest uses its
// isolated in-memory fixture; browser builds always send requests to Express.
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const STUDENT=['student1@internmatch.demo','Student123!'];
const COMPANY=['company1@internmatch.demo','Company123!'];
const OTHER_COMPANY=['company2@internmatch.demo','Company123!'];
const ADMIN=['admin@internmatch.demo','Admin123!'];
let api;
const login=account=>api.login(...account);
const advance=async n=>{await login(ADMIN);for(let i=0;i<n;i++)await api.advancePhase();};
const reject=(call,status)=>expect(call).rejects.toMatchObject({status});

beforeEach(async()=>{localStorage.clear();sessionStorage.clear();vi.resetModules();vi.stubEnv('VITE_USE_MOCK','true');api=await import('./apiClient.js');});
afterEach(()=>vi.unstubAllEnvs());

describe('ranking and phase transitions',()=>{
 it('allows a student to replace a ranking while ranking is open',async()=>{await login(STUDENT);await expect(api.saveRanking(['p-1','p-2'])).resolves.toEqual({ok:true});expect((await api.getMyRanking()).ranking.ordered_posting_ids).toEqual(['p-1','p-2']);});
 it('rejects ranking changes after the round closes ranking',async()=>{await advance(1);await login(STUDENT);const error=await api.saveRanking(['p-1']).catch(e=>e);expect(error.status).toBe(403);expect(error.data.currentPhase).toBe('ranking_locked');});
 it('rejects duplicate and unknown posting IDs',async()=>{await login(STUDENT);await reject(api.saveRanking(['p-1','p-1']),400);await reject(api.saveRanking(['unknown']),400);});
 it('rejects company shortlisting before review and after the shortlist locks',async()=>{await login(COMPANY);await reject(api.updateShortlist('p-1','s-1','shortlisted'),403);await advance(3);await login(COMPANY);await reject(api.updateShortlist('p-1','s-1','shortlisted'),403);});
 it('limits shortlisting to students who applied to that posting',async()=>{await api.loadPreset('mid');await login(COMPANY);await reject(api.updateShortlist('p-1','s-3','shortlisted'),404);});
});

describe('company access and contact privacy',()=>{
 it('rejects another company and rejects student access to company endpoints',async()=>{await api.loadPreset('mid');await login(OTHER_COMPANY);await reject(api.getApplicants('p-1'),404);await login(STUDENT);await reject(api.getApplicants('p-1'),403);});
 it('omits applicant contact before shortlist lock and reveals only shortlisted applicants afterward',async()=>{await api.loadPreset('mid');await login(COMPANY);let {applicants}=await api.getApplicants('p-1');expect(applicants.length).toBeGreaterThan(0);expect(applicants.every(a=>!('contact_email'in a))).toBe(true);await advance(1);await login(COMPANY);({applicants}=await api.getApplicants('p-1'));expect(applicants.filter(a=>a.shortlist_status==='shortlisted').every(a=>Boolean(a.contact_email))).toBe(true);expect(applicants.filter(a=>a.shortlist_status!=='shortlisted').every(a=>!('contact_email'in a))).toBe(true);});
 it('does not let one company use another company’s shortlist to reveal contact',async()=>{await api.loadPreset('mid');await login(OTHER_COMPANY);const {applicants}=await api.getApplicants('p-3');expect(applicants.every(a=>!('contact_email'in a))).toBe(true);});
});

describe('matching visibility and reset',()=>{
 it('refuses unauthenticated and wrong-role calls',async()=>{await reject(api.saveRanking(['p-1']),401);await login(STUDENT);await reject(api.advancePhase(),403);});
 it('runs the match deterministically on the matchday fixture and exposes its summary',async()=>{await api.loadPreset('matchday');const fixture=await import('../../tests/mock/mockDb.js');fixture.updateDb(db=>{db.round.phase='company_locked';return db;});await login(ADMIN);const a=await api.runMatchingNow();const b=await api.runMatchingNow();expect(a).toEqual(b);expect(a.matched.length).toBeGreaterThan(0);expect(a.unmatched_students.length).toBeGreaterThan(0);expect(a.unmatched_postings.length).toBeGreaterThan(0);});
 it('hides results until reveal, then returns only the caller’s result',async()=>{await api.loadPreset('mid');await login(STUDENT);const locked=await api.getMyMatches().catch(e=>e);expect(locked.status).toBe(403);await api.loadPreset('matchday');await login(STUDENT);const result=await api.getMyMatches();expect(result).toHaveProperty('match');expect(result.matches).toBeUndefined();});
 it('reset returns a round to ranking_open and clears its ranking',async()=>{await login(STUDENT);await api.saveRanking(['p-1']);await login(ADMIN);await api.resetRound();const {round}=await api.getCurrentRound();expect(round.phase).toBe('ranking_open');await login(STUDENT);expect((await api.getMyRanking()).ranking).toBeNull();});
});


// Additional regression cases migrated from the removed localStorage data layer.
describe('additional workflow regressions',()=>{
 it('creates rounds, reads posting details and closes owned postings',async()=>{await login(COMPANY);expect((await api.getPosting('p-1')).posting.is_open).toBe(true);await expect(api.closePosting('p-1')).resolves.toEqual({ok:true});expect((await api.getPosting('p-1')).posting.is_open).toBe(false);expect((await api.getPostings({all:true})).allPostings.some(p=>p.id==='p-1')).toBe(false);await login(STUDENT);await reject(api.saveRanking(['p-1']),400);await login(ADMIN);const {round}=await api.createRound('Spring follow-up');expect(round.label).toBe('Spring follow-up');expect((await api.getCurrentRound()).round.id).toBe(round.id);});
 it('allows shortlist updates during ranking_locked and rejects invalid statuses',async()=>{await api.loadPreset('fresh');await login(STUDENT);await api.saveRanking(['p-1']);await advance(1);await login(COMPANY);await expect(api.updateShortlist('p-1','s-1','shortlisted')).resolves.toEqual({ok:true});await reject(api.updateShortlist('p-1','s-1','maybe'),400);});
 it('rejects company rankings outside interview phases and accepts a valid shortlisted order',async()=>{await api.loadPreset('mid');await login(COMPANY);await reject(api.submitCompanyRanking('p-1',{ordered_student_ids:['s-1']}),403);await advance(2);await login(COMPANY);await expect(api.submitCompanyRanking('p-1',{ordered_student_ids:['s-1','s-5']})).resolves.toEqual({ok:true});});
 it('rejects invalid scores and score/rank payload combinations',async()=>{await api.loadPreset('mid');await advance(2);await login(COMPANY);await reject(api.submitCompanyRanking('p-1',{ordered_student_ids:['s-1'],scores:{'s-1':9}}),400);await reject(api.submitCompanyRanking('p-1',{scores:{'s-1':11}}),400);});
 it('restricts private notes to shortlisted candidates and allows clearing them',async()=>{await api.loadPreset('mid');await advance(2);await login(COMPANY);await expect(api.saveInterviewNotes('p-1','s-1','Strong interview')).resolves.toEqual({ok:true});await expect(api.saveInterviewNotes('p-1','s-1','')).resolves.toEqual({ok:true});await reject(api.saveInterviewNotes('p-1','s-16','not shortlisted'),404);});
 it('enforces the 2,000 character interview note limit',async()=>{await api.loadPreset('mid');await advance(2);await login(COMPANY);await reject(api.saveInterviewNotes('p-1','s-1','x'.repeat(2001)),400);});
 it('keeps results hidden from companies before reveal',async()=>{await api.loadPreset('mid');await login(COMPANY);await reject(api.getMyMatches(),403);});
 it('lets an admin inspect a match run before results are revealed',async()=>{await api.loadPreset('matchday');const fixture=await import('../../tests/mock/mockDb.js');fixture.updateDb(db=>{db.round.phase='company_locked';return db;});await login(ADMIN);const results=await api.runMatchingNow();expect(results.matched.length).toBeGreaterThan(0);});
 it('returns only the company’s matched postings after reveal',async()=>{await api.loadPreset('matchday');await login(COMPANY);const result=await api.getMyMatches();expect(Array.isArray(result.matches)).toBe(true);expect(result.matches.every(m=>['p-1','p-2'].includes(m.posting_id))).toBe(true);});
 it('restores demo accounts and the admin role after seed reset',async()=>{await login(ADMIN);await api.seed();const {user}=await api.login(...ADMIN);expect(user.is_admin).toBe(true);expect(user.role).toBe('admin');});
 it('does not reveal contact to another posting owner before shortlist lock',async()=>{await api.loadPreset('mid');await login(OTHER_COMPANY);const {applicants}=await api.getApplicants('p-3');expect(applicants.every(a=>!('contact_email'in a))).toBe(true);});
});



