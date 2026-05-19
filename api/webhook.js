import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    .replace(/\\n/g, '\n')
    .replace(/^"|"$/g, '');

  initializeApp({
    credential: credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const db = getFirestore();
    const orderId = 'TS' + Date.now();

    await db.collection('orders').doc(orderId).set({
      orderId,
      items: [],
      pickupTime: session.metadata?.pickupTime || '',
      note: session.metadata?.note || '',
      userName: session.metadata?.userName || '',
      phone: session.metadata?.phone || '',
      total: session.amount_total / 100,
      status: '待處理',
      paymentMethod: '線上付款',
      createdAt: new Date().toISOString(),
    });
  }

  res.status(200).json({ received: true });
}