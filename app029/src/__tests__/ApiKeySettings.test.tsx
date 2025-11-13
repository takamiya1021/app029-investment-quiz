import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApiKeySettings from '@/app/components/settings/ApiKeySettings';
import { saveApiKey, clearApiKey, hasApiKey } from '@/lib/apiKeyManager';

// Mock apiKeyManager
jest.mock('@/lib/apiKeyManager');

const mockSaveApiKey = saveApiKey as jest.MockedFunction<typeof saveApiKey>;
const mockClearApiKey = clearApiKey as jest.MockedFunction<typeof clearApiKey>;
const mockHasApiKey = hasApiKey as jest.MockedFunction<typeof hasApiKey>;

describe('ApiKeySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders API key input form', () => {
    mockHasApiKey.mockReturnValue(false);

    render(<ApiKeySettings />);

    expect(screen.getByLabelText(/Gemini API Key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument();
  });

  it('shows API key status as "未設定" when no key exists', () => {
    mockHasApiKey.mockReturnValue(false);

    render(<ApiKeySettings />);

    expect(screen.getByText(/未設定/i)).toBeInTheDocument();
  });

  it('shows API key status as "設定済み" when key exists', () => {
    mockHasApiKey.mockReturnValue(true);

    render(<ApiKeySettings />);

    expect(screen.getByText(/設定済み/i)).toBeInTheDocument();
  });

  it('saves API key when save button is clicked', async () => {
    mockHasApiKey.mockReturnValue(false);

    render(<ApiKeySettings />);

    const input = screen.getByLabelText(/Gemini API Key/i);
    const saveButton = screen.getByRole('button', { name: /保存/i });

    fireEvent.change(input, { target: { value: 'test-api-key-12345' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveApiKey).toHaveBeenCalledWith('test-api-key-12345');
    });

    expect(screen.getByText(/保存しました/i)).toBeInTheDocument();
  });

  it('shows error message when trying to save whitespace-only key', async () => {
    mockHasApiKey.mockReturnValue(false);

    render(<ApiKeySettings />);

    const input = screen.getByLabelText(/Gemini API Key/i);
    const saveButton = screen.getByRole('button', { name: /保存/i });

    // 空白文字のみを入力（ボタンはenabledになる）
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/API key cannot be empty/i)).toBeInTheDocument();
    });
  });

  it('clears API key when clear button is clicked', async () => {
    mockHasApiKey.mockReturnValue(true);

    render(<ApiKeySettings />);

    const clearButton = screen.getByRole('button', { name: /クリア|削除/i });

    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockClearApiKey).toHaveBeenCalled();
    });

    expect(screen.getByText(/削除しました/i)).toBeInTheDocument();
  });

  it('disables save button when input is empty', () => {
    mockHasApiKey.mockReturnValue(false);

    render(<ApiKeySettings />);

    const saveButton = screen.getByRole('button', { name: /保存/i });

    expect(saveButton).toBeDisabled();
  });

  it('enables save button when input has value', () => {
    mockHasApiKey.mockReturnValue(false);

    render(<ApiKeySettings />);

    const input = screen.getByLabelText(/Gemini API Key/i);
    const saveButton = screen.getByRole('button', { name: /保存/i });

    fireEvent.change(input, { target: { value: 'test-key' } });

    expect(saveButton).not.toBeDisabled();
  });

  it('uses password input type for API key field', () => {
    mockHasApiKey.mockReturnValue(false);

    render(<ApiKeySettings />);

    const input = screen.getByLabelText(/Gemini API Key/i);

    expect(input).toHaveAttribute('type', 'password');
  });
});
