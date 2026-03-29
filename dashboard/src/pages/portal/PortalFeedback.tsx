import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useSubmitFeedback } from '@/lib/hooks';
import toast from 'react-hot-toast';
import type { Organization } from '@/types';

interface PortalContext {
  org: Organization | undefined;
  role: string;
  slug: string;
}

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'general', label: 'General Feedback' },
  { value: 'security', label: 'Security Concern' },
];

export function PortalFeedback() {
  const { slug } = useOutletContext<PortalContext>();
  const submitMutation = useSubmitFeedback();

  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        slug,
        data: { message, category },
      });
      toast.success('Thank you for your feedback!');
      setMessage('');
      setCategory('general');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        <p className="text-gray-500 mt-1">Share your ideas, report bugs, or let us know what you think</p>
      </div>

      {/* Feedback Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Feedback Type</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Your Feedback</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you think..."
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {message.length} characters (minimum 10 required)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitMutation.isPending || message.length < 10}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {submitMutation.isPending ? 'Sending...' : 'Send Feedback'}
          </button>
          {submitted && (
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">Feedback sent!</span>
            </div>
          )}
        </div>
      </form>

      {/* Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
        <div className="flex gap-3">
          <MessageSquare className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-indigo-900">We value your feedback</h3>
            <p className="text-sm text-indigo-700 mt-1">
              Your feedback helps us improve DocPix Studio. Every message is reviewed by our team
              and you may receive a response via email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
