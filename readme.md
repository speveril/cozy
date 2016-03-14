# Egg Engine

A generic game engine. For now this is pretty hacked together. Things might get better in the future!


## Plans

Do I look like someone who is planning things in advance?

Really though, the plan is to take my hacked together pile of crap and make small games with them (the example games) to figure out what I actually need in the engine and how I actually want things to look and to work. Over time I will update and replace pieces as necessary. If you've somehow gotten access to this repository, hopefully I've actually given it to you and you know what's up.

Ultimately the development is driven by what I want out of the engine. I have a lot of games I want to make at some point. I'd like to build myself the tools I need to build those games. If you (the hypothetical reader) have a use-case that I'm not meeting, then maybe in the future it will come up. For the time being though, it's more than likely you'll have to address that yourself.


## Command line parameters

    egg/egg.exe <game>

Egg expects a game directory (that is, a directory that contains a **config.json** and a **main.js**) as its primary parameter. If it is omitted, it will assume the current directory. It will (currently) fail to run if it can't find a game there.

You can supply the following parameters as well:

- **--init <dirname>**: Initialize a new game in <dirname>. Fails if there's already a game there.
- **--build**: Compile the game, if it's written in Typescript. Only necessary if you're developing in TS; if you're using plain JS then you won't need a build step.
- **--debug**: Start the game in debug mode.
- **--console**: Start with the debug console open.
- **--buildcore**: Build the Egg core and documentation. Only necessary if you're doing actual engine development.
- **--noplay**: Don't actually run the game. Use in combination with --build, --buildcore, or --init.


## Current technologies

- Electron: <https://github.com/atom/electron>
- PIXI.js: <http://www.pixijs.com/>
- Underscore: <http://underscorejs.org>
- Typescript: <http://typescriptlang.org>

## Roadmap/TODOs

- RPGkit
  * Battle should actually use the Menu stuff rather than rolling its own
  * Branching Scenes
- Reconcile File stuff
- Make it work in a browser too

Feature wish list (some day):

- PlatformerKit
- Slim down Electron so the executable isn't so huge
- Replace rendering engine with something SDL-based
- Post-process filters, scaling filters (CRT emulation?) <http://chadaustin.me/2015/11/crts-pixels-and-video-games/>
- More complex songs -- intros, loops, multiple tracks that you can control separately

## Things to consider/remember

- Make it easier to work with the HTML elements in the overlay.
- Rename RenderPlane to SpritePlane?
- Split config.json into necessary game setup vs. player configuration
- Integrate SCSS?
- Events should really only trigger on entering the tile, not every frame (I was thinking of including "zones" for continuous fire events)
- It'd be nice if the persistent stuff in map was easier to use in general
- Should I treat other entities for purposes of collisions as circles?
- Move the dist/closestpoint/etc functions in Entity into a general util somewhere
- Can I just slurp in all of the map .ts files automatically instead of having to reference each one?


## Examples

- **example_pong**: A simple 2-player pong game
- **example_invaders**: A partial Space Invaders clone
- **simplequest**: SimpleQuest, a small RPG
    - Uses the Tiny16 tileset created by Lanea Zimmerman (http://opengameart.org/content/tiny-16-basic)

To run the examples, drag the game directory you'd like to play onto the **egg.exe** shortcut in the root of the repository.



## Who is responsible for this mess

[Shamus Peveril](http://shamuspeveril.com) -- architect, lead (only) developer, example maker
