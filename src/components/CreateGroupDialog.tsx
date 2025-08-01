import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

interface CreateGroupDialogProps {
  onGroupCreated?: () => void;
}

export const CreateGroupDialog = ({ onGroupCreated }: CreateGroupDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a group",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating group with data:', { name: name.trim(), description: description.trim() });
      console.log('Current user:', user);
      
      // Create group directly in database
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || '',
          created_by: user.id
        })
        .select()
        .single();

      console.log('Group creation response:', { group, groupError });

      if (groupError) {
        console.error('Database error:', groupError);
        throw new Error(groupError.message || 'Failed to create group');
      }

      if (!group) {
        throw new Error('No group data returned');
      }

      // Add creator as member (no admin role needed)
      const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member' // Changed from 'admin' to 'member'
        });

      if (membershipError) {
        console.error('Membership error:', membershipError);
        // Clean up the group if membership creation fails
        await supabase.from('groups').delete().eq('id', group.id);
        throw new Error('Failed to add you as group member');
      }

      console.log('Group and membership created successfully:', group);

      toast({
        title: "Success",
        description: "Group created successfully",
      });

      setName("");
      setDescription("");
      setIsOpen(false);
      onGroupCreated?.();
    } catch (error) {
      console.error('Error creating group:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create group";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};