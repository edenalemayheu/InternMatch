// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Load a fresh copy of the client in demo mode, whatever the local .env says.
let api;
beforeEach(async () => {
  localStorage.clear(); sessionStorage.clear();
  vi.resetModules();
  vi.stubEnv('VITE_USE_MOCK', 'true');
  api = await import('./apiClient.js');
});
afterEach(() => vi.unstubAllEnvs());

describe('profile editing (mock API)', () => {
  it('student can update their profile and gets the saved record back', async () => {
    await api.login('student1@internmatch.demo', 'Student123!');
    const { student } = await api.updateStudentProfile({ full_name: 'Alex K.', skills: ['react', 'sql'] });
    expect(student.full_name).toBe('Alex K.');
    expect(student.skills).toEqual(['react', 'sql']);
    expect(student.department).toBe('Computer Science'); // untouched fields kept (PATCH)
    const again = await api.getMyStudentProfile();
    expect(again.student.full_name).toBe('Alex K.');
  });

  it('student cannot change contact_email, id or user_id', async () => {
    await api.login('student1@internmatch.demo', 'Student123!');
    const { student } = await api.updateStudentProfile({ contact_email: 'evil@x.com', id: 'hacked', user_id: 'u-other', year: '4th year' });
    expect(student.contact_email).toBe('student1@internmatch.demo');
    expect(student.id).toBe('s-1');
    expect(student.user_id).toBe('u-s1');
    expect(student.year).toBe('4th year');
  });

  it('company can update their profile', async () => {
    await api.login('company1@internmatch.demo', 'Company123!');
    const { company } = await api.updateCompanyProfile({ contact_person: 'New Person', logo_url: null });
    expect(company.contact_person).toBe('New Person');
    const again = await api.getMyCompanyProfile();
    expect(again.company.contact_person).toBe('New Person');
  });

  it('roles cannot edit each other\'s profile type', async () => {
    await api.login('student1@internmatch.demo', 'Student123!');
    await expect(api.updateCompanyProfile({ company_name: 'X' })).rejects.toMatchObject({ status: 403 });
    await api.login('company1@internmatch.demo', 'Company123!');
    await expect(api.updateStudentProfile({ full_name: 'X' })).rejects.toMatchObject({ status: 403 });
  });

  it('editing works in any phase (not phase-restricted)', async () => {
    await api.login('admin@internmatch.demo', 'Admin123!');
    for (let i = 0; i < 4; i++) await api.advancePhase();
    await api.login('student1@internmatch.demo', 'Student123!');
    const { student } = await api.updateStudentProfile({ availability: 'Flexible' });
    expect(student.availability).toBe('Flexible');
  });
});
