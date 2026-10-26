"use client"

import { useEffect, useMemo, useState } from "react"
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
import isEqual from 'fast-deep-equal';
import { apiClient } from "@/api/client"
import { toast } from "@/components/ui/toast"

// categorical: currency, channel, segment, destination, type. OPERATORS: equals, not equals, in a list
// numeric: amount, monthly volume, transaction count, OPERATORS: greater than, less than, btwn
// 1. Define fields and operators as const arrays
export const NUMERIC_FIELDS = ['amount'] as const;
export const CATEGORICAL_FIELDS = ['channel', 'destination_type'] as const;

export type NumericField = typeof NUMERIC_FIELDS[number];
export type CategoricalField = typeof CATEGORICAL_FIELDS[number];
export type Field = NumericField | CategoricalField;

export const NUMERIC_OPS = ['gt', 'lt', 'between'] as const;
export const CATEGORICAL_OPS = ['equals', 'not_equals', 'in'] as const;

export type NumericOp = typeof NUMERIC_OPS[number];
export type CategoricalOp = typeof CATEGORICAL_OPS[number];
export type Operator = NumericOp | CategoricalOp;

// 2. Map raw field keys to human-readable UI labels
export const FIELD_LABELS: Record<Field, string> = {
  amount: 'Amount',
  channel: 'Channel',
  destination_type: 'Destination Type',
};

// 3. Map raw operator keys to human-readable UI labels
export const OPERATOR_LABELS: Record<Operator, string> = {
  equals: 'is equal to',
  not_equals: 'is not equal to',
  in: 'is in',
  gt: 'greater than',
  lt: 'less than',
  between: 'is between',
};

// Type guard helper
const isNumericField = (field: Field): field is NumericField => {
  return (NUMERIC_FIELDS as readonly string[]).includes(field);
};

const isNumericCondition = (c: Condition): c is NumericCondition =>
  isNumericField(c.field);

export interface CategoricalCondition {
  id: string;
  field: CategoricalField;
  op: CategoricalOp;
  value: string | string[];      // string for equals/not_equals, array for in
}

export interface NumericCondition {
  id: string;
  field: NumericField;
  op: NumericOp;
  value: number | [number, number]; // number for gt/lt, [min, max] for between
}

export type Condition = CategoricalCondition | NumericCondition;

// A rule matches when ALL conditions in the list are true.
// An empty list means "always matches".
export interface RuleConditions {
  all: Condition[];
}

type Rule = {
  // change rule to string later like a random UUID
  id: string
  name: string
  summary: string
  meta?: string // delete later
  action: string
  priority: number,
  approverGroup: string
  icon?: LucideIcon // delete later
  active: boolean
  conditions?: RuleConditions,
  transactionType?: 'Transfer', // set to a type later
  flatAmount: number;
  percent: number;                 // 0.5 means 0.5%
  minFee?: number;
  maxFee?: number;
}

// order the rules by priority
const data: Rule[] = [
  { id: "1", name: "High-value payment approval", summary: "Amount > $10,000 · Currency is USD", meta: "8 matched today", action: "Require approval", priority: 1, icon: ShieldCheck, active: true, approverGroup: "finance", conditions: { all: [{ id: "001", field: "amount", op: "gt", value: 100 }] }, flatAmount: 500, percent: 0.5 },
  { id: "2", name: "Block restricted destinations", summary: "Recipient country is on restricted list", meta: "3 matched today", action: "Block payment", priority: 2, approverGroup: "risk team", icon: Ban, active: true, flatAmount: 500, percent: 0.5 },
  { id: "3", name: "Domestic ACH routing", summary: "Country is US · Currency is USD", meta: "24 matched today", action: "Route via ACH", priority: 3, approverGroup: "finance", icon: GitBranch, active: true, flatAmount: 500, percent: 0.5 },
  { id: "4", name: "International wire routing", approverGroup: "finance", summary: "Recipient country is not US", meta: "4 matched today", priority: 4, action: "Route via wire", icon: Globe, active: true, flatAmount: 500, percent: 0.5 },
  { id: "5", name: "New recipient review", summary: "Recipient age is less than 7 days", meta: "Paused · no evaluations", action: "Require approval", priority: 5, approverGroup: "finance", icon: ShieldCheck, active: false, flatAmount: 500, percent: 0.5 },
  { id: "6", name: "Weekend payment hold", summary: "Day is Saturday or Sunday", meta: "Paused · no evaluations", action: "Schedule next day", priority: 6, approverGroup: "finance", icon: CalendarClock, active: false, flatAmount: 500, percent: 0.5 },
]

