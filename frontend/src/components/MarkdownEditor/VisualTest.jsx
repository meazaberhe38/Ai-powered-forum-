import React, { useState } from 'react';
import MarkdownEditor from './MarkdownEditor';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * Visual Test Component
 * 
 * This component demonstrates all features and states of the Markdown Editor.
 * Use this to verify the UI matches your requirements.
 */
const VisualTest = () => {
  const [content1, setContent1] = useState('');
  const [count1, setCount1] = useState(0);

  const [content2, setContent2] = useState('');
  const [count2, setCount2] = useState(0);
  const [error2, setError2] = useState('Please enter at least 10 characters');

  const [content3, setContent3] = useState('This is **bold text**, this is *italic text*, and this is `inline code`.\n\n[Here is a link](https://example.com)\n\n```javascript\nconst greeting = "Hello, World!";\nconsole.log(greeting);\n```\n\n- List item 1\n- List item 2\n- List item 3');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Markdown Editor Visual Test
          </h1>
          <p className="text-lg text-gray-600">
            Verify all features and states match your requirements
          </p>
        </div>

        {/* Test 1: Default State */}
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Test 1: Default State
            </h2>
            <p className="text-gray-600">
              Empty editor with placeholder text. Try typing and using the toolbar buttons.
            </p>
          </div>
          
          <MarkdownEditor
            value={content1}
            onChange={(markdown, count) => {
              setContent1(markdown);
              setCount1(count);
            }}
            minCharacters={10}
          />

          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Current State:</h3>
            <p className="text-sm">Character Count: {count1}</p>
            <p className="text-sm">Valid: {count1 >= 10 ? '✅ Yes' : '❌ No (need 10+ characters)'}</p>
          </div>
        </section>

        {/* Test 2: Error State */}
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Test 2: Error State
            </h2>
            <p className="text-gray-600">
              Editor with validation error. Notice the red border.
            </p>
          </div>
          
          <MarkdownEditor
            value={content2}
            onChange={(markdown, count) => {
              setContent2(markdown);
              setCount2(count);
              if (count >= 10) {
                setError2(null);
              } else {
                setError2(`Please enter at least ${10 - count} more characters`);
              }
            }}
            minCharacters={10}
            error={error2}
          />

          <div className="mt-4 p-4 bg-red-50 rounded">
            <h3 className="font-semibold mb-2 text-red-900">Error State:</h3>
            <p className="text-sm text-red-700">Character Count: {count2}</p>
            <p className="text-sm text-red-700">Error: {error2 || 'None'}</p>
          </div>
        </section>

        {/* Test 3: Pre-filled Content */}
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Test 3: Pre-filled Content
            </h2>
            <p className="text-gray-600">
              Editor with existing Markdown content. Edit it to see real-time updates.
            </p>
          </div>
          
          <MarkdownEditor
            value={content3}
            onChange={(markdown) => setContent3(markdown)}
            minCharacters={10}
          />
        </section>

        {/* Test 4: Markdown Rendering */}
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Test 4: Markdown Rendering
            </h2>
            <p className="text-gray-600">
              How the content from Test 3 looks when rendered.
            </p>
          </div>
          
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <MarkdownRenderer content={content3} />
          </div>
        </section>

        {/* Feature Checklist */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Feature Checklist
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Visual Elements</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ Header: "What are the details of your problem?"</li>
                <li>✅ Subtext with minimum character requirement</li>
                <li>✅ White background with gray border</li>
                <li>✅ Orange border on focus (click inside editor to test)</li>
                <li>✅ Red border on error (see Test 2)</li>
                <li>✅ Gray toolbar background</li>
                <li>✅ 4 toolbar buttons: B, I, &lt;&gt;, 🔗</li>
                <li>✅ Real-time character counter</li>
                <li>✅ Placeholder text when empty</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Functionality</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ Bold: Select text, click B or press Ctrl+B</li>
                <li>✅ Italic: Select text, click I or press Ctrl+I</li>
                <li>✅ Code: Select text, click &lt;&gt; or press Ctrl+E</li>
                <li>✅ Link: Select text, click 🔗 or press Ctrl+K</li>
                <li>✅ Character counting updates live</li>
                <li>✅ Validation shows errors</li>
                <li>✅ Output is Markdown format</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">Rendering</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ Bold text renders correctly</li>
                <li>✅ Italic text renders correctly</li>
                <li>✅ Inline code has background</li>
                <li>✅ Code blocks have syntax highlighting</li>
                <li>✅ Links open in new tab</li>
                <li>✅ Lists render properly</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testing Instructions */}
        <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Testing Instructions
          </h2>
          
          <div className="space-y-4 text-blue-900">
            <div>
              <h3 className="font-semibold mb-2">1. Test Focus State</h3>
              <p className="text-sm">Click inside Test 1 editor. The border should turn orange with a subtle ring effect.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Test Toolbar Buttons</h3>
              <p className="text-sm mb-1">In Test 1:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Type some text</li>
                <li>• Select the text</li>
                <li>• Click the B button - text becomes bold</li>
                <li>• Click I button - text becomes italic</li>
                <li>• Click &lt;&gt; button - text becomes code</li>
                <li>• Click 🔗 button - prompts for URL</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Test Character Counter</h3>
              <p className="text-sm">Type in Test 1 or Test 2. Watch the character count update in real-time in the toolbar.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Test Error State</h3>
              <p className="text-sm">Test 2 shows error state with red border. Type 10+ characters to clear the error.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Test Markdown Output</h3>
              <p className="text-sm">Edit content in Test 3, then check how it renders in Test 4.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6. Test Keyboard Shortcuts</h3>
              <p className="text-sm">Try Ctrl+B (bold), Ctrl+I (italic), Ctrl+E (code), Ctrl+K (link)</p>
            </div>
          </div>
        </section>

        {/* Styling Reference */}
        <section className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Color Reference
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="w-full h-12 bg-white border border-gray-300 rounded mb-2"></div>
              <p className="text-sm font-semibold">Default Border</p>
              <p className="text-xs text-gray-600">border-gray-300</p>
            </div>

            <div>
              <div className="w-full h-12 bg-white border-2 border-orange-500 rounded mb-2 ring-2 ring-orange-200"></div>
              <p className="text-sm font-semibold">Focus State</p>
              <p className="text-xs text-gray-600">border-orange-500 + ring</p>
            </div>

            <div>
              <div className="w-full h-12 bg-white border-2 border-red-500 rounded mb-2"></div>
              <p className="text-sm font-semibold">Error State</p>
              <p className="text-xs text-gray-600">border-red-500</p>
            </div>

            <div>
              <div className="w-full h-12 bg-gray-50 rounded mb-2"></div>
              <p className="text-sm font-semibold">Toolbar Background</p>
              <p className="text-xs text-gray-600">bg-gray-50</p>
            </div>

            <div>
              <div className="w-full h-12 bg-gray-200 rounded mb-2 flex items-center justify-center">
                <span className="text-orange-600 font-bold">B</span>
              </div>
              <p className="text-sm font-semibold">Active Button</p>
              <p className="text-xs text-gray-600">bg-gray-200 + text-orange-600</p>
            </div>

            <div>
              <div className="w-full h-12 bg-white rounded mb-2 flex items-center justify-center border border-gray-300">
                <span className="text-gray-700 font-bold">I</span>
              </div>
              <p className="text-sm font-semibold">Inactive Button</p>
              <p className="text-xs text-gray-600">text-gray-700</p>
            </div>
          </div>
        </section>

        {/* Success Message */}
        <section className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            All Features Implemented!
          </h2>
          <p className="text-green-800">
            If all tests above work correctly, the Markdown Editor is ready for production use.
          </p>
        </section>
      </div>
    </div>
  );
};

export default VisualTest;
