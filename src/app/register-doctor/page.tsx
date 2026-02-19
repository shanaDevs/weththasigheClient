'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Eye,
    EyeOff,
    Stethoscope,
    ArrowRight,
    CheckCircle2,
    Building2,
    Shield,
    GraduationCap,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/lib/api/auth';
import { toast } from 'sonner';

const doctorRegisterSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name is required'),
    userName: z.string().min(3, 'Username must be at least 3 characters'),
    phone: z.string().regex(/^\d{9,11}$/, 'Phone must be 9-11 digits (e.g. 771234567)'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    licenseNumber: z.string().min(3, 'License number is required'),
    hospitalClinic: z.string().optional(),
    specialization: z.string().optional(),
    clinicAddress: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type DoctorRegisterFormData = z.infer<typeof doctorRegisterSchema>;

const doctorBenefits = [
    { icon: Shield, title: 'Verified Status', desc: 'Secure B2B purchasing account' },
    { icon: Building2, title: 'Credit Facility', desc: 'Up to 30 days credit for clinics' },
    { icon: Stethoscope, title: 'Specialized Tools', desc: 'Manage your clinic orders easily' },
];

export default function DoctorRegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<DoctorRegisterFormData>({
        resolver: zodResolver(doctorRegisterSchema),
    });

    const onSubmit = async (data: DoctorRegisterFormData) => {
        setIsSubmitting(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmPassword, ...registerData } = data;
            // We'll need to call the specialized public register doctor API
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/register-doctor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Registration successful! Please check your email for verification.');
                router.push('/login');
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Registration failed. Please check your details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12 lg:py-20">
            <div className="w-full max-w-5xl">
                <div className="mb-8">
                    <Link href="/login" className="text-slate-500 hover:text-emerald-600 flex items-center gap-2 text-sm font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Side Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                <Stethoscope className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                                Doctor <br /> Registration
                            </h1>
                            <p className="text-slate-600">
                                Join our B2B network specialized for healthcare providers in Sri Lanka.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {doctorBenefits.map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                        <item.icon className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                                        <p className="text-xs text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Registration Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
                            <div className="bg-emerald-600 h-2 w-full" />
                            <CardHeader>
                                <CardTitle>Professional Account Details</CardTitle>
                                <CardDescription>All fields marked with * are required for verification.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    {/* Basic Info Group */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Personal Information</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name *</Label>
                                                <Input id="firstName" placeholder="Dr. Nimal" {...register('firstName')} />
                                                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name *</Label>
                                                <Input id="lastName" placeholder="Perera" {...register('lastName')} />
                                                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number *</Label>
                                                <Input id="phone" placeholder="771234567" {...register('phone')} />
                                                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address *</Label>
                                                <Input id="email" type="email" placeholder="nimal@example.com" {...register('email')} />
                                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Info Group */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-medium flex items-center gap-2">
                                            <Shield className="w-3 h-3" /> Professional Credentials
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="licenseNumber">Medical License Number *</Label>
                                                <Input id="licenseNumber" placeholder="MC-12345" {...register('licenseNumber')} />
                                                {errors.licenseNumber && <p className="text-xs text-red-500">{errors.licenseNumber.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="specialization">Specialization</Label>
                                                <Input id="specialization" placeholder="General Physician" {...register('specialization')} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hospitalClinic">Hospital / Clinic Name</Label>
                                            <Input id="hospitalClinic" placeholder="City Medical Center" {...register('hospitalClinic')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="clinicAddress">Clinic Address</Label>
                                            <Input id="clinicAddress" placeholder="No. 45, Highlevel Rd, Colombo 06" {...register('clinicAddress')} />
                                        </div>
                                    </div>

                                    {/* Account Security Group */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Account Security</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="userName">Login Username *</Label>
                                            <Input id="userName" placeholder="dr_nimal" {...register('userName')} />
                                            {errors.userName && <p className="text-xs text-red-500">{errors.userName.message}</p>}
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Password *</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="••••••••"
                                                        {...register('password')}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                                <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} />
                                                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-xl shadow-emerald-600/20"
                                        >
                                            {isSubmitting ? 'Registering...' : 'Register as Doctor'}
                                            {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5" />}
                                        </Button>
                                        <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
                                            By registering, you agree to our Terms of Service. <br />
                                            Your application will be manually reviewed by our medical compliance team.
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
