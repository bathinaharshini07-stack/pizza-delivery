import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../api.js';

const STEPS = ['Menu', 'Build your own', 'My orders'];
const STATUSES = ['Order received', 'In the kitchen', 'Sent to delivery'];
export const rupees = n => `₹${n}`;

export async function pay(payload, onDone, onError) {
  try {
    const { data } = await api.post('/checkout', payload);
    new window.Razorpay({
      key: data.key, amount: data.amount, currency: 'INR', order_id: data.razorpayOrderId, name: 'Crust & Co',
      description: 'Pizza order (test mode)', theme: { color: '#E9B949' },
      handler: async r => {
        try { await api.post('/verify-payment', { orderId: data.orderId, ...r }); onDone(); } catch (e) { onError(errMsg(e)); }
      },
      modal: { ondismiss: () => onError('Payment cancelled. Nothing was charged.') }
    }).open();
  } catch (e) { onError(errMsg(e)); }
}

function Menu({ onOrder }) {
  const [pizzas, setPizzas] = useState([]);
  useEffect(() => { api.get('/pizzas').then(r => setPizzas(r.data)); }, []);
  return (
    <div className="grid">
      {pizzas.map(p => (
        <article className="card pizza" key={p._id}>
          <div className="emoji" aria-hidden>{p.emoji}</div>
          <h3>{p.name}</h3><p>{p.description}</p>
          <div className="row"><strong>{rupees(p.price)}</strong>
            <button className="btn" onClick={() => onOrder({ pizzaId: p._id })}>Order</button></div>
        </article>))}
    </div>
  );
}

function Builder({ onOrder }) {
  const [items, setItems] = useState([]), [pick, setPick] = useState({ base: '', sauce: '', cheese: '', veggies: [] });
  useEffect(() => { api.get('/items').then(r => setItems(r.data)); }, []);
  const by = c => items.filter(i => i.category === c);
  const price = 149 + [pick.base, pick.sauce, pick.cheese, ...pick.veggies].reduce((s, id) => s + (items.find(i => i._id === id)?.price || 0), 0);
  const toggle = id => setPick(p => ({ ...p, veggies: p.veggies.includes(id) ? p.veggies.filter(x => x !== id) : [...p.veggies, id] }));
  const Group = ({ title, cat, single }) => (
    <fieldset className="group"><legend>{title}</legend>
      <div className="chips">
        {by(cat).map(i => {
          const on = single ? pick[cat] === i._id : pick.veggies.includes(i._id), out = i.stock < 1;
          return <button type="button" key={i._id} disabled={out} aria-pressed={on} className={`chip ${on ? 'on' : ''}`}
            onClick={() => single ? setPick({ ...pick, [cat]: i._id }) : toggle(i._id)}>
            {i.name}{i.price ? ` +${rupees(i.price)}` : ''}{out ? ' (sold out)' : ''}</button>;
        })}
      </div>
    </fieldset>);
  return (
    <div className="card builder">
      <Group title="1. Pick a base" cat="base" single />
      <Group title="2. Pick a sauce" cat="sauce" single />
      <Group title="3. Pick a cheese" cat="cheese" single />
      <Group title="4. Add veggies (as many as you like)" cat="veggie" />
      <div className="row total">
        <span>Total <strong>{rupees(price)}</strong></span>
        <button className="btn" disabled={!pick.base || !pick.sauce || !pick.cheese} onClick={() => onOrder({ custom: pick })}>Pay and place order</button>
      </div>
    </div>
  );
}

function Orders({ refreshKey }) {
  const [orders, setOrders] = useState([]);
  const load = useCallback(() => api.get('/orders/mine').then(r => setOrders(r.data)), []);
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load, refreshKey]);
  if (!orders.length) return <p className="empty">No orders yet. Pick a pizza from the menu or build your own.</p>;
  return (
    <div className="stack">
      {orders.map(o => (
        <article className="card" key={o._id}>
          <div className="row"><h3>{o.title}</h3><strong>{rupees(o.amount)}</strong></div>
          <p className="muted">{new Date(o.createdAt).toLocaleString()}</p>
          <ol className="track" aria-label={`Status: ${o.status}`}>
            {STATUSES.map((s, i) => <li key={s} className={i <= STATUSES.indexOf(o.status) ? 'done' : ''}>{s}</li>)}
          </ol>
        </article>))}
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState(0), [note, setNote] = useState(null), [key, setKey] = useState(0);
  const order = payload => { setNote(null); pay(payload, () => { setNote({ ok: true, text: 'Payment successful. Your order is placed.' }); setTab(2); setKey(k => k + 1); }, t => setNote({ ok: false, text: t })); };
  return (
    <>
      <h1 className="hero">Hot, fresh, and built your way.</h1>
      <div className="tabs" role="tablist">{STEPS.map((s, i) => <button key={s} role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}>{s}</button>)}</div>
      {note && <p className={note.ok ? 'ok' : 'err'} role="status">{note.text}</p>}
      {tab === 0 && <Menu onOrder={order} />}
      {tab === 1 && <Builder onOrder={order} />}
      {tab === 2 && <Orders refreshKey={key} />}
    </>
  );
}
