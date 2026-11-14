const { Schema, model, Types } = require('mongoose');
exports.User = model('User', new Schema({
  name: String, email: { type: String, unique: true, lowercase: true }, password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  verified: { type: Boolean, default: false }, verifyToken: String,
  resetToken: String, resetExpires: Date }, { timestamps: true }));
exports.Item = model('Item', new Schema({
  category: { type: String, enum: ['base', 'sauce', 'cheese', 'veggie', 'meat'] },
  name: String, price: { type: Number, default: 0 }, stock: { type: Number, default: 100 },
  threshold: { type: Number, default: 20 }, alertSent: { type: Boolean, default: false } }));
exports.Pizza = model('Pizza', new Schema({
  name: String, description: String, price: Number, emoji: String,
  ingredients: [{ type: Types.ObjectId, ref: 'Item' }] }));
exports.Order = model('Order', new Schema({
  user: { type: Types.ObjectId, ref: 'User' }, title: String, ingredients: [{ type: Types.ObjectId, ref: 'Item' }],
  amount: Number, razorpayOrderId: String, paymentId: String,
  status: { type: String, enum: ['Awaiting payment', 'Order received', 'In the kitchen', 'Sent to delivery'], default: 'Awaiting payment' } },
  { timestamps: true }));
