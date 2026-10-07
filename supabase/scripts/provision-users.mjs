// Run once in a new Supabase project after seed.sql. Never bundle the service key in the website.
import 'dotenv/config';
const base=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY,password=process.env.SIMPER_SEED_PASSWORD;
if(!base||!key||!password||password.length<12)throw Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SIMPER_SEED_PASSWORD (12+ chars).');
const headers={'apikey':key,'Authorization':`Bearer ${key}`,'Content-Type':'application/json'};
async function call(path,method,body){const r=await fetch(base+path,{method,headers,body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(`${path}: ${r.status} ${JSON.stringify(data)}`);return data}
const accounts=[...Array.from({length:12},(_,i)=>({nim:`419999${String(i+1).padStart(4,'0')}`,memberId:`M${String(i+1).padStart(3,'0')}`,role:'MEMBER'})),{nim:'4199990901',role:'LIBRARIAN'},{nim:'4199990902',role:'FINANCE'},{nim:'4199990903',role:'ADMIN'}];
for(const a of accounts){
 const result=await call('/auth/v1/admin/users','POST',{email:`${a.nim}@simper.local`,password,email_confirm:true,user_metadata:{nim:a.nim}});
 const uid=result.id||result.user?.id;if(!uid)throw Error(`Auth ID kosong untuk ${a.nim}`);
 await call('/rest/v1/app_role','POST',{auth_uid:uid,role:a.role});
 if(a.memberId)await call(`/rest/v1/member?id=eq.${a.memberId}`,'PATCH',{auth_uid:uid});
 console.log(`Akun ${a.nim} (${a.role}) terhubung`);
}
