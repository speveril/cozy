# Cozy

A generic game engine.

**Cozy is not currently released. If I do ever release it, it will be under a permissive license (probably something like MIT). If you've somehow gotten access to this repository, hopefully I've actually given it to you and you know what's up; if you'd like to use it just talk to me and I'll probably say "sure".**

Cozy will currently work on Windows, "out of the box". It should be fairly straightforward to get it working on other platforms, it just hasn't happened yet.


## Usage

Just run the `cozy.bat`, which will simply run `.engine/cozy.exe`. This will open the launcher/project manager. I like to make a shortcut on my desktop to `.engine/cozy.exe` so I can find it easily. I hope to make this process less annoying in the future.

Right now, you will need to have npm installed, and to get up and running, you'll need to have NPM installed; run `npm install` in `.engine/resources/app/`. I plan to make this a requirement only if you intend to work on the engine, eventually.


## Current technologies

- Electron: <https://github.com/atom/electron>
- PIXI.js: <http://www.pixijs.com/>
- Underscore: <http://underscorejs.org>
- Typescript: <http://typescriptlang.org>


## Plans

I have a lot of games I want to make at some point and/or have been working on for more than a decade. I keep trying other engines and finding something distasteful about them; I figured if I made my own at least I couldn't blame anyone else. I could also build it with the tools that I am most familiar with and so afford me the most pleasant working environment -- as such the main basis of the engine are web technologies, like HTML and JS.

If you want to use the engine and have a use-case that I'm not meeting, we should talk. For the time being I'm focusing on what I need but maybe there's something I haven't thought of which would be great, or something I'm already planning that I could shuffle forward on the roadmap.


## Examples

- **SimpleQuest** - SimpleQuest, a small but complete RPG
    - See simplequest/README.md for more information
    - Currently still a work in progress
- **vn** - VisualNovel, a barebones swipe at making a visual novel engine
    - Will eventually form the basis of a VisualNovelKit
    - Heavily uh, inspired, by [The Sagittarian](http://www.newgrounds.com/portal/view/560868) by [Hyptosis](http://www.lorestrome.com)
- **examples/CozyInvaders** - A partial Space Invaders clone
- **examples/CozyPong** - A simple 2-player pong game
- **toys** - Random junk that demonstrates something

To run the examples, simply click them in the game list in the launcher.


## Roadmap/"Plan"

### `>>> PRERELEASE`

- Simple Quest/RPGKit specific
    - [...] Playtesting, balancing, bug fixes...
    - [BUG] Save games still aren't recording/loading money
    - [BUG] Save game thumbnails include any letterboxing the window has
    - [ + ] Save games should save the state of the map (tile changes, entity changes, etc) and restore them on load
    - [ + ] Selling interface kind of sucks
    - [???] hide debug map better
    - Double check licensing and attributions

### `>>> MILESTONE v0.1: SIMPLEQUEST RELEASE`

- Figure out next milestone :|
- Bugs/Unsorted
    - [???] Engine loading screen
    - Move "ControlStack" idea into core
    - Don't use <reference>, use imports etc. and something like webpack to generate the output
    - Figure out seamless upgrades
- Project Manager
    - Use an SVG library
    - Choose directory(ies) for project library
    - Make browser NOT close the currently active game
        - or just revisit the whole browser interface in general
    - Manager should only run one game at a time, or at least only one copy of a particular game
- Infrastructure
    - Make glob.js easier to recreate
    - If a project has a `build.js`/`build.ts`, run it after TS compilation
    - Should be able to refresh/reset; the way the message waiting works, this doesn't work the way it should
- Cozy.Sprite
    - change Sprite direction accessors to have degree and radian variants, reading/writing a single internal format and converting as necessary
    - Need to figure out hierarchical/multilayer sprites
        - Give Sprite a Container, put itself in the container and add THAT to the layer's container, then all children sprites can go in there afterward
        - Do I need/want a true hierarchy, or just layers?
    - Support a 'keep' direction or something on sprite animation angles -- just keep playing the same direction as before
- Audio
    - Support not looping music
    - Allow crossfading music
    - Music files that are sequences of tracks, with timing/looping/etc information
- Testing
    - Investigate unit tests
- Data Editor
    - Manage .json files; top level is an object with a ".schemas" key plus "tables" of typed objects
- Reconcile File stuff
    - Don't make it required that the current working directory is actually the gamepath
- Other platforms
    - Mac OS
    - Linux
- RPGKit
    - In-game input config
    - SavedGame should write a version number, and have upgrade functions; when loading a SavedGame, run through each necessary upgrade before returning it
    - Add scripted movement for entities on the map
    - Add Scene.waitAll() which takes multiple generator functions and waits for them all to finish
    - Need a way to chain from another scene, e.g. wait for a door to finish and THEN do another scene function
    - Can I just slurp in all of the map .ts files automatically instead of having to reference each one?
    - It'd be nice if the persistent stuff in map was easier to use in general
    - Zones (large polygons that can be checked, but don't necessarily fire an event when crossing the threshold) ???
    - Menus need some polish
        - Menu should have .menu and .active; selection container should have .selections, and it should just get added by setupSelections
        - Need to provide a better way for menus to return a value to a previous menu -- promises?
    - Allow to lose a battle without a game over
    - Be able to get the outcome of a battle so that code may respond to it differently -- victory vs. flee vs. defeat
- Documentation
    - Better docs on core functions
    - Higher level intro, etc
    - Tutorials
- Release stuff
    - Check if `.engine/src` exists and do not do core watch or compiles if it doesn't
    - config.json should be able to define an expected version, Cozy should be smart enough to do the right thing
        - I think this means "shipping" compiled .js blobs of previous versions along with the engine, and having the player select the right one
        - This is irrelevant for games once exported; they'll be packaged with the version they were used to create it
- Testing
    - Don't ship without tests on engine core; lets me keep track of breaking changes, etc.


### `>>> RELEASE 1.0`

## Wish list/Ideas (some day maybe):

Stuff I've thought of and would be nice, or might be useful. I may or may not ever get around to these or consider them worthwhile.

- Other Kits
    - Beef up the Kit system to make it easier to share/use them
    - PlatformerKit (for Metroidvania type games)
    - ActionAdventureKit (for Zelda type games)
    - etc.
- More complex songs -- intros, loops, multiple tracks that you can control separately
- Slim down Electron so the executable isn't so huge
- Replace rendering engine with something native
    - SDL? OpenGL?
- Post-process filters, scaling filters (CRT emulation?)
    - <http://chadaustin.me/2015/11/crts-pixels-and-video-games/>
- Integrate SCSS? ReactJS?
- Other platforms
    - Browser
    - Mobile



## Who is responsible for this mess

[Shamus Peveril](http://shamuspeveril.com) -- architect, lead (only) developer, example maker
