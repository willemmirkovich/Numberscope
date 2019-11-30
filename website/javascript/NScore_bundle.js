(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*jshint maxerr: 10000 */

SEQUENCE = require('./sequences/sequences.js');
VALIDOEIS = require('./validOEIS.js');
MODULES = require('./modules/modules.js');

BuiltInSeqs = SEQUENCE.BuiltInSeqs;
ListToSeq = SEQUENCE.ListToSeq;
OEISToSeq = SEQUENCE.OEISToSeq;
BuiltInNameToSeq = SEQUENCE.BuiltInNameToSeq;

function stringToArray(strArr) {
	return JSON.parse("[" + strArr + "]");
}

const NScore = function () {
	const modules = MODULES; //  classes to the drawing modules
	const validOEIS = VALIDOEIS;
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
		div.className = "canvasClass";
		div.id = "liveCanvas" + divID;
		document.getElementById("canvasArea").appendChild(div);
		//-------------------------------------------
		//Create P5js instance
		let myp5 = new p5(function (sketch) {
			let moduleInstance = new moduleClass(seq, sketch, config);
			sketch.setup = function () {
				sketch.createCanvas(width, height);
				sketch.background("white");
				moduleInstance.setup();
			};

			sketch.draw = function () {
				moduleInstance.draw();
			};
		}, div.id);
		return myp5;
	};

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
			validationResult = Validation.module(moduleObj);
			if (validationResult.errors.length != 0) {
				preparedTools[moduleObj.ID] = null;
				return validationResult.errors;
			}
			moduleObj.config = validationResult.parsedFields;
			preparedTools[moduleObj.ID] = {
				module: modules[moduleObj.moduleKey],
				config: moduleObj.config,
				ID: moduleObj.ID
			};
			return true;
		}
	};

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
				validationResult = Validation.builtIn(seqObj);
				if (validationResult.errors.length != 0) {
					preparedSequences[seqObj.ID] = null;
					return validationResult.errors;
				}
				console.log(validationResult);
				seqObj.parameters = validationResult.parsedFields;
				console.log(seqObj);
				preparedSequences[seqObj.ID] = BuiltInNameToSeq(seqObj.ID, seqObj.inputValue, seqObj.parameters);
			}
			if (seqObj.inputType == "OEIS") {
				validationResult = Validation.oeis(seqObj);
				if (validationResult.errors.length != 0) {
					preparedSequences[seqObj.ID] = null;
					return validationResult.errors;
				}
				preparedSequences[seqObj.ID] = OEISToSeq(seqObj.ID, seqObj.inputValue);
			}
			if (seqObj.inputType == "list") {
				validationResult = Validation.list(seqObj);
				if (validationResult.errors.length != 0) {
					preparedSequences[seqObj.ID] = null;
					return validationResult.errors;
				}
				preparedSequences[seqObj.ID] = ListToSeq(seqObj.ID, seqObj.inputValue);

			}
			if (seqObj.inputType == "code") {
				console.error("Not implemented");
			}
		}
		return true;
	};
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
		hideLog();

		//Figuring out layout
		//--------------------------------------
		let totalWidth = document.getElementById('canvasArea').offsetWidth;
		let totalHeight = document.getElementById('canvasArea').offsetHeight;
		let canvasCount = seqVizPairs.length;
		let gridSize = Math.ceil(Math.sqrt(canvasCount));
		let individualWidth = totalWidth / gridSize - 20;
		let individualHeight = totalHeight / gridSize;
		//--------------------------------------

		for (let pair of seqVizPairs) {
			let currentSeq = preparedSequences[pair["seqID"]];
			let currentTool = preparedTools[pair["toolID"]];
			if (currentSeq && currentTool == undefined) {
				console.error("undefined ID for tool or sequence");
			}
			liveSketches.push(generateP5(currentTool['module']["viz"], currentTool['config'], currentSeq, liveSketches.length, individualWidth, individualHeight));
		}
	};

	const clear = function () {
		showLog();
		if (liveSketches.length == 0) {
			return;
		} else {
			for (let i = 0; i < liveSketches.length; i++) {
				liveSketches[i].remove(); //delete canvas element
			}
		}
	};

	const pause = function () {
		liveSketches.forEach(function (sketch) {
			sketch.noLoop();
		});
	};

	const resume = function () {
		liveSketches.forEach(function (sketch) {
			sketch.loop();
		});
	};

	const step = function () {
		liveSketches.forEach(function (sketch) {
			sketch.redraw();
		});
	};

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
	};
}();

const Validation = function () {


	const listError = function (title) {
		let msg = "can't parse the list, please pass numbers seperated by commas (example: 1,2,3)";
		if (title != undefined) {
			msg = title + ": " + msg;
		}
		return msg;
	};

	const requiredError = function (title) {
		return `${title}: this is a required value, don't leave it empty!`;
	};

	const typeError = function (title, value, expectedType) {
		return `${title}: ${value} is a ${typeof(value)}, expected a ${expectedType}. `;
	};

	const oeisError = function (code) {
		return `${code}: Either an invalid OEIS code or not defined by sage!`;
	};

	const builtIn = function (seqObj) {
		let schema = BuiltInSeqs[seqObj.inputValue].paramsSchema;
		let receivedParams = seqObj.parameters;

		let validationResult = {
			parsedFields: {},
			errors: []
		};
		Object.keys(receivedParams).forEach(
			(parameter) => {
				validateFromSchema(schema, parameter, receivedParams[parameter], validationResult);
			}
		);
		return validationResult;
	};

	const oeis = function (seqObj) {
		let validationResult = {
			parsedFields: {},
			errors: []
		};
		seqObj.inputValue = seqObj.inputValue.trim();
		let oeisCode = seqObj.inputValue;
		if (!VALIDOEIS.includes(oeisCode)) {
			validationResult.errors.push(oeisError(oeisCode));
		}
		return validationResult;
	};

	const list = function (seqObj) {
		let validationResult = {
			parsedFields: {},
			errors: []
		};
		try {
			seqObj.inputValue = JSON.parse(seqObj.inputValue);
		} catch (err) {
			validationResult.errors.push(listError());
		}
		return validationResult;
	};

	const _module = function (moduleObj) {
		let schema = MODULES[moduleObj.moduleKey].configSchema;
		let receivedConfig = moduleObj.config;

		let validationResult = {
			parsedFields: {},
			errors: []
		};

		Object.keys(receivedConfig).forEach(
			(configField) => {
				validateFromSchema(schema, configField, receivedConfig[configField], validationResult);
			}
		);
		return validationResult;
	};

	const validateFromSchema = function (schema, field, value, validationResult) {
		let title = schema[field].title;
		if (typeof (value) == "string") {
			value = value.trim();
		}
		let expectedType = schema[field].type;
		let required = (schema[field].required !== undefined) ? schema[field].required : false;
		let format = (schema[field].format !== undefined) ? schema[field].format : false;
		let isEmpty = (value === '');
		console.log(validationResult);
		if (required && isEmpty) {
			validationResult.errors.push(requiredError(title));
		}
		if (isEmpty) {
			parsed = null;
		}
		if (!isEmpty && (expectedType == "number")) {
			parsed = parseInt(value);
			if (parsed != parsed) { // https://stackoverflow.com/questions/34261938/what-is-the-difference-between-nan-nan-and-nan-nan
				validationResult.errors.push(typeError(title, value, expectedType));
			}
		}
		if (!isEmpty && (expectedType == "string")) {
			parsed = value;
		}
		if (!isEmpty && (expectedType == "boolean")) {
			if (value == '1') {
				parsed = true;
			} else {
				parsed = false;
			}
		}
		if (format && (format == "list")) {
			try {
				parsed = JSON.parse("[" + value + "]");
			} catch (err) {
				validationResult.errors.push(listError(title));
			}
		}
		if (parsed !== undefined) {
			validationResult.parsedFields[field] = parsed;
		}
	};

	return {
		builtIn: builtIn,
		oeis: oeis,
		list: list,
		module: _module
	};
}();



const LogPanel = function () {
	logGreen = function (line) {
		$("#innerLogArea").append(`<p style="color:#00ff00">${line}</p><br>`);
	};
	logRed = function (line) {
		$("#innerLogArea").append(`<p style="color:red">${line}</p><br>`);
	};
	clearlog = function () {
		$("#innerLogArea").empty();
	};
	hideLog = function () {
		$("#logArea").css('display', 'none');
	};
	showLog = function () {
		$("#logArea").css('display', 'block');
	};
	return {
		logGreen: logGreen,
		logRed: logRed,
		clearlog: clearlog,
		hideLog: hideLog,
		showLog: showLog,
	};
}();
window.NScore = NScore;
window.LogPanel = LogPanel;
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
		var domain = config['domain']
		var range = config['range']
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
		format:'list',
		default: "0,1,2,3,4",
		required: true
	},
	range: {
		type: 'string',
		title: 'Angles',
		default: "30,45,60,90,120",
		format:'list',
		description: 'Comma seperated numbers',
		required: true
	},
	stepSize: {
		type: 'number',
		title: 'Step Size',
		default: 20,
		required: true
	},
	strokeWeight: {
		type: 'number',
		title: 'Stroke Width',
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
	},
	testThing: {
		type: 'string',
		title: 'hello',
		foramt: 'list'
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

SEQ_linearRecurrence = require('./sequenceLinRec.js');

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
};


const SEQ_fibonacci = {
    generator: GEN_fibonacci,
	name: "Fibonacci",
	description: "",
	paramsSchema: SCHEMA_Fibonacci
};

module.exports = SEQ_fibonacci;
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
    if (m != null) {
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
        format:'list',
        description: 'Comma seperated numbers',
        required: true
    },
    seedList: {
        type: 'string',
        title: 'Seed list',
        format:'list',
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
    });
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
    });
}


