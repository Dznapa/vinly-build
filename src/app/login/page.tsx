'use client';

/* /login — Mock log-in form for the click-through clone.
   No real auth: any non-empty email + password triggers useProfile().login(email),
   which flips userState to 'signed_in' and routes the user to /profile. The form
   re-uses the .signup-card / .field / .btn-create grammar from /register_details. */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useProfile } from '@/context/ProfileContext';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useProfile();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setError('');
    login(email.trim());
    router.push('/profile');
  };

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className="signup-title">Log in</div>
        <form className="signup-card" onSubmit={onSubmit}>
          <h4>Welcome back</h4>
          <input
            className="field"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.forgotRow}>
            <button
              type="button"
              className={styles.forgotLink}
              onClick={() =>
                alert(
                  "If an account exists for that email, we'll send a password-reset link shortly.",
                )
              }
            >
              Forgot password?
            </button>
          </div>

          <div className="signup-actions">
            <button type="submit" className="btn-create">
              LOG IN
            </button>
          </div>

          <p className={styles.alt}>
            New to Vinly?{' '}
            <Link href="/register_details" className={styles.altLink}>
              Create an account
            </Link>
          </p>
        </form>
      </main>
    </PageChrome>
  );
}
