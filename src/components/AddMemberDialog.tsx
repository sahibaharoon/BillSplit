import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useFriends } from "@/hooks/useFriends";
import { UserPlus, Copy, Link } from "lucide-react";

interface AddMemberDialogProps {
  groupId: string;
  onMemberAdded?: () => void;
}

export const AddMemberDialog = ({ groupId, onMemberAdded }: AddMemberDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const { toast } = useToast();
  const { friends } = useFriends();

  const addMemberByEmail = async () => {
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      // Find user by email first
      const { data: targetUser, error: findError } = await supabase
        .from('profiles')
        .select('user_id, email, username')
        .eq('email', email.trim())
        .single();

      if (findError || !targetUser) {
        throw new Error('User not found with this email address');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', targetUser.user_id)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this group');
      }

      // Add user to group directly
      const { error: addError } = await supabase
        .from('group_memberships')
        .insert({
          group_id: groupId,
          user_id: targetUser.user_id,
          role: 'member'
        });

      if (addError) {
        console.error('Error adding member:', addError);
        throw new Error('Failed to add member to group');
      }

      toast({
        title: "Success",
        description: `${targetUser.username || targetUser.email} added to group successfully`,
      });

      setEmail("");
      setIsOpen(false);
      onMemberAdded?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addFriend = async (friendId: string) => {
    setIsLoading(true);
    try {
      // Get friend's profile
      const friend = friends.find(f => f.friend_id === friendId);
      if (!friend) {
        throw new Error('Friend not found');
      }

      // Check if friend is already a member
      const { data: existingMember } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', friend.friend_id)
        .single();

      if (existingMember) {
        throw new Error('Friend is already a member of this group');
      }

      // Add friend to group
      const { error: addError } = await supabase
        .from('group_memberships')
        .insert({
          group_id: groupId,
          user_id: friend.friend_id,
          role: 'member'
        });

      if (addError) {
        console.error('Error adding friend:', addError);
        throw new Error('Failed to add friend to group');
      }

      toast({
        title: "Success",
        description: `${friend.profile?.username || friend.profile?.email} added to group`,
      });

      onMemberAdded?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add friend",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createInviteLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://qfpnjctvtmapkenuomre.supabase.co/functions/v1/manage-group?action=create-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcG5qY3R2dG1hcGtlbnVvbXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTgzNzcsImV4cCI6MjA2OTQ3NDM3N30.SkCR8LpXdlAQ-6a0USZ0XCgn60HZ1IbSK4og89-gXQ0'
        },
        body: JSON.stringify({ group_id: groupId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invite');
      }

      const data = await response.json();

      const link = `${window.location.origin}/join/${data.invite.invite_code}`;
      setInviteLink(link);
      
      toast({
        title: "Success",
        description: "Invite link created",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invite link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Copied",
      description: "Invite link copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Members to Group</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">By Email</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="invite">Invite Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter member's email"
              />
            </div>
            <Button 
              onClick={addMemberByEmail} 
              disabled={isLoading || !email.trim()}
              className="w-full"
            >
              {isLoading ? "Adding..." : "Add Member"}
            </Button>
          </TabsContent>
          
          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No friends available. Add friends first to invite them easily.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{friend.profile?.username}</p>
                      <p className="text-sm text-muted-foreground">{friend.profile?.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addFriend(friend.friend_id)}
                      disabled={isLoading}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="invite" className="space-y-4">
            {!inviteLink ? (
              <Button 
                onClick={createInviteLink} 
                disabled={isLoading}
                className="w-full gap-2"
              >
                <Link className="h-4 w-4" />
                {isLoading ? "Creating..." : "Create Invite Link"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Label>Invite Link</Label>
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly />
                  <Button onClick={copyInviteLink} size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with people you want to invite. Link expires in 7 days.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};