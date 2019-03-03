# Cozy
## A generic 2d game engine.

https://cozyengine.com/

Cozy is a game engine built on web technologies. The development environment, and games that are exported to run on Windows or MacOS, run under the Electron runtime -- <https://github.com/atom/electron>. Games exported for the web should work in Chrome, at least, and over time we'll try to make sure support gets better.

### Current technologies

- Electron: <https://electronjs.org/>
- PIXI.js: <http://www.pixijs.com/>
- Typescript: <http://typescriptlang.org>

### Development Focus

Cozy is most appropriate for 2d, retro-style games. Theoretically you could build a 3d game within it, but that's much more hypothetical than it would be practical. For the foreseeable future, Cozy's focus as an engine is ease and speed of development, with "good enough" performance.

I personally have a lot of games I want to make at some point or have been working on for a while. I keep trying other engines and finding something distasteful about them; I figured if I made my own at least I couldn't blame anyone else. I chose to build it with the tools that I am most familiar with and so afford me the most pleasant working environment, and since I'm a professional web developer, the main basis of the engine are web technologies.

The engine's initial development was driven entirely by my needs of it. If you are using the engine and have a use-case that I'm not meeting, we should talk -- maybe there's something I haven't thought of which would be great, or something I'm already planning that I could shuffle forward on the roadmap. I'd also love other contributors to step in and add things they want to see, even if it's something I don't personally need!

## Getting Started

**We don't have a pre-built release of Cozy yet. To work with Cozy, you'll need to have NPM installed and put up with some rough edges for now.**

After cloning the repository, run `npm install` to get everything set up, and then run `npm start` to start the project manager. Once I get pre-built releases going, this will no longer be necessary. Quality of life stuff like that is high on the priority list.

One of the biggest missing pieces of Cozy right now is documentation. I like to think things are reasonably sensible, but they're probably not! Good luck. Fixing this is pretty high up there too. For now, when you first run the Cozy project manager, it should build the engine and some lackluster auto-built documentation. You can find the auto-generated documentation in the `docs/` directory under your Cozy check out.

Whether you use a pre-built release or work from source, exported games will end up as an .exe or .app bundle; your players will not need NPM installed.

### Kits

The core of Cozy is meant to be a straight-forward, generic game engine. It lets you put sprites on the screen, play sounds, handle input, etc. Games are more than this, though! So Cozy is built to have pluggable gameplay bits, or "kits", that implement game-genre specific functionality so you don't have to write it all yourself.

Right now there's only one kit, and it's not on github yet: RPGKit. It's intended to help in making jRPGs and other top-down adventure games. I have other kits in mind, but have not started development on them yet.

## Examples

A game engine without any examples isn't worth much. There are some example games here: https://github.com/speveril/cozy-examples

Clone that repository onto your local machine, and then within Cozy's UI hit the "Add a Game Library" button (it's a + icon at the top left), and choose the place you cloned the examples into. They should now show up in your interface for you to play.

### SimpleQuest

There is another example as well! SimpleQuest was built with Cozy as a way to shake out any problems with the engine by building a game end-to-end. It also formed the basis of the RPGKit code.

http://speveril.itch.io/simplequest

Once I have cleaned it up a bit more, I will be releasing the source for SimpleQuest as well, along with RPGKit.

## Who is responsible for this mess

[Shamus Peveril](http://shamuspeveril.com) -- architect, lead (only) developer, example maker