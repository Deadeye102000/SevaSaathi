import { redirect } from 'next/navigation';

/**
 * Root route — always redirects to the login page.
 * The chat lives at /chat.
 */
export default function RootPage() {
  redirect('/login');
}
