# Night cards

1. there are too many checkboxes in the night flashcards.  we should only be showing checkmarks on actionable things. For example, on the pit-hag
2. The indenting is weird to follow

Here is the ideal indenting, order, and checkbox locations
```
[] The Pit-Hag chooses a player & a character.
    Choose a player
    Choose a character

[] If they chose a character that is not in play: Put the Pit-Hag to sleep.
    Wake the target.
    Show the YOU ARE token & their new character token.
```
3. we need to replace the Placeholder icon with the actual icon 
4. The power short description text should be aa bit larger and/or default to bolded instead of italics

# Day / night tabs. 
1. the dialog to confirm going into night mode is unnecessary.
2. clicking on the night tab should go directly into the flashcards
3. clicking on the night tab again should take us back to whichever flashcard we left off at.
4. do not consider a night complete until the user has pressed the 'complete night button'
5. we should be able to get rid of the moon icon button in the navbar if the night tab takes it's place 

# TownSquare
1. each character card should have a minimum size in both directions 60x90px is a good start
2. we need to replace the character icons with the actual icons
3. there is a misalignment between where the center of the token placement is and the actual center of the character card.  it looks like we instead targeting the upper left of each character card as the center point for the tokens to radiate around.
4. the context menu that pops up when you click on a character card in the day phase when in hide secret information mode (mark as dead, manage Tokens, etc.) needs to be moved to the visible secret information mode.  aka: combine with the edit player modal.  in fact, those things are more important and should be at above the character change and alignment change.
5. We need to hide tokens during the hide secret information view
6. during the hide secret information view, we should only see the player name, and if they're dead, if they have a remaining ghost vote, their seat info.  If the character is a traveller, we should also see the red/blue split and the character icon because that is public information.  Traveller alignment should still remain hidden
7. traveller character cards are not abiding by the same sizing scaling as regular character cards.  it should be the same
8. now that we have some token information pulled from the character xml.  for each character that has tokens in the set of active characters playing, those tokens make up the set of available tokens in the context menu when clicking on character cards.
9. There's actually 1 more 'basic' token like poison and drunk to add.  "Mad".  however this only applies if there is a character that has an ability about being mad like the mutant or harpy.
10. For small viewports we should place tokens in a line (horizontal or vertical) on the furthest side from the center of townsquare of each character token. Perhaps a settings icon in the navbar to toggle between these layout options.

# day discussion timer
the input needs to be a bit wider.  text is overflowing

# Players list view
1. Traveller icons can always be shown (without their alignment).
2. During the visible secret information:
    - the order order of columns should be seat, player, type, icon, character, ability, tokens, alignment, alive, vote.  At the moment we are missing a column name (token) and it's in a different order.
    - the ability column should be the widest.  We should also have line wrap in that column for longer abilities or small viewports.

# Script view
1. we're putting • between what should be line breaks for the detailed rules for each accordian 

# Night order view
1. we don't need to show the order number anywhere ever.  that's internal logic information.
2. we need to replace placeholder icons with actual icons.

# Travellers, Fabled, Loric
1. these need to be available during script creation.  the norm is to have 4 available travellers per script.  Fabled and Loric are always optional and can be used in any combination/count.
2. the script import option should support tavellers, fabled, loric
3. the script view from top to bottom should show the existing order, travellers, fabled, then loric.
4. If there are fabled or loric in play, we should show them in the upper left and right of townsquare respectively.  They should always be in view regardless of hidden secret information or not.  no players will ever be assigned to these characters.
5. If the fabled or loric are in play, we should show them at the bottom of the players view list 

# Night history
- we need to be using the actual character icons
- the notes aren't editable in the night history, they should be
- the choose xyz dropdowns aren't editable, they should be 
- perhaps where we have the word 'Editable' we should instead have a button that toggles between edit mode and read only mode.  In edit mode, it should function just like it does in the night flashcard in terms of editing, except we are applying edits to a specific night instead of the current night.
- Night history sidebar could be improved by the highest level summary of what actionable things happened.  
  - eg: 
    Night 3:
        Imp chose {player} ({playerRole}); 
        Fortune Teller ({player1}) chose {player2} and {player3} a signal of 2.
        Professor {player} used their ability on {player2}