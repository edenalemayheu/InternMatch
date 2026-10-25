import { Router } from 'express';
import { supabase } from '../db/supabaseClient.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
const router=Router();
async function currentRound(){const {data,error}=await supabase.from('rounds').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;return data;}
router.post('/rankings',requireAuth,requireRole('student'),async(req,res,next)=>{
 const ids=req.body?.ordered_posting_ids;if(!Array.isArray(ids)||ids.some(x=>typeof x!=='string')||new Set(ids).size!==ids.length)return res.status(400).json({error:'Validation failed',fields:{ordered_posting_ids:'Must be a list of unique posting IDs'}});
 try{const r=await currentRound();if(!r)return res.status(404).json({error:'No active round'});if(r.phase!=='ranking_open')return res.status(403).json({error:'Action not allowed in current phase',currentPhase:r.phase});const student=await supabase.from('students').select('id').eq('user_id',req.user.id).maybeSingle();if(student.error)throw student.error;if(!student.data)return res.status(403).json({error:'Student profile required'});const postings=await supabase.from('postings').select('id,is_open').eq('round_id',r.id).eq('is_open',true);if(postings.error)throw postings.error;const known=new Set((postings.data||[]).map(p=>p.id));if(ids.some(id=>!known.has(id)))return res.status(400).json({error:'Validation failed',fields:{ordered_posting_ids:'Every posting must belong to the current round and be open'}});const {error}=await supabase.from('student_rankings').upsert({student_id:student.data.id,round_id:r.id,ordered_posting_ids:ids},{onConflict:'student_id,round_id'});if(error)throw error;return res.json({ok:true});}catch(e){next(e);}
});
router.get('/rankings/me',requireAuth,requireRole('student'),async(req,res,next)=>{try{const r=await currentRound();if(!r)return res.json({ranking:null});const student=await supabase.from('students').select('id').eq('user_id',req.user.id).maybeSingle();if(student.error)throw student.error;if(!student.data)return res.json({ranking:null});const {data,error}=await supabase.from('student_rankings').select('*').eq('student_id',student.data.id).eq('round_id',r.id).maybeSingle();if(error)throw error;return res.json({ranking:data});}catch(e){next(e);}});
export default router;
