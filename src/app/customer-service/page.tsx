// NEEDS REVIEW: built from spec only
'use client';

import { useState, type FormEvent } from 'react';
import { PageChrome } from '@/components/PageChrome';

export default function CustomerServicePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert("Thanks — we'll be in touch.");
    setName('');
    setEmail('');
    setMessage('');
  }

  return (
    <PageChrome ticker={false}>
      <div className="wrap">
        <h1 className="sesh-title">
          <span className="tag">VINLY</span> CUSTOMER SERVICE
        </h1>

        <div
          className="signup-card"
          style={{ maxWidth: 720, margin: '0 auto 24px' }}
        >
          <h4
            style={{
              margin: '0 0 12px',
              color: '#1f1f1f',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Get in touch
          </h4>
          <p style={{ margin: '0 0 8px', color: '#555', lineHeight: 1.6 }}>
            Email us at{' '}
            <a
              href="mailto:support@vinly.local"
              style={{ color: '#F26A35', textDecoration: 'underline' }}
            >
              support@vinly.local
            </a>
            .
          </p>
          <p style={{ margin: '0 0 8px', color: '#555', lineHeight: 1.6 }}>
            Hours: Monday – Friday, 9:00 AM – 5:00 PM PT.
          </p>
          <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
            Typical response time: within one business day.
          </p>
        </div>

        <div
          className="signup-card"
          style={{ maxWidth: 720, margin: '0 auto 60px' }}
        >
          <h4
            style={{
              margin: '0 0 18px',
              color: '#1f1f1f',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Send us a message
          </h4>
          <form onSubmit={handleSubmit}>
            <input
              className="field"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="field"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <textarea
              className="field"
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              style={{
                resize: 'vertical',
                minHeight: 120,
                borderBottom: '1px solid #d9dde2',
              }}
            />
            <div style={{ marginTop: 12 }}>
              <button type="submit" className="btn-billing">
                SEND
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageChrome>
  );
}
