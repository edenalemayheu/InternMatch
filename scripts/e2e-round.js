const api=process.env.API_URL||'http://localhost:3001/api';
let failures=0;
function report(name,ok,detail=''){console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`);if(!ok)failures++;}
async function call(method,path,{token,body}={}){const res=await fetch(`${api}${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});let data={};try{data=await res.json();}catch{}if(!res.ok)throw new Error(`${method} ${path} (${res.status}): ${data.error||'request failed'}`);return data;}
async function step(name,fn){try{const v=await fn();report(name,true);return v;}catch(e){report(name,false,e.message);throw e;}}
async function login(email,password){return (await call('POST','/auth/login',{body:{email,password}})).token;}
async function main(){
 try {
 const admin=await step('admin login',()=>login('admin@internmatch.demo','Admin123!'));
 await step('seed demo accounts and postings',()=>call('POST','/admin/seed',{token:admin}));
 const roundData=await step('read active round',()=>call('GET','/rounds/current'));
 if(roundData.round.phase!=='ranking_open')throw new Error(`Active round must be ranking_open; found ${roundData.round.phase}. Use a fresh demo round.`);
 const companyTokens=[];
 for(let i=1;i<=2;i++)companyTokens.push(await step(`company ${i} login`,()=>login(`company${i}@internmatch.demo`,'Company123!')));
 const students=[];
 for(let i=1;i<=4;i++)students.push(await step(`student ${i} login`,async()=>{const token=await login(`student${i}@internmatch.demo`,'Student123!');return token;}));
 const companyPostings=[];
 for(let i=0;i<companyTokens.length;i++){
  let mine=await call('GET','/postings/mine',{token:companyTokens[i]});
  if(!mine.postings.length){const created=await call('POST','/postings',{token:companyTokens[i],body:{title:`E2E Internship ${i+1}`,required_department:'',required_skills:['React'],capacity:2}});mine={postings:[created.posting]};}
  companyPostings.push(...mine.postings.map(p=>({posting:p,token:companyTokens[i]})));
 }
 const all=(await step('list postings for student ranking',()=>call('GET','/postings?all=true',{token:students[0]}))).allPostings;
 if(!all.length)throw new Error('No postings available');
 for(let i=0;i<students.length;i++)await step(`student ${i+1} submits ranking`,()=>call('POST','/rankings',{token:students[i],body:{ordered_posting_ids:all.map(p=>p.id)}}));
 for(const phase of ['ranking_locked','shortlisting','shortlist_locked','interviewing','company_ranking'])await step(`advance phase to ${phase}`,async()=>{let r;do{r=await call('POST','/admin/rounds/advance-phase',{token:admin});}while(r.round.phase!==phase);return r;});
 for(const {posting,token} of companyPostings){const a=await step(`load applicants for ${posting.title}`,()=>call('GET',`/postings/${posting.id}/applicants`,{token}));for(const student of a.applicants)await step(`shortlist ${student.full_name}`,()=>call('PATCH',`/shortlists/${posting.id}/${student.id}`,{token,body:{shortlist_status:'shortlisted'}}));await step(`submit company ranking for ${posting.title}`,()=>call('POST','/company-rankings',{token,body:{posting_id:posting.id,ordered_student_ids:a.applicants.map(s=>s.id)}}));}
 await step('lock company rankings',async()=>{let r;do{r=await call('POST','/admin/rounds/advance-phase',{token:admin});}while(r.round.phase!=='company_locked');return r;});
 await step('run matching',()=>call('POST','/admin/rounds/run-matching',{token:admin}));
 await step('mark round matched',()=>call('POST','/admin/rounds/advance-phase',{token:admin}));
 await step('reveal results',()=>call('POST','/admin/rounds/advance-phase',{token:admin}));
 for(let i=0;i<students.length;i++)await step(`student ${i+1} reads result`,()=>call('GET','/matches/me',{token:students[i]}));
 for(let i=0;i<companyTokens.length;i++)await step(`company ${i+1} reads matches`,()=>call('GET','/matches/me',{token:companyTokens[i]}));
}catch(e){if(!failures)report('round workflow',false,e.message);}
main().finally(()=>{if(failures)process.exitCode=1;});


}
