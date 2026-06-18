'use client';

/* /register_details — Sign up page. Mirrors /spec/prototype/signup.html.
   Uses .signup-title, .signup-card, .field, .bdate, .check-row, .signup-help,
   .signup-actions, .btn-create, .btn-billing already defined in globals.css. */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useProfile } from '@/context/ProfileContext';

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

/* Map MONTHS array (long names) to a numeric month string "01"-"12". */
function monthIndex(name: string | undefined): string {
  if (!name) return '01';
  const i = MONTHS.indexOf(name);
  return String(i >= 0 ? i + 1 : 1).padStart(2, '0');
}

export default function RegisterDetailsPage() {
  const router = useRouter();
  const { signupAndLogin } = useProfile();

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

  const onAddBilling = () => {
    signupAndLogin({
      firstName,
      lastName,
      email,
      phone,
      birthDate: buildBirthDate(),
    });
    router.push('/checkout/billing');
  };

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className="signup-title">Sign up</div>
        <form className="signup-card" onSubmit={onSubmit}>
          <h4>Contact Information</h4>
          <input
            className="field"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className="field"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            className="field"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="field"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <h4 className="mt">Password</h4>
          <input
            className="field"
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="field"
            type="password"
            placeholder="Verify Password"
            value={verifyPassword}
            onChange={(e) => setVerifyPassword(e.target.value)}
          />

          <h4 className="mt">*Birth Date</h4>
          <div className="bdate">
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={over21}
              onChange={(e) => setOver21(e.target.checked)}
            />{' '}
            I am over 21 years of age
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />{' '}
            Agree to <a href="#">terms and conditions</a>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={alerts}
              onChange={(e) => setAlerts(e.target.checked)}
            />{' '}
            Yes - send me Vinly Ticker and New Drop alerts
          </label>

          <p className="signup-help">
            Click SIGN UP to become a Vinly Member now. To purchase or
            participate in the SESH you will need to provide billing and
            shipping information.
          </p>

          <div className="signup-actions">
            <button
              type="button"
              className="btn-create"
              onClick={onCreateAccount}
            >
              CREATE ACCOUNT
            </button>
            <button
              type="button"
              className="btn-billing"
              onClick={onAddBilling}
            >
              ADD BILLING &amp; SHIPPING
            </button>
          </div>
        </form>
      </main>
    </PageChrome>
  );
}
