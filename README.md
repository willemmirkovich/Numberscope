 

Important files and folders:
- **javascript/modules**: this is where the drawing modules are stored
- **javascript/modules/modules.js**: there is an object called MODULES which holds all the modules, once a new module is added to the directory, it must be imported in modules.js and also added to the MODULES object. 
- **javascript/core/NScore.js**: Numberscore's core javascript file, it handles processing the input from the interface, instantiating modules, creating and starting sketches.
- **javascript/core/Sequence.js**: This file contains built in sequences, and the sequenceGenerator class.
- **javascript/toolpage/toolPage.js**: this file holds the logic for the website interface.

Things that need to get done:
- ~~Implement other input method for sequence~~
- Convert the TA-visualizers to the module format
- Implement error-handling mechanism for sequence parameters and viz configs.
- Layout of the sketches acts weird when the browser is resized
- ~~A pause button to pause all the sketches~~ 
- builtin examples of sequence/tool pairings
- some sort of testing environment to help when writing the modules