from datetime import UTC, datetime

from backend.extensions import db
from werkzeug.security import check_password_hash, generate_password_hash


# User model
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    is_verified = db.Column(db.Boolean, default=False)
    reset_token = db.Column(db.String(200), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    # Add cascade delete-orphan for posts, votes, comments
    posts = db.relationship('BlogPost', backref='user', cascade='all, delete-orphan', lazy=True)
    votes = db.relationship('Vote', backref='user', cascade='all, delete-orphan', lazy=True)
    comments = db.relationship('Comment', backref='user', cascade='all, delete-orphan', lazy=True)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def __repr__(self):
        return f'<User {self.username}>'

# BlogPost model
class BlogPost(db.Model):
    __tablename__ = 'blog_posts'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    topic_tags = db.Column(db.String(255), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    upvotes = db.Column(db.Integer, default=0, nullable=False)
    downvotes = db.Column(db.Integer, default=0, nullable=False)

    votes = db.relationship('Vote', backref='post', cascade='all, delete-orphan', lazy=True)
    comments = db.relationship('Comment', backref='post', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "topic_tags": self.topic_tags,
            "upvotes": self.upvotes,
            "downvotes": self.downvotes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user_id": self.user_id,
            "author": self.user.username if hasattr(self, 'user') and self.user else None # type: ignore
        }

    def __repr__(self):
        return f'<BlogPost {self.title}>'

# Vote model
class Vote(db.Model):
    __tablename__ = 'votes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id', ondelete='CASCADE'), nullable=False)
    vote_type = db.Column(db.String(10), nullable=False)  # 'upvote' or 'downvote'

    def __repr__(self):
        return f'<Vote user_id={self.user_id} post_id={self.post_id} vote_type={self.vote_type}>'

# Comment model
class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

    def to_dict(self):
        return {
            "id": self.id,
            "content": self.content,
            "user_id": self.user_id,
            "username": self.user.username, # type: ignore
            "post_id": self.post_id,
            "created_at": self.created_at.isoformat(),
        }
