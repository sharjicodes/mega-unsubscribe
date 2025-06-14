import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { unsubscribeLink, emailId } = await request.json()
    if (!unsubscribeLink || !emailId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    console.log('Processing unsubscribe request:', { emailId, unsubscribeLink })

    // Handle mailto: links
    if (unsubscribeLink.startsWith('mailto:')) {
      const email = unsubscribeLink.replace('mailto:', '')
      console.log('Sending unsubscribe email to:', email)

      try {
        // Create email content
        const emailContent = [
          'To: ' + email,
          'Subject: Unsubscribe Request',
          'Content-Type: text/plain; charset="UTF-8"',
          'MIME-Version: 1.0',
          '',
          'Please unsubscribe me from your mailing list.'
        ].join('\r\n')

        // Encode the email content
        const encodedEmail = Buffer.from(emailContent)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '')

        console.log('Sending email using Gmail API...')
        // Send the email using Gmail API
        const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedEmail
          })
        })

        if (!sendResponse.ok) {
          const errorData = await sendResponse.json()
          console.error('Failed to send unsubscribe email:', errorData)
          // Continue with moving to trash even if sending fails
          console.log('Continuing despite email send error')
        } else {
          console.log('Successfully sent unsubscribe email')
        }
      } catch (error) {
        console.error('Error sending unsubscribe email:', error)
        // Continue with moving to trash even if sending fails
        console.log('Continuing despite email send error')
      }
    } else {
      // Handle HTTP(S) links
      console.log('Processing HTTP unsubscribe link:', unsubscribeLink)
      
      try {
        // Special handling for LinkedIn unsubscribe links
        if (unsubscribeLink.includes('linkedin.com')) {
          // Extract the necessary parameters from the URL
          const url = new URL(unsubscribeLink)
          const savedSearchId = url.searchParams.get('savedSearchId')
          const midToken = url.searchParams.get('midToken')
          const midSig = url.searchParams.get('midSig')
          
          if (savedSearchId && midToken && midSig) {
            // Construct the LinkedIn unsubscribe API endpoint
            const linkedinUnsubscribeUrl = `https://www.linkedin.com/job-alert-email-unsubscribe`
            const response = await fetch(linkedinUnsubscribeUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (compatible; GmailUnsubscribe/1.0)',
                'Origin': 'https://www.linkedin.com',
                'Referer': 'https://www.linkedin.com/'
              },
              body: new URLSearchParams({
                savedSearchId,
                midToken,
                midSig,
                'm': 'unsub',
                'ts': 'unsub'
              })
            })

            if (!response.ok) {
              console.error('LinkedIn unsubscribe failed:', await response.text())
              // Continue with moving to trash even if LinkedIn unsubscribe fails
              console.log('Continuing despite LinkedIn unsubscribe error')
            } else {
              console.log('Successfully processed LinkedIn unsubscribe')
            }
          }
        } else {
          // Handle other HTTP unsubscribe links
          const response = await fetch(unsubscribeLink, {
            method: 'GET', // Most unsubscribe links work with GET
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; GmailUnsubscribe/1.0)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            }
          })

          if (!response.ok) {
            console.error('HTTP unsubscribe failed:', await response.text())
            // Continue with moving to trash even if HTTP unsubscribe fails
            console.log('Continuing despite HTTP unsubscribe error')
          } else {
            console.log('Successfully processed HTTP unsubscribe')
          }
        }
      } catch (error) {
        console.error('Error processing HTTP unsubscribe:', error)
        // Continue with moving to trash even if HTTP unsubscribe fails
        console.log('Continuing despite HTTP unsubscribe error')
      }
    }

    // Move the email to trash
    console.log('Moving email to trash:', emailId)
    try {
      const trashResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/trash`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          }
        }
      )

      if (!trashResponse.ok) {
        const errorData = await trashResponse.json()
        console.error('Failed to move email to trash:', errorData)
        // Don't throw error here, just log it
        console.log('Continuing despite trash error')
      } else {
        console.log('Successfully moved email to trash')
      }
    } catch (error) {
      console.error('Error moving email to trash:', error)
      // Don't throw error here, just log it
      console.log('Continuing despite trash error')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process unsubscribe request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 