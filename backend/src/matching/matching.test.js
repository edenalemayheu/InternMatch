import test from 'node:test';
import assert from 'node:assert/strict';
import { runMatching, scoresToRanks } from './matching.js';

test('matches mutual interest and excludes one-sided interest', () => {
  const result = runMatching({ students:[{id:'s1'},{id:'s2'}], postings:[{id:'p1',capacity:1}], studentRankings:[{student_id:'s1',ordered_posting_ids:['p1']},{student_id:'s2',ordered_posting_ids:['p1']}], companyRankings:[{posting_id:'p1',ordered_student_ids:['s1']}] });
  assert.equal(result.matches.length,1); assert.deepEqual(result.unmatchedStudents,['s2']);
});
test('score ties use rank then stable ids', () => {
  const result=runMatching({students:[{id:'b'},{id:'a'}],postings:[{id:'p',capacity:1}],studentRankings:[{student_id:'b',ordered_posting_ids:['p']},{student_id:'a',ordered_posting_ids:['p']}],companyRankings:[{posting_id:'p',ordered_student_ids:['a','b']}]});
  assert.equal(result.matches[0].student_id,'a');
});
test('capacity greater than one accepts multiple students', () => {
  const result=runMatching({students:[{id:'a'},{id:'b'}],postings:[{id:'p',capacity:2}],studentRankings:[{student_id:'a',ordered_posting_ids:['p']},{student_id:'b',ordered_posting_ids:['p']}],companyRankings:[{posting_id:'p',ordered_student_ids:['a','b']}]});
  assert.equal(result.matches.length,2); assert.deepEqual(result.unmatchedPostings,[]);
});
test('score ranking ties use ascending student id', () => assert.deepEqual(scoresToRanks({b:8,a:8,c:9}),['c','a','b']));
test('empty input returns empty results', () => assert.deepEqual(runMatching({students:[],postings:[],studentRankings:[],companyRankings:[]}),{matches:[],unmatchedStudents:[],unmatchedPostings:[],scoredPairs:[]}));
test('same input always gives same results', () => {
 const input={students:[{id:'s'}],postings:[{id:'z',capacity:1},{id:'a',capacity:1}],studentRankings:[{student_id:'s',ordered_posting_ids:['z','a']}],companyRankings:[{posting_id:'z',ordered_student_ids:['s']},{posting_id:'a',ordered_student_ids:['s']}]};
 assert.deepEqual(runMatching(input),runMatching(input));
});
