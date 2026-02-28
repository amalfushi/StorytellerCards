A couple issues or feedback:

1. two react dom warnings:
   1. react-dom_client.js?v=789f01dd:2148 In HTML, <h6> cannot be a child of <h2>. This will cause a hydration error.
   ```
    <FocusTrap disableEnforceFocus={false} disableAutoFocus={false} disableRestoreFocus={false} ...>
      <div>
      <Fade2 appear={true} in={true} timeout={{enter:225,exit:195}} role="presentation" ...>
        <Transition2 appear={true} in={true} nodeRef={{current:null}} onEnter={function} onEntered={function} ...>
          <MuiDialog-container onMouseDown={function handleMouseDown} className="MuiDialog-..." ref={function} ...>
            <Insertion6>
            <div onMouseDown={function handleMouseDown} className="MuiDialog-..." style={{opacity:0, ...}} ...>
              <MuiDialog-paper as={{...}} elevation={24} role="dialog" aria-describedby={undefined} ...>
                <Insertion6>
                <Paper2 elevation={24} role="dialog" aria-describedby={undefined} aria-labelledby="_r_15_" ...>
                  <MuiPaper-root as="div" ownerState={{elevation:24, ...}} className="MuiPaper-r..." ref={null} ...>
                    <Insertion6>
                    <div className="MuiPaper-r..." role="dialog" aria-describedby={undefined} aria-labelledby="_r_15_" ...>
                      <DialogTitle2 sx={{display:"flex", ...}}>
                        <MuiDialogTitle-root component="h2" className="MuiDialogT..." ownerState={{sx:{...}, ...}} ...>
                          <Insertion6>
                          <Typography2 component="h2" className="MuiDialogT..." variant="h6" id="_r_15_">
                            <MuiTypography-root as="h2" ref={null} className="MuiTypogra..." id="_r_15_" sx={{...}} ...>
                              <Insertion6>
                              <!-- THIS IS THE ISSUE -->
                             <h2
                               className="MuiTypography-root MuiTypography-h6 MuiDialogTitle-root css-5jgt4l-MuiTypog..."
                              id="_r_15_"
                               style={{}}
                            >
                                <Typography2 variant="h6" sx={{flexGrow:1}}>
                                  <MuiTypography-root as="h6" ref={null} className="MuiTypogra..." sx={{...}} ...>
                                    <Insertion6>
                                   <h6
                                     className="MuiTypography-root MuiTypography-h6 css-1bv5yfe-MuiTypography-root"
                                    style={{}}
                                   >
                                   <!-- End of the issue -->
    ```
1. For the night order flashcards, we only need to show the characters that are in the game, not the whole possible script.

    1. for dead players in the game, we should have a very desaturated background

1. In the townquare, dawn and dusk phases are pretty pointless from a standpoint of running the game.  let's get rid of them

1. in the night phase tab, the night phase flashcards button in the lower right covers the add player button often, lets move that to the header bar by the history button

1. in the players list tab at the bottom, we should have the column order be Seat, Player, Type, Character icon, Character, Character abilityShort, Alive, Alignment, Ghost Vote.

   1. If the alignment is different than the default, we should put a thick border on the type pill of that alignment.  Eg: an Evil Knight should show a red border for evil and blue pill for a townsfolk.  the opposite is true for a 'good' demon or minion

1. the breadcrumb/ pagination at the top of the screen during the flashcards needs to be larger and clicking on any of the dots should take you directly to that page in the rotation.  This applies to the night history as well.

1. clicking on the character icon on any screen should pop up a modal showing the detailed rules of that character.   Because of this the townsquare player tiles should be large to allow clicking on the icon and the tile seperately.

1. we need to be able to 'kill' a player from the town square tab.  probably put it in the modal that pops up when you click a player tile.

1. during the night phase, for any character that has a 'choose *n* character(s)/player/alignment' we should have a dropdown with appropriate character/player/alignment
    1. this dropdown should be it's on component that we can extend for each specific use case.  eg: 'another player' is a different set of players than 'another living player'
    2. When appropriate, use a multi select instead.  Eg; 'choose 2 players'
    3. record of this should be kept in the history
    4. We should show the 'previous night' selection in the current night's dropdown as a read only entry.
1. the night history shouldn't be truly read only.  it may be required to fix a misclick.

1. for many 'choose another player' characters and other powers, the real life game has a token to track which player/character is chosen.  In the official app, this token is generally placed in the townsquare around the targeted character's token/tile.  We need to allow for this with many arbitrary tokens for characters AND two default tokens (Drunk and Poisoned).  Those modifier tokens should should start at whichever angle points toward the townsquare center and radiate around from there.  sort of like the placement of the player tiles itself

1. in the session setup, it would be great to create a script there (rather than importing from json) before creating games. 