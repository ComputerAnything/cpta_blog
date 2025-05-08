from .auth_routes import auth_routes
from .post_routes import post_routes
from .user_routes import user_routes


all_routes = [auth_routes, user_routes, post_routes]
