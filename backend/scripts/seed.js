import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const force=process.argv.includes('--force');
if(process.env.NODE_ENV==='production'&&!force){console.error('Refusing to seed production. Pass --force to override.');process.exit(1);}
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key){console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');process.exit(1);}
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const accounts=[
 {email:'admin@internmatch.demo',password:'Admin123!',role:'student',admin:true,name:'Demo Admin'},
 {email:'company1@internmatch.demo',password:'Company123!',role:'company',name:'Northstar Labs'},
 {email:'company2@internmatch.demo',password:'Company123!',role:'company',name:'Greenfield Analytics'},
 ...['Alex Kim','Jordan Lee','Sam Rivera','Taylor Morgan'].map((name,i)=>({email:`student${i+1}@internmatch.demo`,password:'Student123!',role:'student',name})),
];
async function authAccount(account){
 const list=await db.auth.admin.listUsers({page:1,perPage:1000});if(list.error)throw list.error;
 let user=list.data.users.find(u=>u.email?.toLowerCase()===account.email.toLowerCase());
 if(!user){const made=await db.auth.admin.createUser({email:account.email,password:account.password,email_confirm:true,user_metadata:{role:account.role},app_metadata:{role:account.role}});if(made.error)throw made.error;user=made.data.user;}
 const row=await db.from('users').upsert({id:user.id,email:account.email,role:account.role,is_admin:!!account.admin},{onConflict:'id'});if(row.error)throw row.error;
 return user;
}
try{
 const users=[];for(const account of accounts)users.push(await authAccount(account));
 for(let i=1;i<=2;i++){const a=accounts[i],u=users[i];const {error}=await db.from('companies').upsert({user_id:u.id,company_name:a.name,industry:i===1?'Software':'Data & Analytics',contact_person:i===1?'Morgan Chen':'Casey Patel'},{onConflict:'user_id'});if(error)throw error;}
 for(let i=4;i<accounts.length;i++){const a=accounts[i],u=users[i];const {error}=await db.from('students').upsert({user_id:u.id,full_name:a.name,department:i%2?'Computer Science':'Data Science',year:'3rd year',skills:i%2?['React','Node.js']:['Python','SQL'],availability:'Full-time summer',contact_email:a.email},{onConflict:'user_id'});if(error)throw error;}
 let active=await db.from('rounds').select('id').order('created_at',{ascending:false}).limit(1).maybeSingle();if(active.error)throw active.error;if(!active.data){const created=await db.from('rounds').insert({label:'InternMatch Demo',phase:'ranking_open'}).select('id').single();if(created.error)throw created.error;active={data:created.data,error:null};}
 const companies=await db.from('companies').select('id,company_name').in('user_id',users.slice(1,3).map(u=>u.id));if(companies.error)throw companies.error;
 for(const c of companies.data){const title=c.company_name==='Northstar Labs'?'Frontend Engineering Intern':'Data Analytics Intern';const found=await db.from('postings').select('id').eq('company_id',c.id).eq('round_id',active.data.id).eq('title',title).maybeSingle();if(found.error)throw found.error;const result=found.data?await db.from('postings').update({required_department:'',required_skills:['React','SQL'],capacity:2}).eq('id',found.data.id):await db.from('postings').insert({company_id:c.id,round_id:active.data.id,title,required_department:'',required_skills:['React','SQL'],capacity:2});if(result.error)throw result.error;}
 const postingRows=await db.from('postings').select('id').eq('round_id',active.data.id);if(postingRows.error)throw postingRows.error;const studentRows=await db.from('students').select('id').in('user_id',users.slice(3).map(u=>u.id));if(studentRows.error)throw studentRows.error;const postingIds=(postingRows.data||[]).map(p=>p.id);for(const [index,student] of (studentRows.data||[]).entries()){const order=index%2?postingIds.slice().reverse():postingIds;const {error}=await db.from('student_rankings').upsert({student_id:student.id,round_id:active.data.id,ordered_posting_ids:order},{onConflict:'student_id,round_id'});if(error)throw error;}
 console.log('Demo accounts (passwords are for local/demo use only):');for(const a of accounts)console.log(`  ${a.role}${a.admin?' admin':''}: ${a.email} / ${a.password}`);
}catch(error){console.error('Seed failed:',error.message);process.exitCode=1;}
