var app1 = new Vue({
    el: '#graph-viewer',
    data: {
        checked: [],
        selected: "",
        graphOptions: {
            physics: {enabled: false},
            interaction: {
                dragNodes: true,
                hover: true,
                zoomView: false
            },
            layout: {
                hierarchical: {
                    enabled: true,
                    nodeSpacing: 1000,
                    sortMethod: 'directed',
                    levelSeparation: 400
                }
            },
            edges: {
                arrows: {
                    to: {enabled: true, scaleFactor: 1, type: 'arrow'}
                }
            },
            nodes: {
                font: {size: 20},
                shape: 'image',
                margin: 10,
                size: 140,
                heightConstraint: {
                    minimum: 120
                }
            }
        },
        hiddenNodes: [],
        initNodes: [],
        initEdges: [],
        nodes: new vis.DataSet([]),
        edges: new vis.DataSet([]),
        container: document.getElementById('graph-container'),
        network: null,
        gameJSON: window.game
    },
    computed: {
        idList: function () {
            return this.nodes.getIds()
        },
        nodeLabels: function () {
            if (this.network) {
                let nodes = this.nodes.get({
                    filter: function (node) {
                        return node.hidden == false;
                    }
                });

                let labels = nodes.map(node => {
                    let coordinates = {
                        x: this.network.getBoundingBox(node.id).right,
                        y: this.network.getBoundingBox(node.id).top
                    };
                    let labelCoordinates = this.network.canvasToDOM(coordinates);
                    let newLabel = {
                        top: labelCoordinates.y,
                        left: labelCoordinates.x,
                        title: node.id,
                        summary: this.getSummary(node.id)
                    };
                    return newLabel;
                });


                for (let node of this.nodes) {

                }

                return labels;
            } else {
                return [];
            }
        }
    },
    mounted: function () {
        this.convertJsonToGraph().then(() => {
            this.network = new vis.Network(
                this.container,
                {
                    nodes: this.nodes,
                    edges: this.edges
                },
                this.graphOptions
            );
            let component = this;
            this.network.on("click", function (params) {
                console.log(params);
                component.selected = params.nodes[0];
            });
            this.network.moveTo({
                position: this.network.getPositions(["crisis"])["crisis"],
                scale: 0.4
            });
        });
    },
    methods: {
        updateSelected: function (item) {
            if (item) {
                console.log(item);
                this.network.selectNodes([item]);
            }
        },
        convertJsonToGraph: function () {
            return gameToGraph(this.gameJSON).then(data => {
                this.initNodes = data.nodes;
                this.initEdges = data.forwardEdges;
                this.nodes = new vis.DataSet(this.initNodes);
                this.edges = new vis.DataSet(this.initEdges);
            });
        },
        resetGraph: function () {
            this.edges.clear();
            this.nodes.update(this.initNodes);
            this.edges.update(this.initEdges);
        },
        showNode: function (id) {
            if (!this.hiddenNodes.includes(id)) return;
            this.resetGraph();
            for (let counter = 0; counter < this.hiddenNodes.length; counter++) {
                let node = this.hiddenNodes[counter];
                if (node === id) {
                    this.hiddenNodes.splice(counter, 1);
                }
            }
            this.hiddenNodes.map(this.hideNode);
        },
        hideNode: function (id) {
            this.nodes.update({id: id, hidden: true});
            if (!this.hiddenNodes.includes(id)) {
                this.hiddenNodes.push(id);
            }
            this.hideNodeEdges(id);
        },
        hideNodeEdges: function (id) {
            let edges = this.network.getConnectedEdges(id).map(edge => this.edges.get(edge));
            let parents = this.getParentNodes(id, edges);
            let children = this.getChildNodes(id, edges);
            this.edges.remove(this.network.getConnectedEdges(id));
            this.addEdges(parents, children);
        },
        getParentNodes: function (id, edges) {
            let parentIds = [];
            edges.forEach(
                edge => {
                    if (id === edge.to && !parentIds.includes(id)) {
                        parentIds.push(edge.from);
                    }
                }
            );
            return this.nodes.get(parentIds);
        },
        getChildNodes: function (id, edges) {
            let children = [];
            edges.forEach(
                edge => {
                    if (id === edge.from && !children.includes(id)) {
                        children.push(edge.to);
                    }
                }
            );
            return this.nodes.get(children);
        },
        addEdges: function (parents, children) {
            for (let parent of parents) {
                for (let child of children) {
                    this.edges.update({from: parent.id, to: child.id});
                }
            }
        },
        print: function () {
            this.onBeforePrint.call(this);

            setTimeout(() => {
                window.print();
                this.onAfterPrint.call(this);
            }, 500);
        },
        onBeforePrint: function () {
            document.getElementById("graph-viewer").classList.add("print");
            document.getElementById("graph-container").classList.add("print");
            document.getElementById("node-label-container").classList.add("print");
            this.network.fit();
            this.network.redraw();
        },
        onAfterPrint: function () {
            document.getElementById("graph-viewer").classList.remove("print");
            document.getElementById("graph-container").classList.remove("print");
            document.getElementById("node-label-container").classList.remove("print");
            this.network.redraw();
        },
        toggleNodeView: function (id) {
            this.hiddenNodes.includes(id) ? this.showNode(id) : this.hideNode(id);
        },
        getSummary: function (id) {
            let label;
            let message;
            let gameScenes = this.gameJSON.scenes;
            let focusScene = gameScenes.find(x => x.id == id);

            if (Array.isArray(focusScene.textboxes) && focusScene.textboxes.length > 0 && focusScene.textboxes[0].text) {
                message = focusScene.textboxes[0].text;
                label = message.substring(0, 50);
            } else if (Array.isArray(focusScene.script) && focusScene.script.length > 0 && focusScene.script[focusScene.script.length -1].text) {
                message = focusScene.script[focusScene.script.length -1].text;
                label = message.substring(0, 50);
            }
            label = label.replace(/<(?:.|\n)*?>/gm, '');

            // TODO: add line break after x number of characters
            //label = label.replace(/(.{20})/g, "\n");

            return label;
        }
    }
});