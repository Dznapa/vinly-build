// NEEDS REVIEW: mock card form, never accepts real payment data.
'use client';

/* /profile/payment — Manage saved payment methods (mock).
   Only ever stores last4 + brand + expMonth/expYear + nameOnCard. The full PAN
   typed into the Add form is run through cardBrand() to infer the brand and
   then the LAST 4 digits are kept; the rest is dropped before persisting. */

import { useState, type FormEvent } from 'react';
import { PageChrome } from '@/components/PageChrome';
import ProfileBack from '@/components/ProfileBack';
import {
  useProfile,
  cardBrand,
  type PaymentCard,
} from '@/context/ProfileContext';
import styles from './payment.module.css';

const BRAND_ICON: Record<PaymentCard['brand'], string> = {
  Visa: 'fa-brands fa-cc-visa',
  Mastercard: 'fa-brands fa-cc-mastercard',
  'American Express': 'fa-brands fa-cc-amex',
  Discover: 'fa-brands fa-cc-discover',
  Other: 'fa-solid fa-credit-card',
};

type FormState = {
  number: string;
  nameOnCard: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  brand: PaymentCard['brand'];
  isDefault: boolean;
};

const EMPTY_FORM: FormState = {
  number: '',
  nameOnCard: '',
  expMonth: '',
  expYear: '',
  cvc: '',
  brand: 'Other',
  isDefault: false,
};

export default function PaymentPage() {
  const {
    cards,
    addCard,
    updateCard,
    removeCard,
    setDefaultCard,
  } = useProfile();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setFormOpen(true);
  };

  const openEdit = (c: PaymentCard) => {
    setEditingId(c.id);
    setForm({
      number: '',
      nameOnCard: c.nameOnCard,
      expMonth: c.expMonth,
      expYear: c.expYear,
      cvc: '',
      brand: c.brand,
      isDefault: c.isDefault,
    });
    setError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'number' && typeof v === 'string') {
        next.brand = cardBrand(v);
      }
      return next;
    });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingId) {
      if (!form.nameOnCard.trim() || !form.expMonth.trim() || !form.expYear.trim()) {
        setError('Name and expiration are required.');
        return;
      }
      updateCard(editingId, {
        nameOnCard: form.nameOnCard.trim(),
        expMonth: form.expMonth.trim().padStart(2, '0').slice(0, 2),
        expYear: form.expYear.trim().slice(-2).padStart(2, '0'),
      });
      if (form.isDefault) setDefaultCard(editingId);
      closeForm();
      return;
    }

    const digits = form.number.replace(/\D/g, '');
    if (digits.length < 12) {
      setError('Card number must be at least 12 digits.');
      return;
    }
    if (!form.nameOnCard.trim()) {
      setError('Name on card is required.');
      return;
    }
    if (!form.expMonth.trim() || !form.expYear.trim()) {
      setError('Expiration is required.');
      return;
    }
    if (!form.cvc.trim()) {
      setError('CVC is required.');
      return;
    }
    addCard({
      brand: cardBrand(digits),
      last4: digits.slice(-4),
      expMonth: form.expMonth.trim().padStart(2, '0').slice(0, 2),
      expYear: form.expYear.trim().slice(-2).padStart(2, '0'),
      nameOnCard: form.nameOnCard.trim(),
      isDefault: form.isDefault,
    });
    closeForm();
  };

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <ProfileBack />
        <div className="sesh-title">
          <span className="tag">PROFILE</span> Payment methods
        </div>

        <section className={styles.list}>
          {cards.length === 0 && !formOpen && (
            <div className={styles.empty}>
              <p>No payment methods on file.</p>
              <button type="button" className="btn-billing" onClick={openAdd}>
                ADD CARD
              </button>
            </div>
          )}

          {cards.map((c) => (
            <div key={c.id} className={styles.chip}>
              <div className={styles.chipHead}>
                <div className={styles.brandRow}>
                  <i
                    className={`${BRAND_ICON[c.brand]} ${styles.brandIcon}`}
                    style={{ color: c.isDefault ? 'var(--orange)' : '#555' }}
                    aria-hidden
                  />
                  <span className={styles.brandName}>{c.brand}</span>
                  {c.isDefault && (
                    <span className={styles.badge}>DEFAULT</span>
                  )}
                </div>
                <div className={styles.chipActions}>
                  {!c.isDefault && (
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => setDefaultCard(c.id)}
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`${styles.linkBtn} ${styles.linkBtnDanger}`}
                    onClick={() => removeCard(c.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.chipPan}>
                <span>{'••••'}</span>
                <span>{'••••'}</span>
                <span>{'••••'}</span>
                <span>{c.last4}</span>
              </div>
              <div className={styles.chipFoot}>
                <div className={styles.chipName}>{c.nameOnCard}</div>
                <div className={styles.chipExp}>
                  Exp {c.expMonth}/{c.expYear}
                </div>
              </div>
            </div>
          ))}

          {cards.length > 0 && !formOpen && (
            <div className={styles.addRow}>
              <button type="button" className="btn-billing" onClick={openAdd}>
                ADD CARD
              </button>
            </div>
          )}
        </section>

        {formOpen && (
          <form className={styles.formCard} onSubmit={onSubmit}>
            <h4>{editingId ? 'Edit card' : 'New card'}</h4>

            {!editingId && (
              <>
                <input
                  className="field"
                  placeholder="Card Number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={form.number}
                  onChange={(e) => setField('number', e.target.value)}
                />
                {form.number && (
                  <div className={styles.brandHint}>
                    <i
                      className={`${BRAND_ICON[form.brand]} ${styles.brandIcon}`}
                      style={{ color: '#555' }}
                      aria-hidden
                    />{' '}
                    {form.brand}
                  </div>
                )}
              </>
            )}

            <input
              className="field"
              placeholder="Name on Card"
              autoComplete="cc-name"
              value={form.nameOnCard}
              onChange={(e) => setField('nameOnCard', e.target.value)}
            />

            <div className={styles.expRow}>
              <input
                className="field"
                placeholder="MM"
                inputMode="numeric"
                maxLength={2}
                autoComplete="cc-exp-month"
                value={form.expMonth}
                onChange={(e) => setField('expMonth', e.target.value.replace(/\D/g, ''))}
              />
              <input
                className="field"
                placeholder="YY"
                inputMode="numeric"
                maxLength={2}
                autoComplete="cc-exp-year"
                value={form.expYear}
                onChange={(e) => setField('expYear', e.target.value.replace(/\D/g, ''))}
              />
              {!editingId && (
                <input
                  className="field"
                  placeholder="CVC"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="cc-csc"
                  value={form.cvc}
                  onChange={(e) => setField('cvc', e.target.value.replace(/\D/g, ''))}
                />
              )}
            </div>

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setField('isDefault', e.target.checked)}
              />{' '}
              Set as default
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.formActions}>
              <button type="button" className="btn-skip" onClick={closeForm}>
                CANCEL
              </button>
              <button type="submit" className="btn-billing">
                {editingId ? 'SAVE' : 'ADD CARD'}
              </button>
            </div>
          </form>
        )}
      </main>
    </PageChrome>
  );
}
