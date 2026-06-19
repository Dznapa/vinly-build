'use client';

/* /profile/edit — Edit the basic profile (name, email, phone, birth date).
   Re-uses the .signup-card / .field / .bdate grammar from /register_details so
   the form lines up with the sign-up screen. Birth-date is stored as an ISO
   yyyy-mm-dd string on ProfileBasics.birthDate. */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useProfile } from '@/context/ProfileContext';
import styles from './edit.module.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

// 1900..2007 reversed (newest first); generous 18+ window.
const YEARS = Array.from({ length: 2007 - 1900 + 1 }, (_, i) => String(2007 - i));

function splitBirthDate(iso: string | undefined): { m: string; d: string; y: string } {
  if (!iso) return { m: MONTHS[0], d: DAYS[0], y: YEARS[0] };
  const parts = iso.split('-');
  if (parts.length !== 3) return { m: MONTHS[0], d: DAYS[0], y: YEARS[0] };
  const [yyyy, mm, dd] = parts;
  const monthIdx = Math.max(0, Math.min(11, parseInt(mm, 10) - 1));
  return {
    m: MONTHS[monthIdx] ?? MONTHS[0],
    d: dd.padStart(2, '0'),
    y: yyyy,
  };
}

function buildBirthIso(monthName: string, dayStr: string, yearStr: string): string {
  const monthIdx = MONTHS.indexOf(monthName);
  if (monthIdx < 0) return '';
  const mm = String(monthIdx + 1).padStart(2, '0');
  const dd = dayStr.padStart(2, '0');
  return `${yearStr}-${mm}-${dd}`;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { basics, updateBasics, hydrated } = useProfile();

  const initial = useMemo(() => splitBirthDate(basics.birthDate), [basics.birthDate]);

  const [firstName, setFirstName] = useState(basics.firstName);
  const [lastName, setLastName] = useState(basics.lastName);
  const [email, setEmail] = useState(basics.email);
  const [phone, setPhone] = useState(basics.phone);
  const [month, setMonth] = useState(initial.m);
  const [day, setDay] = useState(initial.d);
  const [year, setYear] = useState(initial.y);

  // Re-seed once profile blob hydrates from localStorage.
  useEffect(() => {
    if (!hydrated) return;
    setFirstName(basics.firstName);
    setLastName(basics.lastName);
    setEmail(basics.email);
    setPhone(basics.phone);
    const parts = splitBirthDate(basics.birthDate);
    setMonth(parts.m);
    setDay(parts.d);
    setYear(parts.y);
  }, [hydrated, basics]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateBasics({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      birthDate: buildBirthIso(month, day, year),
    });
    router.push('/profile');
  };

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className="signup-title">Edit profile</div>
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
            type="email"
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

          <h4 className="mt">Birth Date</h4>
          <div className="bdate">
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className="btn-skip"
              onClick={() => router.back()}
            >
              CANCEL
            </button>
            <button type="submit" className="btn-billing">
              SAVE
            </button>
          </div>
        </form>
      </main>
    </PageChrome>
  );
}
