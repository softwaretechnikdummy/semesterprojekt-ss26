# Vibe UI Development process

## First prompt

>I am trying to create digital version of a party game called "assassin". Each guest receives a target player and a target word. The objective is to make the target player say the target word during natural conversation. Can you please create a UI with the following features?
>- target player name
>- target player word
>- option to redraw the word
>- button to report successful assassination
>- a way to show the rules

![prompt 1 result](https://github.com/user-attachments/assets/1f7a0b2f-a9b2-41ec-8c5d-cc320283c9bf)

## Second prompt
>The UI is a good start but still too full of features. Please perform the following changes:
>- Remove the top burger menu and help icon in the top right corner
>- The "last seen" section is unrealistic as we don't have surveillance on the people at the party
>- The "alive" indicator next to the target person is obsolete, please remove
>- Can you remove the instructions-subtitle directly below the secret trigger please and incorporate this into the "mission protocol"?
>- Also remove the "Live tactical intelligence" part as it exceeds the scope
>- The bottom navigation should only show "Target" and "Profile". But the "Profile" section should have a different wording and icon indicating that it is connected closely to your agent identity.

![prompt2 result](https://github.com/user-attachments/assets/89238fab-c4e0-4ef8-899d-cf58a3186213)

## Third prompt (gamemaster ui)
> Could you now please also create a gamemaster view? This should be a deskop pc (so horizontal 16:9 layout). There should be a visual graph displaying all the players as nodes and then connecting them via links with the target words. Hovering over this main graph should be button to create a new game, add a player, show a log of what happened

![prompt3 result](https://github.com/user-attachments/assets/5729d165-f008-4e8e-932a-1b51828ccb49)