const tabs = ["All rules", "Active", "Inactive"] as const
type Tab = (typeof tabs)[number]

const rowGrid = "grid grid-cols-[56px_1fr_190px_90px] items-center"


export default function PaymentRulesSettings() {
  const [initialRules, setInitialRules] = useState<Rule[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [isPublishing, setIsPublishing] = useState(false);
  // set selectedId to the id of the first rule by default
  const [selectedId, setSelectedId] = useState("")
  const [tab, setTab] = useState<Tab>("All rules")
  const [query, setQuery] = useState("")

  // use tanstack query for better features
  useEffect(() => {
    async function fetchData() {
      const data = await apiClient.get<Rule[]>("/rule")
      console.log("data", data)
      setInitialRules(data.data)
      setRules(data.data)
      setSelectedId(data.data[0]?.id ?? "")
      // return data
    }
    fetchData()
  }, [])

  const counts: Record<Tab, number> = {
    "All rules": rules.length,
    Active: rules.filter((r) => r.active).length,
    Inactive: rules.filter((r) => !r.active).length,
  }

  const visible = rules.filter((r) => {
    const matchesTab =
      tab === "All rules" || (tab === "Active" ? r.active : !r.active)
    return matchesTab && r.name.toLowerCase().includes(query.toLowerCase())
  })

  const createRule = () => {
    // const newId = rules.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    // const priority = rules[rules.length - 1].priority + 1
    const newId = crypto.randomUUID(); 
    const priority = rules.reduce((max, r) => Math.max(max, r.priority), 0) + 1;

    const newRule: Rule = {
      id: newId,
      name: "New rule",
      summary: "",
      // meta: "",
      action: "ApplyFee",
      priority,
      approverGroup: "",
      transactionType: "Transfer",
      // holdUntilApproved: true,
      active: false,          // safer to start paused until it's configured
      conditions: { all: [] },
      flatAmount: 500,
      percent: 0.5
    };

    setRules((prev) => [...prev, newRule]);
    setSelectedId(newId);
  };

  const updateRule = (ruleId: string, patch: Partial<Rule>) => {
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)));
  };

  const updateCondition = (ruleId: string, update: Condition) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id !== ruleId
          ? r
          : {
            ...r,
            conditions: {
              ...r.conditions,
              all: (r.conditions?.all ?? []).map((c) => (c.id === update.id ? update : c)),
            },
          }
      )
    );
  };


  function AddCondition(selectedRuleId: string) {
    setRules((prevRules) =>
      prevRules.map((rule) => {
        // Find the rule to update
        if (rule.id !== selectedRuleId) {
          return rule;
        }

        // Return a brand-new rule object with updated conditions
        return {
          ...rule,
          conditions: {
            ...rule.conditions,
            all: [
              { id: crypto.randomUUID(), field: "amount", op: "gt", value: 100 },
              ...(rule.conditions?.all ?? []),
            ],
          },
        };
      })
    );
  }

  function RemoveCondition(selectedRuleId: string, conditionIdToRemove: string) {
    setRules((prevRules) =>
      prevRules.map((rule) => {
        if (rule.id !== selectedRuleId) return rule;
        return {
          ...rule,
          conditions: {
            ...rule.conditions,
            all: (rule.conditions?.all ?? []).filter(
              (c) => {
                console.log(c.id, conditionIdToRemove)
                return c.id !== conditionIdToRemove
              }
            ),
          },
        };
      })
    );
  }

  // Deep-compares 'rules' and 'initialRules' by value, not by reference
  const isDirty = useMemo(() => !isEqual(rules, initialRules), [rules, initialRules]);

  // set the original data to the new ones
  async function PublishChanges(event: React.SubmitEvent<HTMLFormElement>, ruleToUpdate: Rule) {
    console.log("rule", ruleToUpdate)
    try {
      event.preventDefault()
      setIsPublishing(true)
      // Send updated draft to API endpoint
      await apiClient.put(`/rule/${ruleToUpdate.id}`, ruleToUpdate)
      setInitialRules(rules)
      // add a toast
      toast.add({
        type: "success",
        description: "Successfully published rules"
      })
      console.log('Successfully published rules');
    } catch (error) {
      console.error('Failed to publish rules', error);
      toast.add({
        type: "error",
        description: "Failed to publish rules"
      })
    } finally {
      setIsPublishing(false);
    }
  }

  // return the changes that were edited to their original value
  function CancelChanges() {
    setRules(initialRules)
  }

  const selected = rules.find((r) => r.id === selectedId) ?? rules[0]

  const toggle = (id: string) =>
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
              <div className="flex items-center gap-1">
                <button title="Create rule" onClick={createRule} className="cursor-pointer">
                  <Plus size={20} />
                </button>
                <button aria-label="More options" className="text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
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
                      {rule.priority}
                    </div>

                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${isSelected ? "text-green-600" : ""}`}>
                        {rule.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">{rule.summary}</p>
                      <p className="text-xs text-slate-400">{rule.meta}</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {
                        Icon && <Icon className="size-4 text-slate-500" />
                      }
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
        {
          selected &&
          <aside className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
            <form onSubmit={(e) => PublishChanges(e, selected)}>
              <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">Rule configuration</h2>
                  <Badge className="rounded-md bg-green-50 text-primary hover:bg-green-50">
                    Priority {selected.priority}
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
                    {selected.active ? "Active" : "Inactive"}
                    <Switch
                      checked={selected.active}
                      onCheckedChange={() => toggle(selected.id)}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="rule-name" className="text-sm font-medium">Rule name</label>
                  <Input id="rule-name" key={selected.id} defaultValue={selected.name} onChange={(e) => updateRule(selected.id, { name: e.target.value })} />
                </div>

                {/* When */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">When</h3>
                    <span className="text-xs text-slate-500">Match all conditions (AND)</span>
                  </div>

                  <div className={selected.conditions?.all?.length ? "space-y-2 rounded-lg bg-slate-100 p-3" : ""}>

                    {
                      selected.conditions?.all.map((c) => (
                        <ConditionRow key={c.id} ruleId={selected.id} condition={c} removeCondition={RemoveCondition} updateCondition={updateCondition} />
                      ))
                    }

                  </div>

                  <button className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700" type="button" onClick={() => AddCondition(selected.id)}>
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
                    <Select defaultValue="ApplyFee" onValueChange={(v) => updateRule(selected.id, { action: v ?? undefined })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ApplyFee">Apply Fee</SelectItem>
                        <SelectItem value="block">Block payment</SelectItem>
                        <SelectItem value="ach">Route via ACH</SelectItem>
                        <SelectItem value="wire">Route via wire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Approver group</span>
                    <Select defaultValue="finance" onValueChange={(v) => updateRule(selected.id, { approverGroup: v ?? undefined })}>
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
                    <button className="text-xs font-medium text-green-600 hover:text-green-700" type="button">
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
                <span className={`text-xs ${isDirty ? 'font-medium text-amber-600' : 'text-slate-500'}`}>
                  {isDirty ? '● You have unsaved changes' : 'No unsaved changes'}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={CancelChanges} disabled={!isDirty || isPublishing}>Cancel</Button>
                  <Button className="bg-primary hover:bg-green-800" disabled={!isDirty || isPublishing} type="submit">Publish changes</Button>
                </div>
              </footer>
            </form>
          </aside>
        }
      </div>
    </div>
  )
}


export function ConditionRow({
  ruleId,
  condition,
  updateCondition,
  removeCondition
}: {
  updateCondition: (ruleId: string, update: Condition) => void,
  removeCondition: (ruleId: string, conditionIdToRemove: string) => void
  ruleId: string,
  condition: Condition
}) {

  // Derive available operators based on current field
  const availableOperators: readonly Operator[] = isNumericField(condition.field)
    ? NUMERIC_OPS
    : CATEGORICAL_OPS;



  const handleFieldChange = (field: Field) => {
    if (isNumericCondition(condition) && isNumericField(field)) {
      // numeric -> numeric: keep op/value
      updateCondition(ruleId, { ...condition, field, op: "gt" });
    } else if (!isNumericCondition(condition) && !isNumericField(field)) {
      // categorical -> categorical: keep op/value
      updateCondition(ruleId, { ...condition, field, op: "equals" });
    } else if (isNumericField(field)) {
      // from categorical -> numeric
      updateCondition(ruleId, { id: condition.id, field, op: NUMERIC_OPS[0], value: 0 });
    } else {
      // from numeric -> categorical
      updateCondition(ruleId, { id: condition.id, field, op: CATEGORICAL_OPS[0], value: "" });
    }
  };

  const handleOperatorChange = (op: Operator) => {
    if (isNumericCondition(condition)) {
      const numOp = op as NumericOp;
      const first = Array.isArray(condition.value) ? condition.value[0] : condition.value;
      updateCondition(ruleId, {
        ...condition,
        op: numOp,
        value: numOp === "between" ? [first, first] : first,
      });
    } else {
      const catOp = op as CategoricalOp;
      const first = Array.isArray(condition.value) ? (condition.value[0] ?? "") : condition.value;
      updateCondition(ruleId, {
        ...condition,
        op: catOp,
        value: catOp === "in" ? [first] : first,
      });
    }
  };

  const handleValueChange = (raw: string, index = 0) => {
    if (isNumericCondition(condition)) {
      const n = Number(raw);
      if (Array.isArray(condition.value)) {
        const next: [number, number] = [...condition.value];
        next[index] = n;
        updateCondition(ruleId, { ...condition, value: next });
      } else {
        updateCondition(ruleId, { ...condition, value: n });
      }
    } else {
      if (Array.isArray(condition.value)) {
        const next = [...condition.value];
        next[index] = raw;
        updateCondition(ruleId, { ...condition, value: next });
      } else {
        updateCondition(ruleId, { ...condition, value: raw });
      }
    }
  };

  const values = Array.isArray(condition.value) ? condition.value : [condition.value];

  return (
    <div className="flex items-center gap-2">
      {/* Field Selector */}
      <Select value={condition.field} onValueChange={(v) => handleFieldChange(v as Field)}>
        <SelectTrigger className="h-9 w-40 bg-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">Numeric</div>
          {NUMERIC_FIELDS.map((f) => (
            <SelectItem key={f} value={f}>
              {FIELD_LABELS[f]}
            </SelectItem>
          ))}
          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase mt-1">Categorical</div>
          {CATEGORICAL_FIELDS.map((f) => (
            <SelectItem key={f} value={f}>
              {FIELD_LABELS[f]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator Selector */}
      <Select value={condition.op} onValueChange={(v) => handleOperatorChange(v as Operator)}>
        <SelectTrigger className="h-9 flex-1 bg-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((op) => (
            <SelectItem key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input className="h-9 w-20 bg-white text-xs" value={values[0] ?? ""} onChange={(e) => handleValueChange(e.target.value, 0)} />
      {(condition.op === "between" || condition.op === "in") && (
        <Input className="h-9 w-20 bg-white text-xs" value={values[1] ?? ""} onChange={(e) => handleValueChange(e.target.value, 1)} />
      )}
      <button aria-label="Remove condition" className="text-slate-400 hover:text-slate-600" onClick={() => removeCondition(ruleId, condition.id)}>
        <X className="size-4" />
      </button>
    </div>
  );
}