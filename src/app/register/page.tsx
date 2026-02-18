'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Stethoscope, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().optional(),
  userName: z.string().min(3, 'Username must be at least 3 characters').max(20),
  phone: z.string().regex(/^\d{9,11}$/, 'Phone must be 9-11 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const benefits = [
  'Access to 50,000+ genuine medicines',
  'Exclusive bulk pricing discounts',
  'Credit facility for verified doctors',
  'Priority customer support',
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      toast.success('Registration successful! Welcome to MediPharm B2B');
      router.push('/');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 flex items-center justify-center p-4 py-12">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-200/40 to-cyan-200/40 blur-3xl" />
      </div>

      <div className="w-full max-w-4xl relative">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block"
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Join MediPharm B2B
                </h2>
                <p className="text-slate-600">
                  The trusted platform for healthcare professionals to source quality medicines at wholesale prices.
                </p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-slate-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <div className="p-6 bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                    DR
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Dr. Nimal Perera</p>
                    <p className="text-sm text-slate-500">General Physician, Colombo</p>
                  </div>
                </div>
                <p className="text-slate-600 italic">
                  &quot;MediPharm B2B has transformed how I procure medicines for my clinic. The pricing is excellent and delivery is always on time.&quot;
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-2xl shadow-slate-200/50">
              <CardHeader className="text-center pb-2">
                <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                </Link>
                <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
                <CardDescription>Get started with MediPharm B2B today</CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        {...register('firstName')}
                        className="h-11"
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-500">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        {...register('lastName')}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="771234567"
                      {...register('phone')}
                      className="h-11"
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userName">Username *</Label>
                    <Input
                      id="userName"
                      placeholder="johndoe123"
                      {...register('userName')}
                      className="h-11"
                    />
                    {errors.userName && (
                      <p className="text-xs text-red-500">{errors.userName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        {...register('password')}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      {...register('confirmPassword')}
                      className="h-11"
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-500">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="text-emerald-600 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-emerald-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </form>

                <div className="mt-6 text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
