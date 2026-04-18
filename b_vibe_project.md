# Vibe project prompt documentation

## First prompt
> I am trying to create digital version of a party game called "assassin". Each guest receives a target player and a target word. The objective is to make the target player say the target word during natural conversation. Can you please create an app with the following features (for now just to be locally run) ?
>
>this is the player view:
>- target player name
>- target player word
>- button to report successful assassination (target player is assassinated and removed from the data structure linkage, target players target and target word is inherited to the assassinating player)
>- a way to show the rules
>
>there should be a separate gamemaster view with the following features
>- create a new game (shows popup where you can enter a list of names and words) -> creation should create a data structure where all players are connected with the target words. there is always one link in one direction and the whole data structure should basically be a circular link between all players
>- dynamically modify a player (player name, target word)

![prompt1 result](https://github.com/user-attachments/assets/05d75212-5c89-4221-9a51-13b116a91003)
![prompt1 result2](https://github.com/user-attachments/assets/9eb62e6a-11c1-49fa-98b6-60a6d13f074b)
![prompt1 result3](https://github.com/user-attachments/assets/67234010-ddb3-414b-a8b4-ac23af77f70a)

Die Resultate sind beeindruckend. Die gewünschte Funktionalität ist vollständig implementiert. Es gibt noch einen Visualisierungsbug im GameMaster-View, das Target-Wort wird in der falschen Zeile angezeigt.
Außerdem treten Layoutverschiebungen auf, die Popups sind außerhalb des Screens und müssen mit der Tabulatortaste in den View gebracht werden.
