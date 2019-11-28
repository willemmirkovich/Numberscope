(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
SEQUENCE = require('./sequences/sequences.js')
VALIDOEIS = require('./validOEIS.js')
MODULES = require('./modules/modules.js')

BuiltInSeqs = SEQUENCE.BuiltInSeqs
ListToSeq = SEQUENCE.ListToSeq
OEISToSeq = SEQUENCE.OEISToSeq
BuiltInNameToSeq = SEQUENCE.BuiltInNameToSeq

function stringToArray(strArr) {
	return JSON.parse("[" + strArr + "]")
}

const NScore = function () {
	const modules = MODULES //  classes to the drawing modules 
	const validOEIS = VALIDOEIS
	var preparedSequences = []; // sequenceGenerators to be drawn
	var preparedTools = []; // chosen drawing modules 
	var liveSketches = []; // p5 sketches being drawn

	/**
	 *
	 *
	 * @param {*} moduleClass drawing module to be used for this sketch
	 * @param {*} config corresponding config for drawing module
	 * @param {*} seq sequence to be passed to drawing module
	 * @param {*} divID div where sketch will be placed
	 * @param {*} width width of sketch
	 * @param {*} height height of sketch
	 * @returns p5 sketch
	 */
	const generateP5 = function (moduleClass, config, seq, divID, width, height) {

		//Create canvas element here
		var div = document.createElement('div');
		//The style of the canvases will be "canvasClass"
		div.className = "canvasClass"
		div.id = "liveCanvas" + divID
		document.getElementById("canvasArea").appendChild(div);
		//-------------------------------------------
		//Create P5js instance
		let myp5 = new p5(function (sketch) {
			let moduleInstance = new moduleClass(seq, sketch, config)
			sketch.setup = function () {
				sketch.createCanvas(width, height);
				sketch.background("white")
				moduleInstance.setup();
			};

			sketch.draw = function () {
				moduleInstance.draw()
			}
		}, div.id);
		return myp5;
	}

	/**
	 * When the user chooses a drawing module and provides corresponding config
	 * it will automatically be passed to this function, which will validate input
	 * and append it to the prepared tools
	 * @param {*} moduleObj information used to prepare the right drawing module, this input
	 * this will contain an ID, the moduleKey which should match a key in MODULES_JSON, and
	 * a config object.
	 */
	const receiveModule = function (moduleObj) {
		if ((moduleObj.ID && moduleObj.moduleKey && moduleObj.config && modules[moduleObj.moduleKey]) == undefined) {
			console.error("One or more undefined module properties received in NScore");
		} else {
			preparedTools[moduleObj.ID] = {
				module: modules[moduleObj.moduleKey],
				config: moduleObj.config,
				ID: moduleObj.ID
			};
		}
	}

	/**
	 * When the user chooses a sequence, we will automatically pass it to this function
	 * which will validate the input, and then depending on the input type, it will prepare
	 * the sequence in some way to get a sequenceGenerator object which will be appended
	 * to preparedSequences
	 * @param {*} seqObj information used to prepare the right sequence, this will contain a
	 * sequence ID, the type of input, and the input itself (sequence name, a list, an OEIS number..etc).
	 */
	const receiveSequence = function (seqObj) {
		if ((seqObj.ID && seqObj.inputType && seqObj.inputValue && seqObj.parameters) == undefined) {
			console.error("One or more undefined module properties received in NScore");
		} else {
			// We will process different inputs in different ways
			if (seqObj.inputType == "builtIn") {
				if (BuiltInSeqs[seqObj.inputValue].generator == undefined) {
					console.error("undefined or unimplemented sequence: " + seqObj.inputValue);
				} else {
					seqObj.parameters['ID'] = seqObj.ID;
					try {
						// for linRec these two parameters are strings, we have to conver them to arrays
						if (seqObj.inputValue == "linRec") {
							seqObj.parameters['coefficientList'] = stringToArray(seqObj.parameters['coefficientList']);
							seqObj.parameters['seedList'] = stringToArray(seqObj.parameters['seedList']);
						}
						// preparedSequences[seqObj.ID] = BuiltInSeqs[seqObj.inputValue].generator(seqObj.parameters);
						preparedSequences[seqObj.ID] = BuiltInNameToSeq(seqObj.ID, seqObj.inputValue, seqObj.parameters)
					} catch (err) {
						console.error("Error initializing built in seq: " + err)
					}
				}
			}
			if (seqObj.inputType == "OEIS") {
				if (NScore.validOEIS.includes(seqObj.inputValue)) {
					preparedSequences[seqObj.ID] = OEISToSeq(seqObj.ID, seqObj.inputValue);
				} else {
					console.error("Not a valid OEIS sequence")
				}
			}
			if (seqObj.inputType == "list") {
				try {
					let list = JSON.parse(seqObj.inputValue)
					preparedSequences[seqObj.ID] = ListToSeq(seqObj.ID, list);
				} catch (err) {
					console.error("Error initializing seq from list: " + err);
				}
			}
			if (seqObj.inputType == "code") {
				console.error("Not implemented")
			}
		}
	}
	/**
	 * We initialize the drawing processing. First we calculate the dimensions of each sketch
	 * then we pair up sequences and drawing modules, and finally we pass them to generateP5
	 * which actually instantiates drawing modules and begins drawing.
	 * 
	 * @param {*} seqVizPairs a list of pairs where each pair contains an ID of a sequence
	 * and an ID of a drawing tool, this lets us know to pass which sequence to which
	 * drawing tool.
	 */
	const begin = function (seqVizPairs) {

		//Figuring out layout
		//--------------------------------------
		let totalWidth = document.getElementById('canvasArea').offsetWidth;
		let totalHeight = document.getElementById('canvasArea').offsetHeight;
		let canvasCount = seqVizPairs.length
		let gridSize = Math.ceil(Math.sqrt(canvasCount));
		let individualWidth = totalWidth / gridSize - 20
		let individualHeight = totalHeight / gridSize
		//--------------------------------------

		for (let pair of seqVizPairs) {
			let currentSeq = preparedSequences[pair["seqID"]];
			let currentTool = preparedTools[pair["toolID"]];
			if (currentSeq && currentTool == undefined) {
				console.error("undefined ID for tool or sequence");
			}
			liveSketches.push(generateP5(currentTool['module']["viz"], currentTool['config'], currentSeq, liveSketches.length, individualWidth, individualHeight));
		}
	}

	const clear = function () {
		if (liveSketches.length == 0) {
			return;
		} else {
			for (let i = 0; i < liveSketches.length; i++) {
				liveSketches[i].remove() //delete canvas element
			}
		}
	}

	const pause = function () {
		liveSketches.forEach(function (sketch) {
			sketch.noLoop();
		})
	}

	const resume = function () {
		liveSketches.forEach(function (sketch) {
			sketch.loop()
		})
	}

	const step = function () {
		liveSketches.forEach(function (sketch) {
			sketch.redraw();
		})
	}

	return {
		receiveSequence: receiveSequence,
		receiveModule: receiveModule,
		liveSketches: liveSketches,
		preparedSequences: preparedSequences,
		preparedTools: preparedTools,
		modules: modules,
		validOEIS: validOEIS,
		BuiltInSeqs: BuiltInSeqs,
		begin: begin,
		pause: pause,
		resume: resume,
		step: step,
		clear: clear,
	}
}()

window.NScore = NScore
},{"./modules/modules.js":6,"./sequences/sequences.js":12,"./validOEIS.js":13}],2:[function(require,module,exports){
/*
    var list=[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223];

*/

class VIZ_Differences {
	constructor(seq, sketch, config) {

		this.n = config.n;                                   //n is number of terms of top sequence
		this.levels = config.Levels;                         //levels is number of layers of the pyramid/trapezoid created by writing the differences.
		this.seq = seq;
		this.sketch = sketch;
	}

	drawDifferences(n, levels, sequence) {

		//changed background color to grey since you can't see what's going on
		this.sketch.background( 'black' )

		n = Math.min(n, sequence.length);
		levels = Math.min(levels, n - 1);
		let font, fontSize = 20;
		this.sketch.textFont("Arial");
		this.sketch.textSize(fontSize);
		this.sketch.textStyle(this.sketch.BOLD)
		let xDelta = 50;
		let yDelta = 50;
		let firstX = 30;
		let firstY = 30;
		this.sketch.colorMode(this.sketch.HSB, 255);
		let myColor = this.sketch.color(100, 255, 150);
		let hue;
		
		let workingSequence = [];

		for (let i = 0; i < this.n; i++) {
			console.log("in")
			workingSequence.push(sequence.getElement(i));                                 //workingSequence cannibalizes first n elements of sequence.
		}


		for (let i = 0; i < this.levels; i++) {
			hue = (i * 255 / 6) % 255;
			myColor = this.sketch.color(hue, 150, 200);
			this.sketch.fill(myColor);
			for (let j = 0; j < workingSequence.length; j++) {
				this.sketch.text(workingSequence[j], firstX + j * xDelta, firstY + i * yDelta);         //Draws and updates workingSequence simultaneously.
				if (j < workingSequence.length - 1) {
					workingSequence[j] = workingSequence[j + 1] - workingSequence[j];
				}
			}

			workingSequence.length = workingSequence.length - 1;                      //Removes last element.
			firstX = firstX + (1 / 2) * xDelta;                                           //Moves line forward half for pyramid shape.

		}

	}

	setup() {
	}
	draw() {
		this.drawDifferences(this.n, this.levels, this.seq);
		this.sketch.noLoop();
	}
}



const SCHEMA_Differences = {
	n: {
		type: 'number',
		title: 'N',
		description: 'Number of elements',
		required: true
	},
	Levels: {
		type: 'number',
		title: 'Levels',
		description: 'Number of levels',
		required: true
	},
}

const MODULE_Differences = {
	viz: VIZ_Differences,
	name: "Differences",
	description: "",
	configSchema: SCHEMA_Differences
}


module.exports = MODULE_Differences
},{}],3:[function(require,module,exports){


//An example module


class VIZ_ModFill {
	constructor(seq, sketch, config) {
		this.sketch = sketch
		this.seq = seq
        this.modDimension = config.modDimension
		this.i = 0;
	}

	drawNew(num, seq) {
		let black = this.sketch.color(0);
		this.sketch.fill(black);
		let i;
		let j;
		for (let mod = 1; mod <= this.modDimension; mod++) {
			i = seq.getElement(num) % mod;
			j = mod - 1;
			this.sketch.rect(j * this.rectWidth, this.sketch.height - (i + 1) * this.rectHeight, this.rectWidth, this.rectHeight);
		}

	}

	setup() {
		this.rectWidth = this.sketch.width / this.modDimension;
		this.rectHeight = this.sketch.height / this.modDimension;
		this.sketch.noStroke();
	}

	draw() {
		this.drawNew(this.i, this.seq);
		this.i++;
		if (i == 1000) {
			this.sketch.noLoop();
		}
	}

}

const SCHEMA_ModFill = {
    modDimension: {
        type: "number",
        title: "Mod dimension",
        description: "",
        required: true
    }
}


const MODULE_ModFill = {
	viz: VIZ_ModFill,
	name: "Mod Fill",
	description: "",
	configSchema: SCHEMA_ModFill
}

module.exports = MODULE_ModFill
},{}],4:[function(require,module,exports){
class VIZ_shiftCompare{
	constructor(seq, sketch, config){
	    //Sketch is your canvas
	    //config is the parameters you expect
	    //seq is the sequence you are drawing
		this.sketch = sketch;
		this.seq = seq;
		this.MOD = 2
		// Set up the image once.
	}

	
	setup() {
		console.log(this.sketch.height, this.sketch.width);
		this.img = this.sketch.createImage(this.sketch.width, this.sketch.height);
		this.img.loadPixels(); // Enables pixel-level editing.
	}

	clip(a, min, max)
	{
	    if (a < min)
		{
			return min;
		}
		else if (a > max)
		{
		    return max;
		}
		return a;
	}
	

	draw(){		//This will be called everytime to draw
	    // Ensure mouse coordinates are sane.
		// Mouse coordinates look they're floats by default.
		
		let d = this.sketch.pixelDensity()
		let mx = this.clip(Math.round(this.sketch.mouseX), 0, this.sketch.width);
		let my = this.clip(Math.round(this.sketch.mouseY), 0, this.sketch.height);
		if (this.sketch.key == 'ArrowUp') {
			this.MOD += 1
			this.sketch.key = null
			console.log("UP PRESSED, NEW MOD: " + this.MOD)
		}
		else if(this.sketch.key == 'ArrowDown'){
			this.MOD -= 1
			this.sketch.key = null
			console.log("DOWN PRESSED, NEW MOD: " + this.MOD)
		}
		else if(this.sketch.key == 'ArrowRight'){
			console.log(console.log("MX: " + mx + " MY: " + my))
		}
		// Write to image, then to screen for speed.
        for (let x = 0; x < this.sketch.width; x++) {
            for (let y = 0; y < this.sketch.height; y++) {
				for( let i = 0; i < d; i ++){
					for( let j = 0; j < d; j++){
						let index = 4 * ((y * d + j) * this.sketch.width * d + (x * d + i));
						if (this.seq.getElement(x) % (this.MOD) == this.seq.getElement(y) % (this.MOD)) {
							this.img.pixels[index] = 255;
							this.img.pixels[index + 1] = 255;
							this.img.pixels[index + 2] = 255;
							this.img.pixels[index + 3] = 255;
						} else {
							this.img.pixels[index] = 0;
							this.img.pixels[index + 1] = 0;
							this.img.pixels[index + 2] = 0;
							this.img.pixels[index + 3] = 255;
						}
					}
				}
            }
		}
        
        this.img.updatePixels(); // Copies our edited pixels to the image.
        
        this.sketch.image(this.img, 0, 0); // Display image to screen.this.sketch.line(50,50,100,100);
	}
}


const MODULE_ShiftCompare = {
	viz: VIZ_shiftCompare,
	name: "Shift Compare",
	description: "",
	configSchema: {}
}

module.exports = MODULE_ShiftCompare;
},{}],5:[function(require,module,exports){
class VIZ_Turtle {
	constructor(seq, sketch, config) {
		var domain = JSON.parse( "[" + config['domain'] + "]" )
		var range = JSON.parse( "[" + config['range'] + "]" )
		this.rotMap = {}
		for(let i = 0; i < domain.length; i++){
			this.rotMap[domain[i]] = (Math.PI/180)*range[i]
		}
		this.stepSize = config.stepSize;
		this.bgColor = config.bgColor;
		this.strokeColor = config.strokeColor;
		this.strokeWidth = config.strokeWeight
		this.seq = seq;
		this.currentIndex = 0;
		this.orientation = 0;
		this.sketch = sketch;
		console.log(config)
		if(config.startingX != ""){
			this.X = config.startingX
			this.Y = config.startingY
		}
		else{
			this.X = null;
			this.Y = null;
		}

	}
	stepDraw() {
		let oldX = this.X;
		let oldY = this.Y;
		let currElement = this.seq.getElement(this.currentIndex++);
		let angle = this.rotMap[ currElement ];
		if(angle == undefined){
			throw ('angle undefined for element: ' + currElement)
		}
		this.orientation = (this.orientation + angle);
		this.X += this.stepSize * Math.cos(this.orientation);
		this.Y += this.stepSize * Math.sin(this.orientation);
		this.sketch.line(oldX, oldY, this.X, this.Y);
	}
	setup() {
		this.X = this.sketch.width / 2;
		this.Y = this.sketch.height / 2;
		this.sketch.background(this.bgColor);
		this.sketch.stroke(this.strokeColor);
		this.sketch.strokeWeight(this.strokeWidth)
	}
	draw() {
		this.stepDraw();
	}
}


const SCHEMA_Turtle = {
	domain: {
		type: 'string',
		title: 'Sequence Domain',
		description: 'Comma seperated numbers',
		default: "0,1,2,3,4",
		required: true
	},
	range: {
		type: 'string',
		title: 'Angles',
		default: "30,45,60,90,120",
		description: 'Comma seperated numbers',
		required: true
	},
	stepSize: {
		type: 'number',
		title: 'Turtle\'s step size',
		default: 20,
		required: true
	},
	strokeWeight: {
		type: 'number',
		title: 'How wide a stroke is',
		default: 5,
		required: true
	},
	startingX: {
		type: 'number',
		tite: 'X start'
	},
	startingY: {
		type: 'number',
		tite: 'Y start'
	},
	bgColor: {
		type: 'string',
		title: 'Background Color',
		format: 'color',
		default: "#666666",
		required: false
	},
	strokeColor: {
		type: 'string',
		title: 'Stroke Color',
		format: 'color',
		default: '#ff0000',
		required: false
	}
}

const MODULE_Turtle = {
	viz: VIZ_Turtle,
	name: "Turtle",
	description: "",
	configSchema: SCHEMA_Turtle
}


module.exports = MODULE_Turtle
},{}],6:[function(require,module,exports){
//Add an import line here for new modules


//Add new modules to this constant.
const MODULES = {}

module.exports = MODULES

MODULES["Turtle"] = require('./moduleTurtle.js')
MODULES["ShiftCompare"] = require('./moduleShiftCompare.js')
MODULES["Differences"] = require('./moduleDifferences.js')
MODULES["ModFill"] = require('./moduleModFill.js')
},{"./moduleDifferences.js":2,"./moduleModFill.js":3,"./moduleShiftCompare.js":4,"./moduleTurtle.js":5}],7:[function(require,module,exports){

SEQ_linearRecurrence = require('./sequenceLinRec.js')

function GEN_fibonacci({
    m
}) {
    return SEQ_linearRecurrence.generator({
        coefficientList: [1, 1],
        seedList: [1, 1],
        m
    });
}

const SCHEMA_Fibonacci= {
    m: {
        type: 'number',
        title: 'Mod',
        description: 'A number to mod the sequence by by',
        required: false
    }
}


const SEQ_fibonacci = {
    generator: GEN_fibonacci,
	name: "Fibonacci",
	description: "",
	paramsSchema: SCHEMA_Fibonacci
}

module.exports = SEQ_fibonacci
},{"./sequenceLinRec.js":8}],8:[function(require,module,exports){


function GEN_linearRecurrence({
    coefficientList,
    seedList,
    m
}) {
    if (coefficientList.length != seedList.length) {
        //Number of seeds should match the number of coefficients
        console.log("number of coefficients not equal to number of seeds ");
        return null;
    }
    let k = coefficientList.length;
    if (m != "") {
        for (let i = 0; i < coefficientList.length; i++) {
            coefficientList[i] = coefficientList[i] % m;
            seedList[i] = seedList[i] % m;
        }
        var genericLinRec = function (n, cache) {
            if( n < seedList.length){
                cache[n] = seedList[n]
                return cache[n] 
            }
            for (let i = cache.length; i <= n; i++) {
                let sum = 0;
                for (let j = 0; j < k; j++) {
                    sum += cache[i - j - 1] * coefficientList[j];
                }
                cache[i] = sum % m;
            }
            return cache[n];
        }
    } else {
        var genericLinRec = function (n, cache) {
            if( n < seedList.length){
                cache[n] = seedList[n]
                return cache[n] 
            }

            for (let i = cache.length; i <= n; i++) {
                let sum = 0;
                for (let j = 0; j < k; j++) {
                    sum += cache[i - j - 1] * coefficientList[j];
                }
                cache[i] = sum;
            }
            return cache[n];
        }
    }
    return genericLinRec
}

const SCHEMA_linearRecurrence = {
    coefficientList: {
        type: 'string',
        title: 'Coefficients list',
        description: 'Comma seperated numbers',
        required: true
    },
    seedList: {
        type: 'string',
        title: 'Seed list',
        description: 'Comma seperated numbers',
        required: true
    },
    m: {
        type: 'number',
        title: 'Mod',
        description: 'A number to mod the sequence by by',
        required: false
    }
}


const SEQ_linearRecurrence = {
    generator: GEN_linearRecurrence,
	name: "Linear Recurrence",
	description: "",
	paramsSchema: SCHEMA_linearRecurrence
}

module.exports = SEQ_linearRecurrence
},{}],9:[function(require,module,exports){

const SEQ_linearRecurrence = require('./sequenceLinRec.js')

function GEN_Lucas({
    m
}) {
    return SEQ_linearRecurrence.generator({
        coefficientList: [1, 1],
        seedList: [2, 1],
        m
    });
}

const SCHEMA_Lucas= {
    m: {
        type: 'number',
        title: 'Mod',
        description: 'A number to mod the sequence by by',
        required: false
    }
}


const SEQ_Lucas = {
    generator: GEN_Lucas,
	name: "Lucas",
	description: "",
	paramsSchema: SCHEMA_Lucas
}

module.exports = SEQ_Lucas
},{"./sequenceLinRec.js":8}],10:[function(require,module,exports){


function GEN_Naturals({
    includezero
}){
    if(includezero){
        return ( (n) => n )
    }
    else{
        return ( (n) => n + 1 )
    }
}

const SCHEMA_Naturals= {
    includezero: {
        type: 'boolean',
        title: 'Include zero',
        description: '',
        default: 'false',
        required: false
    }
}


const SEQ_Naturals = {
    generator: GEN_Naturals,
	name: "Naturals",
	description: "",
	paramsSchema: SCHEMA_Naturals
}

// export default SEQ_Naturals
module.exports = SEQ_Naturals
},{}],11:[function(require,module,exports){


function GEN_Primes() {
    const primes = function (n, cache) {
        if(cache.length == 0){
            cache.push(2)
            cache.push(3)
            cache.push(5)
        }
        let i = cache[cache.length - 1] + 1
        let k = 0
        while (cache.length <= n) {
            let isPrime = true
            for (let j = 0; j < cache.length; j++) {
                if (i % cache[j] == 0) {
                    isPrime = false
                    break
                }
            }
            if (isPrime) {
                cache.push(i)
            }
            i++;
        }
        return cache[n]
    }
    return primes
}


const SCHEMA_Primes= {
    m: {
        type: 'number',
        title: 'Mod',
        description: 'A number to mod the sequence by',
        required: false
    }
}


const SEQ_Primes = {
    generator: GEN_Primes,
	name: "Primes",
	description: "",
	paramsSchema: SCHEMA_Primes
}

module.exports = SEQ_Primes
},{}],12:[function(require,module,exports){
/**
 *
 * @class SequenceGenerator
 */
class SequenceGenerator {
    /**
     *Creates an instance of SequenceGenerator.
     * @param {*} generator a function that takes a natural number and returns a number, it can optionally take the cache as a second argument
     * @param {*} ID the ID of the sequence
     * @memberof SequenceGenerator
     */
    constructor(ID, generator) {
        this.generator = generator;
        this.ID = ID;
        this.cache = [];
        this.newSize = 1;
    }
    /**
     * if we need to get the nth element and it's not present in
     * in the cache, then we either double the size, or the 
     * new size becomes n+1
     * @param {*} n 
     * @memberof SequenceGenerator
     */
    resizeCache(n) {
        this.newSize = this.cache.length * 2;
        if (n + 1 > this.newSize) {
            this.newSize = n + 1;
        }
    }
    /**
     * Populates the cache up until the current newSize
     * this is called after resizeCache
     * @memberof SequenceGenerator
     */
    fillCache() {
        for (let i = this.cache.length; i < this.newSize; i++) {
            //the generator is given the cache since it would make computation more efficient sometimes
            //but the generator doesn't necessarily need to take more than one argument.
            this.cache[i] = this.generator(i, this.cache);
        }
    }
    /**
     * Get element is what the drawing tools will be calling, it retrieves
     * the nth element of the sequence by either getting it from the cache
     * or if isn't present, by building the cache and then getting it
     * @param {*} n the index of the element in the sequence we want
     * @returns a number
     * @memberof SequenceGenerator
     */
    getElement(n) {
        if (this.cache[n] != undefined || this.finite) {
            // console.log("cache hit")
            return this.cache[n];
        } else {
            // console.log("cache miss")
            this.resizeCache(n);
            this.fillCache();
            return this.cache[n];
        }
    }
}


/**
 *
 *
 * @param {*} code arbitrary sage code to be executed on aleph
 * @returns ajax response object
 */
function sageExecute(code) {
    return $.ajax({
        type: 'POST',
        async: false,
        url: 'http://aleph.sagemath.org/service',
        data: "code=" + code
    })
}

/**
 *
 *
 * @param {*} code arbitrary sage code to be executed on aleph
 * @returns ajax response object
 */
async function sageExecuteAsync(code) {
    return await $.ajax({
        type: 'POST',
        url: 'http://aleph.sagemath.org/service',
        data: "code=" + code
    })
}


class OEISSequenceGenerator {
    constructor(ID, OEIS) {
        this.OEIS = OEIS;
        this.ID = ID;
        this.cache = [];
        this.newSize = 1;
        this.prefillCache()
    }
    oeisFetch(n) {
        console.log("Fetching..")
        let code = `print(sloane.${this.OEIS}.list(${n}))`;
        let resp = sageExecute(code);
        return JSON.parse(resp.responseJSON.stdout)
    }
    async prefillCache() {
        this.resizeCache(3000);
        let code = `print(sloane.${this.OEIS}.list(${this.newSize}))`;
        let resp = await sageExecuteAsync(code);
        console.log(resp)
        this.cache = this.cache.concat(JSON.parse(resp.stdout))
    }
    resizeCache(n) {
        this.newSize = this.cache.length * 2;
        if (n + 1 > this.newSize) {
            this.newSize = n + 1;
        }
    }
    fillCache() {
        let newList = this.oeisFetch(this.newSize);
        this.cache = this.cache.concat(newList);
    }
    getElement(n) {
        if (this.cache[n] != undefined) {
            return this.cache[n];
        } else {
            this.resizeCache();
            this.fillCache();
            return this.cache[n];
        }
    }
}

function BuiltInNameToSeq(ID, seqName, seqParams){
    let generator = BuiltInSeqs[seqName].generator(seqParams)
    return new SequenceGenerator(ID, generator)
}


function ListToSeq(ID, list) {
    let listGenerator = function (n) {
        return list[n];
    }
    return new SequenceGenerator(ID, listGenerator);
}

function OEISToSeq(ID, OEIS) {
    return new OEISSequenceGenerator(ID, OEIS);
}


const BuiltInSeqs = {}


module.exports = {
    'BuiltInNameToSeq': BuiltInNameToSeq,
    'ListToSeq': ListToSeq,
    'OEISToSeq': OEISToSeq,
    'BuiltInSeqs': BuiltInSeqs
}


BuiltInSeqs["fibonacci"] = require('./sequenceFibonacci.js')
BuiltInSeqs["lucas"] = require('./sequenceLucas.js')
BuiltInSeqs["primes"] = require('./sequencePrimes.js')
BuiltInSeqs["naturals"] = require('./sequenceNaturals.js')
BuiltInSeqs["linRec"] = require('./sequenceLinRec.js')
BuiltInSeqs['Primes'] = require('./sequencePrimes.js')

},{"./sequenceFibonacci.js":7,"./sequenceLinRec.js":8,"./sequenceLucas.js":9,"./sequenceNaturals.js":10,"./sequencePrimes.js":11}],13:[function(require,module,exports){
module.exports = ["A000001", "A000027", "A000004", "A000005", "A000008", "A000009", "A000796", "A003418", "A007318", "A008275", "A008277", "A049310", "A000010", "A000007", "A005843", "A000035", "A000169", "A000272", "A000312", "A001477", "A004526", "A000326", "A002378", "A002620", "A005408", "A000012", "A000120", "A010060", "A000069", "A001969", "A000290", "A000225", "A000015", "A000016", "A000032", "A004086", "A002113", "A000030", "A000040", "A002808", "A018252", "A000043", "A000668", "A000396", "A005100", "A005101", "A002110", "A000720", "A064553", "A001055", "A006530", "A000961", "A005117", "A020639", "A000041", "A000045", "A000108", "A001006", "A000079", "A000578", "A000244", "A000302", "A000583", "A000142", "A000085", "A001189", "A000670", "A006318", "A000165", "A001147", "A006882", "A000984", "A001405", "A000292", "A000330", "A000153", "A000255", "A000261", "A001909", "A001910", "A090010", "A055790", "A090012", "A090013", "A090014", "A090015", "A090016", "A000166", "A000203", "A001157", "A008683", "A000204", "A000217", "A000124", "A002275", "A001110", "A051959", "A001221", "A001222", "A046660", "A001227", "A001358", "A001694", "A001836", "A001906", "A001333", "A001045", "A000129", "A001109", "A015521", "A015523", "A015530", "A015531", "A015551", "A082411", "A083103", "A083104", "A083105", "A083216", "A061084", "A000213", "A000073", "A079922", "A079923", "A109814", "A111774", "A111775", "A111787", "A000110", "A000587", "A000100"]

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvTlNjb3JlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlRGlmZmVyZW5jZXMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVNb2RGaWxsLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlU2hpZnRDb21wYXJlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlVHVydGxlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9zZXF1ZW5jZXMvc2VxdWVuY2VGaWJvbmFjY2kuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvc2VxdWVuY2VzL3NlcXVlbmNlTGluUmVjLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZUx1Y2FzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZU5hdHVyYWxzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZVByaW1lcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9zZXF1ZW5jZXMvc2VxdWVuY2VzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3ZhbGlkT0VJUy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0tBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJTRVFVRU5DRSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VzL3NlcXVlbmNlcy5qcycpXG5WQUxJRE9FSVMgPSByZXF1aXJlKCcuL3ZhbGlkT0VJUy5qcycpXG5NT0RVTEVTID0gcmVxdWlyZSgnLi9tb2R1bGVzL21vZHVsZXMuanMnKVxuXG5CdWlsdEluU2VxcyA9IFNFUVVFTkNFLkJ1aWx0SW5TZXFzXG5MaXN0VG9TZXEgPSBTRVFVRU5DRS5MaXN0VG9TZXFcbk9FSVNUb1NlcSA9IFNFUVVFTkNFLk9FSVNUb1NlcVxuQnVpbHRJbk5hbWVUb1NlcSA9IFNFUVVFTkNFLkJ1aWx0SW5OYW1lVG9TZXFcblxuZnVuY3Rpb24gc3RyaW5nVG9BcnJheShzdHJBcnIpIHtcblx0cmV0dXJuIEpTT04ucGFyc2UoXCJbXCIgKyBzdHJBcnIgKyBcIl1cIilcbn1cblxuY29uc3QgTlNjb3JlID0gZnVuY3Rpb24gKCkge1xuXHRjb25zdCBtb2R1bGVzID0gTU9EVUxFUyAvLyAgY2xhc3NlcyB0byB0aGUgZHJhd2luZyBtb2R1bGVzIFxuXHRjb25zdCB2YWxpZE9FSVMgPSBWQUxJRE9FSVNcblx0dmFyIHByZXBhcmVkU2VxdWVuY2VzID0gW107IC8vIHNlcXVlbmNlR2VuZXJhdG9ycyB0byBiZSBkcmF3blxuXHR2YXIgcHJlcGFyZWRUb29scyA9IFtdOyAvLyBjaG9zZW4gZHJhd2luZyBtb2R1bGVzIFxuXHR2YXIgbGl2ZVNrZXRjaGVzID0gW107IC8vIHA1IHNrZXRjaGVzIGJlaW5nIGRyYXduXG5cblx0LyoqXG5cdCAqXG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gbW9kdWxlQ2xhc3MgZHJhd2luZyBtb2R1bGUgdG8gYmUgdXNlZCBmb3IgdGhpcyBza2V0Y2hcblx0ICogQHBhcmFtIHsqfSBjb25maWcgY29ycmVzcG9uZGluZyBjb25maWcgZm9yIGRyYXdpbmcgbW9kdWxlXG5cdCAqIEBwYXJhbSB7Kn0gc2VxIHNlcXVlbmNlIHRvIGJlIHBhc3NlZCB0byBkcmF3aW5nIG1vZHVsZVxuXHQgKiBAcGFyYW0geyp9IGRpdklEIGRpdiB3aGVyZSBza2V0Y2ggd2lsbCBiZSBwbGFjZWRcblx0ICogQHBhcmFtIHsqfSB3aWR0aCB3aWR0aCBvZiBza2V0Y2hcblx0ICogQHBhcmFtIHsqfSBoZWlnaHQgaGVpZ2h0IG9mIHNrZXRjaFxuXHQgKiBAcmV0dXJucyBwNSBza2V0Y2hcblx0ICovXG5cdGNvbnN0IGdlbmVyYXRlUDUgPSBmdW5jdGlvbiAobW9kdWxlQ2xhc3MsIGNvbmZpZywgc2VxLCBkaXZJRCwgd2lkdGgsIGhlaWdodCkge1xuXG5cdFx0Ly9DcmVhdGUgY2FudmFzIGVsZW1lbnQgaGVyZVxuXHRcdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHQvL1RoZSBzdHlsZSBvZiB0aGUgY2FudmFzZXMgd2lsbCBiZSBcImNhbnZhc0NsYXNzXCJcblx0XHRkaXYuY2xhc3NOYW1lID0gXCJjYW52YXNDbGFzc1wiXG5cdFx0ZGl2LmlkID0gXCJsaXZlQ2FudmFzXCIgKyBkaXZJRFxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzQXJlYVwiKS5hcHBlbmRDaGlsZChkaXYpO1xuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdC8vQ3JlYXRlIFA1anMgaW5zdGFuY2Vcblx0XHRsZXQgbXlwNSA9IG5ldyBwNShmdW5jdGlvbiAoc2tldGNoKSB7XG5cdFx0XHRsZXQgbW9kdWxlSW5zdGFuY2UgPSBuZXcgbW9kdWxlQ2xhc3Moc2VxLCBza2V0Y2gsIGNvbmZpZylcblx0XHRcdHNrZXRjaC5zZXR1cCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0c2tldGNoLmNyZWF0ZUNhbnZhcyh3aWR0aCwgaGVpZ2h0KTtcblx0XHRcdFx0c2tldGNoLmJhY2tncm91bmQoXCJ3aGl0ZVwiKVxuXHRcdFx0XHRtb2R1bGVJbnN0YW5jZS5zZXR1cCgpO1xuXHRcdFx0fTtcblxuXHRcdFx0c2tldGNoLmRyYXcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdG1vZHVsZUluc3RhbmNlLmRyYXcoKVxuXHRcdFx0fVxuXHRcdH0sIGRpdi5pZCk7XG5cdFx0cmV0dXJuIG15cDU7XG5cdH1cblxuXHQvKipcblx0ICogV2hlbiB0aGUgdXNlciBjaG9vc2VzIGEgZHJhd2luZyBtb2R1bGUgYW5kIHByb3ZpZGVzIGNvcnJlc3BvbmRpbmcgY29uZmlnXG5cdCAqIGl0IHdpbGwgYXV0b21hdGljYWxseSBiZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiwgd2hpY2ggd2lsbCB2YWxpZGF0ZSBpbnB1dFxuXHQgKiBhbmQgYXBwZW5kIGl0IHRvIHRoZSBwcmVwYXJlZCB0b29sc1xuXHQgKiBAcGFyYW0geyp9IG1vZHVsZU9iaiBpbmZvcm1hdGlvbiB1c2VkIHRvIHByZXBhcmUgdGhlIHJpZ2h0IGRyYXdpbmcgbW9kdWxlLCB0aGlzIGlucHV0XG5cdCAqIHRoaXMgd2lsbCBjb250YWluIGFuIElELCB0aGUgbW9kdWxlS2V5IHdoaWNoIHNob3VsZCBtYXRjaCBhIGtleSBpbiBNT0RVTEVTX0pTT04sIGFuZFxuXHQgKiBhIGNvbmZpZyBvYmplY3QuXG5cdCAqL1xuXHRjb25zdCByZWNlaXZlTW9kdWxlID0gZnVuY3Rpb24gKG1vZHVsZU9iaikge1xuXHRcdGlmICgobW9kdWxlT2JqLklEICYmIG1vZHVsZU9iai5tb2R1bGVLZXkgJiYgbW9kdWxlT2JqLmNvbmZpZyAmJiBtb2R1bGVzW21vZHVsZU9iai5tb2R1bGVLZXldKSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJPbmUgb3IgbW9yZSB1bmRlZmluZWQgbW9kdWxlIHByb3BlcnRpZXMgcmVjZWl2ZWQgaW4gTlNjb3JlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwcmVwYXJlZFRvb2xzW21vZHVsZU9iai5JRF0gPSB7XG5cdFx0XHRcdG1vZHVsZTogbW9kdWxlc1ttb2R1bGVPYmoubW9kdWxlS2V5XSxcblx0XHRcdFx0Y29uZmlnOiBtb2R1bGVPYmouY29uZmlnLFxuXHRcdFx0XHRJRDogbW9kdWxlT2JqLklEXG5cdFx0XHR9O1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBXaGVuIHRoZSB1c2VyIGNob29zZXMgYSBzZXF1ZW5jZSwgd2Ugd2lsbCBhdXRvbWF0aWNhbGx5IHBhc3MgaXQgdG8gdGhpcyBmdW5jdGlvblxuXHQgKiB3aGljaCB3aWxsIHZhbGlkYXRlIHRoZSBpbnB1dCwgYW5kIHRoZW4gZGVwZW5kaW5nIG9uIHRoZSBpbnB1dCB0eXBlLCBpdCB3aWxsIHByZXBhcmVcblx0ICogdGhlIHNlcXVlbmNlIGluIHNvbWUgd2F5IHRvIGdldCBhIHNlcXVlbmNlR2VuZXJhdG9yIG9iamVjdCB3aGljaCB3aWxsIGJlIGFwcGVuZGVkXG5cdCAqIHRvIHByZXBhcmVkU2VxdWVuY2VzXG5cdCAqIEBwYXJhbSB7Kn0gc2VxT2JqIGluZm9ybWF0aW9uIHVzZWQgdG8gcHJlcGFyZSB0aGUgcmlnaHQgc2VxdWVuY2UsIHRoaXMgd2lsbCBjb250YWluIGFcblx0ICogc2VxdWVuY2UgSUQsIHRoZSB0eXBlIG9mIGlucHV0LCBhbmQgdGhlIGlucHV0IGl0c2VsZiAoc2VxdWVuY2UgbmFtZSwgYSBsaXN0LCBhbiBPRUlTIG51bWJlci4uZXRjKS5cblx0ICovXG5cdGNvbnN0IHJlY2VpdmVTZXF1ZW5jZSA9IGZ1bmN0aW9uIChzZXFPYmopIHtcblx0XHRpZiAoKHNlcU9iai5JRCAmJiBzZXFPYmouaW5wdXRUeXBlICYmIHNlcU9iai5pbnB1dFZhbHVlICYmIHNlcU9iai5wYXJhbWV0ZXJzKSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJPbmUgb3IgbW9yZSB1bmRlZmluZWQgbW9kdWxlIHByb3BlcnRpZXMgcmVjZWl2ZWQgaW4gTlNjb3JlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBXZSB3aWxsIHByb2Nlc3MgZGlmZmVyZW50IGlucHV0cyBpbiBkaWZmZXJlbnQgd2F5c1xuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJidWlsdEluXCIpIHtcblx0XHRcdFx0aWYgKEJ1aWx0SW5TZXFzW3NlcU9iai5pbnB1dFZhbHVlXS5nZW5lcmF0b3IgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihcInVuZGVmaW5lZCBvciB1bmltcGxlbWVudGVkIHNlcXVlbmNlOiBcIiArIHNlcU9iai5pbnB1dFZhbHVlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZXFPYmoucGFyYW1ldGVyc1snSUQnXSA9IHNlcU9iai5JRDtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Ly8gZm9yIGxpblJlYyB0aGVzZSB0d28gcGFyYW1ldGVycyBhcmUgc3RyaW5ncywgd2UgaGF2ZSB0byBjb252ZXIgdGhlbSB0byBhcnJheXNcblx0XHRcdFx0XHRcdGlmIChzZXFPYmouaW5wdXRWYWx1ZSA9PSBcImxpblJlY1wiKSB7XG5cdFx0XHRcdFx0XHRcdHNlcU9iai5wYXJhbWV0ZXJzWydjb2VmZmljaWVudExpc3QnXSA9IHN0cmluZ1RvQXJyYXkoc2VxT2JqLnBhcmFtZXRlcnNbJ2NvZWZmaWNpZW50TGlzdCddKTtcblx0XHRcdFx0XHRcdFx0c2VxT2JqLnBhcmFtZXRlcnNbJ3NlZWRMaXN0J10gPSBzdHJpbmdUb0FycmF5KHNlcU9iai5wYXJhbWV0ZXJzWydzZWVkTGlzdCddKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdC8vIHByZXBhcmVkU2VxdWVuY2VzW3NlcU9iai5JRF0gPSBCdWlsdEluU2Vxc1tzZXFPYmouaW5wdXRWYWx1ZV0uZ2VuZXJhdG9yKHNlcU9iai5wYXJhbWV0ZXJzKTtcblx0XHRcdFx0XHRcdHByZXBhcmVkU2VxdWVuY2VzW3NlcU9iai5JRF0gPSBCdWlsdEluTmFtZVRvU2VxKHNlcU9iai5JRCwgc2VxT2JqLmlucHV0VmFsdWUsIHNlcU9iai5wYXJhbWV0ZXJzKVxuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihcIkVycm9yIGluaXRpYWxpemluZyBidWlsdCBpbiBzZXE6IFwiICsgZXJyKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJPRUlTXCIpIHtcblx0XHRcdFx0aWYgKE5TY29yZS52YWxpZE9FSVMuaW5jbHVkZXMoc2VxT2JqLmlucHV0VmFsdWUpKSB7XG5cdFx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbc2VxT2JqLklEXSA9IE9FSVNUb1NlcShzZXFPYmouSUQsIHNlcU9iai5pbnB1dFZhbHVlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKFwiTm90IGEgdmFsaWQgT0VJUyBzZXF1ZW5jZVwiKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoc2VxT2JqLmlucHV0VHlwZSA9PSBcImxpc3RcIikge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGxldCBsaXN0ID0gSlNPTi5wYXJzZShzZXFPYmouaW5wdXRWYWx1ZSlcblx0XHRcdFx0XHRwcmVwYXJlZFNlcXVlbmNlc1tzZXFPYmouSURdID0gTGlzdFRvU2VxKHNlcU9iai5JRCwgbGlzdCk7XG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJFcnJvciBpbml0aWFsaXppbmcgc2VxIGZyb20gbGlzdDogXCIgKyBlcnIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoc2VxT2JqLmlucHV0VHlwZSA9PSBcImNvZGVcIikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdC8qKlxuXHQgKiBXZSBpbml0aWFsaXplIHRoZSBkcmF3aW5nIHByb2Nlc3NpbmcuIEZpcnN0IHdlIGNhbGN1bGF0ZSB0aGUgZGltZW5zaW9ucyBvZiBlYWNoIHNrZXRjaFxuXHQgKiB0aGVuIHdlIHBhaXIgdXAgc2VxdWVuY2VzIGFuZCBkcmF3aW5nIG1vZHVsZXMsIGFuZCBmaW5hbGx5IHdlIHBhc3MgdGhlbSB0byBnZW5lcmF0ZVA1XG5cdCAqIHdoaWNoIGFjdHVhbGx5IGluc3RhbnRpYXRlcyBkcmF3aW5nIG1vZHVsZXMgYW5kIGJlZ2lucyBkcmF3aW5nLlxuXHQgKiBcblx0ICogQHBhcmFtIHsqfSBzZXFWaXpQYWlycyBhIGxpc3Qgb2YgcGFpcnMgd2hlcmUgZWFjaCBwYWlyIGNvbnRhaW5zIGFuIElEIG9mIGEgc2VxdWVuY2Vcblx0ICogYW5kIGFuIElEIG9mIGEgZHJhd2luZyB0b29sLCB0aGlzIGxldHMgdXMga25vdyB0byBwYXNzIHdoaWNoIHNlcXVlbmNlIHRvIHdoaWNoXG5cdCAqIGRyYXdpbmcgdG9vbC5cblx0ICovXG5cdGNvbnN0IGJlZ2luID0gZnVuY3Rpb24gKHNlcVZpelBhaXJzKSB7XG5cblx0XHQvL0ZpZ3VyaW5nIG91dCBsYXlvdXRcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0bGV0IHRvdGFsV2lkdGggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzQXJlYScpLm9mZnNldFdpZHRoO1xuXHRcdGxldCB0b3RhbEhlaWdodCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXNBcmVhJykub2Zmc2V0SGVpZ2h0O1xuXHRcdGxldCBjYW52YXNDb3VudCA9IHNlcVZpelBhaXJzLmxlbmd0aFxuXHRcdGxldCBncmlkU2l6ZSA9IE1hdGguY2VpbChNYXRoLnNxcnQoY2FudmFzQ291bnQpKTtcblx0XHRsZXQgaW5kaXZpZHVhbFdpZHRoID0gdG90YWxXaWR0aCAvIGdyaWRTaXplIC0gMjBcblx0XHRsZXQgaW5kaXZpZHVhbEhlaWdodCA9IHRvdGFsSGVpZ2h0IC8gZ3JpZFNpemVcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0XHRmb3IgKGxldCBwYWlyIG9mIHNlcVZpelBhaXJzKSB7XG5cdFx0XHRsZXQgY3VycmVudFNlcSA9IHByZXBhcmVkU2VxdWVuY2VzW3BhaXJbXCJzZXFJRFwiXV07XG5cdFx0XHRsZXQgY3VycmVudFRvb2wgPSBwcmVwYXJlZFRvb2xzW3BhaXJbXCJ0b29sSURcIl1dO1xuXHRcdFx0aWYgKGN1cnJlbnRTZXEgJiYgY3VycmVudFRvb2wgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJ1bmRlZmluZWQgSUQgZm9yIHRvb2wgb3Igc2VxdWVuY2VcIik7XG5cdFx0XHR9XG5cdFx0XHRsaXZlU2tldGNoZXMucHVzaChnZW5lcmF0ZVA1KGN1cnJlbnRUb29sWydtb2R1bGUnXVtcInZpelwiXSwgY3VycmVudFRvb2xbJ2NvbmZpZyddLCBjdXJyZW50U2VxLCBsaXZlU2tldGNoZXMubGVuZ3RoLCBpbmRpdmlkdWFsV2lkdGgsIGluZGl2aWR1YWxIZWlnaHQpKTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCBjbGVhciA9IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAobGl2ZVNrZXRjaGVzLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGl2ZVNrZXRjaGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGxpdmVTa2V0Y2hlc1tpXS5yZW1vdmUoKSAvL2RlbGV0ZSBjYW52YXMgZWxlbWVudFxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGNvbnN0IHBhdXNlID0gZnVuY3Rpb24gKCkge1xuXHRcdGxpdmVTa2V0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChza2V0Y2gpIHtcblx0XHRcdHNrZXRjaC5ub0xvb3AoKTtcblx0XHR9KVxuXHR9XG5cblx0Y29uc3QgcmVzdW1lID0gZnVuY3Rpb24gKCkge1xuXHRcdGxpdmVTa2V0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChza2V0Y2gpIHtcblx0XHRcdHNrZXRjaC5sb29wKClcblx0XHR9KVxuXHR9XG5cblx0Y29uc3Qgc3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRsaXZlU2tldGNoZXMuZm9yRWFjaChmdW5jdGlvbiAoc2tldGNoKSB7XG5cdFx0XHRza2V0Y2gucmVkcmF3KCk7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0cmVjZWl2ZVNlcXVlbmNlOiByZWNlaXZlU2VxdWVuY2UsXG5cdFx0cmVjZWl2ZU1vZHVsZTogcmVjZWl2ZU1vZHVsZSxcblx0XHRsaXZlU2tldGNoZXM6IGxpdmVTa2V0Y2hlcyxcblx0XHRwcmVwYXJlZFNlcXVlbmNlczogcHJlcGFyZWRTZXF1ZW5jZXMsXG5cdFx0cHJlcGFyZWRUb29sczogcHJlcGFyZWRUb29scyxcblx0XHRtb2R1bGVzOiBtb2R1bGVzLFxuXHRcdHZhbGlkT0VJUzogdmFsaWRPRUlTLFxuXHRcdEJ1aWx0SW5TZXFzOiBCdWlsdEluU2Vxcyxcblx0XHRiZWdpbjogYmVnaW4sXG5cdFx0cGF1c2U6IHBhdXNlLFxuXHRcdHJlc3VtZTogcmVzdW1lLFxuXHRcdHN0ZXA6IHN0ZXAsXG5cdFx0Y2xlYXI6IGNsZWFyLFxuXHR9XG59KClcblxud2luZG93Lk5TY29yZSA9IE5TY29yZSIsIi8qXG4gICAgdmFyIGxpc3Q9WzIsIDMsIDUsIDcsIDExLCAxMywgMTcsIDE5LCAyMywgMjksIDMxLCAzNywgNDEsIDQzLCA0NywgNTMsIDU5LCA2MSwgNjcsIDcxLCA3MywgNzksIDgzLCA4OSwgOTcsIDEwMSwgMTAzLCAxMDcsIDEwOSwgMTEzLCAxMjcsIDEzMSwgMTM3LCAxMzksIDE0OSwgMTUxLCAxNTcsIDE2MywgMTY3LCAxNzMsIDE3OSwgMTgxLCAxOTEsIDE5MywgMTk3LCAxOTksIDIxMSwgMjIzLCAyMjcsIDIyOSwgMjMzLCAyMzksIDI0MSwgMjUxLCAyNTcsIDI2MywgMjY5LCAyNzEsIDI3NywgMjgxLCAyODMsIDI5MywgMzA3LCAzMTEsIDMxMywgMzE3LCAzMzEsIDMzNywgMzQ3LCAzNDksIDM1MywgMzU5LCAzNjcsIDM3MywgMzc5LCAzODMsIDM4OSwgMzk3LCA0MDEsIDQwOSwgNDE5LCA0MjEsIDQzMSwgNDMzLCA0MzksIDQ0MywgNDQ5LCA0NTcsIDQ2MSwgNDYzLCA0NjcsIDQ3OSwgNDg3LCA0OTEsIDQ5OSwgNTAzLCA1MDksIDUyMSwgNTIzLCA1NDEsIDU0NywgNTU3LCA1NjMsIDU2OSwgNTcxLCA1NzcsIDU4NywgNTkzLCA1OTksIDYwMSwgNjA3LCA2MTMsIDYxNywgNjE5LCA2MzEsIDY0MSwgNjQzLCA2NDcsIDY1MywgNjU5LCA2NjEsIDY3MywgNjc3LCA2ODMsIDY5MSwgNzAxLCA3MDksIDcxOSwgNzI3LCA3MzMsIDczOSwgNzQzLCA3NTEsIDc1NywgNzYxLCA3NjksIDc3MywgNzg3LCA3OTcsIDgwOSwgODExLCA4MjEsIDgyMywgODI3LCA4MjksIDgzOSwgODUzLCA4NTcsIDg1OSwgODYzLCA4NzcsIDg4MSwgODgzLCA4ODcsIDkwNywgOTExLCA5MTksIDkyOSwgOTM3LCA5NDEsIDk0NywgOTUzLCA5NjcsIDk3MSwgOTc3LCA5ODMsIDk5MSwgOTk3LCAxMDA5LCAxMDEzLCAxMDE5LCAxMDIxLCAxMDMxLCAxMDMzLCAxMDM5LCAxMDQ5LCAxMDUxLCAxMDYxLCAxMDYzLCAxMDY5LCAxMDg3LCAxMDkxLCAxMDkzLCAxMDk3LCAxMTAzLCAxMTA5LCAxMTE3LCAxMTIzLCAxMTI5LCAxMTUxLCAxMTUzLCAxMTYzLCAxMTcxLCAxMTgxLCAxMTg3LCAxMTkzLCAxMjAxLCAxMjEzLCAxMjE3LCAxMjIzXTtcblxuKi9cblxuY2xhc3MgVklaX0RpZmZlcmVuY2VzIHtcblx0Y29uc3RydWN0b3Ioc2VxLCBza2V0Y2gsIGNvbmZpZykge1xuXG5cdFx0dGhpcy5uID0gY29uZmlnLm47ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL24gaXMgbnVtYmVyIG9mIHRlcm1zIG9mIHRvcCBzZXF1ZW5jZVxuXHRcdHRoaXMubGV2ZWxzID0gY29uZmlnLkxldmVsczsgICAgICAgICAgICAgICAgICAgICAgICAgLy9sZXZlbHMgaXMgbnVtYmVyIG9mIGxheWVycyBvZiB0aGUgcHlyYW1pZC90cmFwZXpvaWQgY3JlYXRlZCBieSB3cml0aW5nIHRoZSBkaWZmZXJlbmNlcy5cblx0XHR0aGlzLnNlcSA9IHNlcTtcblx0XHR0aGlzLnNrZXRjaCA9IHNrZXRjaDtcblx0fVxuXG5cdGRyYXdEaWZmZXJlbmNlcyhuLCBsZXZlbHMsIHNlcXVlbmNlKSB7XG5cblx0XHQvL2NoYW5nZWQgYmFja2dyb3VuZCBjb2xvciB0byBncmV5IHNpbmNlIHlvdSBjYW4ndCBzZWUgd2hhdCdzIGdvaW5nIG9uXG5cdFx0dGhpcy5za2V0Y2guYmFja2dyb3VuZCggJ2JsYWNrJyApXG5cblx0XHRuID0gTWF0aC5taW4obiwgc2VxdWVuY2UubGVuZ3RoKTtcblx0XHRsZXZlbHMgPSBNYXRoLm1pbihsZXZlbHMsIG4gLSAxKTtcblx0XHRsZXQgZm9udCwgZm9udFNpemUgPSAyMDtcblx0XHR0aGlzLnNrZXRjaC50ZXh0Rm9udChcIkFyaWFsXCIpO1xuXHRcdHRoaXMuc2tldGNoLnRleHRTaXplKGZvbnRTaXplKTtcblx0XHR0aGlzLnNrZXRjaC50ZXh0U3R5bGUodGhpcy5za2V0Y2guQk9MRClcblx0XHRsZXQgeERlbHRhID0gNTA7XG5cdFx0bGV0IHlEZWx0YSA9IDUwO1xuXHRcdGxldCBmaXJzdFggPSAzMDtcblx0XHRsZXQgZmlyc3RZID0gMzA7XG5cdFx0dGhpcy5za2V0Y2guY29sb3JNb2RlKHRoaXMuc2tldGNoLkhTQiwgMjU1KTtcblx0XHRsZXQgbXlDb2xvciA9IHRoaXMuc2tldGNoLmNvbG9yKDEwMCwgMjU1LCAxNTApO1xuXHRcdGxldCBodWU7XG5cdFx0XG5cdFx0bGV0IHdvcmtpbmdTZXF1ZW5jZSA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm47IGkrKykge1xuXHRcdFx0Y29uc29sZS5sb2coXCJpblwiKVxuXHRcdFx0d29ya2luZ1NlcXVlbmNlLnB1c2goc2VxdWVuY2UuZ2V0RWxlbWVudChpKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy93b3JraW5nU2VxdWVuY2UgY2FubmliYWxpemVzIGZpcnN0IG4gZWxlbWVudHMgb2Ygc2VxdWVuY2UuXG5cdFx0fVxuXG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGV2ZWxzOyBpKyspIHtcblx0XHRcdGh1ZSA9IChpICogMjU1IC8gNikgJSAyNTU7XG5cdFx0XHRteUNvbG9yID0gdGhpcy5za2V0Y2guY29sb3IoaHVlLCAxNTAsIDIwMCk7XG5cdFx0XHR0aGlzLnNrZXRjaC5maWxsKG15Q29sb3IpO1xuXHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCB3b3JraW5nU2VxdWVuY2UubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0dGhpcy5za2V0Y2gudGV4dCh3b3JraW5nU2VxdWVuY2Vbal0sIGZpcnN0WCArIGogKiB4RGVsdGEsIGZpcnN0WSArIGkgKiB5RGVsdGEpOyAgICAgICAgIC8vRHJhd3MgYW5kIHVwZGF0ZXMgd29ya2luZ1NlcXVlbmNlIHNpbXVsdGFuZW91c2x5LlxuXHRcdFx0XHRpZiAoaiA8IHdvcmtpbmdTZXF1ZW5jZS5sZW5ndGggLSAxKSB7XG5cdFx0XHRcdFx0d29ya2luZ1NlcXVlbmNlW2pdID0gd29ya2luZ1NlcXVlbmNlW2ogKyAxXSAtIHdvcmtpbmdTZXF1ZW5jZVtqXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR3b3JraW5nU2VxdWVuY2UubGVuZ3RoID0gd29ya2luZ1NlcXVlbmNlLmxlbmd0aCAtIDE7ICAgICAgICAgICAgICAgICAgICAgIC8vUmVtb3ZlcyBsYXN0IGVsZW1lbnQuXG5cdFx0XHRmaXJzdFggPSBmaXJzdFggKyAoMSAvIDIpICogeERlbHRhOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL01vdmVzIGxpbmUgZm9yd2FyZCBoYWxmIGZvciBweXJhbWlkIHNoYXBlLlxuXG5cdFx0fVxuXG5cdH1cblxuXHRzZXR1cCgpIHtcblx0fVxuXHRkcmF3KCkge1xuXHRcdHRoaXMuZHJhd0RpZmZlcmVuY2VzKHRoaXMubiwgdGhpcy5sZXZlbHMsIHRoaXMuc2VxKTtcblx0XHR0aGlzLnNrZXRjaC5ub0xvb3AoKTtcblx0fVxufVxuXG5cblxuY29uc3QgU0NIRU1BX0RpZmZlcmVuY2VzID0ge1xuXHRuOiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0bGU6ICdOJyxcblx0XHRkZXNjcmlwdGlvbjogJ051bWJlciBvZiBlbGVtZW50cycsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcblx0TGV2ZWxzOiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0bGU6ICdMZXZlbHMnLFxuXHRcdGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIGxldmVscycsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcbn1cblxuY29uc3QgTU9EVUxFX0RpZmZlcmVuY2VzID0ge1xuXHR2aXo6IFZJWl9EaWZmZXJlbmNlcyxcblx0bmFtZTogXCJEaWZmZXJlbmNlc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0Y29uZmlnU2NoZW1hOiBTQ0hFTUFfRGlmZmVyZW5jZXNcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9EaWZmZXJlbmNlcyIsIlxuXG4vL0FuIGV4YW1wbGUgbW9kdWxlXG5cblxuY2xhc3MgVklaX01vZEZpbGwge1xuXHRjb25zdHJ1Y3RvcihzZXEsIHNrZXRjaCwgY29uZmlnKSB7XG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2hcblx0XHR0aGlzLnNlcSA9IHNlcVxuICAgICAgICB0aGlzLm1vZERpbWVuc2lvbiA9IGNvbmZpZy5tb2REaW1lbnNpb25cblx0XHR0aGlzLmkgPSAwO1xuXHR9XG5cblx0ZHJhd05ldyhudW0sIHNlcSkge1xuXHRcdGxldCBibGFjayA9IHRoaXMuc2tldGNoLmNvbG9yKDApO1xuXHRcdHRoaXMuc2tldGNoLmZpbGwoYmxhY2spO1xuXHRcdGxldCBpO1xuXHRcdGxldCBqO1xuXHRcdGZvciAobGV0IG1vZCA9IDE7IG1vZCA8PSB0aGlzLm1vZERpbWVuc2lvbjsgbW9kKyspIHtcblx0XHRcdGkgPSBzZXEuZ2V0RWxlbWVudChudW0pICUgbW9kO1xuXHRcdFx0aiA9IG1vZCAtIDE7XG5cdFx0XHR0aGlzLnNrZXRjaC5yZWN0KGogKiB0aGlzLnJlY3RXaWR0aCwgdGhpcy5za2V0Y2guaGVpZ2h0IC0gKGkgKyAxKSAqIHRoaXMucmVjdEhlaWdodCwgdGhpcy5yZWN0V2lkdGgsIHRoaXMucmVjdEhlaWdodCk7XG5cdFx0fVxuXG5cdH1cblxuXHRzZXR1cCgpIHtcblx0XHR0aGlzLnJlY3RXaWR0aCA9IHRoaXMuc2tldGNoLndpZHRoIC8gdGhpcy5tb2REaW1lbnNpb247XG5cdFx0dGhpcy5yZWN0SGVpZ2h0ID0gdGhpcy5za2V0Y2guaGVpZ2h0IC8gdGhpcy5tb2REaW1lbnNpb247XG5cdFx0dGhpcy5za2V0Y2gubm9TdHJva2UoKTtcblx0fVxuXG5cdGRyYXcoKSB7XG5cdFx0dGhpcy5kcmF3TmV3KHRoaXMuaSwgdGhpcy5zZXEpO1xuXHRcdHRoaXMuaSsrO1xuXHRcdGlmIChpID09IDEwMDApIHtcblx0XHRcdHRoaXMuc2tldGNoLm5vTG9vcCgpO1xuXHRcdH1cblx0fVxuXG59XG5cbmNvbnN0IFNDSEVNQV9Nb2RGaWxsID0ge1xuICAgIG1vZERpbWVuc2lvbjoge1xuICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICB0aXRsZTogXCJNb2QgZGltZW5zaW9uXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlwiLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgIH1cbn1cblxuXG5jb25zdCBNT0RVTEVfTW9kRmlsbCA9IHtcblx0dml6OiBWSVpfTW9kRmlsbCxcblx0bmFtZTogXCJNb2QgRmlsbFwiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0Y29uZmlnU2NoZW1hOiBTQ0hFTUFfTW9kRmlsbFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9Nb2RGaWxsIiwiY2xhc3MgVklaX3NoaWZ0Q29tcGFyZXtcblx0Y29uc3RydWN0b3Ioc2VxLCBza2V0Y2gsIGNvbmZpZyl7XG5cdCAgICAvL1NrZXRjaCBpcyB5b3VyIGNhbnZhc1xuXHQgICAgLy9jb25maWcgaXMgdGhlIHBhcmFtZXRlcnMgeW91IGV4cGVjdFxuXHQgICAgLy9zZXEgaXMgdGhlIHNlcXVlbmNlIHlvdSBhcmUgZHJhd2luZ1xuXHRcdHRoaXMuc2tldGNoID0gc2tldGNoO1xuXHRcdHRoaXMuc2VxID0gc2VxO1xuXHRcdHRoaXMuTU9EID0gMlxuXHRcdC8vIFNldCB1cCB0aGUgaW1hZ2Ugb25jZS5cblx0fVxuXG5cdFxuXHRzZXR1cCgpIHtcblx0XHRjb25zb2xlLmxvZyh0aGlzLnNrZXRjaC5oZWlnaHQsIHRoaXMuc2tldGNoLndpZHRoKTtcblx0XHR0aGlzLmltZyA9IHRoaXMuc2tldGNoLmNyZWF0ZUltYWdlKHRoaXMuc2tldGNoLndpZHRoLCB0aGlzLnNrZXRjaC5oZWlnaHQpO1xuXHRcdHRoaXMuaW1nLmxvYWRQaXhlbHMoKTsgLy8gRW5hYmxlcyBwaXhlbC1sZXZlbCBlZGl0aW5nLlxuXHR9XG5cblx0Y2xpcChhLCBtaW4sIG1heClcblx0e1xuXHQgICAgaWYgKGEgPCBtaW4pXG5cdFx0e1xuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoYSA+IG1heClcblx0XHR7XG5cdFx0ICAgIHJldHVybiBtYXg7XG5cdFx0fVxuXHRcdHJldHVybiBhO1xuXHR9XG5cdFxuXG5cdGRyYXcoKXtcdFx0Ly9UaGlzIHdpbGwgYmUgY2FsbGVkIGV2ZXJ5dGltZSB0byBkcmF3XG5cdCAgICAvLyBFbnN1cmUgbW91c2UgY29vcmRpbmF0ZXMgYXJlIHNhbmUuXG5cdFx0Ly8gTW91c2UgY29vcmRpbmF0ZXMgbG9vayB0aGV5J3JlIGZsb2F0cyBieSBkZWZhdWx0LlxuXHRcdFxuXHRcdGxldCBkID0gdGhpcy5za2V0Y2gucGl4ZWxEZW5zaXR5KClcblx0XHRsZXQgbXggPSB0aGlzLmNsaXAoTWF0aC5yb3VuZCh0aGlzLnNrZXRjaC5tb3VzZVgpLCAwLCB0aGlzLnNrZXRjaC53aWR0aCk7XG5cdFx0bGV0IG15ID0gdGhpcy5jbGlwKE1hdGgucm91bmQodGhpcy5za2V0Y2gubW91c2VZKSwgMCwgdGhpcy5za2V0Y2guaGVpZ2h0KTtcblx0XHRpZiAodGhpcy5za2V0Y2gua2V5ID09ICdBcnJvd1VwJykge1xuXHRcdFx0dGhpcy5NT0QgKz0gMVxuXHRcdFx0dGhpcy5za2V0Y2gua2V5ID0gbnVsbFxuXHRcdFx0Y29uc29sZS5sb2coXCJVUCBQUkVTU0VELCBORVcgTU9EOiBcIiArIHRoaXMuTU9EKVxuXHRcdH1cblx0XHRlbHNlIGlmKHRoaXMuc2tldGNoLmtleSA9PSAnQXJyb3dEb3duJyl7XG5cdFx0XHR0aGlzLk1PRCAtPSAxXG5cdFx0XHR0aGlzLnNrZXRjaC5rZXkgPSBudWxsXG5cdFx0XHRjb25zb2xlLmxvZyhcIkRPV04gUFJFU1NFRCwgTkVXIE1PRDogXCIgKyB0aGlzLk1PRClcblx0XHR9XG5cdFx0ZWxzZSBpZih0aGlzLnNrZXRjaC5rZXkgPT0gJ0Fycm93UmlnaHQnKXtcblx0XHRcdGNvbnNvbGUubG9nKGNvbnNvbGUubG9nKFwiTVg6IFwiICsgbXggKyBcIiBNWTogXCIgKyBteSkpXG5cdFx0fVxuXHRcdC8vIFdyaXRlIHRvIGltYWdlLCB0aGVuIHRvIHNjcmVlbiBmb3Igc3BlZWQuXG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5za2V0Y2gud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0aGlzLnNrZXRjaC5oZWlnaHQ7IHkrKykge1xuXHRcdFx0XHRmb3IoIGxldCBpID0gMDsgaSA8IGQ7IGkgKyspe1xuXHRcdFx0XHRcdGZvciggbGV0IGogPSAwOyBqIDwgZDsgaisrKXtcblx0XHRcdFx0XHRcdGxldCBpbmRleCA9IDQgKiAoKHkgKiBkICsgaikgKiB0aGlzLnNrZXRjaC53aWR0aCAqIGQgKyAoeCAqIGQgKyBpKSk7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5zZXEuZ2V0RWxlbWVudCh4KSAlICh0aGlzLk1PRCkgPT0gdGhpcy5zZXEuZ2V0RWxlbWVudCh5KSAlICh0aGlzLk1PRCkpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4XSA9IDI1NTtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgMV0gPSAyNTU7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDJdID0gMjU1O1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAzXSA9IDI1NTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleF0gPSAwO1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAxXSA9IDA7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDJdID0gMDtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgM10gPSAyNTU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG4gICAgICAgICAgICB9XG5cdFx0fVxuICAgICAgICBcbiAgICAgICAgdGhpcy5pbWcudXBkYXRlUGl4ZWxzKCk7IC8vIENvcGllcyBvdXIgZWRpdGVkIHBpeGVscyB0byB0aGUgaW1hZ2UuXG4gICAgICAgIFxuICAgICAgICB0aGlzLnNrZXRjaC5pbWFnZSh0aGlzLmltZywgMCwgMCk7IC8vIERpc3BsYXkgaW1hZ2UgdG8gc2NyZWVuLnRoaXMuc2tldGNoLmxpbmUoNTAsNTAsMTAwLDEwMCk7XG5cdH1cbn1cblxuXG5jb25zdCBNT0RVTEVfU2hpZnRDb21wYXJlID0ge1xuXHR2aXo6IFZJWl9zaGlmdENvbXBhcmUsXG5cdG5hbWU6IFwiU2hpZnQgQ29tcGFyZVwiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0Y29uZmlnU2NoZW1hOiB7fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9TaGlmdENvbXBhcmU7IiwiY2xhc3MgVklaX1R1cnRsZSB7XG5cdGNvbnN0cnVjdG9yKHNlcSwgc2tldGNoLCBjb25maWcpIHtcblx0XHR2YXIgZG9tYWluID0gSlNPTi5wYXJzZSggXCJbXCIgKyBjb25maWdbJ2RvbWFpbiddICsgXCJdXCIgKVxuXHRcdHZhciByYW5nZSA9IEpTT04ucGFyc2UoIFwiW1wiICsgY29uZmlnWydyYW5nZSddICsgXCJdXCIgKVxuXHRcdHRoaXMucm90TWFwID0ge31cblx0XHRmb3IobGV0IGkgPSAwOyBpIDwgZG9tYWluLmxlbmd0aDsgaSsrKXtcblx0XHRcdHRoaXMucm90TWFwW2RvbWFpbltpXV0gPSAoTWF0aC5QSS8xODApKnJhbmdlW2ldXG5cdFx0fVxuXHRcdHRoaXMuc3RlcFNpemUgPSBjb25maWcuc3RlcFNpemU7XG5cdFx0dGhpcy5iZ0NvbG9yID0gY29uZmlnLmJnQ29sb3I7XG5cdFx0dGhpcy5zdHJva2VDb2xvciA9IGNvbmZpZy5zdHJva2VDb2xvcjtcblx0XHR0aGlzLnN0cm9rZVdpZHRoID0gY29uZmlnLnN0cm9rZVdlaWdodFxuXHRcdHRoaXMuc2VxID0gc2VxO1xuXHRcdHRoaXMuY3VycmVudEluZGV4ID0gMDtcblx0XHR0aGlzLm9yaWVudGF0aW9uID0gMDtcblx0XHR0aGlzLnNrZXRjaCA9IHNrZXRjaDtcblx0XHRjb25zb2xlLmxvZyhjb25maWcpXG5cdFx0aWYoY29uZmlnLnN0YXJ0aW5nWCAhPSBcIlwiKXtcblx0XHRcdHRoaXMuWCA9IGNvbmZpZy5zdGFydGluZ1hcblx0XHRcdHRoaXMuWSA9IGNvbmZpZy5zdGFydGluZ1lcblx0XHR9XG5cdFx0ZWxzZXtcblx0XHRcdHRoaXMuWCA9IG51bGw7XG5cdFx0XHR0aGlzLlkgPSBudWxsO1xuXHRcdH1cblxuXHR9XG5cdHN0ZXBEcmF3KCkge1xuXHRcdGxldCBvbGRYID0gdGhpcy5YO1xuXHRcdGxldCBvbGRZID0gdGhpcy5ZO1xuXHRcdGxldCBjdXJyRWxlbWVudCA9IHRoaXMuc2VxLmdldEVsZW1lbnQodGhpcy5jdXJyZW50SW5kZXgrKyk7XG5cdFx0bGV0IGFuZ2xlID0gdGhpcy5yb3RNYXBbIGN1cnJFbGVtZW50IF07XG5cdFx0aWYoYW5nbGUgPT0gdW5kZWZpbmVkKXtcblx0XHRcdHRocm93ICgnYW5nbGUgdW5kZWZpbmVkIGZvciBlbGVtZW50OiAnICsgY3VyckVsZW1lbnQpXG5cdFx0fVxuXHRcdHRoaXMub3JpZW50YXRpb24gPSAodGhpcy5vcmllbnRhdGlvbiArIGFuZ2xlKTtcblx0XHR0aGlzLlggKz0gdGhpcy5zdGVwU2l6ZSAqIE1hdGguY29zKHRoaXMub3JpZW50YXRpb24pO1xuXHRcdHRoaXMuWSArPSB0aGlzLnN0ZXBTaXplICogTWF0aC5zaW4odGhpcy5vcmllbnRhdGlvbik7XG5cdFx0dGhpcy5za2V0Y2gubGluZShvbGRYLCBvbGRZLCB0aGlzLlgsIHRoaXMuWSk7XG5cdH1cblx0c2V0dXAoKSB7XG5cdFx0dGhpcy5YID0gdGhpcy5za2V0Y2gud2lkdGggLyAyO1xuXHRcdHRoaXMuWSA9IHRoaXMuc2tldGNoLmhlaWdodCAvIDI7XG5cdFx0dGhpcy5za2V0Y2guYmFja2dyb3VuZCh0aGlzLmJnQ29sb3IpO1xuXHRcdHRoaXMuc2tldGNoLnN0cm9rZSh0aGlzLnN0cm9rZUNvbG9yKTtcblx0XHR0aGlzLnNrZXRjaC5zdHJva2VXZWlnaHQodGhpcy5zdHJva2VXaWR0aClcblx0fVxuXHRkcmF3KCkge1xuXHRcdHRoaXMuc3RlcERyYXcoKTtcblx0fVxufVxuXG5cbmNvbnN0IFNDSEVNQV9UdXJ0bGUgPSB7XG5cdGRvbWFpbjoge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdHRpdGxlOiAnU2VxdWVuY2UgRG9tYWluJyxcblx0XHRkZXNjcmlwdGlvbjogJ0NvbW1hIHNlcGVyYXRlZCBudW1iZXJzJyxcblx0XHRkZWZhdWx0OiBcIjAsMSwyLDMsNFwiLFxuXHRcdHJlcXVpcmVkOiB0cnVlXG5cdH0sXG5cdHJhbmdlOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdBbmdsZXMnLFxuXHRcdGRlZmF1bHQ6IFwiMzAsNDUsNjAsOTAsMTIwXCIsXG5cdFx0ZGVzY3JpcHRpb246ICdDb21tYSBzZXBlcmF0ZWQgbnVtYmVycycsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcblx0c3RlcFNpemU6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ1R1cnRsZVxcJ3Mgc3RlcCBzaXplJyxcblx0XHRkZWZhdWx0OiAyMCxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRzdHJva2VXZWlnaHQ6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ0hvdyB3aWRlIGEgc3Ryb2tlIGlzJyxcblx0XHRkZWZhdWx0OiA1LFxuXHRcdHJlcXVpcmVkOiB0cnVlXG5cdH0sXG5cdHN0YXJ0aW5nWDoge1xuXHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdHRpdGU6ICdYIHN0YXJ0J1xuXHR9LFxuXHRzdGFydGluZ1k6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRlOiAnWSBzdGFydCdcblx0fSxcblx0YmdDb2xvcjoge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdHRpdGxlOiAnQmFja2dyb3VuZCBDb2xvcicsXG5cdFx0Zm9ybWF0OiAnY29sb3InLFxuXHRcdGRlZmF1bHQ6IFwiIzY2NjY2NlwiLFxuXHRcdHJlcXVpcmVkOiBmYWxzZVxuXHR9LFxuXHRzdHJva2VDb2xvcjoge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdHRpdGxlOiAnU3Ryb2tlIENvbG9yJyxcblx0XHRmb3JtYXQ6ICdjb2xvcicsXG5cdFx0ZGVmYXVsdDogJyNmZjAwMDAnLFxuXHRcdHJlcXVpcmVkOiBmYWxzZVxuXHR9XG59XG5cbmNvbnN0IE1PRFVMRV9UdXJ0bGUgPSB7XG5cdHZpejogVklaX1R1cnRsZSxcblx0bmFtZTogXCJUdXJ0bGVcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdGNvbmZpZ1NjaGVtYTogU0NIRU1BX1R1cnRsZVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFX1R1cnRsZSIsIi8vQWRkIGFuIGltcG9ydCBsaW5lIGhlcmUgZm9yIG5ldyBtb2R1bGVzXG5cblxuLy9BZGQgbmV3IG1vZHVsZXMgdG8gdGhpcyBjb25zdGFudC5cbmNvbnN0IE1PRFVMRVMgPSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRVNcblxuTU9EVUxFU1tcIlR1cnRsZVwiXSA9IHJlcXVpcmUoJy4vbW9kdWxlVHVydGxlLmpzJylcbk1PRFVMRVNbXCJTaGlmdENvbXBhcmVcIl0gPSByZXF1aXJlKCcuL21vZHVsZVNoaWZ0Q29tcGFyZS5qcycpXG5NT0RVTEVTW1wiRGlmZmVyZW5jZXNcIl0gPSByZXF1aXJlKCcuL21vZHVsZURpZmZlcmVuY2VzLmpzJylcbk1PRFVMRVNbXCJNb2RGaWxsXCJdID0gcmVxdWlyZSgnLi9tb2R1bGVNb2RGaWxsLmpzJykiLCJcblNFUV9saW5lYXJSZWN1cnJlbmNlID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUxpblJlYy5qcycpXG5cbmZ1bmN0aW9uIEdFTl9maWJvbmFjY2koe1xuICAgIG1cbn0pIHtcbiAgICByZXR1cm4gU0VRX2xpbmVhclJlY3VycmVuY2UuZ2VuZXJhdG9yKHtcbiAgICAgICAgY29lZmZpY2llbnRMaXN0OiBbMSwgMV0sXG4gICAgICAgIHNlZWRMaXN0OiBbMSwgMV0sXG4gICAgICAgIG1cbiAgICB9KTtcbn1cblxuY29uc3QgU0NIRU1BX0ZpYm9uYWNjaT0ge1xuICAgIG06IHtcbiAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgIHRpdGxlOiAnTW9kJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBIG51bWJlciB0byBtb2QgdGhlIHNlcXVlbmNlIGJ5IGJ5JyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufVxuXG5cbmNvbnN0IFNFUV9maWJvbmFjY2kgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fZmlib25hY2NpLFxuXHRuYW1lOiBcIkZpYm9uYWNjaVwiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfRmlib25hY2NpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX2ZpYm9uYWNjaSIsIlxuXG5mdW5jdGlvbiBHRU5fbGluZWFyUmVjdXJyZW5jZSh7XG4gICAgY29lZmZpY2llbnRMaXN0LFxuICAgIHNlZWRMaXN0LFxuICAgIG1cbn0pIHtcbiAgICBpZiAoY29lZmZpY2llbnRMaXN0Lmxlbmd0aCAhPSBzZWVkTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgLy9OdW1iZXIgb2Ygc2VlZHMgc2hvdWxkIG1hdGNoIHRoZSBudW1iZXIgb2YgY29lZmZpY2llbnRzXG4gICAgICAgIGNvbnNvbGUubG9nKFwibnVtYmVyIG9mIGNvZWZmaWNpZW50cyBub3QgZXF1YWwgdG8gbnVtYmVyIG9mIHNlZWRzIFwiKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGxldCBrID0gY29lZmZpY2llbnRMaXN0Lmxlbmd0aDtcbiAgICBpZiAobSAhPSBcIlwiKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29lZmZpY2llbnRMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb2VmZmljaWVudExpc3RbaV0gPSBjb2VmZmljaWVudExpc3RbaV0gJSBtO1xuICAgICAgICAgICAgc2VlZExpc3RbaV0gPSBzZWVkTGlzdFtpXSAlIG07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdlbmVyaWNMaW5SZWMgPSBmdW5jdGlvbiAobiwgY2FjaGUpIHtcbiAgICAgICAgICAgIGlmKCBuIDwgc2VlZExpc3QubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICBjYWNoZVtuXSA9IHNlZWRMaXN0W25dXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlW25dIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGNhY2hlLmxlbmd0aDsgaSA8PSBuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgc3VtID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBzdW0gKz0gY2FjaGVbaSAtIGogLSAxXSAqIGNvZWZmaWNpZW50TGlzdFtqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FjaGVbaV0gPSBzdW0gJSBtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlW25dO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGdlbmVyaWNMaW5SZWMgPSBmdW5jdGlvbiAobiwgY2FjaGUpIHtcbiAgICAgICAgICAgIGlmKCBuIDwgc2VlZExpc3QubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICBjYWNoZVtuXSA9IHNlZWRMaXN0W25dXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlW25dIFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gY2FjaGUubGVuZ3RoOyBpIDw9IG47IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1bSArPSBjYWNoZVtpIC0gaiAtIDFdICogY29lZmZpY2llbnRMaXN0W2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWNoZVtpXSA9IHN1bTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjYWNoZVtuXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ2VuZXJpY0xpblJlY1xufVxuXG5jb25zdCBTQ0hFTUFfbGluZWFyUmVjdXJyZW5jZSA9IHtcbiAgICBjb2VmZmljaWVudExpc3Q6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIHRpdGxlOiAnQ29lZmZpY2llbnRzIGxpc3QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbW1hIHNlcGVyYXRlZCBudW1iZXJzJyxcbiAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICB9LFxuICAgIHNlZWRMaXN0OiB7XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICB0aXRsZTogJ1NlZWQgbGlzdCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tbWEgc2VwZXJhdGVkIG51bWJlcnMnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgIH0sXG4gICAgbToge1xuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgdGl0bGU6ICdNb2QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0EgbnVtYmVyIHRvIG1vZCB0aGUgc2VxdWVuY2UgYnkgYnknLFxuICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICB9XG59XG5cblxuY29uc3QgU0VRX2xpbmVhclJlY3VycmVuY2UgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fbGluZWFyUmVjdXJyZW5jZSxcblx0bmFtZTogXCJMaW5lYXIgUmVjdXJyZW5jZVwiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfbGluZWFyUmVjdXJyZW5jZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNFUV9saW5lYXJSZWN1cnJlbmNlIiwiXG5jb25zdCBTRVFfbGluZWFyUmVjdXJyZW5jZSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VMaW5SZWMuanMnKVxuXG5mdW5jdGlvbiBHRU5fTHVjYXMoe1xuICAgIG1cbn0pIHtcbiAgICByZXR1cm4gU0VRX2xpbmVhclJlY3VycmVuY2UuZ2VuZXJhdG9yKHtcbiAgICAgICAgY29lZmZpY2llbnRMaXN0OiBbMSwgMV0sXG4gICAgICAgIHNlZWRMaXN0OiBbMiwgMV0sXG4gICAgICAgIG1cbiAgICB9KTtcbn1cblxuY29uc3QgU0NIRU1BX0x1Y2FzPSB7XG4gICAgbToge1xuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgdGl0bGU6ICdNb2QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0EgbnVtYmVyIHRvIG1vZCB0aGUgc2VxdWVuY2UgYnkgYnknLFxuICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICB9XG59XG5cblxuY29uc3QgU0VRX0x1Y2FzID0ge1xuICAgIGdlbmVyYXRvcjogR0VOX0x1Y2FzLFxuXHRuYW1lOiBcIkx1Y2FzXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRwYXJhbXNTY2hlbWE6IFNDSEVNQV9MdWNhc1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNFUV9MdWNhcyIsIlxuXG5mdW5jdGlvbiBHRU5fTmF0dXJhbHMoe1xuICAgIGluY2x1ZGV6ZXJvXG59KXtcbiAgICBpZihpbmNsdWRlemVybyl7XG4gICAgICAgIHJldHVybiAoIChuKSA9PiBuIClcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgcmV0dXJuICggKG4pID0+IG4gKyAxIClcbiAgICB9XG59XG5cbmNvbnN0IFNDSEVNQV9OYXR1cmFscz0ge1xuICAgIGluY2x1ZGV6ZXJvOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgdGl0bGU6ICdJbmNsdWRlIHplcm8nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJycsXG4gICAgICAgIGRlZmF1bHQ6ICdmYWxzZScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn1cblxuXG5jb25zdCBTRVFfTmF0dXJhbHMgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fTmF0dXJhbHMsXG5cdG5hbWU6IFwiTmF0dXJhbHNcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdHBhcmFtc1NjaGVtYTogU0NIRU1BX05hdHVyYWxzXG59XG5cbi8vIGV4cG9ydCBkZWZhdWx0IFNFUV9OYXR1cmFsc1xubW9kdWxlLmV4cG9ydHMgPSBTRVFfTmF0dXJhbHMiLCJcblxuZnVuY3Rpb24gR0VOX1ByaW1lcygpIHtcbiAgICBjb25zdCBwcmltZXMgPSBmdW5jdGlvbiAobiwgY2FjaGUpIHtcbiAgICAgICAgaWYoY2FjaGUubGVuZ3RoID09IDApe1xuICAgICAgICAgICAgY2FjaGUucHVzaCgyKVxuICAgICAgICAgICAgY2FjaGUucHVzaCgzKVxuICAgICAgICAgICAgY2FjaGUucHVzaCg1KVxuICAgICAgICB9XG4gICAgICAgIGxldCBpID0gY2FjaGVbY2FjaGUubGVuZ3RoIC0gMV0gKyAxXG4gICAgICAgIGxldCBrID0gMFxuICAgICAgICB3aGlsZSAoY2FjaGUubGVuZ3RoIDw9IG4pIHtcbiAgICAgICAgICAgIGxldCBpc1ByaW1lID0gdHJ1ZVxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjYWNoZS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChpICUgY2FjaGVbal0gPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpc1ByaW1lID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNQcmltZSkge1xuICAgICAgICAgICAgICAgIGNhY2hlLnB1c2goaSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FjaGVbbl1cbiAgICB9XG4gICAgcmV0dXJuIHByaW1lc1xufVxuXG5cbmNvbnN0IFNDSEVNQV9QcmltZXM9IHtcbiAgICBtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICB0aXRsZTogJ01vZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBudW1iZXIgdG8gbW9kIHRoZSBzZXF1ZW5jZSBieScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn1cblxuXG5jb25zdCBTRVFfUHJpbWVzID0ge1xuICAgIGdlbmVyYXRvcjogR0VOX1ByaW1lcyxcblx0bmFtZTogXCJQcmltZXNcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdHBhcmFtc1NjaGVtYTogU0NIRU1BX1ByaW1lc1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNFUV9QcmltZXMiLCIvKipcbiAqXG4gKiBAY2xhc3MgU2VxdWVuY2VHZW5lcmF0b3JcbiAqL1xuY2xhc3MgU2VxdWVuY2VHZW5lcmF0b3Ige1xuICAgIC8qKlxuICAgICAqQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBTZXF1ZW5jZUdlbmVyYXRvci5cbiAgICAgKiBAcGFyYW0geyp9IGdlbmVyYXRvciBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBuYXR1cmFsIG51bWJlciBhbmQgcmV0dXJucyBhIG51bWJlciwgaXQgY2FuIG9wdGlvbmFsbHkgdGFrZSB0aGUgY2FjaGUgYXMgYSBzZWNvbmQgYXJndW1lbnRcbiAgICAgKiBAcGFyYW0geyp9IElEIHRoZSBJRCBvZiB0aGUgc2VxdWVuY2VcbiAgICAgKiBAbWVtYmVyb2YgU2VxdWVuY2VHZW5lcmF0b3JcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihJRCwgZ2VuZXJhdG9yKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICB0aGlzLklEID0gSUQ7XG4gICAgICAgIHRoaXMuY2FjaGUgPSBbXTtcbiAgICAgICAgdGhpcy5uZXdTaXplID0gMTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogaWYgd2UgbmVlZCB0byBnZXQgdGhlIG50aCBlbGVtZW50IGFuZCBpdCdzIG5vdCBwcmVzZW50IGluXG4gICAgICogaW4gdGhlIGNhY2hlLCB0aGVuIHdlIGVpdGhlciBkb3VibGUgdGhlIHNpemUsIG9yIHRoZSBcbiAgICAgKiBuZXcgc2l6ZSBiZWNvbWVzIG4rMVxuICAgICAqIEBwYXJhbSB7Kn0gbiBcbiAgICAgKiBAbWVtYmVyb2YgU2VxdWVuY2VHZW5lcmF0b3JcbiAgICAgKi9cbiAgICByZXNpemVDYWNoZShuKSB7XG4gICAgICAgIHRoaXMubmV3U2l6ZSA9IHRoaXMuY2FjaGUubGVuZ3RoICogMjtcbiAgICAgICAgaWYgKG4gKyAxID4gdGhpcy5uZXdTaXplKSB7XG4gICAgICAgICAgICB0aGlzLm5ld1NpemUgPSBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBQb3B1bGF0ZXMgdGhlIGNhY2hlIHVwIHVudGlsIHRoZSBjdXJyZW50IG5ld1NpemVcbiAgICAgKiB0aGlzIGlzIGNhbGxlZCBhZnRlciByZXNpemVDYWNoZVxuICAgICAqIEBtZW1iZXJvZiBTZXF1ZW5jZUdlbmVyYXRvclxuICAgICAqL1xuICAgIGZpbGxDYWNoZSgpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuY2FjaGUubGVuZ3RoOyBpIDwgdGhpcy5uZXdTaXplOyBpKyspIHtcbiAgICAgICAgICAgIC8vdGhlIGdlbmVyYXRvciBpcyBnaXZlbiB0aGUgY2FjaGUgc2luY2UgaXQgd291bGQgbWFrZSBjb21wdXRhdGlvbiBtb3JlIGVmZmljaWVudCBzb21ldGltZXNcbiAgICAgICAgICAgIC8vYnV0IHRoZSBnZW5lcmF0b3IgZG9lc24ndCBuZWNlc3NhcmlseSBuZWVkIHRvIHRha2UgbW9yZSB0aGFuIG9uZSBhcmd1bWVudC5cbiAgICAgICAgICAgIHRoaXMuY2FjaGVbaV0gPSB0aGlzLmdlbmVyYXRvcihpLCB0aGlzLmNhY2hlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgZWxlbWVudCBpcyB3aGF0IHRoZSBkcmF3aW5nIHRvb2xzIHdpbGwgYmUgY2FsbGluZywgaXQgcmV0cmlldmVzXG4gICAgICogdGhlIG50aCBlbGVtZW50IG9mIHRoZSBzZXF1ZW5jZSBieSBlaXRoZXIgZ2V0dGluZyBpdCBmcm9tIHRoZSBjYWNoZVxuICAgICAqIG9yIGlmIGlzbid0IHByZXNlbnQsIGJ5IGJ1aWxkaW5nIHRoZSBjYWNoZSBhbmQgdGhlbiBnZXR0aW5nIGl0XG4gICAgICogQHBhcmFtIHsqfSBuIHRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgc2VxdWVuY2Ugd2Ugd2FudFxuICAgICAqIEByZXR1cm5zIGEgbnVtYmVyXG4gICAgICogQG1lbWJlcm9mIFNlcXVlbmNlR2VuZXJhdG9yXG4gICAgICovXG4gICAgZ2V0RWxlbWVudChuKSB7XG4gICAgICAgIGlmICh0aGlzLmNhY2hlW25dICE9IHVuZGVmaW5lZCB8fCB0aGlzLmZpbml0ZSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJjYWNoZSBoaXRcIilcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhY2hlW25dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJjYWNoZSBtaXNzXCIpXG4gICAgICAgICAgICB0aGlzLnJlc2l6ZUNhY2hlKG4pO1xuICAgICAgICAgICAgdGhpcy5maWxsQ2FjaGUoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhY2hlW25dO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbi8qKlxuICpcbiAqXG4gKiBAcGFyYW0geyp9IGNvZGUgYXJiaXRyYXJ5IHNhZ2UgY29kZSB0byBiZSBleGVjdXRlZCBvbiBhbGVwaFxuICogQHJldHVybnMgYWpheCByZXNwb25zZSBvYmplY3RcbiAqL1xuZnVuY3Rpb24gc2FnZUV4ZWN1dGUoY29kZSkge1xuICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgIGFzeW5jOiBmYWxzZSxcbiAgICAgICAgdXJsOiAnaHR0cDovL2FsZXBoLnNhZ2VtYXRoLm9yZy9zZXJ2aWNlJyxcbiAgICAgICAgZGF0YTogXCJjb2RlPVwiICsgY29kZVxuICAgIH0pXG59XG5cbi8qKlxuICpcbiAqXG4gKiBAcGFyYW0geyp9IGNvZGUgYXJiaXRyYXJ5IHNhZ2UgY29kZSB0byBiZSBleGVjdXRlZCBvbiBhbGVwaFxuICogQHJldHVybnMgYWpheCByZXNwb25zZSBvYmplY3RcbiAqL1xuYXN5bmMgZnVuY3Rpb24gc2FnZUV4ZWN1dGVBc3luYyhjb2RlKSB7XG4gICAgcmV0dXJuIGF3YWl0ICQuYWpheCh7XG4gICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgdXJsOiAnaHR0cDovL2FsZXBoLnNhZ2VtYXRoLm9yZy9zZXJ2aWNlJyxcbiAgICAgICAgZGF0YTogXCJjb2RlPVwiICsgY29kZVxuICAgIH0pXG59XG5cblxuY2xhc3MgT0VJU1NlcXVlbmNlR2VuZXJhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihJRCwgT0VJUykge1xuICAgICAgICB0aGlzLk9FSVMgPSBPRUlTO1xuICAgICAgICB0aGlzLklEID0gSUQ7XG4gICAgICAgIHRoaXMuY2FjaGUgPSBbXTtcbiAgICAgICAgdGhpcy5uZXdTaXplID0gMTtcbiAgICAgICAgdGhpcy5wcmVmaWxsQ2FjaGUoKVxuICAgIH1cbiAgICBvZWlzRmV0Y2gobikge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkZldGNoaW5nLi5cIilcbiAgICAgICAgbGV0IGNvZGUgPSBgcHJpbnQoc2xvYW5lLiR7dGhpcy5PRUlTfS5saXN0KCR7bn0pKWA7XG4gICAgICAgIGxldCByZXNwID0gc2FnZUV4ZWN1dGUoY29kZSk7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3AucmVzcG9uc2VKU09OLnN0ZG91dClcbiAgICB9XG4gICAgYXN5bmMgcHJlZmlsbENhY2hlKCkge1xuICAgICAgICB0aGlzLnJlc2l6ZUNhY2hlKDMwMDApO1xuICAgICAgICBsZXQgY29kZSA9IGBwcmludChzbG9hbmUuJHt0aGlzLk9FSVN9Lmxpc3QoJHt0aGlzLm5ld1NpemV9KSlgO1xuICAgICAgICBsZXQgcmVzcCA9IGF3YWl0IHNhZ2VFeGVjdXRlQXN5bmMoY29kZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3ApXG4gICAgICAgIHRoaXMuY2FjaGUgPSB0aGlzLmNhY2hlLmNvbmNhdChKU09OLnBhcnNlKHJlc3Auc3Rkb3V0KSlcbiAgICB9XG4gICAgcmVzaXplQ2FjaGUobikge1xuICAgICAgICB0aGlzLm5ld1NpemUgPSB0aGlzLmNhY2hlLmxlbmd0aCAqIDI7XG4gICAgICAgIGlmIChuICsgMSA+IHRoaXMubmV3U2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5uZXdTaXplID0gbiArIDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmlsbENhY2hlKCkge1xuICAgICAgICBsZXQgbmV3TGlzdCA9IHRoaXMub2Vpc0ZldGNoKHRoaXMubmV3U2l6ZSk7XG4gICAgICAgIHRoaXMuY2FjaGUgPSB0aGlzLmNhY2hlLmNvbmNhdChuZXdMaXN0KTtcbiAgICB9XG4gICAgZ2V0RWxlbWVudChuKSB7XG4gICAgICAgIGlmICh0aGlzLmNhY2hlW25dICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZUNhY2hlKCk7XG4gICAgICAgICAgICB0aGlzLmZpbGxDYWNoZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIEJ1aWx0SW5OYW1lVG9TZXEoSUQsIHNlcU5hbWUsIHNlcVBhcmFtcyl7XG4gICAgbGV0IGdlbmVyYXRvciA9IEJ1aWx0SW5TZXFzW3NlcU5hbWVdLmdlbmVyYXRvcihzZXFQYXJhbXMpXG4gICAgcmV0dXJuIG5ldyBTZXF1ZW5jZUdlbmVyYXRvcihJRCwgZ2VuZXJhdG9yKVxufVxuXG5cbmZ1bmN0aW9uIExpc3RUb1NlcShJRCwgbGlzdCkge1xuICAgIGxldCBsaXN0R2VuZXJhdG9yID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgcmV0dXJuIGxpc3Rbbl07XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2VxdWVuY2VHZW5lcmF0b3IoSUQsIGxpc3RHZW5lcmF0b3IpO1xufVxuXG5mdW5jdGlvbiBPRUlTVG9TZXEoSUQsIE9FSVMpIHtcbiAgICByZXR1cm4gbmV3IE9FSVNTZXF1ZW5jZUdlbmVyYXRvcihJRCwgT0VJUyk7XG59XG5cblxuY29uc3QgQnVpbHRJblNlcXMgPSB7fVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdCdWlsdEluTmFtZVRvU2VxJzogQnVpbHRJbk5hbWVUb1NlcSxcbiAgICAnTGlzdFRvU2VxJzogTGlzdFRvU2VxLFxuICAgICdPRUlTVG9TZXEnOiBPRUlTVG9TZXEsXG4gICAgJ0J1aWx0SW5TZXFzJzogQnVpbHRJblNlcXNcbn1cblxuXG5CdWlsdEluU2Vxc1tcImZpYm9uYWNjaVwiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VGaWJvbmFjY2kuanMnKVxuQnVpbHRJblNlcXNbXCJsdWNhc1wiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VMdWNhcy5qcycpXG5CdWlsdEluU2Vxc1tcInByaW1lc1wiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VQcmltZXMuanMnKVxuQnVpbHRJblNlcXNbXCJuYXR1cmFsc1wiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VOYXR1cmFscy5qcycpXG5CdWlsdEluU2Vxc1tcImxpblJlY1wiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VMaW5SZWMuanMnKVxuQnVpbHRJblNlcXNbJ1ByaW1lcyddID0gcmVxdWlyZSgnLi9zZXF1ZW5jZVByaW1lcy5qcycpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcIkEwMDAwMDFcIiwgXCJBMDAwMDI3XCIsIFwiQTAwMDAwNFwiLCBcIkEwMDAwMDVcIiwgXCJBMDAwMDA4XCIsIFwiQTAwMDAwOVwiLCBcIkEwMDA3OTZcIiwgXCJBMDAzNDE4XCIsIFwiQTAwNzMxOFwiLCBcIkEwMDgyNzVcIiwgXCJBMDA4Mjc3XCIsIFwiQTA0OTMxMFwiLCBcIkEwMDAwMTBcIiwgXCJBMDAwMDA3XCIsIFwiQTAwNTg0M1wiLCBcIkEwMDAwMzVcIiwgXCJBMDAwMTY5XCIsIFwiQTAwMDI3MlwiLCBcIkEwMDAzMTJcIiwgXCJBMDAxNDc3XCIsIFwiQTAwNDUyNlwiLCBcIkEwMDAzMjZcIiwgXCJBMDAyMzc4XCIsIFwiQTAwMjYyMFwiLCBcIkEwMDU0MDhcIiwgXCJBMDAwMDEyXCIsIFwiQTAwMDEyMFwiLCBcIkEwMTAwNjBcIiwgXCJBMDAwMDY5XCIsIFwiQTAwMTk2OVwiLCBcIkEwMDAyOTBcIiwgXCJBMDAwMjI1XCIsIFwiQTAwMDAxNVwiLCBcIkEwMDAwMTZcIiwgXCJBMDAwMDMyXCIsIFwiQTAwNDA4NlwiLCBcIkEwMDIxMTNcIiwgXCJBMDAwMDMwXCIsIFwiQTAwMDA0MFwiLCBcIkEwMDI4MDhcIiwgXCJBMDE4MjUyXCIsIFwiQTAwMDA0M1wiLCBcIkEwMDA2NjhcIiwgXCJBMDAwMzk2XCIsIFwiQTAwNTEwMFwiLCBcIkEwMDUxMDFcIiwgXCJBMDAyMTEwXCIsIFwiQTAwMDcyMFwiLCBcIkEwNjQ1NTNcIiwgXCJBMDAxMDU1XCIsIFwiQTAwNjUzMFwiLCBcIkEwMDA5NjFcIiwgXCJBMDA1MTE3XCIsIFwiQTAyMDYzOVwiLCBcIkEwMDAwNDFcIiwgXCJBMDAwMDQ1XCIsIFwiQTAwMDEwOFwiLCBcIkEwMDEwMDZcIiwgXCJBMDAwMDc5XCIsIFwiQTAwMDU3OFwiLCBcIkEwMDAyNDRcIiwgXCJBMDAwMzAyXCIsIFwiQTAwMDU4M1wiLCBcIkEwMDAxNDJcIiwgXCJBMDAwMDg1XCIsIFwiQTAwMTE4OVwiLCBcIkEwMDA2NzBcIiwgXCJBMDA2MzE4XCIsIFwiQTAwMDE2NVwiLCBcIkEwMDExNDdcIiwgXCJBMDA2ODgyXCIsIFwiQTAwMDk4NFwiLCBcIkEwMDE0MDVcIiwgXCJBMDAwMjkyXCIsIFwiQTAwMDMzMFwiLCBcIkEwMDAxNTNcIiwgXCJBMDAwMjU1XCIsIFwiQTAwMDI2MVwiLCBcIkEwMDE5MDlcIiwgXCJBMDAxOTEwXCIsIFwiQTA5MDAxMFwiLCBcIkEwNTU3OTBcIiwgXCJBMDkwMDEyXCIsIFwiQTA5MDAxM1wiLCBcIkEwOTAwMTRcIiwgXCJBMDkwMDE1XCIsIFwiQTA5MDAxNlwiLCBcIkEwMDAxNjZcIiwgXCJBMDAwMjAzXCIsIFwiQTAwMTE1N1wiLCBcIkEwMDg2ODNcIiwgXCJBMDAwMjA0XCIsIFwiQTAwMDIxN1wiLCBcIkEwMDAxMjRcIiwgXCJBMDAyMjc1XCIsIFwiQTAwMTExMFwiLCBcIkEwNTE5NTlcIiwgXCJBMDAxMjIxXCIsIFwiQTAwMTIyMlwiLCBcIkEwNDY2NjBcIiwgXCJBMDAxMjI3XCIsIFwiQTAwMTM1OFwiLCBcIkEwMDE2OTRcIiwgXCJBMDAxODM2XCIsIFwiQTAwMTkwNlwiLCBcIkEwMDEzMzNcIiwgXCJBMDAxMDQ1XCIsIFwiQTAwMDEyOVwiLCBcIkEwMDExMDlcIiwgXCJBMDE1NTIxXCIsIFwiQTAxNTUyM1wiLCBcIkEwMTU1MzBcIiwgXCJBMDE1NTMxXCIsIFwiQTAxNTU1MVwiLCBcIkEwODI0MTFcIiwgXCJBMDgzMTAzXCIsIFwiQTA4MzEwNFwiLCBcIkEwODMxMDVcIiwgXCJBMDgzMjE2XCIsIFwiQTA2MTA4NFwiLCBcIkEwMDAyMTNcIiwgXCJBMDAwMDczXCIsIFwiQTA3OTkyMlwiLCBcIkEwNzk5MjNcIiwgXCJBMTA5ODE0XCIsIFwiQTExMTc3NFwiLCBcIkExMTE3NzVcIiwgXCJBMTExNzg3XCIsIFwiQTAwMDExMFwiLCBcIkEwMDA1ODdcIiwgXCJBMDAwMTAwXCJdXG4iXX0=
