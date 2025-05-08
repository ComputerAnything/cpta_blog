from app import create_app, db  # Import your Flask app factory
from models import BlogPost, Vote


# Create the Flask app
app = create_app()

def reset_votes(post_id):
    with app.app_context():  # Push the application context
        # Remove all votes for the post
        Vote.query.filter_by(post_id=post_id).delete()

        # Reset upvotes and downvotes in the blog_posts table
        post = BlogPost.query.get(post_id)
        if post:
            post.upvotes = 0
            post.downvotes = 0
            db.session.commit()
            print(f"Votes reset for post ID {post_id}")
        else:
            print(f"Post with ID {post_id} not found.")

if __name__ == "__main__":
    reset_votes(12)  # Replace 12 with the actual post ID
