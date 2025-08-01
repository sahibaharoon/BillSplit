import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { SettleDebtsDialog } from "@/components/SettleDebtsDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Users, 
  Receipt, 
  TrendingUp, 
  Calendar,
  User,
  IndianRupee,
  Divide,
  Coins
} from "lucide-react";

// New interface for the expense splits
interface ExpenseSplit {
  user_id: string;
  amount: number;
  profiles: {
    username: string;
  };
}

// Updated Expense interface to include the splits
interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  paid_by: string;
  profiles: {
    username: string;
  };
  expense_splits: ExpenseSplit[]; // Added the splits
}

interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
  member_count: number;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    username: string;
    email: string;
    full_name: string;
  };
}

const GroupDetail = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  const fetchGroupData = async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Get member count
      const { count } = await supabase
        .from('group_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      setGroup({
        ...groupData,
        member_count: count || 0
      });

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_memberships')
        .select(`
          *,
          profiles (
            username,
            email,
            full_name
          )
        `)
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Fetch expenses and nested splits
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          profiles (
            username
          ),
          expense_splits (
            user_id,
            amount,
            profiles (
              username
            )
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch group data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDataUpdate = () => {
    fetchGroupData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl font-medium text-foreground">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <Card className="tech-border shadow-card">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Group not found</h2>
            <p className="text-muted-foreground mb-6">
              The group you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/")}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {group.name}
              </h1>
            </div>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 ml-11">
              {group.name || "No description"}
            </p>
          </div>
          <div className="flex gap-2">
            <AddMemberDialog groupId={group.id} onMemberAdded={handleDataUpdate} />
            <AddExpenseDialog 
              groupId={group.id}
              onExpenseAdded={handleDataUpdate} 
            />
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="tech-border shadow-card hover:shadow-primary transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {group.member_count}
              </div>
              <p className="text-xs text-muted-foreground">
                Active participants
              </p>
            </CardContent>
          </Card>

          <Card className="tech-border shadow-card hover:shadow-primary transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {expenses.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Recorded transactions
              </p>
            </CardContent>
          </Card>

          <Card className="tech-border shadow-card hover:shadow-primary transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <IndianRupee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total group spending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Group Details */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="h-4 w-4" />
              Expenses ({expenses.length})
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="settlements" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Settlements
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            {expenses.length > 0 ? (
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <Card key={expense.id} className="tech-border shadow-card hover:shadow-primary transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold text-lg">{expense.description}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Paid by {expense.profiles?.username}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(expense.date)}
                            </span>
                            <Badge variant="outline">
                              {expense.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 text-right">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(expense.amount)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Expense Split Details */}
                      <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                        <h4 className="font-semibold text-sm mb-2 text-muted-foreground flex items-center gap-2">
                          <Divide className="h-4 w-4" /> Split Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-foreground">
                          {expense.expense_splits.map((split) => (
                            <div key={split.user_id} className="flex justify-between items-center bg-secondary/30 rounded-md p-2">
                              <span className="flex items-center gap-2 font-medium">
                                <Coins className="h-4 w-4 text-muted-foreground" />
                                {split.profiles?.username} owes:
                              </span>
                              <span className="font-semibold text-primary">
                                {formatCurrency(split.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="tech-border shadow-card">
                <CardContent className="text-center py-12">
                  <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No expenses yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start adding expenses to track group spending
                  </p>
                  <AddExpenseDialog 
                    groupId={group.id}
                    onExpenseAdded={handleDataUpdate} 
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Group Members</h2>
              <AddMemberDialog groupId={group.id} onMemberAdded={handleDataUpdate} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Card key={member.id} className="tech-border shadow-card">
                  <CardContent className="p-4">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
                        <span className="text-primary-foreground font-bold">
                          {member.profiles?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{member.profiles?.full_name || member.profiles?.username}</h3>
                        <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        <Badge variant="outline">
                          Joined {formatDate(member.joined_at)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Debt Settlements</h2>
              <SettleDebtsDialog 
                groupId={group.id} 
                onSettled={handleDataUpdate} 
              />
            </div>

            <Card className="tech-border shadow-card">
              <CardContent className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Settlement feature coming soon</h3>
                <p className="text-muted-foreground mb-6">
                  Group-specific settlements will be available in the next update
                </p>
                <SettleDebtsDialog 
                  groupId={group.id} 
                  onSettled={handleDataUpdate} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GroupDetail;