const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), crypto = require('crypto');
const { User } = require('../models'), { sendMail } = require('../mail');
const link = (p) => `${process.env.CLIENT_URL}${p}`;
const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

r.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: 'Enter a name, email and a password of at least 8 characters' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'This email is already registered' });
  const token = crypto.randomBytes(24).toString('hex');
  await User.create({ name, email, password: await bcrypt.hash(password, 10), verifyToken: hash(token) });
  await sendMail(email, 'Verify your email', `<p>Hi ${name}, <a href="${link('/verify/' + token)}">verify your email</a> to start ordering.</p>`);
  res.json({ message: 'Check your inbox for a verification link' });
});
r.get('/verify/:token', async (req, res) => {
  const u = await User.findOneAndUpdate({ verifyToken: hash(req.params.token) }, { verified: true, verifyToken: null });
  u ? res.json({ message: 'Email verified. You can log in now.' }) : res.status(400).json({ message: 'This link is invalid or already used' });
});
r.post('/login', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(401).json({ message: 'Wrong email or password' });
  if (!u.verified) return res.status(403).json({ message: 'Verify your email before logging in' });
  res.json({ token: jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' }), user: { name: u.name, role: u.role } });
});
r.post('/forgot', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (u) {
    const token = crypto.randomBytes(24).toString('hex');
    await u.updateOne({ resetToken: hash(token), resetExpires: Date.now() + 3600e3 });
    await sendMail(u.email, 'Reset your password', `<p><a href="${link('/reset/' + token)}">Reset your password</a>. The link works for 1 hour.</p>`);
  }
  res.json({ message: 'If that email is registered, a reset link is on its way' });
});
r.post('/reset/:token', async (req, res) => {
  if ((req.body.password || '').length < 8) return res.status(400).json({ message: 'Use at least 8 characters' });
  const u = await User.findOne({ resetToken: hash(req.params.token), resetExpires: { $gt: Date.now() } });
  if (!u) return res.status(400).json({ message: 'This link is invalid or expired' });
  await u.updateOne({ password: await bcrypt.hash(req.body.password, 10), resetToken: null, resetExpires: null });
  res.json({ message: 'Password updated. You can log in now.' });
});
module.exports = r;
