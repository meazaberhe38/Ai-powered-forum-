import React, { useState } from 'react';
import MarkdownEditor from './MarkdownEditor';
import MarkdownRenderer from './MarkdownRenderer';

const MarkdownEditorDemo = () => {
  const [markdownContent, setMarkdownContent] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const MIN_CHARACTERS = 10;

  const handleEditorChange = (markdown, charCount) => {
    setMarkdownContent(markdown);
    setCharacterCount(charCount);
    
    // Clear error when user types enough characters
    if (charCount >= MIN_CHARACTERS && error) {
      setError(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate minimum character count
    if (characterCount < MIN_CHARACTERS) {
      setError(`Please enter at least ${MIN_CHARACTERS} characters. You currently have ${characterCount}.`);
      return;
    }

    // Clear any errors
    setError(null);

    // Here you would typically send the data to your backend
    console.log('Submitting markdown content:', markdownContent);
    console.log('Character count:', characterCount);
    
    // Show success message or redirect
    alert('Content submitted successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Ask a Question
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field (example) */}
        <div>
          <label htmlFor="title" className="block text-lg font-semibold text-gray-900 mb-1">
            Title
          </label>
          <p className="text-sm text-gray-600 mb-2">
            Be specific and imagine you're asking a question to another person.
          </p>
          <input
            type="text"
            id="title"
            placeholder="e.g., How do I center a div in CSS?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
          />
        </div>

        {/* Markdown Editor */}
        <MarkdownEditor
          value={markdownContent}
          onChange={handleEditorChange}
          minCharacters={MIN_CHARACTERS}
          error={error}
        />

        {/* Preview Toggle */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          <span className="text-sm text-gray-600">
            {characterCount >= MIN_CHARACTERS ? (
              <span className="text-green-600 font-medium">✓ Ready to submit</span>
            ) : (
              <span>
                {MIN_CHARACTERS - characterCount} more character{MIN_CHARACTERS - characterCount !== 1 ? 's' : ''} needed
              </span>
            )}
          </span>
        </div>

        {/* Preview Section */}
        {showPreview && markdownContent && (
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preview
            </h3>
            <div className="bg-white p-4 rounded border border-gray-200">
              <MarkdownRenderer content={markdownContent} />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={characterCount < MIN_CHARACTERS}
          >
            Post Your Question
          </button>
          <button
            type="button"
            className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Example/Help Section */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📝 Formatting Tips
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Bold text:</strong> Select text and click <strong>B</strong> or use **text**</p>
          <p><strong>Italic text:</strong> Select text and click <em>I</em> or use *text*</p>
          <p><strong>Inline code:</strong> Select text and click <code className="bg-blue-100 px-1 rounded">{'<>'}</code> or use `code`</p>
          <p><strong>Code block:</strong> Use triple backticks ```</p>
          <p><strong>Links:</strong> Select text and click 🔗 or use [text](url)</p>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditorDemo;
