import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../api.js';

const STATUSES = ['Order received', 'In the kitchen', 'Sent to delivery'];
const CATS = { base: 'Pizza bases', sauce: 'Sauces', cheese: 'Cheese', veggie: 'Veggies', meat: 'Meat' };

function Row({ item, onSave }) {
  const [stock, setStock] = useState(item.stock), [threshold, setThreshold] = useState(item.threshold);
  useEffect(() => { setStock(item.stock); setThreshold(item.threshold); }, [item.stock, item.threshold]);
  const low = item.stock < item.threshold, dirty = stock !== item.stock || threshold !== item.threshold;
  return (
    <tr className={low ? 'low' : ''}>
      <td>{item.name}{low && <span className="tag">Low stock</span>}</td>
      <td><input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} aria-label={`${item.name} stock`} /></td>
      <td><input type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} aria-label={`${item.name} threshold`} /></td>
      <td><button className="btn small" disabled={!dirty} onClick={() => onSave(item._id, { stock, threshold })}>Save</button></td>
    </tr>
  );
}

export default function Admin() {
  const [inv, setInv] = useState([]), [orders, setOrders] = useState([]), [err, setErr] = useState('');
  const load = useCallback(async () => {
    try { const [a, b] = await Promise.all([api.get('/admin/inventory'), api.get('/admin/orders')]); setInv(a.data); setOrders(b.data); }
    catch (e) { setErr(errMsg(e)); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);
  const save = async (id, body) => { await api.patch(`/admin/inventory/${id}`, body); load(); };
  const setStatus = async (id, status) => { await api.patch(`/admin/orders/${id}/status`, { status }); load(); };
  return (
    <>
      <h1 className="hero">Kitchen control</h1>
      {err && <p className="err">{err}</p>}
      <section>
        <h2>Orders</h2>
        {!orders.length ? <p className="empty">No paid orders yet.</p> : (
          <div className="stack">{orders.map(o => (
            <article className="card" key={o._id}>
              <div className="row"><h3>{o.title} <span className="muted">for {o.user?.name}</span></h3>
                <select value={o.status} onChange={e => setStatus(o._id, e.target.value)} aria-label="Order status">
                  {STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              <p className="muted">{o.ingredients.map(i => i.name).join(', ')}</p>
              <p className="muted">{new Date(o.createdAt).toLocaleString()} · ₹{o.amount}</p>
            </article>))}</div>)}
      </section>
      <section>
        <h2>Inventory</h2>
        <div className="grid inv">
          {Object.entries(CATS).map(([c, label]) => (
            <div className="card" key={c}>
              <h3>{label} <span className="muted">({inv.filter(i => i.category === c).reduce((s, i) => s + i.stock, 0)} in stock)</span></h3>
              <table><thead><tr><th>Item</th><th>Stock</th><th>Alert below</th><th /></tr></thead>
                <tbody>{inv.filter(i => i.category === c).map(i => <Row key={i._id} item={i} onSave={save} />)}</tbody></table>
            </div>))}
        </div>
      </section>
    </>
  );
}
