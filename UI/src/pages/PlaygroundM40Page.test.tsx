import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  Link: ({
    children,
    to,
    ...rest
  }: { children: React.ReactNode; to: string } & Record<string, unknown>) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

import { PlaygroundM40Page } from './PlaygroundM40Page.tsx';

describe('PlaygroundM40Page (M40 scaffold)', () => {
  it('renders the playground header and back-to-home link', () => {
    render(<PlaygroundM40Page />);

    expect(screen.getByRole('heading', { level: 1, name: /m40 playground/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    expect(
      screen.getByRole('heading', { level: 5, name: /playground scaffold/i }),
    ).toBeInTheDocument();
  });
});
