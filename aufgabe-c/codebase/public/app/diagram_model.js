function reLayoutDiagram(diagram) {
    diagram.startTransaction("relayout");
    diagram.layout.invalidateLayout();
    diagram.layoutDiagram(true);
    diagram.links.each(l => l.invalidateRoute());
    diagram.commitTransaction("relayout");
}

myDiagram = new go.Diagram('myDiagramDiv', {
    padding: 12,
    'animationManager.initialAnimationStyle': go.AnimationStyle.None,
    InitialAnimationStarting: e => {
        var animation = e.subject.defaultAnimation;
        animation.easing = go.Animation.EaseOutExpo;
        animation.duration = 800;
        animation.add(e.diagram, 'scale', 0.3, 1);
        animation.add(e.diagram, 'opacity', 0, 1);
    },
    // have mouse wheel events zoom in and out instead of scroll up and down
    'toolManager.mouseWheelBehavior': go.WheelMode.Zoom,
    // support double-click in background creating a new node
    // enable undo & redo
    'undoManager.isEnabled': false
    });

    myDiagram.layout = new go.CircularLayout({
    spacing: 160,     // gap between neighboring nodes
    radius: NaN,      // let spacing determine the circle size
    startAngle: 270,  // optional: start at top
    sweepAngle: 360   // full circle
    });

    // when the document is modified
    myDiagram.addDiagramListener('Modified', e => {
    
    });

    const colors = {
        pink: '#facbcb',
        blue: '#b7d8f7',
        green: '#b9e1c8',
        yellow: '#faeb98',
        red: '#ea8585',
        background: '#e8e8e8',
        online: '#16de00',
        offline: '#ea8585'
    };
    const colorsDark = {
        green: '#3fab76',
        yellow: '#f4d90a',
        blue: '#0091ff',
        pink: '#e65257',
        background: '#161616'
    };

    myDiagram.div.style.backgroundColor = colors.background;
    myDiagram.addDiagramListener('InitialLayoutCompleted', (e) => {
        e.diagram.commandHandler.zoomToFit();
        console.log("calling")
    });
    
    myDiagram.allowMove = false;      // no dragging nodes
    myDiagram.allowDelete = false;    // no deleting nodes/links
    myDiagram.allowTextEdit = false;  // no editing link text
    myDiagram.allowLink = false;      // no creating links
    myDiagram.allowRelink = false;    // no reconnecting link ends
    myDiagram.allowReshape = false;   // no reshaping link routes
    myDiagram.maxSelectionCount = 1;

    myDiagram.nodeTemplate =
    new go.Node("Spot", {
      isShadowed: true,
      shadowBlur: 0,
      selectable: false,
      click: (e, node) => {
        on_node_clicked(node)
      },
      shadowOffset: new go.Point(5, 5),
      shadowColor: "black",
  
      locationSpot: go.Spot.Center,
      locationObjectName: "BODY"
    })
      .bindTwoWay("location", "loc", go.Point.parse, go.Point.stringify)
      .add(
        // main body of the node
        new go.Panel("Auto", {
          name: "BODY",
          isPanelMain: true
        }).add(
            new go.Shape("RoundedRectangle", {
                strokeWidth: 1.5,
                fill: colors.yellow,
                portId: "",
                fromLinkable: true,
                fromLinkableSelfNode: false,
                fromLinkableDuplicates: false,
                toLinkable: true,
                toLinkableSelfNode: false,
                toLinkableDuplicates: false,
                cursor: "pointer"
            }).bind("fill", "", (data, obj) => {
                const node = obj.part;

                const hasIncoming = node.findLinksInto().count > 0;
                const hasOutgoing = node.findLinksOutOf().count > 0;

                if (data.assassinated_by) return colors.red; 

                return data.lobby_code ? colors.green : colors.yellow;
            }).bind("figure", "type", type => "RoundedRectangle"),
            new go.TextBlock({
                name: "text",
                margin: 8,
                textAlign: "center",
                font: "bold 14px sans-serif",
                stroke: "#333",
                editable: false,
                isMultiline: true,
                shadowVisible: false
            }).bind(
                "text",
                "",   // bind from the whole node data object
                function(data) {
                    if (data.assassinated_by) {
                        return `${data.text} (${data.kills})\r\nkilled by ${data.assassinated_by.name}`;
                    } else {
                        return `${data.text} (${data.kills})`;
                    }
                }
            )
        ),
  
        // notification dot
        new go.Shape("Circle", {
          alignment: new go.Spot(1, 0, 3, -3),
          alignmentFocus: go.Spot.Center,
          desiredSize: new go.Size(15, 15),
          stroke: "black",
          strokeWidth: 2,
          visible: false,
          fill: colors.offline
        }).bind("fill", "online", online => {
          return online ? colors.online : colors.offline;
        }).bind("visible", "lobby_code", lobby_code => {
            return lobby_code ? true : false;
        })
      );


    function node_insert_after(e, obj) {
        console.log("Insert after")
    }

    function killPlayer(e, obj) {
    var adornment = obj.part;
    var diagram = e.diagram;
    diagram.startTransaction('killPlayer');

    // get the node data for which the user clicked the button
    var fromNode = adornment.adornedPart;
    diagram.model.setDataProperty(fromNode.data, "state", "killed");

    if (fromNode.findLinksInto().count != 1) {
        console.log("ERROR: Killed player didn't have an assassin");
        return;
    }
    if (fromNode.findLinksOutOf().count != 1) {
        console.log("ERROR: Killed player didn't have a target");
        return;
    }

    var link_into = fromNode.findLinksInto().first();
    var link_outof = fromNode.findLinksOutOf().first();

    // increase kill count of assassin
    diagram.model.setDataProperty(link_into.fromNode.data, "kills", link_into.fromNode.data.kills + 1);

    if (link_outof.data.to == link_into.data.from) {
        // last target assassinated -> what now?
        diagram.model.removeLinkData(link_outof.data);
    } else {
        // change outgoing link to be originating from assassin
        diagram.model.setFromKeyForLinkData(link_outof.data, link_into.data.from);
    }

    // remove link into killed player
    diagram.model.removeLinkData(link_into.data);

    diagram.commitTransaction('killPlayer');
    }
    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate =
    new go.Link({
        // shadow options are for the label, not the link itself
        isShadowed: true,
        shadowBlur: 0,
        shadowColor: 'black',
        shadowOffset: new go.Point(2.5, 2.5),
        selectable: false,

        curve: go.Curve.Bezier,
        curviness: 40,
        adjusting: go.LinkAdjusting.Stretch,
        reshapable: true,
        relinkableFrom: true,
        relinkableTo: true,
        fromShortLength: 8,
        toShortLength: 10
        })
        .bindTwoWay('points')
        .bind('curviness')
        .add(
        // Main shape geometry
        new go.Shape({ strokeWidth: 2, shadowVisible: false, stroke: 'black' })
            .bind('strokeDashArray', 'progress', progress => progress ? [] : [5, 6])
            .bind('opacity', 'progress', progress => progress ? 1 : 0.5),
        // Arrowheads
        new go.Shape({ fromArrow: 'circle', strokeWidth: 1.5, fill: 'white' })
            .bind('opacity', 'progress', progress => progress ? 1 : 0.5),
        new go.Shape({ toArrow: 'standard', stroke: null, scale: 1.5, fill: 'black' })
            .bind('opacity', 'progress', progress => progress ? 1 : 0.5),
        // The link label
        new go.Panel('Auto')
            .add(
            new go.Shape('RoundedRectangle', {
                shadowVisible: true,
                fill: colors.pink,
                strokeWidth: 0.5
            }),
            new go.TextBlock({
                font: '9pt helvetica, arial, sans-serif',
                margin: 1,
                editable: false, // enable in-place editing
                text: 'Actiontest' // default text
                }).bindTwoWay('text', 'word')
            // editing the text automatically updates the model data
            )
        );