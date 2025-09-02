import { render, screen } from '@testing-library/react';
import App from './App';

test('renders S. Sen & Associates app', () => {
  render(<App />);
  const titleElement = screen.getByText(/S. Sen & Associates/i);
  expect(titleElement).toBeInTheDocument();
});
