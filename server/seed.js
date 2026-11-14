require('dotenv').config();
const mongoose = require('mongoose'), bcrypt = require('bcryptjs'), { User, Item, Pizza } = require('./models');
const data = {
  base: [['Classic hand-tossed', 0], ['Thin crust', 0], ['Cheese burst', 40], ['Whole wheat', 20], ['Gluten-free', 50]],
  sauce: [['Tomato basil', 0], ['Spicy arrabbiata', 10], ['Garlic white sauce', 15], ['Pesto', 20], ['Barbecue', 15]],
  cheese: [['Mozzarella', 30], ['Cheddar', 30], ['Parmesan', 40], ['Vegan cheese', 50], ['Four-cheese blend', 60]],
  veggie: [['Onion', 10], ['Capsicum', 10], ['Mushroom', 20], ['Black olives', 15], ['Sweet corn', 10], ['Jalapeño', 10], ['Tomato', 10]],
  meat: [['Chicken sausage', 50], ['Pepperoni', 60], ['Grilled chicken', 55]] };
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([Item.deleteMany(), Pizza.deleteMany()]);
  const all = {};
  for (const [cat, list] of Object.entries(data))
    for (const [name, price] of list) all[name] = (await Item.create({ category: cat, name, price, stock: 100, threshold: 20 }))._id;
  const mk = (name, emoji, description, price, names) => ({ name, emoji, description, price, ingredients: names.map(n => all[n]) });
  await Pizza.insertMany([
    mk('Margherita', '🍅', 'Tomato basil sauce, mozzarella, fresh tomato.', 199, ['Classic hand-tossed', 'Tomato basil', 'Mozzarella', 'Tomato']),
    mk('Farmhouse', '🌽', 'Onion, capsicum, mushroom and sweet corn.', 289, ['Classic hand-tossed', 'Tomato basil', 'Mozzarella', 'Onion', 'Capsicum', 'Mushroom', 'Sweet corn']),
    mk('Pepperoni Feast', '🔥', 'Spicy arrabbiata, cheddar, double pepperoni.', 349, ['Thin crust', 'Spicy arrabbiata', 'Cheddar', 'Pepperoni']),
    mk('Pesto Garden', '🌿', 'Pesto, parmesan, olives and jalapeño.', 319, ['Whole wheat', 'Pesto', 'Parmesan', 'Black olives', 'Jalapeño']),
    mk('BBQ Chicken', '🍗', 'Barbecue sauce, grilled chicken, onion.', 339, ['Cheese burst', 'Barbecue', 'Four-cheese blend', 'Grilled chicken', 'Onion']) ]);
  await User.deleteOne({ email: process.env.ADMIN_EMAIL });
  await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL, password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10), role: 'admin', verified: true });
  console.log('Seeded. Admin:', process.env.ADMIN_EMAIL); process.exit();
})();
