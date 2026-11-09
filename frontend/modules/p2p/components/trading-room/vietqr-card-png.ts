import { getImageProps } from 'next/image';
import QRCode from 'qrcode';

import { formatCurrency } from '../../util';
import { VietQrPayment } from '../../vietqr';

// The exported image always uses the light palette so it reads the same wherever it is opened or printed.
const COLORS = {
  background: '#FFFFFF',
  brand: '#6941C6',
  brandSoft: '#F9F5FF',
  text: '#181D27',
  muted: '#717680',
  border: '#E9EAEB',
  noteBackground: '#FEFBE8',
  noteText: '#A15C07',
};

const SCALE = 2;
const WIDTH = 560;
const PADDING = 32;
const LOGO_WIDTH = 112;
const LOGO_HEIGHT = 42; // bank logos on cdn.vietqr.io are 831x311
const QR_SIZE = 360;
const QR_FRAME_PADDING = 16;
const QR_FRAME_SIZE = QR_SIZE + QR_FRAME_PADDING * 2;
const AMOUNT_BLOCK_HEIGHT = 84;
const ROW_HEIGHT = 44;
const FOOTER_HEIGHT = 16;
const GAP = 24;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

// cdn.vietqr.io sends no CORS headers, so load the logo through the same-origin next/image proxy to keep the canvas exportable.
const loadBankLogo = async (logoUrl: string): Promise<HTMLImageElement | null> => {
  try {
    const { props } = getImageProps({
      src: logoUrl,
      alt: '',
      width: LOGO_WIDTH * SCALE,
      height: LOGO_HEIGHT * SCALE,
    });
    return await loadImage(props.src);
  } catch {
    return null;
  }
};

const fitText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
};

const canvasToPng = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png');
  });

/** Draws the VietQR payment card (bank, QR, amount, account and transfer note) as a PNG. */
export const renderVietQrCardPng = async (payment: VietQrPayment): Promise<Blob> => {
  await document.fonts?.ready;
  const fontFamily = getComputedStyle(document.body).fontFamily || 'Inter, sans-serif';

  const [qrImage, logo] = await Promise.all([
    QRCode.toDataURL(payment.payload, {
      errorCorrectionLevel: 'M',
      margin: 0,
      width: QR_SIZE * SCALE,
      color: { dark: '#000000', light: '#FFFFFF' },
    }).then(loadImage),
    loadBankLogo(payment.bank.logo),
  ]);

  const rows: { label: string; value: string; isNote?: boolean }[] = [
    { label: 'Account number', value: payment.accountNumber },
    { label: 'Account name', value: payment.accountName },
  ];
  if (payment.transferNote) {
    rows.push({ label: 'Transfer note', value: payment.transferNote, isNote: true });
  }

  const height =
    PADDING +
    LOGO_HEIGHT +
    GAP +
    QR_FRAME_SIZE +
    GAP +
    (payment.amount ? AMOUNT_BLOCK_HEIGHT + GAP : 0) +
    rows.length * ROW_HEIGHT +
    GAP +
    FOOTER_HEIGHT +
    PADDING;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'middle';

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, height);

  const contentWidth = WIDTH - PADDING * 2;
  let y = PADDING;

  // Bank header: logo + short name + full name
  let textX = PADDING;
  if (logo) {
    ctx.drawImage(logo, PADDING, y, LOGO_WIDTH, LOGO_HEIGHT);
    textX += LOGO_WIDTH + 16;
  }
  const headerTextWidth = WIDTH - PADDING - textX;
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 18px ${fontFamily}`;
  ctx.fillText(fitText(ctx, payment.bank.shortName, headerTextWidth), textX, y + 12);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 13px ${fontFamily}`;
  ctx.fillText(fitText(ctx, payment.bank.name, headerTextWidth), textX, y + 32);
  y += LOGO_HEIGHT + GAP;

  // QR code inside a brand-coloured frame
  const frameX = (WIDTH - QR_FRAME_SIZE) / 2;
  ctx.strokeStyle = COLORS.brand;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(frameX, y, QR_FRAME_SIZE, QR_FRAME_SIZE, 16);
  ctx.stroke();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrImage, frameX + QR_FRAME_PADDING, y + QR_FRAME_PADDING, QR_SIZE, QR_SIZE);
  ctx.imageSmoothingEnabled = true;
  y += QR_FRAME_SIZE + GAP;

  // Amount
  if (payment.amount) {
    ctx.fillStyle = COLORS.brandSoft;
    ctx.beginPath();
    ctx.roundRect(PADDING, y, contentWidth, AMOUNT_BLOCK_HEIGHT, 12);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.muted;
    ctx.font = `600 12px ${fontFamily}`;
    ctx.fillText('AMOUNT', WIDTH / 2, y + 26);
    ctx.fillStyle = COLORS.brand;
    ctx.font = `700 28px ${fontFamily}`;
    ctx.fillText(`${formatCurrency(payment.amount)} VND`, WIDTH / 2, y + 56);
    y += AMOUNT_BLOCK_HEIGHT + GAP;
  }

  // Account details
  const labelWidth = 140;
  const valueMaxWidth = contentWidth - labelWidth;
  rows.forEach((row, index) => {
    const rowCenter = y + ROW_HEIGHT / 2;

    if (index > 0) {
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(WIDTH - PADDING, y);
      ctx.stroke();
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 13px ${fontFamily}`;
    ctx.fillText(row.label, PADDING, rowCenter);

    ctx.font = `700 15px ${fontFamily}`;
    const value = fitText(ctx, row.value, valueMaxWidth - (row.isNote ? 16 : 0));
    ctx.textAlign = 'right';

    if (row.isNote) {
      const pillWidth = ctx.measureText(value).width + 16;
      ctx.fillStyle = COLORS.noteBackground;
      ctx.beginPath();
      ctx.roundRect(WIDTH - PADDING - pillWidth, rowCenter - 14, pillWidth, 28, 6);
      ctx.fill();
      ctx.fillStyle = COLORS.noteText;
      ctx.fillText(value, WIDTH - PADDING - 8, rowCenter);
    } else {
      ctx.fillStyle = COLORS.text;
      ctx.fillText(value, WIDTH - PADDING, rowCenter);
    }

    y += ROW_HEIGHT;
  });
  y += GAP;

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 12px ${fontFamily}`;
  ctx.fillText('Scan with any banking app · VietQR / Napas 247', WIDTH / 2, y + FOOTER_HEIGHT / 2);

  return canvasToPng(canvas);
};
