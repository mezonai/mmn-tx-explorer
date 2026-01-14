'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { P2POffer } from '../../types';
import { TriangleAlert } from 'lucide-react';

interface QrCodeCardProps {
    bank_info?: P2POffer['bank_info'];
    transfer_code?: string | null;
    amount?: number; // Amount in VND
}

export const QrCodeCard = ({ bank_info, transfer_code, amount }: QrCodeCardProps) => {
    // Generate VietQR URL
    const qrCodeUrl = useMemo(() => {
        if (!bank_info) return '';

        const { bank, account_number, account_name } = bank_info;

        // Base URL with bank code and account number
        let url = `https://img.vietqr.io/image/${bank}-${account_number}-print.png`;

        // Add query parameters
        const params: string[] = [];

        if (amount) params.push(`amount=${amount}`);
        if (transfer_code) params.push(`addInfo=${encodeURIComponent(transfer_code)}`);
        if (account_name) params.push(`accountName=${encodeURIComponent(account_name)}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return url;
    }, [bank_info, transfer_code, amount]);

    // Download QR code
    const handleDownload = async () => {
        if (!qrCodeUrl) return;

        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `vietqr-${bank_info?.account_number || 'payment'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading QR code:', error);
        }
    };

    if (!bank_info) {
        return null;
    }

    return (
        <Card className="mb-4 rounded-lg border border-border p-2 shadow-lg h-full">
            <div className="flex flex-1 flex-col items-center justify-center space-y-6">
                {qrCodeUrl ? (
                    <>
                        <div className="text-center px-4 animate-pulse">
                            <p className="text-[13px] font-medium text-amber-500 leading-tight">
                                <span className="flex items-center justify-center gap-1 mb-1">
                                    <TriangleAlert className="w-4 h-4" /> Recommendation:
                                </span>
                                To avoid delays, please message the seller to confirm they are online before making the payment.
                            </p>
                        </div>
                        <div className="w-full max-w-[90%] aspect-square flex items-center justify-center">
                            <img
                                src={qrCodeUrl}
                                alt="VietQR Payment Code"
                                className="w-[90%] h-full object-contain rounded-lg bg-white"
                                loading="lazy"
                            />
                        </div>
                        <Button
                            className="bg-primary text-white hover:bg-primary/80"
                            onClick={handleDownload}
                            variant="outline"
                            size="sm"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download QR Code
                        </Button>
                    </>
                ) : (
                    <div className="w-full max-w-[400px] aspect-square flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/50">
                        <p className="text-center text-sm text-muted-foreground">QR code unavailable</p>
                    </div>
                )}
            </div>
        </Card>
    );
};