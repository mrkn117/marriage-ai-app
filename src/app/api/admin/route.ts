import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const authHeader = req.headers.get('x-admin-email');

  if (!adminEmail || !authHeader || authHeader !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { getAllUsers, getAllDiagnoses } = await import('@/lib/firestore');

    const [users, diagnoses] = await Promise.race([
      Promise.all([getAllUsers(), getAllDiagnoses()]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 15_000)
      ),
    ]);

    return NextResponse.json({ users, diagnoses });
  } catch (err: any) {
    console.error('[admin] Error:', err?.message);
    const isTimeout = err?.message?.includes('timeout');
    return NextResponse.json(
      { error: isTimeout ? 'データ取得がタイムアウトしました' : err.message ?? 'サーバーエラー' },
      { status: 500 }
    );
  }
}
