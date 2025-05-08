# 📝 Computer Anything Blog

A full-featured tech blog platform built with Flask (backend), React.js (frontend), and PostgreSQL.
Features include user authentication, post creation/editing, voting, comments, and more.

---

## 📸 Screenshots

![Blog Page](assets/Screenshot_Blog_Page.png)
*Page for viewing and searching all blog posts*

![Post Page](assets/Screenshot_Post_Page.png)
*Page for viewing a single blog post with comments*

![Profile Page](assets/Screenshot_Profile_Page.png)
*User profile page with post history*

---

## 🛠️ Backend Setup

1. **Navigate to the `backend` directory:**

    ```bash
    cd backend
    ```

2. **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

3. **⚙️ Set up the database connection in `config.py`, and configure any environment variables you might need.**

4. **📦 Make initial database migrations:**

    ```bash
    flask db init
    flask db migrate -m "initial migration"
    flask db upgrade
    ```

---

## 🌐 Frontend Setup

1. **Navigate to the `frontend` directory:**

    ```bash
    cd frontend
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **🚀 Start the React application:**

    ```bash
    npm start
    ```

---

## 🐳 Docker Compose Setup

1. **Build and start all services:**

    ```bash
    docker compose up --build -d
    ```

2. **Check logs for all services:**

    ```bash
    docker compose logs -f
    ```

3. **Stop all services:**

    ```bash
    docker compose down
    ```

4. **(Optional) Rebuild without cache:**

    ```bash
    docker compose build --no-cache
    ```

- Make sure you have your environment variables set in `backend/.env` and `frontend/.env` before building.
- The frontend should be built locally (`npm run build`) and the output copied to `backend/frontend/build` if you are not building the frontend inside Docker.

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

Use the `.env.example` file as a template to create your own `.env` file. Make sure to set the following variables:

---

## 📜 License

This project is licensed under the MIT License.
