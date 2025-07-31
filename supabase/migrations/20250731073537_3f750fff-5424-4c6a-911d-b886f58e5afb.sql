-- Create friends table
CREATE TABLE public.friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- RLS policies for friends
CREATE POLICY "Users can view their friend requests and friends"
ON public.friends FOR SELECT
USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can send friend requests"
ON public.friends FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update friend requests they received"
ON public.friends FOR UPDATE
USING (friend_id = auth.uid());

CREATE POLICY "Users can delete their own friend requests"
ON public.friends FOR DELETE
USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Create group invites table for invite links
CREATE TABLE public.group_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  created_by UUID NOT NULL,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'base64'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for group invites
CREATE POLICY "Group admins can manage invites"
ON public.group_invites FOR ALL
USING (
  group_id IN (
    SELECT group_id FROM group_memberships 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view valid invites for joining"
ON public.group_invites FOR SELECT
USING (expires_at > now() AND (max_uses IS NULL OR current_uses < max_uses));