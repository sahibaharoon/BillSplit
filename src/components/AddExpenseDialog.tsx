import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Receipt } from "lucide-react";

interface Group {
  id: string;
  name: string;
}

interface GroupMember {
  user_id: string;
  profiles: {
    username: string;
  };
}

interface AddExpenseDialogProps {
  groupId?: string;
  onExpenseAdded?: () => void;
}

export const AddExpenseDialog = ({ groupId, onExpenseAdded }: AddExpenseDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState(groupId || "");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers();
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (amount && groupMembers.length > 0) {
      const splitAmount = (parseFloat(amount) / groupMembers.length).toFixed(2);
      const newSplitAmounts: Record<string, string> = {};
      groupMembers.forEach(member => {
        newSplitAmounts[member.user_id] = splitAmount;
      });
      setSplitAmounts(newSplitAmounts);
    }
  }, [amount, groupMembers]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_memberships')
        .select(`
          user_id,
          profiles (
            username
          )
        `)
        .eq('group_id', selectedGroup);

      if (error) throw error;
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !amount || !description.trim()) return;

    const splits = Object.entries(splitAmounts).map(([user_id, amount]) => ({
      user_id,
      amount: parseFloat(amount)
    }));

    const totalSplits = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplits - parseFloat(amount)) > 0.01) {
      toast({
        title: "Error",
        description: "Split amounts must equal the total amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-expense', {
        body: {
          group_id: selectedGroup,
          amount: parseFloat(amount),
          description: description.trim(),
          category,
          splits
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense added successfully",
      });

      setAmount("");
      setDescription("");
      setCategory("general");
      setSelectedGroup(groupId || "");
      setSplitAmounts({});
      setIsOpen(false);
      onExpenseAdded?.();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Receipt className="h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!groupId && (
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              required
            />
          </div>

          {groupMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Split Between Members</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {groupMembers.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between">
                    <span className="text-sm">{member.profiles?.username}</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={splitAmounts[member.user_id] || ""}
                      onChange={(e) => setSplitAmounts(prev => ({
                        ...prev,
                        [member.user_id]: e.target.value
                      }))}
                      className="w-20"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedGroup || !amount || !description.trim()}>
              {isLoading ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};