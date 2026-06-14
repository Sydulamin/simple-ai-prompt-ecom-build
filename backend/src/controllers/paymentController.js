
import { createRequire } from 'module';
import { OrderModel } from '../models/orderModel.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const require = createRequire(import.meta.url);
const { BkashGateway } = require('bkash-payment-gateway');
const SSLCommerzPayment = require('sslcommerz-lts');

// ── Payment mode flags (can be set independently) ────────────────────────────
// Auto-detect missing/placeholder bKash credentials and force mock mode
const BKASH_CREDS_MISSING =
  !process.env.BKASH_APP_KEY ||
  process.env.BKASH_APP_KEY.startsWith('your_');

const BKASH_MOCK_MODE =
  process.env.PAYMENT_MOCK_MODE === 'true' ||
  process.env.BKASH_MOCK_MODE === 'true' ||
  BKASH_CREDS_MISSING;

const SSL_MOCK_MODE = process.env.PAYMENT_MOCK_MODE === 'true';

if (BKASH_CREDS_MISSING) {
  console.warn(
    '[bKash] No valid credentials found — running in MOCK mode. ' +
    'Set BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD in .env to use real bKash.'
  );
}

// ── bKash Configuration ───────────────────────────────────────────────────────
const BKASH_IS_LIVE = process.env.BKASH_IS_LIVE === 'true';
const BKASH_BASE_URL = BKASH_IS_LIVE
  ? 'https://checkout.pay.bka.sh/v1.2.0-beta'
  : 'https://checkout.sandbox.bka.sh/v1.2.0-beta';

const bkashConfig = {
  baseURL: BKASH_BASE_URL,
  key: process.env.BKASH_APP_KEY     || 'mock',
  username: process.env.BKASH_USERNAME  || 'mock',
  password: process.env.BKASH_PASSWORD  || 'mock',
  secret: process.env.BKASH_APP_SECRET || 'mock',
};

// Only instantiate real gateway when we actually have credentials
const bkashGateway = BKASH_MOCK_MODE ? null : new BkashGateway(bkashConfig);

