import { ImageResponse } from 'next/og';
import { DonationCampaignService } from '@/modules/donation-campaign';
import QRCode from 'qrcode';
import { NumberUtil } from '@/utils';
import { APP_CONFIG } from '@/configs/app.config';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

export const alt = 'Campaign Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const fontDataRegular = readFileSync(
    join(process.cwd(), '/assets/font/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff')
  );
  const fontDataBold = readFileSync(
    join(process.cwd(), '/assets/font/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff')
  );

  const { slug } = await params;
  const isNumericId = /^\d+$/.test(slug);

  let campaign = null;
  try {
    campaign = isNumericId
      ? await DonationCampaignService.getCampaignById(slug)
      : await DonationCampaignService.getCampaignBySlug(slug);
  } catch (e) {
    console.error('OG Error:', e);
  }

  const {
    name = `Campaign ${slug}`,
    goal = 1000,
    total_amount: current = 0,
    end_date: endDate = '',
    donation_wallet: walletAddress = '',
  } = campaign || {};

  const hasWallet = !!walletAddress;
  const percentage = (NumberUtil.scaleDown(current) / (goal || 1)) * 100;
  const progress = Math.min(100, Math.max(2, Math.round(percentage)));

  const formatDate = (date: string) => {
    try {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const PRIMARY = '#6941c6';
  const PRIMARY_LIGHT = '#8b5cf6';
  const DARK = '#0B1533';
  const DARK_LIGHT = '#1e293b';
  const NEON = '#00f5ff';

  let qrCodeData = '';
  if (hasWallet) {
    const qrObject = { type: 'transfer_wallet', wallet_address: walletAddress };
    qrCodeData = await QRCode.toDataURL(JSON.stringify(qrObject), {
      width: 400,
      margin: 1,
      color: { dark: '#ffffff', light: DARK_LIGHT },
    });
  }

  return new ImageResponse(
    <div tw="flex flex-col w-full h-full relative text-white" style={{ backgroundColor: DARK }}>
      {/* Ambient Background Glows */}
      <div
        tw="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-30"
        style={{ background: `radial-gradient(circle, ${PRIMARY} 0%, transparent 70%)` }}
      />
      <div
        tw="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full opacity-10"
        style={{ background: `radial-gradient(circle, ${NEON} 0%, transparent 70%)` }}
      />

      <div tw="flex flex-row w-full h-full p-16 items-center z-10">
        {/* Left Content Section */}
        <div tw="flex flex-col flex-1 h-full justify-between pr-12">
          <div tw="flex flex-col">
            <div tw="flex items-center mb-6">
              <span tw="font-bold tracking-[0.3em] text-sm uppercase" style={{ color: PRIMARY_LIGHT }}>
                Mezon Dong Campaign
              </span>
            </div>

            <h1 tw="text-[68px] font-bold leading-[1.1] m-0 mb-6 tracking-tight">{name}</h1>

            {endDate && (
              <div tw="flex items-center">
                <div tw="h-1.5 w-1.5 rounded-full mr-3" style={{ backgroundColor: NEON }} />
                <span tw="text-gray-400 text-xl font-medium">Campaign ends {formatDate(endDate)}</span>
              </div>
            )}
          </div>

          <div tw="flex flex-col mt-auto">
            <div tw="flex flex-col mb-6">
              <div tw="flex items-baseline">
                <span tw="text-7xl font-bold mr-4" style={{ color: 'white' }}>
                  {NumberUtil.formatWithCommasAndScale(current)}
                </span>
                <span tw="text-2xl text-gray-400 font-medium uppercase tracking-wider">
                  {APP_CONFIG.CHAIN_SYMBOL} RAISED
                </span>
              </div>
            </div>

            <div tw="flex flex-col w-full">
              <div tw="flex justify-between mb-4 items-end">
                <span tw="text-gray-400 text-xl">
                  Target:{' '}
                  <span tw="text-white font-bold">
                    {NumberUtil.formatWithCommas(goal)} {APP_CONFIG.CHAIN_SYMBOL}
                  </span>
                </span>
                <span tw="text-2xl font-bold" style={{ color: PRIMARY_LIGHT }}>
                  {Math.round(percentage)}% Funded
                </span>
              </div>

              {/* Progress Bar */}
              <div tw="flex w-full h-5 rounded-full relative overflow-hidden bg-white/5 border border-white/10">
                <div
                  tw="flex h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(to right, ${PRIMARY}, ${PRIMARY_LIGHT})`,
                    boxShadow: `0 0 20px ${PRIMARY}44`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right QR Section - Made more vibrant */}
        {hasWallet && (
          <div
            tw="flex flex-col w-[380px] h-full relative items-center justify-center"
            style={{ backgroundColor: PRIMARY }}
          >
            <div
              tw="flex flex-col w-full bg-white/5 border border-white/10 rounded-[40px] p-10 items-center justify-center relative"
              style={{ backgroundColor: `${DARK_LIGHT}CC` }}
            >
              <div
                tw="flex p-5 rounded-3xl border shadow-2xl relative"
                style={{ backgroundColor: DARK_LIGHT, borderColor: `${PRIMARY}66` }}
              >
                {/* QR Code Container */}
                <img src={qrCodeData} width="220" height="220" alt="QR Code" style={{ display: 'block' }} />

                {/* Decorative corners */}
                <div
                  tw="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg"
                  style={{ borderColor: PRIMARY_LIGHT }}
                />
                <div
                  tw="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-lg"
                  style={{ borderColor: PRIMARY_LIGHT }}
                />
              </div>

              <div tw="flex flex-col items-center mt-10 text-center">
                <div
                  tw="flex px-4 py-1.5 rounded-full mb-4 border"
                  style={{ backgroundColor: `${PRIMARY}22`, borderColor: `${PRIMARY}44` }}
                >
                  <span tw="text-xs font-bold uppercase tracking-widest" style={{ color: PRIMARY_LIGHT }}>
                    Mezon Network
                  </span>
                </div>
                <span tw="text-2xl font-bold text-white mb-2">Scan to Support</span>
                <span tw="text-gray-400 text-sm">Transfer direct to campaign wallet</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: fontDataRegular,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Inter',
          data: fontDataBold,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}
