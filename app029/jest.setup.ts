import '@testing-library/jest-dom';
import React from 'react';

// Mock react-markdown for tests (ESM compatibility issue)
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: string }) {
    return React.createElement('div', {}, children);
  };
});

jest.mock('remark-gfm', () => {
  return function remarkGfm() {
    return () => {};
  };
});
