(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*jshint maxerr: 10000 */

SEQUENCE = require('./sequences/sequences.js');
MODULES = require('./modules/modules.js');
Validation = require('./Validation.js');

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
			let currentSeq = preparedSequences[pair.seqID];
			let currentTool = preparedTools[pair.toolID];
			if (currentSeq && currentTool == undefined) {
				console.error("undefined ID for tool or sequence");
			}
			liveSketches.push(generateP5(currentTool.module.viz, currentTool.config, currentSeq, liveSketches.length, individualWidth, individualHeight));
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
},{"./Validation.js":2,"./modules/modules.js":7,"./sequences/sequences.js":13}],2:[function(require,module,exports){
SEQUENCE = require('./sequences/sequences.js');
VALIDOEIS = require('./validOEIS.js');
MODULES = require('./modules/modules.js');


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

module.exports = Validation;
},{"./modules/modules.js":7,"./sequences/sequences.js":13,"./validOEIS.js":14}],3:[function(require,module,exports){
/*
    var list=[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223];

*/

class VIZ_Differences {
	constructor(seq, sketch, config) {

		this.n = config.n; //n is number of terms of top sequence
		this.levels = config.Levels; //levels is number of layers of the pyramid/trapezoid created by writing the differences.
		this.seq = seq;
		this.sketch = sketch;
	}

	drawDifferences(n, levels, sequence) {

		//changed background color to grey since you can't see what's going on
		this.sketch.background('black');

		n = Math.min(n, sequence.length);
		levels = Math.min(levels, n - 1);
		let font, fontSize = 20;
		this.sketch.textFont("Arial");
		this.sketch.textSize(fontSize);
		this.sketch.textStyle(this.sketch.BOLD);
		let xDelta = 50;
		let yDelta = 50;
		let firstX = 30;
		let firstY = 30;
		this.sketch.colorMode(this.sketch.HSB, 255);
		let myColor = this.sketch.color(100, 255, 150);
		let hue;

		let workingSequence = [];

		for (let i = 0; i < this.n; i++) {
			console.log("in");
			workingSequence.push(sequence.getElement(i)); //workingSequence cannibalizes first n elements of sequence.
		}


		for (let i = 0; i < this.levels; i++) {
			hue = (i * 255 / 6) % 255;
			myColor = this.sketch.color(hue, 150, 200);
			this.sketch.fill(myColor);
			for (let j = 0; j < workingSequence.length; j++) {
				this.sketch.text(workingSequence[j], firstX + j * xDelta, firstY + i * yDelta); //Draws and updates workingSequence simultaneously.
				if (j < workingSequence.length - 1) {
					workingSequence[j] = workingSequence[j + 1] - workingSequence[j];
				}
			}

			workingSequence.length = workingSequence.length - 1; //Removes last element.
			firstX = firstX + (1 / 2) * xDelta; //Moves line forward half for pyramid shape.

		}

	}

	setup() {}
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
};

const MODULE_Differences = {
	viz: VIZ_Differences,
	name: "Differences",
	description: "",
	configSchema: SCHEMA_Differences
};


module.exports = MODULE_Differences;
},{}],4:[function(require,module,exports){
//An example module


class VIZ_ModFill {
	constructor(seq, sketch, config) {
		this.sketch = sketch;
		this.seq = seq;
		this.modDimension = config.modDimension;
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
};


const MODULE_ModFill = {
	viz: VIZ_ModFill,
	name: "Mod Fill",
	description: "",
	configSchema: SCHEMA_ModFill
};

module.exports = MODULE_ModFill;
},{}],5:[function(require,module,exports){
class VIZ_shiftCompare {
	constructor(seq, sketch, config) {
		//Sketch is your canvas
		//config is the parameters you expect
		//seq is the sequence you are drawing
		this.sketch = sketch;
		this.seq = seq;
		this.MOD = 2;
		// Set up the image once.
	}


	setup() {
		console.log(this.sketch.height, this.sketch.width);
		this.img = this.sketch.createImage(this.sketch.width, this.sketch.height);
		this.img.loadPixels(); // Enables pixel-level editing.
	}

	clip(a, min, max) {
		if (a < min) {
			return min;
		} else if (a > max) {
			return max;
		}
		return a;
	}


	draw() { //This will be called everytime to draw
		// Ensure mouse coordinates are sane.
		// Mouse coordinates look they're floats by default.

		let d = this.sketch.pixelDensity();
		let mx = this.clip(Math.round(this.sketch.mouseX), 0, this.sketch.width);
		let my = this.clip(Math.round(this.sketch.mouseY), 0, this.sketch.height);
		if (this.sketch.key == 'ArrowUp') {
			this.MOD += 1;
			this.sketch.key = null;
			console.log("UP PRESSED, NEW MOD: " + this.MOD);
		} else if (this.sketch.key == 'ArrowDown') {
			this.MOD -= 1;
			this.sketch.key = null;
			console.log("DOWN PRESSED, NEW MOD: " + this.MOD);
		} else if (this.sketch.key == 'ArrowRight') {
			console.log(console.log("MX: " + mx + " MY: " + my));
		}
		// Write to image, then to screen for speed.
		for (let x = 0; x < this.sketch.width; x++) {
			for (let y = 0; y < this.sketch.height; y++) {
				for (let i = 0; i < d; i++) {
					for (let j = 0; j < d; j++) {
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
};

module.exports = MODULE_ShiftCompare;
},{}],6:[function(require,module,exports){
class VIZ_Turtle {
	constructor(seq, sketch, config) {
		var domain = config.domain;
		var range = config.range;
		this.rotMap = {};
		for(let i = 0; i < domain.length; i++){
			this.rotMap[domain[i]] = (Math.PI/180)*range[i];
		}
		this.stepSize = config.stepSize;
		this.bgColor = config.bgColor;
		this.strokeColor = config.strokeColor;
		this.strokeWidth = config.strokeWeight;
		this.seq = seq;
		this.currentIndex = 0;
		this.orientation = 0;
		this.sketch = sketch;
		if(config.startingX != ""){
			this.X = config.startingX;
			this.Y = config.startingY;
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
			throw ('angle undefined for element: ' + currElement);
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
		this.sketch.strokeWeight(this.strokeWidth);
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
};

const MODULE_Turtle = {
	viz: VIZ_Turtle,
	name: "Turtle",
	description: "",
	configSchema: SCHEMA_Turtle
};


module.exports = MODULE_Turtle;
},{}],7:[function(require,module,exports){
//Add an import line here for new modules


//Add new modules to this constant.
const MODULES = {};

module.exports = MODULES;

/*jshint ignore:start */
MODULES["Turtle"] = require('./moduleTurtle.js');
MODULES["ShiftCompare"] = require('./moduleShiftCompare.js');
MODULES["Differences"] = require('./moduleDifferences.js');
MODULES["ModFill"] = require('./moduleModFill.js');
},{"./moduleDifferences.js":3,"./moduleModFill.js":4,"./moduleShiftCompare.js":5,"./moduleTurtle.js":6}],8:[function(require,module,exports){

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
},{"./sequenceLinRec.js":9}],9:[function(require,module,exports){


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
},{}],10:[function(require,module,exports){

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
},{"./sequenceLinRec.js":9}],11:[function(require,module,exports){


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
},{}],12:[function(require,module,exports){


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
},{}],13:[function(require,module,exports){
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

/*jshint ignore: start */
BuiltInSeqs["Fibonacci"] = require('./sequenceFibonacci.js');
BuiltInSeqs["Lucas"] = require('./sequenceLucas.js');
BuiltInSeqs["Primes"] = require('./sequencePrimes.js');
BuiltInSeqs["Naturals"] = require('./sequenceNaturals.js');
BuiltInSeqs["LinRec"] = require('./sequenceLinRec.js');
BuiltInSeqs['Primes'] = require('./sequencePrimes.js');
},{"./sequenceFibonacci.js":8,"./sequenceLinRec.js":9,"./sequenceLucas.js":10,"./sequenceNaturals.js":11,"./sequencePrimes.js":12}],14:[function(require,module,exports){
module.exports = ["A000001", "A000027", "A000004", "A000005", "A000008", "A000009", "A000796", "A003418", "A007318", "A008275", "A008277", "A049310", "A000010", "A000007", "A005843", "A000035", "A000169", "A000272", "A000312", "A001477", "A004526", "A000326", "A002378", "A002620", "A005408", "A000012", "A000120", "A010060", "A000069", "A001969", "A000290", "A000225", "A000015", "A000016", "A000032", "A004086", "A002113", "A000030", "A000040", "A002808", "A018252", "A000043", "A000668", "A000396", "A005100", "A005101", "A002110", "A000720", "A064553", "A001055", "A006530", "A000961", "A005117", "A020639", "A000041", "A000045", "A000108", "A001006", "A000079", "A000578", "A000244", "A000302", "A000583", "A000142", "A000085", "A001189", "A000670", "A006318", "A000165", "A001147", "A006882", "A000984", "A001405", "A000292", "A000330", "A000153", "A000255", "A000261", "A001909", "A001910", "A090010", "A055790", "A090012", "A090013", "A090014", "A090015", "A090016", "A000166", "A000203", "A001157", "A008683", "A000204", "A000217", "A000124", "A002275", "A001110", "A051959", "A001221", "A001222", "A046660", "A001227", "A001358", "A001694", "A001836", "A001906", "A001333", "A001045", "A000129", "A001109", "A015521", "A015523", "A015530", "A015531", "A015551", "A082411", "A083103", "A083104", "A083105", "A083216", "A061084", "A000213", "A000073", "A079922", "A079923", "A109814", "A111774", "A111775", "A111787", "A000110", "A000587", "A000100"]

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvTlNjb3JlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L1ZhbGlkYXRpb24uanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVEaWZmZXJlbmNlcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9tb2R1bGVzL21vZHVsZU1vZEZpbGwuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVTaGlmdENvbXBhcmUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVUdXJ0bGUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZUZpYm9uYWNjaS5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9zZXF1ZW5jZXMvc2VxdWVuY2VMaW5SZWMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvc2VxdWVuY2VzL3NlcXVlbmNlTHVjYXMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvc2VxdWVuY2VzL3NlcXVlbmNlTmF0dXJhbHMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvc2VxdWVuY2VzL3NlcXVlbmNlUHJpbWVzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZXMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvdmFsaWRPRUlTLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFLQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLypqc2hpbnQgbWF4ZXJyOiAxMDAwMCAqL1xuXG5TRVFVRU5DRSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VzL3NlcXVlbmNlcy5qcycpO1xuTU9EVUxFUyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9tb2R1bGVzLmpzJyk7XG5WYWxpZGF0aW9uID0gcmVxdWlyZSgnLi9WYWxpZGF0aW9uLmpzJyk7XG5cbkJ1aWx0SW5TZXFzID0gU0VRVUVOQ0UuQnVpbHRJblNlcXM7XG5MaXN0VG9TZXEgPSBTRVFVRU5DRS5MaXN0VG9TZXE7XG5PRUlTVG9TZXEgPSBTRVFVRU5DRS5PRUlTVG9TZXE7XG5CdWlsdEluTmFtZVRvU2VxID0gU0VRVUVOQ0UuQnVpbHRJbk5hbWVUb1NlcTtcblxuZnVuY3Rpb24gc3RyaW5nVG9BcnJheShzdHJBcnIpIHtcblx0cmV0dXJuIEpTT04ucGFyc2UoXCJbXCIgKyBzdHJBcnIgKyBcIl1cIik7XG59XG5cbmNvbnN0IE5TY29yZSA9IGZ1bmN0aW9uICgpIHtcblx0Y29uc3QgbW9kdWxlcyA9IE1PRFVMRVM7IC8vICBjbGFzc2VzIHRvIHRoZSBkcmF3aW5nIG1vZHVsZXNcblx0Y29uc3QgdmFsaWRPRUlTID0gVkFMSURPRUlTO1xuXHR2YXIgcHJlcGFyZWRTZXF1ZW5jZXMgPSBbXTsgLy8gc2VxdWVuY2VHZW5lcmF0b3JzIHRvIGJlIGRyYXduXG5cdHZhciBwcmVwYXJlZFRvb2xzID0gW107IC8vIGNob3NlbiBkcmF3aW5nIG1vZHVsZXMgXG5cdHZhciBsaXZlU2tldGNoZXMgPSBbXTsgLy8gcDUgc2tldGNoZXMgYmVpbmcgZHJhd25cblxuXHQvKipcblx0ICpcblx0ICpcblx0ICogQHBhcmFtIHsqfSBtb2R1bGVDbGFzcyBkcmF3aW5nIG1vZHVsZSB0byBiZSB1c2VkIGZvciB0aGlzIHNrZXRjaFxuXHQgKiBAcGFyYW0geyp9IGNvbmZpZyBjb3JyZXNwb25kaW5nIGNvbmZpZyBmb3IgZHJhd2luZyBtb2R1bGVcblx0ICogQHBhcmFtIHsqfSBzZXEgc2VxdWVuY2UgdG8gYmUgcGFzc2VkIHRvIGRyYXdpbmcgbW9kdWxlXG5cdCAqIEBwYXJhbSB7Kn0gZGl2SUQgZGl2IHdoZXJlIHNrZXRjaCB3aWxsIGJlIHBsYWNlZFxuXHQgKiBAcGFyYW0geyp9IHdpZHRoIHdpZHRoIG9mIHNrZXRjaFxuXHQgKiBAcGFyYW0geyp9IGhlaWdodCBoZWlnaHQgb2Ygc2tldGNoXG5cdCAqIEByZXR1cm5zIHA1IHNrZXRjaFxuXHQgKi9cblx0Y29uc3QgZ2VuZXJhdGVQNSA9IGZ1bmN0aW9uIChtb2R1bGVDbGFzcywgY29uZmlnLCBzZXEsIGRpdklELCB3aWR0aCwgaGVpZ2h0KSB7XG5cblx0XHQvL0NyZWF0ZSBjYW52YXMgZWxlbWVudCBoZXJlXG5cdFx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdC8vVGhlIHN0eWxlIG9mIHRoZSBjYW52YXNlcyB3aWxsIGJlIFwiY2FudmFzQ2xhc3NcIlxuXHRcdGRpdi5jbGFzc05hbWUgPSBcImNhbnZhc0NsYXNzXCI7XG5cdFx0ZGl2LmlkID0gXCJsaXZlQ2FudmFzXCIgKyBkaXZJRDtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc0FyZWFcIikuYXBwZW5kQ2hpbGQoZGl2KTtcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQvL0NyZWF0ZSBQNWpzIGluc3RhbmNlXG5cdFx0bGV0IG15cDUgPSBuZXcgcDUoZnVuY3Rpb24gKHNrZXRjaCkge1xuXHRcdFx0bGV0IG1vZHVsZUluc3RhbmNlID0gbmV3IG1vZHVsZUNsYXNzKHNlcSwgc2tldGNoLCBjb25maWcpO1xuXHRcdFx0c2tldGNoLnNldHVwID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRza2V0Y2guY3JlYXRlQ2FudmFzKHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0XHRza2V0Y2guYmFja2dyb3VuZChcIndoaXRlXCIpO1xuXHRcdFx0XHRtb2R1bGVJbnN0YW5jZS5zZXR1cCgpO1xuXHRcdFx0fTtcblxuXHRcdFx0c2tldGNoLmRyYXcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdG1vZHVsZUluc3RhbmNlLmRyYXcoKTtcblx0XHRcdH07XG5cdFx0fSwgZGl2LmlkKTtcblx0XHRyZXR1cm4gbXlwNTtcblx0fTtcblxuXHQvKipcblx0ICogV2hlbiB0aGUgdXNlciBjaG9vc2VzIGEgZHJhd2luZyBtb2R1bGUgYW5kIHByb3ZpZGVzIGNvcnJlc3BvbmRpbmcgY29uZmlnXG5cdCAqIGl0IHdpbGwgYXV0b21hdGljYWxseSBiZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiwgd2hpY2ggd2lsbCB2YWxpZGF0ZSBpbnB1dFxuXHQgKiBhbmQgYXBwZW5kIGl0IHRvIHRoZSBwcmVwYXJlZCB0b29sc1xuXHQgKiBAcGFyYW0geyp9IG1vZHVsZU9iaiBpbmZvcm1hdGlvbiB1c2VkIHRvIHByZXBhcmUgdGhlIHJpZ2h0IGRyYXdpbmcgbW9kdWxlLCB0aGlzIGlucHV0XG5cdCAqIHRoaXMgd2lsbCBjb250YWluIGFuIElELCB0aGUgbW9kdWxlS2V5IHdoaWNoIHNob3VsZCBtYXRjaCBhIGtleSBpbiBNT0RVTEVTX0pTT04sIGFuZFxuXHQgKiBhIGNvbmZpZyBvYmplY3QuXG5cdCAqL1xuXHRjb25zdCByZWNlaXZlTW9kdWxlID0gZnVuY3Rpb24gKG1vZHVsZU9iaikge1xuXHRcdGlmICgobW9kdWxlT2JqLklEICYmIG1vZHVsZU9iai5tb2R1bGVLZXkgJiYgbW9kdWxlT2JqLmNvbmZpZyAmJiBtb2R1bGVzW21vZHVsZU9iai5tb2R1bGVLZXldKSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJPbmUgb3IgbW9yZSB1bmRlZmluZWQgbW9kdWxlIHByb3BlcnRpZXMgcmVjZWl2ZWQgaW4gTlNjb3JlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YWxpZGF0aW9uUmVzdWx0ID0gVmFsaWRhdGlvbi5tb2R1bGUobW9kdWxlT2JqKTtcblx0XHRcdGlmICh2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5sZW5ndGggIT0gMCkge1xuXHRcdFx0XHRwcmVwYXJlZFRvb2xzW21vZHVsZU9iai5JRF0gPSBudWxsO1xuXHRcdFx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdC5lcnJvcnM7XG5cdFx0XHR9XG5cdFx0XHRtb2R1bGVPYmouY29uZmlnID0gdmFsaWRhdGlvblJlc3VsdC5wYXJzZWRGaWVsZHM7XG5cdFx0XHRwcmVwYXJlZFRvb2xzW21vZHVsZU9iai5JRF0gPSB7XG5cdFx0XHRcdG1vZHVsZTogbW9kdWxlc1ttb2R1bGVPYmoubW9kdWxlS2V5XSxcblx0XHRcdFx0Y29uZmlnOiBtb2R1bGVPYmouY29uZmlnLFxuXHRcdFx0XHRJRDogbW9kdWxlT2JqLklEXG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBXaGVuIHRoZSB1c2VyIGNob29zZXMgYSBzZXF1ZW5jZSwgd2Ugd2lsbCBhdXRvbWF0aWNhbGx5IHBhc3MgaXQgdG8gdGhpcyBmdW5jdGlvblxuXHQgKiB3aGljaCB3aWxsIHZhbGlkYXRlIHRoZSBpbnB1dCwgYW5kIHRoZW4gZGVwZW5kaW5nIG9uIHRoZSBpbnB1dCB0eXBlLCBpdCB3aWxsIHByZXBhcmVcblx0ICogdGhlIHNlcXVlbmNlIGluIHNvbWUgd2F5IHRvIGdldCBhIHNlcXVlbmNlR2VuZXJhdG9yIG9iamVjdCB3aGljaCB3aWxsIGJlIGFwcGVuZGVkXG5cdCAqIHRvIHByZXBhcmVkU2VxdWVuY2VzXG5cdCAqIEBwYXJhbSB7Kn0gc2VxT2JqIGluZm9ybWF0aW9uIHVzZWQgdG8gcHJlcGFyZSB0aGUgcmlnaHQgc2VxdWVuY2UsIHRoaXMgd2lsbCBjb250YWluIGFcblx0ICogc2VxdWVuY2UgSUQsIHRoZSB0eXBlIG9mIGlucHV0LCBhbmQgdGhlIGlucHV0IGl0c2VsZiAoc2VxdWVuY2UgbmFtZSwgYSBsaXN0LCBhbiBPRUlTIG51bWJlci4uZXRjKS5cblx0ICovXG5cdGNvbnN0IHJlY2VpdmVTZXF1ZW5jZSA9IGZ1bmN0aW9uIChzZXFPYmopIHtcblx0XHRpZiAoKHNlcU9iai5JRCAmJiBzZXFPYmouaW5wdXRUeXBlICYmIHNlcU9iai5pbnB1dFZhbHVlICYmIHNlcU9iai5wYXJhbWV0ZXJzKSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJPbmUgb3IgbW9yZSB1bmRlZmluZWQgbW9kdWxlIHByb3BlcnRpZXMgcmVjZWl2ZWQgaW4gTlNjb3JlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBXZSB3aWxsIHByb2Nlc3MgZGlmZmVyZW50IGlucHV0cyBpbiBkaWZmZXJlbnQgd2F5c1xuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJidWlsdEluXCIpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdCA9IFZhbGlkYXRpb24uYnVpbHRJbihzZXFPYmopO1xuXHRcdFx0XHRpZiAodmFsaWRhdGlvblJlc3VsdC5lcnJvcnMubGVuZ3RoICE9IDApIHtcblx0XHRcdFx0XHRwcmVwYXJlZFNlcXVlbmNlc1tzZXFPYmouSURdID0gbnVsbDtcblx0XHRcdFx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdC5lcnJvcnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc29sZS5sb2codmFsaWRhdGlvblJlc3VsdCk7XG5cdFx0XHRcdHNlcU9iai5wYXJhbWV0ZXJzID0gdmFsaWRhdGlvblJlc3VsdC5wYXJzZWRGaWVsZHM7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHNlcU9iaik7XG5cdFx0XHRcdHByZXBhcmVkU2VxdWVuY2VzW3NlcU9iai5JRF0gPSBCdWlsdEluTmFtZVRvU2VxKHNlcU9iai5JRCwgc2VxT2JqLmlucHV0VmFsdWUsIHNlcU9iai5wYXJhbWV0ZXJzKTtcblx0XHRcdH1cblx0XHRcdGlmIChzZXFPYmouaW5wdXRUeXBlID09IFwiT0VJU1wiKSB7XG5cdFx0XHRcdHZhbGlkYXRpb25SZXN1bHQgPSBWYWxpZGF0aW9uLm9laXMoc2VxT2JqKTtcblx0XHRcdFx0aWYgKHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLmxlbmd0aCAhPSAwKSB7XG5cdFx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbc2VxT2JqLklEXSA9IG51bGw7XG5cdFx0XHRcdFx0cmV0dXJuIHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHByZXBhcmVkU2VxdWVuY2VzW3NlcU9iai5JRF0gPSBPRUlTVG9TZXEoc2VxT2JqLklELCBzZXFPYmouaW5wdXRWYWx1ZSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoc2VxT2JqLmlucHV0VHlwZSA9PSBcImxpc3RcIikge1xuXHRcdFx0XHR2YWxpZGF0aW9uUmVzdWx0ID0gVmFsaWRhdGlvbi5saXN0KHNlcU9iaik7XG5cdFx0XHRcdGlmICh2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5sZW5ndGggIT0gMCkge1xuXHRcdFx0XHRcdHByZXBhcmVkU2VxdWVuY2VzW3NlcU9iai5JRF0gPSBudWxsO1xuXHRcdFx0XHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0LmVycm9ycztcblx0XHRcdFx0fVxuXHRcdFx0XHRwcmVwYXJlZFNlcXVlbmNlc1tzZXFPYmouSURdID0gTGlzdFRvU2VxKHNlcU9iai5JRCwgc2VxT2JqLmlucHV0VmFsdWUpO1xuXG5cdFx0XHR9XG5cdFx0XHRpZiAoc2VxT2JqLmlucHV0VHlwZSA9PSBcImNvZGVcIikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblx0LyoqXG5cdCAqIFdlIGluaXRpYWxpemUgdGhlIGRyYXdpbmcgcHJvY2Vzc2luZy4gRmlyc3Qgd2UgY2FsY3VsYXRlIHRoZSBkaW1lbnNpb25zIG9mIGVhY2ggc2tldGNoXG5cdCAqIHRoZW4gd2UgcGFpciB1cCBzZXF1ZW5jZXMgYW5kIGRyYXdpbmcgbW9kdWxlcywgYW5kIGZpbmFsbHkgd2UgcGFzcyB0aGVtIHRvIGdlbmVyYXRlUDVcblx0ICogd2hpY2ggYWN0dWFsbHkgaW5zdGFudGlhdGVzIGRyYXdpbmcgbW9kdWxlcyBhbmQgYmVnaW5zIGRyYXdpbmcuXG5cdCAqIFxuXHQgKiBAcGFyYW0geyp9IHNlcVZpelBhaXJzIGEgbGlzdCBvZiBwYWlycyB3aGVyZSBlYWNoIHBhaXIgY29udGFpbnMgYW4gSUQgb2YgYSBzZXF1ZW5jZVxuXHQgKiBhbmQgYW4gSUQgb2YgYSBkcmF3aW5nIHRvb2wsIHRoaXMgbGV0cyB1cyBrbm93IHRvIHBhc3Mgd2hpY2ggc2VxdWVuY2UgdG8gd2hpY2hcblx0ICogZHJhd2luZyB0b29sLlxuXHQgKi9cblx0Y29uc3QgYmVnaW4gPSBmdW5jdGlvbiAoc2VxVml6UGFpcnMpIHtcblx0XHRoaWRlTG9nKCk7XG5cblx0XHQvL0ZpZ3VyaW5nIG91dCBsYXlvdXRcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0bGV0IHRvdGFsV2lkdGggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzQXJlYScpLm9mZnNldFdpZHRoO1xuXHRcdGxldCB0b3RhbEhlaWdodCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXNBcmVhJykub2Zmc2V0SGVpZ2h0O1xuXHRcdGxldCBjYW52YXNDb3VudCA9IHNlcVZpelBhaXJzLmxlbmd0aDtcblx0XHRsZXQgZ3JpZFNpemUgPSBNYXRoLmNlaWwoTWF0aC5zcXJ0KGNhbnZhc0NvdW50KSk7XG5cdFx0bGV0IGluZGl2aWR1YWxXaWR0aCA9IHRvdGFsV2lkdGggLyBncmlkU2l6ZSAtIDIwO1xuXHRcdGxldCBpbmRpdmlkdWFsSGVpZ2h0ID0gdG90YWxIZWlnaHQgLyBncmlkU2l6ZTtcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0XHRmb3IgKGxldCBwYWlyIG9mIHNlcVZpelBhaXJzKSB7XG5cdFx0XHRsZXQgY3VycmVudFNlcSA9IHByZXBhcmVkU2VxdWVuY2VzW3BhaXIuc2VxSURdO1xuXHRcdFx0bGV0IGN1cnJlbnRUb29sID0gcHJlcGFyZWRUb29sc1twYWlyLnRvb2xJRF07XG5cdFx0XHRpZiAoY3VycmVudFNlcSAmJiBjdXJyZW50VG9vbCA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcInVuZGVmaW5lZCBJRCBmb3IgdG9vbCBvciBzZXF1ZW5jZVwiKTtcblx0XHRcdH1cblx0XHRcdGxpdmVTa2V0Y2hlcy5wdXNoKGdlbmVyYXRlUDUoY3VycmVudFRvb2wubW9kdWxlLnZpeiwgY3VycmVudFRvb2wuY29uZmlnLCBjdXJyZW50U2VxLCBsaXZlU2tldGNoZXMubGVuZ3RoLCBpbmRpdmlkdWFsV2lkdGgsIGluZGl2aWR1YWxIZWlnaHQpKTtcblx0XHR9XG5cdH07XG5cblx0Y29uc3QgY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0c2hvd0xvZygpO1xuXHRcdGlmIChsaXZlU2tldGNoZXMubGVuZ3RoID09IDApIHtcblx0XHRcdHJldHVybjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsaXZlU2tldGNoZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0bGl2ZVNrZXRjaGVzW2ldLnJlbW92ZSgpOyAvL2RlbGV0ZSBjYW52YXMgZWxlbWVudFxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHRjb25zdCBwYXVzZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRsaXZlU2tldGNoZXMuZm9yRWFjaChmdW5jdGlvbiAoc2tldGNoKSB7XG5cdFx0XHRza2V0Y2gubm9Mb29wKCk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y29uc3QgcmVzdW1lID0gZnVuY3Rpb24gKCkge1xuXHRcdGxpdmVTa2V0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChza2V0Y2gpIHtcblx0XHRcdHNrZXRjaC5sb29wKCk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y29uc3Qgc3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRsaXZlU2tldGNoZXMuZm9yRWFjaChmdW5jdGlvbiAoc2tldGNoKSB7XG5cdFx0XHRza2V0Y2gucmVkcmF3KCk7XG5cdFx0fSk7XG5cdH07XG5cblx0cmV0dXJuIHtcblx0XHRyZWNlaXZlU2VxdWVuY2U6IHJlY2VpdmVTZXF1ZW5jZSxcblx0XHRyZWNlaXZlTW9kdWxlOiByZWNlaXZlTW9kdWxlLFxuXHRcdGxpdmVTa2V0Y2hlczogbGl2ZVNrZXRjaGVzLFxuXHRcdHByZXBhcmVkU2VxdWVuY2VzOiBwcmVwYXJlZFNlcXVlbmNlcyxcblx0XHRwcmVwYXJlZFRvb2xzOiBwcmVwYXJlZFRvb2xzLFxuXHRcdG1vZHVsZXM6IG1vZHVsZXMsXG5cdFx0dmFsaWRPRUlTOiB2YWxpZE9FSVMsXG5cdFx0QnVpbHRJblNlcXM6IEJ1aWx0SW5TZXFzLFxuXHRcdGJlZ2luOiBiZWdpbixcblx0XHRwYXVzZTogcGF1c2UsXG5cdFx0cmVzdW1lOiByZXN1bWUsXG5cdFx0c3RlcDogc3RlcCxcblx0XHRjbGVhcjogY2xlYXIsXG5cdH07XG59KCk7XG5cblxuXG5cbmNvbnN0IExvZ1BhbmVsID0gZnVuY3Rpb24gKCkge1xuXHRsb2dHcmVlbiA9IGZ1bmN0aW9uIChsaW5lKSB7XG5cdFx0JChcIiNpbm5lckxvZ0FyZWFcIikuYXBwZW5kKGA8cCBzdHlsZT1cImNvbG9yOiMwMGZmMDBcIj4ke2xpbmV9PC9wPjxicj5gKTtcblx0fTtcblx0bG9nUmVkID0gZnVuY3Rpb24gKGxpbmUpIHtcblx0XHQkKFwiI2lubmVyTG9nQXJlYVwiKS5hcHBlbmQoYDxwIHN0eWxlPVwiY29sb3I6cmVkXCI+JHtsaW5lfTwvcD48YnI+YCk7XG5cdH07XG5cdGNsZWFybG9nID0gZnVuY3Rpb24gKCkge1xuXHRcdCQoXCIjaW5uZXJMb2dBcmVhXCIpLmVtcHR5KCk7XG5cdH07XG5cdGhpZGVMb2cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0JChcIiNsb2dBcmVhXCIpLmNzcygnZGlzcGxheScsICdub25lJyk7XG5cdH07XG5cdHNob3dMb2cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0JChcIiNsb2dBcmVhXCIpLmNzcygnZGlzcGxheScsICdibG9jaycpO1xuXHR9O1xuXHRyZXR1cm4ge1xuXHRcdGxvZ0dyZWVuOiBsb2dHcmVlbixcblx0XHRsb2dSZWQ6IGxvZ1JlZCxcblx0XHRjbGVhcmxvZzogY2xlYXJsb2csXG5cdFx0aGlkZUxvZzogaGlkZUxvZyxcblx0XHRzaG93TG9nOiBzaG93TG9nLFxuXHR9O1xufSgpO1xud2luZG93Lk5TY29yZSA9IE5TY29yZTtcbndpbmRvdy5Mb2dQYW5lbCA9IExvZ1BhbmVsOyIsIlNFUVVFTkNFID0gcmVxdWlyZSgnLi9zZXF1ZW5jZXMvc2VxdWVuY2VzLmpzJyk7XG5WQUxJRE9FSVMgPSByZXF1aXJlKCcuL3ZhbGlkT0VJUy5qcycpO1xuTU9EVUxFUyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9tb2R1bGVzLmpzJyk7XG5cblxuY29uc3QgVmFsaWRhdGlvbiA9IGZ1bmN0aW9uICgpIHtcblxuXG5cdGNvbnN0IGxpc3RFcnJvciA9IGZ1bmN0aW9uICh0aXRsZSkge1xuXHRcdGxldCBtc2cgPSBcImNhbid0IHBhcnNlIHRoZSBsaXN0LCBwbGVhc2UgcGFzcyBudW1iZXJzIHNlcGVyYXRlZCBieSBjb21tYXMgKGV4YW1wbGU6IDEsMiwzKVwiO1xuXHRcdGlmICh0aXRsZSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdG1zZyA9IHRpdGxlICsgXCI6IFwiICsgbXNnO1xuXHRcdH1cblx0XHRyZXR1cm4gbXNnO1xuXHR9O1xuXG5cdGNvbnN0IHJlcXVpcmVkRXJyb3IgPSBmdW5jdGlvbiAodGl0bGUpIHtcblx0XHRyZXR1cm4gYCR7dGl0bGV9OiB0aGlzIGlzIGEgcmVxdWlyZWQgdmFsdWUsIGRvbid0IGxlYXZlIGl0IGVtcHR5IWA7XG5cdH07XG5cblx0Y29uc3QgdHlwZUVycm9yID0gZnVuY3Rpb24gKHRpdGxlLCB2YWx1ZSwgZXhwZWN0ZWRUeXBlKSB7XG5cdFx0cmV0dXJuIGAke3RpdGxlfTogJHt2YWx1ZX0gaXMgYSAke3R5cGVvZih2YWx1ZSl9LCBleHBlY3RlZCBhICR7ZXhwZWN0ZWRUeXBlfS4gYDtcblx0fTtcblxuXHRjb25zdCBvZWlzRXJyb3IgPSBmdW5jdGlvbiAoY29kZSkge1xuXHRcdHJldHVybiBgJHtjb2RlfTogRWl0aGVyIGFuIGludmFsaWQgT0VJUyBjb2RlIG9yIG5vdCBkZWZpbmVkIGJ5IHNhZ2UhYDtcblx0fTtcblxuXHRjb25zdCBidWlsdEluID0gZnVuY3Rpb24gKHNlcU9iaikge1xuXHRcdGxldCBzY2hlbWEgPSBCdWlsdEluU2Vxc1tzZXFPYmouaW5wdXRWYWx1ZV0ucGFyYW1zU2NoZW1hO1xuXHRcdGxldCByZWNlaXZlZFBhcmFtcyA9IHNlcU9iai5wYXJhbWV0ZXJzO1xuXG5cdFx0bGV0IHZhbGlkYXRpb25SZXN1bHQgPSB7XG5cdFx0XHRwYXJzZWRGaWVsZHM6IHt9LFxuXHRcdFx0ZXJyb3JzOiBbXVxuXHRcdH07XG5cdFx0T2JqZWN0LmtleXMocmVjZWl2ZWRQYXJhbXMpLmZvckVhY2goXG5cdFx0XHQocGFyYW1ldGVyKSA9PiB7XG5cdFx0XHRcdHZhbGlkYXRlRnJvbVNjaGVtYShzY2hlbWEsIHBhcmFtZXRlciwgcmVjZWl2ZWRQYXJhbXNbcGFyYW1ldGVyXSwgdmFsaWRhdGlvblJlc3VsdCk7XG5cdFx0XHR9XG5cdFx0KTtcblx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdDtcblx0fTtcblxuXHRjb25zdCBvZWlzID0gZnVuY3Rpb24gKHNlcU9iaikge1xuXHRcdGxldCB2YWxpZGF0aW9uUmVzdWx0ID0ge1xuXHRcdFx0cGFyc2VkRmllbGRzOiB7fSxcblx0XHRcdGVycm9yczogW11cblx0XHR9O1xuXHRcdHNlcU9iai5pbnB1dFZhbHVlID0gc2VxT2JqLmlucHV0VmFsdWUudHJpbSgpO1xuXHRcdGxldCBvZWlzQ29kZSA9IHNlcU9iai5pbnB1dFZhbHVlO1xuXHRcdGlmICghVkFMSURPRUlTLmluY2x1ZGVzKG9laXNDb2RlKSkge1xuXHRcdFx0dmFsaWRhdGlvblJlc3VsdC5lcnJvcnMucHVzaChvZWlzRXJyb3Iob2Vpc0NvZGUpKTtcblx0XHR9XG5cdFx0cmV0dXJuIHZhbGlkYXRpb25SZXN1bHQ7XG5cdH07XG5cblx0Y29uc3QgbGlzdCA9IGZ1bmN0aW9uIChzZXFPYmopIHtcblx0XHRsZXQgdmFsaWRhdGlvblJlc3VsdCA9IHtcblx0XHRcdHBhcnNlZEZpZWxkczoge30sXG5cdFx0XHRlcnJvcnM6IFtdXG5cdFx0fTtcblx0XHR0cnkge1xuXHRcdFx0c2VxT2JqLmlucHV0VmFsdWUgPSBKU09OLnBhcnNlKHNlcU9iai5pbnB1dFZhbHVlKTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2gobGlzdEVycm9yKCkpO1xuXHRcdH1cblx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdDtcblx0fTtcblxuXHRjb25zdCBfbW9kdWxlID0gZnVuY3Rpb24gKG1vZHVsZU9iaikge1xuXHRcdGxldCBzY2hlbWEgPSBNT0RVTEVTW21vZHVsZU9iai5tb2R1bGVLZXldLmNvbmZpZ1NjaGVtYTtcblx0XHRsZXQgcmVjZWl2ZWRDb25maWcgPSBtb2R1bGVPYmouY29uZmlnO1xuXG5cdFx0bGV0IHZhbGlkYXRpb25SZXN1bHQgPSB7XG5cdFx0XHRwYXJzZWRGaWVsZHM6IHt9LFxuXHRcdFx0ZXJyb3JzOiBbXVxuXHRcdH07XG5cblx0XHRPYmplY3Qua2V5cyhyZWNlaXZlZENvbmZpZykuZm9yRWFjaChcblx0XHRcdChjb25maWdGaWVsZCkgPT4ge1xuXHRcdFx0XHR2YWxpZGF0ZUZyb21TY2hlbWEoc2NoZW1hLCBjb25maWdGaWVsZCwgcmVjZWl2ZWRDb25maWdbY29uZmlnRmllbGRdLCB2YWxpZGF0aW9uUmVzdWx0KTtcblx0XHRcdH1cblx0XHQpO1xuXHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0O1xuXHR9O1xuXG5cdGNvbnN0IHZhbGlkYXRlRnJvbVNjaGVtYSA9IGZ1bmN0aW9uIChzY2hlbWEsIGZpZWxkLCB2YWx1ZSwgdmFsaWRhdGlvblJlc3VsdCkge1xuXHRcdGxldCB0aXRsZSA9IHNjaGVtYVtmaWVsZF0udGl0bGU7XG5cdFx0aWYgKHR5cGVvZiAodmFsdWUpID09IFwic3RyaW5nXCIpIHtcblx0XHRcdHZhbHVlID0gdmFsdWUudHJpbSgpO1xuXHRcdH1cblx0XHRsZXQgZXhwZWN0ZWRUeXBlID0gc2NoZW1hW2ZpZWxkXS50eXBlO1xuXHRcdGxldCByZXF1aXJlZCA9IChzY2hlbWFbZmllbGRdLnJlcXVpcmVkICE9PSB1bmRlZmluZWQpID8gc2NoZW1hW2ZpZWxkXS5yZXF1aXJlZCA6IGZhbHNlO1xuXHRcdGxldCBmb3JtYXQgPSAoc2NoZW1hW2ZpZWxkXS5mb3JtYXQgIT09IHVuZGVmaW5lZCkgPyBzY2hlbWFbZmllbGRdLmZvcm1hdCA6IGZhbHNlO1xuXHRcdGxldCBpc0VtcHR5ID0gKHZhbHVlID09PSAnJyk7XG5cdFx0Y29uc29sZS5sb2codmFsaWRhdGlvblJlc3VsdCk7XG5cdFx0aWYgKHJlcXVpcmVkICYmIGlzRW1wdHkpIHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2gocmVxdWlyZWRFcnJvcih0aXRsZSkpO1xuXHRcdH1cblx0XHRpZiAoaXNFbXB0eSkge1xuXHRcdFx0cGFyc2VkID0gbnVsbDtcblx0XHR9XG5cdFx0aWYgKCFpc0VtcHR5ICYmIChleHBlY3RlZFR5cGUgPT0gXCJudW1iZXJcIikpIHtcblx0XHRcdHBhcnNlZCA9IHBhcnNlSW50KHZhbHVlKTtcblx0XHRcdGlmIChwYXJzZWQgIT0gcGFyc2VkKSB7IC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM0MjYxOTM4L3doYXQtaXMtdGhlLWRpZmZlcmVuY2UtYmV0d2Vlbi1uYW4tbmFuLWFuZC1uYW4tbmFuXG5cdFx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2godHlwZUVycm9yKHRpdGxlLCB2YWx1ZSwgZXhwZWN0ZWRUeXBlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICghaXNFbXB0eSAmJiAoZXhwZWN0ZWRUeXBlID09IFwic3RyaW5nXCIpKSB7XG5cdFx0XHRwYXJzZWQgPSB2YWx1ZTtcblx0XHR9XG5cdFx0aWYgKCFpc0VtcHR5ICYmIChleHBlY3RlZFR5cGUgPT0gXCJib29sZWFuXCIpKSB7XG5cdFx0XHRpZiAodmFsdWUgPT0gJzEnKSB7XG5cdFx0XHRcdHBhcnNlZCA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXJzZWQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKGZvcm1hdCAmJiAoZm9ybWF0ID09IFwibGlzdFwiKSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cGFyc2VkID0gSlNPTi5wYXJzZShcIltcIiArIHZhbHVlICsgXCJdXCIpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2gobGlzdEVycm9yKHRpdGxlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChwYXJzZWQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dmFsaWRhdGlvblJlc3VsdC5wYXJzZWRGaWVsZHNbZmllbGRdID0gcGFyc2VkO1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4ge1xuXHRcdGJ1aWx0SW46IGJ1aWx0SW4sXG5cdFx0b2Vpczogb2Vpcyxcblx0XHRsaXN0OiBsaXN0LFxuXHRcdG1vZHVsZTogX21vZHVsZVxuXHR9O1xufSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZhbGlkYXRpb247IiwiLypcbiAgICB2YXIgbGlzdD1bMiwgMywgNSwgNywgMTEsIDEzLCAxNywgMTksIDIzLCAyOSwgMzEsIDM3LCA0MSwgNDMsIDQ3LCA1MywgNTksIDYxLCA2NywgNzEsIDczLCA3OSwgODMsIDg5LCA5NywgMTAxLCAxMDMsIDEwNywgMTA5LCAxMTMsIDEyNywgMTMxLCAxMzcsIDEzOSwgMTQ5LCAxNTEsIDE1NywgMTYzLCAxNjcsIDE3MywgMTc5LCAxODEsIDE5MSwgMTkzLCAxOTcsIDE5OSwgMjExLCAyMjMsIDIyNywgMjI5LCAyMzMsIDIzOSwgMjQxLCAyNTEsIDI1NywgMjYzLCAyNjksIDI3MSwgMjc3LCAyODEsIDI4MywgMjkzLCAzMDcsIDMxMSwgMzEzLCAzMTcsIDMzMSwgMzM3LCAzNDcsIDM0OSwgMzUzLCAzNTksIDM2NywgMzczLCAzNzksIDM4MywgMzg5LCAzOTcsIDQwMSwgNDA5LCA0MTksIDQyMSwgNDMxLCA0MzMsIDQzOSwgNDQzLCA0NDksIDQ1NywgNDYxLCA0NjMsIDQ2NywgNDc5LCA0ODcsIDQ5MSwgNDk5LCA1MDMsIDUwOSwgNTIxLCA1MjMsIDU0MSwgNTQ3LCA1NTcsIDU2MywgNTY5LCA1NzEsIDU3NywgNTg3LCA1OTMsIDU5OSwgNjAxLCA2MDcsIDYxMywgNjE3LCA2MTksIDYzMSwgNjQxLCA2NDMsIDY0NywgNjUzLCA2NTksIDY2MSwgNjczLCA2NzcsIDY4MywgNjkxLCA3MDEsIDcwOSwgNzE5LCA3MjcsIDczMywgNzM5LCA3NDMsIDc1MSwgNzU3LCA3NjEsIDc2OSwgNzczLCA3ODcsIDc5NywgODA5LCA4MTEsIDgyMSwgODIzLCA4MjcsIDgyOSwgODM5LCA4NTMsIDg1NywgODU5LCA4NjMsIDg3NywgODgxLCA4ODMsIDg4NywgOTA3LCA5MTEsIDkxOSwgOTI5LCA5MzcsIDk0MSwgOTQ3LCA5NTMsIDk2NywgOTcxLCA5NzcsIDk4MywgOTkxLCA5OTcsIDEwMDksIDEwMTMsIDEwMTksIDEwMjEsIDEwMzEsIDEwMzMsIDEwMzksIDEwNDksIDEwNTEsIDEwNjEsIDEwNjMsIDEwNjksIDEwODcsIDEwOTEsIDEwOTMsIDEwOTcsIDExMDMsIDExMDksIDExMTcsIDExMjMsIDExMjksIDExNTEsIDExNTMsIDExNjMsIDExNzEsIDExODEsIDExODcsIDExOTMsIDEyMDEsIDEyMTMsIDEyMTcsIDEyMjNdO1xuXG4qL1xuXG5jbGFzcyBWSVpfRGlmZmVyZW5jZXMge1xuXHRjb25zdHJ1Y3RvcihzZXEsIHNrZXRjaCwgY29uZmlnKSB7XG5cblx0XHR0aGlzLm4gPSBjb25maWcubjsgLy9uIGlzIG51bWJlciBvZiB0ZXJtcyBvZiB0b3Agc2VxdWVuY2Vcblx0XHR0aGlzLmxldmVscyA9IGNvbmZpZy5MZXZlbHM7IC8vbGV2ZWxzIGlzIG51bWJlciBvZiBsYXllcnMgb2YgdGhlIHB5cmFtaWQvdHJhcGV6b2lkIGNyZWF0ZWQgYnkgd3JpdGluZyB0aGUgZGlmZmVyZW5jZXMuXG5cdFx0dGhpcy5zZXEgPSBzZXE7XG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2g7XG5cdH1cblxuXHRkcmF3RGlmZmVyZW5jZXMobiwgbGV2ZWxzLCBzZXF1ZW5jZSkge1xuXG5cdFx0Ly9jaGFuZ2VkIGJhY2tncm91bmQgY29sb3IgdG8gZ3JleSBzaW5jZSB5b3UgY2FuJ3Qgc2VlIHdoYXQncyBnb2luZyBvblxuXHRcdHRoaXMuc2tldGNoLmJhY2tncm91bmQoJ2JsYWNrJyk7XG5cblx0XHRuID0gTWF0aC5taW4obiwgc2VxdWVuY2UubGVuZ3RoKTtcblx0XHRsZXZlbHMgPSBNYXRoLm1pbihsZXZlbHMsIG4gLSAxKTtcblx0XHRsZXQgZm9udCwgZm9udFNpemUgPSAyMDtcblx0XHR0aGlzLnNrZXRjaC50ZXh0Rm9udChcIkFyaWFsXCIpO1xuXHRcdHRoaXMuc2tldGNoLnRleHRTaXplKGZvbnRTaXplKTtcblx0XHR0aGlzLnNrZXRjaC50ZXh0U3R5bGUodGhpcy5za2V0Y2guQk9MRCk7XG5cdFx0bGV0IHhEZWx0YSA9IDUwO1xuXHRcdGxldCB5RGVsdGEgPSA1MDtcblx0XHRsZXQgZmlyc3RYID0gMzA7XG5cdFx0bGV0IGZpcnN0WSA9IDMwO1xuXHRcdHRoaXMuc2tldGNoLmNvbG9yTW9kZSh0aGlzLnNrZXRjaC5IU0IsIDI1NSk7XG5cdFx0bGV0IG15Q29sb3IgPSB0aGlzLnNrZXRjaC5jb2xvcigxMDAsIDI1NSwgMTUwKTtcblx0XHRsZXQgaHVlO1xuXG5cdFx0bGV0IHdvcmtpbmdTZXF1ZW5jZSA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm47IGkrKykge1xuXHRcdFx0Y29uc29sZS5sb2coXCJpblwiKTtcblx0XHRcdHdvcmtpbmdTZXF1ZW5jZS5wdXNoKHNlcXVlbmNlLmdldEVsZW1lbnQoaSkpOyAvL3dvcmtpbmdTZXF1ZW5jZSBjYW5uaWJhbGl6ZXMgZmlyc3QgbiBlbGVtZW50cyBvZiBzZXF1ZW5jZS5cblx0XHR9XG5cblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZXZlbHM7IGkrKykge1xuXHRcdFx0aHVlID0gKGkgKiAyNTUgLyA2KSAlIDI1NTtcblx0XHRcdG15Q29sb3IgPSB0aGlzLnNrZXRjaC5jb2xvcihodWUsIDE1MCwgMjAwKTtcblx0XHRcdHRoaXMuc2tldGNoLmZpbGwobXlDb2xvcik7XG5cdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHdvcmtpbmdTZXF1ZW5jZS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHR0aGlzLnNrZXRjaC50ZXh0KHdvcmtpbmdTZXF1ZW5jZVtqXSwgZmlyc3RYICsgaiAqIHhEZWx0YSwgZmlyc3RZICsgaSAqIHlEZWx0YSk7IC8vRHJhd3MgYW5kIHVwZGF0ZXMgd29ya2luZ1NlcXVlbmNlIHNpbXVsdGFuZW91c2x5LlxuXHRcdFx0XHRpZiAoaiA8IHdvcmtpbmdTZXF1ZW5jZS5sZW5ndGggLSAxKSB7XG5cdFx0XHRcdFx0d29ya2luZ1NlcXVlbmNlW2pdID0gd29ya2luZ1NlcXVlbmNlW2ogKyAxXSAtIHdvcmtpbmdTZXF1ZW5jZVtqXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR3b3JraW5nU2VxdWVuY2UubGVuZ3RoID0gd29ya2luZ1NlcXVlbmNlLmxlbmd0aCAtIDE7IC8vUmVtb3ZlcyBsYXN0IGVsZW1lbnQuXG5cdFx0XHRmaXJzdFggPSBmaXJzdFggKyAoMSAvIDIpICogeERlbHRhOyAvL01vdmVzIGxpbmUgZm9yd2FyZCBoYWxmIGZvciBweXJhbWlkIHNoYXBlLlxuXG5cdFx0fVxuXG5cdH1cblxuXHRzZXR1cCgpIHt9XG5cdGRyYXcoKSB7XG5cdFx0dGhpcy5kcmF3RGlmZmVyZW5jZXModGhpcy5uLCB0aGlzLmxldmVscywgdGhpcy5zZXEpO1xuXHRcdHRoaXMuc2tldGNoLm5vTG9vcCgpO1xuXHR9XG59XG5cblxuXG5jb25zdCBTQ0hFTUFfRGlmZmVyZW5jZXMgPSB7XG5cdG46IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ04nLFxuXHRcdGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIGVsZW1lbnRzJyxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRMZXZlbHM6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ0xldmVscycsXG5cdFx0ZGVzY3JpcHRpb246ICdOdW1iZXIgb2YgbGV2ZWxzJyxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxufTtcblxuY29uc3QgTU9EVUxFX0RpZmZlcmVuY2VzID0ge1xuXHR2aXo6IFZJWl9EaWZmZXJlbmNlcyxcblx0bmFtZTogXCJEaWZmZXJlbmNlc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0Y29uZmlnU2NoZW1hOiBTQ0hFTUFfRGlmZmVyZW5jZXNcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNT0RVTEVfRGlmZmVyZW5jZXM7IiwiLy9BbiBleGFtcGxlIG1vZHVsZVxuXG5cbmNsYXNzIFZJWl9Nb2RGaWxsIHtcblx0Y29uc3RydWN0b3Ioc2VxLCBza2V0Y2gsIGNvbmZpZykge1xuXHRcdHRoaXMuc2tldGNoID0gc2tldGNoO1xuXHRcdHRoaXMuc2VxID0gc2VxO1xuXHRcdHRoaXMubW9kRGltZW5zaW9uID0gY29uZmlnLm1vZERpbWVuc2lvbjtcblx0XHR0aGlzLmkgPSAwO1xuXHR9XG5cblx0ZHJhd05ldyhudW0sIHNlcSkge1xuXHRcdGxldCBibGFjayA9IHRoaXMuc2tldGNoLmNvbG9yKDApO1xuXHRcdHRoaXMuc2tldGNoLmZpbGwoYmxhY2spO1xuXHRcdGxldCBpO1xuXHRcdGxldCBqO1xuXHRcdGZvciAobGV0IG1vZCA9IDE7IG1vZCA8PSB0aGlzLm1vZERpbWVuc2lvbjsgbW9kKyspIHtcblx0XHRcdGkgPSBzZXEuZ2V0RWxlbWVudChudW0pICUgbW9kO1xuXHRcdFx0aiA9IG1vZCAtIDE7XG5cdFx0XHR0aGlzLnNrZXRjaC5yZWN0KGogKiB0aGlzLnJlY3RXaWR0aCwgdGhpcy5za2V0Y2guaGVpZ2h0IC0gKGkgKyAxKSAqIHRoaXMucmVjdEhlaWdodCwgdGhpcy5yZWN0V2lkdGgsIHRoaXMucmVjdEhlaWdodCk7XG5cdFx0fVxuXG5cdH1cblxuXHRzZXR1cCgpIHtcblx0XHR0aGlzLnJlY3RXaWR0aCA9IHRoaXMuc2tldGNoLndpZHRoIC8gdGhpcy5tb2REaW1lbnNpb247XG5cdFx0dGhpcy5yZWN0SGVpZ2h0ID0gdGhpcy5za2V0Y2guaGVpZ2h0IC8gdGhpcy5tb2REaW1lbnNpb247XG5cdFx0dGhpcy5za2V0Y2gubm9TdHJva2UoKTtcblx0fVxuXG5cdGRyYXcoKSB7XG5cdFx0dGhpcy5kcmF3TmV3KHRoaXMuaSwgdGhpcy5zZXEpO1xuXHRcdHRoaXMuaSsrO1xuXHRcdGlmIChpID09IDEwMDApIHtcblx0XHRcdHRoaXMuc2tldGNoLm5vTG9vcCgpO1xuXHRcdH1cblx0fVxuXG59XG5cbmNvbnN0IFNDSEVNQV9Nb2RGaWxsID0ge1xuXHRtb2REaW1lbnNpb246IHtcblx0XHR0eXBlOiBcIm51bWJlclwiLFxuXHRcdHRpdGxlOiBcIk1vZCBkaW1lbnNpb25cIixcblx0XHRkZXNjcmlwdGlvbjogXCJcIixcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9XG59O1xuXG5cbmNvbnN0IE1PRFVMRV9Nb2RGaWxsID0ge1xuXHR2aXo6IFZJWl9Nb2RGaWxsLFxuXHRuYW1lOiBcIk1vZCBGaWxsXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRjb25maWdTY2hlbWE6IFNDSEVNQV9Nb2RGaWxsXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9Nb2RGaWxsOyIsImNsYXNzIFZJWl9zaGlmdENvbXBhcmUge1xuXHRjb25zdHJ1Y3RvcihzZXEsIHNrZXRjaCwgY29uZmlnKSB7XG5cdFx0Ly9Ta2V0Y2ggaXMgeW91ciBjYW52YXNcblx0XHQvL2NvbmZpZyBpcyB0aGUgcGFyYW1ldGVycyB5b3UgZXhwZWN0XG5cdFx0Ly9zZXEgaXMgdGhlIHNlcXVlbmNlIHlvdSBhcmUgZHJhd2luZ1xuXHRcdHRoaXMuc2tldGNoID0gc2tldGNoO1xuXHRcdHRoaXMuc2VxID0gc2VxO1xuXHRcdHRoaXMuTU9EID0gMjtcblx0XHQvLyBTZXQgdXAgdGhlIGltYWdlIG9uY2UuXG5cdH1cblxuXG5cdHNldHVwKCkge1xuXHRcdGNvbnNvbGUubG9nKHRoaXMuc2tldGNoLmhlaWdodCwgdGhpcy5za2V0Y2gud2lkdGgpO1xuXHRcdHRoaXMuaW1nID0gdGhpcy5za2V0Y2guY3JlYXRlSW1hZ2UodGhpcy5za2V0Y2gud2lkdGgsIHRoaXMuc2tldGNoLmhlaWdodCk7XG5cdFx0dGhpcy5pbWcubG9hZFBpeGVscygpOyAvLyBFbmFibGVzIHBpeGVsLWxldmVsIGVkaXRpbmcuXG5cdH1cblxuXHRjbGlwKGEsIG1pbiwgbWF4KSB7XG5cdFx0aWYgKGEgPCBtaW4pIHtcblx0XHRcdHJldHVybiBtaW47XG5cdFx0fSBlbHNlIGlmIChhID4gbWF4KSB7XG5cdFx0XHRyZXR1cm4gbWF4O1xuXHRcdH1cblx0XHRyZXR1cm4gYTtcblx0fVxuXG5cblx0ZHJhdygpIHsgLy9UaGlzIHdpbGwgYmUgY2FsbGVkIGV2ZXJ5dGltZSB0byBkcmF3XG5cdFx0Ly8gRW5zdXJlIG1vdXNlIGNvb3JkaW5hdGVzIGFyZSBzYW5lLlxuXHRcdC8vIE1vdXNlIGNvb3JkaW5hdGVzIGxvb2sgdGhleSdyZSBmbG9hdHMgYnkgZGVmYXVsdC5cblxuXHRcdGxldCBkID0gdGhpcy5za2V0Y2gucGl4ZWxEZW5zaXR5KCk7XG5cdFx0bGV0IG14ID0gdGhpcy5jbGlwKE1hdGgucm91bmQodGhpcy5za2V0Y2gubW91c2VYKSwgMCwgdGhpcy5za2V0Y2gud2lkdGgpO1xuXHRcdGxldCBteSA9IHRoaXMuY2xpcChNYXRoLnJvdW5kKHRoaXMuc2tldGNoLm1vdXNlWSksIDAsIHRoaXMuc2tldGNoLmhlaWdodCk7XG5cdFx0aWYgKHRoaXMuc2tldGNoLmtleSA9PSAnQXJyb3dVcCcpIHtcblx0XHRcdHRoaXMuTU9EICs9IDE7XG5cdFx0XHR0aGlzLnNrZXRjaC5rZXkgPSBudWxsO1xuXHRcdFx0Y29uc29sZS5sb2coXCJVUCBQUkVTU0VELCBORVcgTU9EOiBcIiArIHRoaXMuTU9EKTtcblx0XHR9IGVsc2UgaWYgKHRoaXMuc2tldGNoLmtleSA9PSAnQXJyb3dEb3duJykge1xuXHRcdFx0dGhpcy5NT0QgLT0gMTtcblx0XHRcdHRoaXMuc2tldGNoLmtleSA9IG51bGw7XG5cdFx0XHRjb25zb2xlLmxvZyhcIkRPV04gUFJFU1NFRCwgTkVXIE1PRDogXCIgKyB0aGlzLk1PRCk7XG5cdFx0fSBlbHNlIGlmICh0aGlzLnNrZXRjaC5rZXkgPT0gJ0Fycm93UmlnaHQnKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhjb25zb2xlLmxvZyhcIk1YOiBcIiArIG14ICsgXCIgTVk6IFwiICsgbXkpKTtcblx0XHR9XG5cdFx0Ly8gV3JpdGUgdG8gaW1hZ2UsIHRoZW4gdG8gc2NyZWVuIGZvciBzcGVlZC5cblx0XHRmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMuc2tldGNoLndpZHRoOyB4KyspIHtcblx0XHRcdGZvciAobGV0IHkgPSAwOyB5IDwgdGhpcy5za2V0Y2guaGVpZ2h0OyB5KyspIHtcblx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBkOyBpKyspIHtcblx0XHRcdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IGQ7IGorKykge1xuXHRcdFx0XHRcdFx0bGV0IGluZGV4ID0gNCAqICgoeSAqIGQgKyBqKSAqIHRoaXMuc2tldGNoLndpZHRoICogZCArICh4ICogZCArIGkpKTtcblx0XHRcdFx0XHRcdGlmICh0aGlzLnNlcS5nZXRFbGVtZW50KHgpICUgKHRoaXMuTU9EKSA9PSB0aGlzLnNlcS5nZXRFbGVtZW50KHkpICUgKHRoaXMuTU9EKSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXhdID0gMjU1O1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAxXSA9IDI1NTtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgMl0gPSAyNTU7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDNdID0gMjU1O1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4XSA9IDA7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDFdID0gMDtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgMl0gPSAwO1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAzXSA9IDI1NTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmltZy51cGRhdGVQaXhlbHMoKTsgLy8gQ29waWVzIG91ciBlZGl0ZWQgcGl4ZWxzIHRvIHRoZSBpbWFnZS5cblxuXHRcdHRoaXMuc2tldGNoLmltYWdlKHRoaXMuaW1nLCAwLCAwKTsgLy8gRGlzcGxheSBpbWFnZSB0byBzY3JlZW4udGhpcy5za2V0Y2gubGluZSg1MCw1MCwxMDAsMTAwKTtcblx0fVxufVxuXG5cbmNvbnN0IE1PRFVMRV9TaGlmdENvbXBhcmUgPSB7XG5cdHZpejogVklaX3NoaWZ0Q29tcGFyZSxcblx0bmFtZTogXCJTaGlmdCBDb21wYXJlXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRjb25maWdTY2hlbWE6IHt9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9TaGlmdENvbXBhcmU7IiwiY2xhc3MgVklaX1R1cnRsZSB7XG5cdGNvbnN0cnVjdG9yKHNlcSwgc2tldGNoLCBjb25maWcpIHtcblx0XHR2YXIgZG9tYWluID0gY29uZmlnLmRvbWFpbjtcblx0XHR2YXIgcmFuZ2UgPSBjb25maWcucmFuZ2U7XG5cdFx0dGhpcy5yb3RNYXAgPSB7fTtcblx0XHRmb3IobGV0IGkgPSAwOyBpIDwgZG9tYWluLmxlbmd0aDsgaSsrKXtcblx0XHRcdHRoaXMucm90TWFwW2RvbWFpbltpXV0gPSAoTWF0aC5QSS8xODApKnJhbmdlW2ldO1xuXHRcdH1cblx0XHR0aGlzLnN0ZXBTaXplID0gY29uZmlnLnN0ZXBTaXplO1xuXHRcdHRoaXMuYmdDb2xvciA9IGNvbmZpZy5iZ0NvbG9yO1xuXHRcdHRoaXMuc3Ryb2tlQ29sb3IgPSBjb25maWcuc3Ryb2tlQ29sb3I7XG5cdFx0dGhpcy5zdHJva2VXaWR0aCA9IGNvbmZpZy5zdHJva2VXZWlnaHQ7XG5cdFx0dGhpcy5zZXEgPSBzZXE7XG5cdFx0dGhpcy5jdXJyZW50SW5kZXggPSAwO1xuXHRcdHRoaXMub3JpZW50YXRpb24gPSAwO1xuXHRcdHRoaXMuc2tldGNoID0gc2tldGNoO1xuXHRcdGlmKGNvbmZpZy5zdGFydGluZ1ggIT0gXCJcIil7XG5cdFx0XHR0aGlzLlggPSBjb25maWcuc3RhcnRpbmdYO1xuXHRcdFx0dGhpcy5ZID0gY29uZmlnLnN0YXJ0aW5nWTtcblx0XHR9XG5cdFx0ZWxzZXtcblx0XHRcdHRoaXMuWCA9IG51bGw7XG5cdFx0XHR0aGlzLlkgPSBudWxsO1xuXHRcdH1cblxuXHR9XG5cdHN0ZXBEcmF3KCkge1xuXHRcdGxldCBvbGRYID0gdGhpcy5YO1xuXHRcdGxldCBvbGRZID0gdGhpcy5ZO1xuXHRcdGxldCBjdXJyRWxlbWVudCA9IHRoaXMuc2VxLmdldEVsZW1lbnQodGhpcy5jdXJyZW50SW5kZXgrKyk7XG5cdFx0bGV0IGFuZ2xlID0gdGhpcy5yb3RNYXBbIGN1cnJFbGVtZW50IF07XG5cdFx0aWYoYW5nbGUgPT0gdW5kZWZpbmVkKXtcblx0XHRcdHRocm93ICgnYW5nbGUgdW5kZWZpbmVkIGZvciBlbGVtZW50OiAnICsgY3VyckVsZW1lbnQpO1xuXHRcdH1cblx0XHR0aGlzLm9yaWVudGF0aW9uID0gKHRoaXMub3JpZW50YXRpb24gKyBhbmdsZSk7XG5cdFx0dGhpcy5YICs9IHRoaXMuc3RlcFNpemUgKiBNYXRoLmNvcyh0aGlzLm9yaWVudGF0aW9uKTtcblx0XHR0aGlzLlkgKz0gdGhpcy5zdGVwU2l6ZSAqIE1hdGguc2luKHRoaXMub3JpZW50YXRpb24pO1xuXHRcdHRoaXMuc2tldGNoLmxpbmUob2xkWCwgb2xkWSwgdGhpcy5YLCB0aGlzLlkpO1xuXHR9XG5cdHNldHVwKCkge1xuXHRcdHRoaXMuWCA9IHRoaXMuc2tldGNoLndpZHRoIC8gMjtcblx0XHR0aGlzLlkgPSB0aGlzLnNrZXRjaC5oZWlnaHQgLyAyO1xuXHRcdHRoaXMuc2tldGNoLmJhY2tncm91bmQodGhpcy5iZ0NvbG9yKTtcblx0XHR0aGlzLnNrZXRjaC5zdHJva2UodGhpcy5zdHJva2VDb2xvcik7XG5cdFx0dGhpcy5za2V0Y2guc3Ryb2tlV2VpZ2h0KHRoaXMuc3Ryb2tlV2lkdGgpO1xuXHR9XG5cdGRyYXcoKSB7XG5cdFx0dGhpcy5zdGVwRHJhdygpO1xuXHR9XG59XG5cblxuY29uc3QgU0NIRU1BX1R1cnRsZSA9IHtcblx0ZG9tYWluOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdTZXF1ZW5jZSBEb21haW4nLFxuXHRcdGRlc2NyaXB0aW9uOiAnQ29tbWEgc2VwZXJhdGVkIG51bWJlcnMnLFxuXHRcdGZvcm1hdDonbGlzdCcsXG5cdFx0ZGVmYXVsdDogXCIwLDEsMiwzLDRcIixcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRyYW5nZToge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdHRpdGxlOiAnQW5nbGVzJyxcblx0XHRkZWZhdWx0OiBcIjMwLDQ1LDYwLDkwLDEyMFwiLFxuXHRcdGZvcm1hdDonbGlzdCcsXG5cdFx0ZGVzY3JpcHRpb246ICdDb21tYSBzZXBlcmF0ZWQgbnVtYmVycycsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcblx0c3RlcFNpemU6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ1N0ZXAgU2l6ZScsXG5cdFx0ZGVmYXVsdDogMjAsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcblx0c3Ryb2tlV2VpZ2h0OiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0bGU6ICdTdHJva2UgV2lkdGgnLFxuXHRcdGRlZmF1bHQ6IDUsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcblx0c3RhcnRpbmdYOiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0ZTogJ1ggc3RhcnQnXG5cdH0sXG5cdHN0YXJ0aW5nWToge1xuXHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdHRpdGU6ICdZIHN0YXJ0J1xuXHR9LFxuXHRiZ0NvbG9yOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdCYWNrZ3JvdW5kIENvbG9yJyxcblx0XHRmb3JtYXQ6ICdjb2xvcicsXG5cdFx0ZGVmYXVsdDogXCIjNjY2NjY2XCIsXG5cdFx0cmVxdWlyZWQ6IGZhbHNlXG5cdH0sXG5cdHN0cm9rZUNvbG9yOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdTdHJva2UgQ29sb3InLFxuXHRcdGZvcm1hdDogJ2NvbG9yJyxcblx0XHRkZWZhdWx0OiAnI2ZmMDAwMCcsXG5cdFx0cmVxdWlyZWQ6IGZhbHNlXG5cdH0sXG5cdHRlc3RUaGluZzoge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdHRpdGxlOiAnaGVsbG8nLFxuXHRcdGZvcmFtdDogJ2xpc3QnXG5cdH1cbn07XG5cbmNvbnN0IE1PRFVMRV9UdXJ0bGUgPSB7XG5cdHZpejogVklaX1R1cnRsZSxcblx0bmFtZTogXCJUdXJ0bGVcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdGNvbmZpZ1NjaGVtYTogU0NIRU1BX1R1cnRsZVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9UdXJ0bGU7IiwiLy9BZGQgYW4gaW1wb3J0IGxpbmUgaGVyZSBmb3IgbmV3IG1vZHVsZXNcblxuXG4vL0FkZCBuZXcgbW9kdWxlcyB0byB0aGlzIGNvbnN0YW50LlxuY29uc3QgTU9EVUxFUyA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRVM7XG5cbi8qanNoaW50IGlnbm9yZTpzdGFydCAqL1xuTU9EVUxFU1tcIlR1cnRsZVwiXSA9IHJlcXVpcmUoJy4vbW9kdWxlVHVydGxlLmpzJyk7XG5NT0RVTEVTW1wiU2hpZnRDb21wYXJlXCJdID0gcmVxdWlyZSgnLi9tb2R1bGVTaGlmdENvbXBhcmUuanMnKTtcbk1PRFVMRVNbXCJEaWZmZXJlbmNlc1wiXSA9IHJlcXVpcmUoJy4vbW9kdWxlRGlmZmVyZW5jZXMuanMnKTtcbk1PRFVMRVNbXCJNb2RGaWxsXCJdID0gcmVxdWlyZSgnLi9tb2R1bGVNb2RGaWxsLmpzJyk7IiwiXG5TRVFfbGluZWFyUmVjdXJyZW5jZSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VMaW5SZWMuanMnKTtcblxuZnVuY3Rpb24gR0VOX2ZpYm9uYWNjaSh7XG4gICAgbVxufSkge1xuICAgIHJldHVybiBTRVFfbGluZWFyUmVjdXJyZW5jZS5nZW5lcmF0b3Ioe1xuICAgICAgICBjb2VmZmljaWVudExpc3Q6IFsxLCAxXSxcbiAgICAgICAgc2VlZExpc3Q6IFsxLCAxXSxcbiAgICAgICAgbVxuICAgIH0pO1xufVxuXG5jb25zdCBTQ0hFTUFfRmlib25hY2NpPSB7XG4gICAgbToge1xuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgdGl0bGU6ICdNb2QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0EgbnVtYmVyIHRvIG1vZCB0aGUgc2VxdWVuY2UgYnkgYnknLFxuICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICB9XG59O1xuXG5cbmNvbnN0IFNFUV9maWJvbmFjY2kgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fZmlib25hY2NpLFxuXHRuYW1lOiBcIkZpYm9uYWNjaVwiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfRmlib25hY2NpXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNFUV9maWJvbmFjY2k7IiwiXG5cbmZ1bmN0aW9uIEdFTl9saW5lYXJSZWN1cnJlbmNlKHtcbiAgICBjb2VmZmljaWVudExpc3QsXG4gICAgc2VlZExpc3QsXG4gICAgbVxufSkge1xuICAgIGlmIChjb2VmZmljaWVudExpc3QubGVuZ3RoICE9IHNlZWRMaXN0Lmxlbmd0aCkge1xuICAgICAgICAvL051bWJlciBvZiBzZWVkcyBzaG91bGQgbWF0Y2ggdGhlIG51bWJlciBvZiBjb2VmZmljaWVudHNcbiAgICAgICAgY29uc29sZS5sb2coXCJudW1iZXIgb2YgY29lZmZpY2llbnRzIG5vdCBlcXVhbCB0byBudW1iZXIgb2Ygc2VlZHMgXCIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbGV0IGsgPSBjb2VmZmljaWVudExpc3QubGVuZ3RoO1xuICAgIGlmIChtICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb2VmZmljaWVudExpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvZWZmaWNpZW50TGlzdFtpXSA9IGNvZWZmaWNpZW50TGlzdFtpXSAlIG07XG4gICAgICAgICAgICBzZWVkTGlzdFtpXSA9IHNlZWRMaXN0W2ldICUgbTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJpY0xpblJlYyA9IGZ1bmN0aW9uIChuLCBjYWNoZSkge1xuICAgICAgICAgICAgaWYoIG4gPCBzZWVkTGlzdC5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGNhY2hlW25dID0gc2VlZExpc3Rbbl1cbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVbbl0gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gY2FjaGUubGVuZ3RoOyBpIDw9IG47IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1bSArPSBjYWNoZVtpIC0gaiAtIDFdICogY29lZmZpY2llbnRMaXN0W2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWNoZVtpXSA9IHN1bSAlIG07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVbbl07XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZ2VuZXJpY0xpblJlYyA9IGZ1bmN0aW9uIChuLCBjYWNoZSkge1xuICAgICAgICAgICAgaWYoIG4gPCBzZWVkTGlzdC5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGNhY2hlW25dID0gc2VlZExpc3Rbbl1cbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVbbl0gXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBjYWNoZS5sZW5ndGg7IGkgPD0gbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtICs9IGNhY2hlW2kgLSBqIC0gMV0gKiBjb2VmZmljaWVudExpc3Rbal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhY2hlW2ldID0gc3VtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlW25dO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBnZW5lcmljTGluUmVjXG59XG5cbmNvbnN0IFNDSEVNQV9saW5lYXJSZWN1cnJlbmNlID0ge1xuICAgIGNvZWZmaWNpZW50TGlzdDoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgdGl0bGU6ICdDb2VmZmljaWVudHMgbGlzdCcsXG4gICAgICAgIGZvcm1hdDonbGlzdCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tbWEgc2VwZXJhdGVkIG51bWJlcnMnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgIH0sXG4gICAgc2VlZExpc3Q6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIHRpdGxlOiAnU2VlZCBsaXN0JyxcbiAgICAgICAgZm9ybWF0OidsaXN0JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDb21tYSBzZXBlcmF0ZWQgbnVtYmVycycsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgfSxcbiAgICBtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICB0aXRsZTogJ01vZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBudW1iZXIgdG8gbW9kIHRoZSBzZXF1ZW5jZSBieSBieScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn1cblxuXG5jb25zdCBTRVFfbGluZWFyUmVjdXJyZW5jZSA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9saW5lYXJSZWN1cnJlbmNlLFxuXHRuYW1lOiBcIkxpbmVhciBSZWN1cnJlbmNlXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRwYXJhbXNTY2hlbWE6IFNDSEVNQV9saW5lYXJSZWN1cnJlbmNlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX2xpbmVhclJlY3VycmVuY2UiLCJcbmNvbnN0IFNFUV9saW5lYXJSZWN1cnJlbmNlID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUxpblJlYy5qcycpXG5cbmZ1bmN0aW9uIEdFTl9MdWNhcyh7XG4gICAgbVxufSkge1xuICAgIHJldHVybiBTRVFfbGluZWFyUmVjdXJyZW5jZS5nZW5lcmF0b3Ioe1xuICAgICAgICBjb2VmZmljaWVudExpc3Q6IFsxLCAxXSxcbiAgICAgICAgc2VlZExpc3Q6IFsyLCAxXSxcbiAgICAgICAgbVxuICAgIH0pO1xufVxuXG5jb25zdCBTQ0hFTUFfTHVjYXM9IHtcbiAgICBtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICB0aXRsZTogJ01vZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBudW1iZXIgdG8gbW9kIHRoZSBzZXF1ZW5jZSBieSBieScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn1cblxuXG5jb25zdCBTRVFfTHVjYXMgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fTHVjYXMsXG5cdG5hbWU6IFwiTHVjYXNcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdHBhcmFtc1NjaGVtYTogU0NIRU1BX0x1Y2FzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX0x1Y2FzIiwiXG5cbmZ1bmN0aW9uIEdFTl9OYXR1cmFscyh7XG4gICAgaW5jbHVkZXplcm9cbn0pe1xuICAgIGlmKGluY2x1ZGV6ZXJvKXtcbiAgICAgICAgcmV0dXJuICggKG4pID0+IG4gKVxuICAgIH1cbiAgICBlbHNle1xuICAgICAgICByZXR1cm4gKCAobikgPT4gbiArIDEgKVxuICAgIH1cbn1cblxuY29uc3QgU0NIRU1BX05hdHVyYWxzPSB7XG4gICAgaW5jbHVkZXplcm86IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICB0aXRsZTogJ0luY2x1ZGUgemVybycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcbiAgICAgICAgZGVmYXVsdDogJ2ZhbHNlJyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufVxuXG5cbmNvbnN0IFNFUV9OYXR1cmFscyA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9OYXR1cmFscyxcblx0bmFtZTogXCJOYXR1cmFsc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfTmF0dXJhbHNcbn1cblxuLy8gZXhwb3J0IGRlZmF1bHQgU0VRX05hdHVyYWxzXG5tb2R1bGUuZXhwb3J0cyA9IFNFUV9OYXR1cmFscyIsIlxuXG5mdW5jdGlvbiBHRU5fUHJpbWVzKCkge1xuICAgIGNvbnN0IHByaW1lcyA9IGZ1bmN0aW9uIChuLCBjYWNoZSkge1xuICAgICAgICBpZihjYWNoZS5sZW5ndGggPT0gMCl7XG4gICAgICAgICAgICBjYWNoZS5wdXNoKDIpXG4gICAgICAgICAgICBjYWNoZS5wdXNoKDMpXG4gICAgICAgICAgICBjYWNoZS5wdXNoKDUpXG4gICAgICAgIH1cbiAgICAgICAgbGV0IGkgPSBjYWNoZVtjYWNoZS5sZW5ndGggLSAxXSArIDFcbiAgICAgICAgbGV0IGsgPSAwXG4gICAgICAgIHdoaWxlIChjYWNoZS5sZW5ndGggPD0gbikge1xuICAgICAgICAgICAgbGV0IGlzUHJpbWUgPSB0cnVlXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNhY2hlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgJSBjYWNoZVtqXSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJpbWUgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc1ByaW1lKSB7XG4gICAgICAgICAgICAgICAgY2FjaGUucHVzaChpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWNoZVtuXVxuICAgIH1cbiAgICByZXR1cm4gcHJpbWVzXG59XG5cblxuY29uc3QgU0NIRU1BX1ByaW1lcz0ge1xuICAgIG06IHtcbiAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgIHRpdGxlOiAnTW9kJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBIG51bWJlciB0byBtb2QgdGhlIHNlcXVlbmNlIGJ5JyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufVxuXG5cbmNvbnN0IFNFUV9QcmltZXMgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fUHJpbWVzLFxuXHRuYW1lOiBcIlByaW1lc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfUHJpbWVzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX1ByaW1lcyIsIi8qKlxuICpcbiAqIEBjbGFzcyBTZXF1ZW5jZUdlbmVyYXRvclxuICovXG5jbGFzcyBTZXF1ZW5jZUdlbmVyYXRvciB7XG4gICAgLyoqXG4gICAgICpDcmVhdGVzIGFuIGluc3RhbmNlIG9mIFNlcXVlbmNlR2VuZXJhdG9yLlxuICAgICAqIEBwYXJhbSB7Kn0gZ2VuZXJhdG9yIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIG5hdHVyYWwgbnVtYmVyIGFuZCByZXR1cm5zIGEgbnVtYmVyLCBpdCBjYW4gb3B0aW9uYWxseSB0YWtlIHRoZSBjYWNoZSBhcyBhIHNlY29uZCBhcmd1bWVudFxuICAgICAqIEBwYXJhbSB7Kn0gSUQgdGhlIElEIG9mIHRoZSBzZXF1ZW5jZVxuICAgICAqIEBtZW1iZXJvZiBTZXF1ZW5jZUdlbmVyYXRvclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKElELCBnZW5lcmF0b3IpIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgIHRoaXMuSUQgPSBJRDtcbiAgICAgICAgdGhpcy5jYWNoZSA9IFtdO1xuICAgICAgICB0aGlzLm5ld1NpemUgPSAxO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBpZiB3ZSBuZWVkIHRvIGdldCB0aGUgbnRoIGVsZW1lbnQgYW5kIGl0J3Mgbm90IHByZXNlbnQgaW5cbiAgICAgKiBpbiB0aGUgY2FjaGUsIHRoZW4gd2UgZWl0aGVyIGRvdWJsZSB0aGUgc2l6ZSwgb3IgdGhlIFxuICAgICAqIG5ldyBzaXplIGJlY29tZXMgbisxXG4gICAgICogQHBhcmFtIHsqfSBuIFxuICAgICAqIEBtZW1iZXJvZiBTZXF1ZW5jZUdlbmVyYXRvclxuICAgICAqL1xuICAgIHJlc2l6ZUNhY2hlKG4pIHtcbiAgICAgICAgdGhpcy5uZXdTaXplID0gdGhpcy5jYWNoZS5sZW5ndGggKiAyO1xuICAgICAgICBpZiAobiArIDEgPiB0aGlzLm5ld1NpemUpIHtcbiAgICAgICAgICAgIHRoaXMubmV3U2l6ZSA9IG4gKyAxO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBvcHVsYXRlcyB0aGUgY2FjaGUgdXAgdW50aWwgdGhlIGN1cnJlbnQgbmV3U2l6ZVxuICAgICAqIHRoaXMgaXMgY2FsbGVkIGFmdGVyIHJlc2l6ZUNhY2hlXG4gICAgICogQG1lbWJlcm9mIFNlcXVlbmNlR2VuZXJhdG9yXG4gICAgICovXG4gICAgZmlsbENhY2hlKCkge1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5jYWNoZS5sZW5ndGg7IGkgPCB0aGlzLm5ld1NpemU7IGkrKykge1xuICAgICAgICAgICAgLy90aGUgZ2VuZXJhdG9yIGlzIGdpdmVuIHRoZSBjYWNoZSBzaW5jZSBpdCB3b3VsZCBtYWtlIGNvbXB1dGF0aW9uIG1vcmUgZWZmaWNpZW50IHNvbWV0aW1lc1xuICAgICAgICAgICAgLy9idXQgdGhlIGdlbmVyYXRvciBkb2Vzbid0IG5lY2Vzc2FyaWx5IG5lZWQgdG8gdGFrZSBtb3JlIHRoYW4gb25lIGFyZ3VtZW50LlxuICAgICAgICAgICAgdGhpcy5jYWNoZVtpXSA9IHRoaXMuZ2VuZXJhdG9yKGksIHRoaXMuY2FjaGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBlbGVtZW50IGlzIHdoYXQgdGhlIGRyYXdpbmcgdG9vbHMgd2lsbCBiZSBjYWxsaW5nLCBpdCByZXRyaWV2ZXNcbiAgICAgKiB0aGUgbnRoIGVsZW1lbnQgb2YgdGhlIHNlcXVlbmNlIGJ5IGVpdGhlciBnZXR0aW5nIGl0IGZyb20gdGhlIGNhY2hlXG4gICAgICogb3IgaWYgaXNuJ3QgcHJlc2VudCwgYnkgYnVpbGRpbmcgdGhlIGNhY2hlIGFuZCB0aGVuIGdldHRpbmcgaXRcbiAgICAgKiBAcGFyYW0geyp9IG4gdGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBzZXF1ZW5jZSB3ZSB3YW50XG4gICAgICogQHJldHVybnMgYSBudW1iZXJcbiAgICAgKiBAbWVtYmVyb2YgU2VxdWVuY2VHZW5lcmF0b3JcbiAgICAgKi9cbiAgICBnZXRFbGVtZW50KG4pIHtcbiAgICAgICAgaWYgKHRoaXMuY2FjaGVbbl0gIT0gdW5kZWZpbmVkIHx8IHRoaXMuZmluaXRlKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImNhY2hlIGhpdFwiKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImNhY2hlIG1pc3NcIilcbiAgICAgICAgICAgIHRoaXMucmVzaXplQ2FjaGUobik7XG4gICAgICAgICAgICB0aGlzLmZpbGxDYWNoZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuLyoqXG4gKlxuICpcbiAqIEBwYXJhbSB7Kn0gY29kZSBhcmJpdHJhcnkgc2FnZSBjb2RlIHRvIGJlIGV4ZWN1dGVkIG9uIGFsZXBoXG4gKiBAcmV0dXJucyBhamF4IHJlc3BvbnNlIG9iamVjdFxuICovXG5mdW5jdGlvbiBzYWdlRXhlY3V0ZShjb2RlKSB7XG4gICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgYXN5bmM6IGZhbHNlLFxuICAgICAgICB1cmw6ICdodHRwOi8vYWxlcGguc2FnZW1hdGgub3JnL3NlcnZpY2UnLFxuICAgICAgICBkYXRhOiBcImNvZGU9XCIgKyBjb2RlXG4gICAgfSk7XG59XG5cbi8qKlxuICpcbiAqXG4gKiBAcGFyYW0geyp9IGNvZGUgYXJiaXRyYXJ5IHNhZ2UgY29kZSB0byBiZSBleGVjdXRlZCBvbiBhbGVwaFxuICogQHJldHVybnMgYWpheCByZXNwb25zZSBvYmplY3RcbiAqL1xuYXN5bmMgZnVuY3Rpb24gc2FnZUV4ZWN1dGVBc3luYyhjb2RlKSB7XG4gICAgcmV0dXJuIGF3YWl0ICQuYWpheCh7XG4gICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgdXJsOiAnaHR0cDovL2FsZXBoLnNhZ2VtYXRoLm9yZy9zZXJ2aWNlJyxcbiAgICAgICAgZGF0YTogXCJjb2RlPVwiICsgY29kZVxuICAgIH0pO1xufVxuXG5cbmNsYXNzIE9FSVNTZXF1ZW5jZUdlbmVyYXRvciB7XG4gICAgY29uc3RydWN0b3IoSUQsIE9FSVMpIHtcbiAgICAgICAgdGhpcy5PRUlTID0gT0VJUztcbiAgICAgICAgdGhpcy5JRCA9IElEO1xuICAgICAgICB0aGlzLmNhY2hlID0gW107XG4gICAgICAgIHRoaXMubmV3U2l6ZSA9IDE7XG4gICAgICAgIHRoaXMucHJlZmlsbENhY2hlKCk7XG4gICAgfVxuICAgIG9laXNGZXRjaChuKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRmV0Y2hpbmcuLlwiKTtcbiAgICAgICAgbGV0IGNvZGUgPSBgcHJpbnQoc2xvYW5lLiR7dGhpcy5PRUlTfS5saXN0KCR7bn0pKWA7XG4gICAgICAgIGxldCByZXNwID0gc2FnZUV4ZWN1dGUoY29kZSk7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3AucmVzcG9uc2VKU09OLnN0ZG91dCk7XG4gICAgfVxuICAgIGFzeW5jIHByZWZpbGxDYWNoZSgpIHtcbiAgICAgICAgdGhpcy5yZXNpemVDYWNoZSgzMDAwKTtcbiAgICAgICAgbGV0IGNvZGUgPSBgcHJpbnQoc2xvYW5lLiR7dGhpcy5PRUlTfS5saXN0KCR7dGhpcy5uZXdTaXplfSkpYDtcbiAgICAgICAgbGV0IHJlc3AgPSBhd2FpdCBzYWdlRXhlY3V0ZUFzeW5jKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgICAgdGhpcy5jYWNoZSA9IHRoaXMuY2FjaGUuY29uY2F0KEpTT04ucGFyc2UocmVzcC5zdGRvdXQpKTtcbiAgICB9XG4gICAgcmVzaXplQ2FjaGUobikge1xuICAgICAgICB0aGlzLm5ld1NpemUgPSB0aGlzLmNhY2hlLmxlbmd0aCAqIDI7XG4gICAgICAgIGlmIChuICsgMSA+IHRoaXMubmV3U2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5uZXdTaXplID0gbiArIDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmlsbENhY2hlKCkge1xuICAgICAgICBsZXQgbmV3TGlzdCA9IHRoaXMub2Vpc0ZldGNoKHRoaXMubmV3U2l6ZSk7XG4gICAgICAgIHRoaXMuY2FjaGUgPSB0aGlzLmNhY2hlLmNvbmNhdChuZXdMaXN0KTtcbiAgICB9XG4gICAgZ2V0RWxlbWVudChuKSB7XG4gICAgICAgIGlmICh0aGlzLmNhY2hlW25dICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZUNhY2hlKCk7XG4gICAgICAgICAgICB0aGlzLmZpbGxDYWNoZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIEJ1aWx0SW5OYW1lVG9TZXEoSUQsIHNlcU5hbWUsIHNlcVBhcmFtcykge1xuICAgIGxldCBnZW5lcmF0b3IgPSBCdWlsdEluU2Vxc1tzZXFOYW1lXS5nZW5lcmF0b3Ioc2VxUGFyYW1zKTtcbiAgICByZXR1cm4gbmV3IFNlcXVlbmNlR2VuZXJhdG9yKElELCBnZW5lcmF0b3IpO1xufVxuXG5cbmZ1bmN0aW9uIExpc3RUb1NlcShJRCwgbGlzdCkge1xuICAgIGxldCBsaXN0R2VuZXJhdG9yID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgcmV0dXJuIGxpc3Rbbl07XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFNlcXVlbmNlR2VuZXJhdG9yKElELCBsaXN0R2VuZXJhdG9yKTtcbn1cblxuZnVuY3Rpb24gT0VJU1RvU2VxKElELCBPRUlTKSB7XG4gICAgcmV0dXJuIG5ldyBPRUlTU2VxdWVuY2VHZW5lcmF0b3IoSUQsIE9FSVMpO1xufVxuXG5cbmNvbnN0IEJ1aWx0SW5TZXFzID0ge307XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ0J1aWx0SW5OYW1lVG9TZXEnOiBCdWlsdEluTmFtZVRvU2VxLFxuICAgICdMaXN0VG9TZXEnOiBMaXN0VG9TZXEsXG4gICAgJ09FSVNUb1NlcSc6IE9FSVNUb1NlcSxcbiAgICAnQnVpbHRJblNlcXMnOiBCdWlsdEluU2Vxc1xufTtcblxuLypqc2hpbnQgaWdub3JlOiBzdGFydCAqL1xuQnVpbHRJblNlcXNbXCJGaWJvbmFjY2lcIl0gPSByZXF1aXJlKCcuL3NlcXVlbmNlRmlib25hY2NpLmpzJyk7XG5CdWlsdEluU2Vxc1tcIkx1Y2FzXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUx1Y2FzLmpzJyk7XG5CdWlsdEluU2Vxc1tcIlByaW1lc1wiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VQcmltZXMuanMnKTtcbkJ1aWx0SW5TZXFzW1wiTmF0dXJhbHNcIl0gPSByZXF1aXJlKCcuL3NlcXVlbmNlTmF0dXJhbHMuanMnKTtcbkJ1aWx0SW5TZXFzW1wiTGluUmVjXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUxpblJlYy5qcycpO1xuQnVpbHRJblNlcXNbJ1ByaW1lcyddID0gcmVxdWlyZSgnLi9zZXF1ZW5jZVByaW1lcy5qcycpOyIsIm1vZHVsZS5leHBvcnRzID0gW1wiQTAwMDAwMVwiLCBcIkEwMDAwMjdcIiwgXCJBMDAwMDA0XCIsIFwiQTAwMDAwNVwiLCBcIkEwMDAwMDhcIiwgXCJBMDAwMDA5XCIsIFwiQTAwMDc5NlwiLCBcIkEwMDM0MThcIiwgXCJBMDA3MzE4XCIsIFwiQTAwODI3NVwiLCBcIkEwMDgyNzdcIiwgXCJBMDQ5MzEwXCIsIFwiQTAwMDAxMFwiLCBcIkEwMDAwMDdcIiwgXCJBMDA1ODQzXCIsIFwiQTAwMDAzNVwiLCBcIkEwMDAxNjlcIiwgXCJBMDAwMjcyXCIsIFwiQTAwMDMxMlwiLCBcIkEwMDE0NzdcIiwgXCJBMDA0NTI2XCIsIFwiQTAwMDMyNlwiLCBcIkEwMDIzNzhcIiwgXCJBMDAyNjIwXCIsIFwiQTAwNTQwOFwiLCBcIkEwMDAwMTJcIiwgXCJBMDAwMTIwXCIsIFwiQTAxMDA2MFwiLCBcIkEwMDAwNjlcIiwgXCJBMDAxOTY5XCIsIFwiQTAwMDI5MFwiLCBcIkEwMDAyMjVcIiwgXCJBMDAwMDE1XCIsIFwiQTAwMDAxNlwiLCBcIkEwMDAwMzJcIiwgXCJBMDA0MDg2XCIsIFwiQTAwMjExM1wiLCBcIkEwMDAwMzBcIiwgXCJBMDAwMDQwXCIsIFwiQTAwMjgwOFwiLCBcIkEwMTgyNTJcIiwgXCJBMDAwMDQzXCIsIFwiQTAwMDY2OFwiLCBcIkEwMDAzOTZcIiwgXCJBMDA1MTAwXCIsIFwiQTAwNTEwMVwiLCBcIkEwMDIxMTBcIiwgXCJBMDAwNzIwXCIsIFwiQTA2NDU1M1wiLCBcIkEwMDEwNTVcIiwgXCJBMDA2NTMwXCIsIFwiQTAwMDk2MVwiLCBcIkEwMDUxMTdcIiwgXCJBMDIwNjM5XCIsIFwiQTAwMDA0MVwiLCBcIkEwMDAwNDVcIiwgXCJBMDAwMTA4XCIsIFwiQTAwMTAwNlwiLCBcIkEwMDAwNzlcIiwgXCJBMDAwNTc4XCIsIFwiQTAwMDI0NFwiLCBcIkEwMDAzMDJcIiwgXCJBMDAwNTgzXCIsIFwiQTAwMDE0MlwiLCBcIkEwMDAwODVcIiwgXCJBMDAxMTg5XCIsIFwiQTAwMDY3MFwiLCBcIkEwMDYzMThcIiwgXCJBMDAwMTY1XCIsIFwiQTAwMTE0N1wiLCBcIkEwMDY4ODJcIiwgXCJBMDAwOTg0XCIsIFwiQTAwMTQwNVwiLCBcIkEwMDAyOTJcIiwgXCJBMDAwMzMwXCIsIFwiQTAwMDE1M1wiLCBcIkEwMDAyNTVcIiwgXCJBMDAwMjYxXCIsIFwiQTAwMTkwOVwiLCBcIkEwMDE5MTBcIiwgXCJBMDkwMDEwXCIsIFwiQTA1NTc5MFwiLCBcIkEwOTAwMTJcIiwgXCJBMDkwMDEzXCIsIFwiQTA5MDAxNFwiLCBcIkEwOTAwMTVcIiwgXCJBMDkwMDE2XCIsIFwiQTAwMDE2NlwiLCBcIkEwMDAyMDNcIiwgXCJBMDAxMTU3XCIsIFwiQTAwODY4M1wiLCBcIkEwMDAyMDRcIiwgXCJBMDAwMjE3XCIsIFwiQTAwMDEyNFwiLCBcIkEwMDIyNzVcIiwgXCJBMDAxMTEwXCIsIFwiQTA1MTk1OVwiLCBcIkEwMDEyMjFcIiwgXCJBMDAxMjIyXCIsIFwiQTA0NjY2MFwiLCBcIkEwMDEyMjdcIiwgXCJBMDAxMzU4XCIsIFwiQTAwMTY5NFwiLCBcIkEwMDE4MzZcIiwgXCJBMDAxOTA2XCIsIFwiQTAwMTMzM1wiLCBcIkEwMDEwNDVcIiwgXCJBMDAwMTI5XCIsIFwiQTAwMTEwOVwiLCBcIkEwMTU1MjFcIiwgXCJBMDE1NTIzXCIsIFwiQTAxNTUzMFwiLCBcIkEwMTU1MzFcIiwgXCJBMDE1NTUxXCIsIFwiQTA4MjQxMVwiLCBcIkEwODMxMDNcIiwgXCJBMDgzMTA0XCIsIFwiQTA4MzEwNVwiLCBcIkEwODMyMTZcIiwgXCJBMDYxMDg0XCIsIFwiQTAwMDIxM1wiLCBcIkEwMDAwNzNcIiwgXCJBMDc5OTIyXCIsIFwiQTA3OTkyM1wiLCBcIkExMDk4MTRcIiwgXCJBMTExNzc0XCIsIFwiQTExMTc3NVwiLCBcIkExMTE3ODdcIiwgXCJBMDAwMTEwXCIsIFwiQTAwMDU4N1wiLCBcIkEwMDAxMDBcIl1cbiJdfQ==
