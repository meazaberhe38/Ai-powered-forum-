import { test } from 'node:test';
import assert from 'node:assert';
import { chunkText } from '../src/utils/chunking.js';

test('chunkText returns no chunks for empty string', () => {
  assert.deepStrictEqual(chunkText(''), []);
});

test('chunkText returns a single chunk when text is shorter than chunkSize', () => {
  const text = 'Hello world';
  assert.deepStrictEqual(chunkText(text, 50, 10), [text]);
});

test('chunkText splits text into overlapping chunks', () => {
  const text = '0123456789ABCDEFGHIJKLMNOPQRSTUVWX';
  const chunks = chunkText(text, 10, 3);

  assert.deepStrictEqual(chunks, [
    '0123456789',
    '789ABCD',
    'DEFGHIJKL',
    'KLMNOPQRS',
    'RSTUVWX',
  ]);
});

test('chunkText enforces positive integer chunkSize and non-negative overlap', () => {
  assert.throws(() => chunkText('text', 0, 0), RangeError);
  assert.throws(() => chunkText('text', 10.5, 2), RangeError);
  assert.throws(() => chunkText('text', 10, -1), RangeError);
});

test('chunkText clamps overlap that is equal or greater than chunkSize', () => {
  const text = 'abcdefghij';
  const chunks = chunkText(text, 4, 6);
  assert.deepStrictEqual(chunks, ['abcd', 'cdef', 'efgh', 'ghij']);
});
