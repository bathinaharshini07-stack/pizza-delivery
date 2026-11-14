const { Item } = require('./models'), { sendMail } = require('./mail');
// Deduct 1 unit of each ingredient, then email admin about anything below its threshold.
exports.deduct = async (ids) => {
  for (const id of ids) await Item.updateOne({ _id: id }, { $inc: { stock: -1 } });
  await exports.checkLowStock();
};
exports.checkLowStock = async () => {
  const low = await Item.find({ $expr: { $lt: ['$stock', '$threshold'] }, alertSent: false });
  if (!low.length) return;
  const rows = low.map(i => `<li>${i.name} (${i.category}): ${i.stock} left, threshold ${i.threshold}</li>`).join('');
  await sendMail(process.env.ADMIN_EMAIL, 'Low stock alert', `<p>These items need restocking:</p><ul>${rows}</ul>`);
  await Item.updateMany({ _id: { $in: low.map(i => i._id) } }, { alertSent: true });
};
