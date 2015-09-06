var Map = Class.extend(
    function init(filename) {
        filename = "" + filename;
        this.data = JSON.parse(readFile(filename));

        this.dataDirectory = filename.substr(0, filename.lastIndexOf('/') + 1);
        this.layers = [];
        this.obstructions = [];
        this.events = [];

        this.mapWidth = this.data.width;
        this.mapHeight = this.data.height;
        this.tileWidth = this.data.tilewidth;
        this.tileHeight = this.data.tileheight;

        this.spriteLayer = null;
    },

    function show(mode, camera) {
        var x, y, t;
        this.camera = camera;

        for (var i in this.data.layers) {
            var layerdef = this.data.layers[i];

            if (layerdef.name.toLowerCase() == 'sprites') {
                this.spritelayer = new SpriteLayer();
                this.spritelayer.setCamera(camera);
                mode.addLayer(this.spritelayer);
            } else if (layerdef.name.toLowerCase() == 'obstructions') {
                this.obstructions = layerdef.data;
            } else if (layerdef.name.toLowerCase() == 'events') {
                for (var i in layerdef.objects) {
                    var event = layerdef.objects[i];
                    // TODO larger zones -- event.height and .width
                    var x = Math.floor(event.x / this.tileWidth);
                    var y = Math.floor(event.y / this.tileHeight);
                    var e = {
                        "type": event.type,
                        "script": event.name
                    };
                    this.events[y * this.mapWidth + x] = e;
                    //log("Event @ " + x + "," + y + ": " + JSON.stringify(e));
                }
            } else if (layerdef.visible) {
                // TODO layer offsets -- layerdef.x and .y
                var layer = new TileLayer(this.dataDirectory + this.data.tilesets[1].image, layerdef.width, layerdef.height, this.tileWidth, this.tileHeight);
                layer.setCamera(camera);
                mode.addLayer(layer);

                for (y = 0; y < this.mapHeight; y++) {
                    for (x = 0; x < this.mapWidth; x++) {
                        t = layerdef.data[y * this.mapWidth + x] + 1 - this.data.tilesets[1].firstgid;
                        if (t != 0) {
                            layer.setTile(x, y, t);
                        }
                    }
                }

                this.layers.push(layer);
            }
        }
    },

    function checkEvent(x, y) {
        return this.events[y * this.mapWidth + x];
    },

    function checkObs(x, y) {
        if (y < 0 || x < 0 || x >= this.mapWidth || y >= this.mapHeight || (y * this.mapWidth + x) >= this.obstructions.length) {
            return false;
        }
        return this.obstructions[y * this.mapWidth + x] != 0;
    },

    function setObs(x, y, o) {
        if (y < 0 || x < 0 || x >= this.mapWidth || y >= this.mapHeight || (y * this.mapWidth + x) >= this.obstructions.length) {
            return;
        }
        this.obstructions[y * this.mapWidth + x] = o;
    }
);