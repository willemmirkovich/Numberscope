



# Requirements (to contribute)

- Node
- NPM
- Python3 (for scripts)

# Setup

If you just downloaded the numberscope directory, run:

```
$ npm install
```

If you want to work on any of the following:
- sequences
- modules
- NScore.js
  
You must run
```
$ npm run watch
```
This will begin watching for any changes to those files and automatically rebuilding the NScore_bundle.js file. Alternatively, to rebuild manually run
```
$ npm run build
```
If you're working on toolpage.js no building is needed, it's included as is in the toolpage.html.

The reason for the build process is the fact that all "import thing from './thing.js' have been changed to 'thing = require('./thing.js')'. This is for two reasons: 

1. ES6 modules (import thing from 'thing.js') don't work if you serve them directly via the file system (e.g opening toolPage.html in in firefox directly), you have to serve them via a server for them to work properly. By using a bundler like browserify the end product (NScore_bundled.js) can be treated as a normal JS script. This way you don't have to start up a server everytime you want to test something out.
2. Makes it much easier to run automated testing (which is a work in progress).


Consult the wiki for the following:
- [Modules](https://github.com/katestange/Numberscope/wiki/Modules)
- [Sequences](https://github.com/katestange/Numberscope/wiki/Sequences)

---

NPM scripts you can run

- "**npm run build**": Build the NScore_bundled.js file.
- "**npm run watch**": Watch for changes that affect NScore.js and automatically build NScore_bundled.js 
- "**npm run check_module [file]**": A lot of the drawing tools that were converted to our module format were forgetting to change some parts that were using global p5 methods and instances (for example "line" or "background"), which should instead use the handle "sketch" (like "sketch.line" and "sketch.background"). Running this tool will scan the file for any usage of p5 keywords without *this.sketch*, but ***it can detect something that has nothing to do with p5 and if so just ignore it*** (e.g if you name a variable "line" you're fine, if you're using the p5 function "line" you should change it, the script can't tell the differences. It's good to run and go through line by line to make sure. )
- "**npm run init_module**": This will ask you for a name and description then it will create a file for you in the modules directory with the minimal appropriate structure required. It will also register the module by adding a line in the modules.js that includes it in the MODULES object.
- "**npm run init_sequence**": The same but for creating a sequence. The sequence entry is added to the BuiltInSeqs object in *javascript/sequences/sequences.js*.

---

Important files and folders:
- **javascript/modules**: this is where the drawing modules are stored
- **javascript/modules/modules.js**: there is an object called MODULES which holds all the modules, once a new module is added to the directory, it must be imported in modules.js and also added to the MODULES object. 
- **javascript/NScore.js**: Numberscore's core javascript file, it handles processing the input from the interface, instantiating modules, creating and starting sketches.
- **javascript/sequences/**: this is where all the build in sequences are stored.
- **javascript/sequences/sequence.js**: This file contains the sequenceGenerator class and other helper functions for sequences.
- **javascript/toolpage/toolPage.js**: this file holds the logic for the website interface.

Things that need to get done:
- ~~Implement other input method for sequence~~
- Convert the TA-visualizers to the module format
- Implement error-handling mechanism for sequence parameters and viz configs.
- Layout of the sketches acts weird when the browser is resized (actually it's weird in general, in chrome the elements are huge)
- ~~A pause button to pause all the sketches~~ 
- builtin examples of sequence/tool pairings
- some sort of testing environment to help when writing the modules


- Please let me know if there are any bugs, there are bound to be plenty.
