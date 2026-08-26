import React, { useState } from 'react';
import { X, Send, User, Package, AlertCircle } from 'lucide-react';

interface CreateTicketModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTicketModal({ onClose, onCreated }: CreateTicketModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('GENERAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [category, setCategory] = useState('General');
  const [orderNumber, setOrderNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail || !subject || !description) {
      return alert('Customer Email, Subject, and Description are required.');
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerName: customerName || 'Customer',
          customerEmail,
          subject,
          description,
          type,
          priority,
          category,
          source: 'PORTAL'
        })
      });

      const json = await res.json();
      if (json.success) {
        onCreated();
      } else {
        alert(json.message || 'Failed to create ticket');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to support service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">New Incident</span>
            <h2 className="text-base font-bold text-slate-900">Create Support Ticket</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Customer Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Ticket Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="GENERAL">General</option>
                <option value="DOWNLOAD_ISSUE">Download Issue</option>
                <option value="LICENCE_ISSUE">Licence Issue</option>
                <option value="REFUND_REQUEST">Refund Request</option>
                <option value="PAYMENT_QUERY">Payment Query</option>
                <option value="PRODUCT_QUESTION">Product Question</option>
                <option value="CUSTOMER_REQUEST">Customer Request</option>
                <option value="TECHNICAL_ISSUE">Technical Issue</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="CRITICAL">Critical (30m SLA)</option>
                <option value="HIGH">High (2h SLA)</option>
                <option value="MEDIUM">Medium (8h SLA)</option>
                <option value="LOW">Low (24h SLA)</option>
                <option value="PLANNED">Planned</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="General">General</option>
                <option value="Download & Fulfillment">Download & Fulfillment</option>
                <option value="Licence & Activation">Licence & Activation</option>
                <option value="Billing & Refunds">Billing & Refunds</option>
                <option value="Payment & Invoicing">Payment & Invoicing</option>
                <option value="Customer Account & Privacy">Account & Privacy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Cannot download purchased workflow zip"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Description / Initial Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed description of the customer issue..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {saving ? 'Creating Ticket...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
