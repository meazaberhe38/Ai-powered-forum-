import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Code, Link as LinkIcon } from 'lucide-react';
import './MarkdownEditor.css';

const MarkdownEditor = ({ 
  value = '', 
  onChange, 
  minCharacters = 10,
  placeholder = "Include all the information someone would need to answer your question... You can use Markdown to format your code!",
  error = null
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable heading for simplicity
        horizontalRule: false,
        blockquote: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
        style: 'background-color: var(--surface); color: var(--text-primary);'
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editorToMarkdown(editor);
      const text = editor.getText();
      setCharacterCount(text.length);
      
      if (onChange) {
        onChange(markdown, text.length);
      }
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  // Update character count on mount
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      setCharacterCount(text.length);
    }
  }, [editor]);

  // Convert editor content to markdown
  const editorToMarkdown = (editor) => {
    const json = editor.getJSON();
    return jsonToMarkdown(json);
  };

  // Simple JSON to Markdown converter
  const jsonToMarkdown = (node, depth = 0) => {
    if (!node) return '';

    let markdown = '';

    if (node.type === 'text') {
      let text = node.text;
      if (node.marks) {
        node.marks.forEach(mark => {
          if (mark.type === 'bold') text = `**${text}**`;
          if (mark.type === 'italic') text = `*${text}*`;
          if (mark.type === 'code') text = `\`${text}\``;
          if (mark.type === 'link') text = `[${text}](${mark.attrs.href})`;
        });
      }
      return text;
    }

    if (node.content) {
      const contentMarkdown = node.content.map(child => jsonToMarkdown(child, depth + 1)).join('');
      
      switch (node.type) {
        case 'paragraph':
          markdown = contentMarkdown + '\n\n';
          break;
        case 'codeBlock':
          const language = node.attrs?.language || '';
          markdown = `\`\`\`${language}\n${contentMarkdown}\`\`\`\n\n`;
          break;
        case 'bulletList':
          markdown = contentMarkdown + '\n';
          break;
        case 'orderedList':
          markdown = contentMarkdown + '\n';
          break;
        case 'listItem':
          const indent = '  '.repeat(Math.max(0, depth - 2));
          markdown = `${indent}- ${contentMarkdown.trim()}\n`;
          break;
        default:
          markdown = contentMarkdown;
      }
    }

    return markdown;
  };

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ToolbarButton = ({ onClick, active, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.5rem',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: active ? 'var(--primary-light)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all var(--transition-fast)'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
      title={title}
    >
      {children}
    </button>
  );

  if (!editor) return null;

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '0.5rem' }}>
        <h3 style={{ 
          fontSize: 'var(--text-lg)', 
          fontWeight: 'var(--font-semibold)', 
          color: 'var(--text-primary)', 
          marginBottom: '0.25rem' 
        }}>
          What are the details of your problem?
        </h3>
        <p style={{ 
          fontSize: 'var(--text-sm)', 
          color: 'var(--text-secondary)' 
        }}>
          Introduce the problem and expand on what you put in the title. Minimum {minCharacters} characters.
        </p>
      </div>

      {/* Editor Container */}
      <div
        style={{
          border: `1px solid ${isFocused ? 'var(--primary)' : error ? 'var(--error)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--surface)',
          transition: 'all var(--transition-fast)',
          boxShadow: isFocused ? '0 0 0 2px rgba(249, 115, 22, 0.2)' : 'none'
        }}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-container-low)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold size={18} strokeWidth={2.5} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic size={18} strokeWidth={2.5} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive('code')}
              title="Inline Code (Ctrl+E)"
            >
              <Code size={18} strokeWidth={2.5} />
            </ToolbarButton>

            <ToolbarButton
              onClick={setLink}
              active={editor.isActive('link')}
              title="Add Link (Ctrl+K)"
            >
              <LinkIcon size={18} strokeWidth={2.5} />
            </ToolbarButton>
          </div>

          {/* Character Counter */}
          <div style={{ 
            fontSize: 'var(--text-sm)', 
            color: 'var(--text-tertiary)' 
          }}>
            {characterCount} character{characterCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>

      {/* Error Message */}
      {error && (
        <p style={{ 
          marginTop: '0.5rem', 
          fontSize: 'var(--text-sm)', 
          color: 'var(--error)' 
        }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default MarkdownEditor;
