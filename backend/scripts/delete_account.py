#!/usr/bin/env python3
"""
Script to manually delete a user account and all associated data.

Usage:
    python scripts/delete_account.py <username_or_email>

Example:
    python scripts/delete_account.py john_doe
    python scripts/delete_account.py user@example.com
"""

from pathlib import Path
import sys


# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from models.comment import Comment
from models.post import BlogPost
from models.user import User
from models.vote import Vote


def delete_user_account(identifier: str) -> bool:
    """
    Delete a user account and all associated data.

    Args:
        identifier: Username or email of the user to delete

    Returns:
        bool: True if successful, False otherwise
    """
    app = create_app()

    with app.app_context():
        # Find user by username or email
        user = User.query.filter(
            (User.username == identifier.lower().strip()) |
            (User.email == identifier.lower().strip())
        ).first()

        if not user:
            print(f"❌ User not found: {identifier}")
            return False

        # Confirm deletion
        print("\n⚠️  WARNING: You are about to delete the following account:\n")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Created: {user.created_at}")
        print("\n   This will permanently delete:")

        # Count associated data
        posts_count = BlogPost.query.filter_by(user_id=user.id).count()
        comments_count = Comment.query.filter_by(user_id=user.id).count()
        votes_count = Vote.query.filter_by(user_id=user.id).count()

        print(f"   - {posts_count} blog post(s)")
        print(f"   - {comments_count} comment(s)")
        print(f"   - {votes_count} vote(s)")
        print("\n⚠️  THIS ACTION CANNOT BE UNDONE!\n")

        confirmation = input("Type 'DELETE' to confirm: ").strip()

        if confirmation != 'DELETE':
            print("❌ Deletion cancelled.")
            return False

        try:
            # Delete all associated data
            Vote.query.filter_by(user_id=user.id).delete(synchronize_session=False)
            Comment.query.filter_by(user_id=user.id).delete(synchronize_session=False)
            BlogPost.query.filter_by(user_id=user.id).delete(synchronize_session=False)

            # Delete user
            db.session.delete(user)
            db.session.commit()

            print(f"\n✅ Successfully deleted account for {user.username}")
            print(f"   - Deleted {posts_count} blog post(s)")
            print(f"   - Deleted {comments_count} comment(s)")
            print(f"   - Deleted {votes_count} vote(s)")

            return True

        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error deleting account: {e}")
            return False


def main():
    """Main entry point for the script."""
    if len(sys.argv) != 2:
        print("Usage: python scripts/delete_account.py <username_or_email>")
        print("\nExample:")
        print("  python scripts/delete_account.py john_doe")
        print("  python scripts/delete_account.py user@example.com")
        sys.exit(1)

    identifier = sys.argv[1]
    success = delete_user_account(identifier)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
