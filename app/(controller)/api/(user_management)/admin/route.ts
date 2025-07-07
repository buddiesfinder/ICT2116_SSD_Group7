import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decodeJwt } from '@/lib/jwt';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';

const SALT_ROUNDS = 20; // Cost Factor for bcrypt

// Utility: ensure token and admin role
async function isOwner(req: NextRequest) {
  const token = req.cookies.get('refresh_token')?.value;
  if (!token) return null;

  try {
    const { success, message, payload } = await verifyRefreshToken(token);
    
    if (!success) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    return payload.role === 'owner' ? payload : null;
  } catch {
    return null;
  }
}

// GET /api/admin → List admins
export async function GET(req: NextRequest) {
  const admin = await isOwner(req);
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });

  try {
    const [admins] = await db.query(`
      SELECT user_id, name, email, suspended
      FROM User
      WHERE role = 'admin'
      ORDER BY user_id ASC
    `);

    return NextResponse.json({ success: true, admins });
  } catch (err) {
    console.error('Error fetching admins:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch owner' }, { status: 500 });
  }
}

// POST /api/admin → Create new admin
export async function POST(req: NextRequest) {
  const admin = await isOwner(req);
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const [existing] = await db.execute(
      'SELECT user_id FROM User WHERE email = ?',
      [email]
    ) as [Array<{ user_id: number }>, any];

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Email is already in use' }, { status: 409 });
    }

    // Hash the password with bcrypt
    const adminhashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await db.execute(
      'INSERT INTO User (name, email, password, role, login_attempts, suspended) VALUES (?, ?, ?, ?, 0, false)',
      [name, email, adminhashedPassword, 'admin']
    );

    return NextResponse.json({ success: true, message: 'Admin created successfully' });
  } catch (err) {
    console.error('Error creating admin:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PUT /api/admin → Ban/unban admin
export async function PUT(req: NextRequest) {
  const admin = await isOwner(req);
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });

  try {
    const { user_id, suspended } = await req.json();

    if (typeof user_id !== 'number' || typeof suspended !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
    }

    const [rows]: any = await db.execute('SELECT role FROM User WHERE user_id = ?', [user_id]);

    if (!rows.length) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    if (rows[0].role !== 'admin') {
      return NextResponse.json({ success: false, message: 'User is not an admin' }, { status: 403 });
    }

    await db.execute('UPDATE User SET suspended = ? WHERE user_id = ?', [suspended, user_id]);

    return NextResponse.json({ success: true, message: `Admin ${suspended ? 'banned' : 'un-banned'} successfully` });
  } catch (err) {
    console.error('Ban/unban error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
