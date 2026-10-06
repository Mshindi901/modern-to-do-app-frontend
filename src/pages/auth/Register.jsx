import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, Mail, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getApiErrorMessage } from '../../api/axios.js';
import signupImage from '../../assets/sign-up-page-image.jpg';

export default function Register() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin' : '/app', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-form-panel">
        <Link to="/" className="register-brand" aria-label="Todo home">
          <span className="register-brand-mark"><Check size={17} strokeWidth={3} /></span>
          <span>todo</span>
        </Link>

        <div className="register-form-content">
          <div className="register-heading">
            <p className="register-eyebrow">A CLEARER DAY STARTS HERE</p>
            <h1>Create your account</h1>
            <p>Make space for the work that matters.</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-field">
              <label htmlFor="register-name">Full name</label>
              <div className="register-input-wrap">
                <UserRound size={17} aria-hidden="true" />
                <input id="register-name" name="name" autoComplete="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-email">Email address</label>
              <div className="register-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input id="register-email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-password">Password</label>
              <div className="register-input-wrap">
                <Lock size={17} aria-hidden="true" />
                <input id="register-password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} placeholder="Create a password" required />
              </div>
            </div>

            {error && <div className="register-error" role="alert">{error}</div>}

            <button type="submit" disabled={loading} className="register-submit">
              <span>{loading ? 'Creating account...' : 'Create account'}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>

          <p className="register-login-prompt">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>

        <p className="register-legal">By continuing, you agree to keep your day a little more organized.</p>
      </section>

      <aside className="register-image-panel" aria-label="Planning tasks on a tablet">
        <img src={signupImage} alt="A person writing a to-do list on a tablet" />
        <div className="register-image-shade" />
        <div className="register-image-copy">
          <span className="register-image-kicker">LESS NOISE. MORE FOCUS.</span>
          <p>One thing<br />at a time.</p>
          <span className="register-image-rule" />
          <span className="register-image-caption">Your plans, in one place.</span>
        </div>
      </aside>
    </main>
  );
}
