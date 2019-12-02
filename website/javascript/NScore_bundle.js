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
				seqObj.parameters = validationResult.parsedFields;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvTlNjb3JlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L1ZhbGlkYXRpb24uanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVEaWZmZXJlbmNlcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9tb2R1bGVzL21vZHVsZU1vZEZpbGwuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVTaGlmdENvbXBhcmUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVUdXJ0bGUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZUZpYm9uYWNjaS5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9zZXF1ZW5jZXMvc2VxdWVuY2VMaW5SZWMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvc2VxdWVuY2VzL3NlcXVlbmNlTHVjYXMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvc2VxdWVuY2VzL3NlcXVlbmNlTmF0dXJhbHMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvc2VxdWVuY2VzL3NlcXVlbmNlUHJpbWVzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZXMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvdmFsaWRPRUlTLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFLQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLypqc2hpbnQgbWF4ZXJyOiAxMDAwMCAqL1xuXG5TRVFVRU5DRSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VzL3NlcXVlbmNlcy5qcycpO1xuTU9EVUxFUyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9tb2R1bGVzLmpzJyk7XG5WYWxpZGF0aW9uID0gcmVxdWlyZSgnLi9WYWxpZGF0aW9uLmpzJyk7XG5cbkJ1aWx0SW5TZXFzID0gU0VRVUVOQ0UuQnVpbHRJblNlcXM7XG5MaXN0VG9TZXEgPSBTRVFVRU5DRS5MaXN0VG9TZXE7XG5PRUlTVG9TZXEgPSBTRVFVRU5DRS5PRUlTVG9TZXE7XG5CdWlsdEluTmFtZVRvU2VxID0gU0VRVUVOQ0UuQnVpbHRJbk5hbWVUb1NlcTtcblxuZnVuY3Rpb24gc3RyaW5nVG9BcnJheShzdHJBcnIpIHtcblx0cmV0dXJuIEpTT04ucGFyc2UoXCJbXCIgKyBzdHJBcnIgKyBcIl1cIik7XG59XG5cbmNvbnN0IE5TY29yZSA9IGZ1bmN0aW9uICgpIHtcblx0Y29uc3QgbW9kdWxlcyA9IE1PRFVMRVM7IC8vICBjbGFzc2VzIHRvIHRoZSBkcmF3aW5nIG1vZHVsZXNcblx0Y29uc3QgdmFsaWRPRUlTID0gVkFMSURPRUlTO1xuXHR2YXIgcHJlcGFyZWRTZXF1ZW5jZXMgPSBbXTsgLy8gc2VxdWVuY2VHZW5lcmF0b3JzIHRvIGJlIGRyYXduXG5cdHZhciBwcmVwYXJlZFRvb2xzID0gW107IC8vIGNob3NlbiBkcmF3aW5nIG1vZHVsZXMgXG5cdHZhciBsaXZlU2tldGNoZXMgPSBbXTsgLy8gcDUgc2tldGNoZXMgYmVpbmcgZHJhd25cblxuXHQvKipcblx0ICpcblx0ICpcblx0ICogQHBhcmFtIHsqfSBtb2R1bGVDbGFzcyBkcmF3aW5nIG1vZHVsZSB0byBiZSB1c2VkIGZvciB0aGlzIHNrZXRjaFxuXHQgKiBAcGFyYW0geyp9IGNvbmZpZyBjb3JyZXNwb25kaW5nIGNvbmZpZyBmb3IgZHJhd2luZyBtb2R1bGVcblx0ICogQHBhcmFtIHsqfSBzZXEgc2VxdWVuY2UgdG8gYmUgcGFzc2VkIHRvIGRyYXdpbmcgbW9kdWxlXG5cdCAqIEBwYXJhbSB7Kn0gZGl2SUQgZGl2IHdoZXJlIHNrZXRjaCB3aWxsIGJlIHBsYWNlZFxuXHQgKiBAcGFyYW0geyp9IHdpZHRoIHdpZHRoIG9mIHNrZXRjaFxuXHQgKiBAcGFyYW0geyp9IGhlaWdodCBoZWlnaHQgb2Ygc2tldGNoXG5cdCAqIEByZXR1cm5zIHA1IHNrZXRjaFxuXHQgKi9cblx0Y29uc3QgZ2VuZXJhdGVQNSA9IGZ1bmN0aW9uIChtb2R1bGVDbGFzcywgY29uZmlnLCBzZXEsIGRpdklELCB3aWR0aCwgaGVpZ2h0KSB7XG5cblx0XHQvL0NyZWF0ZSBjYW52YXMgZWxlbWVudCBoZXJlXG5cdFx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdC8vVGhlIHN0eWxlIG9mIHRoZSBjYW52YXNlcyB3aWxsIGJlIFwiY2FudmFzQ2xhc3NcIlxuXHRcdGRpdi5jbGFzc05hbWUgPSBcImNhbnZhc0NsYXNzXCI7XG5cdFx0ZGl2LmlkID0gXCJsaXZlQ2FudmFzXCIgKyBkaXZJRDtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc0FyZWFcIikuYXBwZW5kQ2hpbGQoZGl2KTtcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQvL0NyZWF0ZSBQNWpzIGluc3RhbmNlXG5cdFx0bGV0IG15cDUgPSBuZXcgcDUoZnVuY3Rpb24gKHNrZXRjaCkge1xuXHRcdFx0bGV0IG1vZHVsZUluc3RhbmNlID0gbmV3IG1vZHVsZUNsYXNzKHNlcSwgc2tldGNoLCBjb25maWcpO1xuXHRcdFx0c2tldGNoLnNldHVwID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRza2V0Y2guY3JlYXRlQ2FudmFzKHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0XHRza2V0Y2guYmFja2dyb3VuZChcIndoaXRlXCIpO1xuXHRcdFx0XHRtb2R1bGVJbnN0YW5jZS5zZXR1cCgpO1xuXHRcdFx0fTtcblxuXHRcdFx0c2tldGNoLmRyYXcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdG1vZHVsZUluc3RhbmNlLmRyYXcoKTtcblx0XHRcdH07XG5cdFx0fSwgZGl2LmlkKTtcblx0XHRyZXR1cm4gbXlwNTtcblx0fTtcblxuXHQvKipcblx0ICogV2hlbiB0aGUgdXNlciBjaG9vc2VzIGEgZHJhd2luZyBtb2R1bGUgYW5kIHByb3ZpZGVzIGNvcnJlc3BvbmRpbmcgY29uZmlnXG5cdCAqIGl0IHdpbGwgYXV0b21hdGljYWxseSBiZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiwgd2hpY2ggd2lsbCB2YWxpZGF0ZSBpbnB1dFxuXHQgKiBhbmQgYXBwZW5kIGl0IHRvIHRoZSBwcmVwYXJlZCB0b29sc1xuXHQgKiBAcGFyYW0geyp9IG1vZHVsZU9iaiBpbmZvcm1hdGlvbiB1c2VkIHRvIHByZXBhcmUgdGhlIHJpZ2h0IGRyYXdpbmcgbW9kdWxlLCB0aGlzIGlucHV0XG5cdCAqIHRoaXMgd2lsbCBjb250YWluIGFuIElELCB0aGUgbW9kdWxlS2V5IHdoaWNoIHNob3VsZCBtYXRjaCBhIGtleSBpbiBNT0RVTEVTX0pTT04sIGFuZFxuXHQgKiBhIGNvbmZpZyBvYmplY3QuXG5cdCAqL1xuXHRjb25zdCByZWNlaXZlTW9kdWxlID0gZnVuY3Rpb24gKG1vZHVsZU9iaikge1xuXHRcdGlmICgobW9kdWxlT2JqLklEICYmIG1vZHVsZU9iai5tb2R1bGVLZXkgJiYgbW9kdWxlT2JqLmNvbmZpZyAmJiBtb2R1bGVzW21vZHVsZU9iai5tb2R1bGVLZXldKSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJPbmUgb3IgbW9yZSB1bmRlZmluZWQgbW9kdWxlIHByb3BlcnRpZXMgcmVjZWl2ZWQgaW4gTlNjb3JlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YWxpZGF0aW9uUmVzdWx0ID0gVmFsaWRhdGlvbi5tb2R1bGUobW9kdWxlT2JqKTtcblx0XHRcdGlmICh2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5sZW5ndGggIT0gMCkge1xuXHRcdFx0XHRwcmVwYXJlZFRvb2xzW21vZHVsZU9iai5JRF0gPSBudWxsO1xuXHRcdFx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdC5lcnJvcnM7XG5cdFx0XHR9XG5cdFx0XHRtb2R1bGVPYmouY29uZmlnID0gdmFsaWRhdGlvblJlc3VsdC5wYXJzZWRGaWVsZHM7XG5cdFx0XHRwcmVwYXJlZFRvb2xzW21vZHVsZU9iai5JRF0gPSB7XG5cdFx0XHRcdG1vZHVsZTogbW9kdWxlc1ttb2R1bGVPYmoubW9kdWxlS2V5XSxcblx0XHRcdFx0Y29uZmlnOiBtb2R1bGVPYmouY29uZmlnLFxuXHRcdFx0XHRJRDogbW9kdWxlT2JqLklEXG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBXaGVuIHRoZSB1c2VyIGNob29zZXMgYSBzZXF1ZW5jZSwgd2Ugd2lsbCBhdXRvbWF0aWNhbGx5IHBhc3MgaXQgdG8gdGhpcyBmdW5jdGlvblxuXHQgKiB3aGljaCB3aWxsIHZhbGlkYXRlIHRoZSBpbnB1dCwgYW5kIHRoZW4gZGVwZW5kaW5nIG9uIHRoZSBpbnB1dCB0eXBlLCBpdCB3aWxsIHByZXBhcmVcblx0ICogdGhlIHNlcXVlbmNlIGluIHNvbWUgd2F5IHRvIGdldCBhIHNlcXVlbmNlR2VuZXJhdG9yIG9iamVjdCB3aGljaCB3aWxsIGJlIGFwcGVuZGVkXG5cdCAqIHRvIHByZXBhcmVkU2VxdWVuY2VzXG5cdCAqIEBwYXJhbSB7Kn0gc2VxT2JqIGluZm9ybWF0aW9uIHVzZWQgdG8gcHJlcGFyZSB0aGUgcmlnaHQgc2VxdWVuY2UsIHRoaXMgd2lsbCBjb250YWluIGFcblx0ICogc2VxdWVuY2UgSUQsIHRoZSB0eXBlIG9mIGlucHV0LCBhbmQgdGhlIGlucHV0IGl0c2VsZiAoc2VxdWVuY2UgbmFtZSwgYSBsaXN0LCBhbiBPRUlTIG51bWJlci4uZXRjKS5cblx0ICovXG5cdGNvbnN0IHJlY2VpdmVTZXF1ZW5jZSA9IGZ1bmN0aW9uIChzZXFPYmopIHtcblx0XHRpZiAoKHNlcU9iai5JRCAmJiBzZXFPYmouaW5wdXRUeXBlICYmIHNlcU9iai5pbnB1dFZhbHVlICYmIHNlcU9iai5wYXJhbWV0ZXJzKSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJPbmUgb3IgbW9yZSB1bmRlZmluZWQgbW9kdWxlIHByb3BlcnRpZXMgcmVjZWl2ZWQgaW4gTlNjb3JlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBXZSB3aWxsIHByb2Nlc3MgZGlmZmVyZW50IGlucHV0cyBpbiBkaWZmZXJlbnQgd2F5c1xuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJidWlsdEluXCIpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdCA9IFZhbGlkYXRpb24uYnVpbHRJbihzZXFPYmopO1xuXHRcdFx0XHRpZiAodmFsaWRhdGlvblJlc3VsdC5lcnJvcnMubGVuZ3RoICE9IDApIHtcblx0XHRcdFx0XHRwcmVwYXJlZFNlcXVlbmNlc1tzZXFPYmouSURdID0gbnVsbDtcblx0XHRcdFx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdC5lcnJvcnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0c2VxT2JqLnBhcmFtZXRlcnMgPSB2YWxpZGF0aW9uUmVzdWx0LnBhcnNlZEZpZWxkcztcblx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbc2VxT2JqLklEXSA9IEJ1aWx0SW5OYW1lVG9TZXEoc2VxT2JqLklELCBzZXFPYmouaW5wdXRWYWx1ZSwgc2VxT2JqLnBhcmFtZXRlcnMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJPRUlTXCIpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdCA9IFZhbGlkYXRpb24ub2VpcyhzZXFPYmopO1xuXHRcdFx0XHRpZiAodmFsaWRhdGlvblJlc3VsdC5lcnJvcnMubGVuZ3RoICE9IDApIHtcblx0XHRcdFx0XHRwcmVwYXJlZFNlcXVlbmNlc1tzZXFPYmouSURdID0gbnVsbDtcblx0XHRcdFx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdC5lcnJvcnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbc2VxT2JqLklEXSA9IE9FSVNUb1NlcShzZXFPYmouSUQsIHNlcU9iai5pbnB1dFZhbHVlKTtcblx0XHRcdH1cblx0XHRcdGlmIChzZXFPYmouaW5wdXRUeXBlID09IFwibGlzdFwiKSB7XG5cdFx0XHRcdHZhbGlkYXRpb25SZXN1bHQgPSBWYWxpZGF0aW9uLmxpc3Qoc2VxT2JqKTtcblx0XHRcdFx0aWYgKHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLmxlbmd0aCAhPSAwKSB7XG5cdFx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbc2VxT2JqLklEXSA9IG51bGw7XG5cdFx0XHRcdFx0cmV0dXJuIHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHByZXBhcmVkU2VxdWVuY2VzW3NlcU9iai5JRF0gPSBMaXN0VG9TZXEoc2VxT2JqLklELCBzZXFPYmouaW5wdXRWYWx1ZSk7XG5cblx0XHRcdH1cblx0XHRcdGlmIChzZXFPYmouaW5wdXRUeXBlID09IFwiY29kZVwiKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXHQvKipcblx0ICogV2UgaW5pdGlhbGl6ZSB0aGUgZHJhd2luZyBwcm9jZXNzaW5nLiBGaXJzdCB3ZSBjYWxjdWxhdGUgdGhlIGRpbWVuc2lvbnMgb2YgZWFjaCBza2V0Y2hcblx0ICogdGhlbiB3ZSBwYWlyIHVwIHNlcXVlbmNlcyBhbmQgZHJhd2luZyBtb2R1bGVzLCBhbmQgZmluYWxseSB3ZSBwYXNzIHRoZW0gdG8gZ2VuZXJhdGVQNVxuXHQgKiB3aGljaCBhY3R1YWxseSBpbnN0YW50aWF0ZXMgZHJhd2luZyBtb2R1bGVzIGFuZCBiZWdpbnMgZHJhd2luZy5cblx0ICogXG5cdCAqIEBwYXJhbSB7Kn0gc2VxVml6UGFpcnMgYSBsaXN0IG9mIHBhaXJzIHdoZXJlIGVhY2ggcGFpciBjb250YWlucyBhbiBJRCBvZiBhIHNlcXVlbmNlXG5cdCAqIGFuZCBhbiBJRCBvZiBhIGRyYXdpbmcgdG9vbCwgdGhpcyBsZXRzIHVzIGtub3cgdG8gcGFzcyB3aGljaCBzZXF1ZW5jZSB0byB3aGljaFxuXHQgKiBkcmF3aW5nIHRvb2wuXG5cdCAqL1xuXHRjb25zdCBiZWdpbiA9IGZ1bmN0aW9uIChzZXFWaXpQYWlycykge1xuXHRcdGhpZGVMb2coKTtcblxuXHRcdC8vRmlndXJpbmcgb3V0IGxheW91dFxuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRsZXQgdG90YWxXaWR0aCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXNBcmVhJykub2Zmc2V0V2lkdGg7XG5cdFx0bGV0IHRvdGFsSGVpZ2h0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhc0FyZWEnKS5vZmZzZXRIZWlnaHQ7XG5cdFx0bGV0IGNhbnZhc0NvdW50ID0gc2VxVml6UGFpcnMubGVuZ3RoO1xuXHRcdGxldCBncmlkU2l6ZSA9IE1hdGguY2VpbChNYXRoLnNxcnQoY2FudmFzQ291bnQpKTtcblx0XHRsZXQgaW5kaXZpZHVhbFdpZHRoID0gdG90YWxXaWR0aCAvIGdyaWRTaXplIC0gMjA7XG5cdFx0bGV0IGluZGl2aWR1YWxIZWlnaHQgPSB0b3RhbEhlaWdodCAvIGdyaWRTaXplO1xuXHRcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRcdGZvciAobGV0IHBhaXIgb2Ygc2VxVml6UGFpcnMpIHtcblx0XHRcdGxldCBjdXJyZW50U2VxID0gcHJlcGFyZWRTZXF1ZW5jZXNbcGFpci5zZXFJRF07XG5cdFx0XHRsZXQgY3VycmVudFRvb2wgPSBwcmVwYXJlZFRvb2xzW3BhaXIudG9vbElEXTtcblx0XHRcdGlmIChjdXJyZW50U2VxICYmIGN1cnJlbnRUb29sID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKFwidW5kZWZpbmVkIElEIGZvciB0b29sIG9yIHNlcXVlbmNlXCIpO1xuXHRcdFx0fVxuXHRcdFx0bGl2ZVNrZXRjaGVzLnB1c2goZ2VuZXJhdGVQNShjdXJyZW50VG9vbC5tb2R1bGUudml6LCBjdXJyZW50VG9vbC5jb25maWcsIGN1cnJlbnRTZXEsIGxpdmVTa2V0Y2hlcy5sZW5ndGgsIGluZGl2aWR1YWxXaWR0aCwgaW5kaXZpZHVhbEhlaWdodCkpO1xuXHRcdH1cblx0fTtcblxuXHRjb25zdCBjbGVhciA9IGZ1bmN0aW9uICgpIHtcblx0XHRzaG93TG9nKCk7XG5cdFx0aWYgKGxpdmVTa2V0Y2hlcy5sZW5ndGggPT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxpdmVTa2V0Y2hlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRsaXZlU2tldGNoZXNbaV0ucmVtb3ZlKCk7IC8vZGVsZXRlIGNhbnZhcyBlbGVtZW50XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdGNvbnN0IHBhdXNlID0gZnVuY3Rpb24gKCkge1xuXHRcdGxpdmVTa2V0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChza2V0Y2gpIHtcblx0XHRcdHNrZXRjaC5ub0xvb3AoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjb25zdCByZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0bGl2ZVNrZXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKHNrZXRjaCkge1xuXHRcdFx0c2tldGNoLmxvb3AoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjb25zdCBzdGVwID0gZnVuY3Rpb24gKCkge1xuXHRcdGxpdmVTa2V0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChza2V0Y2gpIHtcblx0XHRcdHNrZXRjaC5yZWRyYXcoKTtcblx0XHR9KTtcblx0fTtcblxuXHRyZXR1cm4ge1xuXHRcdHJlY2VpdmVTZXF1ZW5jZTogcmVjZWl2ZVNlcXVlbmNlLFxuXHRcdHJlY2VpdmVNb2R1bGU6IHJlY2VpdmVNb2R1bGUsXG5cdFx0bGl2ZVNrZXRjaGVzOiBsaXZlU2tldGNoZXMsXG5cdFx0cHJlcGFyZWRTZXF1ZW5jZXM6IHByZXBhcmVkU2VxdWVuY2VzLFxuXHRcdHByZXBhcmVkVG9vbHM6IHByZXBhcmVkVG9vbHMsXG5cdFx0bW9kdWxlczogbW9kdWxlcyxcblx0XHR2YWxpZE9FSVM6IHZhbGlkT0VJUyxcblx0XHRCdWlsdEluU2VxczogQnVpbHRJblNlcXMsXG5cdFx0YmVnaW46IGJlZ2luLFxuXHRcdHBhdXNlOiBwYXVzZSxcblx0XHRyZXN1bWU6IHJlc3VtZSxcblx0XHRzdGVwOiBzdGVwLFxuXHRcdGNsZWFyOiBjbGVhcixcblx0fTtcbn0oKTtcblxuXG5cblxuY29uc3QgTG9nUGFuZWwgPSBmdW5jdGlvbiAoKSB7XG5cdGxvZ0dyZWVuID0gZnVuY3Rpb24gKGxpbmUpIHtcblx0XHQkKFwiI2lubmVyTG9nQXJlYVwiKS5hcHBlbmQoYDxwIHN0eWxlPVwiY29sb3I6IzAwZmYwMFwiPiR7bGluZX08L3A+PGJyPmApO1xuXHR9O1xuXHRsb2dSZWQgPSBmdW5jdGlvbiAobGluZSkge1xuXHRcdCQoXCIjaW5uZXJMb2dBcmVhXCIpLmFwcGVuZChgPHAgc3R5bGU9XCJjb2xvcjpyZWRcIj4ke2xpbmV9PC9wPjxicj5gKTtcblx0fTtcblx0Y2xlYXJsb2cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0JChcIiNpbm5lckxvZ0FyZWFcIikuZW1wdHkoKTtcblx0fTtcblx0aGlkZUxvZyA9IGZ1bmN0aW9uICgpIHtcblx0XHQkKFwiI2xvZ0FyZWFcIikuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcblx0fTtcblx0c2hvd0xvZyA9IGZ1bmN0aW9uICgpIHtcblx0XHQkKFwiI2xvZ0FyZWFcIikuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG5cdH07XG5cdHJldHVybiB7XG5cdFx0bG9nR3JlZW46IGxvZ0dyZWVuLFxuXHRcdGxvZ1JlZDogbG9nUmVkLFxuXHRcdGNsZWFybG9nOiBjbGVhcmxvZyxcblx0XHRoaWRlTG9nOiBoaWRlTG9nLFxuXHRcdHNob3dMb2c6IHNob3dMb2csXG5cdH07XG59KCk7XG53aW5kb3cuTlNjb3JlID0gTlNjb3JlO1xud2luZG93LkxvZ1BhbmVsID0gTG9nUGFuZWw7IiwiU0VRVUVOQ0UgPSByZXF1aXJlKCcuL3NlcXVlbmNlcy9zZXF1ZW5jZXMuanMnKTtcblZBTElET0VJUyA9IHJlcXVpcmUoJy4vdmFsaWRPRUlTLmpzJyk7XG5NT0RVTEVTID0gcmVxdWlyZSgnLi9tb2R1bGVzL21vZHVsZXMuanMnKTtcblxuXG5jb25zdCBWYWxpZGF0aW9uID0gZnVuY3Rpb24gKCkge1xuXG5cblx0Y29uc3QgbGlzdEVycm9yID0gZnVuY3Rpb24gKHRpdGxlKSB7XG5cdFx0bGV0IG1zZyA9IFwiY2FuJ3QgcGFyc2UgdGhlIGxpc3QsIHBsZWFzZSBwYXNzIG51bWJlcnMgc2VwZXJhdGVkIGJ5IGNvbW1hcyAoZXhhbXBsZTogMSwyLDMpXCI7XG5cdFx0aWYgKHRpdGxlICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0bXNnID0gdGl0bGUgKyBcIjogXCIgKyBtc2c7XG5cdFx0fVxuXHRcdHJldHVybiBtc2c7XG5cdH07XG5cblx0Y29uc3QgcmVxdWlyZWRFcnJvciA9IGZ1bmN0aW9uICh0aXRsZSkge1xuXHRcdHJldHVybiBgJHt0aXRsZX06IHRoaXMgaXMgYSByZXF1aXJlZCB2YWx1ZSwgZG9uJ3QgbGVhdmUgaXQgZW1wdHkhYDtcblx0fTtcblxuXHRjb25zdCB0eXBlRXJyb3IgPSBmdW5jdGlvbiAodGl0bGUsIHZhbHVlLCBleHBlY3RlZFR5cGUpIHtcblx0XHRyZXR1cm4gYCR7dGl0bGV9OiAke3ZhbHVlfSBpcyBhICR7dHlwZW9mKHZhbHVlKX0sIGV4cGVjdGVkIGEgJHtleHBlY3RlZFR5cGV9LiBgO1xuXHR9O1xuXG5cdGNvbnN0IG9laXNFcnJvciA9IGZ1bmN0aW9uIChjb2RlKSB7XG5cdFx0cmV0dXJuIGAke2NvZGV9OiBFaXRoZXIgYW4gaW52YWxpZCBPRUlTIGNvZGUgb3Igbm90IGRlZmluZWQgYnkgc2FnZSFgO1xuXHR9O1xuXG5cdGNvbnN0IGJ1aWx0SW4gPSBmdW5jdGlvbiAoc2VxT2JqKSB7XG5cdFx0bGV0IHNjaGVtYSA9IEJ1aWx0SW5TZXFzW3NlcU9iai5pbnB1dFZhbHVlXS5wYXJhbXNTY2hlbWE7XG5cdFx0bGV0IHJlY2VpdmVkUGFyYW1zID0gc2VxT2JqLnBhcmFtZXRlcnM7XG5cblx0XHRsZXQgdmFsaWRhdGlvblJlc3VsdCA9IHtcblx0XHRcdHBhcnNlZEZpZWxkczoge30sXG5cdFx0XHRlcnJvcnM6IFtdXG5cdFx0fTtcblx0XHRPYmplY3Qua2V5cyhyZWNlaXZlZFBhcmFtcykuZm9yRWFjaChcblx0XHRcdChwYXJhbWV0ZXIpID0+IHtcblx0XHRcdFx0dmFsaWRhdGVGcm9tU2NoZW1hKHNjaGVtYSwgcGFyYW1ldGVyLCByZWNlaXZlZFBhcmFtc1twYXJhbWV0ZXJdLCB2YWxpZGF0aW9uUmVzdWx0KTtcblx0XHRcdH1cblx0XHQpO1xuXHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0O1xuXHR9O1xuXG5cdGNvbnN0IG9laXMgPSBmdW5jdGlvbiAoc2VxT2JqKSB7XG5cdFx0bGV0IHZhbGlkYXRpb25SZXN1bHQgPSB7XG5cdFx0XHRwYXJzZWRGaWVsZHM6IHt9LFxuXHRcdFx0ZXJyb3JzOiBbXVxuXHRcdH07XG5cdFx0c2VxT2JqLmlucHV0VmFsdWUgPSBzZXFPYmouaW5wdXRWYWx1ZS50cmltKCk7XG5cdFx0bGV0IG9laXNDb2RlID0gc2VxT2JqLmlucHV0VmFsdWU7XG5cdFx0aWYgKCFWQUxJRE9FSVMuaW5jbHVkZXMob2Vpc0NvZGUpKSB7XG5cdFx0XHR2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5wdXNoKG9laXNFcnJvcihvZWlzQ29kZSkpO1xuXHRcdH1cblx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdDtcblx0fTtcblxuXHRjb25zdCBsaXN0ID0gZnVuY3Rpb24gKHNlcU9iaikge1xuXHRcdGxldCB2YWxpZGF0aW9uUmVzdWx0ID0ge1xuXHRcdFx0cGFyc2VkRmllbGRzOiB7fSxcblx0XHRcdGVycm9yczogW11cblx0XHR9O1xuXHRcdHRyeSB7XG5cdFx0XHRzZXFPYmouaW5wdXRWYWx1ZSA9IEpTT04ucGFyc2Uoc2VxT2JqLmlucHV0VmFsdWUpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0dmFsaWRhdGlvblJlc3VsdC5lcnJvcnMucHVzaChsaXN0RXJyb3IoKSk7XG5cdFx0fVxuXHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0O1xuXHR9O1xuXG5cdGNvbnN0IF9tb2R1bGUgPSBmdW5jdGlvbiAobW9kdWxlT2JqKSB7XG5cdFx0bGV0IHNjaGVtYSA9IE1PRFVMRVNbbW9kdWxlT2JqLm1vZHVsZUtleV0uY29uZmlnU2NoZW1hO1xuXHRcdGxldCByZWNlaXZlZENvbmZpZyA9IG1vZHVsZU9iai5jb25maWc7XG5cblx0XHRsZXQgdmFsaWRhdGlvblJlc3VsdCA9IHtcblx0XHRcdHBhcnNlZEZpZWxkczoge30sXG5cdFx0XHRlcnJvcnM6IFtdXG5cdFx0fTtcblxuXHRcdE9iamVjdC5rZXlzKHJlY2VpdmVkQ29uZmlnKS5mb3JFYWNoKFxuXHRcdFx0KGNvbmZpZ0ZpZWxkKSA9PiB7XG5cdFx0XHRcdHZhbGlkYXRlRnJvbVNjaGVtYShzY2hlbWEsIGNvbmZpZ0ZpZWxkLCByZWNlaXZlZENvbmZpZ1tjb25maWdGaWVsZF0sIHZhbGlkYXRpb25SZXN1bHQpO1xuXHRcdFx0fVxuXHRcdCk7XG5cdFx0cmV0dXJuIHZhbGlkYXRpb25SZXN1bHQ7XG5cdH07XG5cblx0Y29uc3QgdmFsaWRhdGVGcm9tU2NoZW1hID0gZnVuY3Rpb24gKHNjaGVtYSwgZmllbGQsIHZhbHVlLCB2YWxpZGF0aW9uUmVzdWx0KSB7XG5cdFx0bGV0IHRpdGxlID0gc2NoZW1hW2ZpZWxkXS50aXRsZTtcblx0XHRpZiAodHlwZW9mICh2YWx1ZSkgPT0gXCJzdHJpbmdcIikge1xuXHRcdFx0dmFsdWUgPSB2YWx1ZS50cmltKCk7XG5cdFx0fVxuXHRcdGxldCBleHBlY3RlZFR5cGUgPSBzY2hlbWFbZmllbGRdLnR5cGU7XG5cdFx0bGV0IHJlcXVpcmVkID0gKHNjaGVtYVtmaWVsZF0ucmVxdWlyZWQgIT09IHVuZGVmaW5lZCkgPyBzY2hlbWFbZmllbGRdLnJlcXVpcmVkIDogZmFsc2U7XG5cdFx0bGV0IGZvcm1hdCA9IChzY2hlbWFbZmllbGRdLmZvcm1hdCAhPT0gdW5kZWZpbmVkKSA/IHNjaGVtYVtmaWVsZF0uZm9ybWF0IDogZmFsc2U7XG5cdFx0bGV0IGlzRW1wdHkgPSAodmFsdWUgPT09ICcnKTtcblx0XHRpZiAocmVxdWlyZWQgJiYgaXNFbXB0eSkge1xuXHRcdFx0dmFsaWRhdGlvblJlc3VsdC5lcnJvcnMucHVzaChyZXF1aXJlZEVycm9yKHRpdGxlKSk7XG5cdFx0fVxuXHRcdGlmIChpc0VtcHR5KSB7XG5cdFx0XHRwYXJzZWQgPSBudWxsO1xuXHRcdH1cblx0XHRpZiAoIWlzRW1wdHkgJiYgKGV4cGVjdGVkVHlwZSA9PSBcIm51bWJlclwiKSkge1xuXHRcdFx0cGFyc2VkID0gcGFyc2VJbnQodmFsdWUpO1xuXHRcdFx0aWYgKHBhcnNlZCAhPSBwYXJzZWQpIHsgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzQyNjE5Mzgvd2hhdC1pcy10aGUtZGlmZmVyZW5jZS1iZXR3ZWVuLW5hbi1uYW4tYW5kLW5hbi1uYW5cblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdC5lcnJvcnMucHVzaCh0eXBlRXJyb3IodGl0bGUsIHZhbHVlLCBleHBlY3RlZFR5cGUpKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKCFpc0VtcHR5ICYmIChleHBlY3RlZFR5cGUgPT0gXCJzdHJpbmdcIikpIHtcblx0XHRcdHBhcnNlZCA9IHZhbHVlO1xuXHRcdH1cblx0XHRpZiAoIWlzRW1wdHkgJiYgKGV4cGVjdGVkVHlwZSA9PSBcImJvb2xlYW5cIikpIHtcblx0XHRcdGlmICh2YWx1ZSA9PSAnMScpIHtcblx0XHRcdFx0cGFyc2VkID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhcnNlZCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoZm9ybWF0ICYmIChmb3JtYXQgPT0gXCJsaXN0XCIpKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRwYXJzZWQgPSBKU09OLnBhcnNlKFwiW1wiICsgdmFsdWUgKyBcIl1cIik7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdC5lcnJvcnMucHVzaChsaXN0RXJyb3IodGl0bGUpKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKHBhcnNlZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR2YWxpZGF0aW9uUmVzdWx0LnBhcnNlZEZpZWxkc1tmaWVsZF0gPSBwYXJzZWQ7XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB7XG5cdFx0YnVpbHRJbjogYnVpbHRJbixcblx0XHRvZWlzOiBvZWlzLFxuXHRcdGxpc3Q6IGxpc3QsXG5cdFx0bW9kdWxlOiBfbW9kdWxlXG5cdH07XG59KCk7XG5cbm1vZHVsZS5leHBvcnRzID0gVmFsaWRhdGlvbjsiLCIvKlxuICAgIHZhciBsaXN0PVsyLCAzLCA1LCA3LCAxMSwgMTMsIDE3LCAxOSwgMjMsIDI5LCAzMSwgMzcsIDQxLCA0MywgNDcsIDUzLCA1OSwgNjEsIDY3LCA3MSwgNzMsIDc5LCA4MywgODksIDk3LCAxMDEsIDEwMywgMTA3LCAxMDksIDExMywgMTI3LCAxMzEsIDEzNywgMTM5LCAxNDksIDE1MSwgMTU3LCAxNjMsIDE2NywgMTczLCAxNzksIDE4MSwgMTkxLCAxOTMsIDE5NywgMTk5LCAyMTEsIDIyMywgMjI3LCAyMjksIDIzMywgMjM5LCAyNDEsIDI1MSwgMjU3LCAyNjMsIDI2OSwgMjcxLCAyNzcsIDI4MSwgMjgzLCAyOTMsIDMwNywgMzExLCAzMTMsIDMxNywgMzMxLCAzMzcsIDM0NywgMzQ5LCAzNTMsIDM1OSwgMzY3LCAzNzMsIDM3OSwgMzgzLCAzODksIDM5NywgNDAxLCA0MDksIDQxOSwgNDIxLCA0MzEsIDQzMywgNDM5LCA0NDMsIDQ0OSwgNDU3LCA0NjEsIDQ2MywgNDY3LCA0NzksIDQ4NywgNDkxLCA0OTksIDUwMywgNTA5LCA1MjEsIDUyMywgNTQxLCA1NDcsIDU1NywgNTYzLCA1NjksIDU3MSwgNTc3LCA1ODcsIDU5MywgNTk5LCA2MDEsIDYwNywgNjEzLCA2MTcsIDYxOSwgNjMxLCA2NDEsIDY0MywgNjQ3LCA2NTMsIDY1OSwgNjYxLCA2NzMsIDY3NywgNjgzLCA2OTEsIDcwMSwgNzA5LCA3MTksIDcyNywgNzMzLCA3MzksIDc0MywgNzUxLCA3NTcsIDc2MSwgNzY5LCA3NzMsIDc4NywgNzk3LCA4MDksIDgxMSwgODIxLCA4MjMsIDgyNywgODI5LCA4MzksIDg1MywgODU3LCA4NTksIDg2MywgODc3LCA4ODEsIDg4MywgODg3LCA5MDcsIDkxMSwgOTE5LCA5MjksIDkzNywgOTQxLCA5NDcsIDk1MywgOTY3LCA5NzEsIDk3NywgOTgzLCA5OTEsIDk5NywgMTAwOSwgMTAxMywgMTAxOSwgMTAyMSwgMTAzMSwgMTAzMywgMTAzOSwgMTA0OSwgMTA1MSwgMTA2MSwgMTA2MywgMTA2OSwgMTA4NywgMTA5MSwgMTA5MywgMTA5NywgMTEwMywgMTEwOSwgMTExNywgMTEyMywgMTEyOSwgMTE1MSwgMTE1MywgMTE2MywgMTE3MSwgMTE4MSwgMTE4NywgMTE5MywgMTIwMSwgMTIxMywgMTIxNywgMTIyM107XG5cbiovXG5cbmNsYXNzIFZJWl9EaWZmZXJlbmNlcyB7XG5cdGNvbnN0cnVjdG9yKHNlcSwgc2tldGNoLCBjb25maWcpIHtcblxuXHRcdHRoaXMubiA9IGNvbmZpZy5uOyAvL24gaXMgbnVtYmVyIG9mIHRlcm1zIG9mIHRvcCBzZXF1ZW5jZVxuXHRcdHRoaXMubGV2ZWxzID0gY29uZmlnLkxldmVsczsgLy9sZXZlbHMgaXMgbnVtYmVyIG9mIGxheWVycyBvZiB0aGUgcHlyYW1pZC90cmFwZXpvaWQgY3JlYXRlZCBieSB3cml0aW5nIHRoZSBkaWZmZXJlbmNlcy5cblx0XHR0aGlzLnNlcSA9IHNlcTtcblx0XHR0aGlzLnNrZXRjaCA9IHNrZXRjaDtcblx0fVxuXG5cdGRyYXdEaWZmZXJlbmNlcyhuLCBsZXZlbHMsIHNlcXVlbmNlKSB7XG5cblx0XHQvL2NoYW5nZWQgYmFja2dyb3VuZCBjb2xvciB0byBncmV5IHNpbmNlIHlvdSBjYW4ndCBzZWUgd2hhdCdzIGdvaW5nIG9uXG5cdFx0dGhpcy5za2V0Y2guYmFja2dyb3VuZCgnYmxhY2snKTtcblxuXHRcdG4gPSBNYXRoLm1pbihuLCBzZXF1ZW5jZS5sZW5ndGgpO1xuXHRcdGxldmVscyA9IE1hdGgubWluKGxldmVscywgbiAtIDEpO1xuXHRcdGxldCBmb250LCBmb250U2l6ZSA9IDIwO1xuXHRcdHRoaXMuc2tldGNoLnRleHRGb250KFwiQXJpYWxcIik7XG5cdFx0dGhpcy5za2V0Y2gudGV4dFNpemUoZm9udFNpemUpO1xuXHRcdHRoaXMuc2tldGNoLnRleHRTdHlsZSh0aGlzLnNrZXRjaC5CT0xEKTtcblx0XHRsZXQgeERlbHRhID0gNTA7XG5cdFx0bGV0IHlEZWx0YSA9IDUwO1xuXHRcdGxldCBmaXJzdFggPSAzMDtcblx0XHRsZXQgZmlyc3RZID0gMzA7XG5cdFx0dGhpcy5za2V0Y2guY29sb3JNb2RlKHRoaXMuc2tldGNoLkhTQiwgMjU1KTtcblx0XHRsZXQgbXlDb2xvciA9IHRoaXMuc2tldGNoLmNvbG9yKDEwMCwgMjU1LCAxNTApO1xuXHRcdGxldCBodWU7XG5cblx0XHRsZXQgd29ya2luZ1NlcXVlbmNlID0gW107XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubjsgaSsrKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImluXCIpO1xuXHRcdFx0d29ya2luZ1NlcXVlbmNlLnB1c2goc2VxdWVuY2UuZ2V0RWxlbWVudChpKSk7IC8vd29ya2luZ1NlcXVlbmNlIGNhbm5pYmFsaXplcyBmaXJzdCBuIGVsZW1lbnRzIG9mIHNlcXVlbmNlLlxuXHRcdH1cblxuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxldmVsczsgaSsrKSB7XG5cdFx0XHRodWUgPSAoaSAqIDI1NSAvIDYpICUgMjU1O1xuXHRcdFx0bXlDb2xvciA9IHRoaXMuc2tldGNoLmNvbG9yKGh1ZSwgMTUwLCAyMDApO1xuXHRcdFx0dGhpcy5za2V0Y2guZmlsbChteUNvbG9yKTtcblx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgd29ya2luZ1NlcXVlbmNlLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdHRoaXMuc2tldGNoLnRleHQod29ya2luZ1NlcXVlbmNlW2pdLCBmaXJzdFggKyBqICogeERlbHRhLCBmaXJzdFkgKyBpICogeURlbHRhKTsgLy9EcmF3cyBhbmQgdXBkYXRlcyB3b3JraW5nU2VxdWVuY2Ugc2ltdWx0YW5lb3VzbHkuXG5cdFx0XHRcdGlmIChqIDwgd29ya2luZ1NlcXVlbmNlLmxlbmd0aCAtIDEpIHtcblx0XHRcdFx0XHR3b3JraW5nU2VxdWVuY2Vbal0gPSB3b3JraW5nU2VxdWVuY2VbaiArIDFdIC0gd29ya2luZ1NlcXVlbmNlW2pdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHdvcmtpbmdTZXF1ZW5jZS5sZW5ndGggPSB3b3JraW5nU2VxdWVuY2UubGVuZ3RoIC0gMTsgLy9SZW1vdmVzIGxhc3QgZWxlbWVudC5cblx0XHRcdGZpcnN0WCA9IGZpcnN0WCArICgxIC8gMikgKiB4RGVsdGE7IC8vTW92ZXMgbGluZSBmb3J3YXJkIGhhbGYgZm9yIHB5cmFtaWQgc2hhcGUuXG5cblx0XHR9XG5cblx0fVxuXG5cdHNldHVwKCkge31cblx0ZHJhdygpIHtcblx0XHR0aGlzLmRyYXdEaWZmZXJlbmNlcyh0aGlzLm4sIHRoaXMubGV2ZWxzLCB0aGlzLnNlcSk7XG5cdFx0dGhpcy5za2V0Y2gubm9Mb29wKCk7XG5cdH1cbn1cblxuXG5cbmNvbnN0IFNDSEVNQV9EaWZmZXJlbmNlcyA9IHtcblx0bjoge1xuXHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdHRpdGxlOiAnTicsXG5cdFx0ZGVzY3JpcHRpb246ICdOdW1iZXIgb2YgZWxlbWVudHMnLFxuXHRcdHJlcXVpcmVkOiB0cnVlXG5cdH0sXG5cdExldmVsczoge1xuXHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdHRpdGxlOiAnTGV2ZWxzJyxcblx0XHRkZXNjcmlwdGlvbjogJ051bWJlciBvZiBsZXZlbHMnLFxuXHRcdHJlcXVpcmVkOiB0cnVlXG5cdH0sXG59O1xuXG5jb25zdCBNT0RVTEVfRGlmZmVyZW5jZXMgPSB7XG5cdHZpejogVklaX0RpZmZlcmVuY2VzLFxuXHRuYW1lOiBcIkRpZmZlcmVuY2VzXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRjb25maWdTY2hlbWE6IFNDSEVNQV9EaWZmZXJlbmNlc1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9EaWZmZXJlbmNlczsiLCIvL0FuIGV4YW1wbGUgbW9kdWxlXG5cblxuY2xhc3MgVklaX01vZEZpbGwge1xuXHRjb25zdHJ1Y3RvcihzZXEsIHNrZXRjaCwgY29uZmlnKSB7XG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2g7XG5cdFx0dGhpcy5zZXEgPSBzZXE7XG5cdFx0dGhpcy5tb2REaW1lbnNpb24gPSBjb25maWcubW9kRGltZW5zaW9uO1xuXHRcdHRoaXMuaSA9IDA7XG5cdH1cblxuXHRkcmF3TmV3KG51bSwgc2VxKSB7XG5cdFx0bGV0IGJsYWNrID0gdGhpcy5za2V0Y2guY29sb3IoMCk7XG5cdFx0dGhpcy5za2V0Y2guZmlsbChibGFjayk7XG5cdFx0bGV0IGk7XG5cdFx0bGV0IGo7XG5cdFx0Zm9yIChsZXQgbW9kID0gMTsgbW9kIDw9IHRoaXMubW9kRGltZW5zaW9uOyBtb2QrKykge1xuXHRcdFx0aSA9IHNlcS5nZXRFbGVtZW50KG51bSkgJSBtb2Q7XG5cdFx0XHRqID0gbW9kIC0gMTtcblx0XHRcdHRoaXMuc2tldGNoLnJlY3QoaiAqIHRoaXMucmVjdFdpZHRoLCB0aGlzLnNrZXRjaC5oZWlnaHQgLSAoaSArIDEpICogdGhpcy5yZWN0SGVpZ2h0LCB0aGlzLnJlY3RXaWR0aCwgdGhpcy5yZWN0SGVpZ2h0KTtcblx0XHR9XG5cblx0fVxuXG5cdHNldHVwKCkge1xuXHRcdHRoaXMucmVjdFdpZHRoID0gdGhpcy5za2V0Y2gud2lkdGggLyB0aGlzLm1vZERpbWVuc2lvbjtcblx0XHR0aGlzLnJlY3RIZWlnaHQgPSB0aGlzLnNrZXRjaC5oZWlnaHQgLyB0aGlzLm1vZERpbWVuc2lvbjtcblx0XHR0aGlzLnNrZXRjaC5ub1N0cm9rZSgpO1xuXHR9XG5cblx0ZHJhdygpIHtcblx0XHR0aGlzLmRyYXdOZXcodGhpcy5pLCB0aGlzLnNlcSk7XG5cdFx0dGhpcy5pKys7XG5cdFx0aWYgKGkgPT0gMTAwMCkge1xuXHRcdFx0dGhpcy5za2V0Y2gubm9Mb29wKCk7XG5cdFx0fVxuXHR9XG5cbn1cblxuY29uc3QgU0NIRU1BX01vZEZpbGwgPSB7XG5cdG1vZERpbWVuc2lvbjoge1xuXHRcdHR5cGU6IFwibnVtYmVyXCIsXG5cdFx0dGl0bGU6IFwiTW9kIGRpbWVuc2lvblwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRcdHJlcXVpcmVkOiB0cnVlXG5cdH1cbn07XG5cblxuY29uc3QgTU9EVUxFX01vZEZpbGwgPSB7XG5cdHZpejogVklaX01vZEZpbGwsXG5cdG5hbWU6IFwiTW9kIEZpbGxcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdGNvbmZpZ1NjaGVtYTogU0NIRU1BX01vZEZpbGxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFX01vZEZpbGw7IiwiY2xhc3MgVklaX3NoaWZ0Q29tcGFyZSB7XG5cdGNvbnN0cnVjdG9yKHNlcSwgc2tldGNoLCBjb25maWcpIHtcblx0XHQvL1NrZXRjaCBpcyB5b3VyIGNhbnZhc1xuXHRcdC8vY29uZmlnIGlzIHRoZSBwYXJhbWV0ZXJzIHlvdSBleHBlY3Rcblx0XHQvL3NlcSBpcyB0aGUgc2VxdWVuY2UgeW91IGFyZSBkcmF3aW5nXG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2g7XG5cdFx0dGhpcy5zZXEgPSBzZXE7XG5cdFx0dGhpcy5NT0QgPSAyO1xuXHRcdC8vIFNldCB1cCB0aGUgaW1hZ2Ugb25jZS5cblx0fVxuXG5cblx0c2V0dXAoKSB7XG5cdFx0Y29uc29sZS5sb2codGhpcy5za2V0Y2guaGVpZ2h0LCB0aGlzLnNrZXRjaC53aWR0aCk7XG5cdFx0dGhpcy5pbWcgPSB0aGlzLnNrZXRjaC5jcmVhdGVJbWFnZSh0aGlzLnNrZXRjaC53aWR0aCwgdGhpcy5za2V0Y2guaGVpZ2h0KTtcblx0XHR0aGlzLmltZy5sb2FkUGl4ZWxzKCk7IC8vIEVuYWJsZXMgcGl4ZWwtbGV2ZWwgZWRpdGluZy5cblx0fVxuXG5cdGNsaXAoYSwgbWluLCBtYXgpIHtcblx0XHRpZiAoYSA8IG1pbikge1xuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9IGVsc2UgaWYgKGEgPiBtYXgpIHtcblx0XHRcdHJldHVybiBtYXg7XG5cdFx0fVxuXHRcdHJldHVybiBhO1xuXHR9XG5cblxuXHRkcmF3KCkgeyAvL1RoaXMgd2lsbCBiZSBjYWxsZWQgZXZlcnl0aW1lIHRvIGRyYXdcblx0XHQvLyBFbnN1cmUgbW91c2UgY29vcmRpbmF0ZXMgYXJlIHNhbmUuXG5cdFx0Ly8gTW91c2UgY29vcmRpbmF0ZXMgbG9vayB0aGV5J3JlIGZsb2F0cyBieSBkZWZhdWx0LlxuXG5cdFx0bGV0IGQgPSB0aGlzLnNrZXRjaC5waXhlbERlbnNpdHkoKTtcblx0XHRsZXQgbXggPSB0aGlzLmNsaXAoTWF0aC5yb3VuZCh0aGlzLnNrZXRjaC5tb3VzZVgpLCAwLCB0aGlzLnNrZXRjaC53aWR0aCk7XG5cdFx0bGV0IG15ID0gdGhpcy5jbGlwKE1hdGgucm91bmQodGhpcy5za2V0Y2gubW91c2VZKSwgMCwgdGhpcy5za2V0Y2guaGVpZ2h0KTtcblx0XHRpZiAodGhpcy5za2V0Y2gua2V5ID09ICdBcnJvd1VwJykge1xuXHRcdFx0dGhpcy5NT0QgKz0gMTtcblx0XHRcdHRoaXMuc2tldGNoLmtleSA9IG51bGw7XG5cdFx0XHRjb25zb2xlLmxvZyhcIlVQIFBSRVNTRUQsIE5FVyBNT0Q6IFwiICsgdGhpcy5NT0QpO1xuXHRcdH0gZWxzZSBpZiAodGhpcy5za2V0Y2gua2V5ID09ICdBcnJvd0Rvd24nKSB7XG5cdFx0XHR0aGlzLk1PRCAtPSAxO1xuXHRcdFx0dGhpcy5za2V0Y2gua2V5ID0gbnVsbDtcblx0XHRcdGNvbnNvbGUubG9nKFwiRE9XTiBQUkVTU0VELCBORVcgTU9EOiBcIiArIHRoaXMuTU9EKTtcblx0XHR9IGVsc2UgaWYgKHRoaXMuc2tldGNoLmtleSA9PSAnQXJyb3dSaWdodCcpIHtcblx0XHRcdGNvbnNvbGUubG9nKGNvbnNvbGUubG9nKFwiTVg6IFwiICsgbXggKyBcIiBNWTogXCIgKyBteSkpO1xuXHRcdH1cblx0XHQvLyBXcml0ZSB0byBpbWFnZSwgdGhlbiB0byBzY3JlZW4gZm9yIHNwZWVkLlxuXHRcdGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5za2V0Y2gud2lkdGg7IHgrKykge1xuXHRcdFx0Zm9yIChsZXQgeSA9IDA7IHkgPCB0aGlzLnNrZXRjaC5oZWlnaHQ7IHkrKykge1xuXHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGQ7IGkrKykge1xuXHRcdFx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgZDsgaisrKSB7XG5cdFx0XHRcdFx0XHRsZXQgaW5kZXggPSA0ICogKCh5ICogZCArIGopICogdGhpcy5za2V0Y2gud2lkdGggKiBkICsgKHggKiBkICsgaSkpO1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuc2VxLmdldEVsZW1lbnQoeCkgJSAodGhpcy5NT0QpID09IHRoaXMuc2VxLmdldEVsZW1lbnQoeSkgJSAodGhpcy5NT0QpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleF0gPSAyNTU7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDFdID0gMjU1O1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAyXSA9IDI1NTtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgM10gPSAyNTU7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXhdID0gMDtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgMV0gPSAwO1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAyXSA9IDA7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDNdID0gMjU1O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuaW1nLnVwZGF0ZVBpeGVscygpOyAvLyBDb3BpZXMgb3VyIGVkaXRlZCBwaXhlbHMgdG8gdGhlIGltYWdlLlxuXG5cdFx0dGhpcy5za2V0Y2guaW1hZ2UodGhpcy5pbWcsIDAsIDApOyAvLyBEaXNwbGF5IGltYWdlIHRvIHNjcmVlbi50aGlzLnNrZXRjaC5saW5lKDUwLDUwLDEwMCwxMDApO1xuXHR9XG59XG5cblxuY29uc3QgTU9EVUxFX1NoaWZ0Q29tcGFyZSA9IHtcblx0dml6OiBWSVpfc2hpZnRDb21wYXJlLFxuXHRuYW1lOiBcIlNoaWZ0IENvbXBhcmVcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdGNvbmZpZ1NjaGVtYToge31cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFX1NoaWZ0Q29tcGFyZTsiLCJjbGFzcyBWSVpfVHVydGxlIHtcblx0Y29uc3RydWN0b3Ioc2VxLCBza2V0Y2gsIGNvbmZpZykge1xuXHRcdHZhciBkb21haW4gPSBjb25maWcuZG9tYWluO1xuXHRcdHZhciByYW5nZSA9IGNvbmZpZy5yYW5nZTtcblx0XHR0aGlzLnJvdE1hcCA9IHt9O1xuXHRcdGZvcihsZXQgaSA9IDA7IGkgPCBkb21haW4ubGVuZ3RoOyBpKyspe1xuXHRcdFx0dGhpcy5yb3RNYXBbZG9tYWluW2ldXSA9IChNYXRoLlBJLzE4MCkqcmFuZ2VbaV07XG5cdFx0fVxuXHRcdHRoaXMuc3RlcFNpemUgPSBjb25maWcuc3RlcFNpemU7XG5cdFx0dGhpcy5iZ0NvbG9yID0gY29uZmlnLmJnQ29sb3I7XG5cdFx0dGhpcy5zdHJva2VDb2xvciA9IGNvbmZpZy5zdHJva2VDb2xvcjtcblx0XHR0aGlzLnN0cm9rZVdpZHRoID0gY29uZmlnLnN0cm9rZVdlaWdodDtcblx0XHR0aGlzLnNlcSA9IHNlcTtcblx0XHR0aGlzLmN1cnJlbnRJbmRleCA9IDA7XG5cdFx0dGhpcy5vcmllbnRhdGlvbiA9IDA7XG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2g7XG5cdFx0aWYoY29uZmlnLnN0YXJ0aW5nWCAhPSBcIlwiKXtcblx0XHRcdHRoaXMuWCA9IGNvbmZpZy5zdGFydGluZ1g7XG5cdFx0XHR0aGlzLlkgPSBjb25maWcuc3RhcnRpbmdZO1xuXHRcdH1cblx0XHRlbHNle1xuXHRcdFx0dGhpcy5YID0gbnVsbDtcblx0XHRcdHRoaXMuWSA9IG51bGw7XG5cdFx0fVxuXG5cdH1cblx0c3RlcERyYXcoKSB7XG5cdFx0bGV0IG9sZFggPSB0aGlzLlg7XG5cdFx0bGV0IG9sZFkgPSB0aGlzLlk7XG5cdFx0bGV0IGN1cnJFbGVtZW50ID0gdGhpcy5zZXEuZ2V0RWxlbWVudCh0aGlzLmN1cnJlbnRJbmRleCsrKTtcblx0XHRsZXQgYW5nbGUgPSB0aGlzLnJvdE1hcFsgY3VyckVsZW1lbnQgXTtcblx0XHRpZihhbmdsZSA9PSB1bmRlZmluZWQpe1xuXHRcdFx0dGhyb3cgKCdhbmdsZSB1bmRlZmluZWQgZm9yIGVsZW1lbnQ6ICcgKyBjdXJyRWxlbWVudCk7XG5cdFx0fVxuXHRcdHRoaXMub3JpZW50YXRpb24gPSAodGhpcy5vcmllbnRhdGlvbiArIGFuZ2xlKTtcblx0XHR0aGlzLlggKz0gdGhpcy5zdGVwU2l6ZSAqIE1hdGguY29zKHRoaXMub3JpZW50YXRpb24pO1xuXHRcdHRoaXMuWSArPSB0aGlzLnN0ZXBTaXplICogTWF0aC5zaW4odGhpcy5vcmllbnRhdGlvbik7XG5cdFx0dGhpcy5za2V0Y2gubGluZShvbGRYLCBvbGRZLCB0aGlzLlgsIHRoaXMuWSk7XG5cdH1cblx0c2V0dXAoKSB7XG5cdFx0dGhpcy5YID0gdGhpcy5za2V0Y2gud2lkdGggLyAyO1xuXHRcdHRoaXMuWSA9IHRoaXMuc2tldGNoLmhlaWdodCAvIDI7XG5cdFx0dGhpcy5za2V0Y2guYmFja2dyb3VuZCh0aGlzLmJnQ29sb3IpO1xuXHRcdHRoaXMuc2tldGNoLnN0cm9rZSh0aGlzLnN0cm9rZUNvbG9yKTtcblx0XHR0aGlzLnNrZXRjaC5zdHJva2VXZWlnaHQodGhpcy5zdHJva2VXaWR0aCk7XG5cdH1cblx0ZHJhdygpIHtcblx0XHR0aGlzLnN0ZXBEcmF3KCk7XG5cdH1cbn1cblxuXG5jb25zdCBTQ0hFTUFfVHVydGxlID0ge1xuXHRkb21haW46IHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR0aXRsZTogJ1NlcXVlbmNlIERvbWFpbicsXG5cdFx0ZGVzY3JpcHRpb246ICdDb21tYSBzZXBlcmF0ZWQgbnVtYmVycycsXG5cdFx0Zm9ybWF0OidsaXN0Jyxcblx0XHRkZWZhdWx0OiBcIjAsMSwyLDMsNFwiLFxuXHRcdHJlcXVpcmVkOiB0cnVlXG5cdH0sXG5cdHJhbmdlOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdBbmdsZXMnLFxuXHRcdGRlZmF1bHQ6IFwiMzAsNDUsNjAsOTAsMTIwXCIsXG5cdFx0Zm9ybWF0OidsaXN0Jyxcblx0XHRkZXNjcmlwdGlvbjogJ0NvbW1hIHNlcGVyYXRlZCBudW1iZXJzJyxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRzdGVwU2l6ZToge1xuXHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdHRpdGxlOiAnU3RlcCBTaXplJyxcblx0XHRkZWZhdWx0OiAyMCxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRzdHJva2VXZWlnaHQ6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ1N0cm9rZSBXaWR0aCcsXG5cdFx0ZGVmYXVsdDogNSxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRzdGFydGluZ1g6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRlOiAnWCBzdGFydCdcblx0fSxcblx0c3RhcnRpbmdZOiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0ZTogJ1kgc3RhcnQnXG5cdH0sXG5cdGJnQ29sb3I6IHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR0aXRsZTogJ0JhY2tncm91bmQgQ29sb3InLFxuXHRcdGZvcm1hdDogJ2NvbG9yJyxcblx0XHRkZWZhdWx0OiBcIiM2NjY2NjZcIixcblx0XHRyZXF1aXJlZDogZmFsc2Vcblx0fSxcblx0c3Ryb2tlQ29sb3I6IHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR0aXRsZTogJ1N0cm9rZSBDb2xvcicsXG5cdFx0Zm9ybWF0OiAnY29sb3InLFxuXHRcdGRlZmF1bHQ6ICcjZmYwMDAwJyxcblx0XHRyZXF1aXJlZDogZmFsc2Vcblx0fSxcblx0dGVzdFRoaW5nOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdoZWxsbycsXG5cdFx0Zm9yYW10OiAnbGlzdCdcblx0fVxufTtcblxuY29uc3QgTU9EVUxFX1R1cnRsZSA9IHtcblx0dml6OiBWSVpfVHVydGxlLFxuXHRuYW1lOiBcIlR1cnRsZVwiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0Y29uZmlnU2NoZW1hOiBTQ0hFTUFfVHVydGxlXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFX1R1cnRsZTsiLCIvL0FkZCBhbiBpbXBvcnQgbGluZSBoZXJlIGZvciBuZXcgbW9kdWxlc1xuXG5cbi8vQWRkIG5ldyBtb2R1bGVzIHRvIHRoaXMgY29uc3RhbnQuXG5jb25zdCBNT0RVTEVTID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFUztcblxuLypqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG5NT0RVTEVTW1wiVHVydGxlXCJdID0gcmVxdWlyZSgnLi9tb2R1bGVUdXJ0bGUuanMnKTtcbk1PRFVMRVNbXCJTaGlmdENvbXBhcmVcIl0gPSByZXF1aXJlKCcuL21vZHVsZVNoaWZ0Q29tcGFyZS5qcycpO1xuTU9EVUxFU1tcIkRpZmZlcmVuY2VzXCJdID0gcmVxdWlyZSgnLi9tb2R1bGVEaWZmZXJlbmNlcy5qcycpO1xuTU9EVUxFU1tcIk1vZEZpbGxcIl0gPSByZXF1aXJlKCcuL21vZHVsZU1vZEZpbGwuanMnKTsiLCJcblNFUV9saW5lYXJSZWN1cnJlbmNlID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUxpblJlYy5qcycpO1xuXG5mdW5jdGlvbiBHRU5fZmlib25hY2NpKHtcbiAgICBtXG59KSB7XG4gICAgcmV0dXJuIFNFUV9saW5lYXJSZWN1cnJlbmNlLmdlbmVyYXRvcih7XG4gICAgICAgIGNvZWZmaWNpZW50TGlzdDogWzEsIDFdLFxuICAgICAgICBzZWVkTGlzdDogWzEsIDFdLFxuICAgICAgICBtXG4gICAgfSk7XG59XG5cbmNvbnN0IFNDSEVNQV9GaWJvbmFjY2k9IHtcbiAgICBtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICB0aXRsZTogJ01vZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBudW1iZXIgdG8gbW9kIHRoZSBzZXF1ZW5jZSBieSBieScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn07XG5cblxuY29uc3QgU0VRX2ZpYm9uYWNjaSA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9maWJvbmFjY2ksXG5cdG5hbWU6IFwiRmlib25hY2NpXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRwYXJhbXNTY2hlbWE6IFNDSEVNQV9GaWJvbmFjY2lcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX2ZpYm9uYWNjaTsiLCJcblxuZnVuY3Rpb24gR0VOX2xpbmVhclJlY3VycmVuY2Uoe1xuICAgIGNvZWZmaWNpZW50TGlzdCxcbiAgICBzZWVkTGlzdCxcbiAgICBtXG59KSB7XG4gICAgaWYgKGNvZWZmaWNpZW50TGlzdC5sZW5ndGggIT0gc2VlZExpc3QubGVuZ3RoKSB7XG4gICAgICAgIC8vTnVtYmVyIG9mIHNlZWRzIHNob3VsZCBtYXRjaCB0aGUgbnVtYmVyIG9mIGNvZWZmaWNpZW50c1xuICAgICAgICBjb25zb2xlLmxvZyhcIm51bWJlciBvZiBjb2VmZmljaWVudHMgbm90IGVxdWFsIHRvIG51bWJlciBvZiBzZWVkcyBcIik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBsZXQgayA9IGNvZWZmaWNpZW50TGlzdC5sZW5ndGg7XG4gICAgaWYgKG0gIT0gbnVsbCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvZWZmaWNpZW50TGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29lZmZpY2llbnRMaXN0W2ldID0gY29lZmZpY2llbnRMaXN0W2ldICUgbTtcbiAgICAgICAgICAgIHNlZWRMaXN0W2ldID0gc2VlZExpc3RbaV0gJSBtO1xuICAgICAgICB9XG4gICAgICAgIHZhciBnZW5lcmljTGluUmVjID0gZnVuY3Rpb24gKG4sIGNhY2hlKSB7XG4gICAgICAgICAgICBpZiggbiA8IHNlZWRMaXN0Lmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgY2FjaGVbbl0gPSBzZWVkTGlzdFtuXVxuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZVtuXSBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBjYWNoZS5sZW5ndGg7IGkgPD0gbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtICs9IGNhY2hlW2kgLSBqIC0gMV0gKiBjb2VmZmljaWVudExpc3Rbal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhY2hlW2ldID0gc3VtICUgbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjYWNoZVtuXTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBnZW5lcmljTGluUmVjID0gZnVuY3Rpb24gKG4sIGNhY2hlKSB7XG4gICAgICAgICAgICBpZiggbiA8IHNlZWRMaXN0Lmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgY2FjaGVbbl0gPSBzZWVkTGlzdFtuXVxuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZVtuXSBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGNhY2hlLmxlbmd0aDsgaSA8PSBuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgc3VtID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBzdW0gKz0gY2FjaGVbaSAtIGogLSAxXSAqIGNvZWZmaWNpZW50TGlzdFtqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FjaGVbaV0gPSBzdW07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVbbl07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGdlbmVyaWNMaW5SZWNcbn1cblxuY29uc3QgU0NIRU1BX2xpbmVhclJlY3VycmVuY2UgPSB7XG4gICAgY29lZmZpY2llbnRMaXN0OiB7XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICB0aXRsZTogJ0NvZWZmaWNpZW50cyBsaXN0JyxcbiAgICAgICAgZm9ybWF0OidsaXN0JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDb21tYSBzZXBlcmF0ZWQgbnVtYmVycycsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgfSxcbiAgICBzZWVkTGlzdDoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgdGl0bGU6ICdTZWVkIGxpc3QnLFxuICAgICAgICBmb3JtYXQ6J2xpc3QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbW1hIHNlcGVyYXRlZCBudW1iZXJzJyxcbiAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICB9LFxuICAgIG06IHtcbiAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgIHRpdGxlOiAnTW9kJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBIG51bWJlciB0byBtb2QgdGhlIHNlcXVlbmNlIGJ5IGJ5JyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufVxuXG5cbmNvbnN0IFNFUV9saW5lYXJSZWN1cnJlbmNlID0ge1xuICAgIGdlbmVyYXRvcjogR0VOX2xpbmVhclJlY3VycmVuY2UsXG5cdG5hbWU6IFwiTGluZWFyIFJlY3VycmVuY2VcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdHBhcmFtc1NjaGVtYTogU0NIRU1BX2xpbmVhclJlY3VycmVuY2Vcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTRVFfbGluZWFyUmVjdXJyZW5jZSIsIlxuY29uc3QgU0VRX2xpbmVhclJlY3VycmVuY2UgPSByZXF1aXJlKCcuL3NlcXVlbmNlTGluUmVjLmpzJylcblxuZnVuY3Rpb24gR0VOX0x1Y2FzKHtcbiAgICBtXG59KSB7XG4gICAgcmV0dXJuIFNFUV9saW5lYXJSZWN1cnJlbmNlLmdlbmVyYXRvcih7XG4gICAgICAgIGNvZWZmaWNpZW50TGlzdDogWzEsIDFdLFxuICAgICAgICBzZWVkTGlzdDogWzIsIDFdLFxuICAgICAgICBtXG4gICAgfSk7XG59XG5cbmNvbnN0IFNDSEVNQV9MdWNhcz0ge1xuICAgIG06IHtcbiAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgIHRpdGxlOiAnTW9kJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBIG51bWJlciB0byBtb2QgdGhlIHNlcXVlbmNlIGJ5IGJ5JyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufVxuXG5cbmNvbnN0IFNFUV9MdWNhcyA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9MdWNhcyxcblx0bmFtZTogXCJMdWNhc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfTHVjYXNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTRVFfTHVjYXMiLCJcblxuZnVuY3Rpb24gR0VOX05hdHVyYWxzKHtcbiAgICBpbmNsdWRlemVyb1xufSl7XG4gICAgaWYoaW5jbHVkZXplcm8pe1xuICAgICAgICByZXR1cm4gKCAobikgPT4gbiApXG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIHJldHVybiAoIChuKSA9PiBuICsgMSApXG4gICAgfVxufVxuXG5jb25zdCBTQ0hFTUFfTmF0dXJhbHM9IHtcbiAgICBpbmNsdWRlemVybzoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIHRpdGxlOiAnSW5jbHVkZSB6ZXJvJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICcnLFxuICAgICAgICBkZWZhdWx0OiAnZmFsc2UnLFxuICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICB9XG59XG5cblxuY29uc3QgU0VRX05hdHVyYWxzID0ge1xuICAgIGdlbmVyYXRvcjogR0VOX05hdHVyYWxzLFxuXHRuYW1lOiBcIk5hdHVyYWxzXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRwYXJhbXNTY2hlbWE6IFNDSEVNQV9OYXR1cmFsc1xufVxuXG4vLyBleHBvcnQgZGVmYXVsdCBTRVFfTmF0dXJhbHNcbm1vZHVsZS5leHBvcnRzID0gU0VRX05hdHVyYWxzIiwiXG5cbmZ1bmN0aW9uIEdFTl9QcmltZXMoKSB7XG4gICAgY29uc3QgcHJpbWVzID0gZnVuY3Rpb24gKG4sIGNhY2hlKSB7XG4gICAgICAgIGlmKGNhY2hlLmxlbmd0aCA9PSAwKXtcbiAgICAgICAgICAgIGNhY2hlLnB1c2goMilcbiAgICAgICAgICAgIGNhY2hlLnB1c2goMylcbiAgICAgICAgICAgIGNhY2hlLnB1c2goNSlcbiAgICAgICAgfVxuICAgICAgICBsZXQgaSA9IGNhY2hlW2NhY2hlLmxlbmd0aCAtIDFdICsgMVxuICAgICAgICBsZXQgayA9IDBcbiAgICAgICAgd2hpbGUgKGNhY2hlLmxlbmd0aCA8PSBuKSB7XG4gICAgICAgICAgICBsZXQgaXNQcmltZSA9IHRydWVcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY2FjaGUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaSAlIGNhY2hlW2pdID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaXNQcmltZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzUHJpbWUpIHtcbiAgICAgICAgICAgICAgICBjYWNoZS5wdXNoKGkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhY2hlW25dXG4gICAgfVxuICAgIHJldHVybiBwcmltZXNcbn1cblxuXG5jb25zdCBTQ0hFTUFfUHJpbWVzPSB7XG4gICAgbToge1xuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgdGl0bGU6ICdNb2QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0EgbnVtYmVyIHRvIG1vZCB0aGUgc2VxdWVuY2UgYnknLFxuICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICB9XG59XG5cblxuY29uc3QgU0VRX1ByaW1lcyA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9QcmltZXMsXG5cdG5hbWU6IFwiUHJpbWVzXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRwYXJhbXNTY2hlbWE6IFNDSEVNQV9QcmltZXNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTRVFfUHJpbWVzIiwiLyoqXG4gKlxuICogQGNsYXNzIFNlcXVlbmNlR2VuZXJhdG9yXG4gKi9cbmNsYXNzIFNlcXVlbmNlR2VuZXJhdG9yIHtcbiAgICAvKipcbiAgICAgKkNyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgU2VxdWVuY2VHZW5lcmF0b3IuXG4gICAgICogQHBhcmFtIHsqfSBnZW5lcmF0b3IgYSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgbmF0dXJhbCBudW1iZXIgYW5kIHJldHVybnMgYSBudW1iZXIsIGl0IGNhbiBvcHRpb25hbGx5IHRha2UgdGhlIGNhY2hlIGFzIGEgc2Vjb25kIGFyZ3VtZW50XG4gICAgICogQHBhcmFtIHsqfSBJRCB0aGUgSUQgb2YgdGhlIHNlcXVlbmNlXG4gICAgICogQG1lbWJlcm9mIFNlcXVlbmNlR2VuZXJhdG9yXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoSUQsIGdlbmVyYXRvcikge1xuICAgICAgICB0aGlzLmdlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgdGhpcy5JRCA9IElEO1xuICAgICAgICB0aGlzLmNhY2hlID0gW107XG4gICAgICAgIHRoaXMubmV3U2l6ZSA9IDE7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIGlmIHdlIG5lZWQgdG8gZ2V0IHRoZSBudGggZWxlbWVudCBhbmQgaXQncyBub3QgcHJlc2VudCBpblxuICAgICAqIGluIHRoZSBjYWNoZSwgdGhlbiB3ZSBlaXRoZXIgZG91YmxlIHRoZSBzaXplLCBvciB0aGUgXG4gICAgICogbmV3IHNpemUgYmVjb21lcyBuKzFcbiAgICAgKiBAcGFyYW0geyp9IG4gXG4gICAgICogQG1lbWJlcm9mIFNlcXVlbmNlR2VuZXJhdG9yXG4gICAgICovXG4gICAgcmVzaXplQ2FjaGUobikge1xuICAgICAgICB0aGlzLm5ld1NpemUgPSB0aGlzLmNhY2hlLmxlbmd0aCAqIDI7XG4gICAgICAgIGlmIChuICsgMSA+IHRoaXMubmV3U2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5uZXdTaXplID0gbiArIDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUG9wdWxhdGVzIHRoZSBjYWNoZSB1cCB1bnRpbCB0aGUgY3VycmVudCBuZXdTaXplXG4gICAgICogdGhpcyBpcyBjYWxsZWQgYWZ0ZXIgcmVzaXplQ2FjaGVcbiAgICAgKiBAbWVtYmVyb2YgU2VxdWVuY2VHZW5lcmF0b3JcbiAgICAgKi9cbiAgICBmaWxsQ2FjaGUoKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmNhY2hlLmxlbmd0aDsgaSA8IHRoaXMubmV3U2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICAvL3RoZSBnZW5lcmF0b3IgaXMgZ2l2ZW4gdGhlIGNhY2hlIHNpbmNlIGl0IHdvdWxkIG1ha2UgY29tcHV0YXRpb24gbW9yZSBlZmZpY2llbnQgc29tZXRpbWVzXG4gICAgICAgICAgICAvL2J1dCB0aGUgZ2VuZXJhdG9yIGRvZXNuJ3QgbmVjZXNzYXJpbHkgbmVlZCB0byB0YWtlIG1vcmUgdGhhbiBvbmUgYXJndW1lbnQuXG4gICAgICAgICAgICB0aGlzLmNhY2hlW2ldID0gdGhpcy5nZW5lcmF0b3IoaSwgdGhpcy5jYWNoZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0IGVsZW1lbnQgaXMgd2hhdCB0aGUgZHJhd2luZyB0b29scyB3aWxsIGJlIGNhbGxpbmcsIGl0IHJldHJpZXZlc1xuICAgICAqIHRoZSBudGggZWxlbWVudCBvZiB0aGUgc2VxdWVuY2UgYnkgZWl0aGVyIGdldHRpbmcgaXQgZnJvbSB0aGUgY2FjaGVcbiAgICAgKiBvciBpZiBpc24ndCBwcmVzZW50LCBieSBidWlsZGluZyB0aGUgY2FjaGUgYW5kIHRoZW4gZ2V0dGluZyBpdFxuICAgICAqIEBwYXJhbSB7Kn0gbiB0aGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIHNlcXVlbmNlIHdlIHdhbnRcbiAgICAgKiBAcmV0dXJucyBhIG51bWJlclxuICAgICAqIEBtZW1iZXJvZiBTZXF1ZW5jZUdlbmVyYXRvclxuICAgICAqL1xuICAgIGdldEVsZW1lbnQobikge1xuICAgICAgICBpZiAodGhpcy5jYWNoZVtuXSAhPSB1bmRlZmluZWQgfHwgdGhpcy5maW5pdGUpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiY2FjaGUgaGl0XCIpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVtuXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiY2FjaGUgbWlzc1wiKVxuICAgICAgICAgICAgdGhpcy5yZXNpemVDYWNoZShuKTtcbiAgICAgICAgICAgIHRoaXMuZmlsbENhY2hlKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVtuXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG4vKipcbiAqXG4gKlxuICogQHBhcmFtIHsqfSBjb2RlIGFyYml0cmFyeSBzYWdlIGNvZGUgdG8gYmUgZXhlY3V0ZWQgb24gYWxlcGhcbiAqIEByZXR1cm5zIGFqYXggcmVzcG9uc2Ugb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIHNhZ2VFeGVjdXRlKGNvZGUpIHtcbiAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICBhc3luYzogZmFsc2UsXG4gICAgICAgIHVybDogJ2h0dHA6Ly9hbGVwaC5zYWdlbWF0aC5vcmcvc2VydmljZScsXG4gICAgICAgIGRhdGE6IFwiY29kZT1cIiArIGNvZGVcbiAgICB9KTtcbn1cblxuLyoqXG4gKlxuICpcbiAqIEBwYXJhbSB7Kn0gY29kZSBhcmJpdHJhcnkgc2FnZSBjb2RlIHRvIGJlIGV4ZWN1dGVkIG9uIGFsZXBoXG4gKiBAcmV0dXJucyBhamF4IHJlc3BvbnNlIG9iamVjdFxuICovXG5hc3luYyBmdW5jdGlvbiBzYWdlRXhlY3V0ZUFzeW5jKGNvZGUpIHtcbiAgICByZXR1cm4gYXdhaXQgJC5hamF4KHtcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICB1cmw6ICdodHRwOi8vYWxlcGguc2FnZW1hdGgub3JnL3NlcnZpY2UnLFxuICAgICAgICBkYXRhOiBcImNvZGU9XCIgKyBjb2RlXG4gICAgfSk7XG59XG5cblxuY2xhc3MgT0VJU1NlcXVlbmNlR2VuZXJhdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihJRCwgT0VJUykge1xuICAgICAgICB0aGlzLk9FSVMgPSBPRUlTO1xuICAgICAgICB0aGlzLklEID0gSUQ7XG4gICAgICAgIHRoaXMuY2FjaGUgPSBbXTtcbiAgICAgICAgdGhpcy5uZXdTaXplID0gMTtcbiAgICAgICAgdGhpcy5wcmVmaWxsQ2FjaGUoKTtcbiAgICB9XG4gICAgb2Vpc0ZldGNoKG4pIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJGZXRjaGluZy4uXCIpO1xuICAgICAgICBsZXQgY29kZSA9IGBwcmludChzbG9hbmUuJHt0aGlzLk9FSVN9Lmxpc3QoJHtufSkpYDtcbiAgICAgICAgbGV0IHJlc3AgPSBzYWdlRXhlY3V0ZShjb2RlKTtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmVzcC5yZXNwb25zZUpTT04uc3Rkb3V0KTtcbiAgICB9XG4gICAgYXN5bmMgcHJlZmlsbENhY2hlKCkge1xuICAgICAgICB0aGlzLnJlc2l6ZUNhY2hlKDMwMDApO1xuICAgICAgICBsZXQgY29kZSA9IGBwcmludChzbG9hbmUuJHt0aGlzLk9FSVN9Lmxpc3QoJHt0aGlzLm5ld1NpemV9KSlgO1xuICAgICAgICBsZXQgcmVzcCA9IGF3YWl0IHNhZ2VFeGVjdXRlQXN5bmMoY29kZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgICB0aGlzLmNhY2hlID0gdGhpcy5jYWNoZS5jb25jYXQoSlNPTi5wYXJzZShyZXNwLnN0ZG91dCkpO1xuICAgIH1cbiAgICByZXNpemVDYWNoZShuKSB7XG4gICAgICAgIHRoaXMubmV3U2l6ZSA9IHRoaXMuY2FjaGUubGVuZ3RoICogMjtcbiAgICAgICAgaWYgKG4gKyAxID4gdGhpcy5uZXdTaXplKSB7XG4gICAgICAgICAgICB0aGlzLm5ld1NpemUgPSBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmaWxsQ2FjaGUoKSB7XG4gICAgICAgIGxldCBuZXdMaXN0ID0gdGhpcy5vZWlzRmV0Y2godGhpcy5uZXdTaXplKTtcbiAgICAgICAgdGhpcy5jYWNoZSA9IHRoaXMuY2FjaGUuY29uY2F0KG5ld0xpc3QpO1xuICAgIH1cbiAgICBnZXRFbGVtZW50KG4pIHtcbiAgICAgICAgaWYgKHRoaXMuY2FjaGVbbl0gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVtuXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVzaXplQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZmlsbENhY2hlKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVtuXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gQnVpbHRJbk5hbWVUb1NlcShJRCwgc2VxTmFtZSwgc2VxUGFyYW1zKSB7XG4gICAgbGV0IGdlbmVyYXRvciA9IEJ1aWx0SW5TZXFzW3NlcU5hbWVdLmdlbmVyYXRvcihzZXFQYXJhbXMpO1xuICAgIHJldHVybiBuZXcgU2VxdWVuY2VHZW5lcmF0b3IoSUQsIGdlbmVyYXRvcik7XG59XG5cblxuZnVuY3Rpb24gTGlzdFRvU2VxKElELCBsaXN0KSB7XG4gICAgbGV0IGxpc3RHZW5lcmF0b3IgPSBmdW5jdGlvbiAobikge1xuICAgICAgICByZXR1cm4gbGlzdFtuXTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2VxdWVuY2VHZW5lcmF0b3IoSUQsIGxpc3RHZW5lcmF0b3IpO1xufVxuXG5mdW5jdGlvbiBPRUlTVG9TZXEoSUQsIE9FSVMpIHtcbiAgICByZXR1cm4gbmV3IE9FSVNTZXF1ZW5jZUdlbmVyYXRvcihJRCwgT0VJUyk7XG59XG5cblxuY29uc3QgQnVpbHRJblNlcXMgPSB7fTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnQnVpbHRJbk5hbWVUb1NlcSc6IEJ1aWx0SW5OYW1lVG9TZXEsXG4gICAgJ0xpc3RUb1NlcSc6IExpc3RUb1NlcSxcbiAgICAnT0VJU1RvU2VxJzogT0VJU1RvU2VxLFxuICAgICdCdWlsdEluU2Vxcyc6IEJ1aWx0SW5TZXFzXG59O1xuXG4vKmpzaGludCBpZ25vcmU6IHN0YXJ0ICovXG5CdWlsdEluU2Vxc1tcIkZpYm9uYWNjaVwiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VGaWJvbmFjY2kuanMnKTtcbkJ1aWx0SW5TZXFzW1wiTHVjYXNcIl0gPSByZXF1aXJlKCcuL3NlcXVlbmNlTHVjYXMuanMnKTtcbkJ1aWx0SW5TZXFzW1wiUHJpbWVzXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZVByaW1lcy5qcycpO1xuQnVpbHRJblNlcXNbXCJOYXR1cmFsc1wiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VOYXR1cmFscy5qcycpO1xuQnVpbHRJblNlcXNbXCJMaW5SZWNcIl0gPSByZXF1aXJlKCcuL3NlcXVlbmNlTGluUmVjLmpzJyk7XG5CdWlsdEluU2Vxc1snUHJpbWVzJ10gPSByZXF1aXJlKCcuL3NlcXVlbmNlUHJpbWVzLmpzJyk7IiwibW9kdWxlLmV4cG9ydHMgPSBbXCJBMDAwMDAxXCIsIFwiQTAwMDAyN1wiLCBcIkEwMDAwMDRcIiwgXCJBMDAwMDA1XCIsIFwiQTAwMDAwOFwiLCBcIkEwMDAwMDlcIiwgXCJBMDAwNzk2XCIsIFwiQTAwMzQxOFwiLCBcIkEwMDczMThcIiwgXCJBMDA4Mjc1XCIsIFwiQTAwODI3N1wiLCBcIkEwNDkzMTBcIiwgXCJBMDAwMDEwXCIsIFwiQTAwMDAwN1wiLCBcIkEwMDU4NDNcIiwgXCJBMDAwMDM1XCIsIFwiQTAwMDE2OVwiLCBcIkEwMDAyNzJcIiwgXCJBMDAwMzEyXCIsIFwiQTAwMTQ3N1wiLCBcIkEwMDQ1MjZcIiwgXCJBMDAwMzI2XCIsIFwiQTAwMjM3OFwiLCBcIkEwMDI2MjBcIiwgXCJBMDA1NDA4XCIsIFwiQTAwMDAxMlwiLCBcIkEwMDAxMjBcIiwgXCJBMDEwMDYwXCIsIFwiQTAwMDA2OVwiLCBcIkEwMDE5NjlcIiwgXCJBMDAwMjkwXCIsIFwiQTAwMDIyNVwiLCBcIkEwMDAwMTVcIiwgXCJBMDAwMDE2XCIsIFwiQTAwMDAzMlwiLCBcIkEwMDQwODZcIiwgXCJBMDAyMTEzXCIsIFwiQTAwMDAzMFwiLCBcIkEwMDAwNDBcIiwgXCJBMDAyODA4XCIsIFwiQTAxODI1MlwiLCBcIkEwMDAwNDNcIiwgXCJBMDAwNjY4XCIsIFwiQTAwMDM5NlwiLCBcIkEwMDUxMDBcIiwgXCJBMDA1MTAxXCIsIFwiQTAwMjExMFwiLCBcIkEwMDA3MjBcIiwgXCJBMDY0NTUzXCIsIFwiQTAwMTA1NVwiLCBcIkEwMDY1MzBcIiwgXCJBMDAwOTYxXCIsIFwiQTAwNTExN1wiLCBcIkEwMjA2MzlcIiwgXCJBMDAwMDQxXCIsIFwiQTAwMDA0NVwiLCBcIkEwMDAxMDhcIiwgXCJBMDAxMDA2XCIsIFwiQTAwMDA3OVwiLCBcIkEwMDA1NzhcIiwgXCJBMDAwMjQ0XCIsIFwiQTAwMDMwMlwiLCBcIkEwMDA1ODNcIiwgXCJBMDAwMTQyXCIsIFwiQTAwMDA4NVwiLCBcIkEwMDExODlcIiwgXCJBMDAwNjcwXCIsIFwiQTAwNjMxOFwiLCBcIkEwMDAxNjVcIiwgXCJBMDAxMTQ3XCIsIFwiQTAwNjg4MlwiLCBcIkEwMDA5ODRcIiwgXCJBMDAxNDA1XCIsIFwiQTAwMDI5MlwiLCBcIkEwMDAzMzBcIiwgXCJBMDAwMTUzXCIsIFwiQTAwMDI1NVwiLCBcIkEwMDAyNjFcIiwgXCJBMDAxOTA5XCIsIFwiQTAwMTkxMFwiLCBcIkEwOTAwMTBcIiwgXCJBMDU1NzkwXCIsIFwiQTA5MDAxMlwiLCBcIkEwOTAwMTNcIiwgXCJBMDkwMDE0XCIsIFwiQTA5MDAxNVwiLCBcIkEwOTAwMTZcIiwgXCJBMDAwMTY2XCIsIFwiQTAwMDIwM1wiLCBcIkEwMDExNTdcIiwgXCJBMDA4NjgzXCIsIFwiQTAwMDIwNFwiLCBcIkEwMDAyMTdcIiwgXCJBMDAwMTI0XCIsIFwiQTAwMjI3NVwiLCBcIkEwMDExMTBcIiwgXCJBMDUxOTU5XCIsIFwiQTAwMTIyMVwiLCBcIkEwMDEyMjJcIiwgXCJBMDQ2NjYwXCIsIFwiQTAwMTIyN1wiLCBcIkEwMDEzNThcIiwgXCJBMDAxNjk0XCIsIFwiQTAwMTgzNlwiLCBcIkEwMDE5MDZcIiwgXCJBMDAxMzMzXCIsIFwiQTAwMTA0NVwiLCBcIkEwMDAxMjlcIiwgXCJBMDAxMTA5XCIsIFwiQTAxNTUyMVwiLCBcIkEwMTU1MjNcIiwgXCJBMDE1NTMwXCIsIFwiQTAxNTUzMVwiLCBcIkEwMTU1NTFcIiwgXCJBMDgyNDExXCIsIFwiQTA4MzEwM1wiLCBcIkEwODMxMDRcIiwgXCJBMDgzMTA1XCIsIFwiQTA4MzIxNlwiLCBcIkEwNjEwODRcIiwgXCJBMDAwMjEzXCIsIFwiQTAwMDA3M1wiLCBcIkEwNzk5MjJcIiwgXCJBMDc5OTIzXCIsIFwiQTEwOTgxNFwiLCBcIkExMTE3NzRcIiwgXCJBMTExNzc1XCIsIFwiQTExMTc4N1wiLCBcIkEwMDAxMTBcIiwgXCJBMDAwNTg3XCIsIFwiQTAwMDEwMFwiXVxuIl19
