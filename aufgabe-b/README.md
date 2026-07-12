# Vibe project prompt documentation

Aufgabe B habe ich mit der selben Projektidee fortgeführt. Mit Lovable habe ich ebenfalls in der ersten Presenz mittels einem einzigen Prompt eine App erstellt, die mein Assassin-Projekt das erste Mal zum Leben erweckt hat. 
Die Resultate waren beeindruckend. Die gewünschte Funktionalität war direkt vollständig implementiert. Es gab noch einen Visualisierungsbug im GameMaster-View, das Target-Wort wurde in der falschen Zeile angezeigt.
Außerdem traten Layoutverschiebungen auf, die Popups wurden außerhalb des Screens angezeigt und mussten mit der Tabulatortaste in den View gebracht werden.
Das Problem war, dass ich die UI-Elemente auch schon zu stark ausgeschmückt empfand und ich direkt das Gefühl hatte, nicht zu verstehen, wie das Ganze funktioniert. Ich hatte keine Lust, mit weiteren Prompts jetzt wörtlich die Probleme zu beschreiben und zu hoffen, dass die nächste Iteration dann besser funktioniert. Stattdessen hatte ich viel mehr Lust, das Projekt von Grund auf selbst zu programmieren, dementsprechend aber auch vollständig zu verstehen. Ich widmete mich also ab jetzt Aufgabenteil C.

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
