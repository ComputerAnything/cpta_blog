// ============================================================================
// Shared Styled Components
// ============================================================================

import styled from 'styled-components'
import { colors, transitions, shadows  } from './colors'

// ----------------------------------------------------------------------------
// Core Layout Components
// ----------------------------------------------------------------------------

export const PageContainer = styled.div`
  min-height: calc(100vh - 180px);
  background: ${colors.background};
  color: ${colors.text.primary};
  padding: 2rem;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${colors.primary}, transparent);
    box-shadow: 0 0 8px rgba(2, 196, 60, 0.4);
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`

export const BlogPostCard = styled.div`
  background: ${colors.backgroundAlt};
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: ${transitions.default};
  cursor: pointer;
  box-shadow: ${shadows.medium};

  &:hover {
    border-color: ${colors.primary};
    box-shadow: ${shadows.large};
    transform: translateY(-2px);
  }
`

export const PostTitle = styled.h2`
  font-size: 2.5rem;
  color: ${colors.primary};
  margin: 0;
  flex: 1;
`

export const VoteDisplay = styled.div<{ $netVotes: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1rem;
  background: ${colors.backgroundDark};
  border-radius: 8px;
  min-width: 80px;

  .net-votes {
    font-size: 1.5rem;
    font-weight: bold;
    color: ${props => {
      if (props.$netVotes === 0) return colors.text.muted
      return props.$netVotes > 0 ? colors.success : colors.danger
    }};
  }

  .total-votes {
    font-size: 0.85rem;
    color: ${colors.text.muted};
    margin-top: 0.25rem;
  }
`

export const PostMeta = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: ${colors.text.muted};
  margin-bottom: 1rem;

  a {
    color: ${colors.primary};
    text-decoration: none;
    transition: ${transitions.default};

    &:hover {
      color: ${colors.primaryDark};
      text-decoration: underline;
    }
  }
`

export const PostContent = styled.div`
  color: ${colors.text.primary};
  line-height: 1.6;
  margin-bottom: 1rem;

  h1, h2, h3, h4, h5, h6 {
    color: #ffffff !important;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.2rem; }
  h4 { font-size: 1.1rem; }
  h5 { font-size: 1rem; }
  h6 { font-size: 0.9rem; }

  p {
    margin-bottom: 1rem;
  }

  code {
    background: ${colors.primary}20;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }

  pre {
    background: ${colors.backgroundDark};
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
  }
`

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

export const Tag = styled.span`
  background: ${colors.info}20;
  border: 1px solid ${colors.info};
  color: ${colors.info};
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
`

export const NoResults = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${colors.text.muted};
  font-size: 1.1rem;
`

export const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${colors.text.muted};
  font-size: 1.1rem;
`

export const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: -1rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`

export const ActionButton = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background: ${colors.backgroundDark};
  border: 1px solid ${colors.borderLight};
  border-radius: 8px;
  color: ${colors.text.primary};
  font-size: 0.9rem;
  cursor: pointer;
  transition: ${transitions.default};
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${colors.primary};
    border-color: ${colors.primary};
    color: ${colors.backgroundDark};
    transform: translateY(-1px);
    box-shadow: ${shadows.button};
  }

  &.danger {
    border-color: ${colors.danger};
    color: ${colors.danger};

    &:hover {
      background: ${colors.danger};
      color: ${colors.backgroundDark};
    }
  }

  &:last-child {
    margin-bottom: 0;
  }

  i {
    font-size: 1rem;
  }
`
