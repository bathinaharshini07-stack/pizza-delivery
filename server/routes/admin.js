const r = require('express').Router();
const { Item, Order } = require('../models'), { requireAuth, requireAdmin } = require('../auth'), { checkLowStock } = require('../stock');
r.use(requireAuth, requireAdmin);

r.get('/inventory', async (req, res) => res.json(await Item.find().sort('category name')));
r.patch('/inventory/:id', async (req, res) => {
  const { stock, threshold } = req.body;
  const it = await Item.findById(req.params.id); if (!it) return res.status(404).json({ message: 'Not found' });
  if (stock != null) it.stock = +stock;
  if (threshold != null) it.threshold = +threshold;
  if (it.stock >= it.threshold) it.alertSent = false; // re-arm the alert after restocking
  await it.save(); await checkLowStock(); res.json(it);
});
r.get('/orders', async (req, res) =>
  res.json(await Order.find({ status: { $ne: 'Awaiting payment' } }).populate('user', 'name email').populate('ingredients', 'name category').sort('-createdAt')));
r.patch('/orders/:id/status', async (req, res) => {
  if (!['Order received', 'In the kitchen', 'Sent to delivery'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  res.json(await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }));
});
module.exports = r;
