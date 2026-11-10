import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PaymentResult, SourceWallet } from '@/api/payment-api';
import { useWalletPayment } from '@/hooks/use-wallet-payment';
import { ArrowUpRight } from 'lucide-react';

type Flow = ReturnType<typeof useWalletPayment>;

interface WalletPaymentDialogProps {
    wallets: SourceWallet[];
    /** Called once the server answers the payment, e.g. to refresh balances. */
    onCompleted?: (result: PaymentResult) => void;
}

export function WalletPaymentDialog({ wallets, onCompleted }: WalletPaymentDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        // disablePointerDismissal: clicking outside shouldn't throw away a half-finished payment.
        <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
            {/* <DialogTrigger render={<Button><ArrowUpRight className="size-4" /></Button>}>{trigger ?? 'Pay'}</DialogTrigger> */}
            <DialogTrigger>
                <Button variant="outline">
                    <ArrowUpRight className="size-4" /> Pay
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                {/* The flow mounts only while the dialog is open, so its state resets on every open. */}
                <PaymentFlow wallets={wallets} onClose={() => setOpen(false)} onCompleted={onCompleted} />
            </DialogContent>
        </Dialog>
    );
}

function PaymentFlow({
    wallets,
    onClose,
    onCompleted,
}: {
    wallets: SourceWallet[];
    onClose: () => void;
    onCompleted?: (result: PaymentResult) => void;
}) {
    const flow = useWalletPayment(wallets, onCompleted);
    const { state } = flow;
    const { title, description } = copyFor(state.step, state.result?.status);

    return (
        <>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            {state.step === 'recipient' && <RecipientStep flow={flow} />}
            {state.step === 'amount' && <AmountStep flow={flow} wallets={wallets} />}
            {state.step === 'review' && <ReviewStep flow={flow} />}
            {state.step === 'result' && <ResultStep flow={flow} onClose={onClose} />}

            {state.error && (
                <p role="alert" className="text-sm text-destructive">
                    {state.error}
                </p>
            )}
        </>
    );
}

/* ---------------------------------- steps --------------------------------- */

function RecipientStep({ flow }: { flow: Flow }) {
    const { state, handleChange, lookup, goTo } = flow;
    const { form, recipient, loading } = state;

    return (
        <form
            className="space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                if (recipient) goTo('amount');
                else lookup();
            }}
        >
            <div className="space-y-2">
                <Label htmlFor="reference">Wallet reference</Label>
                <Input
                    id="reference"
                    name="reference"
                    value={form.reference}
                    onChange={handleChange}
                    autoComplete="off"
                    disabled={loading}
                    autoFocus
                />
            </div>

            {recipient && (
                <div className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{recipient.displayName}</p>
                    <p className="text-muted-foreground">{recipient.currency} wallet</p>
                </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !form.reference.trim()}>
                {loading ? 'Searching…' : recipient ? 'Continue' : 'Find wallet'}
            </Button>
        </form>
    );
}

function AmountStep({ flow, wallets }: { flow: Flow; wallets: SourceWallet[] }) {
    const { state, handleChange, setField, goTo, requote } = flow;
    const { form, recipient, loading } = state;

    const source = wallets.find((w) => w.id === form.sourceWalletId);
    // Two decimals is assumed here; adjust per currency if you support others.
    const validAmount = /^\d+(\.\d{1,2})?$/.test(form.amount) && Number(form.amount) > 0;
    const overBalance = source ? Number(form.amount) > Number(source.availableBalance) : false;

    return (
        <form
            className="space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                requote();
            }}
        >
            <p className="text-sm">
                Paying <span className="font-medium">{recipient?.displayName}</span>
            </p>

            {wallets.length > 1 ? (
                <div className="space-y-2">
                    <Label htmlFor="sourceWalletId">Pay from</Label>
                    <Select value={form.sourceWalletId} onValueChange={(v) => v && setField('sourceWalletId', v)}>
                        <SelectTrigger id="sourceWalletId">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {wallets.map((w) => (
                                <SelectItem key={w.id} value={w.id}>
                                    {w.name} ({money(w.availableBalance, w.currency)})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                source && (
                    <p className="text-sm text-muted-foreground">
                        From {source.name} ({money(source.availableBalance, source.currency)})
                    </p>
                )
            )}

            <div className="space-y-2">
                <Label htmlFor="amount">Amount{source ? ` (${source.currency})` : ''}</Label>
                <Input
                    id="amount"
                    name="amount"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={handleChange}
                    autoComplete="off"
                    disabled={loading}
                    autoFocus
                />
                {overBalance && <p className="text-sm text-destructive">That’s more than your balance.</p>}
            </div>

            <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={loading} onClick={() => goTo('recipient')}>
                    Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || !validAmount || overBalance}>
                    {loading ? 'Getting quote…' : 'Continue'}
                </Button>
            </div>
        </form>
    );
}

