
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5001/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function Protected({ children }) {
  return localStorage.getItem("token")
    ? children
    : <Navigate to="/login" replace />;
}

function Navbar() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const update = () => setLoggedIn(!!localStorage.getItem("token"));
    window.addEventListener("auth-change", update);
    return () => window.removeEventListener("auth-change", update);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Link to="/templates" className="text-2xl font-black tracking-tight text-indigo-600">
          Template<span className="text-slate-900">Hub.</span>
        </Link>
        <div className="flex flex-wrap items-center gap-5 text-sm font-semibold">
          <Link to="/templates" className="hover:text-indigo-600">Explore</Link>
          {loggedIn ? (
            <>
              <Link to="/favorites" className="hover:text-indigo-600">My Favorites ♥</Link>
              <button onClick={logout} className="rounded-xl bg-slate-900 px-4 py-2 text-white">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-indigo-600">Login</Link>
              <Link to="/register" className="rounded-xl bg-indigo-600 px-4 py-2 text-white">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function AuthPage({ register }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const endpoint = register ? "/auth/register" : "/auth/login";
      const { data } = await api.post(endpoint, form);

      if (register) {
        navigate("/login", {
          state: { message: "Account created! Please log in." },
        });
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("auth-change"));
        navigate("/templates");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to connect to the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-14">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-indigo-600">
          TemplateHub
        </p>
        <h1 className="text-3xl font-black">
          {register ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 mb-7 text-sm text-slate-500">
          {register ? "Save your favorite templates in one place." : "Sign in to access your favorite templates."}
        </p>

        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          {register && (
            <input required minLength={2} placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" />
          )}
          <input required type="email" placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" />
          <input required minLength={8} type="password" placeholder="Password (at least 8 characters)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" />
          <button disabled={busy} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
            {busy ? "Please wait..." : register ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          {register ? "Already have an account? " : "New here? "}
          <Link className="font-bold text-indigo-600" to={register ? "/login" : "/register"}>
            {register ? "Login" : "Register"}
          </Link>
        </p>
      </div>
    </main>
  );
}

function TemplatesPage({ favoritesOnly = false }) {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadTemplates() {
    setLoading(true);
    setError("");
    try {
      if (favoritesOnly) {
        const { data } = await api.get("/favorites");
        setTemplates(data.map((t) => ({ ...t, isFavorite: true })));
      } else {
        const { data } = await api.get("/templates");
        setTemplates(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, [favoritesOnly]);

  async function toggleFavorite(template) {
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
    try {
      if (template.isFavorite) {
        await api.delete(`/favorites/${template.id}`);
      } else {
        await api.post(`/favorites/${template.id}`);
      }
      await loadTemplates();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update favorite.");
    }
  }

  const categories = ["All", ...new Set(templates.map((t) => t.category))];
  const filtered = templates.filter((t) =>
    (category === "All" || t.category === category) &&
    `${t.name} ${t.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <section className="mb-9 rounded-3xl bg-gradient-to-br from-indigo-700 to-violet-500 px-7 py-10 text-white md:px-12 md:py-14">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-indigo-200">
          Discover · Create · Launch
        </p>
        <h1 className="max-w-2xl text-4xl font-black leading-tight md:text-5xl">
          Find the perfect template for your next big idea.
        </h1>
        <p className="mt-4 max-w-xl text-indigo-100">
          Explore beautiful website templates for portfolios, businesses, shops and more.
        </p>
        <p className="mt-5 text-sm font-semibold">
          {localStorage.getItem("token") ? "Welcome back!" : "Sign in to save your favorites."}
        </p>
      </section>

      <div className="mb-7 flex flex-col gap-3 md:flex-row">
        <input placeholder="Search templates..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-black">{favoritesOnly ? "My Favorites" : "Explore Templates"}</h2>
        <span className="text-sm text-slate-500">{filtered.length} templates</span>
      </div>

      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? <p className="py-12 text-center text-slate-500">Loading templates...</p> :
        filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">No templates found.</div> :
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <article key={template.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
              <img src={template.thumbnail_url} alt={template.name}
                className="h-52 w-full object-cover" loading="lazy" />
              <div className="p-5">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{template.category}</span>
                <h3 className="mt-4 text-xl font-bold">{template.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{template.description}</p>
                <button onClick={() => toggleFavorite(template)}
                  className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold ${template.isFavorite ? "bg-pink-50 text-pink-700" : "bg-slate-900 text-white hover:bg-indigo-600"}`}>
                  {template.isFavorite ? "♥ Remove from Favorites" : "♡ Add to Favorites"}
                </button>
              </div>
            </article>
          ))}
        </div>
      }
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/templates" replace />} />
          <Route path="/register" element={<AuthPage register />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/favorites" element={<Protected><TemplatesPage favoritesOnly /></Protected>} />
          <Route path="*" element={<Navigate to="/templates" replace />} />
        </Routes>
        <footer className="mt-16 border-t border-slate-200 bg-white px-5 py-7 text-center text-sm text-slate-500">
          © 2026 TemplateHub. Built with React and Express.
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
