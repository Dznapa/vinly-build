import Link from 'next/link';

/* Back link shown at the top of profile sub-pages (edit / addresses / orders /
   payment) so users can return to the account hub without the browser back button. */
export function ProfileBack() {
  return (
    <Link href="/profile" className="profile-back">
      <i className="fa-solid fa-arrow-left" aria-hidden /> Back to Account
    </Link>
  );
}

export default ProfileBack;
