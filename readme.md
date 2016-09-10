# Egg Engine (to be renamed)

A generic game engine. For now this is pretty hacked together. Things might get better in the future!

Currently this is only set up to work on Windows. It should be fairly straightforward to get it working on other platforms, but I don't have ready access to them.


## Plans

Do I look like someone who is planning things in advance?

Really though, the plan is to take my hacked together pile of crap and make small games with them (the example games) to figure out what I actually need in the engine and how I actually want things to look and to work. Over time I will update and replace pieces as necessary. If you've somehow gotten access to this repository, hopefully I've actually given it to you and you know what's up.

Ultimately the development is driven by what I want out of the engine. I have a lot of games I want to make at some point. I'd like to build myself the tools I need to build those games. If you (the hypothetical reader) have a use-case that I'm not meeting, then maybe in the future it will come up. For the time being though, it's more than likely you'll have to address that yourself.


## Usage

Just run the Egg shortcut (or .engine/egg.exe). This will open the launcher/project manager.


## Current technologies

- Electron: <https://github.com/atom/electron>
- PIXI.js: <http://www.pixijs.com/>
- Underscore: <http://underscorejs.org>
- Typescript: <http://typescriptlang.org>


## Roadmap

This is stuff I intend to do, and/or am actively working on. I'm trying to keep this up to date with my commits.

- RPGKit
    - Add Sell to shop
    - Add dialog box options -- yes/no, more complicated things
    - Make up/down axis work in menus like up/down buttons
    - Add saving/loading games
    - Add scripted movement for entities in Scenes
    - Add scripted movement and wandering for entities on the map
    - Load CSS all at the beginning somehow so you don't get flashes of unstyled content when opening menus
    - It'd be nice if the persistent stuff in map was easier to use in general
    - Can I just slurp in all of the map .ts files automatically instead of having to reference each one?
- Reconcile File stuff
    - Don't make it required that the current working directory is actually the gamepath
- More complex songs -- intros, loops, multiple tracks that you can control separately
- Other platforms
    - Mac OS
    - Linux
- config.json should be able to define an expected version, Egg should be smart enough to do the right thing
    - I think this means "shipping" compiled .js blobs of previous versions along with the engine, and having the player select the right one
    - This is irrelevant for exported games; they'll be packaged with the version they were used to create it


## Wish list/Ideas (some day maybe):

Stuff I've thought of and would be nice, or might be useful. I may or may not ever get around to these or consider them worthwhile.

- Other Kits
    - Beef up the Kit system to make it easier to share/use them
    - PlatformerKit (for Metroidvania type games)
    - ActionAdventureKit (for Zelda type games)
    - etc.
- Slim down Electron so the executable isn't so huge
- Replace rendering engine with something SDL-based
- Post-process filters, scaling filters (CRT emulation?)
    - <http://chadaustin.me/2015/11/crts-pixels-and-video-games/>
- Split config.json into necessary game setup vs. player configuration
- Integrate SCSS? ReactJS?
- Other platforms
    - Browser
    - Mobile


## Examples

- **SimpleQuest** - SimpleQuest, a small but complete RPG
    - See simplequest/README.md for more information
    - Currently still a work in progress
- **examples/EggInvaders** - A simple 2-player pong game
- **examples/EggPong** - A partial Space Invaders clone
- **toys** - Random junk that demonstrates something

To run the examples, simply click them in the game list in the launcher.



## Who is responsible for this mess

[Shamus Peveril](http://shamuspeveril.com) &mdash; architect, lead (only) developer, example maker
