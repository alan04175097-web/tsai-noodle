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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { items, pickupTime, note, total, userName } = req.body;

  const now = new Date();
  const orderId = 'TS' + now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  // 存入 Firebase
  const db = getFirestore();
  await db.collection('orders').doc(orderId).set({
    orderId,
    userName,
    items,
    pickupTime,
    note: note || '無',
    total,
    status: '待處理',
    createdAt: now.toISOString(),
  });

  const itemList = items.map(i =>
    `　• ${i.name}${i.sizeName ? '（' + i.sizeName + '）' : ''}　$${i.price}`
  ).join('\n');

  const message = [
    '═══════════════',
    '🍜 蔡家涼麵 新訂單',
    '═══════════════',
    `🔖 訂單編號：${orderId}`,
    `👤 客人：${userName}`,
    '───────────────',
    '🛒 訂購內容：',
    itemList,
    '───────────────',
    `⏰ 取餐時間：${pickupTime}`,
    `📝 備註：${note || '無'}`,
    '───────────────',
    `💰 總金額：$${total}`,
    '═══════════════'
  ].join('\n');

  const token = process.env.LINE_CHANNEL_TOKEN;

  const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ type: 'text', text: message }]
    })
  });

  if (response.ok) {
    res.status(200).json({ success: true, orderId });
  } else {
    const err = await response.json();
    res.status(500).json({ success: false, error: err });
  }
}