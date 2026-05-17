export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { items, pickupTime, note, total, userName } = req.body;

  // 產生訂單編號
  const now = new Date();
  const orderId = 'TS' + now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

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