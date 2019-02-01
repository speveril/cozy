# Cozy
## A generic 2d game engine.

https://cozyengine.com/

---

**Cozy is not currently released.** If you have access to this already, I've given you pre-release access. Hooray! Please don't spread it around yet. I'm going to release this under an MIT license (already present in LICENSE); mostly I'd just like to limit its reach at this point until I've had time to file off some of the most embarassing rough edges. Thanks!

---

Cozy is a game engine built on web technologies. The development environment, and games that are exported to run on Windows or MacOS, run under the Electron runtime -- <https://github.com/atom/electron>. Games exported for the web should work in Chrome, at least, and over time we'll try to make sure support gets better.

Cozy is most appropriate for 2d, retro-style games. Theoretically you could build a modern 3d game within it, but that's much more hypothetical than it would be practical. For the foreseeable future, Cozy's focus as an engine is ease and speed of development, with "good enough" performance.

### Current technologies

- Electron: <https://electronjs.org/>
- PIXI.js: <http://www.pixijs.com/>
- Typescript: <http://typescriptlang.org>

### Why am I doing this?

I personally have a lot of games I want to make at some point and/or have been working on for more than a decade. I keep trying other engines and finding something distasteful about them; I figured if I made my own at least I couldn't blame anyone else. I could also build it with the tools that I am most familiar with and so afford me the most pleasant working environment -- as such the main basis of the engine are web technologies, like HTML and JS.

The engine's development initial development was driven entirely by my needs of it. If you are using the engine and have a use-case that I'm not meeting, we should talk -- maybe there's something I haven't thought of which would be great, or something I'm already planning that I could shuffle forward on the roadmap. I'd also love other contributors to step in and add things they want to see, even if it's something I don't personally need!

## Usage

**To work with Cozy, you'll need to have NPM installed**; run `npm install` to get everything set up, and then run `npm start` to start the project manager. I plan to make this a requirement only if you intend to actually work on the engine, eventually.

Exported games will end up as an .exe or .app bundle; your players will not need NPM installed.

One of the biggest missing pieces of Cozy right now is documentation. I like to think things are reasonably sensible, but they're probably not! Good luck.

### Kits

The core of Cozy is meant to be a straight-forward, generic game engine. It lets you put sprites on the screen, play sounds, handle input, etc. Games are more than this, though! So Cozy is built to have pluggable gameplay bits, or "kits", that implement game-genre specific functionality so you don't have to write it all yourself.

Right now there's only one kit, and it's not on github yet: RPGKit. It's intended to help in making jRPGs and other top-down adventure games.

Current kits I'd like to build are a PlatformerKit and a VisualNovelKit.

## Examples

A game engine without any examples isn't worth much. At some point I will get a repository of example games up on github so you can see the breadth of the possibilities of the engine.

### SimpleQuest

There is one example, though! SimpleQuest was built with Cozy as a way to shake out any problems with the engine by building a game end-to-end. It also formed the basis of the RPG Kit code.

http://speveril.itch.io/simplequest

## Who is responsible for this mess

[Shamus Peveril](http://shamuspeveril.com) -- architect, lead (only) developer, example maker