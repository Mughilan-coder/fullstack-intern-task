
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const knex = require("knex");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Add it to your .env file.");
}

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

const db = knex({
  client: "better-sqlite3",
  connection: { filename: "./database.sqlite" },
  useNullAsDefault: true,
});


const sampleTemplates = [
  {
    name: "Portfolio Pro",
    description: "A polished personal portfolio for developers, designers, and creative professionals.",
    thumbnail_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
    category: "Portfolio",
  },
  {
    name: "Creative Studio",
    description: "A bold portfolio for creative agencies showcasing projects and case studies.",
    thumbnail_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&auto=format&fit=crop&q=80",
    category: "Portfolio",
  },
  {
    name: "DevFolio",
    description: "A developer portfolio featuring skills, projects, experience, and contact details.",
    thumbnail_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    category: "Portfolio",
  },
  {
    name: "ShopWave",
    description: "A modern e-commerce storefront for showcasing products and collections.",
    thumbnail_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop&q=80",
    category: "E-commerce",
  },
  {
    name: "Luxe Boutique",
    description: "An elegant storefront concept for fashion, accessories, and lifestyle brands.",
    thumbnail_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
    category: "E-commerce",
  },
  {
    name: "Gadget Grid",
    description: "A clean product catalog layout for electronics and technology stores.",
    thumbnail_url: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop&q=80",
    category: "E-commerce",
  },
  {
    name: "Startup Launch",
    description: "A conversion-focused landing page for startups and new products.",
    thumbnail_url: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&auto=format&fit=crop&q=80",
    category: "Business",
  },
  {
    name: "ConsultPro",
    description: "A professional business website for consultants and service providers.",
    thumbnail_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
    category: "Business",
  },
  {
    name: "Agency Prime",
    description: "A modern agency landing page for presenting services, teams, and client work.",
    thumbnail_url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80",
    category: "Business",
  },
  {
    name: "Foodie",
    description: "A welcoming restaurant website featuring food, atmosphere, and menus.",
    thumbnail_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
    category: "Restaurant",
  },
  {
    name: "Cafe Corner",
    description: "A warm cafe website concept for displaying drinks, opening hours, and location.",
    thumbnail_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
    category: "Restaurant",
  },
  {
    name: "LearnHub",
    description: "An online learning platform concept for courses, instructors, and students.",
    thumbnail_url: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=80",
    category: "Education",
  },
  {
    name: "CourseCraft",
    description: "A course landing page with a focus on learning paths and course discovery.",
    thumbnail_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    category: "Education",
  },
  {
    name: "Journal",
    description: "A minimal editorial blog layout for articles, stories, and personal writing.",
    thumbnail_url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80",
    category: "Blog",
  },
  {
    name: "Travel Stories",
    description: "A visual travel blog concept for destinations, photography, and travel guides.",
    thumbnail_url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80",
    category: "Blog",
  },
];


async function initializeDatabase() {
  if (!(await db.schema.hasTable("users"))) {
    await db.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.string("email").notNullable().unique();
      table.string("password").notNullable();
      table.timestamps(true, true);
    });
  }

  if (!(await db.schema.hasTable("templates"))) {
    await db.schema.createTable("templates", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.text("description").notNullable();
      table.string("thumbnail_url").notNullable();
      table.string("category").notNullable();
    });
  }

  if (!(await db.schema.hasTable("favorites"))) {
    await db.schema.createTable("favorites", (table) => {
      table.increments("id").primary();
      table.integer("user_id").unsigned().notNullable()
        .references("id").inTable("users").onDelete("CASCADE");
      table.integer("template_id").unsigned().notNullable()
        .references("id").inTable("templates").onDelete("CASCADE");
      table.unique(["user_id", "template_id"]);
    });
  }


const existingTemplates = await db("templates").select("name");
const existingNames = new Set(existingTemplates.map((t) => t.name));

const newTemplates = sampleTemplates.filter(
  (template) => !existingNames.has(template.name)
);

if (newTemplates.length > 0) {
  await db("templates").insert(newTemplates);
}


  console.log("Database initialized.");
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

// Register
app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    const existing = await db("users").where({ email: normalizedEmail }).first();
    if (existing) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [id] = await db("users").insert({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Registration successful.",
      user: { id, name: name.trim(), email: normalizedEmail },
    });
  } catch (error) {
    next(error);
  }
});

// Login
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await db("users").where({ email }).first();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
});

// List all templates, including whether the current user favorited each one.
app.get("/api/templates", async (req, res, next) => {
  try {
    const templates = await db("templates").select("*");

    const header = req.headers.authorization;
    let userId = null;

    if (header?.startsWith("Bearer ")) {
      try {
        userId = jwt.verify(header.slice(7), JWT_SECRET).id;
      } catch {
        // Public template browsing still works without a valid token.
      }
    }

    let favoriteIds = [];
    if (userId) {
      favoriteIds = (await db("favorites")
        .where({ user_id: userId })
        .pluck("template_id"));
    }

    res.json(templates.map((template) => ({
      ...template,
      isFavorite: favoriteIds.includes(template.id),
    })));
  } catch (error) {
    next(error);
  }
});

// Get one template
app.get("/api/templates/:id", async (req, res, next) => {
  try {
    const template = await db("templates").where({ id: req.params.id }).first();

    if (!template) {
      return res.status(404).json({ message: "Template not found." });
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Add a template to favorites (safe to call more than once).
app.post("/api/favorites/:templateId", authenticate, async (req, res, next) => {
  try {
    const template = await db("templates")
      .where({ id: req.params.templateId }).first();

    if (!template) {
      return res.status(404).json({ message: "Template not found." });
    }

    await db("favorites")
      .insert({ user_id: req.user.id, template_id: template.id })
      .onConflict(["user_id", "template_id"])
      .ignore();

    res.status(200).json({ message: "Template added to favorites." });
  } catch (error) {
    next(error);
  }
});

// Remove a favorite (useful for the UI).
app.delete("/api/favorites/:templateId", authenticate, async (req, res, next) => {
  try {
    await db("favorites")
      .where({ user_id: req.user.id, template_id: req.params.templateId })
      .del();

    res.json({ message: "Template removed from favorites." });
  } catch (error) {
    next(error);
  }
});

// List the logged-in user's favorites.
app.get("/api/favorites", authenticate, async (req, res, next) => {
  try {
    const favorites = await db("favorites")
      .join("templates", "favorites.template_id", "templates.id")
      .where("favorites.user_id", req.user.id)
      .select("templates.*");

    res.json(favorites);
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
