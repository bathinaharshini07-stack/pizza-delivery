const jwt = require('jsonwebtoken'), { User } = require('./models');
exports.requireAuth = async (req, res, next) => {
  try {
    const { id } = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = await User.findById(id); if (!req.user) throw 0; next();
  } catch { res.status(401).json({ message: 'Please log in again' }); }
};
exports.requireAdmin = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });
