from app import db
from models import BlogPost


# Fix upvotes and downvotes for existing records
def fix_upvotes_downvotes():
    posts = BlogPost.query.all()
    for post in posts:
        if post.upvotes is None:
            post.upvotes = 0
        if post.downvotes is None:
            post.downvotes = 0
    db.session.commit()
    print("Upvotes and downvotes fixed for all posts.")

if __name__ == "__main__":
    fix_upvotes_downvotes()
