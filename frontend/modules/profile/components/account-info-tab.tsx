'use client';

import { useUser } from '@/providers';
import { User, Mail, Calendar, Edit, BadgeCheck, Tag, CheckCircle, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const AccountInfoTab = () => {
    const { user } = useUser();

    if (!user) return null;

    return (
        <div className="space-y-6">

            <div className="bg-card rounded-xl shadow-lg border border-border p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
                    <div className="relative group">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 border-2 border-brand-primary/50 relative overflow-hidden bg-muted">
                            {user.avatar ? (
                                <img
                                    alt="User Profile"
                                    className="w-full h-full rounded-full object-cover"
                                    src={user.avatar}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-brand-primary/10">
                                    <User className="w-12 h-12 text-brand-primary" />
                                </div>
                            )}
                            <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit className="w-8 h-8 text-white" />
                            </button>
                        </div>
                        <span className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></span>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{user.username}</h2>
                                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {user.email || 'No email provided'}
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ml-2">Verified</span>
                                </p>
                                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Joined Recently
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-brand-primary" />
                    Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">User ID</label>
                        <Input
                            value={user.id}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Username</label>
                        <Input
                            value={user.username}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                        <Input
                            value={user.email || ''}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                            placeholder="your-email@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Wallet Address</label>
                        <Input
                            value={user.walletAddress}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
