import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OverlayToken } from '@/components/common/OverlayToken.tsx';

describe('OverlayToken', () => {
  it('renders base and gained character icons', () => {
    render(<OverlayToken baseCharacterId="demon" gainedCharacterId="washerwoman" />);

    expect(screen.getByTestId('overlay-token')).toBeInTheDocument();
    expect(screen.getByAltText('demon')).toBeInTheDocument();
    expect(screen.getByAltText('Washerwoman')).toBeInTheDocument();
  });
});
