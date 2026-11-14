require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), cors = require('cors'), cron = require('node-cron');
const { checkLowStock } = require('./stock');
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/shop'));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Something went wrong' }); });
mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(process.env.PORT || 5000, () => console.log('API running'));
  cron.schedule('0 * * * *', checkLowStock); // hourly safety-net check
});
