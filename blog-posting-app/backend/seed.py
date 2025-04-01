from app import app, db
from models import User, BlogPost


# Push the application context
with app.app_context():
    # Create a test user
    user = User(username="testuser", email="test@example.com", password="hashed_password")
    db.session.add(user)
    db.session.commit()

    # Create a test blog post
    post = BlogPost(title="First Post", content="This is a test post.", user_id=user.id)
    db.session.add(post)
    db.session.commit()

    print("Database seeded!")
