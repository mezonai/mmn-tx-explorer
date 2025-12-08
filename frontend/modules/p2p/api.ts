// Mock API layer for P2P trading (offers & orders).
// - Mirrors BE contract that uses wallet addresses for buyer/seller identifiers.
// - Later, when BE is wired, we can switch USE_P2P_MOCK to false and
//   use apiDongClient similarly to donation-campaign module.

import { P2POffer, P2POrder, CreateOfferFormData, BankOption } from './types/p2p.types';
import { APP_CONFIG } from '@/configs/app.config';
import { IP2POfferListParams } from './types';
import { safeJsonParse } from '@/utils';
import { OfferService } from '@/modules/offer/api';
import { apiDongClient } from '@/service';
import { ICreateOfferRequest, OfferSide, IOffer } from '@/modules/offer/types';
// import { apiDongClient } from '@/service';

// Use real backend by default. Set to `true` only for local mock testing.
const USE_P2P_MOCK = false;

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type RawOffer = P2POffer &
  Required<Pick<P2POffer, 'bankInfo'>> & {
    transferCode: string;
  };

const mockRawOffers: RawOffer[] = [
  {
    offerId: 'offer_1',
    sellerWalletAddress: '0xA1B2c3D4e5F67890abcdef1234567890ABCDEF01',
    totalMZD: 20000,
    available: 5000,
    limit: {
      min: 100,
      max: 5000,
    },
    exchangeRate: 0.8,
    bankInfo: {
      bank: 'TCB',
      accountNumber: '19034482991022',
      accountName: 'NGUYEN VAN A',
    },
    transferCode: 'MZD 83729',
  },
  {
    offerId: 'offer_2',
    sellerWalletAddress: '0xFfEEDDCCbbaa99887766554433221100FFEEDDcc',
    totalMZD: 15000,
    available: 1000,
    limit: {
      min: 50,
      max: 2000,
    },
    exchangeRate: 0.75,
    bankInfo: {
      bank: 'VCB',
      accountNumber: '1234567890',
      accountName: 'TRAN VAN B',
    },
    transferCode: 'MZD 12345',
  },
];

const mapRawOfferToP2POffer = (raw: RawOffer): P2POffer => ({
  offerId: raw.offerId,
  sellerWalletAddress: raw.sellerWalletAddress,
  totalMZD: raw.totalMZD,
  available: raw.available,
  limit: {
    ...raw.limit,
  },
  exchangeRate: raw.exchangeRate,
  bankInfo: {
    ...raw.bankInfo,
  },
  transferCode: raw.transferCode,
});

