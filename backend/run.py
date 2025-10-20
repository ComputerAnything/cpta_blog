#!/usr/bin/env python3
import os
import sys


# Add the parent directory to the Python path so 'backend' module can be found
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.extensions import db
from backend.models import BlogPost, Comment, User, Vote


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
    app.run(debug=True, host='0.0.0.0', port=5000)
