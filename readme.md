# Egg Engine

A generic game engine. For now this is pretty hacked together. Things might get better in the future!


## Plans

Do I look like someone who is planning things in advance?

Really though, the plan is to take my hacked together pile of crap and make small games with them (the example games) to figure out what I actually need in the engine and how I actually want things to look and to work. Over time I will update and replace pieces as necessary. If you've somehow gotten access to this repository, hopefully I've actually given it to you and you know what's up.

Ultimately the development is driven by what I want out of the engine. I have a lot of games I want to make at some point. I'd like to build myself the tools I need to build those games. If you (the hypothetical reader) has a use-case that I'm not meeting, then maybe in the future it will come up. For the time being though, it's more than likely you'll have to address that yourself.


## Current technologies

- PIXI.js: <http://www.pixijs.com/>
- Electron: <https://github.com/atom/electron>
- Underscore: <http://underscorejs.org>
- Typescript: <http://typescriptlang.org>


## Roadmap/TODOs

- RPG-style "kit" (top-down movement system and obstructions, event zones, etc)
- A "native" sprite JSON format
- "Kit" system -- optional plugin style things for your game ?
- Event system (to allow multi-stage events spanning many frames)

Maybe/probably?

- Side-scrolling platformer kit
- Slim down Electron so the executable isn't so huge
- Replace rendering engine with something SDL-based


## Examples

- **example_pong**: A simple 2-player pong game
- **example_invaders**: A partial Space Invaders clone
- **example_rpg**: SimpleQuest, a small RPG
    - Uses the Tiny16 tileset created by Lanea Zimmerman (http://opengameart.org/content/tiny-16-basic)


## Who is responsible for this mess

[Shamus Peveril](http://shamuspeveril.com) -- architect, lead (only) developer, example maker
