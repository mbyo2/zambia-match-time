import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Flame } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";

const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, signIn, resetPassword } = useAuth();
  const { toast } = useToast();
  const [resetEmail, setResetEmail] = useState('');

  const [signUpData, setSignUpData] = useState({ email: '', password: '', confirmPassword: '' });
  const [signInData, setSignInData] = useState({ email: '', password: '' });

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const passwordError = validatePassword(signUpData.password);
    if (passwordError) {
      toast({ title: "Invalid Password", description: passwordError, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    try {
      const { error } = await signUp(signUpData.email, signUpData.password, { emailRedirectTo: `${window.location.origin}/` });
      if (error) {
        toast({ title: "Signup Error", description: error.message.includes('rate limit') ? 'Too many attempts. Try again later.' : error.message, variant: "destructive" });
      } else {
        toast({ title: "Account Created", description: "Check your email to verify your account." });
        setSignUpData({ email: '', password: '', confirmPassword: '' });
      }
    } catch { toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!signInData.email || !signInData.password) {
      toast({ title: "Missing Info", description: "Please enter email and password", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    try {
      const { error } = await signIn(signInData.email, signInData.password);
      if (error) {
        const msg = error.message.includes('Invalid login') ? 'Invalid email or password.' : error.message.includes('not confirmed') ? 'Please verify your email first.' : error.message;
        toast({ title: "Sign In Error", description: msg, variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) { toast({ title: "Email required", variant: "destructive" }); return; }
    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);
    setIsLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Reset Link Sent", description: "Check your email for the reset link." }); setResetEmail(''); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/20 via-background to-background p-6">
      {/* Logo area */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <Flame className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">MatchTime</h1>
        <p className="text-muted-foreground mt-1 text-sm">Meet real people near you</p>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-sm">
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" value={signInData.email} onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} required autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input id="signin-password" type={showPassword ? "text" : "password"} value={signInData.password} onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} required autoComplete="current-password" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
              <div className="text-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-sm font-normal text-muted-foreground">Forgot Password?</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>Enter your email to receive a reset link.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} autoComplete="email" />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                      <Button onClick={handlePasswordReset} disabled={isLoading}>{isLoading ? 'Sending...' : 'Send Link'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" value={signUpData.email} onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} required autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input id="signup-password" type={showPassword ? "text" : "password"} value={signUpData.password} onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} required autoComplete="new-password" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">8+ chars, uppercase, lowercase, number, special char</p>
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={signUpData.confirmPassword} onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })} required autoComplete="new-password" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthForm;
