import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses } from "@/hooks/useExpenses";
import { useBalance } from "@/hooks/useBalance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { SettleDebtsDialog } from "@/components/SettleDebtsDialog";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { FriendsDialog } from "@/components/FriendsDialog";
import { Users, TrendingUp, Activity, ChevronRight, Calendar, DollarSign } from "lucide-react";
const Index = () => {
  const {
    user,
    loading,
    signOut
  } = useAuth();
  const {
    groups,
    loading: groupsLoading,
    refetch: refetchGroups
  } = useGroups();
  const {
    expenses,
    loading: expensesLoading,
    refetch: refetchExpenses
  } = useExpenses();
  const {
    balance,
    loading: balanceLoading,
    refetch: refetchBalance
  } = useBalance();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);
  const handleDataUpdate = () => {
    refetchGroups();
    refetchExpenses();
    refetchBalance();
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl font-medium text-foreground">Loading your dashboard...</p>
        </div>
      </div>;
  }
  if (!user) {
    return null;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SplitWise Pro
            </h1>
            <p className="text-muted-foreground">
              Welcome back, <span className="font-medium text-foreground">{user.email}</span>
            </p>
          </div>
          <Button onClick={signOut} variant="outline" className="tech-border">
            Sign Out
          </Button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="tech-border shadow-card hover:shadow-primary transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Groups</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {groupsLoading ? "..." : groups.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Active expense groups
              </p>
              {!groupsLoading && groups.length > 0 && <div className="mt-3 space-y-1">
                  {groups.slice(0, 2).map(group => <div key={group.id} className="flex items-center justify-between text-xs">
                      <span className="truncate">{group.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {group.member_count}
                      </Badge>
                    </div>)}
                  {groups.length > 2 && <p className="text-xs text-muted-foreground">
                      +{groups.length - 2} more groups
                    </p>}
                </div>}
            </CardContent>
          </Card>

          

          
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <CreateGroupDialog onGroupCreated={handleDataUpdate} />
            <AddExpenseDialog onExpenseAdded={handleDataUpdate} />
            <SettleDebtsDialog />
            <FriendsDialog />
            <Button onClick={() => navigate("/dashboard")} variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="tech-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Recent Groups
              </CardTitle>
              <CardDescription>
                Your most active expense groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupsLoading ? <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
                </div> : groups.length > 0 ? <div className="space-y-3">
                  {groups.slice(0, 3).map(group => <div key={group.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/group/${group.id}`)}>
                      <div className="flex-1">
                        <h3 className="font-medium truncate">{group.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {group.description || "No description"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline">
                          {group.member_count} members
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>)}
                </div> : <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No groups yet</p>
                  <p className="text-sm text-muted-foreground">Create your first group to get started</p>
                </div>}
            </CardContent>
          </Card>

          <Card className="tech-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Expenses
              </CardTitle>
              <CardDescription>
                Latest transactions across all groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expensesLoading ? <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
                </div> : expenses.length > 0 ? <div className="space-y-3">
                  {expenses.slice(0, 3).map(expense => <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-medium truncate">{expense.description}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{expense.groups?.name}</span>
                          <span>•</span>
                          <span>by {expense.profiles?.username}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-primary">
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(expense.date)}
                        </p>
                      </div>
                    </div>)}
                </div> : <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No expenses yet</p>
                  <p className="text-sm text-muted-foreground">Add your first expense to start tracking</p>
                </div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Index;