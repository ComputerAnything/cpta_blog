import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPosts,
  fetchComments,
  addComment,
  deleteComment,
  upvotePost,
  downvotePost,
} from '../../redux/slices/blogSlice';
import '../../styles/PostDetail.css';

const PostDetail = () => {
  const { postId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { posts, comments, error } = useSelector((state) => state.blog);
  const [commentContent, setCommentContent] = useState('');
  const commentTextareaRef = useRef(null);
  const currentUserId = parseInt(localStorage.getItem('userId'), 10);

  // Fetch post and comments on mount
  useEffect(() => {
    dispatch(fetchPosts());
    dispatch(fetchComments(postId));
  }, [dispatch, postId]);

  const post = posts.find((p) => String(p.id) === String(postId));

  // Voting handlers
  const handleUpvote = () => dispatch(upvotePost(postId));
  const handleDownvote = () => dispatch(downvotePost(postId));

  // Comment handlers
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    await dispatch(addComment({ postId, content: commentContent }));
    setCommentContent('');
  };

  const handleDeleteComment = (commentId) => {
    dispatch(deleteComment({ postId, commentId }));
  };

  // Share handler
  const handleShare = () => {
    const shareData = {
      title: post.title,
      text: post.content,
      url: `${window.location.origin}/posts/${postId}`,
    };
    if (navigator.share) {
      navigator.share(shareData).catch((err) => console.error('Error sharing:', err));
    } else {
      alert('Sharing is not supported in this browser. Copy the URL to share.');
    }
  };

  // Focus comment textarea
  const focusCommentTextarea = () => {
    if (commentTextareaRef.current) commentTextareaRef.current.focus();
  };

  // Vote color
  const calculateScaleColor = (upvotes, downvotes) => {
    const totalVotes = upvotes + downvotes;
    if (totalVotes === 0) return '#888';
    const ratio = upvotes / totalVotes;
    const red = Math.round(255 * (1 - ratio));
    const green = Math.round(255 * ratio);
    return `rgb(${red}, ${green}, 0)`;
  };

  if (error) return <p>{error}</p>;
  if (!post) return <p>Loading...</p>;

  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="post-detail-container">
      {/* Post Header */}
      <div className="post-header">
        <p className="post-header-meta">
          Posted by{' '}
          <Link to={`/profile/${post.user_id}`} className="post-header-meta-link">
            {post.author}
          </Link>{' '}
          on {new Date(post.created_at).toLocaleDateString()}
        </p>
        <h1 className="post-header-title">{post.title}</h1>
        {post.topic_tags && (
          <div className="post-header-tags">
            {post.topic_tags.split(',').map((tag, index) => (
              <span key={index} className="post-header-tag">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="post-content">
        <ReactMarkdown children={post.content} components={markdownComponents} />
      </div>

      {/* Voting/Action Section */}
      <div className="vote-section">
        <button className="vote-button" onClick={handleUpvote}>▲</button>
        <p
          className="vote-count"
          style={{
            color: calculateScaleColor(post.upvotes, post.downvotes),
          }}
        >
          {post.upvotes - post.downvotes > 0 ? '+' : ''}
          {post.upvotes - post.downvotes} (total votes: {post.upvotes + post.downvotes})
        </p>
        <button className="vote-button" onClick={handleDownvote}>▼</button>
        <div className="post-action-buttons">
          <button className="post-action-button" onClick={focusCommentTextarea}>
            Leave Comment
          </button>
          <button className="post-action-button" onClick={handleShare}>
            Share Post
          </button>
          <button className="post-action-button" onClick={() => navigate('/posts')}>
            Back to Blog
          </button>
          {post.user_id === currentUserId && (
            <button
              className="post-action-button"
              onClick={() => navigate(`/edit-post/${post.id}`)}
            >
              Edit Original Post
            </button>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <h2 className="comments-section-title">Comments</h2>
        <ul>
          {comments.map((comment) => (
            <li key={comment.id} className="comment-item">
              <p className="comment-text">
                <strong>{comment.username}</strong> commented:
              </p>
              <ReactMarkdown children={comment.content} components={markdownComponents} />
              {comment.user_id === currentUserId && (
                <button
                  className="delete-comment-button"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <textarea
            ref={commentTextareaRef}
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Write a comment..."
            required
            className="comment-textarea"
          />
          <button type="submit" className="comment-submit-button">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostDetail;
