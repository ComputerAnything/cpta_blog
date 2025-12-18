from app import db


class Vote(db.Model):
    __tablename__ = 'votes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id', ondelete='CASCADE'), nullable=False)
    vote_type = db.Column(db.String(10), nullable=False)  # 'upvote' or 'downvote'

    def __repr__(self):
        return f'<Vote user_id={self.user_id} post_id={self.post_id} vote_type={self.vote_type}>'
