-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(user_id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group memberships table
CREATE TABLE public.group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  paid_by UUID REFERENCES public.profiles(user_id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense splits table
CREATE TABLE public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(user_id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(expense_id, user_id)
);

-- Create settlements table
CREATE TABLE public.settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  from_user UUID REFERENCES public.profiles(user_id) NOT NULL,
  to_user UUID REFERENCES public.profiles(user_id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "Users can view groups they belong to" ON public.groups FOR SELECT 
USING (
  id IN (
    SELECT group_id FROM public.group_memberships 
    WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group admins can update groups" ON public.groups FOR UPDATE 
USING (
  id IN (
    SELECT group_id FROM public.group_memberships 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Group admins can delete groups" ON public.groups FOR DELETE 
USING (
  id IN (
    SELECT group_id FROM public.group_memberships 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Group memberships policies
CREATE POLICY "Users can view memberships for their groups" ON public.group_memberships FOR SELECT 
USING (
  group_id IN (
    SELECT group_id FROM public.group_memberships 
    WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Group admins can manage memberships" ON public.group_memberships FOR ALL 
USING (
  group_id IN (
    SELECT group_id FROM public.group_memberships 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Expenses policies
CREATE POLICY "Users can view expenses for their groups" ON public.expenses FOR SELECT 
USING (
  group_id IN (
    SELECT group_id FROM public.group_memberships 
    WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Group members can create expenses" ON public.expenses FOR INSERT 
WITH CHECK (
  group_id IN (
    SELECT group_id FROM public.group_memberships 
    WHERE user_id = auth.uid()
  ) AND auth.uid() = paid_by
);
CREATE POLICY "Expense creators can update their expenses" ON public.expenses FOR UPDATE 
USING (auth.uid() = paid_by);
CREATE POLICY "Expense creators can delete their expenses" ON public.expenses FOR DELETE 
USING (auth.uid() = paid_by);

-- Expense splits policies
CREATE POLICY "Users can view splits for expenses in their groups" ON public.expense_splits FOR SELECT 
USING (
  expense_id IN (
    SELECT id FROM public.expenses 
    WHERE group_id IN (
      SELECT group_id FROM public.group_memberships 
      WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Expense creators can manage splits" ON public.expense_splits FOR ALL 
USING (
  expense_id IN (
    SELECT id FROM public.expenses 
    WHERE paid_by = auth.uid()
  )
);

-- Settlements policies
CREATE POLICY "Users can view settlements for their groups" ON public.settlements FOR SELECT 
USING (
  group_id IN (
    SELECT group_id FROM public.group_memberships 
    WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Users can create settlements" ON public.settlements FOR INSERT 
WITH CHECK (
  group_id IN (
    SELECT group_id FROM public.group_memberships 
    WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Users can update their settlements" ON public.settlements FOR UPDATE 
USING (auth.uid() = from_user OR auth.uid() = to_user);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();