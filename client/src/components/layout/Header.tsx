import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold text-gray-900">
          AI Personal Diary
        </Link>
        <nav className="flex gap-4">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
