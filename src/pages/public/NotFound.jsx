import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-7xl font-extrabold text-royal">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">The page you are looking for does not exist or has been moved.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
