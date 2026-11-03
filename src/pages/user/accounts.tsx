import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "cn";
import {
    Clock, Download, Layers, Wallet, WalletCards, type LucideIcon, ArrowLeftRight,
    ArrowUpRight,
    ChevronRight,
    Copy,
    Info,
    Plus,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Users,
    Wallet as WalletIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/api/client";

export type WalletStatus = "active" | "archived";

export interface Wallet {
    id: string;
    reference: string; // e.g. "WLT-004821"
    name: string;
    purpose: string;
    accountLast4: string;
    currency: string; // ISO code, e.g. "USD"
    availableBalance: number;
    reservedBalance: number;
    status: WalletStatus;
    isDefault: boolean;
    spendingAccess: string;
    createdAt: string; // ISO date
}

export interface CreateWalletInput {
    name: string;
    purpose: string;
    currency: string;
    spendingAccess: string;
    setAsDefault: boolean;
}

export async function createWallet(input: CreateWalletInput): Promise<Wallet> {
    try{
        const { data } = await apiClient.post<Wallet>("/wallet", {
          ...input,
          name: input.name.trim(),
          purpose: input.purpose.trim(),
        });
        return data;
    }catch(e){
        console.log(e)
        throw new Error("Failed to create wallet")
    }

    // --- Local stand-in so the demo works without a backend. Delete this block
    // --- once the request above is wired up.
    // await new Promise((r) => setTimeout(r, 400));
    // const n = Math.floor(100000 + Math.random() * 900000);
    // return {
    //     id: crypto.randomUUID(),
    //     reference: `WLT-${String(n).slice(0, 6)}`,
    //     name: input.name.trim(),
    //     purpose: input.purpose.trim(),
    //     accountLast4: String(n).slice(-4),
    //     currency: input.currency,
    //     availableBalance: 0,
    //     reservedBalance: 0,
    //     status: "active",
    //     isDefault: input.setAsDefault,
    //     spendingAccess: input.spendingAccess,
    //     createdAt: new Date().toISOString(),
    // };
}

const cardDetails = [
    { title: "Available to spend", icon: Wallet, number: 6, description: "Approval, routing and risk checks", descriptionColour: "text-gray-400" },
    { title: "Reserved for payments", icon: Clock, number: 4, description: "2 rules are currently paused", descriptionColour: "text-green-700" },
    { title: "Total wallet balance", icon: Layers, number: 38, description: "Across 4 active rules", descriptionColour: "text-gray-400" },
    { title: "Active wallets", icon: WalletCards, number: 2, description: "$23,900.00 awaiting review", descriptionColour: "text-amber-700" }
]

const INITIAL_WALLETS: Wallet[] = [
    {
        id: "1",
        reference: "WLT-004821",
        name: "Operating wallet",
        purpose: "Everyday payments",
        accountLast4: "4821",
        currency: "USD",
        availableBalance: 186240,
        reservedBalance: 24680,
        status: "active",
        isDefault: true,
        spendingAccess: "Finance team",
        createdAt: "2026-10-01",
    },
    {
        id: "2",
        reference: "WLT-009016",
        name: "Reserve wallet",
        purpose: "Business savings",
        accountLast4: "9016",
        currency: "USD",
        availableBalance: 42320,
        reservedBalance: 0,
        status: "active",
        isDefault: false,
        spendingAccess: "Finance team",
        createdAt: "2026-10-01",
    },
    {
        id: "3",
        reference: "WLT-006430",
        name: "Team expenses",
        purpose: "Team spending",
        accountLast4: "6430",
        currency: "USD",
        availableBalance: 20000,
        reservedBalance: 0,
        status: "active",
        isDefault: false,
        spendingAccess: "Team leads",
        createdAt: "2026-10-01",
    },
];

const CURRENCIES = ["USD", "NGN", "EUR", "GBP"];
const ACCESS_OPTIONS = ["Finance team", "Team leads", "Admins only"];

function money(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(amount);
}

function shortDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

function iconFor(wallet: Wallet): LucideIcon {
    if (wallet.isDefault) return WalletIcon;
    if (/save|reserve/i.test(wallet.purpose + wallet.name)) return ShieldCheck;
    return Users;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

type StatusFilter = "active" | "archived" | "all";

export default function Accounts() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(
        INITIAL_WALLETS[0]?.id ?? null,
    );
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

    // fetch all the wallets belonging to the user
    useEffect(() => {
        async function fetchData() {
          const data = await apiClient.get<Wallet[]>("/wallet")
          setWallets(data.data)
          setSelectedId(data.data[0]?.id ?? "")
        }
        fetchData()
      }, [])

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return wallets.filter((w) => {
            if (statusFilter !== "all" && w.status !== statusFilter) return false;
            if (!q) return true;
            return (
                w.name.toLowerCase().includes(q) ||
                w.purpose.toLowerCase().includes(q) ||
                w.accountLast4.includes(q)
            );
        });
    }, [wallets, query, statusFilter]);

    // Derived from the id, so a stale id simply means "nothing selected".
    const selected = wallets.find((w) => w.id === selectedId) ?? null;

    function handleCreated(wallet: Wallet) {
        setWallets((prev) => {
            // only one default at a time
            const base = wallet.isDefault
                ? prev.map((w) => ({ ...w, isDefault: false }))
                : prev;
            return [...base, wallet];
        });
        setStatusFilter("active");
        setQuery("");
        setSelectedId(wallet.id);
    }

    function handleFunded(updated: Wallet) {
        setWallets((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    }

    return (
        <>
            <section className="flex flex-col gap-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl">Accounts</h1>
                        <p className="text-gray-700">Your wallets, balances, and money movements in one place.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={"outline"}><Download />Statements</Button>
                    </div>

                </div>
                {/* The cards */}
                <div className="flex gap-4">
                    {
                        cardDetails.map((card) => (
                            <Card className="basis-lg p-4" key={card.title}>
                                <CardTitle className="flex justify-between items-center text-gray-400">{card.title}<card.icon className="text-gray-500" /></CardTitle>
                                <p className="text-2xl">
                                    {card.number}
                                </p>
                                <CardDescription className={cn(card.descriptionColour)}>{card.description}</CardDescription>
                            </Card>
                        ))
                    }

                </div>

            </section>

            <section className="py-4">

                <div className="min-h-screen ">
                    <div className="mx-auto max-w-6xl">
                        {/* Header */}
                        <div className="mb-3 flex items-center justify-between">
                            <h1 className="text-base font-semibold text-slate-900">
                                Your wallets{" "}
                                <span className="ml-1 text-sm font-normal text-slate-400">
                                    {wallets.length}
                                </span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500">
                                    All balances in USD
                                </span>
                                <CreateWalletDialog onCreated={handleCreated} />
                            </div>
                        </div>

                        <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
                            {/* Wallet list */}
                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between gap-3 p-4">
                                    <div className="relative w-full max-w-xs">
                                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Search wallets"
                                            className="h-10 pl-9"
                                        />
                                    </div>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                                    >
                                        <SelectTrigger className="w-37.5 border-0 shadow-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active wallets</SelectItem>
                                            <SelectItem value="archived">Archived wallets</SelectItem>
                                            <SelectItem value="all">All wallets</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between border-y border-slate-100 px-6 py-2 text-xs text-slate-500">
                                    <span>Wallet</span>
                                    <span>Available balance</span>
                                </div>

                                <ul>
                                    {visible.length === 0 && (
                                        <li className="px-6 py-10 text-center text-sm text-slate-500">
                                            No wallets match your search.
                                        </li>
                                    )}
                                    {visible.map((w) => (
                                        <WalletRow
                                            key={w.id}
                                            wallet={w}
                                            selected={w.id === selectedId}
                                            onSelect={() => setSelectedId(w.id)}
                                        />
                                    ))}
                                </ul>

                                <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
                                    <Info className="size-3.5" />
                                    Move money between your wallets instantly, with no fees.
                                </div>
                            </section>

                            {/* Detail panel */}
                            {selected ? (
                                <WalletDetail wallet={selected} onFunded={handleFunded} />
                            ) : (
                                <aside className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                                    Select a wallet to see its details.
                                </aside>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export async function fundWallet(walletId: string, amount: string): Promise<Wallet> {
    const { data } = await apiClient.post<Wallet>(`/wallet/${walletId}/demo-deposit`, { amount });
    return data;
}

function AddFundsDialog({
    wallet,
    onFunded,
}: {
    wallet: Wallet;
    onFunded: (updated: Wallet) => void;
}) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const value = amount;
        console.log("value",value)
        if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
            setError("Enter an amount greater than zero.");
            return;
        }
        try {
            setIsSubmitting(true);
            setError(null);
            onFunded(await fundWallet(wallet.id, value));
            setOpen(false);
            setAmount("");
        } catch (err) {
            console.error("Failed to add funds", err);
            setError("We couldn't add the funds. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button className="bg-emerald-800 hover:bg-emerald-900">
                    <Plus className="size-4" /> Add funds
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Add funds to {wallet.name}</DialogTitle>
                        <DialogDescription>Demo deposit in {wallet.currency}.</DialogDescription>
                    </DialogHeader>

                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        {[1000, 10000, 50000].map((preset) => (
                            <Button
                                key={preset}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAmount(String(preset))}
                            >
                                {preset.toLocaleString()}
                            </Button>
                        ))}
                    </div>

                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting} className="bg-emerald-800 hover:bg-emerald-900">
                            {isSubmitting ? "Adding…" : "Add funds"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function WalletRow({
    wallet,
    selected,
    onSelect,
}: {
    wallet: Wallet;
    selected: boolean;
    onSelect: () => void;
}) {
    const Icon = iconFor(wallet);
    return (
        <li>
            <button
                type="button"
                onClick={onSelect}
                aria-pressed={selected}
                className={cn(
                    "flex w-full items-center gap-4 border-b border-slate-100 px-6 py-5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600",
                    selected
                        ? "border-y-2 border-emerald-700 bg-emerald-50/60"
                        : "hover:bg-slate-50",
                )}
            >
                <span
                    className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        selected
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500",
                    )}
                >
                    <Icon className="size-4" />
                </span>

                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                            {wallet.name}
                        </span>
                        {wallet.isDefault && (
                            <Badge
                                variant="secondary"
                                className="bg-emerald-100 px-1.5 py-0 text-[10px] font-medium text-emerald-800 hover:bg-emerald-100"
                            >
                                Default
                            </Badge>
                        )}
                    </span>
                    <span className="text-xs text-slate-500">
                        {wallet.purpose} · {wallet.accountLast4}
                    </span>
                </span>

                <span className="text-right">
                    <span className="block text-base font-semibold tabular-nums text-slate-900">
                        {money(wallet.availableBalance, wallet.currency)}
                    </span>
                    <span className="block text-xs tabular-nums text-slate-500">
                        {money(wallet.reservedBalance, wallet.currency)} reserved
                    </span>
                </span>

                <ChevronRight className="size-4 shrink-0 text-slate-400" />
            </button>
        </li>
    );
}

/* -------------------------------------------------------------------------- */
/* Detail panel                                                               */
/* -------------------------------------------------------------------------- */

function WalletDetail({ wallet, onFunded }: { wallet: Wallet, onFunded: (updated: Wallet) => void; }) {
    const total = wallet.availableBalance + wallet.reservedBalance;

    return (
        <aside className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">
                        {wallet.name}
                    </h2>
                    <Badge
                        variant="secondary"
                        className={cn(
                            "font-medium",
                            wallet.status === "active"
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-100",
                        )}
                    >
                        {wallet.status === "active" ? "Active" : "Archived"}
                    </Badge>
                </div>

                <p className="mt-5 text-xs text-slate-500">Available to spend</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-slate-900">
                    {money(wallet.availableBalance, wallet.currency)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                    {wallet.currency} · Ready for your next payment
                </p>

                <dl className="mt-5 space-y-2 text-xs">
                    <div className="flex justify-between">
                        <dt className="text-slate-500">Reserved for payments</dt>
                        <dd className="font-medium tabular-nums text-slate-900">
                            {money(wallet.reservedBalance, wallet.currency)}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-slate-500">Total balance</dt>
                        <dd className="font-medium tabular-nums text-slate-900">
                            {money(total, wallet.currency)}
                        </dd>
                    </div>
                </dl>

                <div className="mt-5 flex gap-2">
                    {/* <Button className="bg-emerald-800 hover:bg-emerald-900">
                        <Plus className="size-4" /> Add funds
                    </Button> */}
                    <AddFundsDialog wallet={wallet} onFunded={onFunded} />
                    <Button variant="outline">
                        <ArrowLeftRight className="size-4" /> Transfer
                    </Button>
                    <Button variant="outline">
                        <ArrowUpRight className="size-4" /> Pay
                    </Button>
                </div>
            </div>

            <dl className="space-y-3 border-t border-slate-100 p-6 text-xs">
                <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Wallet ID</dt>
                    <dd className="flex items-center gap-1.5 font-medium text-slate-900">
                        {wallet.reference}
                        <button
                            type="button"
                            aria-label="Copy wallet ID"
                            onClick={() => navigator.clipboard.writeText(wallet.reference)}
                            className="rounded p-0.5 text-slate-400 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-600"
                        >
                            <Copy className="size-3.5" />
                        </button>
                    </dd>
                </div>
                <Row label="Purpose" value={wallet.purpose} />
                <Row label="Spending access" value={wallet.spendingAccess} />
                <Row label="Created" value={shortDate(wallet.createdAt)} />
                <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Default wallet for payments</dt>
                    <dd>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline"
                        >
                            Manage wallet <SlidersHorizontal className="size-3.5" />
                        </button>
                    </dd>
                </div>
            </dl>
        </aside>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-900">{value}</dd>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Create wallet dialog                                                       */
/* -------------------------------------------------------------------------- */

const EMPTY_FORM: CreateWalletInput = {
    name: "",
    purpose: "",
    currency: "USD",
    spendingAccess: ACCESS_OPTIONS[0],
    setAsDefault: false,
};

function CreateWalletDialog({
    onCreated,
}: {
    onCreated: (wallet: Wallet) => void;
}) {
    const [open, setOpen] = useState(false);
    // One object for the whole form instead of a useState per input.
    const [form, setForm] = useState<CreateWalletInput>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const update = <K extends keyof CreateWalletInput>(
        key: K,
        value: CreateWalletInput[K],
    ) => setForm((f) => ({ ...f, [key]: value }));

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) {
            setForm(EMPTY_FORM);
            setError(null);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!form.name.trim()) {
            setError("Give the wallet a name.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            const wallet = await createWallet(form);
            onCreated(wallet);
            handleOpenChange(false);
        } catch (err) {
            console.error("Failed to create wallet", err);
            setError("We couldn't create the wallet. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger>
                <Button size="sm" className="bg-emerald-800 hover:bg-emerald-900">
                    <Plus className="size-4" /> Create wallet
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Create wallet</DialogTitle>
                        <DialogDescription>
                            A new wallet starts with a zero balance. You can add funds right
                            after.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="wallet-name">Name</Label>
                            <Input
                                id="wallet-name"
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
                                placeholder="e.g. Marketing budget"
                                maxLength={60}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="wallet-purpose">Purpose</Label>
                            <Input
                                id="wallet-purpose"
                                value={form.purpose}
                                onChange={(e) => update("purpose", e.target.value)}
                                placeholder="e.g. Ad spend"
                                maxLength={80}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Currency</Label>
                                <Select
                                    value={form.currency}
                                    onValueChange={(v) => update("currency", v ?? "")}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Spending access</Label>
                                <Select
                                    value={form.spendingAccess}
                                    onValueChange={(v) => update("spendingAccess", v ?? "")}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ACCESS_OPTIONS.map((a) => (
                                            <SelectItem key={a} value={a}>
                                                {a}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="wallet-default"
                                checked={form.setAsDefault}
                                onCheckedChange={(c) => update("setAsDefault", c === true)}
                            />
                            <Label htmlFor="wallet-default" className="font-normal">
                                Use as the default wallet for payments
                            </Label>
                        </div>

                        {error && (
                            <p role="alert" className="text-sm text-red-600">
                                {error}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-emerald-800 hover:bg-emerald-900"
                        >
                            {isSubmitting ? "Creating…" : "Create wallet"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}