class OEISSequenceGenerator {
    constructor(ID, OEIS) {
        this.OEIS = OEIS;
        this.ID = ID;
        this.cache = [];
        this.newSize = 1;
        this.prefillCache();
    }
    oeisFetch(n) {
        console.log("Fetching..");
        let code = `print(sloane.${this.OEIS}.list(${n}))`;
        let resp = sageExecute(code);
        return JSON.parse(resp.responseJSON.stdout);
    }
    async prefillCache() {
        this.resizeCache(3000);
        let code = `print(sloane.${this.OEIS}.list(${this.newSize}))`;
        let resp = await sageExecuteAsync(code);
        console.log(resp);
        this.cache = this.cache.concat(JSON.parse(resp.stdout));
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

function BuiltInNameToSeq(ID, seqName, seqParams) {
    let generator = BuiltInSeqs[seqName].generator(seqParams);
    return new SequenceGenerator(ID, generator);
}


function ListToSeq(ID, list) {
    let listGenerator = function (n) {
        return list[n];
    };
    return new SequenceGenerator(ID, listGenerator);
}

function OEISToSeq(ID, OEIS) {
    return new OEISSequenceGenerator(ID, OEIS);
}


const BuiltInSeqs = {};


module.exports = {
    'BuiltInNameToSeq': BuiltInNameToSeq,
    'ListToSeq': ListToSeq,
    'OEISToSeq': OEISToSeq,
    'BuiltInSeqs': BuiltInSeqs
};


BuiltInSeqs["Fibonacci"] = require('./sequenceFibonacci.js');
BuiltInSeqs["Lucas"] = require('./sequenceLucas.js');
BuiltInSeqs["Primes"] = require('./sequencePrimes.js');
BuiltInSeqs["Naturals"] = require('./sequenceNaturals.js');
BuiltInSeqs["LinRec"] = require('./sequenceLinRec.js');
BuiltInSeqs['Primes'] = require('./sequencePrimes.js');
},{"./sequenceFibonacci.js":7,"./sequenceLinRec.js":8,"./sequenceLucas.js":9,"./sequenceNaturals.js":10,"./sequencePrimes.js":11}],13:[function(require,module,exports){
module.exports = ["A000001", "A000027", "A000004", "A000005", "A000008", "A000009", "A000796", "A003418", "A007318", "A008275", "A008277", "A049310", "A000010", "A000007", "A005843", "A000035", "A000169", "A000272", "A000312", "A001477", "A004526", "A000326", "A002378", "A002620", "A005408", "A000012", "A000120", "A010060", "A000069", "A001969", "A000290", "A000225", "A000015", "A000016", "A000032", "A004086", "A002113", "A000030", "A000040", "A002808", "A018252", "A000043", "A000668", "A000396", "A005100", "A005101", "A002110", "A000720", "A064553", "A001055", "A006530", "A000961", "A005117", "A020639", "A000041", "A000045", "A000108", "A001006", "A000079", "A000578", "A000244", "A000302", "A000583", "A000142", "A000085", "A001189", "A000670", "A006318", "A000165", "A001147", "A006882", "A000984", "A001405", "A000292", "A000330", "A000153", "A000255", "A000261", "A001909", "A001910", "A090010", "A055790", "A090012", "A090013", "A090014", "A090015", "A090016", "A000166", "A000203", "A001157", "A008683", "A000204", "A000217", "A000124", "A002275", "A001110", "A051959", "A001221", "A001222", "A046660", "A001227", "A001358", "A001694", "A001836", "A001906", "A001333", "A001045", "A000129", "A001109", "A015521", "A015523", "A015530", "A015531", "A015551", "A082411", "A083103", "A083104", "A083105", "A083216", "A061084", "A000213", "A000073", "A079922", "A079923", "A109814", "A111774", "A111775", "A111787", "A000110", "A000587", "A000100"]

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvTlNjb3JlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlRGlmZmVyZW5jZXMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVNb2RGaWxsLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlU2hpZnRDb21wYXJlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlVHVydGxlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9zZXF1ZW5jZXMvc2VxdWVuY2VGaWJvbmFjY2kuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvc2VxdWVuY2VzL3NlcXVlbmNlTGluUmVjLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZUx1Y2FzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZU5hdHVyYWxzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZVByaW1lcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9zZXF1ZW5jZXMvc2VxdWVuY2VzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3ZhbGlkT0VJUy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxS0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qanNoaW50IG1heGVycjogMTAwMDAgKi9cblxuU0VRVUVOQ0UgPSByZXF1aXJlKCcuL3NlcXVlbmNlcy9zZXF1ZW5jZXMuanMnKTtcblZBTElET0VJUyA9IHJlcXVpcmUoJy4vdmFsaWRPRUlTLmpzJyk7XG5NT0RVTEVTID0gcmVxdWlyZSgnLi9tb2R1bGVzL21vZHVsZXMuanMnKTtcblxuQnVpbHRJblNlcXMgPSBTRVFVRU5DRS5CdWlsdEluU2Vxcztcbkxpc3RUb1NlcSA9IFNFUVVFTkNFLkxpc3RUb1NlcTtcbk9FSVNUb1NlcSA9IFNFUVVFTkNFLk9FSVNUb1NlcTtcbkJ1aWx0SW5OYW1lVG9TZXEgPSBTRVFVRU5DRS5CdWlsdEluTmFtZVRvU2VxO1xuXG5mdW5jdGlvbiBzdHJpbmdUb0FycmF5KHN0ckFycikge1xuXHRyZXR1cm4gSlNPTi5wYXJzZShcIltcIiArIHN0ckFyciArIFwiXVwiKTtcbn1cblxuY29uc3QgTlNjb3JlID0gZnVuY3Rpb24gKCkge1xuXHRjb25zdCBtb2R1bGVzID0gTU9EVUxFUzsgLy8gIGNsYXNzZXMgdG8gdGhlIGRyYXdpbmcgbW9kdWxlc1xuXHRjb25zdCB2YWxpZE9FSVMgPSBWQUxJRE9FSVM7XG5cdHZhciBwcmVwYXJlZFNlcXVlbmNlcyA9IFtdOyAvLyBzZXF1ZW5jZUdlbmVyYXRvcnMgdG8gYmUgZHJhd25cblx0dmFyIHByZXBhcmVkVG9vbHMgPSBbXTsgLy8gY2hvc2VuIGRyYXdpbmcgbW9kdWxlcyBcblx0dmFyIGxpdmVTa2V0Y2hlcyA9IFtdOyAvLyBwNSBza2V0Y2hlcyBiZWluZyBkcmF3blxuXG5cdC8qKlxuXHQgKlxuXHQgKlxuXHQgKiBAcGFyYW0geyp9IG1vZHVsZUNsYXNzIGRyYXdpbmcgbW9kdWxlIHRvIGJlIHVzZWQgZm9yIHRoaXMgc2tldGNoXG5cdCAqIEBwYXJhbSB7Kn0gY29uZmlnIGNvcnJlc3BvbmRpbmcgY29uZmlnIGZvciBkcmF3aW5nIG1vZHVsZVxuXHQgKiBAcGFyYW0geyp9IHNlcSBzZXF1ZW5jZSB0byBiZSBwYXNzZWQgdG8gZHJhd2luZyBtb2R1bGVcblx0ICogQHBhcmFtIHsqfSBkaXZJRCBkaXYgd2hlcmUgc2tldGNoIHdpbGwgYmUgcGxhY2VkXG5cdCAqIEBwYXJhbSB7Kn0gd2lkdGggd2lkdGggb2Ygc2tldGNoXG5cdCAqIEBwYXJhbSB7Kn0gaGVpZ2h0IGhlaWdodCBvZiBza2V0Y2hcblx0ICogQHJldHVybnMgcDUgc2tldGNoXG5cdCAqL1xuXHRjb25zdCBnZW5lcmF0ZVA1ID0gZnVuY3Rpb24gKG1vZHVsZUNsYXNzLCBjb25maWcsIHNlcSwgZGl2SUQsIHdpZHRoLCBoZWlnaHQpIHtcblxuXHRcdC8vQ3JlYXRlIGNhbnZhcyBlbGVtZW50IGhlcmVcblx0XHR2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0Ly9UaGUgc3R5bGUgb2YgdGhlIGNhbnZhc2VzIHdpbGwgYmUgXCJjYW52YXNDbGFzc1wiXG5cdFx0ZGl2LmNsYXNzTmFtZSA9IFwiY2FudmFzQ2xhc3NcIjtcblx0XHRkaXYuaWQgPSBcImxpdmVDYW52YXNcIiArIGRpdklEO1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzQXJlYVwiKS5hcHBlbmRDaGlsZChkaXYpO1xuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdC8vQ3JlYXRlIFA1anMgaW5zdGFuY2Vcblx0XHRsZXQgbXlwNSA9IG5ldyBwNShmdW5jdGlvbiAoc2tldGNoKSB7XG5cdFx0XHRsZXQgbW9kdWxlSW5zdGFuY2UgPSBuZXcgbW9kdWxlQ2xhc3Moc2VxLCBza2V0Y2gsIGNvbmZpZyk7XG5cdFx0XHRza2V0Y2guc2V0dXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHNrZXRjaC5jcmVhdGVDYW52YXMod2lkdGgsIGhlaWdodCk7XG5cdFx0XHRcdHNrZXRjaC5iYWNrZ3JvdW5kKFwid2hpdGVcIik7XG5cdFx0XHRcdG1vZHVsZUluc3RhbmNlLnNldHVwKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRza2V0Y2guZHJhdyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0bW9kdWxlSW5zdGFuY2UuZHJhdygpO1xuXHRcdFx0fTtcblx0XHR9LCBkaXYuaWQpO1xuXHRcdHJldHVybiBteXA1O1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBXaGVuIHRoZSB1c2VyIGNob29zZXMgYSBkcmF3aW5nIG1vZHVsZSBhbmQgcHJvdmlkZXMgY29ycmVzcG9uZGluZyBjb25maWdcblx0ICogaXQgd2lsbCBhdXRvbWF0aWNhbGx5IGJlIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uLCB3aGljaCB3aWxsIHZhbGlkYXRlIGlucHV0XG5cdCAqIGFuZCBhcHBlbmQgaXQgdG8gdGhlIHByZXBhcmVkIHRvb2xzXG5cdCAqIEBwYXJhbSB7Kn0gbW9kdWxlT2JqIGluZm9ybWF0aW9uIHVzZWQgdG8gcHJlcGFyZSB0aGUgcmlnaHQgZHJhd2luZyBtb2R1bGUsIHRoaXMgaW5wdXRcblx0ICogdGhpcyB3aWxsIGNvbnRhaW4gYW4gSUQsIHRoZSBtb2R1bGVLZXkgd2hpY2ggc2hvdWxkIG1hdGNoIGEga2V5IGluIE1PRFVMRVNfSlNPTiwgYW5kXG5cdCAqIGEgY29uZmlnIG9iamVjdC5cblx0ICovXG5cdGNvbnN0IHJlY2VpdmVNb2R1bGUgPSBmdW5jdGlvbiAobW9kdWxlT2JqKSB7XG5cdFx0aWYgKChtb2R1bGVPYmouSUQgJiYgbW9kdWxlT2JqLm1vZHVsZUtleSAmJiBtb2R1bGVPYmouY29uZmlnICYmIG1vZHVsZXNbbW9kdWxlT2JqLm1vZHVsZUtleV0pID09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIk9uZSBvciBtb3JlIHVuZGVmaW5lZCBtb2R1bGUgcHJvcGVydGllcyByZWNlaXZlZCBpbiBOU2NvcmVcIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQgPSBWYWxpZGF0aW9uLm1vZHVsZShtb2R1bGVPYmopO1xuXHRcdFx0aWYgKHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLmxlbmd0aCAhPSAwKSB7XG5cdFx0XHRcdHByZXBhcmVkVG9vbHNbbW9kdWxlT2JqLklEXSA9IG51bGw7XG5cdFx0XHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0LmVycm9ycztcblx0XHRcdH1cblx0XHRcdG1vZHVsZU9iai5jb25maWcgPSB2YWxpZGF0aW9uUmVzdWx0LnBhcnNlZEZpZWxkcztcblx0XHRcdHByZXBhcmVkVG9vbHNbbW9kdWxlT2JqLklEXSA9IHtcblx0XHRcdFx0bW9kdWxlOiBtb2R1bGVzW21vZHVsZU9iai5tb2R1bGVLZXldLFxuXHRcdFx0XHRjb25maWc6IG1vZHVsZU9iai5jb25maWcsXG5cdFx0XHRcdElEOiBtb2R1bGVPYmouSURcblx0XHRcdH07XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIFdoZW4gdGhlIHVzZXIgY2hvb3NlcyBhIHNlcXVlbmNlLCB3ZSB3aWxsIGF1dG9tYXRpY2FsbHkgcGFzcyBpdCB0byB0aGlzIGZ1bmN0aW9uXG5cdCAqIHdoaWNoIHdpbGwgdmFsaWRhdGUgdGhlIGlucHV0LCBhbmQgdGhlbiBkZXBlbmRpbmcgb24gdGhlIGlucHV0IHR5cGUsIGl0IHdpbGwgcHJlcGFyZVxuXHQgKiB0aGUgc2VxdWVuY2UgaW4gc29tZSB3YXkgdG8gZ2V0IGEgc2VxdWVuY2VHZW5lcmF0b3Igb2JqZWN0IHdoaWNoIHdpbGwgYmUgYXBwZW5kZWRcblx0ICogdG8gcHJlcGFyZWRTZXF1ZW5jZXNcblx0ICogQHBhcmFtIHsqfSBzZXFPYmogaW5mb3JtYXRpb24gdXNlZCB0byBwcmVwYXJlIHRoZSByaWdodCBzZXF1ZW5jZSwgdGhpcyB3aWxsIGNvbnRhaW4gYVxuXHQgKiBzZXF1ZW5jZSBJRCwgdGhlIHR5cGUgb2YgaW5wdXQsIGFuZCB0aGUgaW5wdXQgaXRzZWxmIChzZXF1ZW5jZSBuYW1lLCBhIGxpc3QsIGFuIE9FSVMgbnVtYmVyLi5ldGMpLlxuXHQgKi9cblx0Y29uc3QgcmVjZWl2ZVNlcXVlbmNlID0gZnVuY3Rpb24gKHNlcU9iaikge1xuXHRcdGlmICgoc2VxT2JqLklEICYmIHNlcU9iai5pbnB1dFR5cGUgJiYgc2VxT2JqLmlucHV0VmFsdWUgJiYgc2VxT2JqLnBhcmFtZXRlcnMpID09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIk9uZSBvciBtb3JlIHVuZGVmaW5lZCBtb2R1bGUgcHJvcGVydGllcyByZWNlaXZlZCBpbiBOU2NvcmVcIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFdlIHdpbGwgcHJvY2VzcyBkaWZmZXJlbnQgaW5wdXRzIGluIGRpZmZlcmVudCB3YXlzXG5cdFx0XHRpZiAoc2VxT2JqLmlucHV0VHlwZSA9PSBcImJ1aWx0SW5cIikge1xuXHRcdFx0XHR2YWxpZGF0aW9uUmVzdWx0ID0gVmFsaWRhdGlvbi5idWlsdEluKHNlcU9iaik7XG5cdFx0XHRcdGlmICh2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5sZW5ndGggIT0gMCkge1xuXHRcdFx0XHRcdHByZXBhcmVkU2VxdWVuY2VzW3NlcU9iai5JRF0gPSBudWxsO1xuXHRcdFx0XHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0LmVycm9ycztcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zb2xlLmxvZyh2YWxpZGF0aW9uUmVzdWx0KTtcblx0XHRcdFx0c2VxT2JqLnBhcmFtZXRlcnMgPSB2YWxpZGF0aW9uUmVzdWx0LnBhcnNlZEZpZWxkcztcblx0XHRcdFx0Y29uc29sZS5sb2coc2VxT2JqKTtcblx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbc2VxT2JqLklEXSA9IEJ1aWx0SW5OYW1lVG9TZXEoc2VxT2JqLklELCBzZXFPYmouaW5wdXRWYWx1ZSwgc2VxT2JqLnBhcmFtZXRlcnMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJPRUlTXCIpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdCA9IFZhbGlkYXRpb24ub2VpcyhzZXFPYmopO1xuXHRcdFx0XHRpZiAodmFsaWRhdGlvblJlc3VsdC5lcnJvcnMubGVuZ3RoICE9IDApIHtcblx0XHRcdFx0XHRwcmVwYXJlZFNlcXVlbmNlc1tzZXFPYmouSURdID0gbnVsbDtcblx0XHRcdFx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdC5lcnJvcnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbc2VxT2JqLklEXSA9IE9FSVNUb1NlcShzZXFPYmouSUQsIHNlcU9iai5pbnB1dFZhbHVlKTtcblx0XHRcdH1cblx0XHRcdGlmIChzZXFPYmouaW5wdXRUeXBlID09IFwibGlzdFwiKSB7XG5cdFx0XHRcdHZhbGlkYXRpb25SZXN1bHQgPSBWYWxpZGF0aW9uLmxpc3Qoc2VxT2JqKTtcblx0XHRcdFx0aWYgKHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLmxlbmd0aCAhPSAwKSB7XG5cdFx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbc2VxT2JqLklEXSA9IG51bGw7XG5cdFx0XHRcdFx0cmV0dXJuIHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHByZXBhcmVkU2VxdWVuY2VzW3NlcU9iai5JRF0gPSBMaXN0VG9TZXEoc2VxT2JqLklELCBzZXFPYmouaW5wdXRWYWx1ZSk7XG5cblx0XHRcdH1cblx0XHRcdGlmIChzZXFPYmouaW5wdXRUeXBlID09IFwiY29kZVwiKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXHQvKipcblx0ICogV2UgaW5pdGlhbGl6ZSB0aGUgZHJhd2luZyBwcm9jZXNzaW5nLiBGaXJzdCB3ZSBjYWxjdWxhdGUgdGhlIGRpbWVuc2lvbnMgb2YgZWFjaCBza2V0Y2hcblx0ICogdGhlbiB3ZSBwYWlyIHVwIHNlcXVlbmNlcyBhbmQgZHJhd2luZyBtb2R1bGVzLCBhbmQgZmluYWxseSB3ZSBwYXNzIHRoZW0gdG8gZ2VuZXJhdGVQNVxuXHQgKiB3aGljaCBhY3R1YWxseSBpbnN0YW50aWF0ZXMgZHJhd2luZyBtb2R1bGVzIGFuZCBiZWdpbnMgZHJhd2luZy5cblx0ICogXG5cdCAqIEBwYXJhbSB7Kn0gc2VxVml6UGFpcnMgYSBsaXN0IG9mIHBhaXJzIHdoZXJlIGVhY2ggcGFpciBjb250YWlucyBhbiBJRCBvZiBhIHNlcXVlbmNlXG5cdCAqIGFuZCBhbiBJRCBvZiBhIGRyYXdpbmcgdG9vbCwgdGhpcyBsZXRzIHVzIGtub3cgdG8gcGFzcyB3aGljaCBzZXF1ZW5jZSB0byB3aGljaFxuXHQgKiBkcmF3aW5nIHRvb2wuXG5cdCAqL1xuXHRjb25zdCBiZWdpbiA9IGZ1bmN0aW9uIChzZXFWaXpQYWlycykge1xuXHRcdGhpZGVMb2coKTtcblxuXHRcdC8vRmlndXJpbmcgb3V0IGxheW91dFxuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRsZXQgdG90YWxXaWR0aCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXNBcmVhJykub2Zmc2V0V2lkdGg7XG5cdFx0bGV0IHRvdGFsSGVpZ2h0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhc0FyZWEnKS5vZmZzZXRIZWlnaHQ7XG5cdFx0bGV0IGNhbnZhc0NvdW50ID0gc2VxVml6UGFpcnMubGVuZ3RoO1xuXHRcdGxldCBncmlkU2l6ZSA9IE1hdGguY2VpbChNYXRoLnNxcnQoY2FudmFzQ291bnQpKTtcblx0XHRsZXQgaW5kaXZpZHVhbFdpZHRoID0gdG90YWxXaWR0aCAvIGdyaWRTaXplIC0gMjA7XG5cdFx0bGV0IGluZGl2aWR1YWxIZWlnaHQgPSB0b3RhbEhlaWdodCAvIGdyaWRTaXplO1xuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRcdGZvciAobGV0IHBhaXIgb2Ygc2VxVml6UGFpcnMpIHtcblx0XHRcdGxldCBjdXJyZW50U2VxID0gcHJlcGFyZWRTZXF1ZW5jZXNbcGFpcltcInNlcUlEXCJdXTtcblx0XHRcdGxldCBjdXJyZW50VG9vbCA9IHByZXBhcmVkVG9vbHNbcGFpcltcInRvb2xJRFwiXV07XG5cdFx0XHRpZiAoY3VycmVudFNlcSAmJiBjdXJyZW50VG9vbCA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcInVuZGVmaW5lZCBJRCBmb3IgdG9vbCBvciBzZXF1ZW5jZVwiKTtcblx0XHRcdH1cblx0XHRcdGxpdmVTa2V0Y2hlcy5wdXNoKGdlbmVyYXRlUDUoY3VycmVudFRvb2xbJ21vZHVsZSddW1widml6XCJdLCBjdXJyZW50VG9vbFsnY29uZmlnJ10sIGN1cnJlbnRTZXEsIGxpdmVTa2V0Y2hlcy5sZW5ndGgsIGluZGl2aWR1YWxXaWR0aCwgaW5kaXZpZHVhbEhlaWdodCkpO1xuXHRcdH1cblx0fTtcblxuXHRjb25zdCBjbGVhciA9IGZ1bmN0aW9uICgpIHtcblx0XHRzaG93TG9nKCk7XG5cdFx0aWYgKGxpdmVTa2V0Y2hlcy5sZW5ndGggPT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxpdmVTa2V0Y2hlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRsaXZlU2tldGNoZXNbaV0ucmVtb3ZlKCk7IC8vZGVsZXRlIGNhbnZhcyBlbGVtZW50XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdGNvbnN0IHBhdXNlID0gZnVuY3Rpb24gKCkge1xuXHRcdGxpdmVTa2V0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChza2V0Y2gpIHtcblx0XHRcdHNrZXRjaC5ub0xvb3AoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjb25zdCByZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0bGl2ZVNrZXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKHNrZXRjaCkge1xuXHRcdFx0c2tldGNoLmxvb3AoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjb25zdCBzdGVwID0gZnVuY3Rpb24gKCkge1xuXHRcdGxpdmVTa2V0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChza2V0Y2gpIHtcblx0XHRcdHNrZXRjaC5yZWRyYXcoKTtcblx0XHR9KTtcblx0fTtcblxuXHRyZXR1cm4ge1xuXHRcdHJlY2VpdmVTZXF1ZW5jZTogcmVjZWl2ZVNlcXVlbmNlLFxuXHRcdHJlY2VpdmVNb2R1bGU6IHJlY2VpdmVNb2R1bGUsXG5cdFx0bGl2ZVNrZXRjaGVzOiBsaXZlU2tldGNoZXMsXG5cdFx0cHJlcGFyZWRTZXF1ZW5jZXM6IHByZXBhcmVkU2VxdWVuY2VzLFxuXHRcdHByZXBhcmVkVG9vbHM6IHByZXBhcmVkVG9vbHMsXG5cdFx0bW9kdWxlczogbW9kdWxlcyxcblx0XHR2YWxpZE9FSVM6IHZhbGlkT0VJUyxcblx0XHRCdWlsdEluU2VxczogQnVpbHRJblNlcXMsXG5cdFx0YmVnaW46IGJlZ2luLFxuXHRcdHBhdXNlOiBwYXVzZSxcblx0XHRyZXN1bWU6IHJlc3VtZSxcblx0XHRzdGVwOiBzdGVwLFxuXHRcdGNsZWFyOiBjbGVhcixcblx0fTtcbn0oKTtcblxuY29uc3QgVmFsaWRhdGlvbiA9IGZ1bmN0aW9uICgpIHtcblxuXG5cdGNvbnN0IGxpc3RFcnJvciA9IGZ1bmN0aW9uICh0aXRsZSkge1xuXHRcdGxldCBtc2cgPSBcImNhbid0IHBhcnNlIHRoZSBsaXN0LCBwbGVhc2UgcGFzcyBudW1iZXJzIHNlcGVyYXRlZCBieSBjb21tYXMgKGV4YW1wbGU6IDEsMiwzKVwiO1xuXHRcdGlmICh0aXRsZSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdG1zZyA9IHRpdGxlICsgXCI6IFwiICsgbXNnO1xuXHRcdH1cblx0XHRyZXR1cm4gbXNnO1xuXHR9O1xuXG5cdGNvbnN0IHJlcXVpcmVkRXJyb3IgPSBmdW5jdGlvbiAodGl0bGUpIHtcblx0XHRyZXR1cm4gYCR7dGl0bGV9OiB0aGlzIGlzIGEgcmVxdWlyZWQgdmFsdWUsIGRvbid0IGxlYXZlIGl0IGVtcHR5IWA7XG5cdH07XG5cblx0Y29uc3QgdHlwZUVycm9yID0gZnVuY3Rpb24gKHRpdGxlLCB2YWx1ZSwgZXhwZWN0ZWRUeXBlKSB7XG5cdFx0cmV0dXJuIGAke3RpdGxlfTogJHt2YWx1ZX0gaXMgYSAke3R5cGVvZih2YWx1ZSl9LCBleHBlY3RlZCBhICR7ZXhwZWN0ZWRUeXBlfS4gYDtcblx0fTtcblxuXHRjb25zdCBvZWlzRXJyb3IgPSBmdW5jdGlvbiAoY29kZSkge1xuXHRcdHJldHVybiBgJHtjb2RlfTogRWl0aGVyIGFuIGludmFsaWQgT0VJUyBjb2RlIG9yIG5vdCBkZWZpbmVkIGJ5IHNhZ2UhYDtcblx0fTtcblxuXHRjb25zdCBidWlsdEluID0gZnVuY3Rpb24gKHNlcU9iaikge1xuXHRcdGxldCBzY2hlbWEgPSBCdWlsdEluU2Vxc1tzZXFPYmouaW5wdXRWYWx1ZV0ucGFyYW1zU2NoZW1hO1xuXHRcdGxldCByZWNlaXZlZFBhcmFtcyA9IHNlcU9iai5wYXJhbWV0ZXJzO1xuXG5cdFx0bGV0IHZhbGlkYXRpb25SZXN1bHQgPSB7XG5cdFx0XHRwYXJzZWRGaWVsZHM6IHt9LFxuXHRcdFx0ZXJyb3JzOiBbXVxuXHRcdH07XG5cdFx0T2JqZWN0LmtleXMocmVjZWl2ZWRQYXJhbXMpLmZvckVhY2goXG5cdFx0XHQocGFyYW1ldGVyKSA9PiB7XG5cdFx0XHRcdHZhbGlkYXRlRnJvbVNjaGVtYShzY2hlbWEsIHBhcmFtZXRlciwgcmVjZWl2ZWRQYXJhbXNbcGFyYW1ldGVyXSwgdmFsaWRhdGlvblJlc3VsdCk7XG5cdFx0XHR9XG5cdFx0KTtcblx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdDtcblx0fTtcblxuXHRjb25zdCBvZWlzID0gZnVuY3Rpb24gKHNlcU9iaikge1xuXHRcdGxldCB2YWxpZGF0aW9uUmVzdWx0ID0ge1xuXHRcdFx0cGFyc2VkRmllbGRzOiB7fSxcblx0XHRcdGVycm9yczogW11cblx0XHR9O1xuXHRcdHNlcU9iai5pbnB1dFZhbHVlID0gc2VxT2JqLmlucHV0VmFsdWUudHJpbSgpO1xuXHRcdGxldCBvZWlzQ29kZSA9IHNlcU9iai5pbnB1dFZhbHVlO1xuXHRcdGlmICghVkFMSURPRUlTLmluY2x1ZGVzKG9laXNDb2RlKSkge1xuXHRcdFx0dmFsaWRhdGlvblJlc3VsdC5lcnJvcnMucHVzaChvZWlzRXJyb3Iob2Vpc0NvZGUpKTtcblx0XHR9XG5cdFx0cmV0dXJuIHZhbGlkYXRpb25SZXN1bHQ7XG5cdH07XG5cblx0Y29uc3QgbGlzdCA9IGZ1bmN0aW9uIChzZXFPYmopIHtcblx0XHRsZXQgdmFsaWRhdGlvblJlc3VsdCA9IHtcblx0XHRcdHBhcnNlZEZpZWxkczoge30sXG5cdFx0XHRlcnJvcnM6IFtdXG5cdFx0fTtcblx0XHR0cnkge1xuXHRcdFx0c2VxT2JqLmlucHV0VmFsdWUgPSBKU09OLnBhcnNlKHNlcU9iai5pbnB1dFZhbHVlKTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2gobGlzdEVycm9yKCkpO1xuXHRcdH1cblx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdDtcblx0fTtcblxuXHRjb25zdCBfbW9kdWxlID0gZnVuY3Rpb24gKG1vZHVsZU9iaikge1xuXHRcdGxldCBzY2hlbWEgPSBNT0RVTEVTW21vZHVsZU9iai5tb2R1bGVLZXldLmNvbmZpZ1NjaGVtYTtcblx0XHRsZXQgcmVjZWl2ZWRDb25maWcgPSBtb2R1bGVPYmouY29uZmlnO1xuXG5cdFx0bGV0IHZhbGlkYXRpb25SZXN1bHQgPSB7XG5cdFx0XHRwYXJzZWRGaWVsZHM6IHt9LFxuXHRcdFx0ZXJyb3JzOiBbXVxuXHRcdH07XG5cblx0XHRPYmplY3Qua2V5cyhyZWNlaXZlZENvbmZpZykuZm9yRWFjaChcblx0XHRcdChjb25maWdGaWVsZCkgPT4ge1xuXHRcdFx0XHR2YWxpZGF0ZUZyb21TY2hlbWEoc2NoZW1hLCBjb25maWdGaWVsZCwgcmVjZWl2ZWRDb25maWdbY29uZmlnRmllbGRdLCB2YWxpZGF0aW9uUmVzdWx0KTtcblx0XHRcdH1cblx0XHQpO1xuXHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0O1xuXHR9O1xuXG5cdGNvbnN0IHZhbGlkYXRlRnJvbVNjaGVtYSA9IGZ1bmN0aW9uIChzY2hlbWEsIGZpZWxkLCB2YWx1ZSwgdmFsaWRhdGlvblJlc3VsdCkge1xuXHRcdGxldCB0aXRsZSA9IHNjaGVtYVtmaWVsZF0udGl0bGU7XG5cdFx0aWYgKHR5cGVvZiAodmFsdWUpID09IFwic3RyaW5nXCIpIHtcblx0XHRcdHZhbHVlID0gdmFsdWUudHJpbSgpO1xuXHRcdH1cblx0XHRsZXQgZXhwZWN0ZWRUeXBlID0gc2NoZW1hW2ZpZWxkXS50eXBlO1xuXHRcdGxldCByZXF1aXJlZCA9IChzY2hlbWFbZmllbGRdLnJlcXVpcmVkICE9PSB1bmRlZmluZWQpID8gc2NoZW1hW2ZpZWxkXS5yZXF1aXJlZCA6IGZhbHNlO1xuXHRcdGxldCBmb3JtYXQgPSAoc2NoZW1hW2ZpZWxkXS5mb3JtYXQgIT09IHVuZGVmaW5lZCkgPyBzY2hlbWFbZmllbGRdLmZvcm1hdCA6IGZhbHNlO1xuXHRcdGxldCBpc0VtcHR5ID0gKHZhbHVlID09PSAnJyk7XG5cdFx0Y29uc29sZS5sb2codmFsaWRhdGlvblJlc3VsdCk7XG5cdFx0aWYgKHJlcXVpcmVkICYmIGlzRW1wdHkpIHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2gocmVxdWlyZWRFcnJvcih0aXRsZSkpO1xuXHRcdH1cblx0XHRpZiAoaXNFbXB0eSkge1xuXHRcdFx0cGFyc2VkID0gbnVsbDtcblx0XHR9XG5cdFx0aWYgKCFpc0VtcHR5ICYmIChleHBlY3RlZFR5cGUgPT0gXCJudW1iZXJcIikpIHtcblx0XHRcdHBhcnNlZCA9IHBhcnNlSW50KHZhbHVlKTtcblx0XHRcdGlmIChwYXJzZWQgIT0gcGFyc2VkKSB7IC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM0MjYxOTM4L3doYXQtaXMtdGhlLWRpZmZlcmVuY2UtYmV0d2Vlbi1uYW4tbmFuLWFuZC1uYW4tbmFuXG5cdFx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2godHlwZUVycm9yKHRpdGxlLCB2YWx1ZSwgZXhwZWN0ZWRUeXBlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICghaXNFbXB0eSAmJiAoZXhwZWN0ZWRUeXBlID09IFwic3RyaW5nXCIpKSB7XG5cdFx0XHRwYXJzZWQgPSB2YWx1ZTtcblx0XHR9XG5cdFx0aWYgKCFpc0VtcHR5ICYmIChleHBlY3RlZFR5cGUgPT0gXCJib29sZWFuXCIpKSB7XG5cdFx0XHRpZiAodmFsdWUgPT0gJzEnKSB7XG5cdFx0XHRcdHBhcnNlZCA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXJzZWQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKGZvcm1hdCAmJiAoZm9ybWF0ID09IFwibGlzdFwiKSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cGFyc2VkID0gSlNPTi5wYXJzZShcIltcIiArIHZhbHVlICsgXCJdXCIpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2gobGlzdEVycm9yKHRpdGxlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChwYXJzZWQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dmFsaWRhdGlvblJlc3VsdC5wYXJzZWRGaWVsZHNbZmllbGRdID0gcGFyc2VkO1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4ge1xuXHRcdGJ1aWx0SW46IGJ1aWx0SW4sXG5cdFx0b2Vpczogb2Vpcyxcblx0XHRsaXN0OiBsaXN0LFxuXHRcdG1vZHVsZTogX21vZHVsZVxuXHR9O1xufSgpO1xuXG5cblxuY29uc3QgTG9nUGFuZWwgPSBmdW5jdGlvbiAoKSB7XG5cdGxvZ0dyZWVuID0gZnVuY3Rpb24gKGxpbmUpIHtcblx0XHQkKFwiI2lubmVyTG9nQXJlYVwiKS5hcHBlbmQoYDxwIHN0eWxlPVwiY29sb3I6IzAwZmYwMFwiPiR7bGluZX08L3A+PGJyPmApO1xuXHR9O1xuXHRsb2dSZWQgPSBmdW5jdGlvbiAobGluZSkge1xuXHRcdCQoXCIjaW5uZXJMb2dBcmVhXCIpLmFwcGVuZChgPHAgc3R5bGU9XCJjb2xvcjpyZWRcIj4ke2xpbmV9PC9wPjxicj5gKTtcblx0fTtcblx0Y2xlYXJsb2cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0JChcIiNpbm5lckxvZ0FyZWFcIikuZW1wdHkoKTtcblx0fTtcblx0aGlkZUxvZyA9IGZ1bmN0aW9uICgpIHtcblx0XHQkKFwiI2xvZ0FyZWFcIikuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcblx0fTtcblx0c2hvd0xvZyA9IGZ1bmN0aW9uICgpIHtcblx0XHQkKFwiI2xvZ0FyZWFcIikuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG5cdH07XG5cdHJldHVybiB7XG5cdFx0bG9nR3JlZW46IGxvZ0dyZWVuLFxuXHRcdGxvZ1JlZDogbG9nUmVkLFxuXHRcdGNsZWFybG9nOiBjbGVhcmxvZyxcblx0XHRoaWRlTG9nOiBoaWRlTG9nLFxuXHRcdHNob3dMb2c6IHNob3dMb2csXG5cdH07XG59KCk7XG53aW5kb3cuTlNjb3JlID0gTlNjb3JlO1xud2luZG93LkxvZ1BhbmVsID0gTG9nUGFuZWw7IiwiLypcbiAgICB2YXIgbGlzdD1bMiwgMywgNSwgNywgMTEsIDEzLCAxNywgMTksIDIzLCAyOSwgMzEsIDM3LCA0MSwgNDMsIDQ3LCA1MywgNTksIDYxLCA2NywgNzEsIDczLCA3OSwgODMsIDg5LCA5NywgMTAxLCAxMDMsIDEwNywgMTA5LCAxMTMsIDEyNywgMTMxLCAxMzcsIDEzOSwgMTQ5LCAxNTEsIDE1NywgMTYzLCAxNjcsIDE3MywgMTc5LCAxODEsIDE5MSwgMTkzLCAxOTcsIDE5OSwgMjExLCAyMjMsIDIyNywgMjI5LCAyMzMsIDIzOSwgMjQxLCAyNTEsIDI1NywgMjYzLCAyNjksIDI3MSwgMjc3LCAyODEsIDI4MywgMjkzLCAzMDcsIDMxMSwgMzEzLCAzMTcsIDMzMSwgMzM3LCAzNDcsIDM0OSwgMzUzLCAzNTksIDM2NywgMzczLCAzNzksIDM4MywgMzg5LCAzOTcsIDQwMSwgNDA5LCA0MTksIDQyMSwgNDMxLCA0MzMsIDQzOSwgNDQzLCA0NDksIDQ1NywgNDYxLCA0NjMsIDQ2NywgNDc5LCA0ODcsIDQ5MSwgNDk5LCA1MDMsIDUwOSwgNTIxLCA1MjMsIDU0MSwgNTQ3LCA1NTcsIDU2MywgNTY5LCA1NzEsIDU3NywgNTg3LCA1OTMsIDU5OSwgNjAxLCA2MDcsIDYxMywgNjE3LCA2MTksIDYzMSwgNjQxLCA2NDMsIDY0NywgNjUzLCA2NTksIDY2MSwgNjczLCA2NzcsIDY4MywgNjkxLCA3MDEsIDcwOSwgNzE5LCA3MjcsIDczMywgNzM5LCA3NDMsIDc1MSwgNzU3LCA3NjEsIDc2OSwgNzczLCA3ODcsIDc5NywgODA5LCA4MTEsIDgyMSwgODIzLCA4MjcsIDgyOSwgODM5LCA4NTMsIDg1NywgODU5LCA4NjMsIDg3NywgODgxLCA4ODMsIDg4NywgOTA3LCA5MTEsIDkxOSwgOTI5LCA5MzcsIDk0MSwgOTQ3LCA5NTMsIDk2NywgOTcxLCA5NzcsIDk4MywgOTkxLCA5OTcsIDEwMDksIDEwMTMsIDEwMTksIDEwMjEsIDEwMzEsIDEwMzMsIDEwMzksIDEwNDksIDEwNTEsIDEwNjEsIDEwNjMsIDEwNjksIDEwODcsIDEwOTEsIDEwOTMsIDEwOTcsIDExMDMsIDExMDksIDExMTcsIDExMjMsIDExMjksIDExNTEsIDExNTMsIDExNjMsIDExNzEsIDExODEsIDExODcsIDExOTMsIDEyMDEsIDEyMTMsIDEyMTcsIDEyMjNdO1xuXG4qL1xuXG5jbGFzcyBWSVpfRGlmZmVyZW5jZXMge1xuXHRjb25zdHJ1Y3RvcihzZXEsIHNrZXRjaCwgY29uZmlnKSB7XG5cblx0XHR0aGlzLm4gPSBjb25maWcubjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbiBpcyBudW1iZXIgb2YgdGVybXMgb2YgdG9wIHNlcXVlbmNlXG5cdFx0dGhpcy5sZXZlbHMgPSBjb25maWcuTGV2ZWxzOyAgICAgICAgICAgICAgICAgICAgICAgICAvL2xldmVscyBpcyBudW1iZXIgb2YgbGF5ZXJzIG9mIHRoZSBweXJhbWlkL3RyYXBlem9pZCBjcmVhdGVkIGJ5IHdyaXRpbmcgdGhlIGRpZmZlcmVuY2VzLlxuXHRcdHRoaXMuc2VxID0gc2VxO1xuXHRcdHRoaXMuc2tldGNoID0gc2tldGNoO1xuXHR9XG5cblx0ZHJhd0RpZmZlcmVuY2VzKG4sIGxldmVscywgc2VxdWVuY2UpIHtcblxuXHRcdC8vY2hhbmdlZCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGdyZXkgc2luY2UgeW91IGNhbid0IHNlZSB3aGF0J3MgZ29pbmcgb25cblx0XHR0aGlzLnNrZXRjaC5iYWNrZ3JvdW5kKCAnYmxhY2snIClcblxuXHRcdG4gPSBNYXRoLm1pbihuLCBzZXF1ZW5jZS5sZW5ndGgpO1xuXHRcdGxldmVscyA9IE1hdGgubWluKGxldmVscywgbiAtIDEpO1xuXHRcdGxldCBmb250LCBmb250U2l6ZSA9IDIwO1xuXHRcdHRoaXMuc2tldGNoLnRleHRGb250KFwiQXJpYWxcIik7XG5cdFx0dGhpcy5za2V0Y2gudGV4dFNpemUoZm9udFNpemUpO1xuXHRcdHRoaXMuc2tldGNoLnRleHRTdHlsZSh0aGlzLnNrZXRjaC5CT0xEKVxuXHRcdGxldCB4RGVsdGEgPSA1MDtcblx0XHRsZXQgeURlbHRhID0gNTA7XG5cdFx0bGV0IGZpcnN0WCA9IDMwO1xuXHRcdGxldCBmaXJzdFkgPSAzMDtcblx0XHR0aGlzLnNrZXRjaC5jb2xvck1vZGUodGhpcy5za2V0Y2guSFNCLCAyNTUpO1xuXHRcdGxldCBteUNvbG9yID0gdGhpcy5za2V0Y2guY29sb3IoMTAwLCAyNTUsIDE1MCk7XG5cdFx0bGV0IGh1ZTtcblx0XHRcblx0XHRsZXQgd29ya2luZ1NlcXVlbmNlID0gW107XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubjsgaSsrKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImluXCIpXG5cdFx0XHR3b3JraW5nU2VxdWVuY2UucHVzaChzZXF1ZW5jZS5nZXRFbGVtZW50KGkpKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3dvcmtpbmdTZXF1ZW5jZSBjYW5uaWJhbGl6ZXMgZmlyc3QgbiBlbGVtZW50cyBvZiBzZXF1ZW5jZS5cblx0XHR9XG5cblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZXZlbHM7IGkrKykge1xuXHRcdFx0aHVlID0gKGkgKiAyNTUgLyA2KSAlIDI1NTtcblx0XHRcdG15Q29sb3IgPSB0aGlzLnNrZXRjaC5jb2xvcihodWUsIDE1MCwgMjAwKTtcblx0XHRcdHRoaXMuc2tldGNoLmZpbGwobXlDb2xvcik7XG5cdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHdvcmtpbmdTZXF1ZW5jZS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHR0aGlzLnNrZXRjaC50ZXh0KHdvcmtpbmdTZXF1ZW5jZVtqXSwgZmlyc3RYICsgaiAqIHhEZWx0YSwgZmlyc3RZICsgaSAqIHlEZWx0YSk7ICAgICAgICAgLy9EcmF3cyBhbmQgdXBkYXRlcyB3b3JraW5nU2VxdWVuY2Ugc2ltdWx0YW5lb3VzbHkuXG5cdFx0XHRcdGlmIChqIDwgd29ya2luZ1NlcXVlbmNlLmxlbmd0aCAtIDEpIHtcblx0XHRcdFx0XHR3b3JraW5nU2VxdWVuY2Vbal0gPSB3b3JraW5nU2VxdWVuY2VbaiArIDFdIC0gd29ya2luZ1NlcXVlbmNlW2pdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHdvcmtpbmdTZXF1ZW5jZS5sZW5ndGggPSB3b3JraW5nU2VxdWVuY2UubGVuZ3RoIC0gMTsgICAgICAgICAgICAgICAgICAgICAgLy9SZW1vdmVzIGxhc3QgZWxlbWVudC5cblx0XHRcdGZpcnN0WCA9IGZpcnN0WCArICgxIC8gMikgKiB4RGVsdGE7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vTW92ZXMgbGluZSBmb3J3YXJkIGhhbGYgZm9yIHB5cmFtaWQgc2hhcGUuXG5cblx0XHR9XG5cblx0fVxuXG5cdHNldHVwKCkge1xuXHR9XG5cdGRyYXcoKSB7XG5cdFx0dGhpcy5kcmF3RGlmZmVyZW5jZXModGhpcy5uLCB0aGlzLmxldmVscywgdGhpcy5zZXEpO1xuXHRcdHRoaXMuc2tldGNoLm5vTG9vcCgpO1xuXHR9XG59XG5cblxuXG5jb25zdCBTQ0hFTUFfRGlmZmVyZW5jZXMgPSB7XG5cdG46IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ04nLFxuXHRcdGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIGVsZW1lbnRzJyxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRMZXZlbHM6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ0xldmVscycsXG5cdFx0ZGVzY3JpcHRpb246ICdOdW1iZXIgb2YgbGV2ZWxzJyxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxufVxuXG5jb25zdCBNT0RVTEVfRGlmZmVyZW5jZXMgPSB7XG5cdHZpejogVklaX0RpZmZlcmVuY2VzLFxuXHRuYW1lOiBcIkRpZmZlcmVuY2VzXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRjb25maWdTY2hlbWE6IFNDSEVNQV9EaWZmZXJlbmNlc1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFX0RpZmZlcmVuY2VzIiwiXG5cbi8vQW4gZXhhbXBsZSBtb2R1bGVcblxuXG5jbGFzcyBWSVpfTW9kRmlsbCB7XG5cdGNvbnN0cnVjdG9yKHNlcSwgc2tldGNoLCBjb25maWcpIHtcblx0XHR0aGlzLnNrZXRjaCA9IHNrZXRjaFxuXHRcdHRoaXMuc2VxID0gc2VxXG4gICAgICAgIHRoaXMubW9kRGltZW5zaW9uID0gY29uZmlnLm1vZERpbWVuc2lvblxuXHRcdHRoaXMuaSA9IDA7XG5cdH1cblxuXHRkcmF3TmV3KG51bSwgc2VxKSB7XG5cdFx0bGV0IGJsYWNrID0gdGhpcy5za2V0Y2guY29sb3IoMCk7XG5cdFx0dGhpcy5za2V0Y2guZmlsbChibGFjayk7XG5cdFx0bGV0IGk7XG5cdFx0bGV0IGo7XG5cdFx0Zm9yIChsZXQgbW9kID0gMTsgbW9kIDw9IHRoaXMubW9kRGltZW5zaW9uOyBtb2QrKykge1xuXHRcdFx0aSA9IHNlcS5nZXRFbGVtZW50KG51bSkgJSBtb2Q7XG5cdFx0XHRqID0gbW9kIC0gMTtcblx0XHRcdHRoaXMuc2tldGNoLnJlY3QoaiAqIHRoaXMucmVjdFdpZHRoLCB0aGlzLnNrZXRjaC5oZWlnaHQgLSAoaSArIDEpICogdGhpcy5yZWN0SGVpZ2h0LCB0aGlzLnJlY3RXaWR0aCwgdGhpcy5yZWN0SGVpZ2h0KTtcblx0XHR9XG5cblx0fVxuXG5cdHNldHVwKCkge1xuXHRcdHRoaXMucmVjdFdpZHRoID0gdGhpcy5za2V0Y2gud2lkdGggLyB0aGlzLm1vZERpbWVuc2lvbjtcblx0XHR0aGlzLnJlY3RIZWlnaHQgPSB0aGlzLnNrZXRjaC5oZWlnaHQgLyB0aGlzLm1vZERpbWVuc2lvbjtcblx0XHR0aGlzLnNrZXRjaC5ub1N0cm9rZSgpO1xuXHR9XG5cblx0ZHJhdygpIHtcblx0XHR0aGlzLmRyYXdOZXcodGhpcy5pLCB0aGlzLnNlcSk7XG5cdFx0dGhpcy5pKys7XG5cdFx0aWYgKGkgPT0gMTAwMCkge1xuXHRcdFx0dGhpcy5za2V0Y2gubm9Mb29wKCk7XG5cdFx0fVxuXHR9XG5cbn1cblxuY29uc3QgU0NIRU1BX01vZEZpbGwgPSB7XG4gICAgbW9kRGltZW5zaW9uOiB7XG4gICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXG4gICAgICAgIHRpdGxlOiBcIk1vZCBkaW1lbnNpb25cIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiXCIsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgfVxufVxuXG5cbmNvbnN0IE1PRFVMRV9Nb2RGaWxsID0ge1xuXHR2aXo6IFZJWl9Nb2RGaWxsLFxuXHRuYW1lOiBcIk1vZCBGaWxsXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRjb25maWdTY2hlbWE6IFNDSEVNQV9Nb2RGaWxsXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFX01vZEZpbGwiLCJjbGFzcyBWSVpfc2hpZnRDb21wYXJle1xuXHRjb25zdHJ1Y3RvcihzZXEsIHNrZXRjaCwgY29uZmlnKXtcblx0ICAgIC8vU2tldGNoIGlzIHlvdXIgY2FudmFzXG5cdCAgICAvL2NvbmZpZyBpcyB0aGUgcGFyYW1ldGVycyB5b3UgZXhwZWN0XG5cdCAgICAvL3NlcSBpcyB0aGUgc2VxdWVuY2UgeW91IGFyZSBkcmF3aW5nXG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2g7XG5cdFx0dGhpcy5zZXEgPSBzZXE7XG5cdFx0dGhpcy5NT0QgPSAyXG5cdFx0Ly8gU2V0IHVwIHRoZSBpbWFnZSBvbmNlLlxuXHR9XG5cblx0XG5cdHNldHVwKCkge1xuXHRcdGNvbnNvbGUubG9nKHRoaXMuc2tldGNoLmhlaWdodCwgdGhpcy5za2V0Y2gud2lkdGgpO1xuXHRcdHRoaXMuaW1nID0gdGhpcy5za2V0Y2guY3JlYXRlSW1hZ2UodGhpcy5za2V0Y2gud2lkdGgsIHRoaXMuc2tldGNoLmhlaWdodCk7XG5cdFx0dGhpcy5pbWcubG9hZFBpeGVscygpOyAvLyBFbmFibGVzIHBpeGVsLWxldmVsIGVkaXRpbmcuXG5cdH1cblxuXHRjbGlwKGEsIG1pbiwgbWF4KVxuXHR7XG5cdCAgICBpZiAoYSA8IG1pbilcblx0XHR7XG5cdFx0XHRyZXR1cm4gbWluO1xuXHRcdH1cblx0XHRlbHNlIGlmIChhID4gbWF4KVxuXHRcdHtcblx0XHQgICAgcmV0dXJuIG1heDtcblx0XHR9XG5cdFx0cmV0dXJuIGE7XG5cdH1cblx0XG5cblx0ZHJhdygpe1x0XHQvL1RoaXMgd2lsbCBiZSBjYWxsZWQgZXZlcnl0aW1lIHRvIGRyYXdcblx0ICAgIC8vIEVuc3VyZSBtb3VzZSBjb29yZGluYXRlcyBhcmUgc2FuZS5cblx0XHQvLyBNb3VzZSBjb29yZGluYXRlcyBsb29rIHRoZXkncmUgZmxvYXRzIGJ5IGRlZmF1bHQuXG5cdFx0XG5cdFx0bGV0IGQgPSB0aGlzLnNrZXRjaC5waXhlbERlbnNpdHkoKVxuXHRcdGxldCBteCA9IHRoaXMuY2xpcChNYXRoLnJvdW5kKHRoaXMuc2tldGNoLm1vdXNlWCksIDAsIHRoaXMuc2tldGNoLndpZHRoKTtcblx0XHRsZXQgbXkgPSB0aGlzLmNsaXAoTWF0aC5yb3VuZCh0aGlzLnNrZXRjaC5tb3VzZVkpLCAwLCB0aGlzLnNrZXRjaC5oZWlnaHQpO1xuXHRcdGlmICh0aGlzLnNrZXRjaC5rZXkgPT0gJ0Fycm93VXAnKSB7XG5cdFx0XHR0aGlzLk1PRCArPSAxXG5cdFx0XHR0aGlzLnNrZXRjaC5rZXkgPSBudWxsXG5cdFx0XHRjb25zb2xlLmxvZyhcIlVQIFBSRVNTRUQsIE5FVyBNT0Q6IFwiICsgdGhpcy5NT0QpXG5cdFx0fVxuXHRcdGVsc2UgaWYodGhpcy5za2V0Y2gua2V5ID09ICdBcnJvd0Rvd24nKXtcblx0XHRcdHRoaXMuTU9EIC09IDFcblx0XHRcdHRoaXMuc2tldGNoLmtleSA9IG51bGxcblx0XHRcdGNvbnNvbGUubG9nKFwiRE9XTiBQUkVTU0VELCBORVcgTU9EOiBcIiArIHRoaXMuTU9EKVxuXHRcdH1cblx0XHRlbHNlIGlmKHRoaXMuc2tldGNoLmtleSA9PSAnQXJyb3dSaWdodCcpe1xuXHRcdFx0Y29uc29sZS5sb2coY29uc29sZS5sb2coXCJNWDogXCIgKyBteCArIFwiIE1ZOiBcIiArIG15KSlcblx0XHR9XG5cdFx0Ly8gV3JpdGUgdG8gaW1hZ2UsIHRoZW4gdG8gc2NyZWVuIGZvciBzcGVlZC5cbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLnNrZXRjaC53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHRoaXMuc2tldGNoLmhlaWdodDsgeSsrKSB7XG5cdFx0XHRcdGZvciggbGV0IGkgPSAwOyBpIDwgZDsgaSArKyl7XG5cdFx0XHRcdFx0Zm9yKCBsZXQgaiA9IDA7IGogPCBkOyBqKyspe1xuXHRcdFx0XHRcdFx0bGV0IGluZGV4ID0gNCAqICgoeSAqIGQgKyBqKSAqIHRoaXMuc2tldGNoLndpZHRoICogZCArICh4ICogZCArIGkpKTtcblx0XHRcdFx0XHRcdGlmICh0aGlzLnNlcS5nZXRFbGVtZW50KHgpICUgKHRoaXMuTU9EKSA9PSB0aGlzLnNlcS5nZXRFbGVtZW50KHkpICUgKHRoaXMuTU9EKSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXhdID0gMjU1O1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAxXSA9IDI1NTtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgMl0gPSAyNTU7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDNdID0gMjU1O1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4XSA9IDA7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDFdID0gMDtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgMl0gPSAwO1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAzXSA9IDI1NTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cbiAgICAgICAgICAgIH1cblx0XHR9XG4gICAgICAgIFxuICAgICAgICB0aGlzLmltZy51cGRhdGVQaXhlbHMoKTsgLy8gQ29waWVzIG91ciBlZGl0ZWQgcGl4ZWxzIHRvIHRoZSBpbWFnZS5cbiAgICAgICAgXG4gICAgICAgIHRoaXMuc2tldGNoLmltYWdlKHRoaXMuaW1nLCAwLCAwKTsgLy8gRGlzcGxheSBpbWFnZSB0byBzY3JlZW4udGhpcy5za2V0Y2gubGluZSg1MCw1MCwxMDAsMTAwKTtcblx0fVxufVxuXG5cbmNvbnN0IE1PRFVMRV9TaGlmdENvbXBhcmUgPSB7XG5cdHZpejogVklaX3NoaWZ0Q29tcGFyZSxcblx0bmFtZTogXCJTaGlmdCBDb21wYXJlXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRjb25maWdTY2hlbWE6IHt9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFX1NoaWZ0Q29tcGFyZTsiLCJjbGFzcyBWSVpfVHVydGxlIHtcblx0Y29uc3RydWN0b3Ioc2VxLCBza2V0Y2gsIGNvbmZpZykge1xuXHRcdHZhciBkb21haW4gPSBjb25maWdbJ2RvbWFpbiddXG5cdFx0dmFyIHJhbmdlID0gY29uZmlnWydyYW5nZSddXG5cdFx0dGhpcy5yb3RNYXAgPSB7fVxuXHRcdGZvcihsZXQgaSA9IDA7IGkgPCBkb21haW4ubGVuZ3RoOyBpKyspe1xuXHRcdFx0dGhpcy5yb3RNYXBbZG9tYWluW2ldXSA9IChNYXRoLlBJLzE4MCkqcmFuZ2VbaV1cblx0XHR9XG5cdFx0dGhpcy5zdGVwU2l6ZSA9IGNvbmZpZy5zdGVwU2l6ZTtcblx0XHR0aGlzLmJnQ29sb3IgPSBjb25maWcuYmdDb2xvcjtcblx0XHR0aGlzLnN0cm9rZUNvbG9yID0gY29uZmlnLnN0cm9rZUNvbG9yO1xuXHRcdHRoaXMuc3Ryb2tlV2lkdGggPSBjb25maWcuc3Ryb2tlV2VpZ2h0XG5cdFx0dGhpcy5zZXEgPSBzZXE7XG5cdFx0dGhpcy5jdXJyZW50SW5kZXggPSAwO1xuXHRcdHRoaXMub3JpZW50YXRpb24gPSAwO1xuXHRcdHRoaXMuc2tldGNoID0gc2tldGNoO1xuXHRcdGlmKGNvbmZpZy5zdGFydGluZ1ggIT0gXCJcIil7XG5cdFx0XHR0aGlzLlggPSBjb25maWcuc3RhcnRpbmdYXG5cdFx0XHR0aGlzLlkgPSBjb25maWcuc3RhcnRpbmdZXG5cdFx0fVxuXHRcdGVsc2V7XG5cdFx0XHR0aGlzLlggPSBudWxsO1xuXHRcdFx0dGhpcy5ZID0gbnVsbDtcblx0XHR9XG5cblx0fVxuXHRzdGVwRHJhdygpIHtcblx0XHRsZXQgb2xkWCA9IHRoaXMuWDtcblx0XHRsZXQgb2xkWSA9IHRoaXMuWTtcblx0XHRsZXQgY3VyckVsZW1lbnQgPSB0aGlzLnNlcS5nZXRFbGVtZW50KHRoaXMuY3VycmVudEluZGV4KyspO1xuXHRcdGxldCBhbmdsZSA9IHRoaXMucm90TWFwWyBjdXJyRWxlbWVudCBdO1xuXHRcdGlmKGFuZ2xlID09IHVuZGVmaW5lZCl7XG5cdFx0XHR0aHJvdyAoJ2FuZ2xlIHVuZGVmaW5lZCBmb3IgZWxlbWVudDogJyArIGN1cnJFbGVtZW50KVxuXHRcdH1cblx0XHR0aGlzLm9yaWVudGF0aW9uID0gKHRoaXMub3JpZW50YXRpb24gKyBhbmdsZSk7XG5cdFx0dGhpcy5YICs9IHRoaXMuc3RlcFNpemUgKiBNYXRoLmNvcyh0aGlzLm9yaWVudGF0aW9uKTtcblx0XHR0aGlzLlkgKz0gdGhpcy5zdGVwU2l6ZSAqIE1hdGguc2luKHRoaXMub3JpZW50YXRpb24pO1xuXHRcdHRoaXMuc2tldGNoLmxpbmUob2xkWCwgb2xkWSwgdGhpcy5YLCB0aGlzLlkpO1xuXHR9XG5cdHNldHVwKCkge1xuXHRcdHRoaXMuWCA9IHRoaXMuc2tldGNoLndpZHRoIC8gMjtcblx0XHR0aGlzLlkgPSB0aGlzLnNrZXRjaC5oZWlnaHQgLyAyO1xuXHRcdHRoaXMuc2tldGNoLmJhY2tncm91bmQodGhpcy5iZ0NvbG9yKTtcblx0XHR0aGlzLnNrZXRjaC5zdHJva2UodGhpcy5zdHJva2VDb2xvcik7XG5cdFx0dGhpcy5za2V0Y2guc3Ryb2tlV2VpZ2h0KHRoaXMuc3Ryb2tlV2lkdGgpXG5cdH1cblx0ZHJhdygpIHtcblx0XHR0aGlzLnN0ZXBEcmF3KCk7XG5cdH1cbn1cblxuXG5jb25zdCBTQ0hFTUFfVHVydGxlID0ge1xuXHRkb21haW46IHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR0aXRsZTogJ1NlcXVlbmNlIERvbWFpbicsXG5cdFx0ZGVzY3JpcHRpb246ICdDb21tYSBzZXBlcmF0ZWQgbnVtYmVycycsXG5cdFx0Zm9ybWF0OidsaXN0Jyxcblx0XHRkZWZhdWx0OiBcIjAsMSwyLDMsNFwiLFxuXHRcdHJlcXVpcmVkOiB0cnVlXG5cdH0sXG5cdHJhbmdlOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdBbmdsZXMnLFxuXHRcdGRlZmF1bHQ6IFwiMzAsNDUsNjAsOTAsMTIwXCIsXG5cdFx0Zm9ybWF0OidsaXN0Jyxcblx0XHRkZXNjcmlwdGlvbjogJ0NvbW1hIHNlcGVyYXRlZCBudW1iZXJzJyxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRzdGVwU2l6ZToge1xuXHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdHRpdGxlOiAnU3RlcCBTaXplJyxcblx0XHRkZWZhdWx0OiAyMCxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRzdHJva2VXZWlnaHQ6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ1N0cm9rZSBXaWR0aCcsXG5cdFx0ZGVmYXVsdDogNSxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRzdGFydGluZ1g6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRlOiAnWCBzdGFydCdcblx0fSxcblx0c3RhcnRpbmdZOiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0ZTogJ1kgc3RhcnQnXG5cdH0sXG5cdGJnQ29sb3I6IHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR0aXRsZTogJ0JhY2tncm91bmQgQ29sb3InLFxuXHRcdGZvcm1hdDogJ2NvbG9yJyxcblx0XHRkZWZhdWx0OiBcIiM2NjY2NjZcIixcblx0XHRyZXF1aXJlZDogZmFsc2Vcblx0fSxcblx0c3Ryb2tlQ29sb3I6IHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR0aXRsZTogJ1N0cm9rZSBDb2xvcicsXG5cdFx0Zm9ybWF0OiAnY29sb3InLFxuXHRcdGRlZmF1bHQ6ICcjZmYwMDAwJyxcblx0XHRyZXF1aXJlZDogZmFsc2Vcblx0fSxcblx0dGVzdFRoaW5nOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdoZWxsbycsXG5cdFx0Zm9yYW10OiAnbGlzdCdcblx0fVxufVxuXG5jb25zdCBNT0RVTEVfVHVydGxlID0ge1xuXHR2aXo6IFZJWl9UdXJ0bGUsXG5cdG5hbWU6IFwiVHVydGxlXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRjb25maWdTY2hlbWE6IFNDSEVNQV9UdXJ0bGVcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9UdXJ0bGUiLCIvL0FkZCBhbiBpbXBvcnQgbGluZSBoZXJlIGZvciBuZXcgbW9kdWxlc1xuXG5cbi8vQWRkIG5ldyBtb2R1bGVzIHRvIHRoaXMgY29uc3RhbnQuXG5jb25zdCBNT0RVTEVTID0ge31cblxubW9kdWxlLmV4cG9ydHMgPSBNT0RVTEVTXG5cbk1PRFVMRVNbXCJUdXJ0bGVcIl0gPSByZXF1aXJlKCcuL21vZHVsZVR1cnRsZS5qcycpXG5NT0RVTEVTW1wiU2hpZnRDb21wYXJlXCJdID0gcmVxdWlyZSgnLi9tb2R1bGVTaGlmdENvbXBhcmUuanMnKVxuTU9EVUxFU1tcIkRpZmZlcmVuY2VzXCJdID0gcmVxdWlyZSgnLi9tb2R1bGVEaWZmZXJlbmNlcy5qcycpXG5NT0RVTEVTW1wiTW9kRmlsbFwiXSA9IHJlcXVpcmUoJy4vbW9kdWxlTW9kRmlsbC5qcycpIiwiXG5TRVFfbGluZWFyUmVjdXJyZW5jZSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VMaW5SZWMuanMnKTtcblxuZnVuY3Rpb24gR0VOX2ZpYm9uYWNjaSh7XG4gICAgbVxufSkge1xuICAgIHJldHVybiBTRVFfbGluZWFyUmVjdXJyZW5jZS5nZW5lcmF0b3Ioe1xuICAgICAgICBjb2VmZmljaWVudExpc3Q6IFsxLCAxXSxcbiAgICAgICAgc2VlZExpc3Q6IFsxLCAxXSxcbiAgICAgICAgbVxuICAgIH0pO1xufVxuXG5jb25zdCBTQ0hFTUFfRmlib25hY2NpPSB7XG4gICAgbToge1xuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgdGl0bGU6ICdNb2QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0EgbnVtYmVyIHRvIG1vZCB0aGUgc2VxdWVuY2UgYnkgYnknLFxuICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICB9XG59O1xuXG5cbmNvbnN0IFNFUV9maWJvbmFjY2kgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fZmlib25hY2NpLFxuXHRuYW1lOiBcIkZpYm9uYWNjaVwiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfRmlib25hY2NpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNFUV9maWJvbmFjY2k7IiwiXG5cbmZ1bmN0aW9uIEdFTl9saW5lYXJSZWN1cnJlbmNlKHtcbiAgICBjb2VmZmljaWVudExpc3QsXG4gICAgc2VlZExpc3QsXG4gICAgbVxufSkge1xuICAgIGlmIChjb2VmZmljaWVudExpc3QubGVuZ3RoICE9IHNlZWRMaXN0Lmxlbmd0aCkge1xuICAgICAgICAvL051bWJlciBvZiBzZWVkcyBzaG91bGQgbWF0Y2ggdGhlIG51bWJlciBvZiBjb2VmZmljaWVudHNcbiAgICAgICAgY29uc29sZS5sb2coXCJudW1iZXIgb2YgY29lZmZpY2llbnRzIG5vdCBlcXVhbCB0byBudW1iZXIgb2Ygc2VlZHMgXCIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbGV0IGsgPSBjb2VmZmljaWVudExpc3QubGVuZ3RoO1xuICAgIGlmIChtICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb2VmZmljaWVudExpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvZWZmaWNpZW50TGlzdFtpXSA9IGNvZWZmaWNpZW50TGlzdFtpXSAlIG07XG4gICAgICAgICAgICBzZWVkTGlzdFtpXSA9IHNlZWRMaXN0W2ldICUgbTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJpY0xpblJlYyA9IGZ1bmN0aW9uIChuLCBjYWNoZSkge1xuICAgICAgICAgICAgaWYoIG4gPCBzZWVkTGlzdC5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGNhY2hlW25dID0gc2VlZExpc3Rbbl1cbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVbbl0gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gY2FjaGUubGVuZ3RoOyBpIDw9IG47IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1bSArPSBjYWNoZVtpIC0gaiAtIDFdICogY29lZmZpY2llbnRMaXN0W2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWNoZVtpXSA9IHN1bSAlIG07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVbbl07XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZ2VuZXJpY0xpblJlYyA9IGZ1bmN0aW9uIChuLCBjYWNoZSkge1xuICAgICAgICAgICAgaWYoIG4gPCBzZWVkTGlzdC5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGNhY2hlW25dID0gc2VlZExpc3Rbbl1cbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVbbl0gXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBjYWNoZS5sZW5ndGg7IGkgPD0gbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtICs9IGNhY2hlW2kgLSBqIC0gMV0gKiBjb2VmZmljaWVudExpc3Rbal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhY2hlW2ldID0gc3VtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlW25dO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBnZW5lcmljTGluUmVjXG59XG5cbmNvbnN0IFNDSEVNQV9saW5lYXJSZWN1cnJlbmNlID0ge1xuICAgIGNvZWZmaWNpZW50TGlzdDoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgdGl0bGU6ICdDb2VmZmljaWVudHMgbGlzdCcsXG4gICAgICAgIGZvcm1hdDonbGlzdCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tbWEgc2VwZXJhdGVkIG51bWJlcnMnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgIH0sXG4gICAgc2VlZExpc3Q6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIHRpdGxlOiAnU2VlZCBsaXN0JyxcbiAgICAgICAgZm9ybWF0OidsaXN0JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDb21tYSBzZXBlcmF0ZWQgbnVtYmVycycsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgfSxcbiAgICBtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICB0aXRsZTogJ01vZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBudW1iZXIgdG8gbW9kIHRoZSBzZXF1ZW5jZSBieSBieScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn1cblxuXG5jb25zdCBTRVFfbGluZWFyUmVjdXJyZW5jZSA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9saW5lYXJSZWN1cnJlbmNlLFxuXHRuYW1lOiBcIkxpbmVhciBSZWN1cnJlbmNlXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRwYXJhbXNTY2hlbWE6IFNDSEVNQV9saW5lYXJSZWN1cnJlbmNlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX2xpbmVhclJlY3VycmVuY2UiLCJcbmNvbnN0IFNFUV9saW5lYXJSZWN1cnJlbmNlID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUxpblJlYy5qcycpXG5cbmZ1bmN0aW9uIEdFTl9MdWNhcyh7XG4gICAgbVxufSkge1xuICAgIHJldHVybiBTRVFfbGluZWFyUmVjdXJyZW5jZS5nZW5lcmF0b3Ioe1xuICAgICAgICBjb2VmZmljaWVudExpc3Q6IFsxLCAxXSxcbiAgICAgICAgc2VlZExpc3Q6IFsyLCAxXSxcbiAgICAgICAgbVxuICAgIH0pO1xufVxuXG5jb25zdCBTQ0hFTUFfTHVjYXM9IHtcbiAgICBtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICB0aXRsZTogJ01vZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBudW1iZXIgdG8gbW9kIHRoZSBzZXF1ZW5jZSBieSBieScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn1cblxuXG5jb25zdCBTRVFfTHVjYXMgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fTHVjYXMsXG5cdG5hbWU6IFwiTHVjYXNcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdHBhcmFtc1NjaGVtYTogU0NIRU1BX0x1Y2FzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX0x1Y2FzIiwiXG5cbmZ1bmN0aW9uIEdFTl9OYXR1cmFscyh7XG4gICAgaW5jbHVkZXplcm9cbn0pe1xuICAgIGlmKGluY2x1ZGV6ZXJvKXtcbiAgICAgICAgcmV0dXJuICggKG4pID0+IG4gKVxuICAgIH1cbiAgICBlbHNle1xuICAgICAgICByZXR1cm4gKCAobikgPT4gbiArIDEgKVxuICAgIH1cbn1cblxuY29uc3QgU0NIRU1BX05hdHVyYWxzPSB7XG4gICAgaW5jbHVkZXplcm86IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICB0aXRsZTogJ0luY2x1ZGUgemVybycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcbiAgICAgICAgZGVmYXVsdDogJ2ZhbHNlJyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufVxuXG5cbmNvbnN0IFNFUV9OYXR1cmFscyA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9OYXR1cmFscyxcblx0bmFtZTogXCJOYXR1cmFsc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfTmF0dXJhbHNcbn1cblxuLy8gZXhwb3J0IGRlZmF1bHQgU0VRX05hdHVyYWxzXG5tb2R1bGUuZXhwb3J0cyA9IFNFUV9OYXR1cmFscyIsIlxuXG5mdW5jdGlvbiBHRU5fUHJpbWVzKCkge1xuICAgIGNvbnN0IHByaW1lcyA9IGZ1bmN0aW9uIChuLCBjYWNoZSkge1xuICAgICAgICBpZihjYWNoZS5sZW5ndGggPT0gMCl7XG4gICAgICAgICAgICBjYWNoZS5wdXNoKDIpXG4gICAgICAgICAgICBjYWNoZS5wdXNoKDMpXG4gICAgICAgICAgICBjYWNoZS5wdXNoKDUpXG4gICAgICAgIH1cbiAgICAgICAgbGV0IGkgPSBjYWNoZVtjYWNoZS5sZW5ndGggLSAxXSArIDFcbiAgICAgICAgbGV0IGsgPSAwXG4gICAgICAgIHdoaWxlIChjYWNoZS5sZW5ndGggPD0gbikge1xuICAgICAgICAgICAgbGV0IGlzUHJpbWUgPSB0cnVlXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNhY2hlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgJSBjYWNoZVtqXSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJpbWUgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc1ByaW1lKSB7XG4gICAgICAgICAgICAgICAgY2FjaGUucHVzaChpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWNoZVtuXVxuICAgIH1cbiAgICByZXR1cm4gcHJpbWVzXG59XG5cblxuY29uc3QgU0NIRU1BX1ByaW1lcz0ge1xuICAgIG06IHtcbiAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgIHRpdGxlOiAnTW9kJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBIG51bWJlciB0byBtb2QgdGhlIHNlcXVlbmNlIGJ5JyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufVxuXG5cbmNvbnN0IFNFUV9QcmltZXMgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fUHJpbWVzLFxuXHRuYW1lOiBcIlByaW1lc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfUHJpbWVzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX1ByaW1lcyIsIi8qKlxuICpcbiAqIEBjbGFzcyBTZXF1ZW5jZUdlbmVyYXRvclxuICovXG5jbGFzcyBTZXF1ZW5jZUdlbmVyYXRvciB7XG4gICAgLyoqXG4gICAgICpDcmVhdGVzIGFuIGluc3RhbmNlIG9mIFNlcXVlbmNlR2VuZXJhdG9yLlxuICAgICAqIEBwYXJhbSB7Kn0gZ2VuZXJhdG9yIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIG5hdHVyYWwgbnVtYmVyIGFuZCByZXR1cm5zIGEgbnVtYmVyLCBpdCBjYW4gb3B0aW9uYWxseSB0YWtlIHRoZSBjYWNoZSBhcyBhIHNlY29uZCBhcmd1bWVudFxuICAgICAqIEBwYXJhbSB7Kn0gSUQgdGhlIElEIG9mIHRoZSBzZXF1ZW5jZVxuICAgICAqIEBtZW1iZXJvZiBTZXF1ZW5jZUdlbmVyYXRvclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKElELCBnZW5lcmF0b3IpIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgIHRoaXMuSUQgPSBJRDtcbiAgICAgICAgdGhpcy5jYWNoZSA9IFtdO1xuICAgICAgICB0aGlzLm5ld1NpemUgPSAxO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBpZiB3ZSBuZWVkIHRvIGdldCB0aGUgbnRoIGVsZW1lbnQgYW5kIGl0J3Mgbm90IHByZXNlbnQgaW5cbiAgICAgKiBpbiB0aGUgY2FjaGUsIHRoZW4gd2UgZWl0aGVyIGRvdWJsZSB0aGUgc2l6ZSwgb3IgdGhlIFxuICAgICAqIG5ldyBzaXplIGJlY29tZXMgbisxXG4gICAgICogQHBhcmFtIHsqfSBuIFxuICAgICAqIEBtZW1iZXJvZiBTZXF1ZW5jZUdlbmVyYXRvclxuICAgICAqL1xuICAgIHJlc2l6ZUNhY2hlKG4pIHtcbiAgICAgICAgdGhpcy5uZXdTaXplID0gdGhpcy5jYWNoZS5sZW5ndGggKiAyO1xuICAgICAgICBpZiAobiArIDEgPiB0aGlzLm5ld1NpemUpIHtcbiAgICAgICAgICAgIHRoaXMubmV3U2l6ZSA9IG4gKyAxO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBvcHVsYXRlcyB0aGUgY2FjaGUgdXAgdW50aWwgdGhlIGN1cnJlbnQgbmV3U2l6ZVxuICAgICAqIHRoaXMgaXMgY2FsbGVkIGFmdGVyIHJlc2l6ZUNhY2hlXG4gICAgICogQG1lbWJlcm9mIFNlcXVlbmNlR2VuZXJhdG9yXG4gICAgICovXG4gICAgZmlsbENhY2hlKCkge1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5jYWNoZS5sZW5ndGg7IGkgPCB0aGlzLm5ld1NpemU7IGkrKykge1xuICAgICAgICAgICAgLy90aGUgZ2VuZXJhdG9yIGlzIGdpdmVuIHRoZSBjYWNoZSBzaW5jZSBpdCB3b3VsZCBtYWtlIGNvbXB1dGF0aW9uIG1vcmUgZWZmaWNpZW50IHNvbWV0aW1lc1xuICAgICAgICAgICAgLy9idXQgdGhlIGdlbmVyYXRvciBkb2Vzbid0IG5lY2Vzc2FyaWx5IG5lZWQgdG8gdGFrZSBtb3JlIHRoYW4gb25lIGFyZ3VtZW50LlxuICAgICAgICAgICAgdGhpcy5jYWNoZVtpXSA9IHRoaXMuZ2VuZXJhdG9yKGksIHRoaXMuY2FjaGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBlbGVtZW50IGlzIHdoYXQgdGhlIGRyYXdpbmcgdG9vbHMgd2lsbCBiZSBjYWxsaW5nLCBpdCByZXRyaWV2ZXNcbiAgICAgKiB0aGUgbnRoIGVsZW1lbnQgb2YgdGhlIHNlcXVlbmNlIGJ5IGVpdGhlciBnZXR0aW5nIGl0IGZyb20gdGhlIGNhY2hlXG4gICAgICogb3IgaWYgaXNuJ3QgcHJlc2VudCwgYnkgYnVpbGRpbmcgdGhlIGNhY2hlIGFuZCB0aGVuIGdldHRpbmcgaXRcbiAgICAgKiBAcGFyYW0geyp9IG4gdGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBzZXF1ZW5jZSB3ZSB3YW50XG4gICAgICogQHJldHVybnMgYSBudW1iZXJcbiAgICAgKiBAbWVtYmVyb2YgU2VxdWVuY2VHZW5lcmF0b3JcbiAgICAgKi9cbiAgICBnZXRFbGVtZW50KG4pIHtcbiAgICAgICAgaWYgKHRoaXMuY2FjaGVbbl0gIT0gdW5kZWZpbmVkIHx8IHRoaXMuZmluaXRlKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImNhY2hlIGhpdFwiKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImNhY2hlIG1pc3NcIilcbiAgICAgICAgICAgIHRoaXMucmVzaXplQ2FjaGUobik7XG4gICAgICAgICAgICB0aGlzLmZpbGxDYWNoZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuLyoqXG4gKlxuICpcbiAqIEBwYXJhbSB7Kn0gY29kZSBhcmJpdHJhcnkgc2FnZSBjb2RlIHRvIGJlIGV4ZWN1dGVkIG9uIGFsZXBoXG4gKiBAcmV0dXJucyBhamF4IHJlc3BvbnNlIG9iamVjdFxuICovXG5mdW5jdGlvbiBzYWdlRXhlY3V0ZShjb2RlKSB7XG4gICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgYXN5bmM6IGZhbHNlLFxuICAgICAgICB1cmw6ICdodHRwOi8vYWxlcGguc2FnZW1hdGgub3JnL3NlcnZpY2UnLFxuICAgICAgICBkYXRhOiBcImNvZGU9XCIgKyBjb2RlXG4gICAgfSk7XG59XG5cbi8qKlxuICpcbiAqXG4gKiBAcGFyYW0geyp9IGNvZGUgYXJiaXRyYXJ5IHNhZ2UgY29kZSB0byBiZSBleGVjdXRlZCBvbiBhbGVwaFxuICogQHJldHVybnMgYWpheCByZXNwb25zZSBvYmplY3RcbiAqL1xuYXN5bmMgZnVuY3Rpb24gc2FnZUV4ZWN1dGVBc3luYyhjb2RlKSB7XG4gICAgcmV0dXJuIGF3YWl0ICQuYWpheCh7XG4gICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgdXJsOiAnaHR0cDovL2FsZXBoLnNhZ2VtYXRoLm9yZy9zZXJ2aWNlJyxcbiAgICAgICAgZGF0YTogXCJjb2RlPVwiICsgY29kZVxuICAgIH0pO1xufVxuXG5cbmNsYXNzIE9FSVNTZXF1ZW5jZUdlbmVyYXRvciB7XG4gICAgY29uc3RydWN0b3IoSUQsIE9FSVMpIHtcbiAgICAgICAgdGhpcy5PRUlTID0gT0VJUztcbiAgICAgICAgdGhpcy5JRCA9IElEO1xuICAgICAgICB0aGlzLmNhY2hlID0gW107XG4gICAgICAgIHRoaXMubmV3U2l6ZSA9IDE7XG4gICAgICAgIHRoaXMucHJlZmlsbENhY2hlKCk7XG4gICAgfVxuICAgIG9laXNGZXRjaChuKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRmV0Y2hpbmcuLlwiKTtcbiAgICAgICAgbGV0IGNvZGUgPSBgcHJpbnQoc2xvYW5lLiR7dGhpcy5PRUlTfS5saXN0KCR7bn0pKWA7XG4gICAgICAgIGxldCByZXNwID0gc2FnZUV4ZWN1dGUoY29kZSk7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3AucmVzcG9uc2VKU09OLnN0ZG91dCk7XG4gICAgfVxuICAgIGFzeW5jIHByZWZpbGxDYWNoZSgpIHtcbiAgICAgICAgdGhpcy5yZXNpemVDYWNoZSgzMDAwKTtcbiAgICAgICAgbGV0IGNvZGUgPSBgcHJpbnQoc2xvYW5lLiR7dGhpcy5PRUlTfS5saXN0KCR7dGhpcy5uZXdTaXplfSkpYDtcbiAgICAgICAgbGV0IHJlc3AgPSBhd2FpdCBzYWdlRXhlY3V0ZUFzeW5jKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgICAgdGhpcy5jYWNoZSA9IHRoaXMuY2FjaGUuY29uY2F0KEpTT04ucGFyc2UocmVzcC5zdGRvdXQpKTtcbiAgICB9XG4gICAgcmVzaXplQ2FjaGUobikge1xuICAgICAgICB0aGlzLm5ld1NpemUgPSB0aGlzLmNhY2hlLmxlbmd0aCAqIDI7XG4gICAgICAgIGlmIChuICsgMSA+IHRoaXMubmV3U2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5uZXdTaXplID0gbiArIDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmlsbENhY2hlKCkge1xuICAgICAgICBsZXQgbmV3TGlzdCA9IHRoaXMub2Vpc0ZldGNoKHRoaXMubmV3U2l6ZSk7XG4gICAgICAgIHRoaXMuY2FjaGUgPSB0aGlzLmNhY2hlLmNvbmNhdChuZXdMaXN0KTtcbiAgICB9XG4gICAgZ2V0RWxlbWVudChuKSB7XG4gICAgICAgIGlmICh0aGlzLmNhY2hlW25dICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZUNhY2hlKCk7XG4gICAgICAgICAgICB0aGlzLmZpbGxDYWNoZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIEJ1aWx0SW5OYW1lVG9TZXEoSUQsIHNlcU5hbWUsIHNlcVBhcmFtcykge1xuICAgIGxldCBnZW5lcmF0b3IgPSBCdWlsdEluU2Vxc1tzZXFOYW1lXS5nZW5lcmF0b3Ioc2VxUGFyYW1zKTtcbiAgICByZXR1cm4gbmV3IFNlcXVlbmNlR2VuZXJhdG9yKElELCBnZW5lcmF0b3IpO1xufVxuXG5cbmZ1bmN0aW9uIExpc3RUb1NlcShJRCwgbGlzdCkge1xuICAgIGxldCBsaXN0R2VuZXJhdG9yID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgcmV0dXJuIGxpc3Rbbl07XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFNlcXVlbmNlR2VuZXJhdG9yKElELCBsaXN0R2VuZXJhdG9yKTtcbn1cblxuZnVuY3Rpb24gT0VJU1RvU2VxKElELCBPRUlTKSB7XG4gICAgcmV0dXJuIG5ldyBPRUlTU2VxdWVuY2VHZW5lcmF0b3IoSUQsIE9FSVMpO1xufVxuXG5cbmNvbnN0IEJ1aWx0SW5TZXFzID0ge307XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ0J1aWx0SW5OYW1lVG9TZXEnOiBCdWlsdEluTmFtZVRvU2VxLFxuICAgICdMaXN0VG9TZXEnOiBMaXN0VG9TZXEsXG4gICAgJ09FSVNUb1NlcSc6IE9FSVNUb1NlcSxcbiAgICAnQnVpbHRJblNlcXMnOiBCdWlsdEluU2Vxc1xufTtcblxuXG5CdWlsdEluU2Vxc1tcIkZpYm9uYWNjaVwiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VGaWJvbmFjY2kuanMnKTtcbkJ1aWx0SW5TZXFzW1wiTHVjYXNcIl0gPSByZXF1aXJlKCcuL3NlcXVlbmNlTHVjYXMuanMnKTtcbkJ1aWx0SW5TZXFzW1wiUHJpbWVzXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZVByaW1lcy5qcycpO1xuQnVpbHRJblNlcXNbXCJOYXR1cmFsc1wiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VOYXR1cmFscy5qcycpO1xuQnVpbHRJblNlcXNbXCJMaW5SZWNcIl0gPSByZXF1aXJlKCcuL3NlcXVlbmNlTGluUmVjLmpzJyk7XG5CdWlsdEluU2Vxc1snUHJpbWVzJ10gPSByZXF1aXJlKCcuL3NlcXVlbmNlUHJpbWVzLmpzJyk7IiwibW9kdWxlLmV4cG9ydHMgPSBbXCJBMDAwMDAxXCIsIFwiQTAwMDAyN1wiLCBcIkEwMDAwMDRcIiwgXCJBMDAwMDA1XCIsIFwiQTAwMDAwOFwiLCBcIkEwMDAwMDlcIiwgXCJBMDAwNzk2XCIsIFwiQTAwMzQxOFwiLCBcIkEwMDczMThcIiwgXCJBMDA4Mjc1XCIsIFwiQTAwODI3N1wiLCBcIkEwNDkzMTBcIiwgXCJBMDAwMDEwXCIsIFwiQTAwMDAwN1wiLCBcIkEwMDU4NDNcIiwgXCJBMDAwMDM1XCIsIFwiQTAwMDE2OVwiLCBcIkEwMDAyNzJcIiwgXCJBMDAwMzEyXCIsIFwiQTAwMTQ3N1wiLCBcIkEwMDQ1MjZcIiwgXCJBMDAwMzI2XCIsIFwiQTAwMjM3OFwiLCBcIkEwMDI2MjBcIiwgXCJBMDA1NDA4XCIsIFwiQTAwMDAxMlwiLCBcIkEwMDAxMjBcIiwgXCJBMDEwMDYwXCIsIFwiQTAwMDA2OVwiLCBcIkEwMDE5NjlcIiwgXCJBMDAwMjkwXCIsIFwiQTAwMDIyNVwiLCBcIkEwMDAwMTVcIiwgXCJBMDAwMDE2XCIsIFwiQTAwMDAzMlwiLCBcIkEwMDQwODZcIiwgXCJBMDAyMTEzXCIsIFwiQTAwMDAzMFwiLCBcIkEwMDAwNDBcIiwgXCJBMDAyODA4XCIsIFwiQTAxODI1MlwiLCBcIkEwMDAwNDNcIiwgXCJBMDAwNjY4XCIsIFwiQTAwMDM5NlwiLCBcIkEwMDUxMDBcIiwgXCJBMDA1MTAxXCIsIFwiQTAwMjExMFwiLCBcIkEwMDA3MjBcIiwgXCJBMDY0NTUzXCIsIFwiQTAwMTA1NVwiLCBcIkEwMDY1MzBcIiwgXCJBMDAwOTYxXCIsIFwiQTAwNTExN1wiLCBcIkEwMjA2MzlcIiwgXCJBMDAwMDQxXCIsIFwiQTAwMDA0NVwiLCBcIkEwMDAxMDhcIiwgXCJBMDAxMDA2XCIsIFwiQTAwMDA3OVwiLCBcIkEwMDA1NzhcIiwgXCJBMDAwMjQ0XCIsIFwiQTAwMDMwMlwiLCBcIkEwMDA1ODNcIiwgXCJBMDAwMTQyXCIsIFwiQTAwMDA4NVwiLCBcIkEwMDExODlcIiwgXCJBMDAwNjcwXCIsIFwiQTAwNjMxOFwiLCBcIkEwMDAxNjVcIiwgXCJBMDAxMTQ3XCIsIFwiQTAwNjg4MlwiLCBcIkEwMDA5ODRcIiwgXCJBMDAxNDA1XCIsIFwiQTAwMDI5MlwiLCBcIkEwMDAzMzBcIiwgXCJBMDAwMTUzXCIsIFwiQTAwMDI1NVwiLCBcIkEwMDAyNjFcIiwgXCJBMDAxOTA5XCIsIFwiQTAwMTkxMFwiLCBcIkEwOTAwMTBcIiwgXCJBMDU1NzkwXCIsIFwiQTA5MDAxMlwiLCBcIkEwOTAwMTNcIiwgXCJBMDkwMDE0XCIsIFwiQTA5MDAxNVwiLCBcIkEwOTAwMTZcIiwgXCJBMDAwMTY2XCIsIFwiQTAwMDIwM1wiLCBcIkEwMDExNTdcIiwgXCJBMDA4NjgzXCIsIFwiQTAwMDIwNFwiLCBcIkEwMDAyMTdcIiwgXCJBMDAwMTI0XCIsIFwiQTAwMjI3NVwiLCBcIkEwMDExMTBcIiwgXCJBMDUxOTU5XCIsIFwiQTAwMTIyMVwiLCBcIkEwMDEyMjJcIiwgXCJBMDQ2NjYwXCIsIFwiQTAwMTIyN1wiLCBcIkEwMDEzNThcIiwgXCJBMDAxNjk0XCIsIFwiQTAwMTgzNlwiLCBcIkEwMDE5MDZcIiwgXCJBMDAxMzMzXCIsIFwiQTAwMTA0NVwiLCBcIkEwMDAxMjlcIiwgXCJBMDAxMTA5XCIsIFwiQTAxNTUyMVwiLCBcIkEwMTU1MjNcIiwgXCJBMDE1NTMwXCIsIFwiQTAxNTUzMVwiLCBcIkEwMTU1NTFcIiwgXCJBMDgyNDExXCIsIFwiQTA4MzEwM1wiLCBcIkEwODMxMDRcIiwgXCJBMDgzMTA1XCIsIFwiQTA4MzIxNlwiLCBcIkEwNjEwODRcIiwgXCJBMDAwMjEzXCIsIFwiQTAwMDA3M1wiLCBcIkEwNzk5MjJcIiwgXCJBMDc5OTIzXCIsIFwiQTEwOTgxNFwiLCBcIkExMTE3NzRcIiwgXCJBMTExNzc1XCIsIFwiQTExMTc4N1wiLCBcIkEwMDAxMTBcIiwgXCJBMDAwNTg3XCIsIFwiQTAwMDEwMFwiXVxuIl19
