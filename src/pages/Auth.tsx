import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, UserPlus, ArrowLeft, Smartphone, CreditCard } from "lucide-react";
const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            username: username
          }
        }
      });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Check your email for the confirmation link!"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Password reset link sent to your email!"
        });
        setShowForgotPassword(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (showForgotPassword) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-md tech-border shadow-card backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
                Reset Password
              </CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="resetEmail" type="email" placeholder="Enter your email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="pl-10 h-12" required />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-success hover:shadow-glow shadow-primary text-white font-semibold transition-all duration-300" 
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            
            <Button variant="ghost" onClick={() => setShowForgotPassword(false)} className="w-full flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/20 to-info/15 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-accent rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-cyber rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-500"></div>
      </div>
      
      <Card className="w-full max-w-md backdrop-blur-xl bg-white/90 dark:bg-black/90 border-2 border-white/20 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-rainbow rounded-full flex items-center justify-center shadow-glow animate-pulse">
            <CreditCard className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-3">
            <CardTitle className="text-4xl font-bold bg-gradient-tech bg-clip-text text-transparent">
              BILLSPLIT
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Split expenses effortlessly with friends & family
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Sign In Button */}
          <Button 
            onClick={handleGoogleSignIn} 
            variant="outline" 
            className="w-full h-12 border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 transition-all duration-300 shadow-lg hover:shadow-primary/20" 
            disabled={isGoogleLoading}
          >
            <Smartphone className="h-5 w-5 mr-2 text-primary" />
            <span className="bg-gradient-primary bg-clip-text text-transparent font-semibold">
              {isGoogleLoading ? "Connecting..." : "Continue with Google"}
            </span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 h-12" required />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="button" variant="link" onClick={() => setShowForgotPassword(true)} className="text-sm text-primary p-0 h-auto">
                    Forgot password?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 bg-gradient-tech hover:shadow-glow shadow-primary text-white font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" type="text" placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10 h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="username" type="text" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} className="pl-10 h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 h-12" required />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-rainbow hover:shadow-glow shadow-primary text-white font-semibold transition-all duration-300 transform hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;