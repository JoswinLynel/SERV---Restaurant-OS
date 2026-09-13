"use client";

import { ArrowLeft, UserX } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.customerId as string;

  // We are currently in an anonymous-only order state.
  // No customers exist in the database yet.
  
  return (
    <div className="flex flex-col h-full bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-ivory)] font-sans overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-white/5 shrink-0 bg-[var(--color-brand-bg-dark)] flex items-center gap-6">
        <Link 
          href="/customers" 
          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-serif mb-2">Customer Details</h1>
          <p className="text-[10px] text-[var(--color-brand-grey)] tracking-[0.2em] uppercase font-mono">
            ID: {customerId}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-[var(--color-brand-bg-dark)] border border-white/5 rounded-xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserX className="w-10 h-10 text-[var(--color-status-red)] opacity-50" />
          </div>
          <h2 className="text-2xl font-serif mb-4">Customer Not Found</h2>
          <p className="text-sm text-[var(--color-brand-grey)] leading-relaxed mb-8">
            The customer record you are looking for does not exist or you do not have permission to view it.
            <br/><br/>
            Note: All current orders are handled anonymously via the table QR system.
          </p>
          <Link 
            href="/customers" 
            className="w-full inline-block bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--color-brand-ivory)] py-4 rounded font-sans font-medium text-xs tracking-[0.1em] uppercase transition-colors"
          >
            Return to Customers
          </Link>
        </div>
      </div>
    </div>
  );
}
