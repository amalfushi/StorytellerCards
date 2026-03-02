# Milestone 3 --  Feedback #1 ✅

> All Round 1 items completed.

## Storybook
### Night progress bar story doesn't work ✅

The requested module 'http://localhost:6006/node_modules/.cache/storybook/10.2.8/ba75b35ed4ae7c0a0724388efeef3bfc64d91158493a70f32cbaffb5f2593dda/sb-vite/deps/@storybook_addon-actions.js?v=aea12f3d' doesn't provide an export named: 'default'

The component failed to render properly, likely due to a configuration issue in Storybook. Here are some common causes and how you can address them:

    Missing Context/Providers: You can use decorators to supply specific contexts or providers, which are sometimes necessary for components to render correctly. For detailed instructions on using decorators, please visit the Decorators documentation.
    Misconfigured Webpack or Vite: Verify that Storybook picks up all necessary settings for loaders, plugins, and other relevant parameters. You can find step-by-step guides for configuring Webpack or Vite with Storybook.
    Missing Environment Variables: Your Storybook may require specific environment variables to function as intended. You can set up custom environment variables as outlined in the Environment Variables documentation.

### NightHistory ✅
The dots on the breadcrumb for each player are still to small to be clicked on.  The largest dot of the 'active' card should be the smallest size of dots to be honest.  Additionally for long breadcrumbs it is probably a good idea to have a carousal to keep it in a single line for small displays
Also in live testing it looks like we have 2 kinds of breadcrumb.  one for the night review and one for the current night's flashcards.  they should be the same and show the same characters.  The regular night review for 10 characters has breadcrumb circles all the same size.  They're clickable but should still be larger

## PlayerList ✅
  - we should only do the strikethrough for the ability description
  - the traveller player story needs improvement since it doesn't show any info.  Ideally we should be showing a demo traveler with arbitrary information that shows the half gradient icons + outline for actual assigned alignment

### PlayerToken ✅
These need to be larger.  The Large Size story should be the default.
The font in all elements needs to be larger.  like 30% larger
  It would be pretty helpful to color the background with a transparent version of the alignment color eg: 10% opacity

### TownSquareLayout ✅
Lets do one example of the 'worst case' scenario for each of the circle and ovoid layouts with actual character information AND show both the hidden info and visible info options for each  Eg: 20 players, a mix of character alignments, actual character info

## Live Testing ✅
  - clicking on the checkboxes during the night flashcards causes the entire row to jump to the right making it impossible to click the checkbox directly.  clicking anywhere else in the row will check the checkbox, so we may have two listeners colliding.
  - Can we make the arrows at the sides of the screen for the flashcards larger?  like 20%
  - the night action box (eg; Choose 2 players) should in line or below the thing that says that.  At the bottom of the card is not a pleasant experience for the user
  - For the night history review, we do not need to see all possible characters for the script.  only the ones that are in play


# Feedback 2 ✅

> All Round 2 items completed (F3-11 through F3-19).

## Traveller cards ✅
  - ✅ **F3-11**: Traveler cards in the full info view should have a transparent background for both colors
  - ✅ **F3-12**: Traveler cards in this view are somehow squished and cutting off the bottom half of the text for each line but the bottom line that shows the seat
  - ✅ **F3-13**: in the hidden info view, we can actually show the half red half blue colors for Traveler since everyone will know they are a Traveler

## Token Management ✅
  - ✅ **F3-14**: For now, There should only be able to be 1 poisoned and 1 drunk token on a player
  - ✅ **F3-15**: There can be any number of arbitrary tokens on a player.  A reasonable upper limit worst case is 10 for our testing
  - ✅ **F3-16**: we need to have storybook stories for these arbitrary tokens.  both on the player tile stories AND in the townsquare layout story.  The worst case should show a bunch of tokens as well
  - ✅ **F3-17**: the player list view needs to also show the active tokens on the player.
  - ✅ **F3-18**: the Night Time flashcards need to show the active tokens on the player.  This needs to be very visible by the short ability description
  - ✅ **F3-19**: The night history view needs to show the tokens that were active during that night.
