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

  let qrCodeData = '';
  if (hasWallet) {
    const qrObject = { type: 'transfer_wallet', wallet_address: walletAddress };
    qrCodeData = await QRCode.toDataURL(JSON.stringify(qrObject), {
      width: 400,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
  }

  const BRAND_COLOR = '#7D24C9';
  const BRAND_LIGHT_BG = '#F5E6FF';

  return new ImageResponse(
    <div tw="flex flex-col w-full h-full bg-gray-200 relative">
      <div
        tw="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #CBD5E1 2px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div tw="flex flex-col w-full h-full p-12 justify-center items-center">
        <div tw="flex flex-row w-full h-full bg-white border-[4px] border-black rounded-[32px] overflow-hidden relative shadow-[16px_16px_0px_#000000]">
          <div tw="flex flex-col flex-1 p-10 justify-between border-r-[4px] border-black bg-white">
            <div tw="flex justify-between items-start">
              <div tw="flex items-center px-4 py-2 rounded-full" style={{ backgroundColor: BRAND_COLOR }}>
                <span tw="text-white font-bold tracking-widest text-sm uppercase">Mezon Dong</span>
              </div>
              {endDate && (
                <div tw="flex items-center px-2 py-1 bg-yellow-100 border-2 border-black rounded-lg transform rotate-[-2deg]">
                  <span tw="text-gray-600 font-medium mr-2 text-sm">ENDS:</span>
                  <span tw="text-black font-bold">{formatDate(endDate)}</span>
                </div>
              )}
            </div>

            <div tw="flex flex-col mt-6">
              <h1 tw="text-[56px] font-bold text-black leading-[1.1] m-0 line-clamp-2">{name}</h1>
            </div>

            <div tw="flex flex-col mt-auto pt-6">
              <div tw="flex flex-col mb-1">
                <span tw="text-lg text-gray-500 font-bold uppercase tracking-wider mb-2">Raised so far</span>
                <div tw="flex items-baseline">
                  <span tw="text-[80px] font-medium leading-none mr-3 tracking-tighter">
                    {NumberUtil.formatWithCommasAndScale(current)}
                  </span>
                  <span tw="text-4xl text-black font-bold">{APP_CONFIG.CHAIN_SYMBOL}</span>
                </div>
              </div>

              <div tw="flex flex-col w-full mt-6">
                <div tw="flex justify-between mb-2 items-end">
                  <div tw="flex items-center">
                    <span tw="text-gray-500 font-medium mr-2">Target Goal:</span>
                    <span tw="text-xl font-bold text-black">
                      {NumberUtil.formatWithCommas(goal)} {APP_CONFIG.CHAIN_SYMBOL}
                    </span>
                  </div>
                  <span tw="text-2xl font-black text-black">{Math.round(percentage)}%</span>
                </div>

                <div tw="flex w-full h-8 border-[3px] border-black rounded-full bg-white relative overflow-hidden">
                  <div
                    tw="flex h-full border-r-[3px] border-black"
                    style={{ width: `${progress}%`, backgroundColor: BRAND_COLOR }}
                  />
                </div>
              </div>
            </div>
          </div>

          {hasWallet && (
            <div
              tw="flex flex-col w-[380px] relative shrink-0 items-center justify-center p-8"
              style={{ backgroundColor: BRAND_LIGHT_BG }}
            >
              <div tw="flex flex-col items-center justify-center w-full z-10">
                <div
                  tw="flex p-4 bg-white border-[3px] border-black rounded-xl"
                  style={{ boxShadow: `8px 8px 0px ${BRAND_COLOR}` }}
                >
                  <img src={qrCodeData} width="220" height="220" alt="QR Code" style={{ display: 'block' }} />
                </div>

                <div tw="flex flex-col items-center mt-8 text-center">
                  <span tw="text-3xl font-black text-black uppercase mb-2">Scan Now</span>
                  <span tw="text-gray-600 text-lg leading-tight px-2">To support this campaign directly</span>
                </div>
              </div>
            </div>
          )}
        </div>
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
