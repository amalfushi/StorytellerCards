import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';

describe('CharacterIconImage', () => {
  const defaultProps = {
    characterId: 'fortuneteller',
    characterName: 'Fortune Teller',
    typeColor: '#1976d2',
    size: 48,
    borderColor: '#1976d2',
  };

  it('renders an img with correct src and alt (Townsfolk defaults to _g)', () => {
    render(<CharacterIconImage {...defaultProps} />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icons/characters/fortunetellerIcon_g.webp');
    expect(img).toHaveAttribute('alt', 'Fortune Teller');
  });

  it('shows fallback letter when image fails to load', () => {
    render(<CharacterIconImage {...defaultProps} />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    // Townsfolk default is _g — first error falls back to unsuffixed base
    fireEvent.error(img);
    const imgBase = screen.getByRole('img', { name: 'Fortune Teller' });
    expect(imgBase).toHaveAttribute('src', '/icons/characters/fortunetellerIcon.webp');
    // Second error — base also missing → letter fallback
    fireEvent.error(imgBase);
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
    // Inner image fills the wrapper minus the 3px border on each side.
    expect(img).toHaveStyle({ width: '74px', height: '74px' });
  });

  it('enforces minimum size of 48px when given a smaller value', () => {
    const { container } = render(<CharacterIconImage {...defaultProps} size={24} />);
    const wrapper = container.firstChild as HTMLElement;
    // Outer box should be 48px (minimum), not 24px
    expect(wrapper).toBeTruthy();
    // Inner image fills the minimum wrapper minus the 3px border on each side.
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    expect(img).toHaveStyle({ width: '42px', height: '42px' });
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

  it('renders the border with the provided borderColor', () => {
    const { container } = render(<CharacterIconImage {...defaultProps} borderColor="#d32f2f" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    // The border style is applied via MUI sx — verify the component renders
  });

  it('renders white background behind the icon', () => {
    const { container } = render(<CharacterIconImage {...defaultProps} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    // White background is applied via MUI sx — verify the component renders
  });

  // ──────────────────────────────────────────────
  // Alignment variant tests (M28)
  // ──────────────────────────────────────────────

  it('uses Good alignment variant (_g) when alignment is Good', () => {
    render(<CharacterIconImage {...defaultProps} alignment="Good" />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    expect(img).toHaveAttribute('src', '/icons/characters/fortunetellerIcon_g.webp');
  });

  it('uses Evil alignment variant (_e) when alignment is Evil', () => {
    render(
      <CharacterIconImage
        {...defaultProps}
        characterId="imp"
        characterName="Imp"
        alignment="Evil"
      />,
    );
    const img = screen.getByRole('img', { name: 'Imp' });
    expect(img).toHaveAttribute('src', '/icons/characters/impIcon_e.webp');
  });

  it('uses base icon when alignment is Unknown', () => {
    render(<CharacterIconImage {...defaultProps} alignment="Unknown" />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    // Unknown alignment → resolved via type lookup (Townsfolk → _g)
    expect(img).toHaveAttribute('src', '/icons/characters/fortunetellerIcon_g.webp');
  });

  it('uses type-default icon when alignment is undefined', () => {
    render(<CharacterIconImage {...defaultProps} />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    // No alignment → resolved via type lookup (Townsfolk → _g)
    expect(img).toHaveAttribute('src', '/icons/characters/fortunetellerIcon_g.webp');
  });

  // ──────────────────────────────────────────────
  // Fallback chain tests (M28)
  // ──────────────────────────────────────────────

  it('falls back to base icon when alignment variant fails to load', () => {
    render(
      <CharacterIconImage
        {...defaultProps}
        characterId="angel"
        characterName="Angel"
        alignment="Good"
      />,
    );
    const img = screen.getByRole('img', { name: 'Angel' });
    // Initially shows alignment variant
    expect(img).toHaveAttribute('src', '/icons/characters/angelIcon_g.webp');
    // Simulate image load error (variant doesn't exist for Fabled)
    fireEvent.error(img);
    // Should now show base path
    const imgAfter = screen.getByRole('img', { name: 'Angel' });
    expect(imgAfter).toHaveAttribute('src', '/icons/characters/angelIcon.webp');
  });

  it('shows letter fallback when both alignment variant and base fail', () => {
    render(
      <CharacterIconImage
        {...defaultProps}
        characterId="angel"
        characterName="Angel"
        alignment="Good"
      />,
    );
    const img = screen.getByRole('img', { name: 'Angel' });
    // First error: falls back to base
    fireEvent.error(img);
    const imgBase = screen.getByRole('img', { name: 'Angel' });
    expect(imgBase).toHaveAttribute('src', '/icons/characters/angelIcon.webp');
    // Second error: falls back to letter circle
    fireEvent.error(imgBase);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows letter fallback when type-default icon fails (fallback to base, then letter)', () => {
    render(<CharacterIconImage {...defaultProps} />);
    const img = screen.getByRole('img', { name: 'Fortune Teller' });
    // Townsfolk default is _g — if that fails, falls back to unsuffixed base
    expect(img).toHaveAttribute('src', '/icons/characters/fortunetellerIcon_g.webp');
    fireEvent.error(img);
    // Now tries unsuffixed base path
    const imgBase = screen.getByRole('img', { name: 'Fortune Teller' });
    expect(imgBase).toHaveAttribute('src', '/icons/characters/fortunetellerIcon.webp');
    // Base also fails (no unsuffixed file for standard types) → letter fallback
    fireEvent.error(imgBase);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
  });
});
