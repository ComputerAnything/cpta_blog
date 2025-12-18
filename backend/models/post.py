from datetime import datetime, timezone

from app import db


class BlogPost(db.Model):
    __tablename__ = 'blog_posts'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    topic_tags = db.Column(db.String(255), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(tz=timezone.utc).replace(tzinfo=None))
    upvotes = db.Column(db.Integer, default=0, nullable=False)
    downvotes = db.Column(db.Integer, default=0, nullable=False)

    # Relationships
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
            "author": self.user.username if hasattr(self, 'user') and self.user else None
        }

    def __repr__(self):
        return f'<BlogPost {self.title}>'
