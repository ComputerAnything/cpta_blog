from app import db
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash


# User model
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def __repr__(self): # This is a special method that defines how the object is represented
        # when printed or logged. It returns a string representation of the object.
        # In this case, it returns the username of the user.
        # This is useful for debugging and logging purposes.
        return f'<User {self.username}>'


# BlogPost model
class BlogPost(db.Model):
    __tablename__ = 'blog_posts'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    topic_tags = db.Column(db.String(255), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    upvotes = db.Column(db.Integer, default=0, nullable=False)
    downvotes = db.Column(db.Integer, default=0, nullable=False)

    user = db.relationship('User', backref=db.backref('posts', lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "topic_tags": self.topic_tags,
            "user_id": self.user_id,
            "author": self.user.username,
            "created_at": self.created_at.isoformat(),
            "upvotes": self.upvotes,
            "downvotes": self.downvotes,
        }

    def __repr__(self):
        return f'<BlogPost {self.title}>'


# Vote model
class Vote(db.Model):
    __tablename__ = 'votes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id'), nullable=False)
    vote_type = db.Column(db.String(10), nullable=False)  # 'upvote' or 'downvote'

    user = db.relationship('User', backref=db.backref('votes', lazy=True))
    post = db.relationship('BlogPost', backref=db.backref('votes', lazy=True))

    def __repr__(self):
        return f'<Vote user_id={self.user_id} post_id={self.post_id} vote_type={self.vote_type}>'
