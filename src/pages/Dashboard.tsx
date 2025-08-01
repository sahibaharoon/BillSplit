import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useFriends } from "@/hooks/useFriends";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { FriendsDialog } from "@/components/FriendsDialog";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { SettleDebtsDialog } from "@/components/SettleDebtsDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  UserCheck, 
  Settings, 
  ChevronRight, 
  Calendar,
  Mail,
  User,
  Edit3,
  Save,
  X,
  Plus,
  CalculatorIcon
} from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { groups, loading: groupsLoading, refetch: refetchGroups } = useGroups();
  const { friends, requests, loading: friendsLoading } = useFriends();
  const [activeTab, setActiveTab] = useState("groups");
  const [profile, setProfile] = useState<{
    full_name: string;
    username: string;
    email: string;
    avatar_url: string;
  }>({
    full_name: "",
    username: "",
    email: "",
    avatar_url: ""
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          username: data.username || "",
          email: data.email || "",
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };



  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          username: profile.username
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataUpdate = () => {
    refetchGroups();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-500"></div>
      </div>
      
      <div className="w-full max-w-7xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-2 border-purple-200 dark:border-purple-800 shadow-2xl relative z-10 rounded-2xl p-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your groups, friends, and settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/")} variant="outline" className="border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 shadow-lg hover:shadow-purple-200 dark:hover:shadow-purple-800 text-gray-700 dark:text-gray-200 font-semibold">
              Back to Home
            </Button>
            <Button onClick={signOut} variant="outline" className="border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 shadow-lg hover:shadow-purple-200 dark:hover:shadow-purple-800 text-gray-700 dark:text-gray-200 font-semibold">
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="groups" className="gap-2">
              <Users className="h-4 w-4" />
              Groups ({groups.length})
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Friends ({friends.length})
              {requests.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {requests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Groups</h2>
              <CreateGroupDialog onGroupCreated={handleDataUpdate} />
            </div>

            {groupsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-2 border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <Card key={group.id} className="border-2 border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 hover:shadow-purple-200 dark:hover:shadow-purple-800 transition-all duration-300 cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg truncate">{group.name}</CardTitle>
                          <CardDescription className="truncate">
                            {group.description || "No description"}
                          </CardDescription>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">
                          {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(group.created_at)}
                        </div>
                      </div>
                       <div className="mt-4 flex gap-2">
                         <Button
                           size="sm"
                           onClick={() => navigate(`/group/${group.id}`)}
                           className="flex-1"
                         >
                           View Details
                         </Button>
                         <AddMemberDialog groupId={group.id} onMemberAdded={handleDataUpdate} />
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first group to start splitting expenses with friends
                  </p>
                  <CreateGroupDialog onGroupCreated={handleDataUpdate} />
                </CardContent>
              </Card>
            )}
            
            {/* Quick Actions */}
            {groups.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Add Expense</h4>
                          <p className="text-sm text-muted-foreground">
                            Record a new expense to split with your group
                          </p>
                        </div>
                        <AddExpenseDialog onExpenseAdded={handleDataUpdate} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                          <CalculatorIcon className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Settle Debts</h4>
                          <p className="text-sm text-muted-foreground">
                            Calculate and settle group expenses
                          </p>
                        </div>
                        <SettleDebtsDialog />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Friends</h2>
              <FriendsDialog />
            </div>

            {friendsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-2 border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <Card key={friend.id} className="border-2 border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={friend.profile?.avatar_url} alt={friend.profile?.username} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {friend.profile?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{friend.profile?.username}</h3>
                            <p className="text-sm text-muted-foreground">{friend.profile?.email}</p>
                            <Badge variant="secondary" className="mt-1">
                              {friend.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 md:col-span-2">
                    <CardContent className="text-center py-12">
                      <UserCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No friends yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Add friends to make creating groups easier
                      </p>
                      <FriendsDialog />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Account Settings</h2>

            <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Profile Information</CardTitle>
                  {!isEditingProfile ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditingProfile(true)}
                      className="gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditingProfile(false)}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isLoading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar_url} alt={profile.username} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {profile.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Profile Picture</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                        className="pl-10"
                        disabled={!isEditingProfile}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        value={profile.username}
                        onChange={(e) => setProfile({...profile, username: e.target.value})}
                        className="pl-10"
                        disabled={!isEditingProfile}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={profile.email}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={user?.created_at ? formatDate(user.created_at) : "Unknown"}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;