import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.scss'
import { UserProvider } from '@auth0/nextjs-auth0/client';

export default function App({ Component, pageProps }) {
  return (
  <UserProvider>
    <Component {...pageProps} />
  </UserProvider>
  );
}