// Helpers
function toNumberSafe(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizeBank(v: unknown): string {
  const allowed = ['MB', 'VCB', 'TCB', 'ACB', 'TPBANK', 'VIETCOMBANK'];
  if (typeof v === 'string' && allowed.includes(v)) return v;
  return 'MB';
}

const mockOrders: P2POrder[] = [];

const generateOrderId = () => `order_${Date.now()}`;

export class P2PService {
  static async getOffers(params?: IP2POfferListParams): Promise<P2POffer[]> {
    if (USE_P2P_MOCK) {
      await delay(400);

      let offers = mockRawOffers.slice();

      if (params?.amount) {
        offers = offers.filter((offer) => {
          const min = Number(offer.limit.min);
          const max = Number(offer.limit.max);
          const available = Number(offer.available);
          return (params!.amount ?? 0) >= min && (params!.amount ?? 0) <= max && (params!.amount ?? 0) <= available;
        });
      }

      return offers.map(mapRawOfferToP2POffer);
    }

    // Map UI params -> backend offer list params
    const beParams: Record<string, unknown> = {};
    // pagination params
    if (params?.page !== undefined) beParams.page = params.page;
    if (params?.limit !== undefined) beParams.limit = params.limit;
    // symbol / currency
    // prefer explicit symbol param; fallback to currency or the configured chain symbol
    beParams.symbol = params?.symbol ?? params?.currency ?? APP_CONFIG.CHAIN_SYMBOL;
    // numeric filters
    if (params?.rate !== undefined) beParams.rate = params.rate;
    if (params?.totalAmountFrom !== undefined) beParams.min_price = String(params.totalAmountFrom);
    if (params?.totalAmountTo !== undefined) beParams.max_price = String(params.totalAmountTo);

    // call shared offer API
    const offers = await OfferService.listOffers(beParams);

    // map IOffer -> P2POffer expected by UI
    return offers.map((o) => {
      const parsedMeta =
        typeof o.metadata === 'string'
          ? safeJsonParse<Record<string, unknown>>(o.metadata)
          : (o.metadata as Record<string, unknown> | undefined);
      return {
        offerId: String(o.offer_id),
        sellerWalletAddress: o.wallet_address ?? '0xUnknown',
        totalMZD: toNumberSafe(o.quantity ?? o.total_quantity ?? 0),
        available: toNumberSafe(o.quantity ?? o.total_quantity ?? 0),
        limit: {
          min: toNumberSafe(o.limit?.min),
          max: toNumberSafe(o.limit?.max),
        },
        exchangeRate: Number(o.price_rate ?? o.rate ?? 1),
        bankInfo:
          parsedMeta && typeof parsedMeta === 'object'
            ? {
                bank: normalizeBank(parsedMeta?.bank) as unknown as BankOption,
                accountNumber: String(parsedMeta?.account_number ?? ''),
                accountName: String(parsedMeta?.account_name ?? ''),
              }
            : undefined,
      } as P2POffer;
    });
  }

  static async getOfferById(offerId: string): Promise<P2POffer> {
    if (USE_P2P_MOCK) {
      await delay(300);
      const raw = mockRawOffers.find((offer) => offer.offerId === offerId);
      if (!raw) {
        throw new Error(`Offer not found: ${offerId}`);
      }
      return mapRawOfferToP2POffer(raw);
    }

    // Real API - fetch via OfferService
    const o = await OfferService.getOfferById(offerId);
    const parsedMeta =
      typeof o.metadata === 'string'
        ? safeJsonParse<Record<string, unknown>>(o.metadata)
        : (o.metadata as Record<string, unknown> | undefined);
    return {
      offerId: String(o.offer_id),
      sellerWalletAddress: o.wallet_address ?? '0xUnknown',
      totalMZD: Number(o.quantity ?? o.total_quantity ?? 0),
      available: Number(o.quantity ?? o.total_quantity ?? 0),
      limit: {
        min: toNumberSafe(o.limit?.min),
        max: toNumberSafe(o.limit?.max),
      },
      exchangeRate: Number(o.price_rate ?? o.rate ?? 1),
      bankInfo:
        parsedMeta && typeof parsedMeta === 'object'
          ? {
              bank: normalizeBank(parsedMeta?.bank) as unknown as BankOption,
              accountNumber: String(parsedMeta?.account_number ?? ''),
              accountName: String(parsedMeta?.account_name ?? ''),
            }
          : undefined,
    } as P2POffer;
  }

  static async createOrder(payload: { offerId: string; amountMZD: number; amountVND?: number }): Promise<P2POrder> {
    if (USE_P2P_MOCK) {
      await delay(500);

      const raw = mockRawOffers.find((offer) => offer.offerId === payload.offerId);
      if (!raw) {
        throw new Error(`Offer not found: ${payload.offerId}`);
      }

      const { amountMZD } = payload;

      if (amountMZD < Number(raw.limit.min) || amountMZD > Number(raw.limit.max) || amountMZD > Number(raw.available)) {
        throw new Error('Invalid amountMZD for this offer');
      }

      const exchangeRate = raw.exchangeRate;
      const amountVND = payload.amountVND ?? amountMZD * Number(exchangeRate);

      const orderId = generateOrderId();
      const mockBuyerWallet = '0xBuyerWallet000000000000000000000000000001';

      const newOrder: P2POrder = {
        orderId,
        offerId: raw.offerId,
        buyerWalletAddress: mockBuyerWallet,
        sellerWalletAddress: raw.sellerWalletAddress,
        amountMZD,
        amountVND,
        exchangeRate,
        status: 'PAYMENT_PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };

      mockOrders.push(newOrder);

      raw.available = Math.max(0, Number(raw.available) - amountMZD);

      return newOrder;
    }

    // Use backend orders endpoint: POST /api/v1/offers/{id}/orders
    // The backend expects CreateOrderRequest where quantity/price/amount are strings.
    const body: { quantity: string; amount?: string } = {
      quantity: String(payload.amountMZD),
    };

    if (payload.amountVND !== undefined) body.amount = String(payload.amountVND);

    // post the order
    const resp = await apiDongClient.post<{ code: number; message: string; data: unknown }>(
      `/api/v1/offers/${payload.offerId}/orders`,
      body
    );

    type BEOrder = {
      order_id?: number | string;
      offer_id?: number | string;
      wallet_address?: string;
      quantity?: number | string;
      amount?: number | string;
      price?: number | string;
      status?: string;
      created_at?: string;
      expires_at?: string;
    };

    const order = resp.data?.data as BEOrder;

    // Try to enrich response with offer info so UI consumers (mock + real) get a consistent shape
    let offer: IOffer | undefined = undefined;
    try {
      offer = await OfferService.getOfferById(payload.offerId);
    } catch {
      // ignore; UI can handle missing offer info
    }

    // Map BE order -> P2POrder
    const orderQuantity = Number(order?.quantity ?? 0);
    const orderAmount = Number(order?.amount ?? 0);
    const orderPrice = Number(order?.price ?? 0);

    // Compute exchangeRate: prefer explicit price, otherwise amount/quantity when possible
    let exchangeRate: number | string = 0;
    if (orderPrice !== 0) exchangeRate = orderPrice;
    else if (orderQuantity !== 0) exchangeRate = orderAmount / orderQuantity;

    // Map status roughly to P2P statuses used in the UI
    const beStatus = String(order?.status ?? '');
    let status: P2POrder['status'] = 'WAIT_CONFIRM';
    if (beStatus === 'PENDING') status = 'PAYMENT_PENDING';
    else if (beStatus === 'CONFIRMED') status = 'COMPLETED';
    else if (beStatus === 'CANCELED') status = 'CANCELLED';

    const mapped: P2POrder = {
      orderId: String(order?.order_id ?? ''),
      offerId: String(order?.offer_id ?? payload.offerId),
      buyerWalletAddress: String(order?.wallet_address ?? ''),
      sellerWalletAddress: String(offer?.wallet_address ?? ''),
      amountMZD: orderQuantity,
      amountVND: orderAmount,
      exchangeRate,
      status: status,
      createdAt: String(order?.created_at ?? new Date().toISOString()),
      expiresAt: String(order?.expires_at ?? ''),
    };

    return mapped;
  }

  // Create offer (from trading UI). When USE_P2P_MOCK is false this will call the
  // real OfferService.createOffer (mapped to the BE CreateOfferRequest shape).
  static async createOffer(payload: CreateOfferFormData): Promise<P2POffer> {
    if (USE_P2P_MOCK) {
      await delay(500);

      // Minimal validation
      if (!payload.tradeType) throw new Error('tradeType required');

      const newId = `offer_${Date.now()}`;
      const seller = '0xMockSeller0000000000000000000000000000000000';

      const raw: RawOffer = {
        offerId: newId,
        sellerWalletAddress: seller,
        totalMZD: Number(payload.amountMZD),
        available: Number(payload.amountMZD),
        limit: {
          min: Number(payload.limit.min),
          max: Number(payload.limit.max),
        },
        exchangeRate: Number(payload.exchangeRate),
        bankInfo: {
          bank: payload.bank,
          accountNumber: payload.accountNumber,
          accountName: '',
        },
        transferCode: `MZD ${Math.floor(Math.random() * 100000)}`,
      };

      mockRawOffers.unshift(raw);
      return mapRawOfferToP2POffer(raw);
    }

    // Real API mapping: convert CreateOfferFormData -> ICreateOfferRequest expected by BE
    const body: ICreateOfferRequest = {
      side: payload.tradeType as OfferSide,
      symbol: 'MZD',
      quantity: String(payload.amountMZD),
      // Use price_rate for the exchange rate (stringified) and mark price_type as FIXED
      price_rate: String(payload.exchangeRate),
      price_type: 'FIXED',
      metadata: {
        bank: payload.bank,
        account_number: payload.accountNumber,
      },
      limit: {
        min: String(payload.limit.min),
        max: String(payload.limit.max),
      },
    } as unknown as ICreateOfferRequest;

    // Call the shared OfferService that talks to the backend
    const created = await OfferService.createOffer(body);

    // Map backend offer -> P2POffer minimal mapping so callers still receive expected shape
    const mapped: P2POffer = {
      offerId: String(created.offer_id),
      sellerWalletAddress: created.wallet_address ?? '0xUnknown',
      totalMZD: Number(created.quantity ?? created.total_quantity ?? 0),
      available: Number(created.quantity ?? created.total_quantity ?? 0),
      limit: {
        min: toNumberSafe(created.limit?.min),
        max: toNumberSafe(created.limit?.max),
      },
      exchangeRate: Number(created.price_rate ?? created.rate ?? 1),
      bankInfo: (() => {
        if (!created.metadata || typeof created.metadata !== 'object') return undefined;
        const md = created.metadata as Record<string, unknown>;
        return {
          bank: normalizeBank(md.bank) as unknown as BankOption,
          accountNumber: typeof md.account_number === 'string' ? md.account_number : '',
          accountName: typeof md.account_name === 'string' ? md.account_name : '',
        };
      })(),
    };

    return mapped;
  }

  static async getOrderById(orderId: string): Promise<P2POrder> {
    if (USE_P2P_MOCK) {
      await delay(300);
      const order = mockOrders.find((item) => item.orderId === orderId);
      if (!order) {
        if (mockOrders.length === 0) {
          throw new Error(`Order not found: ${orderId}`);
        }
        return mockOrders[0];
      }
      return order;
    }

    // const { data } = await apiDongClient.get<{ data: P2POrder }>(P2P_ENDPOINTS.ORDER_BY_ID(orderId));
    // return data.data;

    throw new Error('P2P real API not implemented yet');
  }

  static async getMyOrders(): Promise<P2POrder[]> {
    if (USE_P2P_MOCK) {
      await delay(300);
      return mockOrders.slice();
    }

    // const { data } = await apiDongClient.get<{ data: P2POrder[] }>(P2P_ENDPOINTS.MY_ORDERS);
    // return data.data;

    throw new Error('P2P real API not implemented yet');
  }
}
