module RPG.Map.Loader {
    export function TMX(path:string, existingMap?:Map) {
        var map = existingMap || new RPG.Map.Map({});

        var parser = new DOMParser(); // TODO XML type for File.read()?
        var dataDirectory = path.substr(0, path.lastIndexOf('/') + 1);
        var data = parser.parseFromString(Cozy.gameDir.file(path).read(), "text/xml");
        var mapEl = data.getElementsByTagName('map')[0];

        map.filename = path;
        map.size = new PIXI.Point(parseInt(mapEl.getAttribute('width'), 10), parseInt(mapEl.getAttribute('height'), 10));
        map.tileSize = new PIXI.Point(parseInt(mapEl.getAttribute('tilewidth'), 10), parseInt(mapEl.getAttribute('tileheight'), 10));

        // TODO ??
        var propertyMap = {
            'Name': 'displayName'
        };

        _.each(mapEl.children, (el:HTMLElement) => {
            switch (el.tagName) {
                case "properties":
                    _.each(el.children, (propEl:HTMLElement) => {
                        var key = propEl.getAttribute('name');
                        if (propertyMap[key]) {
                            map[propertyMap[key]] = propEl.getAttribute('value');
                        } else {
                            console.warn(`Ignoring unrecognized property called '${key}'.`);
                        }
                    });
                    break;
                case "tileset":
                    if (el.getAttribute('source')) {
                        var ts = TSX(dataDirectory, el.getAttribute('source'));
                        map.addTileSet(parseInt(el.getAttribute('firstgid'), 10), ts);
                    }
                    // TODO support non-external tilesets; not sure what they look like yet

                    break;
                case "layer":
                    // TODO this assumes encoding="csv" but that may not be true
                    var dataEl:HTMLElement = <HTMLElement>el.getElementsByTagName('data')[0];
                    var tileString = dataEl.innerHTML.replace(/\s/g, '');

                    var layer = new MapLayer(el.getAttribute("name"));
                    map.addLayer(layer);
                    layer.map = map;
                    layer.tiles = [];
                    layer.tileLookup = [];
                    _.each(tileString.split(','), (x) => layer.tiles.push(parseInt(x, 10)));
                    break;
                case "objectgroup":
                    var layer = new MapLayer(el.getAttribute("name"));
                    map.addLayer(layer);
                    layer.map = map;
                    layer.obstructions = [];
                    layer.events = [];
                    layer.triggers = [];
                    layer.entities = [];
                    _.each(el.children, (objectEl:HTMLElement) => {
                        var x = parseInt(objectEl.getAttribute('x'), 10),
                            y = parseInt(objectEl.getAttribute('y'), 10);

                        switch(objectEl.getAttribute('type')) {
                            case "event":
                                var w = parseInt(objectEl.getAttribute('width'), 10),
                                    h = parseInt(objectEl.getAttribute('height'), 10),
                                    propertiesEl = <HTMLElement>objectEl.getElementsByTagName('properties')[0],
                                    ev = new MapEvent(map.tileSize);
                                ev.name = objectEl.getAttribute('name');
                                ev.rect = new PIXI.Rectangle(x, y, w, h);
                                ev.properties = {};
                                if (propertiesEl) {
                                    _.each(propertiesEl.children, (property) => {
                                        ev.properties[property.getAttribute('name')] = property.getAttribute('value');
                                    });
                                }

                                ev.obstructions = [];
                                var o:MapObstruction = new MapObstruction(new PIXI.Point(x,y), new PIXI.Point(x+w,y));
                                layer.obstructions.push(o);
                                ev.obstructions.push(o);
                                o = new MapObstruction(new PIXI.Point(x,y), new PIXI.Point(x,y+h));
                                layer.obstructions.push(o);
                                ev.obstructions.push(o);
                                o = new MapObstruction(new PIXI.Point(x,y+h), new PIXI.Point(x+w,y+h))
                                layer.obstructions.push(o);
                                ev.obstructions.push(o);
                                o = new MapObstruction(new PIXI.Point(x+w,y), new PIXI.Point(x+w,y+h));
                                layer.obstructions.push(o);
                                ev.obstructions.push(o);

                                ev.solid = false;
                                layer.events.push(ev);
                                break;
                            case "trigger":
                                var w = parseInt(objectEl.getAttribute('width'), 10),
                                    h = parseInt(objectEl.getAttribute('height'), 10),
                                    propertiesEl = <HTMLElement>objectEl.getElementsByTagName('properties')[0],
                                    tr = new MapTrigger(map.tileSize);
                                tr.name = objectEl.getAttribute('name');
                                tr.rect = new PIXI.Rectangle(x, y, w, h);
                                tr.properties = {};
                                if (propertiesEl) {
                                    _.each(propertiesEl.children, (property) => {
                                        tr.properties[property.getAttribute('name')] = property.getAttribute('value');
                                    });
                                }

                                if (tr.properties['solid']) {
                                    tr.solid = (objectEl.getAttribute('solid') === 'true' || objectEl.getAttribute('solid') === '1');
                                    delete(tr.properties['solid']);
                                }

                                tr.obstructions = [];
                                var o:MapObstruction = new MapObstruction(new PIXI.Point(x,y), new PIXI.Point(x+w,y));
                                layer.obstructions.push(o);
                                tr.obstructions.push(o);
                                o = new MapObstruction(new PIXI.Point(x,y), new PIXI.Point(x,y+h));
                                layer.obstructions.push(o);
                                tr.obstructions.push(o);
                                o = new MapObstruction(new PIXI.Point(x,y+h), new PIXI.Point(x+w,y+h))
                                layer.obstructions.push(o);
                                tr.obstructions.push(o);
                                o = new MapObstruction(new PIXI.Point(x+w,y), new PIXI.Point(x+w,y+h));
                                layer.obstructions.push(o);
                                tr.obstructions.push(o);

                                layer.triggers.push(tr);
                                break;
                            case "entity":
                                var propertiesEl = <HTMLElement>objectEl.getElementsByTagName('properties')[0],
                                    args = {
                                        name: objectEl.getAttribute('name')
                                    };
                                x += parseInt(objectEl.getAttribute('width'), 10) / 2;
                                y += parseInt(objectEl.getAttribute('height'), 10) / 2;
                                if (propertiesEl) {
                                    _.each(propertiesEl.children, (property) => {
                                        args[property.getAttribute('name')] = property.getAttribute('value');
                                    });
                                }
                                var e = new Entity(args);
                                e.spawn = new PIXI.Point(x, y);
                                layer.entities.push(e);
                                break;
                            case 'camerabox':
                                var w = parseInt(objectEl.getAttribute('width')),
                                    h = parseInt(objectEl.getAttribute('height'));
                                map.cameraBoxes.push(new PIXI.Rectangle(x, y, w, h));
                                break;
                            default:
                                var name = objectEl.hasAttribute('name') ? objectEl.getAttribute('name') : null;
                                if (objectEl.hasAttribute('width') && objectEl.hasAttribute('height')) {
                                    var w = parseInt(objectEl.getAttribute('width'), 10),
                                        h = parseInt(objectEl.getAttribute('height'), 10);
                                    layer.obstructions.push(new MapObstruction(new PIXI.Point(x,y), new PIXI.Point(x+w,y), name));
                                    layer.obstructions.push(new MapObstruction(new PIXI.Point(x,y), new PIXI.Point(x,y+h), name));
                                    layer.obstructions.push(new MapObstruction(new PIXI.Point(x,y+h), new PIXI.Point(x+w,y+h), name));
                                    layer.obstructions.push(new MapObstruction(new PIXI.Point(x+w,y), new PIXI.Point(x+w,y+h), name));
                                } else {
                                    _.each(objectEl.children, (defEl:HTMLElement) => {
                                        switch(defEl.tagName) {
                                            case 'polyline':
                                                var points = defEl.getAttribute('points').split(" ");
                                                var last_point:PIXI.Point = null;
                                                _.each(points, (pt) => {
                                                    var pts = pt.split(",");
                                                    var point = new PIXI.Point(parseInt(pts[0], 10) + x, parseInt(pts[1],10) + y );
                                                    if (last_point !== null) {
                                                        layer.obstructions.push(new MapObstruction(last_point, point, name));
                                                    }
                                                    last_point = point;
                                                });
                                                break;
                                        }
                                    });
                                }
                        }
                    });
                    break;
                default:
                    console.warn(`Ignoring unknown tag named '${el.tagName}'.`);
            }
        });

        map.cameraBoxes.push(new PIXI.Rectangle(0, 0, map.size.x * map.tileSize.x, map.size.y * map.tileSize.y));
        return map;
    }
}
