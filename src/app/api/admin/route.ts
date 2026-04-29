import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getAllDiagnoses } from '@/lib/firestore';

export async function GET(req: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const authHeader = req.headers.get('x-admin-email');

  if (!authHeader || authHeader !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [users, diagnoses] = await Promise.all([getAllUsers(), getAllDiagnoses()]);
    return NextResponse.json({ users, diagnoses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
