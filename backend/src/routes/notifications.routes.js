import { Router } from 'express';
import { supabase } from '../db/supabaseClient.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateUuidParams } from '../middleware/validateUuidParams.js';
const router=Router();
router.get('/notifications',requireAuth,async(req,res,next)=>{try{const {data,error}=await supabase.from('notifications').select('id,user_id,type,message,read,created_at').eq('user_id',req.user.id).order('created_at',{ascending:false});if(error)throw error;return res.json({notifications:data||[]});}catch(e){next(e);}});
router.patch('/notifications/:id/read',requireAuth,validateUuidParams('id'),async(req,res,next)=>{try{const {data,error}=await supabase.from('notifications').update({read:true}).eq('id',req.params.id).eq('user_id',req.user.id).select('id').maybeSingle();if(error)throw error;if(!data)return res.status(404).json({error:'Notification not found'});return res.json({ok:true});}catch(e){next(e);}});
export default router;