function ReviewStep({ flow }: { flow: Flow }) {
    const { state, goTo, requote, pay } = flow;
    const { quote, loading } = state;
    const secondsLeft = useSecondsLeft(quote?.expiresAt);

    if (!quote) return null;

    const expired = secondsLeft === 0;
    const crossCurrency = quote.destCurrency !== quote.sourceCurrency;

    return (
        <div className="space-y-4">
            <dl className="divide-y rounded-md border px-3">
                <Row label="To" value={quote.recipient.displayName} />
                <Row label="You send" value={money(quote.sourceAmount, quote.sourceCurrency)} />
                <Row label="Fee" value={money(quote.fee, quote.sourceCurrency)} />
                <Row label="Total debited" value={money(quote.totalDebit, quote.sourceCurrency)} strong />
                {crossCurrency && quote.fxRate && (
                    <Row label="Rate" value={`1 ${quote.sourceCurrency} = ${quote.fxRate} ${quote.destCurrency}`} />
                )}
                <Row label="They receive" value={money(quote.destAmount, quote.destCurrency)} strong />
            </dl>

            <p className="text-sm text-muted-foreground">
                {expired ? 'This quote has expired.' : `Quote expires in ${clock(secondsLeft)}`}
            </p>

            {/* If you require a PIN or OTP, collect it here and send it with the pay request. */}
            <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={loading} onClick={() => goTo('amount')}>
                    Back
                </Button>
                {expired ? (
                    <Button type="button" className="flex-1" disabled={loading} onClick={() => requote()}>
                        {loading ? 'Refreshing…' : 'Refresh quote'}
                    </Button>
                ) : (
                    <Button type="button" className="flex-1" disabled={loading} onClick={() => pay()}>
                        {loading ? 'Paying…' : `Pay ${money(quote.totalDebit, quote.sourceCurrency)}`}
                    </Button>
                )}
            </div>
        </div>
    );
}

function ResultStep({ flow, onClose }: { flow: Flow; onClose: () => void }) {
    const { result } = flow.state;
    if (!result) return null;

    return (
        <div className="space-y-4">
            {result.message && <p className="text-sm">{result.message}</p>}
            <dl className="divide-y rounded-md border px-3">
                <Row label="Reference" value={result.reference} />
            </dl>
            <Button className="w-full" onClick={onClose}>
                Done
            </Button>
        </div>
    );
}

/* --------------------------------- helpers -------------------------------- */

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex justify-between gap-4 py-2 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={strong ? 'font-semibold' : undefined}>{value}</dd>
        </div>
    );
}

function copyFor(step: string, status?: PaymentResult['status']) {
    switch (step) {
        case 'recipient':
            return { title: 'Pay a wallet', description: 'Enter the wallet reference to find who you’re paying.' };
        case 'amount':
            return { title: 'Amount', description: 'Choose how much to send.' };
        case 'review':
            return { title: 'Review payment', description: 'Check the details before you pay.' };
        default:
            if (status === 'success') return { title: 'Payment sent', description: 'The money has moved.' };
            if (status === 'pending') return { title: 'Payment processing', description: 'We’ll update your balance when it completes.' };
            return { title: 'Payment failed', description: 'No money was taken.' };
    }
}

// Display only. Amounts stay as strings everywhere else.
function money(amount: string, currency: string) {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount));
    } catch {
        return `${currency} ${amount}`;
    }
}

function clock(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}

// Counts down to the server's expiry. The server still enforces expiry, so client clock drift only affects the display.
function useSecondsLeft(expiresAt: string | undefined) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!expiresAt) return;
        setNow(Date.now());
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    return expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000)) : 0;
}