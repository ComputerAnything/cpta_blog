# Blog Posting Application

This project is a blog posting application built using FlaskAPI for the backend, React.js for the frontend, and MySQL as the database. It includes full user authentication and allows users to create, read, update, and delete blog posts.

## Project Structure

```
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

## Backend Setup

1. Navigate to the `backend` directory.
2. Install the required dependencies:
  ```
  pip install -r requirements.txt
  ```
3. Set up the database connection in `config.py`, setup any environment variables you might need.
4. Make initial database migrations
  ```
  flask db init # This initializes the migration directory
  flask db migrate -m "initial migration"
  flask db upgrade
  ```

## Frontend Setup

1. Navigate to the `frontend` directory.
2. Install the required dependencies:
  ```
  npm install
  ```
3. Start the React application:
  ```
  npm start
  ```

## Features

- User registration and login
- Create, read, update, and delete blog posts
- User authentication using JWT
- Responsive design for mobile and desktop

## Environment Variables

Make sure to set the following environment variables in the `.env` file in the `frontend` directory:

- `REACT_APP_API_URL`: The base URL for the backend API.

## Docker Setup

To run the application using Docker, use the following command in the root directory:

```
docker-compose up
```

This will start both the backend and the database services as defined in the `docker-compose.yml` file.

## License

This project is licensed under the MIT License.
