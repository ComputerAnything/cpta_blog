from datetime import datetime, timezone

from app import db


class Comment(db.Model):
    __tablename__ = 'comments'

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(tz=timezone.utc).replace(tzinfo=None))

    def to_dict(self):
        return {
            "id": self.id,
            "content": self.content,
            "user_id": self.user_id,
            "username": self.user.username if hasattr(self, 'user') and self.user else None,
            "post_id": self.post_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<Comment id={self.id} post_id={self.post_id}>'
