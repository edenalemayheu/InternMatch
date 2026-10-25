import { supabase } from '../db/supabaseClient.js';
import { runMatching as computeMatches } from './matching.js';

// Pure, deterministic matching logic is kept in matching.js; this adapter owns
// only the round snapshot reads and persistence.
export { computeMatches };
export async function runMatching(roundId) {
  const reads = await Promise.all([
    supabase.from('students').select('id,full_name'),
    supabase.from('postings').select('id,capacity,title,company_id,companies(company_name)').eq('round_id', roundId),
    supabase.from('student_rankings').select('student_id,ordered_posting_ids').eq('round_id', roundId),
    supabase.from('company_rankings').select('posting_id,ordered_student_ids,scores').eq('round_id', roundId),
  ]);
  for (const result of reads) if (result.error) throw result.error;
  const [studentsResult, postingsResult, studentRankingsResult, companyRankingsResult] = reads;
  const result = computeMatches({
    students: studentsResult.data || [], postings: postingsResult.data || [],
    studentRankings: studentRankingsResult.data || [], companyRankings: companyRankingsResult.data || [],
  });
  const { error: deleteError } = await supabase.from('matches').delete().eq('round_id', roundId);
  if (deleteError) throw deleteError;
  const rows = result.matches.map(match => ({ round_id: roundId, student_id: match.student_id, posting_id: match.posting_id, mutual_score: match.mutual_score }));
  if (rows.length) {
    const { error } = await supabase.from('matches').insert(rows);
    if (error) throw error;
  }
  const students = new Map((studentsResult.data || []).map(s => [s.id,s]));
  const postings = new Map((postingsResult.data || []).map(p => [p.id,p]));
  return {
    matched: result.matches.map(m => {
      const student = students.get(m.student_id), posting = postings.get(m.posting_id);
      return { student_id:m.student_id, posting_id:m.posting_id, mutual_score:m.mutual_score, student_name:student?.full_name || '', posting_title:posting?.title || '', company_name:posting?.companies?.company_name || '' };
    }),
    unmatched_students: result.unmatchedStudents.map(id => ({ id, full_name: students.get(id)?.full_name || '' })),
    unmatched_postings: result.unmatchedPostings.map(id => ({ id, title:postings.get(id)?.title || '', company_name:postings.get(id)?.companies?.company_name || '' })),
  };
}
