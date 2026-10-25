import { Router } from 'express';
import { supabase } from '../db/supabaseClient.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();
const industries=['Software','Data & Analytics','Cloud Infrastructure','Sustainability Tech','Fintech','Healthcare Tech','EdTech','Consulting','Other'];
const allowed=['company_name','industry','contact_person','logo_url'];
const pick=(obj,keys)=>Object.fromEntries(keys.filter(k=>obj[k]!==undefined).map(k=>[k,obj[k]]));
function validate(body,partial=false){
 const fields={};
 for(const key of allowed){const v=body?.[key];if(partial&&v===undefined)continue;
  if((key==='company_name'||key==='contact_person')&&(typeof v!=='string'||!v.trim()||v.length>120))fields[key]='Enter a value up to 120 characters';
  if(key==='industry'&&!industries.includes(v))fields[key]='Choose a listed industry';
  if(key==='logo_url'&&v!==undefined&&v!==null&&v!==''&&(typeof v!=='string'||!/^https?:\/\//i.test(v)))fields[key]='Enter a valid URL or null';
 }return fields;
}
const response=data=>pick(data,['id','user_id','company_name','industry','contact_person','logo_url','created_at']);
router.post('/companies',requireAuth,requireRole('company'),async(req,res,next)=>{
 const fields=validate(req.body);if(Object.keys(fields).length)return res.status(400).json({error:'Validation failed',fields});
 try{const {data:old,error:findError}=await supabase.from('companies').select('id').eq('user_id',req.user.id).maybeSingle();if(findError)throw findError;if(old)return res.status(409).json({error:'Company profile already exists'});
 const {data,error}=await supabase.from('companies').insert({...pick(req.body,allowed),user_id:req.user.id}).select('*').single();if(error)throw error;return res.status(201).json({company:response(data)});
 }catch(e){return next(e);}
});
router.get('/companies/me',requireAuth,requireRole('company'),async(req,res,next)=>{
 try{const {data,error}=await supabase.from('companies').select('*').eq('user_id',req.user.id).maybeSingle();if(error)throw error;return res.json({company:data?response(data):null});}catch(e){return next(e);}
});
router.patch('/companies/me',requireAuth,requireRole('company'),async(req,res,next)=>{
 const fields=validate(req.body,true);if(Object.keys(fields).length)return res.status(400).json({error:'Validation failed',fields});const changes=pick(req.body,allowed);if(!Object.keys(changes).length)return res.status(400).json({error:'Validation failed',fields:{_:'Provide at least one profile field'}});
 try{const {data,error}=await supabase.from('companies').update(changes).eq('user_id',req.user.id).select('*').maybeSingle();if(error)throw error;if(!data)return res.status(404).json({error:'Company profile not found'});return res.json({company:response(data)});}catch(e){return next(e);}
});
router.get('/companies/stats',requireAuth,requireRole('company'),async(req,res,next)=>{
 try{
  const c=await supabase.from('companies').select('id').eq('user_id',req.user.id).maybeSingle();if(c.error)throw c.error;
  if(!c.data)return res.json({postingsCount:0,applicantsCount:0,shortlistedCount:0});
  const r=await supabase.from('rounds').select('id').order('created_at',{ascending:false}).limit(1).maybeSingle();if(r.error)throw r.error;
  if(!r.data)return res.json({postingsCount:0,applicantsCount:0,shortlistedCount:0});
  const p=await supabase.from('postings').select('id').eq('company_id',c.data.id).eq('round_id',r.data.id);if(p.error)throw p.error;
  const ids=(p.data||[]).map(x=>x.id);if(!ids.length)return res.json({postingsCount:0,applicantsCount:0,shortlistedCount:0});
  const [rankings,shortlists]=await Promise.all([supabase.from('student_rankings').select('student_id,ordered_posting_ids').eq('round_id',r.data.id),supabase.from('shortlists').select('student_id,posting_id,shortlist_status').eq('round_id',r.data.id)]);
  if(rankings.error)throw rankings.error;if(shortlists.error)throw shortlists.error;
  const applicants=new Set((rankings.data||[]).filter(x=>(x.ordered_posting_ids||[]).some(id=>ids.includes(id))).map(x=>x.student_id));
  const shortlist=new Set((shortlists.data||[]).filter(x=>ids.includes(x.posting_id)&&x.shortlist_status==='shortlisted').map(x=>x.student_id));
  return res.json({postingsCount:ids.length,applicantsCount:applicants.size,shortlistedCount:shortlist.size});
 }catch(e){next(e);}
});
export default router;
