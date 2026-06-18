import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // You can change to other themes
import './MarkdownRenderer.css';

const MarkdownRenderer = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom rendering for code blocks
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className={className}>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          },
          // Custom rendering for links
          a({ node, children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="markdown-link"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Custom rendering for paragraphs
          p({ node, children, ...props }) {
            return (
              <p className="markdown-paragraph" {...props}>
                {children}
              </p>
            );
          },
          // Custom rendering for lists
          ul({ node, children, ...props }) {
            return (
              <ul className="markdown-list" {...props}>
                {children}
              </ul>
            );
          },
          ol({ node, children, ...props }) {
            return (
              <ol className="markdown-ordered-list" {...props}>
                {children}
              </ol>
            );
          },
          li({ node, children, ...props }) {
            return (
              <li className="markdown-list-item" {...props}>
                {children}
              </li>
            );
          },
          // Custom rendering for strong/bold
          strong({ node, children, ...props }) {
            return (
              <strong className="markdown-bold" {...props}>
                {children}
              </strong>
            );
          },
          // Custom rendering for emphasis/italic
          em({ node, children, ...props }) {
            return (
              <em className="markdown-italic" {...props}>
                {children}
              </em>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
