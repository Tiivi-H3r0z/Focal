import { NextRequest, NextResponse } from 'next/server'

// Email notification endpoint
// To enable actual email sending, configure an email service like:
// - Resend (https://resend.com)
// - SendGrid
// - Nodemailer with SMTP
// Add the API key to your environment variables

interface NotificationRequest {
  dossierId: string
  clientName: string
  selectionCount: number
  notificationEmail: string
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationRequest = await request.json()
    const { dossierId, clientName, selectionCount, notificationEmail } = body

    if (!notificationEmail) {
      return NextResponse.json(
        { error: 'No notification email configured' },
        { status: 400 }
      )
    }

    // Log the notification (for debugging/verification)
    console.log('=== NOTIFICATION EMAIL ===')
    console.log(`To: ${notificationEmail}`)
    console.log(`Subject: Nouvelle sélection de photos - ${clientName}`)
    console.log(`Client: ${clientName}`)
    console.log(`Photos sélectionnées: ${selectionCount}`)
    console.log(`Dossier ID: ${dossierId}`)
    console.log('========================')

    // TODO: Implement actual email sending
    // Example with Resend:
    //
    // import { Resend } from 'resend'
    // const resend = new Resend(process.env.RESEND_API_KEY)
    //
    // await resend.emails.send({
    //   from: 'Focal Studio <notifications@yourdomain.com>',
    //   to: notificationEmail,
    //   subject: `Nouvelle sélection de photos - ${clientName}`,
    //   html: `
    //     <h1>Nouvelle sélection de photos</h1>
    //     <p>Le client <strong>${clientName}</strong> a soumis sa sélection de photos.</p>
    //     <p><strong>${selectionCount}</strong> photos ont été sélectionnées.</p>
    //     <p>
    //       <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dossiers/${dossierId}">
    //         Voir la sélection
    //       </a>
    //     </p>
    //   `,
    // })

    return NextResponse.json({
      success: true,
      message: 'Notification logged (email service not configured)',
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
