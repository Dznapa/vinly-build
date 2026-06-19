'use client';

/* /profile/addresses — Manage shipping/billing addresses.
   Cards on the left; the inline form opens beneath the list for both Add and
   Edit. State is held in ProfileContext (addresses[]). The address shape comes
   from ProfileContext.Address — see context for the field list. */

import { useState, type FormEvent } from 'react';
import { PageChrome } from '@/components/PageChrome';
import { useProfile, type Address } from '@/context/ProfileContext';
import styles from './addresses.module.css';

const US_STATES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

type FormState = {
  label: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isDefault: boolean;
};

const EMPTY_FORM: FormState = {
  label: '',
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: 'CA',
  zip: '',
  phone: '',
  isDefault: false,
};

function fromAddress(a: Address): FormState {
  return {
    label: a.label,
    fullName: a.fullName,
    line1: a.line1,
    line2: a.line2 ?? '',
    city: a.city,
    state: a.state,
    zip: a.zip,
    phone: a.phone ?? '',
    isDefault: a.isDefault,
  };
}

export default function AddressesPage() {
  const {
    addresses,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
  } = useProfile();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setForm(fromAddress(a));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      label: form.label.trim() || 'Address',
      fullName: form.fullName.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      state: form.state,
      zip: form.zip.trim(),
      phone: form.phone.trim() || undefined,
      isDefault: form.isDefault,
    };
    if (editingId) {
      updateAddress(editingId, payload);
      if (form.isDefault) setDefaultAddress(editingId);
    } else {
      addAddress(payload);
    }
    closeForm();
  };

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className="sesh-title">
          <span className="tag">PROFILE</span> Addresses
        </div>

        <section className={styles.list}>
          {addresses.length === 0 && !formOpen && (
            <div className={styles.empty}>
              <p>No addresses on file.</p>
              <button type="button" className="btn-billing" onClick={openAdd}>
                ADD NEW ADDRESS
              </button>
            </div>
          )}

          {addresses.map((a) => (
            <div key={a.id} className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardLabel}>
                  {a.label}
                  {a.isDefault && (
                    <span className={styles.badge}>DEFAULT</span>
                  )}
                </div>
                <div className={styles.cardActions}>
                  {!a.isDefault && (
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => setDefaultAddress(a.id)}
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => openEdit(a)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`${styles.linkBtn} ${styles.linkBtnDanger}`}
                    onClick={() => removeAddress(a.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.fullName}>{a.fullName}</div>
                <div>{a.line1}</div>
                {a.line2 && <div>{a.line2}</div>}
                <div>{a.city}, {a.state} {a.zip}</div>
                {a.phone && <div>{a.phone}</div>}
              </div>
            </div>
          ))}

          {addresses.length > 0 && !formOpen && (
            <div className={styles.addRow}>
              <button type="button" className="btn-billing" onClick={openAdd}>
                ADD NEW ADDRESS
              </button>
            </div>
          )}
        </section>

        {formOpen && (
          <form className={styles.formCard} onSubmit={onSubmit}>
            <h4>{editingId ? 'Edit address' : 'New address'}</h4>
            <input
              className="field"
              placeholder="Label (e.g. Home, Office)"
              value={form.label}
              onChange={(e) => setField('label', e.target.value)}
            />
            <input
              className="field"
              placeholder="Full Name"
              value={form.fullName}
              onChange={(e) => setField('fullName', e.target.value)}
              required
            />
            <input
              className="field"
              placeholder="Address Line 1"
              value={form.line1}
              onChange={(e) => setField('line1', e.target.value)}
              required
            />
            <input
              className="field"
              placeholder="Address Line 2 (optional)"
              value={form.line2}
              onChange={(e) => setField('line2', e.target.value)}
            />
            <div className={styles.row3}>
              <input
                className="field"
                placeholder="City"
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                required
              />
              <select
                className={styles.select}
                value={form.state}
                onChange={(e) => setField('state', e.target.value)}
                aria-label="State"
              >
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.code}</option>
                ))}
              </select>
              <input
                className="field"
                placeholder="ZIP"
                value={form.zip}
                onChange={(e) => setField('zip', e.target.value)}
                required
              />
            </div>
            <input
              className="field"
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
            />

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setField('isDefault', e.target.checked)}
              />{' '}
              Set as default
            </label>

            <div className={styles.formActions}>
              <button type="button" className="btn-skip" onClick={closeForm}>
                CANCEL
              </button>
              <button type="submit" className="btn-billing">
                {editingId ? 'SAVE' : 'ADD ADDRESS'}
              </button>
            </div>
          </form>
        )}
      </main>
    </PageChrome>
  );
}
