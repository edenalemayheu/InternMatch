// Make an existing user an admin. Run manually by the developer, never exposed over HTTP.
//   npm run promote-admin -- you@example.com
// (The user must have signed up normally first.)
import { supabase } from '../db/supabaseClient.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run promote-admin -- <email>');
  process.exit(1);
}

const { data, error } = await supabase
  .from('users')
  .update({ is_admin: true })
  .eq('email', email)
  .select('id, email, is_admin');

if (error) {
  console.error('Failed:', error.message);
  process.exit(1);
}
if (!data?.length) {
  console.error(`No user found with email ${email}. Sign up first.`);
  process.exit(1);
}
console.log('Done:', data[0]);
