export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { items, pickupTime, note, total, userName } = req.body;

  const itemList = items.map(i => 
    `・${i.name}${i.sizeName ? '（' + i.sizeName + '）' : ''} $${i.price}`
  ).join('\n');

  const message = `🔔 新訂單通知！\n\n👤 客人：${userName}\n\n🛒 訂購內容：\n${itemList}\n\n⏰ 取餐時間：${pickupTime}\n📝 備註：${note || '無'}\n\n💰 總金額：$${total}`;

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
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
}