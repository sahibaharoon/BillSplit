import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useFriends } from "@/hooks/useFriends";
import { Users, Check, X } from "lucide-react";

export const FriendsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { friends, requests, sendFriendRequest, respondToRequest } = useFriends();
  const { toast } = useToast();

  const handleSendRequest = async () => {
    if (!email.trim()) return;

    setIsLoading(true);
    const success = await sendFriendRequest(email.trim());
    
    if (success) {
      toast({
        title: "Success",
        description: "Friend request sent",
      });
      setEmail("");
    } else {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleResponse = async (requestId: string, accept: boolean) => {
    const success = await respondToRequest(requestId, accept);
    
    if (success) {
      toast({
        title: "Success",
        description: accept ? "Friend request accepted" : "Friend request declined",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to respond to request",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Friends {requests.length > 0 && `(${requests.length})`}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Friends</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="friends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
            <TabsTrigger value="requests">
              Requests {requests.length > 0 && `(${requests.length})`}
            </TabsTrigger>
            <TabsTrigger value="add">Add Friend</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No friends yet. Add some friends to make group management easier!
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{friend.profile?.username}</p>
                      <p className="text-sm text-muted-foreground">{friend.profile?.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4">
            {requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No pending friend requests
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{request.profile?.username}</p>
                      <p className="text-sm text-muted-foreground">{request.profile?.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleResponse(request.id, true)}
                        className="gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResponse(request.id, false)}
                        className="gap-1"
                      >
                        <X className="h-3 w-3" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="add" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="friend-email">Friend's Email Address</Label>
              <Input
                id="friend-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter friend's email"
              />
            </div>
            <Button 
              onClick={handleSendRequest} 
              disabled={isLoading || !email.trim()}
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send Friend Request"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};