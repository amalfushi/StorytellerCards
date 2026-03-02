Cool, here's some more feedback:


1. We have a warning in dev console when the ui launches
```
react-dom_client.js?v=58c098ca:2154 In HTML, <button> cannot be a descendant of <button>.
This will cause a hydration error.

  ...
    <ListItem2 disablePadding={true} sx={{mb:1.5}}>
      <MuiListItem-root as="li" ref={function} ownerState={{...}} className="MuiListIte..." sx={{mb:1.5}}>
        <Insertion6>
        <li className="MuiListIte..." ref={function}>
          <Card2 sx={{width:"100%"}} elevation={2}>
            <MuiCard-root className="MuiCard-root" elevation={2} ref={null} ownerState={{...}} sx={{width:"100%"}}>
              <Insertion6>
              <Paper2 className="MuiCard-ro..." elevation={2}>
                <MuiPaper-root as="div" ownerState={{...}} className="MuiPaper-r..." ref={null} style={{...}}>
                  <Insertion6>
                  <div className="MuiPaper-r..." style={{...}}>
                    <CardActionArea2 onClick={function onClick}>
                      <MuiCardActionArea-root focusVisibleClassName="" onClick={function onClick} ...>
                        <Insertion6>
                        <ButtonBase2 focusVisibleClassName="" onClick={function onClick} className="MuiCardAct...">
                          <MuiButtonBase-root as="button" className="MuiButtonB..." ownerState={{...}} onBlur={function} ...>
                            <Insertion6>
>                           <button
>                             className="MuiButtonBase-root MuiCardActionArea-root css-coyn9m-MuiButtonBase-root-MuiCa..."
>                             onBlur={function}
>                             onClick={function onClick}
>                             onContextMenu={function}
>                             onFocus={function}
>                             onKeyDown={function}
>                             onKeyUp={function}
>                             onMouseDown={function}
>                             onMouseLeave={function}
>                             onMouseUp={function}
>                             onDragLeave={function}
>                             onTouchEnd={function}
>                             onTouchMove={function}
>                             onTouchStart={function}
>                             tabIndex={0}
>                             type="button"
>                             disabled={false}
>                             ref={function}
>                           >
                              ...
                                <MuiIconButton-root id={undefined} className="MuiIconBut..." centerRipple={true} ...>
                                  <Insertion6>
                                  <ButtonBase2 id={undefined} className="MuiIconBut..." centerRipple={true} ...>
                                    <MuiButtonBase-root as="button" className="MuiButtonB..." ...>
                                      <Insertion6>
>                                     <button
>                                       className="MuiButtonBase-root MuiIconButton-root MuiIconButton-edgeEnd MuiIcon..."
>                                       onBlur={function}
>                                       onClick={function onClick}
>                                       onContextMenu={function}
>                                       onFocus={function}
>                                       onKeyDown={function}
>                                       onKeyUp={function}
>                                       onMouseDown={function}
>                                       onMouseLeave={function}
>                                       onMouseUp={function}
>                                       onDragLeave={function}
>                                       onTouchEnd={function}
>                                       onTouchMove={function}
>                                       onTouchStart={function}
>                                       tabIndex={0}
>                                       type="button"
>                                       disabled={null}
>                                       id={undefined}
>                                       aria-label="delete session"
>                                       ref={function}
>                                     >
validateDOMNesting	@	react-dom_client.js?v=58c098ca:2154
completeWork	@	react-dom_client.js?v=58c098ca:9000
runWithFiberInDEV	@	react-dom_client.js?v=58c098ca:995
completeUnitOfWork	@	react-dom_client.js?v=58c098ca:12667
performUnitOfWork	@	react-dom_client.js?v=58c098ca:12573
workLoopSync	@	react-dom_client.js?v=58c098ca:12422
renderRootSync	@	react-dom_client.js?v=58c098ca:12406
performWorkOnRoot	@	react-dom_client.js?v=58c098ca:11764
performSyncWorkOnRoot	@	react-dom_client.js?v=58c098ca:13515
flushSyncWorkAcrossRoots_impl	@	react-dom_client.js?v=58c098ca:13412
processRootScheduleInMicrotask	@	react-dom_client.js?v=58c098ca:13435
(anonymous)	@	react-dom_client.js?v=58c098ca:13529


```

1. before the first night starts, we actually need to assign the characters to the players.  This should be able to be done arbitrarily OR randomly following the following table

| players   | 5   | 6   | 7   | 8   | 9   | 10  | 11  | 12  | 13  | 14  | 15+ |
| --------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| townsfolk | 3   | 3   | 5   | 5   | 5   | 7   | 7   | 7   | 9   | 9   | 9   |
| outsiders | 0   | 1   | 0   | 1   | 2   | 0   | 1   | 3   | 0   | 1   | 2   |
| minions   | 1   | 1   | 1   | 1   | 1   | 2   | 2   | 2   | 3   | 3   | 3   |
| demons    | 1   | 1   | 1   | 1   | 1   | 1   | 1   | 1   | 1   | 1   | 1   |

As is tradition with this game, we need to be flexible because there 100% are characters that will modify those rules.  eg: Legion, Godfather, etc all change those counts

2. on the night phase flashcards we need to show the character abilityShort at the top of the card.

3. for `if` statements in the night order, the `if` should be at the same level as the rest, BUT each additional line should be indented 1 level.  At the moment the opposite is true
   
4. We need to work on importing scripts.  At the moment it looks like we're still using a hardcoded example.   @/OneInOneOut.json is another official script that should be able to be imported successfully.