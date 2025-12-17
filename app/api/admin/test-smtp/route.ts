import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test SMTP Connection',
      html: '<h1>SMTP Test Successful</h1><p>This is a test email from Kekeli Project Manager</p>'
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      result
    });
  } catch (error) {
    console.error('SMTP Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
