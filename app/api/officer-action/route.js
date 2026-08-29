import { NextResponse } from 'next/server';
import {
  getAllApplicationsFromKV,
  updateApplicationStatusInKV,
  logAuditEventToKV,
} from '@/app/api/chat/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const applications = await getAllApplicationsFromKV();
    return NextResponse.json({
      status: 'ok',
      count: applications.length,
      applications: Array.isArray(applications) ? applications : [],
    });
  } catch (err) {
    console.error('Error fetching officer applications:', err);
    return NextResponse.json({
      status: 'error',
      count: 0,
      applications: [],
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { applicationId, action, remark } = body || {};

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: 'applicationId and action are required.' },
        { status: 400 }
      );
    }

    let newStatus = 'Submitted';
    const normAction = action.toString().toLowerCase().trim();
    if (normAction.includes('approve')) {
      newStatus = 'Approved';
    } else if (normAction.includes('reject')) {
      newStatus = 'Rejected';
    } else if (normAction.includes('send back') || normAction.includes('back')) {
      newStatus = 'Sent Back';
    }

    const result = await updateApplicationStatusInKV(applicationId, newStatus, remark || '');

    // Log officer decision to audit log
    await logAuditEventToKV({
      intent: `officer_action_${newStatus.toLowerCase().replace(/\s+/g, '_')}`,
      api_call_made: false,
      payload_sent: null,
      model: 'none (officer manual decision)',
      response_summary: `Officer Smt. Anita Sharma, BSA marked ${applicationId} as '${newStatus}' with remark: '${remark || 'None'}'`,
    });

    return NextResponse.json({
      success: true,
      applicationId,
      status: newStatus,
      remark: remark || '',
      result,
    });
  } catch (err) {
    console.error('Officer action API error:', err);
    return NextResponse.json(
      { error: 'An error occurred while updating application status.' },
      { status: 500 }
    );
  }
}
