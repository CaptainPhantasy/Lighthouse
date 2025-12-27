import React, { useEffect, useState } from 'react';
import { getSupportRequest, updateSupportRequestStatus } from '../services/supportRequestService';
import { motion } from 'motion/react';
import { Heart, HeartHandshake, X, Check, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface VolunteerPageProps {
  requestId?: string;
}

// Local type for support request data
interface SupportRequestData {
  id: string;
  user_id: string;
  supporter_email: string;
  request_type: string;
  status: 'pending' | 'fulfilled' | 'declined';
  created_at: string;
  fulfilled_at?: string;
}

const VolunteerPage: React.FC<VolunteerPageProps> = ({ requestId: propRequestId }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Extract requestId from URL params if prop not provided
  const getRequestFromUrl = () => {
    if (propRequestId) return propRequestId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('requestId') || '';
    }
    return '';
  };

  const requestId = getRequestFromUrl();

  const [request, setRequest] = useState<SupportRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!requestId) {
      setError('No request ID provided.');
      setLoading(false);
      return;
    }

    async function fetchRequest() {
      const result = await getSupportRequest(requestId);
      if (result.success && result.data) {
        setRequest(result.data);
      } else {
        setError('Request not found or has been removed.');
      }
      setLoading(false);
    }
    fetchRequest();
  }, [requestId]);

  const handleAccept = async () => {
    setUpdating(true);
    const result = await updateSupportRequestStatus(requestId, 'fulfilled');
    setUpdating(false);

    if (result.success) {
      setAccepted(true);
      if (request) {
        setRequest({ ...request, status: 'fulfilled' });
      }
    } else {
      setError('Failed to accept request. Please try again.');
    }
  };

  const handleDecline = async () => {
    setUpdating(true);
    const result = await updateSupportRequestStatus(requestId, 'declined');
    setUpdating(false);

    if (result.success) {
      setDeclined(true);
      if (request) {
        setRequest({ ...request, status: 'declined' });
      }
    } else {
      setError('Failed to decline request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-stone-100'} flex items-center justify-center p-6`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} rounded-3xl shadow-xl p-10 max-w-md w-full text-center border`}
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`}
          >
            <Loader2 className="w-10 h-10 animate-spin" />
          </motion.div>
          <p className={`font-medium ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-stone-100'} flex items-center justify-center p-6`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} rounded-3xl shadow-xl p-10 max-w-md w-full text-center border`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`}>
            <X className={`w-10 h-10 ${isDark ? 'text-stone-400' : 'text-stone-700'}`} strokeWidth={2} />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : ''}`}>Request Not Found</h2>
          <p className={isDark ? 'text-stone-400' : 'text-stone-700'}>{error || 'This support request could not be found.'}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-stone-100'} flex items-center justify-center p-6`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'} rounded-3xl shadow-xl p-8 md:p-10 max-w-md w-full border`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative inline-block mb-5"
          >
            <motion.div
              className={`absolute inset-0 rounded-full blur-2xl ${isDark ? 'bg-white opacity-10' : 'bg-black opacity-10'}`}
              animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
              <Heart className="w-10 h-10" strokeWidth={2} fill={isDark ? "black" : "white"} />
            </div>
          </motion.div>
          <h1 className={`text-2xl md:text-3xl font-light ${isDark ? 'text-white' : ''}`}>
            Support Request
          </h1>
          <p className={`mt-2 flex items-center justify-center gap-2 ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>
            <Sparkles className="w-4 h-4" />
            Lighthouse Support Circle
          </p>
        </div>

        {/* Accepted Message */}
        {accepted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-300'} border rounded-3xl p-6 mb-8 text-center`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
            >
              <Check className="w-8 h-8" strokeWidth={2.5} />
            </motion.div>
            <p className="font-bold text-lg">Thank you so much!</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>You've accepted this support request.</p>
          </motion.div>
        )}

        {/* Declined Message */}
        {declined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-300'} border rounded-3xl p-6 mb-8 text-center`}
          >
            <p className={isDark ? 'text-stone-300' : 'text-stone-800'}>Thank you for letting us know.</p>
          </motion.div>
        )}

        {/* Request Details */}
        {!accepted && !declined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className={`${isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-200'} rounded-3xl p-6 border`}>
              <p className={`text-sm uppercase tracking-wide mb-2 ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>Request Type</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : ''}`}>{request.request_type}</p>
            </div>

            <div className="flex items-center justify-between px-2">
              <span className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>Status</span>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                request.status === 'pending' ? (isDark ? 'bg-stone-700 text-white' : 'bg-stone-300 text-black') :
                request.status === 'fulfilled' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') :
                (isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-black')
              }`}>
                {request.status === 'pending' ? 'Awaiting Response' :
                 request.status === 'fulfilled' ? 'Accepted' :
                 request.status}
              </span>
            </div>

            {request.status === 'pending' && (
              <div className="space-y-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAccept}
                  disabled={updating}
                  className={`w-full py-4 px-6 font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3 ${isDark ? 'bg-white hover:bg-stone-200 text-black' : 'bg-black hover:bg-stone-800 text-white'}`}
                >
                  <HeartHandshake className="w-5 h-5" />
                  {updating ? 'Processing...' : 'I can help with this'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDecline}
                  disabled={updating}
                  className={`w-full py-3 px-6 font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-stone-800 hover:bg-stone-700 text-stone-200' : 'bg-stone-200 hover:bg-stone-300 text-stone-700'}`}
                >
                  {updating ? 'Processing...' : "I can't help right now"}
                </motion.button>
              </div>
            )}

            {request.status === 'fulfilled' && (
              <div className={`${isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-300'} border rounded-3xl p-6 text-center`}>
                <p className={`font-bold ${isDark ? 'text-white' : ''}`}>This request has been fulfilled.</p>
              </div>
            )}

            {request.status === 'declined' && (
              <div className={`${isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-300'} border rounded-3xl p-6 text-center`}>
                <p className={isDark ? 'text-stone-300' : 'text-stone-800'}>This request was declined.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div className={`mt-8 pt-6 border-t text-center ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <p className={`text-xs flex items-center justify-center gap-2 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            <Sparkles className="w-3 h-3" />
            Brought to you by Lighthouse
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VolunteerPage;
