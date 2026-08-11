import { useRef } from 'react';
import type { Challan } from '@/types';
import { formatDate, formatDateTime, formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/Button';

interface InvoiceModalProps {
  challan: Challan;
  open: boolean;
  onClose: () => void;
}

export function InvoiceModal({ challan, open, onClose }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!open || !challan) return null;

  const items = challan.items ?? [];
  const isConfirmed = challan.status === 'CONFIRMED';
  const subtotal = Number(challan.totalAmount) || 0;
  const gstRate = 0.18; // 18% standard GST for wholesale
  const taxAmount = subtotal * gstRate;
  const grandTotal = subtotal + taxAmount;

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div id="printable-invoice-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h2 className="text-base font-bold text-slate-800">
              Invoice & Delivery Challan — <span className="font-mono text-indigo-600">{challan.challanNumber}</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              }
            >
              Download PDF / Print
            </Button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div id="printable-invoice-content" className="overflow-y-auto p-8 sm:p-10 space-y-8 print:p-0 print:overflow-visible" ref={printRef}>
          {/* Printable Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm tracking-widest shadow-md">
                  FE
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">FLOW ERP & CRM</h1>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">Wholesale & Distribution Operations</p>
              <p className="text-xs text-slate-400 mt-0.5">Plot 45, Commercial Complex, Sector 18, MIDC</p>
              <p className="text-xs text-slate-400">GSTIN: 27AAACF1234H1Z9 &middot; Phone: +91 98765 43210</p>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-2">
                {isConfirmed ? 'TAX INVOICE' : 'DELIVERY CHALLAN (DRAFT)'}
              </div>
              <p className="text-sm font-mono font-bold text-slate-800">{challan.challanNumber}</p>
              <p className="text-xs text-slate-500 mt-1">Date: <span className="font-semibold text-slate-700">{formatDate(challan.createdAt)}</span></p>
              <p className="text-xs text-slate-500">Status: <span className="font-semibold uppercase text-slate-700">{challan.status}</span></p>
            </div>
          </div>

          {/* Billed To / Shipped To Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/60 rounded-xl p-5 border border-slate-100">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Billed To (Customer)</p>
              <h3 className="text-sm font-extrabold text-slate-900">{challan.customer.name}</h3>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{challan.customer.businessName}</p>
              <p className="text-xs text-slate-500 mt-1">Mobile: {challan.customer.mobile}</p>
              <p className="text-xs text-slate-500">Email: {challan.customer.email}</p>
            </div>

            <div className="sm:text-right space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Dispatch & Issuer Details</p>
              <p className="text-xs text-slate-600"><span className="font-semibold text-slate-400">Created By:</span> {challan.createdByUser.name}</p>
              <p className="text-xs text-slate-600"><span className="font-semibold text-slate-400">Time:</span> {formatDateTime(challan.createdAt)}</p>
              <p className="text-xs text-slate-600"><span className="font-semibold text-slate-400">Total Items:</span> {items.length}</p>
            </div>
          </div>

          {/* Products Table */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100/70">
                  <th className="py-2.5 px-3 font-extrabold text-slate-600 uppercase tracking-wider">#</th>
                  <th className="py-2.5 px-3 font-extrabold text-slate-600 uppercase tracking-wider">Product Name</th>
                  <th className="py-2.5 px-3 font-extrabold text-slate-600 uppercase tracking-wider">SKU</th>
                  <th className="py-2.5 px-3 text-right font-extrabold text-slate-600 uppercase tracking-wider">Unit Price</th>
                  <th className="py-2.5 px-3 text-right font-extrabold text-slate-600 uppercase tracking-wider">Qty</th>
                  <th className="py-2.5 px-3 text-right font-extrabold text-slate-600 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-3 px-3 text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{item.productName}</td>
                    <td className="py-3 px-3 font-mono text-slate-500 font-semibold">{item.sku}</td>
                    <td className="py-3 px-3 text-right text-slate-600 font-semibold">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200 pt-6">
            <div className="max-w-md text-xs text-slate-500 space-y-1.5">
              <p className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Terms & Disclaimers</p>
              <p className="leading-relaxed">1. Goods once delivered will not be taken back unless damaged prior to dispatch.</p>
              <p className="leading-relaxed">2. Subject to local jurisdiction. Computer-generated invoice, signature optional.</p>
            </div>

            <div className="w-full sm:w-72 space-y-2 bg-slate-50/80 rounded-xl p-4 border border-slate-100">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal ({challan.totalQuantity} units):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Estimated GST (18%):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-indigo-600 font-mono text-base">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Signature Line */}
          <div className="flex justify-between items-end pt-8">
            <div className="text-[10px] text-slate-400 font-medium">
              <p>Generated via Flow ERP & CRM Portal</p>
              <p>{formatDateTime(new Date().toISOString())}</p>
            </div>
            <div className="text-center w-48 border-t border-slate-300 pt-2">
              <p className="text-xs font-bold text-slate-700">Authorized Signatory</p>
              <p className="text-[10px] text-slate-400">Flow ERP & CRM Distributors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded CSS for Print Mode */}
      <style>{`
        @media print {
          /* 1. Unclip all fixed-height parent layout containers */
          html, body, #root, #root > div, main {
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 2. Hide topbar header, sidebar, toast containers */
          header, aside, nav, [role="status"] {
            display: none !important;
          }

          /* 3. Hide all page content outside of the printable modal */
          main > div > *:not(#printable-invoice-modal) {
            display: none !important;
          }

          /* 4. Hide control bar inside modal (buttons) */
          .print\\:hidden {
            display: none !important;
          }

          /* 5. Transform modal to fill standard print page */
          #printable-invoice-modal {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
            z-index: 999999 !important;
          }

          #printable-invoice-modal > div {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            position: static !important;
          }

          #printable-invoice-content {
            padding: 20px !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
}
