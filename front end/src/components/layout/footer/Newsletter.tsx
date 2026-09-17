import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { newsletterApi } from '../../../api/newsletter.api';
import toast from 'react-hot-toast';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [successMessage, setSuccessMessage] = useState('Subscribed successfully!');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    try {
      const res = await newsletterApi.subscribe(cleanEmail);
      if (res.success) {
        setSuccessMessage(res.message || 'Subscribed successfully!');
        setStatus('success');
        setEmail('');
        if (res.alreadySubscribed) {
          toast.success('You are already on the subscriber list!');
        } else {
          toast.success('Welcome to KDW updates!');
        }
        setTimeout(() => setStatus('idle'), 4000);
      } else {
        setStatus('idle');
        toast.error(res.message || 'Subscription failed. Please try again.');
      }
    } catch (err: any) {
      setStatus('idle');
      console.error('Newsletter error:', err);
      toast.error(err.response?.data?.message || 'Unable to subscribe. Please try again.');
    }
  };

  return null;
}
