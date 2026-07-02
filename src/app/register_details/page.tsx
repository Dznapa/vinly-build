'use client';

/* /register_details — Sign up page. Mirrors /spec/prototype/signup.html.
   Uses .signup-title, .signup-card, .field, .bdate, .check-row, .signup-help,
   .signup-actions, .btn-create, .btn-billing already defined in globals.css. */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useProfile } from '@/context/ProfileContext';
import { useBillingGate } from '@/context/BillingGateContext';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, '0'),
);

// 1900..2005 reversed (newest first)
const YEARS = Array.from({ length: 2005 - 1900 + 1 }, (_, i) =>
  String(2005 - i),
);

// Editable nudge at the top of the create-account form, pushing toward SESH qualification.
const SESH_NUDGE =
  "Want the live floor? After you sign up, get SESH-qualified — add billing & shipping to unlock live SESH & Ticker pricing and lock bottles.";

/* Map MONTHS array (long names) to a numeric month string "01"-"12". */
function monthIndex(name: string | undefined): string {
  if (!name) return '01';
  const i = MONTHS.indexOf(name);
  return String(i >= 0 ? i + 1 : 1).padStart(2, '0');
}

export default function RegisterDetailsPage() {
  const router = useRouter();
  const { signupAndLogin } = useProfile();
  const { openGate } = useBillingGate();

  // controlled inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');

  const [month, setMonth] = useState(MONTHS[0]);
  const [day, setDay] = useState(DAYS[0]);
  const [year, setYear] = useState(YEARS[0]);

  const [over21, setOver21] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  // default checked per spec
  const [alerts, setAlerts] = useState(true);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const buildBirthDate = (): string => {
    const yy = year ?? '';
    const mm = monthIndex(month);
    const dd = (day ?? '01').padStart(2, '0');
    if (!yy) return '';
    return `${yy}-${mm}-${dd}`;
  };

  const onCreateAccount = () => {
    signupAndLogin({
      firstName,
      lastName,
      email,
      phone,
      birthDate: buildBirthDate(),
    });
    router.push('/profile');
  };

  // "Add billing & shipping" = create the account AND go straight into the SESH
  // qualification flow (BillingGatePopover: shipping → payment → qualified). NOT
  // the /checkout/billing order-summary page. Land on the new member's profile
  // with the gate open over it, so finishing the flow leaves them on their
  // profile showing the qualified state. The gate provider is global (root
  // layout), so its open state survives this navigation.
  const onAddBilling = () => {
    signupAndLogin({
      firstName,
      lastName,
      email,
      phone,
      birthDate: buildBirthDate(),
    });
    router.push('/profile');
    openGate();
  };

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className="signup-sesh">
          <div className="qbp-modal-kicker signup-sesh-kicker">
            <i className="fa-solid fa-lock" aria-hidden /> CREATE ACCOUNT
          </div>

          <div className="sqf-titles">
            <h3 className="sqf-title">Create your Vinly account</h3>
            <p className="sqf-sub">
              One account gets you in the door. Get SESH-qualified to see live pricing and lock bottles.
            </p>
          </div>

          {/* Nudge toward SESH qualification. */}
          <div className="signup-sesh-nudge" role="note">
            <i className="fa-solid fa-bolt" aria-hidden />
            <span>{SESH_NUDGE}</span>
          </div>

          <form className="sqf-form" onSubmit={onSubmit}>
            <div className="signup-sesh-section">Contact Information</div>
            <div className="sqf-row">
              <label className="sqf-fld">
                <span className="sqf-lbl">First name</span>
                <input className="sqf-input" placeholder="First" autoComplete="given-name"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label className="sqf-fld">
                <span className="sqf-lbl">Last name</span>
                <input className="sqf-input" placeholder="Last" autoComplete="family-name"
                  value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
            </div>
            <label className="sqf-fld">
              <span className="sqf-lbl">Email</span>
              <input className="sqf-input" type="email" placeholder="you@email.com" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="sqf-fld">
              <span className="sqf-lbl">Phone number</span>
              <input className="sqf-input" placeholder="(555) 555-5555" autoComplete="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>

            <div className="signup-sesh-section">Password</div>
            <label className="sqf-fld">
              <span className="sqf-lbl">Create password</span>
              <input className="sqf-input" type="password" placeholder="Create password" autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label className="sqf-fld">
              <span className="sqf-lbl">Verify password</span>
              <input className="sqf-input" type="password" placeholder="Verify password" autoComplete="new-password"
                value={verifyPassword} onChange={(e) => setVerifyPassword(e.target.value)} />
            </label>

            <div className="signup-sesh-section">Birth date <span className="signup-sesh-req">*</span></div>
            <div className="sqf-row">
              <label className="sqf-fld">
                <span className="sqf-lbl">Month</span>
                <select className="sqf-input sqf-select" value={month} onChange={(e) => setMonth(e.target.value)}>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label className="sqf-fld sqf-narrow">
                <span className="sqf-lbl">Day</span>
                <select className="sqf-input sqf-select" value={day} onChange={(e) => setDay(e.target.value)}>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className="sqf-fld">
                <span className="sqf-lbl">Year</span>
                <select className="sqf-input sqf-select" value={year} onChange={(e) => setYear(e.target.value)}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
            </div>

            <label className="check-row">
              <input type="checkbox" checked={over21} onChange={(e) => setOver21(e.target.checked)} />{' '}
              I am over 21 years of age
            </label>
            <label className="check-row">
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />{' '}
              Agree to <a href="#">terms and conditions</a>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} />{' '}
              Yes — send me Vinly Ticker and New Drop alerts
            </label>

            <p className="sqf-sub signup-sesh-help">
              Click CREATE ACCOUNT to become a Vinly Member now. To purchase or participate in the SESH
              you&apos;ll need to add billing &amp; shipping.
            </p>

            <div className="sqf-actions signup-sesh-actions">
              <button type="button" className="qbp-modal-secondary" onClick={onCreateAccount}>
                CREATE ACCOUNT
              </button>
              <button type="button" className="qbp-modal-primary" onClick={onAddBilling}>
                <i className="fa-solid fa-credit-card" aria-hidden /> ADD BILLING &amp; SHIPPING
              </button>
            </div>
          </form>
        </div>
      </main>
    </PageChrome>
  );
}
