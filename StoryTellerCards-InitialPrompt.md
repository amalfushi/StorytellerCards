# Task

I would like you to help me set up a demo UI for the social deduction game Blood on the Clocktower.  Specifically, I am looking to create a UI to help the person running the game (The Storyteller) with all of the behind the scenes upkeep to make the game smoother.

## About Blood on the Clocktower

- A social deduction game where every player has a unique character with unique powers
- The game is broken into days.  each day has 4 phases
  - Dawn - not a lot happens here
  - Day - Players have discussions and break of into groups.  The storyteller doesn't have a lot to do here in most cases. BUT in terms of the app, it would bre great to have a timer + alarm to keep track of time.
  - Dusk - Now is the time for nominations where players can vote for a player to be executed (become a ghost).  Not a lot to do here for the storyteller in terms of our app.  may be good to be able to track who nominated who, but that is reaaaly low priority.
  - Night - This is where the most work for the storyteller lies!
    - Each player may have a unique action that happens in a **specific order** depending on which night it is.  
    - That action may require moving tokens around, altering other players, the demon killing, swapping character roles, swapping alignments, or many other whacky things.  Being very difficult to keep track of, that's what i want to focus on streamlining.  
- Since each character is unique, there are 100+ of them,  each of them can affect the game in different ways,and depending on which order the charact ers act a different outcome may happen,  it's a lot of fun but a challenge to run.
- In the real world, the game is played with the players sat in a circle around a 'TownSquare' sort of like a clock, hence the name.  
- Each game has a 'Script' (a subset set of specific characters) that may be in the game.  usually ~13 townsfolk, ~4 outsiders, ~4 minions, & ~4 demons.
- Maximum of 20 players.  Minimum of 5.  This does not include the storyteller

## Goals with the ui

- the set of characters (Script) should be able to be set up arbitrarily
  - But easier we need to support importing a script from a json.  An official example is @/StorytellerCards/Boozling.json .  Do not modify this master copy
- Each game should be able to be created beforehand (eg: you can create 3 games the night before)
- The default set of players names (and seats) should be from the previous game.
  - Perhaps there should be a Game Session or something that ties the 3 games together (eg: a container of x games with the same people + seating)
  - Which can be changed arbitrarily when 'running' each game
- The high level overview should try to keep the Townsquare circle as a devault view BUT have an option to toggle to a list view of the player/character/seats
- There needs to be an easy way (tab?) to see the high level script of characters, then drill down into the specifics of their power and nitty gritty rules
- there needs to be an easy way to see (tab) the night order?
- During the night phase, the goal is to have 'flashcards' that are effectively a checklist of things to do for each character in the order of the characters on the night order.  
  - eg: wake x character, ask them for y thing
  - @/StorytellerCards/NightOrder.md  is the official order for all the characters currently in the game.  it has a section for the First Night and Other Nights that has a different order of characters.  Not every character acts on each night.  Not all characters have powers that they need to be woken up for. Do not modify this master copy.
  - Each character that needs to be woken up should have a flashcard
  - Dead (Ghost) players should still have a flashcard but it should be greyed out or faded.  Tokens can and will still need to be moved onto and off of them (rarely)
- @/StorytellerCards/UI/Types.ts is a rough draft of some typescript types to help inform more of the structure of the game.

### UI Technologies

- Use react.  whichever major supported tools will support a mobile-first development.  Ensure we're using most recent react and standards
- Do not use redux.  react hooks are plenty good for this app.
- Use a component test library like storybook to test components in isolation.
- Use prettier and eslint.  Use git hooks to lint modified files before commits.  use another pre-push commit to run the tests before push.
- Use typescript.
- Cypress integration tests would be nice but that may be wayy to expensive in terms of work for this project
- Avoid bootstrap or any direct dependency on not-react-specific css.  I am open to popular react component libraries.

## Goals with the API

- For now, this is just a placeholder since my goals are only to run the ui locally.
- That said, a simple api that writes the games' state to a local json file is fine.  There is no scope to do a database at the moment but that could come in the future.
  - the local games' state files should be removed after 90 days.
- the user's device should also be used for storage of the ui data to speed up edits.  really the api is for syncing across devices.
  
### API Technologies

- I am semi interested in using a language that isn't c# or java since I work in the first one and the second one is boring.  I have also worked with python and node apis, but have forgotten almost everything about them.  I am open to other interesting suggestions.
