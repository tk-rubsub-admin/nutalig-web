import { screen } from '@testing-library/react';
import { renderComponent } from 'tests/utils';
import App from './App';

describe('App', () => {
  it('should show login page if user is not authenticated', async () => {
    renderComponent(<App />);
    expect(await screen.findByText(/sign in/i)).toBeInTheDocument();
  });
});
