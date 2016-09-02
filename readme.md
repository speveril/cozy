# Egg Engine

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

## Roadmap/TODOs

- RPGkit
    - ...
- Reconcile File stuff
    - Don't make it required that the current working directory is actually the gamepath
- Make it work in a browser too
- config.json should be able to define an expected version, Egg should be smart enough to do the right thing

Feature wish list (some day):

- PlatformerKit
- Slim down Electron so the executable isn't so huge
- Replace rendering engine with something SDL-based
- Post-process filters, scaling filters (CRT emulation?)
    - <http://chadaustin.me/2015/11/crts-pixels-and-video-games/>
- More complex songs -- intros, loops, multiple tracks that you can control separately

## Things to consider/remember

- Split config.json into necessary game setup vs. player configuration
- Integrate SCSS? ReactJS?
- It'd be nice if the persistent stuff in map was easier to use in general
- Should I treat other entities for purposes of collisions as circles?
- Can I just slurp in all of the map .ts files automatically instead of having to reference each one?


## Examples

- **example_pong**: A simple 2-player pong game
- **example_invaders**: A partial Space Invaders clone
- **simplequest**: SimpleQuest, a small RPG
    - See simplequest/README.md for more information

To run the examples, simply click them in the game list in the launcher.



## Who is responsible for this mess

[Shamus Peveril](http://shamuspeveril.com) -- architect, lead (only) developer, example maker
