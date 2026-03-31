import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-lg text-gray-600">Page not found.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
