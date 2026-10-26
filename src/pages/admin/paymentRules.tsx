import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "cn";
import { CircleCheck, GitBranch, InfoIcon, Plus, RotateCcwClock, ShieldCheck, Workflow } from "lucide-react";
import PaymentRulesSettings from "./paymentRuleSettings";

const cardDetails = [
    { title: "Total Rules", icon: Workflow, number: 6, description: "Approval, routing and risk checks", descriptionColour: "text-gray-400" },
    { title: "Active Rules", icon: CircleCheck, number: 4, description: "2 rules are currently paused", descriptionColour: "text-green-700" },
    { title: "Rule matches today", icon: GitBranch, number: 38, description: "Across 4 active rules", descriptionColour: "text-gray-400" },
    { title: "Awaiting approval", icon: ShieldCheck, number: 2, description: "$23,900.00 awaiting review", descriptionColour: "text-amber-700" }
]

export default function PaymentRules() {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl">Payment Rules</h1>
                    <p className="text-gray-700">Keep every payment on the right path. Set the logic, let Dinero handle the rest.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={"outline"}><RotateCcwClock /> Version History</Button>
                    <Button><Plus />Create Rule</Button>
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

            <Alert className="bg-green-50">
                <InfoIcon className="text-green-700"/>
                <AlertDescription className="text-green-700">Rules run in priority order. Approval and risk checks are evaluated before payment routing.</AlertDescription>
            </Alert>

            <PaymentRulesSettings/>
        </section>
    )
}