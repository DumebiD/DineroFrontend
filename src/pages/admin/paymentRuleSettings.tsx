"use client"

import { useState } from "react"
import {
  ArrowUpRight,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  GitBranch,
  Globe,
  GripVertical,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type Rule = {
  id: number
  name: string
  summary: string
  meta: string
  action: string
  icon: LucideIcon
  active: boolean
}

const initialRules: Rule[] = [
  { id: 1, name: "High-value payment approval", summary: "Amount > $10,000 · Currency is USD", meta: "8 matched today", action: "Require approval", icon: ShieldCheck, active: true },
  { id: 2, name: "Block restricted destinations", summary: "Recipient country is on restricted list", meta: "3 matched today", action: "Block payment", icon: Ban, active: true },
  { id: 3, name: "Domestic ACH routing", summary: "Country is US · Currency is USD", meta: "24 matched today", action: "Route via ACH", icon: GitBranch, active: true },
  { id: 4, name: "International wire routing", summary: "Recipient country is not US", meta: "4 matched today", action: "Route via wire", icon: Globe, active: true },
  { id: 5, name: "New recipient review", summary: "Recipient age is less than 7 days", meta: "Paused · no evaluations", action: "Require approval", icon: ShieldCheck, active: false },
  { id: 6, name: "Weekend payment hold", summary: "Day is Saturday or Sunday", meta: "Paused · no evaluations", action: "Schedule next day", icon: CalendarClock, active: false },
]

const tabs = ["All rules", "Active", "Paused"] as const
type Tab = (typeof tabs)[number]

const rowGrid = "grid grid-cols-[56px_1fr_190px_90px] items-center"

export default function PaymentRulesSettings() {
  const [rules, setRules] = useState(initialRules)
  const [selectedId, setSelectedId] = useState(1)
  const [tab, setTab] = useState<Tab>("All rules")
  const [query, setQuery] = useState("")

  const counts: Record<Tab, number> = {
    "All rules": rules.length,
    Active: rules.filter((r) => r.active).length,
    Paused: rules.filter((r) => !r.active).length,
  }

  const visible = rules.filter((r) => {
    const matchesTab =
      tab === "All rules" || (tab === "Active" ? r.active : !r.active)
    return matchesTab && r.name.toLowerCase().includes(query.toLowerCase())
  })

  const selected = rules.find((r) => r.id === selectedId) ?? rules[0]

  const toggle = (id: number) =>
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    )

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto grid max-w-300 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left column */}
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between px-6 pt-6">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Your rules</h2>
                <Badge variant="secondary" className="rounded-md bg-slate-100 text-slate-600">
                  {rules.length}
                </Badge>
              </div>
              <button aria-label="More options" className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="size-4" />
              </button>
            </header>

            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex gap-4 text-sm">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={
                      tab === t
                        ? "font-medium text-green-600"
                        : "text-slate-500 hover:text-slate-700"
                    }
                  >
                    {t} ({counts[t]})
                  </button>
                ))}
              </div>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a rule"
                  className="h-9 pl-9 text-sm"
                />
              </div>
            </div>

            <div className={`${rowGrid} bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500`}>
              <span>ORDER</span>
              <span>RULE / CONDITIONS</span>
              <span>ACTION</span>
              <span>ACTIVE</span>
            </div>

            <ul>
              {visible.map((rule) => {
                const isSelected = rule.id === selectedId
                const Icon = rule.icon
                return (
                  <li
                    key={rule.id}
                    onClick={() => setSelectedId(rule.id)}
                    className={`${rowGrid} cursor-pointer border-t border-slate-100 px-3 py-4 ${isSelected
                        ? "border-l-2 border-l-green-500 bg-green-50/70"
                        : "hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <GripVertical className="size-4 text-slate-300" />
                      {rule.id}
                    </div>

                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${isSelected ? "text-green-600" : ""}`}>
                        {rule.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">{rule.summary}</p>
                      <p className="text-xs text-slate-400">{rule.meta}</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Icon className="size-4 text-slate-500" />
                      {rule.action}
                    </div>

                    <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={rule.active}
                        onCheckedChange={() => toggle(rule.id)}
                        className="data-[state=checked]:bg-green-600"
                      />
                      {isSelected ? (
                        <ChevronRight className="size-4 text-green-600" />
                      ) : (
                        <MoreHorizontal className="size-4 text-slate-400" />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <footer className="flex items-center gap-2 border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
              <GripVertical className="size-3.5 text-slate-300" />
              Drag to change priority. Changes apply after publishing.
            </footer>
          </section>

          {/* Activity */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Domestic ACH routing was updated</p>
              <p className="text-xs text-slate-500">Jamie Lee · Today, 9:30 AM · Version 12</p>
            </div>
            <ArrowUpRight className="size-4 text-slate-400" />
          </div>
        </div>

        {/* Right column */}
        <aside className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Rule configuration</h2>
              <Badge className="rounded-md bg-green-50 text-primary hover:bg-green-50">
                Priority {selected.id}
              </Badge>
            </div>
            <MoreHorizontal className="size-4 text-slate-400" />
          </header>

          <div className="flex-1 space-y-5 p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-primary">
                <ShieldCheck className="size-4" />
                Approval rule
              </span>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                {selected.active ? "Active" : "Paused"}
                <Switch
                  checked={selected.active}
                  onCheckedChange={() => toggle(selected.id)}
                  className="data-[state=checked]:bg-green-600"
                />
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="rule-name" className="text-sm font-medium">Rule name</label>
              <Input id="rule-name" key={selected.id} defaultValue={selected.name} />
            </div>

            {/* When */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">When</h3>
                <span className="text-xs text-slate-500">Match all conditions (AND)</span>
              </div>
              <div className="space-y-2 rounded-lg bg-slate-100 p-3">
                <ConditionRow field="Amount" operator="greater than" value="10,000" />
                <p className="text-[11px] text-slate-500">AND</p>
                <ConditionRow field="Currency" operator="is equal to" value="USD" />
              </div>
              <button className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700">
                <Plus className="size-3.5" />
                Add condition
              </button>
            </div>

            <hr className="border-slate-100" />

            {/* Then */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Then</h3>

              <div className="space-y-2">
                <span className="text-sm font-medium">Action</span>
                <Select defaultValue="approval">
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approval">Require approval</SelectItem>
                    <SelectItem value="block">Block payment</SelectItem>
                    <SelectItem value="ach">Route via ACH</SelectItem>
                    <SelectItem value="wire">Route via wire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Approver group</span>
                <Select defaultValue="finance">
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Finance approvers</SelectItem>
                    <SelectItem value="risk">Risk team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600">
                <Checkbox
                  defaultChecked
                  className="data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600"
                />
                Hold payment until one approver approves
              </label>
            </div>

            {/* Test */}
            <div className="space-y-2 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <FlaskConical className="size-4 text-slate-500" />
                  Test this rule
                </span>
                <button className="text-xs font-medium text-green-600 hover:text-green-700">
                  Run test <span aria-hidden>→</span>
                </button>
              </div>
              <p className="text-xs text-slate-500">PAY-1046 · Vercel Inc. · $18,400.00 USD</p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="size-3.5" />
                Matches · Sent to Finance approvers
              </p>
            </div>
          </div>

          <footer className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <span className="text-xs text-slate-500">No unsaved changes</span>
            <div className="flex gap-2">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-primary hover:bg-green-800">Publish changes</Button>
            </div>
          </footer>
        </aside>
      </div>
    </div>
  )
}

function ConditionRow({
  field,
  operator,
  value,
}: {
  field: string
  operator: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Select defaultValue={field}>
        <SelectTrigger className="h-9 w-27.5 bg-white text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Amount">Amount</SelectItem>
          <SelectItem value="Currency">Currency</SelectItem>
          <SelectItem value="Country">Country</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue={operator}>
        <SelectTrigger className="h-9 flex-1 bg-white text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="greater than">greater than</SelectItem>
          <SelectItem value="is equal to">is equal to</SelectItem>
          <SelectItem value="less than">less than</SelectItem>
        </SelectContent>
      </Select>
      <Input defaultValue={value} className="h-9 w-20 bg-white text-xs" />
      <button aria-label="Remove condition" className="text-slate-400 hover:text-slate-600">
        <X className="size-4" />
      </button>
    </div>
  )
}