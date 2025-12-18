from app import db
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from models import BlogPost, Comment, Vote


post_routes = Blueprint('post_routes', __name__)

# GET ALL POSTS
@post_routes.route('/posts', methods=['GET'])
def get_posts():
    try:
        posts = BlogPost.query.all()
        return jsonify([post.to_dict() for post in posts]), 200
    except Exception as e:
        return jsonify({'msg': str(e)}), 500

# GET POST BY ID
@post_routes.route('/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404
    return jsonify(post.to_dict()), 200

# CREATE POST
@post_routes.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    data = request.get_json()
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    topic_tags = data.get('topic_tags', '').strip() if data.get('topic_tags') else None
    user_id = get_jwt_identity()

    # Validate title
    if not title:
        return jsonify({"msg": "Title is required"}), 400
    if len(title) > 200:
        return jsonify({"msg": "Title must be 200 characters or less"}), 400

    # Validate content
    if not content:
        return jsonify({"msg": "Content is required"}), 400
    if len(content) > 10000:
        return jsonify({"msg": "Content must be 10,000 characters or less"}), 400

    # Validate tags
    if topic_tags:
        tags = [tag.strip() for tag in topic_tags.split(',')]
        if len(tags) > 8:
            return jsonify({"msg": "Maximum 8 tags allowed"}), 400
        for tag in tags:
            if len(tag) > 30:
                return jsonify({"msg": "Each tag must be 30 characters or less"}), 400
            if not tag:
                return jsonify({"msg": "Empty tags are not allowed"}), 400

    new_post = BlogPost(title=title, content=content, topic_tags=topic_tags, user_id=user_id) # type: ignore
    db.session.add(new_post)
    db.session.commit()
    return jsonify(new_post.to_dict()), 201

# UPDATE POST
@post_routes.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    user_id = get_jwt_identity()
    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404
    if post.user_id != int(user_id):
        return jsonify({"msg": "You are not authorized to edit this post"}), 403

    data = request.get_json()
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    topic_tags = data.get('topic_tags', '').strip() if data.get('topic_tags') else None

    # Validate title
    if not title:
        return jsonify({"msg": "Title is required"}), 400
    if len(title) > 200:
        return jsonify({"msg": "Title must be 200 characters or less"}), 400

    # Validate content
    if not content:
        return jsonify({"msg": "Content is required"}), 400
    if len(content) > 10000:
        return jsonify({"msg": "Content must be 10,000 characters or less"}), 400

    # Validate tags
    if topic_tags:
        tags = [tag.strip() for tag in topic_tags.split(',')]
        if len(tags) > 8:
            return jsonify({"msg": "Maximum 8 tags allowed"}), 400
        for tag in tags:
            if len(tag) > 30:
                return jsonify({"msg": "Each tag must be 30 characters or less"}), 400
            if not tag:
                return jsonify({"msg": "Empty tags are not allowed"}), 400

    post.title = title
    post.content = content
    post.topic_tags = topic_tags
    db.session.commit()
    return jsonify({"msg": "Post updated successfully", "post": post.to_dict()}), 200

# DELETE POST
@post_routes.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    user_id = get_jwt_identity()
    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404
    if post.user_id != int(user_id):
        return jsonify({"msg": "You are not authorized to delete this post"}), 403
    db.session.delete(post)
    db.session.commit()
    return jsonify({"msg": "Post deleted successfully"}), 200

# UPVOTE POST
@post_routes.route('/posts/<int:post_id>/upvote', methods=['POST'])
@jwt_required()
def upvote_post(post_id):
    user_id = get_jwt_identity()
    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404
    existing_vote = Vote.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing_vote:
        if existing_vote.vote_type == 'upvote':
            db.session.delete(existing_vote)
            post.upvotes -= 1
        else:
            existing_vote.vote_type = 'upvote'
            post.upvotes += 1
            post.downvotes -= 1
    else:
        new_vote = Vote(user_id=user_id, post_id=post_id, vote_type='upvote') # type: ignore
        db.session.add(new_vote)
        post.upvotes += 1
    db.session.commit()
    return jsonify({"msg": "Post upvoted successfully", "upvotes": post.upvotes, "downvotes": post.downvotes}), 200

# DOWNVOTE POST
@post_routes.route('/posts/<int:post_id>/downvote', methods=['POST'])
@jwt_required()
def downvote_post(post_id):
    user_id = get_jwt_identity()
    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404
    existing_vote = Vote.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing_vote:
        if existing_vote.vote_type == 'downvote':
            db.session.delete(existing_vote)
            post.downvotes -= 1
        else:
            existing_vote.vote_type = 'downvote'
            post.downvotes += 1
            post.upvotes -= 1
    else:
        new_vote = Vote(user_id=user_id, post_id=post_id, vote_type='downvote') # type: ignore
        db.session.add(new_vote)
        post.downvotes += 1
    db.session.commit()
    return jsonify({"msg": "Post downvoted successfully", "upvotes": post.upvotes, "downvotes": post.downvotes}), 200

# COMMENT ON POST
@post_routes.route('/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    content = data.get('content', '').strip()

    # Validate comment content
    if not content:
        return jsonify({"msg": "Content is required"}), 400
    if len(content) > 2000:
        return jsonify({"msg": "Comment must be 2,000 characters or less"}), 400

    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404

    comment = Comment(content=content, user_id=user_id, post_id=post_id) # type: ignore
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201

# GET COMMENTS FOR POST
@post_routes.route('/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404
    comments = Comment.query.filter_by(post_id=post_id).all()
    return jsonify([comment.to_dict() for comment in comments]), 200

# DELETE COMMENT
@post_routes.route('/posts/<int:post_id>/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(post_id, comment_id):
    user_id = get_jwt_identity()
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({"msg": "Comment not found"}), 404
    if comment.post_id != post_id:
        return jsonify({"msg": "Comment does not belong to this post"}), 400
    if comment.user_id != int(user_id):
        return jsonify({"msg": "You are not authorized to delete this comment"}), 403
    db.session.delete(comment)
    db.session.commit()
    return jsonify({"msg": "Comment deleted successfully"}), 200
