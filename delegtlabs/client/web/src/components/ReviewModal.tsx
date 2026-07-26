import React, { useState } from 'react';
import { Review } from '../types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: Omit<Review, 'id' | 'date' | 'verified'>) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;

    onSubmit({
      author: author.trim(),
      role: role.trim() || 'Enterprise Lead',
      company: company.trim() || 'Global Tech',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80`,
      rating,
      comment: `"${comment.trim()}"`
    });

    setAuthor('');
    setRole('');
    setCompany('');
    setRating(5);
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060e20]/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-8 relative border border-[#00f5ff]/30 shadow-[0_0_30px_rgba(0,245,255,0.15)] text-[#dae2fd]">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#b9caca] hover:text-[#e9feff] transition-colors p-1 rounded-lg hover:bg-[#171f33]"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#00f5ff]/10 border border-[#00f5ff]/30 flex items-center justify-center text-[#00f5ff]">
            <span className="material-symbols-outlined text-2xl">rate_review</span>
          </div>
          <div>
            <h3 className="text-xl font-bold font-headline text-[#e9feff]">Write an Agent Review</h3>
            <p className="text-xs text-[#b9caca]">Share your deployment results with the community.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#00f5ff] mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Dr. Aris Vance"
              className="w-full bg-[#131b2e] border border-[#3a494a] rounded-xl p-3 text-sm text-[#e9feff] focus:outline-none focus:border-[#00f5ff]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#00f5ff] mb-1.5">
                Role / Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Lead ML Architect"
                className="w-full bg-[#131b2e] border border-[#3a494a] rounded-xl p-3 text-sm text-[#e9feff] focus:outline-none focus:border-[#00f5ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#00f5ff] mb-1.5">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Quantum Systems"
                className="w-full bg-[#131b2e] border border-[#3a494a] rounded-xl p-3 text-sm text-[#e9feff] focus:outline-none focus:border-[#00f5ff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#00f5ff] mb-1.5">
              Rating
            </label>
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-2xl transition-transform active:scale-125"
                >
                  <span
                    className={`material-symbols-outlined ${
                      star <= rating ? 'text-[#00f5ff] fill-1' : 'text-[#3a494a]'
                    }`}
                  >
                    star
                  </span>
                </button>
              ))}
              <span className="text-sm font-bold text-[#e9feff] ml-2">{rating}.0 / 5.0</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#00f5ff] mb-1.5">
              Review Comment *
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe latency reductions, accuracy performance, or integration experience..."
              className="w-full bg-[#131b2e] border border-[#3a494a] rounded-xl p-3 text-sm text-[#e9feff] focus:outline-none focus:border-[#00f5ff]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#3a494a] text-[#b9caca] hover:text-[#e9feff] text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#00f5ff] text-[#002021] font-bold text-sm hover:bg-[#63f7ff] shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all active:scale-95"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
