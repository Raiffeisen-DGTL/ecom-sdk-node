import { HmacSHA256 } from 'crypto-js';
import ClientException from "./ClientException";

/**
 * The client name fingerprint.
 */
const CLIENT_NAME: string = process.env.CLIENT_NAME ?? 'node_sdk';

/**
 * The client version fingerprint.
 */
const CLIENT_VERSION: string = process.env.CLIENT_NAME ?? require('../package.json').version;

/**
 * Client for ecommerce payment API.
 *
 * @see https://pay.raif.ru/doc/ecom.html API Documentation.
 */
export default class Client {
  /**
   * The default separator.
   */
  protected readonly VALUE_SEPARATOR = '|';

  /**
   * The API datetime format.
   */
  protected readonly DATETIME_FORMAT = 'Y-m-d\\TH:i:sP';

  /**
   * The income check type.
   */
  protected readonly RECEIPT_TYPE_SELL = 'sell';

  /**
   * The refund check type.
   */
  protected readonly RECEIPT_TYPE_REFUND = 'refund';

  /**
   * The API get method.
   */
  protected readonly GET = 'GET';

  /**
   * The API post method.
   */
  protected readonly POST = 'POST';

  /**
   * The API delete method.
   */
  protected readonly DELETE = 'DELETE';

  /**
   * The production API host.
   */
  protected readonly HOST_PROD = 'https://e-commerce.raiffeisen.ru';

  /**
   * The test API host.
   */
  protected readonly HOST_TEST = 'https://test.ecom.raiffeisen.ru';

  /**
   * The default URL to payment form.
   */
  protected readonly PAYMENT_FORM_URI = '/pay';

  /**
   * The default base URL to payment API.
   */
  protected readonly PAYMENT_API_URI = '/api/payment/v1';

  /**
   * The default base URL to payments API.
   */
  protected readonly PAYMENTS_API_URI = '/api/payments/v1';

  /**
   * The default base URL to fiscal API.
   */
  protected readonly FISCAL_API_URI = '/api/fiscal/v1';

  /**
   * The default base URL to settings API.
   */
  protected readonly SETTINGS_API_URI = '/api/settings/v1';

  /**
   * The secret key.
   */
  private _secretKey: string;

  /**
   * The public identifier.
   */
  private _publicId: string;

  /**
   * The API host.
   */
  private _host: string;

  /**
   * The request options.
   */
  private _options: RequestInit;

  /**
   * Client constructor.
   */
  constructor(
      secretKey: string,
      publicId: string,
      host: string|undefined = undefined,
      options: RequestInit|undefined = undefined
  ) {
    this._secretKey = secretKey;
    this._publicId = publicId;
    this._host = host ?? this.HOST_PROD;
    this._options = options ?? {};
    this._options.headers = {
      'user-agent': `${CLIENT_NAME}-${CLIENT_VERSION}`,
      ...(this._options.headers ?? {})
    };
  }

  set secretKey(secretKey: string) {
    this._secretKey = secretKey;
  }

  set publicId(publicId: string) {
    this._publicId = publicId;
  }

  set host(host: string) {
    this._host = host;
  }

  get publicId(): string {
    return this._publicId;
  }

  get host(): string {
    return this._host;
  }

  get options(): RequestInit {
    return this._options;
  }

  /**
   * Checks payment notification event signature.
   *
   * @param signature The signature.
   * @param eventBody The event data body.
   */
  checkEventSignature(signature: string, eventBody: any = undefined): boolean {
    const processedEventData: string[] = [
      eventBody?.transaction?.amount.toString() ?? null,
      this.publicId,
      eventBody?.transaction?.orderId ?? null,
      eventBody?.transaction?.status?.value ?? null,
      eventBody?.transaction?.status?.date ?? null
    ];
    const hash = HmacSHA256(processedEventData.join(this.VALUE_SEPARATOR), this._secretKey).toString();

    return hash === signature;
  }

  /**
   * Set callback URL.
   *
   * @param callbackUrl The callback URL.
   * @param baseUrl The base settings url.
   */
  postCallbackUrl<R>(callbackUrl: string, baseUrl: string = this.SETTINGS_API_URI): Promise<R> {
    const body = { callbackUrl };

    return this.requestBuilder<R, typeof body>(`${baseUrl}/callback`, this.POST, body) as Promise<R>;
  }

  /**
   * Get pay URL witch success URL param.
   *
   * @param amount The order data.
   * @param orderId The order identifier.
   * @param query The additional query params.
   * @param baseUrl The base payment form url.
   */
  getPayUrl(amount: number, orderId: string, query: any = undefined, baseUrl: string = this.PAYMENT_FORM_URI): string {
    const url: URL = new URL(`${this.host}${baseUrl}/`);
    new URLSearchParams({
      publicId: this._publicId,
      amount,
      orderId,
      ...(query ?? {})
    }).forEach((value, name) => {
      url.searchParams.set(name, value);
    });

    return url.toString();
  }

