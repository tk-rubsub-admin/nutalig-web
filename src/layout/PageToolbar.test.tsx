import { screen } from '@testing-library/react';
import { renderComponent } from 'tests/utils';
import PageToolbar from 'layout/PageToolbar';

describe('PageToolbar', () => {
  it('should render correct children', () => {
    renderComponent(<PageToolbar>hello</PageToolbar>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('should have correct styling', () => {
    renderComponent(<PageToolbar>styles</PageToolbar>);
    expect(screen.getByText('styles')).toHaveStyle('display: flex; justify-content: flex-end;');
  });
});
