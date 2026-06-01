import Box from '@mui/material/Box';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { getCharacter } from '@/data/characters/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { getAlignmentBorderColor } from '@/utils/characterIcon.ts';
import { Alignment } from '@/types/index.ts';

export interface OverlayTokenProps {
  baseCharacterId: string;
  gainedCharacterId: string;
  size?: number;
}

export function OverlayToken({ baseCharacterId, gainedCharacterId, size = 56 }: OverlayTokenProps) {
  const baseCharacter = getCharacter(baseCharacterId);
  const gainedCharacter = getCharacter(gainedCharacterId);
  const baseTypeColor = baseCharacter ? getCharacterTypeColor(baseCharacter.type) : '#9e9e9e';
  const gainedTypeColor = gainedCharacter ? getCharacterTypeColor(gainedCharacter.type) : '#9e9e9e';
  const baseAlignment = baseCharacter?.defaultAlignment ?? Alignment.Unknown;
  const gainedAlignment = gainedCharacter?.defaultAlignment ?? Alignment.Unknown;

  return (
    <Box
      sx={{ position: 'relative', width: size * 1.35, height: size * 1.35 }}
      data-testid="overlay-token"
    >
      <CharacterIconImage
        characterId={baseCharacterId}
        characterName={baseCharacter?.name ?? baseCharacterId}
        typeColor={baseTypeColor}
        size={size}
        borderColor={getAlignmentBorderColor(baseAlignment, baseTypeColor)}
        alignment={baseAlignment}
      />
      <Box
        sx={{
          position: 'absolute',
          left: size * 0.38,
          top: size * 0.38,
          transform: 'rotate(8deg)',
        }}
      >
        <CharacterIconImage
          characterId={gainedCharacterId}
          characterName={gainedCharacter?.name ?? gainedCharacterId}
          typeColor={gainedTypeColor}
          size={Math.max(36, size * 0.72)}
          borderColor={getAlignmentBorderColor(gainedAlignment, gainedTypeColor)}
          alignment={gainedAlignment}
        />
      </Box>
    </Box>
  );
}
