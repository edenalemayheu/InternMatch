import { randomUUID } from 'node:crypto';

export function createFakeSupabase({tables={},tokens={},accounts={}}={}){
 const state=Object.fromEntries(Object.entries(tables).map(([key,rows])=>[key,structuredClone(rows)]));
 const authAccounts=new Map(Object.values(accounts).map(account=>[account.email.toLowerCase(),structuredClone(account)]));
 const tokenUsers=new Map(Object.entries(tokens));
 for(const table of ['users','students','companies','rounds','postings','student_rankings','shortlists','company_rankings','interview_notes','notifications','matches','match_runs'])state[table] ||= [];
 class Query{
  constructor(table){this.table=table;this.op='select';this.filters=[];this.payload=null;this.conflict=null;this.returning=false;this.limitCount=null;this.selection='*';this.ordering=null;}
  select(selection='*'){this.returning=true;this.selection=selection;return this;}
  insert(payload){this.op='insert';this.payload=payload;return this;}
  update(payload){this.op='update';this.payload=payload;return this;}
  upsert(payload,opts={}){this.op='upsert';this.payload=payload;this.conflict=opts.onConflict?.split(',')||['id'];return this;}
  delete(){this.op='delete';return this;}
  eq(key,value){this.filters.push(row=>row[key]===value);return this;}
  in(key,values){this.filters.push(row=>values.includes(row[key]));return this;}
  order(column,options={}){this.ordering={column,ascending:options.ascending!==false};return this;}
  limit(n){this.limitCount=n;return this;}
  matches(row){return this.filters.every(fn=>fn(row));}
  async execute(){let rows=state[this.table];if(!rows)return {data:null,error:{message:`Unknown table ${this.table}`,code:'42P01'}};
   let result;
   if(this.op==='insert'){const input=Array.isArray(this.payload)?this.payload:[this.payload];result=input.map(item=>({...item,id:item.id||randomUUID(),created_at:item.created_at||new Date().toISOString()}));rows.push(...result);}
   else if(this.op==='upsert'){const input=Array.isArray(this.payload)?this.payload:[this.payload];result=input.map(item=>{let old=rows.find(row=>this.conflict.every(key=>row[key]===item[key]));if(old){Object.assign(old,item);return old;}const next={...item,id:item.id||randomUUID(),created_at:item.created_at||new Date().toISOString()};rows.push(next);return next;});}
   else if(this.op==='update'){result=rows.filter(row=>this.matches(row));for(const row of result)Object.assign(row,this.payload);}
   else if(this.op==='delete'){result=rows.filter(row=>this.matches(row));state[this.table]=rows.filter(row=>!this.matches(row));}
   else result=rows.filter(row=>this.matches(row));
   if(this.ordering){const {column,ascending}=this.ordering;result.sort((a,b)=>{const av=a[column],bv=b[column];const cmp=av===bv?0:av===undefined?1:bv===undefined?-1:av<bv?-1:1;return ascending?cmp:-cmp;});}
   if(this.limitCount!==null)result=result.slice(0,this.limitCount);
   if(this.selection.includes('companies('))result=result.map(row=>{
    if(this.table==='postings'){const company=state.companies.find(c=>c.id===row.company_id);return {...row,companies:company?{...company}:null};}
    return row;
   });
   if(this.table==='matches'&&this.selection.includes('postings('))result=result.map(row=>{const posting=state.postings.find(p=>p.id===row.posting_id);if(!posting)return {...row,postings:null};const company=state.companies.find(c=>c.id===posting.company_id);return {...row,postings:{...posting,companies:company?{...company}:null}};});
   return {data:result,error:null};
  }
  async maybeSingle(){const out=await this.execute();return {...out,data:Array.isArray(out.data)?out.data[0]||null:out.data};}
  async single(){const out=await this.maybeSingle();return out.data?out:{data:null,error:{message:'Expected one row',code:'PGRST116'}};}
  then(resolve,reject){return this.execute().then(resolve,reject);}
 }
 function sessionFor(user){const access_token=`fake-access-${user.id}`,refresh_token=`fake-refresh-${user.id}`;tokenUsers.set(access_token,user);return {access_token,refresh_token,expires_at:Math.floor(Date.now()/1000)+3600};}
 return {state,from(table){return new Query(table);},auth:{
  async getUser(token){const user=tokenUsers.get(token);return user?{data:{user},error:null}:{data:{user:null},error:new Error('Invalid token')};},
  async signInWithPassword({email,password}){const account=authAccounts.get(String(email).toLowerCase());if(!account||account.password!==password)return {data:{user:null,session:null},error:new Error('Invalid login')};return {data:{user:account.user,session:sessionFor(account.user)},error:null};},
  async refreshSession({refresh_token}){const user=[...tokenUsers.values()].find(value=>`fake-refresh-${value.id}`===refresh_token);return user?{data:{user,session:sessionFor(user)},error:null}:{data:{user:null,session:null},error:new Error('Invalid refresh token')};},
  admin:{
   async createUser(input){const email=String(input.email).toLowerCase();if(authAccounts.has(email))return {data:{user:null},error:new Error('User already registered')};const user={id:randomUUID(),email:input.email,user_metadata:input.user_metadata||{},app_metadata:input.app_metadata||{}};authAccounts.set(email,{email:input.email,password:input.password,user});return {data:{user},error:null};},
   async deleteUser(id){for(const [email,account] of authAccounts)if(account.user.id===id)authAccounts.delete(email);return {data:{user:null},error:null};},
   async signOut(){return {error:null};},
  },
 }};
}
