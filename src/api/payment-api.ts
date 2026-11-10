// Expected backend contract:
//   GET  /wallets/lookup?reference=...  -> Recipient
//   POST /payments/quotes               -> Quote
//   POST /payments  { quoteId }         -> PaymentResult
//
// For an expired quote, have the server answer with a `code` of 'QUOTE_EXPIRED', e.g. in Nest:
//   throw new ConflictException({ code: 'QUOTE_EXPIRED', message: 'Quote expired' });
//
// Money values are decimal strings, never floats. Only format them for display.

import type { WalletStatus } from "@/pages/user/accounts";

const API_URL: string = import.meta.env.VITE_API_URL ?? '';

export interface SourceWallet {
    id: string;
    reference: string; // e.g. "WLT-004821"
    name: string;
    purpose: string;
    accountLast4: string;
    currency: string; // ISO code, e.g. "USD"
    availableBalance: string;
    reservedBalance: string;
    status: WalletStatus;
    isDefault: boolean;
    spendingAccess: string;
    createdAt: string; // ISO date
}

export interface Recipient {
    walletId: string;
    displayName: string;
    currency: string;
}

export interface QuoteInput {
    recipientWalletId: string;
    sourceWalletId: string;
    amount: string;
}

export interface Quote {
    id: string;
    recipient: Recipient;
    sourceAmount: string;
    sourceCurrency: string;
    fee: string;
    totalDebit: string;
    destAmount: string;
    destCurrency: string;
    fxRate: string | null;
    expiresAt: string; // ISO timestamp
}

export interface PaymentResult {
    id: string;
    status: 'success' | 'pending' | 'failed';
    reference: string;
    message?: string;
}

export class ApiError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        credentials: 'include',
        // Only set Content-Type when there is a body, so plain GETs stay "simple" requests (no preflight).
        headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        throw new ApiError(message ?? 'Something went wrong', res.status, body.code);
    }

    return (await res.json()) as T;
}

export const paymentApi = {
    lookupWallet: (reference: string) =>
        request<Recipient>(`/wallet/lookup?reference=${encodeURIComponent(reference)}`),

    createQuote: (input: QuoteInput) =>
        request<Quote>('/payments/quotes', { method: 'POST', body: JSON.stringify(input) }),

    // The quote id is the idempotency key: paying the same quote twice returns the same payment.
    pay: (quoteId: string) =>
        request<PaymentResult>('/payments', { method: 'POST', body: JSON.stringify({ quoteId }) }),

    listWallets: () => request<SourceWallet[]>('/wallet'),
};