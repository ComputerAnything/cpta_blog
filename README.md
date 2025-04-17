# 📝 Computer Anything Blog

This project is a blog posting application built using FlaskAPI for the backend, React.js for the frontend, and MySQL as the database. It includes full user authentication and allows users to create, read, update, and delete blog posts.

---

## 📂 Project Structure

```bash
blog-posting-app
├── backend
│   ├── app.py
│   ├── models.py
│   ├── routes.py
│   ├── config.py
│   ├── requirements.txt
│   └── migrations
├── frontend
│   ├── public
│   │   └── index.html
│   ├── src
│   │   ├── App.js
│   │   ├── components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── BlogList.js
│   │   │   └── BlogPost.js
│   │   ├── context
│   │   │   └── AuthContext.js
│   │   ├── services
│   │   │   └── api.js
│   │   └── index.js
│   ├── package.json
│   └── .env
├── README.md
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
cd frontend
npm install
```

### 3. 🚀 Start the React application

```bash
npm start
```

---

## ▶️ Running the App

### 1. First, start the backend server

```bash
cd backend
flask run
```

### 2. Then, start the frontend server

```bash
cd frontend
npm start
```

### 3. 🌍 Open your browser and navigate to `http://localhost:3000` to view the application

---

## ✨ Features

- ✅ User registration and login
- 📝 Create, read, update, and delete blog posts
- 🔒 User authentication using JWT
- 📱 Responsive design for mobile and desktop

---

## 🔧 Environment Variables

- Make sure to set the following environment variables in the `.env` file in the `frontend` directory:
  - `REACT_APP_API_URL`: The base URL for the backend API.

---

## 📜 License

This project is licensed under the MIT License.
