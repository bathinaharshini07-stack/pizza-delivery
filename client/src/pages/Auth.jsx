import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';

function Form({ title, fields, button, onSubmit, footer }) {
  const [v, setV] = useState({}), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { setMsg({ ok: true, text: await onSubmit(v) }); } catch (err) { setMsg({ ok: false, text: errMsg(err) }); }
    setBusy(false);
  };
  return (
    <form className="card auth" onSubmit={submit}>
      <h1>{title}</h1>
      {fields.map(([k, label, type]) => (
        <label key={k}>{label}
          <input type={type} required minLength={type === 'password' ? 8 : undefined} onChange={e => setV({ ...v, [k]: e.target.value })} />
        </label>))}
      {msg && <p className={msg.ok ? 'ok' : 'err'} role="status">{msg.text}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Please wait…' : button}</button>
      <div className="links">{footer}</div>
    </form>
  );
}

export const Login = () => {
  const nav = useNavigate();
  return <Form title="Welcome back" button="Log in" fields={[['email', 'Email', 'email'], ['password', 'Password', 'password']]}
    onSubmit={async v => {
      const { data } = await api.post('/auth/login', v);
      localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user));
      nav(data.user.role === 'admin' ? '/admin' : '/'); return 'Logged in';
    }}
    footer={<><Link to="/register">Create an account</Link><Link to="/forgot">Forgot password?</Link></>} />;
};
export const Register = () => <Form title="Create your account" button="Sign up"
  fields={[['name', 'Name', 'text'], ['email', 'Email', 'email'], ['password', 'Password (8+ characters)', 'password']]}
  onSubmit={async v => (await api.post('/auth/register', v)).data.message}
  footer={<Link to="/login">I already have an account</Link>} />;
export const Forgot = () => <Form title="Reset your password" button="Send reset link" fields={[['email', 'Email', 'email']]}
  onSubmit={async v => (await api.post('/auth/forgot', v)).data.message} footer={<Link to="/login">Back to log in</Link>} />;
export const Reset = () => {
  const { token } = useParams();
  return <Form title="Choose a new password" button="Update password" fields={[['password', 'New password', 'password']]}
    onSubmit={async v => (await api.post(`/auth/reset/${token}`, v)).data.message} footer={<Link to="/login">Go to log in</Link>} />;
};
export function Verify() {
  const { token } = useParams(), [m, setM] = useState({ text: 'Verifying your email…' });
  useEffect(() => {
    api.get(`/auth/verify/${token}`).then(r => setM({ ok: true, text: r.data.message })).catch(e => setM({ ok: false, text: errMsg(e) }));
  }, [token]);
  return <div className="card auth"><h1>Email verification</h1><p className={m.ok ? 'ok' : m.ok === false ? 'err' : ''}>{m.text}</p><Link className="btn" to="/login">Go to log in</Link></div>;
}
