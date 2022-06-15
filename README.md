# Ecommerce payment API SDK

[![Build Status](https://github.com/Raiffeisen-DGTL/ecom-sdk-node/actions/workflows/ci.yml/badge.svg)](https://github.com/Raiffeisen-DGTL/ecom-sdk-node/actions/workflows/ci.yml)
[![Latest Stable Version](https://img.shields.io/npm/v/@raiffeisen-ecom/payment-sdk)](https://www.npmjs.com/package/@raiffeisen-ecom/payment-sdk)
[![Total Downloads](https://img.shields.io/npm/dt/@raiffeisen-ecom/payment-sdk)](https://www.npmjs.com/package/@raiffeisen-ecom/payment-sdk)

SDK модуль для внедрения эквайринга Райффайзенбанка.

## Установка и подключение

Установка:

```bash
$ npm require @raiffeisen-ecom/payment-sdk
```

Подключение для cjs-модулей:

```ts
const { Client, ClientException } = require('@raiffeisen-ecom/payment-sdk');
```

Подключение для esm-модулей:

```ts
import { Client, ClientException } from '@raiffeisen-ecom/payment-sdk';
```

## Документация

**Raiffeisenbank e-commerce API: https://pay.raif.ru/doc/ecom.html

## Клиент API

Для использования SDK требуется секретный ключ `secretKey` и идентификатор мерчанта `publicId`, подробности [в документации](https://pay.raif.ru/doc/ecom.html#section/API/Avtorizaciya) и на [сайте банка](https://www.raiffeisen.ru/corporate/management/commerce/).

```ts
const secretKey = '***';
const publicId = '***';
const client = new Client(secretKey, publicId);
```

Параметры конструктора и свойства клиента:

* `secretKey` - секретный ключ, обязательный, доступ только на запись;
* `publicId` - идентификатор мерчанта, обязательный, доступ на чтение и запись;
* `host` - хост api, по умолчанию `https://e-commerce.raiffeisen.ru`, доступ на чтение и запись;
* `options` - дополнительные [параметры запроса](https://developer.mozilla.org/en-US/docs/Web/API/fetch#init), доступ только на чтение.

## Примеры

Пользователь совершает следующие действия в процессе платежа:

* Выбирает товары/услуги в корзину магазина и нажимает кнопку “Оплатить”;
* Партнер открывает платежную форму;
* Клиент вводит реквизиты на платежной форме и подтверждает платеж.

### Настройка URL для приема событий

Метод `postCallbackUrl` устанавливает адресс приема событий.
В параметрах нужно указать:

* `callbackUrl` - невый URL.

```ts
const callbackUrl = 'http://test.ru/';

client.postCallbackUrl(callbackUrl);
```

### Платежная форма

Метод `getPayUrl` возвращает ссылку на платежную форму.
В параметрах нужно указать:

* `amount` - сумма заказа;
* `orderId` - идентификатор заказа;
* `query` - дополнительные параметры запроса.

```ts
const amount = 10;
const orderId = 'testOrder';
const query = {
  successUrl: 'http://test.ru/',
};

const link = client.getPayUrl(amount, orderId, query);

console.log(link);
```

Вывод:

```
https://e-commerce.raiffeisen.ru/pay/?publicId=***&amount=10&orderId=testOrder&successUrl=http%3A%2F%2Ftest.ru%2F
```

Метод `postPayUrl` возвращает ссылку платежную форму в виде html-страницы.
В параметрах нужно указать:

* `amount` - сумма заказа;
* `orderId` - идентификатор заказа;
* `query` - дополнительные параметры запроса, а так же параметры чека.

```ts
const amount = 10;
const orderId = 'testOrder';
const query = {
  successUrl: 'http://test.ru/',
  receipt: {
    customer: { ... },
    items: { ... }
  }
};

client.postPayUrl(amount, orderId, query);
```

### Получение информации о статусе транзакции

Метод `getOrderTransaction` возвращает информацию о статусе транзакции.
В параметрах нужно указать:

* `orderId` - идентификатор заказа.

```ts
const orderId = 'testOrder';

const response = await client.getOrderTransaction(orderId);

console.log(response);
```

Вывод:

```json
{
  "code": "SUCCESS",
  "transaction": {
    "id": 120059,
    "orderId": "testOrder",
    "status": {
      "value": "SUCCESS",
      "date": "2019-07-11T17:45:13+03:00"
    },
    "paymentMethod": "acquiring",
    "paymentParams": {
      "rrn": 935014591810,
      "authCode": 25984
    },
    "amount": 12500.5,
    "comment": "Покупка шоколадного торта",
    "extra": {
      "additionalInfo": "Sweet Cake"
    }
  }
}
```

### Оформление возврата по платежу

Метод `postOrderRefund` создает возврат по заказу.
В параметрах нужно указать:

* `orderId` - идентификатор заказа;
* `refundId` - идентификатор заказа;
* `amount` - сумма возврата.

```ts
const orderId = 'testOrder';
const refundId = 'testRefund';
const amount = 150;

const response = await client.postOrderRefund(orderId, refundId, amount);

console.log(response);
```

Вывод:

```json
{
  "code": "SUCCESS",
  "amount": 150,
  "refundStatus": "IN_PROGRESS"
}
```

### Статус возврата

Метод `getOrderRefund` возвращает статус возврата.
В параметрах нужно указать:

* `orderId` - идентификатор заказа;
* `refundId` - идентификатор заказа.

```ts
const orderId = 'testOrder';
const refundId = 'testRefund';

const response = await client.getOrderRefund(orderId, refundId);

console.log(response);
```

Вывод:

```json
{
  "code": "SUCCESS",
  "amount": 150,
  "refundStatus": "COMPLETED"
}
```

### Получение информации о заказе

Метод `getOrder` возвращает данные о заказе.
В параметрах нужно указать:

* `orderId` - идентификатор заказа.

```ts
const orderId = 'testOrder';

const response = await client.getOrder(orderId);

console.log(response);
```

Вывод:

```json
{
  "amount": 12500.5,
  "comment": "Покупка шоколадного торт",
  "extra": {
    "additionalInfo": "sweet cake"
  },
  "status": {
    "value": "NEW",
    "date": "2019-08-24T14:15:22+03:00"
  },
  "expirationDate": "2019-08-24T14:15:22+03:00"
}
```

### Отмена выставленного заказа

Метод `deleteOrder` удаляет заказ, если он не был оплачен.
В параметрах нужно указать:

* `orderId` - идентификатор заказа.

```ts
const orderId = 'testOrder';

client.deleteOrder(orderId);
```

### Получение списка чеков

Метод `getOrderReceipts` возвращает список чеков.
В параметрах нужно указать:

* `orderId` - идентификатор заказа.
* `receiptType` - необязательное, тип чека:
    * sell – чек прихода;
    * refund – чек возврата.

```ts
const orderId = 'testOrder';

const response = await client.getOrderReceipts(orderId);

console.log(response);
```

Вывод:

```json
[
  {
    "receiptNumber": "3000827351831",
    "receiptType": "REFUND",
    "status": "DONE",
    "orderNumber": "testOrder",
    "total": 1200,
    "customer": {
      "email": "customer@test.ru",
      "name": "Иванов Иван Иванович"
    },
    "items": [
      {
        "name": "Шоколадный торт",
        "price": 1200,
        "quantity": 1,
        "amount": 1200,
        "paymentObject": "COMMODITY",
        "paymentMode": "FULL_PREPAYMENT",
        "measurementUnit": "шт",
        "nomenclatureCode": "00 00 00 01 00 21 FA 41 00 23 05 41 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 12 00 AB 00",
        "vatType": "VAT20",
        "agentType": "ANOTHER",
        "supplierInfo": {
          "phone": "+79991234567",
          "name": "ООО «Ромашка»",
          "inn": "1234567890"
        }
      }
    ]
  }
]
```

### Получение чека возврата

Метод `getOrderRefundReceipt` возвращает чек возврата.
В параметрах нужно указать:

* `orderId` - идентификатор заказа;
* `refundId` - идентификатор возврата.

```ts
const orderId = 'testOrder';
const refundId = 'testRefund';

const response = await client.getOrderRefundReceipt(orderId, refundId);

console.log(response);
```

Вывод:

```json
{
  "receiptNumber": "3000827351831",
  "receiptType": "REFUND",
  "status": "DONE",
  "orderNumber": "testOrder",
  "total": 1200,
  "customer": {
    "email": "customer@test.ru",
    "name": "Иванов Иван Иванович"
  },
  "items": [
    {
      "name": "Шоколадный торт",
      "price": 1200,
      "quantity": 1,
      "amount": 1200,
      "paymentObject": "COMMODITY",
      "paymentMode": "FULL_PREPAYMENT",
      "measurementUnit": "шт",
      "nomenclatureCode": "00 00 00 01 00 21 FA 41 00 23 05 41 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 12 00 AB 00",
      "vatType": "VAT20",
      "agentType": "ANOTHER",
      "supplierInfo": {
        "phone": "+79991234567",
        "name": "ООО «Ромашка»",
        "inn": "1234567890"
      }
    }
  ]
}
```

### Уведомление о платеже

Метод `checkEventSignature` проверяет подпись уведомления о платеже.
В параметрах нужно указать:

* `signature` - содержимое заголовка `x-api-signature-sha256`;
* `eventBody` - разобранный JSON из тела запроса.

```ts
const signature = '***';
const eventBody = {
  event: 'payment',
  transaction: {
    id: 120059,
    orderId: 'testOrder',
    status: {
      value: 'SUCCESS',
      date: '2019-07-11T17:45:13+03:00'
    },
    paymentMethod: 'acquiring',
    paymentParams: {
      rrn: 935014591810,
      authCode: 25984
    },
    amount: 12500.5,
    comment: 'Покупка шоколадного торта',
    extra: {
      additionalInfo: 'Sweet Cake'
    }
  }
};

client.checkEventSignature(signature, eventBody); // true or false
```

## Требования

* **node v10** или выше

## Лицензия

[MIT](LICENSE)

