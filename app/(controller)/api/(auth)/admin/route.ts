import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin
export async function GET() {
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
    return NextResponse.json({ success: false, message: 'Failed to fetch admins' }, { status: 500 });
  }
}

// POST → create new admin
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists
    const [existing] = await db.query(
      'SELECT user_id FROM User WHERE email = ?',
      [email]
    )as [Array<{ user_id: number }>, any];

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Email is already in use' }, { status: 409 });
    }

    // Insert admin user
    await db.query(
      'INSERT INTO User (name, email, password, role, login_attempts, suspended) VALUES (?, ?, ?, ?, 0, false)',
      [name, email, password, 'admin']
    );

    return NextResponse.json({ success: true, message: 'Admin created successfully' });
  } catch (err) {
    console.error('Error creating admin:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PUT → toggle suspended status
export async function PUT(req: NextRequest) {
  try {
    const { user_id, suspended } = await req.json();

    if (typeof user_id !== 'number' || typeof suspended !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
    }

    const [rows]: any = await db.query('SELECT role FROM User WHERE user_id = ?', [user_id]);

    if (!rows.length) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    if (rows[0].role !== 'admin') {
      return NextResponse.json({ success: false, message: 'User is not an admin' }, { status: 403 });
    }

    await db.query('UPDATE User SET suspended = ? WHERE user_id = ?', [suspended, user_id]);

    return NextResponse.json({ success: true, message: `Admin ${suspended ? 'banned' : 'un-banned'} successfully` });
  } catch (err) {
    console.error('Ban/unban error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
