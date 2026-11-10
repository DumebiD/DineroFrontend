import { useReducer, type ChangeEvent } from 'react';
import {
  ApiError,
  paymentApi,
  type PaymentResult,
  type Quote,
  type Recipient,
  type SourceWallet,
} from '@/api/payment-api';

export type Step = 'recipient' | 'amount' | 'review' | 'result';

export interface FormState {
  reference: string;
  amount: string;
  sourceWalletId: string;
}

interface State {
  step: Step;
  form: FormState;
  recipient: Recipient | null;
  quote: Quote | null;
  result: PaymentResult | null;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'field'; name: keyof FormState; value: string }
  | { type: 'loading' }
  | { type: 'failed'; message: string }
  | { type: 'recipientFound'; recipient: Recipient }
  | { type: 'quoted'; quote: Quote; message?: string }
  | { type: 'paid'; result: PaymentResult }
  | { type: 'goto'; step: Step };

function init(wallets: SourceWallet[]): State {
  return {
    step: 'recipient',
    form: { reference: '', amount: '', sourceWalletId: wallets[0]?.id ?? '' },
    recipient: null,
    quote: null,
    result: null,
    loading: false,
    error: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'field':
      return {
        ...state,
        form: { ...state.form, [action.name]: action.value },
        // Editing the reference invalidates the wallet that was found for the old one.
        recipient: action.name === 'reference' ? null : state.recipient,
        error: null,
      };
    case 'loading':
      return { ...state, loading: true, error: null };
    case 'failed':
      return { ...state, loading: false, error: action.message };
    case 'recipientFound':
      return { ...state, loading: false, recipient: action.recipient };
    case 'quoted':
      return {
        ...state,
        loading: false,
        step: 'review',
        quote: action.quote,
        error: action.message ?? null,
      };
    case 'paid':
      return { ...state, loading: false, step: 'result', result: action.result };
    case 'goto':
      // Leaving the review step throws the quote away, so a changed form always gets a new one.
      return {
        ...state,
        step: action.step,
        quote: action.step === 'review' ? state.quote : null,
        error: null,
      };
  }
}

const UNSURE_MESSAGE = 'We couldn’t confirm the payment. Try again; you won’t be charged twice.';

function messageFrom(e: unknown, fallback: string) {
  return e instanceof ApiError && e.status < 500 ? e.message : fallback;
}

export function useWalletPayment(
  wallets: SourceWallet[],
  onCompleted?: (result: PaymentResult) => void,
) {
  const [state, dispatch] = useReducer(reducer, wallets, init);

  // One handler for every text input, keyed by the input's `name`.
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'field', name: e.target.name as keyof FormState, value: e.target.value });

  const setField = (name: keyof FormState, value: string) =>
    dispatch({ type: 'field', name, value });

  const goTo = (step: Step) => dispatch({ type: 'goto', step });

  const lookup = async () => {
    dispatch({ type: 'loading' });
    try {
      const recipient = await paymentApi.lookupWallet(state.form.reference.trim());
      dispatch({ type: 'recipientFound', recipient });
    } catch (e) {
      dispatch({ type: 'failed', message: messageFrom(e, 'We couldn’t find that wallet.') });
    }
  };

  // Creates a fresh quote from the current form. Used for the first quote and for refreshes.
  const requote = async (message?: string) => {
    if (!state.recipient) return;
    dispatch({ type: 'loading' });
    try {
      const quote = await paymentApi.createQuote({
        recipientWalletId: state.recipient.walletId,
        sourceWalletId: state.form.sourceWalletId,
        amount: state.form.amount,
      });
      dispatch({ type: 'quoted', quote, message });
    } catch (e) {
      dispatch({ type: 'failed', message: messageFrom(e, 'We couldn’t get a quote. Try again.') });
    }
  };

  const pay = async () => {
    if (!state.quote) return;
    dispatch({ type: 'loading' });
    try {
      // Safe to retry: the server treats the quote id as the idempotency key.
      const result = await paymentApi.pay(state.quote.id);
      dispatch({ type: 'paid', result });
      onCompleted?.(result);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'QUOTE_EXPIRED') {
        await requote('The quote expired, so we refreshed it. Check the new amounts.');
        return;
      }
      dispatch({ type: 'failed', message: messageFrom(e, UNSURE_MESSAGE) });
    }
  };

  return { state, handleChange, setField, goTo, lookup, requote, pay };
}