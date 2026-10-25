import { Router } from 'express';
import { supabase } from '../db/supabaseClient.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();
const departments = ['Computer Science','Data Science','Business','Engineering','Environmental Science','Finance','Education','Design','Other'];
const years = ['1st year','2nd year','3rd year','4th year','Postgraduate','Other'];
const availability = ['Full-time summer','Part-time (20h/week)','Remote only','Flexible'];
const allowed = ['full_name','department','year','skills','portfolio_url','availability'];
const pick = (obj, keys) => Object.fromEntries(keys.filter(k => obj[k] !== undefined).map(k => [k,obj[k]]));
function validate(body, partial = false) {
  const fields = {};
  for (const key of allowed) {
    const value = body?.[key];
    if (partial && value === undefined) continue;
    if (key === 'full_name' && (typeof value !== 'string' || !value.trim() || value.length > 120)) fields[key] = 'Enter a name up to 120 characters';
    if (key === 'department' && !departments.includes(value)) fields[key] = 'Choose a listed department';
    if (key === 'year' && !years.includes(value)) fields[key] = 'Choose a listed year';
    if (key === 'availability' && !availability.includes(value)) fields[key] = 'Choose a listed availability';
    if (key === 'skills' && (!Array.isArray(value) || (!partial && value.length < 1) || value.some(x => typeof x !== 'string' || !x.trim() || x.length > 60))) fields[key] = 'Provide a list of skills';
    if (key === 'portfolio_url' && value !== undefined && value !== null && value !== '' && (typeof value !== 'string' || !/^https?:\/\//i.test(value))) fields[key] = 'Enter a valid URL';
  }
  return fields;
}
router.post('/students', requireAuth, requireRole('student'), async (req,res,next) => {
  const fields = validate(req.body);
  if (Object.keys(fields).length) return res.status(400).json({ error:'Validation failed', fields });
  try {
    const { data: existing, error: findError } = await supabase.from('students').select('id').eq('user_id',req.user.id).maybeSingle();
    if (findError) throw findError;
    if (existing) return res.status(409).json({ error:'Student profile already exists' });
    const row = { ...pick(req.body,allowed), full_name:req.body.full_name.trim(), contact_email:req.authUser.email, user_id:req.user.id };
    const { data, error } = await supabase.from('students').insert(row).select('*').single();
    if (error) throw error;
    return res.status(201).json({ student: pick(data,['id','user_id','full_name','department','year','skills','portfolio_url','availability','contact_email','created_at']) });
  } catch(e) { return next(e); }
});
router.get('/students/me', requireAuth, requireRole('student'), async (req,res,next) => {
  try {
    const {data,error}=await supabase.from('students').select('*').eq('user_id',req.user.id).maybeSingle();
    if(error) throw error;
    return res.json({student:data ? pick(data,['id','user_id','full_name','department','year','skills','portfolio_url','availability','contact_email','created_at']) : null});
  } catch(e) { return next(e); }
});
router.patch('/students/me', requireAuth, requireRole('student'), async (req,res,next) => {
  const fields=validate(req.body,true);
  if(Object.keys(fields).length) return res.status(400).json({error:'Validation failed',fields});
  const changes=pick(req.body,allowed);
  if(!Object.keys(changes).length) return res.status(400).json({error:'Validation failed',fields:{_:'Provide at least one profile field'}});
  if(typeof changes.full_name==='string') changes.full_name=changes.full_name.trim();
  try {
    const {data,error}=await supabase.from('students').update(changes).eq('user_id',req.user.id).select('*').maybeSingle();
    if(error) throw error;
    if(!data) return res.status(404).json({error:'Student profile not found'});
    return res.json({student:pick(data,['id','user_id','full_name','department','year','skills','portfolio_url','availability','contact_email','created_at'])});
  } catch(e) { return next(e); }
});
export default router;