  /**
   * Post payment form witch success URL param.
   *
   * @param amount The order data.
   * @param orderId The order identifier.
   * @param query The additional query params.
   * @param baseUrl The base payment form url.
   */
  postPayUrl<Q, R>(
      amount: number,
      orderId: string,
      query: Q|undefined = undefined,
      baseUrl: string = this.PAYMENT_FORM_URI
  ): Promise<R> {
    const body = {
      publicId: this.publicId,
      amount,
      orderId,
      ...(query ?? {})
    };

    return this.requestBuilder<R, typeof body>(baseUrl, this.POST, body, true) as Promise<R>;
  }

  /**
   * Getting information about the status of a transaction.
   *
   * @param orderId The order identifier.
   * @param baseUrl The base settings url.
   */
  getOrderTransaction<R>(orderId: string, baseUrl: string = this.PAYMENTS_API_URI): Promise<R> {
    return this.requestBuilder(`${baseUrl}/orders/${orderId}/transaction`) as Promise<R>;
  }

  /**
   * Processing a refund.
   *
   * @param orderId The order identifier.
   * @param refundId The refund identifier.
   * @param amount The refund amount.
   * @param baseUrl The base settings url.
   */
  postOrderRefund<R>(
      orderId: string,
      refundId: string,
      amount: number,
      baseUrl: string = this.PAYMENTS_API_URI
  ): Promise<R> {
    const body = { amount };

    return this.requestBuilder<R, typeof body>(
        `${baseUrl}/orders/${orderId}/refunds/${refundId}`,
        this.POST,
        body
    ) as Promise<R>;
  }

  /**
   * Getting refund status.
   *
   * @param orderId The order identifier.
   * @param refundId The refund identifier.
   * @param baseUrl The base settings url.
   */
  getOrderRefund<R>(orderId: string, refundId: string, baseUrl: string = this.PAYMENTS_API_URI): Promise<R> {
    return this.requestBuilder<R>(`${baseUrl}/orders/${orderId}/refunds/${refundId}`) as Promise<R>;
  }

  /**
   * Getting order information.
   *
   * @param orderId The order identifier.
   * @param baseUrl The base settings url.
   */
  getOrder<R>(orderId: string, baseUrl: string = this.PAYMENT_API_URI): Promise<R> {
    return this.requestBuilder<R>(`${baseUrl}/orders/${orderId}`) as Promise<R>;
  }

  /**
   * Delete order.
   *
   * @param orderId The order identifier.
   * @param baseUrl The base settings url.
   */
  deleteOrder<R>(orderId: string, baseUrl: string = this.PAYMENT_API_URI): Promise<R> {
    return this.requestBuilder<R>(`${baseUrl}/orders/${orderId}`, this.DELETE) as Promise<R>;
  }

  /**
   * Getting a list of checks.
   *
   * @param orderId The order identifier.
   * @param receiptType The base settings url.
   * @param baseUrl The base settings url.
   */
  getOrderReceipts<R>(
      orderId: string,
      receiptType: string | undefined = undefined,
      baseUrl: string = this.FISCAL_API_URI
  ): Promise<R> {
    const searchParams = new URLSearchParams();
    if (receiptType) {
      searchParams.set('receiptType', receiptType);
    }

    return this.requestBuilder<R>(`${baseUrl}/orders/${orderId}/receipts?${searchParams}`) as Promise<R>;
  }

  /**
   * Getting a refund check.
   *
   * @param orderId The order identifier.
   * @param refundId The refund identifier.
   * @param baseUrl The base settings url.
   */
  getOrderRefundReceipt<R>(orderId: string, refundId: string, baseUrl: string = this.FISCAL_API_URI): Promise<R> {
    return this.requestBuilder<R>(`${baseUrl}/orders/${orderId}/refunds/${refundId}/receipt`) as Promise<R>;
  }

  /**
   * Build request.
   *
   * @param url  The url.
   * @param method The method.
   * @param body The body.
   * @param raw The response raw return flag.
   */
  protected async requestBuilder<R, B = undefined>(
      url: string,
      method: string = this.GET,
      body: B|undefined = undefined,
      raw: boolean = false
  ): Promise<R | Response | true> {
    const options: RequestInit = {
      method,
      ...this._options
    };
    options.headers = {
      accept: 'application/json',
      authorization: `Bearer ${this._secretKey}`,
      ...(options.headers ?? {})
    };
    if (body && this.GET !== method) {
      options.body = JSON.stringify(body);
      options.headers = {
        'content-type': 'application/json;charset=UTF-8',
        'content-length': Buffer.from(options.body).length.toString(),
        ...options.headers
      };
    }

    const response = await fetch(`${this.host}${url}`, options);

    if (!response.ok) {
      throw new ClientException(response);
    }

    if (raw) {
      return response;
    }

    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (isJson) {
      try {
        const json = await response.json();
        if (!json || json.errorCode) {
          throw new ClientException(response);
        }

        return json as R;
      } catch (_) {
        throw new ClientException(response);
      }
    }

    return true;
  }
}