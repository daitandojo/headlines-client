"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { login } from './actions';
import { cn } from '@/lib/utils';

export default function PremiumLoginPortal() {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const passwordRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        if (passwordRef.current) {
            passwordRef.current.focus();
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setIsError(false); // Reset error state on new submission
        
        const result = await login(password);

        if (result.success) {
            toast.success("Authentication successful. Welcome.");
            router.push('/events');
            router.refresh();
        } else {
            toast.error(result.error || "Authentication failed.");
            setIsError(true);
            setIsLoading(false);
        }
    };
    
    return (
        <div>
            {/* Animated background elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Floating particles */}
            {[...Array(12)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse z-0"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                    }}
                ></div>
            ))}

            <Card 
                className={cn(
                    "w-full max-w-lg relative z-10",
                    "bg-gradient-to-br from-slate-900/40 via-slate-800/40 to-slate-900/40", 
                    "backdrop-blur-xl border border-white/20", 
                    "shadow-2xl shadow-black/50 rounded-3xl",
                    "transform transition-all duration-700 ease-out",
                    "hover:shadow-3xl hover:shadow-cyan-500/10 hover:scale-[1.02] hover:border-white/30",
                    "opacity-0 animate-fade-in-up",
                    isError ? 'animate-shake' : ''
                )}
                onAnimationEnd={() => setIsError(false)}
            >
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
                
                <CardHeader className="items-center text-center pt-12 pb-8 px-8 relative">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 via-purple-400/30 to-blue-400/30 rounded-full blur-lg opacity-75 animate-pulse"></div>
                        <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-white/20 rounded-full backdrop-blur-sm">
                            <Shield className="h-8 w-8 text-white drop-shadow-lg" />
                            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-cyan-300 animate-pulse" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-100 drop-shadow-lg">
                            Secure Access Portal
                        </h1>
                        <p className="text-slate-400 text-sm font-medium tracking-wide">
                            Authentication Required
                        </p>
                    </div>
                </CardHeader>

                <form onSubmit={handleLogin}>
                    <CardContent className="px-8 pb-6 space-y-6">
                        <div className="space-y-3">
                            <Label 
                                htmlFor="password" 
                                className="text-slate-300 text-sm font-semibold tracking-wide flex items-center gap-2"
                            >
                                <KeyRound className="h-4 w-4" />
                                Security Credential
                            </Label>
                            <div className="relative group">
                                <Input
                                    ref={passwordRef}
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    disabled={isLoading}
                                    placeholder="Enter access key..."
                                    className={cn(
                                        "h-14 text-lg px-6 rounded-2xl transition-all duration-300",
                                        "bg-gradient-to-r from-slate-900/60 to-slate-800/60",
                                        "border-2",
                                        isFocused ? "border-cyan-400/60" : "border-white/10",
                                        "backdrop-blur-sm text-white placeholder:text-slate-500",
                                        "focus-visible:ring-4 focus-visible:ring-cyan-400/20 focus-visible:ring-offset-0",
                                        "hover:border-white/20 hover:bg-slate-800/70",
                                        "shadow-inner shadow-black/20"
                                    )}
                                />
                                {isFocused && (
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 blur-xl -z-10 animate-pulse"></div>
                                )}
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="px-8 pb-12">
                        <Button 
                            type="submit"
                            disabled={isLoading || !password.trim()}
                            className={cn(
                                "w-full h-14 text-base font-bold rounded-2xl relative overflow-hidden",
                                "transition-all duration-300 ease-out transform",
                                (isLoading || !password.trim()) 
                                    ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/50 active:scale-[0.98]'
                            )}
                        >
                            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            
                            <span className="relative flex items-center justify-center gap-3">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="h-5 w-5" />
                                        Authorize Access
                                    </>
                                )}
                            </span>
                        </Button>
                    </CardFooter>
                </form>

                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full opacity-60"></div>
            </Card>
        </div>
    );
}