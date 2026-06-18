import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from './MarkdownEditor';
import MarkdownRenderer from './MarkdownRenderer';

describe('MarkdownEditor', () => {
  it('renders with default props', () => {
    render(<MarkdownEditor />);
    expect(screen.getByText('What are the details of your problem?')).toBeInTheDocument();
    expect(screen.getByText(/Minimum 10 characters/i)).toBeInTheDocument();
  });

  it('displays character count', () => {
    render(<MarkdownEditor />);
    expect(screen.getByText('0 characters')).toBeInTheDocument();
  });

  it('calls onChange when content is typed', async () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor onChange={handleChange} />);
    
    const editor = screen.getByRole('textbox');
    await userEvent.type(editor, 'Hello world');
    
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
    });
  });

  it('shows error message when error prop is provided', () => {
    const errorMessage = 'Content is too short';
    render(<MarkdownEditor error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('displays toolbar buttons', () => {
    render(<MarkdownEditor />);
    
    // Check if toolbar buttons are present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('updates character count as user types', async () => {
    render(<MarkdownEditor />);
    
    const editor = screen.getByRole('textbox');
    await userEvent.type(editor, 'Test');
    
    await waitFor(() => {
      expect(screen.getByText(/4 character/)).toBeInTheDocument();
    });
  });

  it('displays placeholder text when empty', () => {
    const placeholder = 'Enter your content here';
    render(<MarkdownEditor placeholder={placeholder} />);
    
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('data-placeholder', placeholder);
  });
});

describe('MarkdownRenderer', () => {
  it('renders markdown content', () => {
    const content = '**Bold text**';
    render(<MarkdownRenderer content={content} />);
    
    const boldElement = screen.getByText('Bold text');
    expect(boldElement.tagName).toBe('STRONG');
  });

  it('renders italic text', () => {
    const content = '*Italic text*';
    render(<MarkdownRenderer content={content} />);
    
    const italicElement = screen.getByText('Italic text');
    expect(italicElement.tagName).toBe('EM');
  });

  it('renders inline code', () => {
    const content = '`const x = 10;`';
    render(<MarkdownRenderer content={content} />);
    
    const codeElement = screen.getByText('const x = 10;');
    expect(codeElement.tagName).toBe('CODE');
  });

  it('renders links with proper attributes', () => {
    const content = '[Google](https://google.com)';
    render(<MarkdownRenderer content={content} />);
    
    const linkElement = screen.getByText('Google');
    expect(linkElement.tagName).toBe('A');
    expect(linkElement).toHaveAttribute('href', 'https://google.com');
    expect(linkElement).toHaveAttribute('target', '_blank');
    expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders code blocks', () => {
    const content = '```javascript\nconst x = 10;\n```';
    render(<MarkdownRenderer content={content} />);
    
    const codeBlock = screen.getByText('const x = 10;');
    expect(codeBlock.closest('pre')).toBeInTheDocument();
  });

  it('renders lists', () => {
    const content = `
- Item 1
- Item 2
- Item 3
    `;
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders paragraphs', () => {
    const content = 'First paragraph\n\nSecond paragraph';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-markdown-class';
    const { container } = render(
      <MarkdownRenderer content="Test" className={customClass} />
    );
    
    const markdownContainer = container.querySelector('.markdown-content');
    expect(markdownContainer).toHaveClass(customClass);
  });

  it('handles empty content gracefully', () => {
    render(<MarkdownRenderer content="" />);
    const container = screen.getByText('', { selector: '.markdown-content' });
    expect(container).toBeInTheDocument();
  });

  it('renders complex markdown with multiple elements', () => {
    const content = `
# Heading

**Bold text** and *italic text*

\`inline code\` here

- List item 1
- List item 2

[Link](https://example.com)
    `;
    
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('Bold text')).toBeInTheDocument();
    expect(screen.getByText('italic text')).toBeInTheDocument();
    expect(screen.getByText('inline code')).toBeInTheDocument();
    expect(screen.getByText('List item 1')).toBeInTheDocument();
    expect(screen.getByText('Link')).toBeInTheDocument();
  });
});
