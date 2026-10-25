import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createFakeSupabase } from '../db/fakeSupabase.js';

process.env.VERCEL='1';process.env.NODE_ENV='test';
const studentId='11111111-1111-4111-8111-111111111111';
const companyId='22222222-2222-4222-8222-222222222222';
let server,base,state;
const fake=createFakeSupabase({tables:{users:[{id:studentId,email:'student@example.com',role:'student',is_admin:false},{id:companyId,email:'company@example.com',role:'company',is_admin:false}]},tokens:{'student-token':{id:studentId,email:'student@example.com'},'company-token':{id:companyId,email:'company@example.com'}}});
async function request(method,path,{token,body}={}){const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:res.status,body:await res.json()};}
const studentBody={full_name:'Jordan Lee',department:'Computer Science',year:'3rd year',skills:['React'],availability:'Full-time summer'};
const companyBody={company_name:'Northstar Labs',industry:'Software',contact_person:'Morgan Chen'};
before(async()=>{const adapter=await import('../db/supabaseClient.js');adapter.setSupabaseForTests(fake);const {default:app}=await import('../app.js');server=app.listen(0);await once(server,'listening');base=`http://127.0.0.1:${server.address().port}/api`;state=fake.state;});
after(()=>new Promise(resolve=>server?.close(resolve)));

test('student profile create validates, authenticates, and derives contact from the token',async()=>{
 const unauthorized=await request('POST','/students',{body:studentBody});assert.equal(unauthorized.status,401);
 const wrongRole=await request('POST','/students',{token:'company-token',body:studentBody});assert.equal(wrongRole.status,403);
 const invalid=await request('POST','/students',{token:'student-token',body:{...studentBody,department:'not a department'}});assert.equal(invalid.status,400);assert.ok(invalid.body.fields.department);
 const created=await request('POST','/students',{token:'student-token',body:{...studentBody,user_id:companyId,contact_email:'spoof@example.com'}});assert.equal(created.status,201);assert.equal(created.body.student.user_id,studentId);assert.equal(created.body.student.contact_email,'student@example.com');
});
test('student profile read and update are owner scoped and validate input',async()=>{
 assert.equal((await request('GET','/students/me')).status,401);
 assert.equal((await request('GET','/students/me',{token:'company-token'})).status,403);
 assert.equal((await request('GET','/students/me',{token:'student-token'})).body.student.full_name,'Jordan Lee');
 assert.equal((await request('PATCH','/students/me',{token:'student-token',body:{year:'Not a year'}})).status,400);
 const updated=await request('PATCH','/students/me',{token:'student-token',body:{full_name:'Jordan K'}});assert.equal(updated.status,200);assert.equal(updated.body.student.full_name,'Jordan K');
});
test('company profile create validates, authenticates, and ignores client identity fields',async()=>{
 assert.equal((await request('POST','/companies',{body:companyBody})).status,401);
 assert.equal((await request('POST','/companies',{token:'student-token',body:companyBody})).status,403);
 assert.equal((await request('POST','/companies',{token:'company-token',body:{...companyBody,industry:'Unknown'}})).status,400);
 const created=await request('POST','/companies',{token:'company-token',body:{...companyBody,user_id:studentId}});assert.equal(created.status,201);assert.equal(created.body.company.user_id,companyId);
});
test('company profile read and update are owner scoped and validate input',async()=>{
 assert.equal((await request('GET','/companies/me')).status,401);
 assert.equal((await request('GET','/companies/me',{token:'student-token'})).status,403);
 assert.equal((await request('GET','/companies/me',{token:'company-token'})).body.company.company_name,'Northstar Labs');
 assert.equal((await request('PATCH','/companies/me',{token:'company-token',body:{industry:'Unknown'}})).status,400);
 const updated=await request('PATCH','/companies/me',{token:'company-token',body:{contact_person:'Taylor'}});assert.equal(updated.status,200);assert.equal(updated.body.company.contact_person,'Taylor');
});
