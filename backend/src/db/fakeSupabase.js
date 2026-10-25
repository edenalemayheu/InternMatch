import { randomUUID } from 'node:crypto';

export function createFakeSupabase({tables={},tokens={}}={}){
 const state=Object.fromEntries(Object.entries(tables).map(([key,rows])=>[key,structuredClone(rows)]));
 for(const table of ['users','students','companies','rounds','postings','student_rankings','shortlists','company_rankings','interview_notes','notifications','matches','match_runs'])state[table] ||= [];
 class Query{
  constructor(table){this.table=table;this.op='select';this.filters=[];this.payload=null;this.conflict=null;this.returning=false;this.limitCount=null;}
  select(){this.returning=true;return this;}
  insert(payload){this.op='insert';this.payload=payload;return this;}
  update(payload){this.op='update';this.payload=payload;return this;}
  upsert(payload,opts={}){this.op='upsert';this.payload=payload;this.conflict=opts.onConflict?.split(',')||['id'];return this;}
  delete(){this.op='delete';return this;}
  eq(key,value){this.filters.push(row=>row[key]===value);return this;}
  in(key,values){this.filters.push(row=>values.includes(row[key]));return this;}
  order(){return this;}
  limit(n){this.limitCount=n;return this;}
  matches(row){return this.filters.every(fn=>fn(row));}
  async execute(){let rows=state[this.table];if(!rows)return {data:null,error:{message:`Unknown table ${this.table}`,code:'42P01'}};
   let result;
   if(this.op==='insert'){const input=Array.isArray(this.payload)?this.payload:[this.payload];result=input.map(item=>({...item,id:item.id||randomUUID(),created_at:item.created_at||new Date().toISOString()}));rows.push(...result);}
   else if(this.op==='upsert'){const input=Array.isArray(this.payload)?this.payload:[this.payload];result=input.map(item=>{let old=rows.find(row=>this.conflict.every(key=>row[key]===item[key]));if(old){Object.assign(old,item);return old;}const next={...item,id:item.id||randomUUID(),created_at:item.created_at||new Date().toISOString()};rows.push(next);return next;});}
   else if(this.op==='update'){result=rows.filter(row=>this.matches(row));for(const row of result)Object.assign(row,this.payload);}
   else if(this.op==='delete'){result=rows.filter(row=>this.matches(row));state[this.table]=rows.filter(row=>!this.matches(row));}
   else result=rows.filter(row=>this.matches(row));
   if(this.limitCount!==null)result=result.slice(0,this.limitCount);
   return {data:result,error:null};
  }
  async maybeSingle(){const out=await this.execute();return {...out,data:Array.isArray(out.data)?out.data[0]||null:out.data};}
  async single(){const out=await this.maybeSingle();return out.data?out:{data:null,error:{message:'Expected one row',code:'PGRST116'}};}
  then(resolve,reject){return this.execute().then(resolve,reject);}
 }
 return {state,from(table){return new Query(table);},auth:{async getUser(token){const user=tokens[token];return user?{data:{user},error:null}:{data:{user:null},error:new Error('Invalid token')};}}};
}
