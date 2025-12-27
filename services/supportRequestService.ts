import { supabase, SupportRequest, SUPPORT_REQUESTS_TABLE } from './supabaseClient';

// Supabase Edge Function URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-support-email`;

/**
 * Sends a support request email via Supabase Edge Function
 * This creates the request in Supabase and sends the magic link email
 *
 * @param userId - The user's ID
 * @param supporterEmail - The supporter's email address
 * @param requestType - Type of support request (e.g., "Transportation", "Meal Prep")
 * @returns Object with success status, magic link, and optional error
 */
export async function sendSupportRequest(
  userId: string,
  supporterEmail: string,
  requestType: string
): Promise<{ success: boolean; magicLink?: string; error?: any; data?: any }> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId,
        supporterEmail,
        requestType
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to send support request' };
    }

    const data = await response.json();
    return { success: true, magicLink: data.magicLink, data };
  } catch (error) {
    console.error('Support Request Error:', error);
    return { success: false, error };
  }
}

// Alias for compatibility - allows importing as either sendSupportRequest or createSupportRequest
export { sendSupportRequest as createSupportRequest };

/**
 * Fetches a support request by ID
 * @param requestId - The unique request ID
 */
export async function getSupportRequest(requestId: string) {
  try {
    const { data, error } = await supabase
      .from(SUPPORT_REQUESTS_TABLE)
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Fetch Request Error:', error);
    return { success: false, error };
  }
}

/**
 * Updates a support request status
 * @param requestId - The unique request ID
 * @param status - New status ('fulfilled' or 'declined')
 */
export async function updateSupportRequestStatus(
  requestId: string,
  status: 'fulfilled' | 'declined'
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from(SUPPORT_REQUESTS_TABLE)
      .update({
        status,
        fulfilled_at: status === 'fulfilled' ? new Date().toISOString() : null
      })
      .eq('id', requestId);

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Update Request Error:', error);
    return { success: false, error };
  }
}

/**
 * Gets all support requests for a user
 * @param userId - The user's ID
 */
export async function getUserSupportRequests(userId: string) {
  try {
    const { data, error } = await supabase
      .from(SUPPORT_REQUESTS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Fetch User Requests Error:', error);
    return { success: false, error };
  }
}
