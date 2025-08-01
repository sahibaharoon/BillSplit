import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRightLeft, DollarSign } from "lucide-react";

interface Group {
  id: string;
  name: string;
}

interface Settlement {
  from_user: string;
  to_user: string;
  amount: number;
  from_username: string;
  to_username: string;
}

interface SettleDebtsDialogProps {
  groupId?: string;
  onSettled?: () => void;
}

export const SettleDebtsDialog = ({ groupId, onSettled }: SettleDebtsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState(groupId || "");
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  // New state to track if settlements have been calculated
  const [isCalculated, setIsCalculated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  // Reset the component state when the dialog is closed or group changes
  useEffect(() => {
    if (!isOpen) {
      setSettlements([]);
      setIsCalculated(false);
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const calculateSettlements = async () => {
    if (!selectedGroup) return;

    setIsLoading(true);
    setIsCalculated(false); // Reset calculation status before new calculation
    try {
      const { data, error } = await supabase.functions.invoke("calculate-settlements", {
        body: { group_id: selectedGroup },
      });

      if (error) throw error;

      setSettlements(data.settlements || []);
      setIsCalculated(true); // Mark as calculated on success
    } catch (error) {
      console.error("Error calculating settlements:", error);
      toast({
        title: "Error",
        description: "Failed to calculate settlements",
        variant: "destructive",
      });
      setSettlements([]);
      setIsCalculated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettleUp = async () => {
    if (!selectedGroup) return;

    setIsLoading(true);
    try {
      // This function call is assumed to delete all expenses and splits for the group
      const { error } = await supabase.functions.invoke("reset-settlements", {
        body: { group_id: selectedGroup },
      });

      if (error) throw error;

      toast({
        title: "Settled!",
        description: "All debts have been settled and expenses cleared for this group.",
      });

      // Reset local state and close the dialog
      setSettlements([]);
      setIsCalculated(false);
      setIsOpen(false);
      
      // Trigger a data refresh in the parent component
      if (onSettled) onSettled();
    } catch (error) {
      console.error("Error settling debts:", error);
      toast({
        title: "Error",
        description: "Could not settle debts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Settle Debts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settle Group Debts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!groupId && (
            <div className="space-y-2">
              <label htmlFor="group" className="text-sm font-medium">
                Select Group
              </label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group to settle" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedGroup && (
            <Button onClick={calculateSettlements} disabled={isLoading} className="w-full">
              {isLoading ? "Calculating..." : "Calculate Settlements"}
            </Button>
          )}

          {/* Show settlements only if they exist */}
          {settlements.length > 0 && (
            <>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Suggested Settlements</h3>
                <div className="text-sm text-muted-foreground">
                  {settlements.length} transaction{settlements.length !== 1 ? "s" : ""} needed to settle all debts
                </div>
                <div className="space-y-2">
                  {settlements.map((settlement, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">{settlement.from_username}</span>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{settlement.to_username}</span>
                      </div>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(settlement.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSettleUp}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Settling Up..." : "Settle Up"}
              </Button>
            </>
          )}

          {/* Show the "All settled up!" message only after calculation and if no settlements are found */}
          {isCalculated && settlements.length === 0 && selectedGroup && (
            <div className="text-center p-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-green-600 dark:text-green-400 font-medium">🎉 All settled up!</div>
              <div className="text-sm text-muted-foreground mt-1">
                No outstanding debts in this group
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
