import { NextResponse } from 'next/server';
import { getAuditLogsFromKV } from '@/app/api/chat/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await getAuditLogsFromKV();
    return NextResponse.json({
      status: 'ok',
      count: logs.length,
      logs: Array.isArray(logs) ? logs : [],
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return NextResponse.json({
      status: 'error',
      count: 0,
      logs: [],
    });
  }
}
