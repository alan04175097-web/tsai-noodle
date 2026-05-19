export default function handler(req, res) {
  res.json({ 
    hasKey: !!process.env.STRIPE_SECRET_KEY,
    prefix: process.env.STRIPE_SECRET_KEY?.slice(0, 7)
  });
}