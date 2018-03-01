function gameToGraph(game) {
    let forwardEdges = [];
    let backwardEdges = [];
    let checkedScenes = [];
    let nodePromises = [];

    for (let i = 0; i < game.scenes.length; i++) {
        let scene = game.scenes[i];
        nodePromises.push(createNewNode(game, scene));
        addEdges(forwardEdges, backwardEdges, scene, checkedScenes);
        checkedScenes.push(scene.id);
    }

    return Promise.all(nodePromises).then(nodes => {
        calculateNodeLevels(nodes);
        return {nodes: nodes, forwardEdges: forwardEdges, backwardEdges: backwardEdges};
    });
}

function createNewNode(game, scene) {
    return getNodeImage(game, scene).then(nodeImage => {
        return {
            id: scene.id,
            label: "",
            image: nodeImage,
            children: getChildren(scene),
            hidden: false
        };
    });
}

function getNodeImage(game, scene) {
    return new Promise((resolve, reject) => {
        let imagePath = getImagePath(scene.scenery[0].name);
        resolve(imagePath);
    });

    function getImagePath(imageName) {
        let imagePath = '';
        for (let counter = 0; counter < game.images.length; counter++) {
            if (game.images[counter].name == imageName) {
                imagePath = game.images[counter].path;
            }
        }
        return imagePath;
    }
}

function addEdges(forwardEdges, backwardEdges, scene, checkedScenes) {
    /* add all edges from this node to the edges array */

    for (let i = 0; i < scene.responses.length; i++) {
        let focusScene = scene.responses[i].nextScene;

        let newEdge = {
            from: scene.id,
            to: focusScene,
            hidden: false
        };

        if (checkedScenes.includes(focusScene)) {
            newEdge.color = "#00FFFF";
            backwardEdges.push(newEdge);
            continue;
        }
        // Add newEdge to appropriate edges array
        forwardEdges.push(newEdge);
    }
}

function calculateNodeLevels(nodes) {
    let checkedNodes = [];
    setLevel(0, nodes[0]);

    function setLevel(level, node) {
        if (!checkedNodes.includes(node.id) && level > node.level || node.level === undefined) {
            checkedNodes.push(node.id);
            node.level = level;

            level += 1;

            for (let i = 0; i < node.children.length; i++) {
                setLevel(level, getNodeById(node.children[i]));
            }
        }
    }
    function getNodeById(id) {
        return nodes.filter(node => node.id === id)[0];
    }
    return nodes;
}

function getChildren(scene) {
    return scene.responses.map(response => response.nextScene);
}