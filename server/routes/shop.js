const r = require('express').Router(), crypto = require('crypto'), Razorpay = require('razorpay');
const { Item, Pizza, Order } = require('../models'), { requireAuth } = require('../auth'), { deduct } = require('../stock');
const rzp = () => new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
r.use(requireAuth);

r.get('/items', async (req, res) => res.json(await Item.find().select('-alertSent')));
r.get('/pizzas', async (req, res) => res.json(await Pizza.find()));

// Step 1: validate stock, price the order, create a Razorpay order
r.post('/checkout', async (req, res) => {
  const { pizzaId, custom } = req.body;
  let title, ids, fixedPrice;
  if (pizzaId) {
    const p = await Pizza.findById(pizzaId); if (!p) return res.status(404).json({ message: 'Pizza not found' });
    title = p.name; ids = p.ingredients; fixedPrice = p.price;
  } else {
    const { base, sauce, cheese, veggies = [] } = custom || {};
    if (!base || !sauce || !cheese) return res.status(400).json({ message: 'Choose a base, a sauce and a cheese' });
    ids = [base, sauce, cheese, ...veggies]; title = 'Custom pizza';
  }
  const items = await Item.find({ _id: { $in: ids } });
  if (items.length !== new Set(ids.map(String)).size) return res.status(400).json({ message: 'Some ingredients are invalid' });
  const out = items.find(i => i.stock < 1);
  if (out) return res.status(409).json({ message: `${out.name} is out of stock` });
  const amount = fixedPrice ?? 149 + items.reduce((s, i) => s + i.price, 0);
  const order = await Order.create({ user: req.user._id, title, ingredients: ids, amount });
  const ro = await rzp().orders.create({ amount: amount * 100, currency: 'INR', receipt: String(order._id) });
  await order.updateOne({ razorpayOrderId: ro.id });
  res.json({ orderId: order._id, razorpayOrderId: ro.id, amount: amount * 100, key: process.env.RAZORPAY_KEY_ID });
});

// Step 2: verify the payment signature, confirm the order, update stock
r.post('/verify-payment', async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order || order.razorpayOrderId !== razorpay_order_id) return res.status(404).json({ message: 'Order not found' });
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (expected !== razorpay_signature) return res.status(400).json({ message: 'Payment could not be verified' });
  if (order.status === 'Awaiting payment') {
    await order.updateOne({ status: 'Order received', paymentId: razorpay_payment_id });
    await deduct(order.ingredients);
  }
  res.json({ message: 'Order placed' });
});

r.get('/orders/mine', async (req, res) =>
  res.json(await Order.find({ user: req.user._id, status: { $ne: 'Awaiting payment' } }).sort('-createdAt')));
module.exports = r;
