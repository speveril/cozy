var ms_potsSmashed = 0;

// -- map switches

function enter_town(args) {
    if (playerSprite.dir == direction.RIGHT) {
        mapSwitch("map/town.json", 1, 6);
    } else {
        mapSwitch("map/town.json", 8, 1);
    }

    ms_potsSmashed = 0;
    camera_options.follow = false;
}

function exit_town(args) {
    if (args.y < 1) {
        mapSwitch("map/overworld.json", 14, 12);
    } else {
        mapSwitch("map/overworld.json", 13, 13);
    }

    camera_options.follow = false;
}

function enter_forest(args) {
    if (args.x == 13 && args.y == 8) {
        mapSwitch("map/forest.json", 7, 43);
    } else {
        mapSwitch("map/forest.json", 32, 1);
    }

    camera_options.follow = true;
}

function exit_forest(args) {
    if (args.y == 0) {
        mapSwitch("map/overworld.json", 16, 5);
    } else {
        mapSwitch("map/overworld.json", 13, 9)
    }
}

// -- generic world manipulation

function open_door(args) {
    if (map.layers[1].getTile(args.x, args.y) == 5) {
        map.layers[1].setTile(args.x, args.y, 6);
    } else if (map.layers[1].getTile(args.x, args.y) == 21) {
        map.layers[1].setTile(args.x, args.y, 22);
        map.setObs(args.x, args.y, 0);
    }
}

function trigger_pot(args) {
    var t = map.layers[1].getTile(args.x, args.y);
    if (t == 53) {
        map.layers[1].setTile(args.x, args.y, 54);
        map.setObs(args.x, args.y, 0);
        ms_potsSmashed++;
        if (ms_potsSmashed == 4) {
            Textbox.show("You've broken all the pots.\n\nAre you proud of yourself now?");
        }
    }
}

function trigger_chest(args) {
    var t = map.layers[1].getTile(args.x, args.y);
    if (t == 37) {
        map.layers[1].setTile(args.x, args.y, t + 1);
        Textbox.show("There was nothing in the chest. How disappointing.");
    }
}

// -- specific world manipulation

function sign_house(args) {
    Textbox.show("An empty house");
}

function sign_shops(args) {
    Textbox.show("Shopping is fun!");
}

function trigger_rocks(args) {
    Textbox.show("I... found some rocks");
}
