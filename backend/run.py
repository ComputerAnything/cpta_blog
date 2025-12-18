#!/usr/bin/env python3
import os

from app import create_app, db
from models import BlogPost, Comment, User, Vote


app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'BlogPost': BlogPost,
        'Vote': Vote,
        'Comment': Comment
    }

if __name__ == '__main__':
    # Only for local development; in production we use gunicorn WSGI server
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    port = int(os.environ.get('PORT', 5000))  # Default to 5000 for development
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
