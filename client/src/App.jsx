
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
  const [favoriteCount, setFavoriteCount] = useState(0);


useEffect(() => {
  const update = () => {
    const token = localStorage.getItem("token");
    setLoggedIn(!!token);

    if (!token) {
      setFavoriteCount(0);
      return;
    }

    axios
      .get("http://localhost:5001/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setFavoriteCount(data.length))
      .catch(() => setFavoriteCount(0));
  };

  update();
  window.addEventListener("auth-change", update);
  window.addEventListener("favorites-change", update);

return () => {
  window.removeEventListener("auth-change", update);
  window.removeEventListener("favorites-change", update);
};
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

<Link
  to="/favorites"
  className="inline-flex items-center gap-2 transition hover:text-indigo-600"
>
  My Favorites
  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-pink-100 px-2 py-1 text-xs font-bold text-pink-700">
    {favoriteCount}
  </span>
</Link>

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
  const [sortBy, setSortBy] = useState("featured");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

useEffect(() => {
  if (!selectedTemplate) return;

  function handleEscape(event) {
    if (event.key === "Escape") {
      setSelectedTemplate(null);
    }
  }

  window.addEventListener("keydown", handleEscape);

  return () => {
    window.removeEventListener("keydown", handleEscape);
  };
}, [selectedTemplate]);


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
  setNotice(`${template.name} removed from favorites.`);
} else {
  await api.post(`/favorites/${template.id}`);
  setNotice(`${template.name} added to favorites!`);
}


  const updatedIsFavorite = !template.isFavorite;

  setSelectedTemplate((current) =>
    current?.id === template.id
      ? { ...current, isFavorite: updatedIsFavorite }
      : current
  );

  await loadTemplates();
  window.dispatchEvent(new Event("favorites-change"));

    } catch (err) {
      setError(err.response?.data?.message || "Could not update favorite.");
    }
  }

  const categories = ["All", ...new Set(templates.map((t) => t.category))];

const filtered = templates
  .filter(
    (t) =>
      (category === "All" || t.category === category) &&
      `${t.name} ${t.description}`
        .toLowerCase()
        .includes(search.toLowerCase())
  )
  .sort((a, b) => {
    if (sortBy === "az") {
      return a.name.localeCompare(b.name);
    }

    if (sortBy === "za") {
      return b.name.localeCompare(a.name);
    }

    return 0;
  });


  return (
    <main className="mx-auto max-w-7xl px-5 py-10">

<section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-800 px-7 py-12 text-white shadow-xl shadow-indigo-200/40 sm:px-10 md:px-14 md:py-16">

        <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.25em] text-indigo-200 sm:text-sm">
          Discover · Create · Launch
        </p>
        <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl">
          Find the perfect template for your next big idea.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-indigo-100 md:text-lg">
          Explore beautiful website templates for portfolios, businesses, shops and more.
        </p>
        <p className="mt-5 text-sm font-semibold">
          {localStorage.getItem("token") ? "Welcome back!" : "Sign in to save your favorites."}
        </p>
      </section>


<div className="mb-7 space-y-4">
  <div className="flex flex-col gap-3 sm:flex-row">
    <div className="relative min-w-0 flex-1">
      <input
        placeholder="Search templates..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-12 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />

      {search && (
        <button
          type="button"
          onClick={() => setSearch("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ×
        </button>
      )}
    </div>


<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
  aria-label="Sort templates"
  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
>
  <option value="featured">Featured</option>
  <option value="az">Name: A–Z</option>
  <option value="za">Name: Z–A</option>
</select>

  </div>

  <div className="flex flex-wrap gap-2">
    {categories.map((c) => (
      <button
        key={c}
        type="button"
        onClick={() => setCategory(c)}
        aria-pressed={category === c}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
          category === c
            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        }`}
      >
        {c === "All" ? "All templates" : c}
      </button>
    ))}
  </div>
</div>


      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-black">{favoritesOnly ? "My Favorites" : "Explore Templates"}</h2>

<span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
  {filtered.length} {filtered.length === 1 ? "template" : "templates"}
</span>

      </div>

      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

{notice && (
  <p
    role="status"
    aria-live="polite"
    className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
  >
    {notice}
  </p>
)}

      {loading ? <p className="py-12 text-center text-slate-500">Loading templates...</p> :
        filtered.length === 0 ?
<div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
    🔎
  </div>
  <h3 className="text-lg font-bold text-slate-900">
    No templates found
  </h3>
  <p className="mt-2 text-sm text-slate-500">
    Try a different search term or select another category.
  </p>
</div>
 :
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <article
  key={template.id}
  className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60"
>
              <img src={template.thumbnail_url} alt={template.name}
                className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="p-6">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{template.category}</span>
                <h3 className="mt-4 text-xl font-bold">{template.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{template.description}</p>


<button
  type="button"
  onClick={() => setSelectedTemplate(template)}
  className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
>
  View Details
</button>

<button
  onClick={() => toggleFavorite(template)}
  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
    template.isFavorite
      ? "border-pink-200 bg-pink-50 text-pink-700 hover:border-pink-300 hover:bg-pink-100"
      : "border-slate-900 bg-slate-900 text-white hover:border-indigo-600 hover:bg-indigo-600"
  }`}
>
  {template.isFavorite ? "♥ Saved to Favorites" : "♡ Add to Favorites"}
</button>

              </div>
            </article>
          ))}
        </div>
      }
      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTemplate(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-preview-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedTemplate(null)}
              aria-label="Close template preview"
              className="absolute right-4 top-4 z-10 rounded-full bg-white/95 px-3 py-2 text-xl font-bold text-slate-700 shadow hover:bg-slate-100"
            >
              ×
            </button>

            <img
              src={selectedTemplate.thumbnail_url}
              alt={selectedTemplate.name}
              className="h-64 w-full object-cover sm:h-80"
            />

            <div className="p-6 sm:p-8">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {selectedTemplate.category}
              </span>

              <h2
                id="template-preview-title"
                className="mt-4 text-3xl font-black tracking-tight text-slate-900"
              >
                {selectedTemplate.name}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                {selectedTemplate.description}
              </p>

              <button
                type="button"
                onClick={() => toggleFavorite(selectedTemplate)}
                className={`mt-6 w-full rounded-xl px-5 py-3 font-bold transition ${
                  selectedTemplate.isFavorite
                    ? "bg-pink-50 text-pink-700 hover:bg-pink-100"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {selectedTemplate.isFavorite
                  ? "♥ Saved to Favorites"
                  : "♡ Add to Favorites"}
              </button>
            </div>
          </section>
        </div>
      )}
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
