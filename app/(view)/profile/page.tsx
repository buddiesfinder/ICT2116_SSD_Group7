// import { cookies } from 'next/headers';
// import { decodeJwt } from '@/lib/jwt';
// import { db } from '@/lib/db';
// import ClientPage from './Clientpage';
// import ResetPasswordPage from './ResetPasswordPage';
// import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';
// import { redirect } from 'next/navigation';
// import { verify } from 'crypto';

// export default async function ProfilePage() {
//   const cookieStore = await cookies(); 
//   const token = cookieStore.get('refresh_token')?.value ?? null;

//   if (token == null){
//     redirect('/login');
//   }
//   let email: string | null = null;
//   let role: string | null = null;
//   let name: string | null = null;

//   if (token) {
//     try {
//       const { success, message, payload } = await verifyRefreshToken(token);
//       if (!success) {
//         redirect('/login');
//       }
  
//       email = payload.user_email ?? null;
//       role  = payload.role       ?? null;    
    
//       // Get userId from JWT payload
//       const userId = payload.userId;
//       if (userId) {
//         const [rows] = await db.execute('SELECT name FROM User WHERE user_id = ?', [userId]) as [any[], any];
//         name = rows[0]?.name ?? null;
//       }

//     } catch (e) {
//       console.error('Invalid token in profile page', e);
//     }
//   }

//   return <>
//     <ClientPage email={email} role ={role} name={name}/> 
//     <ResetPasswordPage token={token}/>
//     </>;

// }

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';
import { db } from '@/lib/db';

import ClientPage from './Clientpage';
import ResetPasswordPage from './ResetPasswordPage';

export default async function ProfilePage() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('refresh_token')?.value;

  if (!token) {
    redirect('/login');
    return null; // Not strictly necessary, but good practice
  }

  let email: string | null = null;
  let role: string | null = null;
  let name: string | null = null;

  try {
    const { success, payload } = await verifyRefreshToken(token);

    if (!success || !payload) {
      redirect('/login');
      return null;
    }

    email = payload.user_email ?? null;
    role = payload.role ?? null;

    const userId = payload.userId;
    if (userId) {
      const [rows] = await db.execute(
        'SELECT name FROM User WHERE user_id = ?',
        [userId]
      ) as [any[], any];

      name = rows[0]?.name ?? null;
    }
  } catch (err) {
    console.error('Invalid token in profile page:', err);
    redirect('/login');
    return null;
  }

  return (
    <>
      <ClientPage email={email} role={role} name={name} />
      <ResetPasswordPage token={token} />
    </>
  );
}
