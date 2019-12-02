



# Requirements (to contribute)

- Node
- NPM
- Python3 (for scripts)

# Setup

If you just downloaded the numberscope directory, run:

```
$ npm install
```

If you change any of the javascript files besides *toolPage.html*, you must rebuild NScore_bundle.js:
  
You have run
```
$ npm run watch
```
This will begin watching for any changes to those files and automatically rebuilding the NScore_bundle.js file. Alternatively, to rebuild manually run
```
$ npm run build
```
If you're working on toolpage.js no building is needed, it's included as is in the toolpage.html.


# Consult the wiki for the following:
- [Modules](https://github.com/katestange/Numberscope/wiki/Modules)
- [Sequences](https://github.com/katestange/Numberscope/wiki/Sequences)
- [Testing](https://github.com/katestange/Numberscope/wiki/Sequences)
---

# NPM scripts you can run

- "**npm run build**": Build the NScore_bundled.js file.
- "**npm run watch**": Watch for changes that affect NScore.js and automatically build NScore_bundled.js 
- "**npm run init_module**": This will ask you for a name and description then it will create a file for you in the modules directory with the minimal appropriate structure required. It will also register the module by adding a line in the modules.js that includes it in the MODULES object.
- "**npm run init_sequence**": The same but for creating a sequence. The sequence entry is added to the BuiltInSeqs object in *javascript/sequences/sequences.js*.

---

# Testing

Since we're testing code that requires the window, we'll use [mocha](https://mochajs.org/) in the browser. To the run test simply open *tests/tests.html* in any browser. You'll get a checklist of what tests pass and often useful messages if a test fails. This will help you when you write a module or a sequence by eliminating the common errors. Right now the tests only cover drawing modules, tests for sequences will follow soon. 


---

# Important files and folders:

- **website/javascript/modules**: this is where the drawing modules are stored
- **website/javascript/modules/modules.js**: this file stores the MODULES object which acts as a registry for the drawing tools implemented. Adding a drawing module to the MODULES object automatically makes it available on the website.
- **website/javascript/NScore.js**: Numberscore's core javascript file, it handles processing the input from the interface, instantiating modules, creating and starting sketches.
- **website/javascript/Validation.js**: All the validation and processing of the drawing configs and sequences inputs happen here before they're prepared by NScore.
- **website/javascript/sequences/**: this is where all the built in sequences are stored.
- **website/javascript/sequences/sequence.js**: This file contains the sequenceGenerator class and other helper functions for sequences, as well as the builtInSeqeunce which acts as a registry for implemented sequence.
- **website/javascript/toolpage/toolPage.js**: this file holds the logic for the website interface.

---

Some tips:
Javascript makes it very easy to make mistakes, especially ones that go unnoticed. I **strongly** encourage you to use a linter like JShint. You can have it installed with "npm install -g JShint". The best way to use it is to have an editor extension for it that automatically lints your code as you write it. Also, semicolons in javascript seem optional (the engine automatically places it for you if you omit it), until they're not and end up breaking your code. For example
```javascript
let x = 10
let y = 20
(x+y)*2
```
Try running the above code. The paranthesis on the 3rd line tricks the engine into thinking that 2nd line is a function and the 3rd line is its argument. So it'll end up processing the code like this:
```javascript
let x = 10;
let y = 20(x+y)*2;
```
This kind of bug is really frustrating to debug so best to avoid it by explicitly using semicolons.

**Please let me know if there are any bugs, there are bound to be plenty. Feel free to create an issue if one doesn't exist**
