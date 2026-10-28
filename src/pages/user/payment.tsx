import { ChartBarInteractive } from "@/components/SampleBarChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Payment() {
    return (
        <div className="flex gap-2 items-stretch">
            <div className="grow">
                <ChartBarInteractive />
            </div>
            <div className="space-y-4 grow-[0.15] rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                <form className="flex flex-col gap-4">
                    <p className="text-sm font-medium space-y-4">Make a payment</p>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Pay to</span>
                        <Select defaultValue="DumDum" >
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DumDum">DumDum</SelectItem>
                                <SelectItem value="Val">Val</SelectItem>
                                <SelectItem value="Chipmunk">Chipmunk</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Amount</span>
                        <Input type="number"/>
                    </div>
                    <Button>Continue to Payment</Button>
                    <p className="text-xs text-muted-foreground">Review fees and details before you send.</p>
                </form>
            </div>
        </div>
    )
}