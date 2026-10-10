# TemplateHub — Mini SaaS Template Store

A full-stack web application that allows users to register, log in, browse website templates, view template details, and manage their favorite templates.

## Features
- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Browse website templates
- Add and remove favorites
- User-specific favorites
- Search templates and filter by category
- Responsive user interface

## Tech Stack
**Frontend:** React.js, Vite, Tailwind CSS, Axios, React Router

**Backend:** Node.js, Express.js, SQLite, Knex.js, bcryptjs, JSON Web Tokens

## Project Structure
- `client/` — React frontend
- `server/` — Express backend and database

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/Mughilan-coder/fullstack-intern-task.git
cd fullstack-intern-task
```

### 2. Backend setup
```bash
cd server
npm install
```

Create a `server/.env` file:
```env
PORT=5001
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Use a strong, private JWT secret. Never upload `.env` to GitHub.

Start the backend:
```bash
npm run dev
```

Backend URL: `http://localhost:5001`

### 3. Frontend setup
Open another terminal:
```bash
cd fullstack-intern-task/client
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`
## Application Routes

- `/register` — Create a new account
- `/login` — Sign in to your account
- `/templates` — Browse, search, filter, and sort templates
- `/favorites` — View and manage your favorite templates (login required)

## How to Use

1. Start the backend and frontend using the installation instructions above.
2. Open `http://localhost:5173` in your browser.
3. Register a new account or log in.
4. Browse the available templates and open their details.
5. Add templates to your favorites and visit the Favorites page to manage them.
6. Log out when finished.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/templates` | List templates |
| GET | `/api/templates/:id` | Get template details |
| POST | `/api/favorites/:templateId` | Add a favorite |
| GET | `/api/favorites` | List favorites |
| DELETE | `/api/favorites/:templateId` | Remove a favorite |
| GET | `/api/health` | Health check |

## Author
**Name:** Mughilan M

**Email:** mughilan404@gmail.com

## License
Developed as a software engineering internship technical assignment.