// ── bKash: Create Payment ─────────────────────────────────────────────────────
export const bkashCreatePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await OrderModel.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (BKASH_MOCK_MODE) {
    await OrderModel.setGatewaySession(orderId, `MOCK_BKASH_${orderId}`);
    const mockUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/portal?type=bkash&orderId=${orderId}&orderNumber=${order.order_number}&amount=${order.total}`;
    res.json({
      success: true,
      bkashURL: mockUrl,
      paymentID: `MOCK_BKASH_${orderId}`,
      message: 'bKash running in mock mode — set real credentials in .env to go live',
    });
    return;
  }

  const paymentRequest = {
    amount: order.total,
    orderID: order.order_number,
    intent: 'sale',
  };

  const result = await bkashGateway.createPayment(paymentRequest);

  if (!result.bkashURL || !result.paymentID) {
    res.status(500);
    throw new Error('bKash payment creation failed');
  }

  await OrderModel.setGatewaySession(orderId, result.paymentID);

  res.json({ success: true, bkashURL: result.bkashURL, paymentID: result.paymentID });
});

// ── bKash: Execute Payment (callback server-side verification) ────────────────
export const bkashExecutePayment = asyncHandler(async (req, res) => {
  const { paymentID, status } = req.query;

  if (BKASH_MOCK_MODE) {
    const order = await OrderModel.findByGatewaySession(paymentID);
    if (!order) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/failed`);
    }
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/success?order=${order.order_number}`);
  }

  if (status === 'cancel' || status === 'failure') {
    return res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
  }

  const execResult = await bkashGateway.executePayment(paymentID);

  const order = await OrderModel.findByGatewaySession(paymentID);
  if (!order) {
    return res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
  }

  if (execResult.transactionStatus === 'Completed') {
    await OrderModel.updateStatus(order.id, {
      status:           'processing',
      payment_status:   'paid',
      gateway_trx_id:   execResult.trxID,
      gateway_response: execResult,
    });
    return res.redirect(`${process.env.CLIENT_URL}/payment/success?order=${order.order_number}`);
  }

  res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
});

// ── SSLCommerz Configuration ──────────────────────────────────────────────────
const SSLCOMMERZ_STORE_ID       = process.env.SSLCOMMERZ_STORE_ID;
const SSLCOMMERZ_STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD;
const SSLCOMMERZ_IS_LIVE        = process.env.SSLCOMMERZ_IS_LIVE === 'true';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
// SERVER_URL must be a publicly reachable URL (use ngrok in dev, real domain in prod)
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

// ── SSLCommerz: Init Payment ──────────────────────────────────────────────────
export const sslcommerzInit = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await OrderModel.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (SSL_MOCK_MODE) {
    await OrderModel.setGatewaySession(orderId, `MOCK_SSL_${orderId}`);
    const mockUrl = `${CLIENT_URL}/payment/portal?type=sslcommerz&orderId=${orderId}&orderNumber=${order.order_number}&amount=${order.total}`;
    res.json({ success: true, gatewayURL: mockUrl, message: 'Mock SSLCommerz payment mode enabled' });
    return;
  }

  const data = {
    total_amount:     parseFloat(order.total),
    currency:         'BDT',
    tran_id:          order.order_number,    // unique transaction ID = our order number
    // success_url → SSLCommerz POSTs here after payment; we validate & redirect browser
    success_url:      `${SERVER_URL}/api/payment/sslcommerz/success`,
    fail_url:         `${SERVER_URL}/api/payment/sslcommerz/fail`,
    cancel_url:       `${SERVER_URL}/api/payment/sslcommerz/fail`,
    // ipn_url → server-to-server silent backup notification
    ipn_url:          `${SERVER_URL}/api/payment/sslcommerz/ipn`,
    shipping_method:  'Courier',
    product_name:     `Order ${order.order_number}`,
    product_category: 'General',
    product_profile:  'general',
    cus_name:         order.shipping_name   || 'Customer',
    cus_email:        'customer@shopwave.com',
    cus_add1:         order.shipping_address || 'N/A',
    cus_city:         order.shipping_city    || 'Dhaka',
    cus_postcode:     order.shipping_zip     || '1000',
    cus_country:      'Bangladesh',
    cus_phone:        order.shipping_phone   || '01700000000',
    ship_name:        order.shipping_name    || 'Customer',
    ship_add1:        order.shipping_address || 'N/A',
    ship_city:        order.shipping_city    || 'Dhaka',
    ship_postcode:    order.shipping_zip     || '1000',
    ship_country:     'Bangladesh',
  };

  const sslcz = new SSLCommerzPayment(SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD, SSLCOMMERZ_IS_LIVE);
  const apiResponse = await sslcz.init(data);

  if (apiResponse.status !== 'SUCCESS') {
    res.status(500);
    throw new Error(`SSLCommerz session initialization failed: ${apiResponse.failedreason || 'Unknown error'}`);
  }

  await OrderModel.setGatewaySession(orderId, apiResponse.sessionkey);

  res.json({ success: true, gatewayURL: apiResponse.GatewayPageURL });
});

// ── SSLCommerz: Success (browser POST → validate → redirect user) ─────────────
// SSLCommerz POSTs to this endpoint when customer completes payment on the gateway.
// We validate server-side and then redirect the user's browser to the React success page.
export const sslcommerzSuccess = asyncHandler(async (req, res) => {
  const postData = req.body;

  // Look up the order using tran_id (which we set to order.order_number in init)
  const order = await OrderModel.findByOrderNumber(postData.tran_id);
  if (!order) {
    return res.redirect(`${CLIENT_URL}/payment/failed`);
  }

  // Server-side validation to prevent forged callbacks
  const sslcz = new SSLCommerzPayment(SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD, SSLCOMMERZ_IS_LIVE);
  const validatedData = await sslcz.validate({ val_id: postData.val_id });

  if (
    (validatedData.status !== 'VALID' && validatedData.status !== 'VALIDATED') ||
    parseFloat(validatedData.amount) !== parseFloat(order.total)
  ) {
    return res.redirect(`${CLIENT_URL}/payment/failed`);
  }

  // Idempotent update — skip if IPN already marked it paid
  if (order.payment_status !== 'paid') {
    await OrderModel.updateStatus(order.id, {
      status:           'processing',
      payment_status:   'paid',
      gateway_trx_id:   validatedData.bank_tran_id,
      gateway_response: validatedData,
    });
  }

  // Redirect the customer's browser to the React success page
  return res.redirect(`${CLIENT_URL}/payment/success?order=${order.order_number}`);
});

// ── SSLCommerz: Fail / Cancel (browser POST → redirect to failed page) ────────
export const sslcommerzFail = asyncHandler(async (req, res) => {
  return res.redirect(`${CLIENT_URL}/payment/failed`);
});

// ── SSLCommerz: IPN (server-to-server silent backup notification) ─────────────
export const sslcommerzIPN = asyncHandler(async (req, res) => {
  const ipnData = req.body;

  if (SSL_MOCK_MODE) {
    return res.json({ success: true });
  }

  const sslcz = new SSLCommerzPayment(SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD, SSLCOMMERZ_IS_LIVE);
  const validatedData = await sslcz.validate({ val_id: ipnData.val_id });

  if (validatedData.status !== 'VALID' && validatedData.status !== 'VALIDATED') {
    return res.status(400).json({ success: false, message: 'IPN validation failed' });
  }

  const order = await OrderModel.findByOrderNumber(ipnData.tran_id || validatedData.tran_id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (parseFloat(validatedData.amount) !== parseFloat(order.total)) {
    return res.status(400).json({ success: false, message: 'Amount mismatch' });
  }

  // Idempotent — success_url handler may have already updated the order
  if (order.payment_status !== 'paid') {
    await OrderModel.updateStatus(order.id, {
      status:           'processing',
      payment_status:   'paid',
      gateway_trx_id:   validatedData.bank_tran_id,
      gateway_response: validatedData,
    });
  }

  res.json({ success: true });
});
