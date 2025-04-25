# 📝 Computer Anything Blog

A full-featured tech blog platform built with Flask (backend), React.js (frontend), and PostgreSQL.
Features include user authentication, post creation/editing, voting, comments, and more.

---

## 📂 Project Structure

```bash
cpt_anything_blog/
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── routes.py
│   ├── config.py
│   ├── requirements.txt
│   ├── .env
│   └── migrations/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── BlogList.js
│   │   │   ├── BlogPost.js
│   │   │   ├── EditPost.js
│   │   │   ├── CreatePost.js
│   │   │   ├── CommentSection.js
│   │   │   └── Modal.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   └── index.js
│   ├── styles/
│   │   ├── CreateEditPost.css
│   │   ├── Loading.css
│   │   └── Modal.css
│   ├── package.json
│   └── .env
├── [README.md](http://_vscodecontentref_/0)
└── docker-compose.yml
```

---

## 🛠️ Backend Setup

### 1. Navigate to the `backend` directory

### 2. Install the required dependencies (Backend)

```bash
pip install -r requirements.txt
```

### 3. ⚙️ Set up the database connection in `config.py`, and configure any environment variables you might need

### 4. 📦 Make initial database migrations

```bash
flask db init # This initializes the migration directory
flask db migrate -m "initial migration"
flask db upgrade
```

---

## 🌐 Frontend Setup

### 1. Navigate to the `frontend` directory

### 2. Install the required dependencies (Frontend)

```bash
npm install
```

### 3. 🚀 Start the React application

```bash
npm start
```

---

## ✨ Features

- ✅ User registration, login, and JWT authentication
- 📝 Create, edit, and delete blog posts
- 🗳️ Upvote/downvote posts
- 💬 Comment on posts (with delete support)
- 🔍 Search and filter posts by tags
- 🏷️ Tag support (with automatic formatting)
- 👤 User profile and post history
- 🖼️ Responsive, modern UI with modals and loading overlays
- 🛡️ Secure API endpoints

---

## 🔧 Environment Variables

Frontend (`frontend/.env`):

```bash
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📜 License

This project is licensed under the MIT License.
