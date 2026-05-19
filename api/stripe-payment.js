import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { amount, items, pickupTime, note, userName, phone } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'twd',
          product_data: { name: item.name },
          unit_amount: item.price,
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `https://tsai-noodle.vercel.app/cart.html?payment=success&phone=${phone}&time=${pickupTime}`,
      cancel_url: `https://tsai-noodle.vercel.app/cart.html?payment=cancel`,
      metadata: { pickupTime, note, userName, phone }
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}