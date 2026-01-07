import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { P2POffer } from '../../types';
import { useState, useEffect } from 'react';
import { Facebook, Link as LinkIcon, MessageCircle, Send, Check, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareOfferModalProps {
    offer: P2POffer;
}

export const ShareOfferModal = ({ offer }: ShareOfferModalProps) => {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const path = `/p2p/trading-room/${offer.offer_id}?type=offer`;
    const [shareLink, setShareLink] = useState(path);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setShareLink(`${window.location.origin}${path}`);
        }
    }, [path]);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const socialApps = [
        { name: 'Facebook', icon: Facebook, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/50 dark:hover:bg-blue-900/50', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}` },
        { name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 hover:bg-green-200 dark:bg-green-950/50 dark:hover:bg-green-900/50', href: `https://wa.me/?text=${encodeURIComponent(shareLink)}` },
        { name: 'Telegram', icon: Send, color: 'text-blue-500 dark:text-blue-300', bg: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/50 dark:hover:bg-blue-900/50', href: `https://t.me/share/url?url=${encodeURIComponent(shareLink)}` },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-lg border-input bg-background hover:bg-muted"
                    title="Share Offer"
                >
                    <Share2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="text-xl font-bold text-center">Share Offer</DialogTitle>
                    <p className="text-center text-sm text-muted-foreground mt-1">
                        Share this P2P offer link with your network
                    </p>
                </DialogHeader>

                <div className="px-6 pb-6">
                    {/* Social Icons Grid */}
                    <div className="flex justify-center gap-4 py-4">
                        {socialApps.map((app) => (
                            <a
                                key={app.name}
                                href={app.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-1 ${app.bg} ${app.color} border border-border/50 hover:border-border shadow-sm hover:shadow-md`}
                                title={app.name}

                            >
                                <app.icon className="h-5 w-5" />
                            </a>
                        ))}
                    </div>

                    <div className="relative mt-6">
                        <div className="mb-2 text-sm font-medium text-foreground/80 ml-1">Page Link</div>

                        <div className="relative flex items-center rounded-xl border border-input bg-muted/40 px-3 py-2.5 transition-colors focus-within:ring-1 focus-within:ring-ring hover:bg-muted/60 hover:border-border">
                            <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />

                            <input
                                readOnly
                                value={shareLink}
                                className="flex-1 w-full border-0 bg-transparent p-0 pr-12 text-sm shadow-none outline-none focus-visible:ring-0 text-foreground"
                            />

                            <Button
                                size="icon"
                                onClick={handleCopy}
                                className={`absolute right-2 h-8 w-8 shrink-0 rounded-lg transition-all duration-200 ${copied
                                    ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white'
                                    : 'bg-background hover:bg-accent border border-input hover:border-border'
                                    }`}
                                variant={copied ? 'default' : 'outline'}
                                title={copied ? 'Copied!' : 'Copy link'}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 animate-in fade-in zoom-in duration-200" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};