import { Client, ClientException } from '../src';

describe('Client', () => {
    const SECRET_KEY = 'test_secret_key';
    const PUBLIC_ID = 'test_public_id';
    const getClient = () => {
      return new Client(SECRET_KEY, PUBLIC_ID);
    };
    const mockFetch = global.fetch = jest.fn();
    const setResponse = (response: Response) => {
        mockFetch.mockImplementationOnce(() => Promise.resolve(response));
    };

    beforeEach(() => {
        mockFetch.mockClear();
    });

    it('Request Exception', () => {
        setResponse(new Response(null, { status: 500 }));

        expect(() => getClient().getOrder('test_order_ID')).rejects.toBeInstanceOf(ClientException);
    });

    it('Check Event Signature', () => {
        const notificationData = {
            'transaction': {
                'amount': 1,
                'orderId': 'test_transaction_order_id',
                'status': {
                    'value': 'test_transaction_status_value',
                    'date': 'test_transaction_status_date'
                }
            }
        };
        expect(getClient().checkEventSignature('foo', notificationData)).toBeFalsy();
        expect(
            getClient()
                .checkEventSignature(
                    '96c4b6fa97866f01acabcf32116e3e1347e0e5769b8587eeb877b79180eea4cb',
                    notificationData
                )
        ).toBeTruthy();
    });

    it('Get Pay Url', () => {
        expect(getClient().getPayUrl(1,  'test_order_id', { 'test_param_key': 'test_param_value' }))
            .toEqual('https://e-commerce.raiffeisen.ru/pay/?publicId=test_public_id&amount=1&orderId=test_order_id&test_param_key=test_param_value');
    });
});
