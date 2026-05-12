import { redirect } from 'next/navigation';

/** Legacy French URL → canonical English about page */
export default function LegacyAboutRedirect() {
  redirect('/about-us');
}
