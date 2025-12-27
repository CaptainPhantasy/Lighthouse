// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Resend API endpoint
const RESEND_API = 'https://api.resend.com/emails';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }}
    );
  }

  try {
    const { userId, supporterEmail, requestType, magicLink } = await req.json();

    // Validate input
    if (!userId || !supporterEmail || !requestType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, supporterEmail, requestType' }),
        { status: 400, headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }}
      );
    }

    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }}
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseServiceKey ?? ''
    );

    // A. Save the request to Supabase first to get a Unique ID
    const { data, error } = await supabase
      .from('support_requests')
      .insert([
        {
          user_id: userId,
          supporter_email: supporterEmail,
          request_type: requestType,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('DB Error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error', details: error.message }),
        { status: 500, headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }}
      );
    }

    // B. Create the Magic Link using that new Unique ID
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000';
    const finalMagicLink = magicLink || `${siteUrl}/volunteer/${data.id}`;

    // C. Send the Email via Resend
    const emailResponse = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lighthouse Support Circle <send@legacyai.space>',
        to: supporterEmail,
        subject: `Family Support Needed: ${requestType}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Support Request</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
                .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .button:hover { opacity: 0.9; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                h1 { margin: 0; font-size: 24px; }
                p { margin-bottom: 16px; }
                a { color: #667eea; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Lighthouse Support Circle</h1>
                  <p>A family member needs your help</p>
                </div>
                <div class="content">
                  <p>Hello,</p>
                  <p>A family member has requested support with <strong>${requestType}</strong>.</p>
                  <p>Click the button below to view the details and accept if you can help:</p>
                  <div style="text-align: center;">
                    <a href="${finalMagicLink}" class="button">View Request</a>
                  </div>
                  <p style="font-size: 14px; color: #6b7280;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${finalMagicLink}">${finalMagicLink}</a>
                  </p>
                </div>
                <div class="footer">
                  <p>Brought to you by Lighthouse — Guiding families through difficult times.</p>
                </div>
              </div>
            </body>
          </html>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Email Error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email', details: errorText }),
        { status: 500, headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }}
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        requestId: data.id,
        magicLink: finalMagicLink
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Function Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }}
    );
  }
});
