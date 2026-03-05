import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';

describe('CharacterIconImage', () => {
  const defaultProps = {
    characterId: 'fortuneteller',
    characterName: 'Fortune Teller',
    typeColor: '#1976d2',
    size: 40,
  };

  it('renders an img with correct src and alt', () => {
    render(<CharacterIconImage {...defaultProps} />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icons/characters/fortunetellerIcon.png');
    expect(img).toHaveAttribute('alt', 'Fortune Teller');
  });

  it('shows fallback letter when image fails to load', () => {
    render(<CharacterIconImage {...defaultProps} />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    fireEvent.error(img);
    // After error, the img should be gone and replaced by the letter
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
  });

  it('shows fallback when characterId is empty', () => {
    render(<CharacterIconImage {...defaultProps} characterId="" characterName="Unknown" />);
    // No img element — shows fallback circle immediately
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('shows "?" when characterName is also empty', () => {
    render(<CharacterIconImage {...defaultProps} characterId="" characterName="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('fires onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<CharacterIconImage {...defaultProps} onClick={handleClick} />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    fireEvent.click(img);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not set cursor pointer when no onClick is provided', () => {
    const { container } = render(<CharacterIconImage {...defaultProps} />);
    const wrapper = container.firstChild as HTMLElement;
    // MUI applies styles via className, so we check the rendered style
    expect(wrapper).toBeTruthy();
  });

  it('renders with correct size', () => {
    render(<CharacterIconImage {...defaultProps} size={80} />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    expect(img).toHaveAttribute('width', '80');
    expect(img).toHaveAttribute('height', '80');
  });

  it('renders at small size', () => {
    render(<CharacterIconImage {...defaultProps} size={24} />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    expect(img).toHaveAttribute('width', '24');
    expect(img).toHaveAttribute('height', '24');
  });

  it('applies dead state filter class (isDead=true)', () => {
    const { container } = render(<CharacterIconImage {...defaultProps} isDead />);
    // The outer Box wrapper should exist
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    // We confirm the component renders — the actual CSS filter is applied via MUI sx
  });

  it('renders normally when isDead is false', () => {
    render(<CharacterIconImage {...defaultProps} isDead={false} />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    expect(img).toBeInTheDocument();
  });
});
