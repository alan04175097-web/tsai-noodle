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

export default async function handler(req, res) {
  const db = getFirestore();

  if (req.method === 'GET') {
    const snapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const orders = snapshot.docs.map(doc => doc.data());
    return res.status(200).json({ orders });
  }

  if (req.method === 'PATCH') {
    const { orderId, status } = req.body;
    await db.collection('orders').doc(orderId).update({ status });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}