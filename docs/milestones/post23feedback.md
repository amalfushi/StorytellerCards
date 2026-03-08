# Feedback

## Select In-Play Characters
- The Header total selected chip is unnecessary.  just show the character type specific ones.  also no need to abbreviate the character types in the header counts.
- Each character checkbox row below it needs the character icon.
- A searchbox would be useful
- we have a bug in the player counts.  at a 12 player game there should only 2 minions unless there is some active character adjustments.  at the moment we're showing 3 for the A Pie A Day Keeps The Poison Away script with no characters selected. Also our Total Selected is showing n/13 which should be n/12
- It's probably a good idea adjust the 
- we can omit the travellers from this screen.  The storyteller should do that separately afterward as they may not be in the game at the start.
- We should rename this to just Select Characters.  Possibly Game N: Select Characters

## Assign characters
- Atheist pre-game reminder should just be "Atheist: No evil characters in the game."

## Character details modal
### Jinxes
- in the detailed character modal, we should put the jinxes in an closed by default accordion.  It's very rare that you need to see all of the jinxes for a character
  - the caveat to that statement is that we should highlight the jinxes that are 'active'.  eg: on the script and/or in the current game.


## Reminder tokens
- These chips need to be colored to match the character type and have the source characters icon in them.  This applies to every place in the entire app where we render the character reminders (global or otherwise).  eg: character details modal, token management modal, players list
- Let's increase the icon size in the reminder token chips by like 10%.  Currently in the night cards view, they're a bit tough to make out what the the icon is for some characters.  this size should be consistent across every place we render a reminder token chip

## Night Flashcards

### Reminder tokens
- It would be surprisingly helpful to show where a reminder token is if it's already on the townsquare.  Eg: Fortune teller token is on Player 3, we should make it grey and put Player 3 (character) below it.

### Choice dropdowns
- For each dropdown where the values are a character or player, we need to render the other in parenthesis.  Eg: Choose 2 players should show "Player 1 ([character icon]Washerwoman)".  Choose a character should show "[character icon] Washerwoman (Player 1)"
- Clicking on the reminder token in this screen should take us back to the day screen to place that token on a character.  Eg: Clicking on the Ogre's Friend token in the flashcards should takes us back to the day screen to place that token.
  - If the token is related to the choice dropdown, we should also highlight the chosen character for token placement.  eg: if the storyteller has already entered that the Ogre chose player 3, clicking on that reminder token should take us back to day view and highlight the player 3 using a drop shadow on the character card for player 3
  - Extra bonus points, if  there is a very clear actionable thing like the example above, after a storyteller enters player 3 in the choice dropdown, we should have an actionable button pop up below it that says that action.  In this case a "Add [ogre icon] Friend reminder to Player 3" without going back to the day view would be great.
- For "Give a finger signal" or "Give a Thumbs Up or Thumbs Down" steps in the night view, we should do best effort to record that choice.  Eg: Mathematician's Give a finger signal should just have a number dropdown to record the number you've shown.

### Chips in this Night View
- It's getting pretty chip heavy, so let's move some around.
  - character type can go in the upper left of the content card.  
  - active affecting reminder tokens (eg: a Faux Paw from a lycanthrope on an innkeeper) should go to the right of the large character icon (similar to the linear token layout for townsquare)
  - the available reminder tokens for that particular character should be below the line separating the Player N (Player M), but above the checklist for the night

### Notes 
- We should populate this with the previous night's notes if they exist
- we should give this thing a bit of grow for the y axis up to a maximum size if the viewport supports it.  maximum size of like 15% of the view height maybe?
- the notes section need to be a bit more visible.  it's easy to miss. Perhaps a lighter background?  eg: give it a 10% white opacity background

## Player List

- Every player action modal action that is available in the townsquare view needs to be available here as well.  Aka. it should be the same modal.
  - The Swap column is unnecessary if that is the case and could be replaced with an 'edit' icon to access the modal
- Now that we have good alignment marking for the character type border and icon border
- the dash in the empty Tokens column is unnecessary 
- the Tokens column name should be changed to Reminders

## Night History
- the Notes text color should be white.
- in edit mode, we should be able to edit the notes.
- in the summary drawer, for every place we put a character we need to also put the player name and visa versa.

## Sessions

- We need to be able to delete games in a session

## Demon Bluffs.

- We need to add support for demon bluffs this includes:
  - AFTER selecting the in-play characters, select the demon bluffs from un-selected good characters (townsfolk and outsiders)
  - Allow changing the bluffs in the Demon's action modal.
  - Showing the demon bluffs in the night flashcards screen