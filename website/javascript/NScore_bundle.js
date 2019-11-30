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
			validationResult = Validation.module(moduleObj)
			if( validationResult.errors.length != 0){
				preparedTools[ moduleObj.ID ] = null;
				return validationResult.errors;
			}
			moduleObj.config = validationResult.parsedFields
			preparedTools[moduleObj.ID] = {
				module: modules[moduleObj.moduleKey],
				config: moduleObj.config,
				ID: moduleObj.ID
			};
			return true;
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
				validationResult = Validation.builtIn(seqObj)
				if( validationResult.errors.length != 0){
					preparedSequences[ seqObj.ID ] = null;
					return validationResult.errors;
				}
				console.log(validationResult)
				seqObj.parameters = validationResult.parsedFields
				console.log(seqObj)
				preparedSequences[seqObj.ID] = BuiltInNameToSeq(seqObj.ID, seqObj.inputValue, seqObj.parameters)
			}
			if (seqObj.inputType == "OEIS") {
				validationResult = Validation.oeis( seqObj )
				if( validationResult.errors.length != 0){
					preparedSequences[ seqObj.ID ] = null;
					return validationResult.errors;
				}
				preparedSequences[seqObj.ID] = OEISToSeq(seqObj.ID, seqObj.inputValue);
			}
			if (seqObj.inputType == "list") {
				validationResult = Validation.list( seqObj )
				if( validationResult.errors.length != 0){
					preparedSequences[ seqObj.ID ] = null;
					return validationResult.errors;
				}
				preparedSequences[seqObj.ID] = ListToSeq(seqObj.ID, seqObj.inputValue);

			}
			if (seqObj.inputType == "code") {
				console.error("Not implemented")
			}
		}
		return true
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
		hideLog()
		
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
		showLog()
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

const Validation = function(){

	
	const listError = function( title ){
		let msg = "can't parse the list, please pass numbers seperated by commas (example: 1,2,3)"
		if( title != undefined ){
			msg = title + ": " + msg
		}
		return msg
	}
	
	const requiredError = function(title){
		return `${title}: this is a required value, don't leave it empty!`
	}

	const typeError = function(title, value, expectedType){
		return `${title}: ${value} is a ${typeof(value)}, expected a ${expectedType}. `
	}

	const oeisError = function(code){
		return `${code}: Either an invalid OEIS code or not defined by sage!`
	}

    const builtIn = function( seqObj ){
		let schema = BuiltInSeqs[seqObj.inputValue].paramsSchema;
		let receivedParams = seqObj.parameters;
		
		let validationResult = {
			parsedFields: {},
			errors: []
		}
		Object.keys(receivedParams).forEach(
			( parameter ) => { 
				validateFromSchema( schema, parameter, receivedParams[parameter],  validationResult )
			 }
		)
		return validationResult
	}

	const oeis = function( seqObj ){
		let validationResult = {
			parsedFields: {},
			errors: []
		}
		seqObj.inputValue = seqObj.inputValue.trim();
		let oeisCode = seqObj.inputValue;
		if( !VALIDOEIS.includes(oeisCode) ){
			validationResult.errors.push(oeisError(oeisCode));
		}
		return validationResult
	}

	const list = function( seqObj ){
		let validationResult = {
			parsedFields: {},
			errors: []
		}
		try{
			seqObj.inputValue = JSON.parse( seqObj.inputValue )
		}
		catch{
			validationResult.errors.push( listError() )
		}
		return validationResult
	}

	const _module = function( moduleObj ){
		let schema = MODULES[moduleObj.moduleKey].configSchema;
		let receivedConfig = moduleObj.config;
		
		let validationResult = {
			parsedFields: {},
			errors: []
		}

		Object.keys(receivedConfig).forEach(
			( configField ) => { 
				validateFromSchema( schema, configField, receivedConfig[configField], validationResult )
			 }
		)
		return validationResult
	}

	const validateFromSchema = function( schema, field, value, validationResult ){
		let title = schema[field].title;
		console.log(value)
		if( typeof(input) == "string" ){
			var input = value.trim();
		}
		else{
			var input = value;
		}
		let expectedType = schema[field].type;
		let required = (schema[field].required !== undefined) ? schema[field].required : false;
		let format = (schema[field].format !== undefined ) ? schema[field].format : false;
		let isEmpty = ( input === '' )
		console.log(validationResult)
		if( required && isEmpty ){
			validationResult.errors.push( requiredError(title) )
		}
		if( isEmpty ){
			parsed = null;
		} 
		if( !isEmpty && (expectedType == "number" )){
			parsed = parseInt(input)
			if( parsed != parsed){ // https://stackoverflow.com/questions/34261938/what-is-the-difference-between-nan-nan-and-nan-nan
				validationResult.errors.push( typeError(title, input, expectedType) )
			}
		}
		if( !isEmpty && (expectedType == "string")){
			parsed = input
		}
		if( !isEmpty && (expectedType == "boolean")){
			if( input == '1'){
				parsed = true;
			}
			else{
				parsed = false;
			}
		}
		if( format && (format == "list" )){
			try{
				parsed = JSON.parse( "[" + input + "]" )
			}
			catch{
				validationResult.errors.push( listError( title ) )
			}
		}
		if( parsed !== undefined) {
			validationResult.parsedFields[ field ] = parsed
		}
	}

    return{
		builtIn: builtIn,
		oeis: oeis,
		list: list,
		module: _module
    }
}()



const LogPanel = function(){
	logGreen = function(line){
		$("#innerLogArea").append( `<p style="color:#00ff00">${line}</p><br>` );
	}
	logRed = function(line){
		$("#innerLogArea").append( `<p style="color:red">${line}</p><br>` );
	}
	clearlog = function(){
		$("#innerLogArea").empty();
	}
	hideLog = function(){
		$("#logArea").css('display','none');
	}
	showLog = function(){
		$("#logArea").css('display','block');
	}
	return {
		logGreen: logGreen,
		logRed: logRed,
		clearlog: clearlog,
		hideLog: hideLog,
		showLog: showLog,
	}
}()
window.NScore = NScore
window.LogPanel = LogPanel
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


BuiltInSeqs["Fibonacci"] = require('./sequenceFibonacci.js')
BuiltInSeqs["Lucas"] = require('./sequenceLucas.js')
BuiltInSeqs["Primes"] = require('./sequencePrimes.js')
BuiltInSeqs["Naturals"] = require('./sequenceNaturals.js')
BuiltInSeqs["LinRec"] = require('./sequenceLinRec.js')
BuiltInSeqs['Primes'] = require('./sequencePrimes.js')

},{"./sequenceFibonacci.js":7,"./sequenceLinRec.js":8,"./sequenceLucas.js":9,"./sequenceNaturals.js":10,"./sequencePrimes.js":11}],13:[function(require,module,exports){
module.exports = ["A000001", "A000027", "A000004", "A000005", "A000008", "A000009", "A000796", "A003418", "A007318", "A008275", "A008277", "A049310", "A000010", "A000007", "A005843", "A000035", "A000169", "A000272", "A000312", "A001477", "A004526", "A000326", "A002378", "A002620", "A005408", "A000012", "A000120", "A010060", "A000069", "A001969", "A000290", "A000225", "A000015", "A000016", "A000032", "A004086", "A002113", "A000030", "A000040", "A002808", "A018252", "A000043", "A000668", "A000396", "A005100", "A005101", "A002110", "A000720", "A064553", "A001055", "A006530", "A000961", "A005117", "A020639", "A000041", "A000045", "A000108", "A001006", "A000079", "A000578", "A000244", "A000302", "A000583", "A000142", "A000085", "A001189", "A000670", "A006318", "A000165", "A001147", "A006882", "A000984", "A001405", "A000292", "A000330", "A000153", "A000255", "A000261", "A001909", "A001910", "A090010", "A055790", "A090012", "A090013", "A090014", "A090015", "A090016", "A000166", "A000203", "A001157", "A008683", "A000204", "A000217", "A000124", "A002275", "A001110", "A051959", "A001221", "A001222", "A046660", "A001227", "A001358", "A001694", "A001836", "A001906", "A001333", "A001045", "A000129", "A001109", "A015521", "A015523", "A015530", "A015531", "A015551", "A082411", "A083103", "A083104", "A083105", "A083216", "A061084", "A000213", "A000073", "A079922", "A079923", "A109814", "A111774", "A111775", "A111787", "A000110", "A000587", "A000100"]

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvTlNjb3JlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlRGlmZmVyZW5jZXMuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVNb2RGaWxsLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlU2hpZnRDb21wYXJlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlVHVydGxlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9zZXF1ZW5jZXMvc2VxdWVuY2VGaWJvbmFjY2kuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvc2VxdWVuY2VzL3NlcXVlbmNlTGluUmVjLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZUx1Y2FzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZU5hdHVyYWxzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZVByaW1lcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9zZXF1ZW5jZXMvc2VxdWVuY2VzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3ZhbGlkT0VJUy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzS0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlNFUVVFTkNFID0gcmVxdWlyZSgnLi9zZXF1ZW5jZXMvc2VxdWVuY2VzLmpzJylcblZBTElET0VJUyA9IHJlcXVpcmUoJy4vdmFsaWRPRUlTLmpzJylcbk1PRFVMRVMgPSByZXF1aXJlKCcuL21vZHVsZXMvbW9kdWxlcy5qcycpXG5cbkJ1aWx0SW5TZXFzID0gU0VRVUVOQ0UuQnVpbHRJblNlcXNcbkxpc3RUb1NlcSA9IFNFUVVFTkNFLkxpc3RUb1NlcVxuT0VJU1RvU2VxID0gU0VRVUVOQ0UuT0VJU1RvU2VxXG5CdWlsdEluTmFtZVRvU2VxID0gU0VRVUVOQ0UuQnVpbHRJbk5hbWVUb1NlcVxuXG5mdW5jdGlvbiBzdHJpbmdUb0FycmF5KHN0ckFycikge1xuXHRyZXR1cm4gSlNPTi5wYXJzZShcIltcIiArIHN0ckFyciArIFwiXVwiKVxufVxuXG5jb25zdCBOU2NvcmUgPSBmdW5jdGlvbiAoKSB7XG5cdGNvbnN0IG1vZHVsZXMgPSBNT0RVTEVTIC8vICBjbGFzc2VzIHRvIHRoZSBkcmF3aW5nIG1vZHVsZXMgXG5cdGNvbnN0IHZhbGlkT0VJUyA9IFZBTElET0VJU1xuXHR2YXIgcHJlcGFyZWRTZXF1ZW5jZXMgPSBbXTsgLy8gc2VxdWVuY2VHZW5lcmF0b3JzIHRvIGJlIGRyYXduXG5cdHZhciBwcmVwYXJlZFRvb2xzID0gW107IC8vIGNob3NlbiBkcmF3aW5nIG1vZHVsZXMgXG5cdHZhciBsaXZlU2tldGNoZXMgPSBbXTsgLy8gcDUgc2tldGNoZXMgYmVpbmcgZHJhd25cblxuXHQvKipcblx0ICpcblx0ICpcblx0ICogQHBhcmFtIHsqfSBtb2R1bGVDbGFzcyBkcmF3aW5nIG1vZHVsZSB0byBiZSB1c2VkIGZvciB0aGlzIHNrZXRjaFxuXHQgKiBAcGFyYW0geyp9IGNvbmZpZyBjb3JyZXNwb25kaW5nIGNvbmZpZyBmb3IgZHJhd2luZyBtb2R1bGVcblx0ICogQHBhcmFtIHsqfSBzZXEgc2VxdWVuY2UgdG8gYmUgcGFzc2VkIHRvIGRyYXdpbmcgbW9kdWxlXG5cdCAqIEBwYXJhbSB7Kn0gZGl2SUQgZGl2IHdoZXJlIHNrZXRjaCB3aWxsIGJlIHBsYWNlZFxuXHQgKiBAcGFyYW0geyp9IHdpZHRoIHdpZHRoIG9mIHNrZXRjaFxuXHQgKiBAcGFyYW0geyp9IGhlaWdodCBoZWlnaHQgb2Ygc2tldGNoXG5cdCAqIEByZXR1cm5zIHA1IHNrZXRjaFxuXHQgKi9cblx0Y29uc3QgZ2VuZXJhdGVQNSA9IGZ1bmN0aW9uIChtb2R1bGVDbGFzcywgY29uZmlnLCBzZXEsIGRpdklELCB3aWR0aCwgaGVpZ2h0KSB7XG5cblx0XHQvL0NyZWF0ZSBjYW52YXMgZWxlbWVudCBoZXJlXG5cdFx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdC8vVGhlIHN0eWxlIG9mIHRoZSBjYW52YXNlcyB3aWxsIGJlIFwiY2FudmFzQ2xhc3NcIlxuXHRcdGRpdi5jbGFzc05hbWUgPSBcImNhbnZhc0NsYXNzXCJcblx0XHRkaXYuaWQgPSBcImxpdmVDYW52YXNcIiArIGRpdklEXG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNBcmVhXCIpLmFwcGVuZENoaWxkKGRpdik7XG5cdFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0Ly9DcmVhdGUgUDVqcyBpbnN0YW5jZVxuXHRcdGxldCBteXA1ID0gbmV3IHA1KGZ1bmN0aW9uIChza2V0Y2gpIHtcblx0XHRcdGxldCBtb2R1bGVJbnN0YW5jZSA9IG5ldyBtb2R1bGVDbGFzcyhzZXEsIHNrZXRjaCwgY29uZmlnKVxuXHRcdFx0c2tldGNoLnNldHVwID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRza2V0Y2guY3JlYXRlQ2FudmFzKHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0XHRza2V0Y2guYmFja2dyb3VuZChcIndoaXRlXCIpXG5cdFx0XHRcdG1vZHVsZUluc3RhbmNlLnNldHVwKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRza2V0Y2guZHJhdyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0bW9kdWxlSW5zdGFuY2UuZHJhdygpXG5cdFx0XHR9XG5cdFx0fSwgZGl2LmlkKTtcblx0XHRyZXR1cm4gbXlwNTtcblx0fVxuXG5cdC8qKlxuXHQgKiBXaGVuIHRoZSB1c2VyIGNob29zZXMgYSBkcmF3aW5nIG1vZHVsZSBhbmQgcHJvdmlkZXMgY29ycmVzcG9uZGluZyBjb25maWdcblx0ICogaXQgd2lsbCBhdXRvbWF0aWNhbGx5IGJlIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uLCB3aGljaCB3aWxsIHZhbGlkYXRlIGlucHV0XG5cdCAqIGFuZCBhcHBlbmQgaXQgdG8gdGhlIHByZXBhcmVkIHRvb2xzXG5cdCAqIEBwYXJhbSB7Kn0gbW9kdWxlT2JqIGluZm9ybWF0aW9uIHVzZWQgdG8gcHJlcGFyZSB0aGUgcmlnaHQgZHJhd2luZyBtb2R1bGUsIHRoaXMgaW5wdXRcblx0ICogdGhpcyB3aWxsIGNvbnRhaW4gYW4gSUQsIHRoZSBtb2R1bGVLZXkgd2hpY2ggc2hvdWxkIG1hdGNoIGEga2V5IGluIE1PRFVMRVNfSlNPTiwgYW5kXG5cdCAqIGEgY29uZmlnIG9iamVjdC5cblx0ICovXG5cdGNvbnN0IHJlY2VpdmVNb2R1bGUgPSBmdW5jdGlvbiAobW9kdWxlT2JqKSB7XG5cdFx0aWYgKChtb2R1bGVPYmouSUQgJiYgbW9kdWxlT2JqLm1vZHVsZUtleSAmJiBtb2R1bGVPYmouY29uZmlnICYmIG1vZHVsZXNbbW9kdWxlT2JqLm1vZHVsZUtleV0pID09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIk9uZSBvciBtb3JlIHVuZGVmaW5lZCBtb2R1bGUgcHJvcGVydGllcyByZWNlaXZlZCBpbiBOU2NvcmVcIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQgPSBWYWxpZGF0aW9uLm1vZHVsZShtb2R1bGVPYmopXG5cdFx0XHRpZiggdmFsaWRhdGlvblJlc3VsdC5lcnJvcnMubGVuZ3RoICE9IDApe1xuXHRcdFx0XHRwcmVwYXJlZFRvb2xzWyBtb2R1bGVPYmouSUQgXSA9IG51bGw7XG5cdFx0XHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0LmVycm9ycztcblx0XHRcdH1cblx0XHRcdG1vZHVsZU9iai5jb25maWcgPSB2YWxpZGF0aW9uUmVzdWx0LnBhcnNlZEZpZWxkc1xuXHRcdFx0cHJlcGFyZWRUb29sc1ttb2R1bGVPYmouSURdID0ge1xuXHRcdFx0XHRtb2R1bGU6IG1vZHVsZXNbbW9kdWxlT2JqLm1vZHVsZUtleV0sXG5cdFx0XHRcdGNvbmZpZzogbW9kdWxlT2JqLmNvbmZpZyxcblx0XHRcdFx0SUQ6IG1vZHVsZU9iai5JRFxuXHRcdFx0fTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBXaGVuIHRoZSB1c2VyIGNob29zZXMgYSBzZXF1ZW5jZSwgd2Ugd2lsbCBhdXRvbWF0aWNhbGx5IHBhc3MgaXQgdG8gdGhpcyBmdW5jdGlvblxuXHQgKiB3aGljaCB3aWxsIHZhbGlkYXRlIHRoZSBpbnB1dCwgYW5kIHRoZW4gZGVwZW5kaW5nIG9uIHRoZSBpbnB1dCB0eXBlLCBpdCB3aWxsIHByZXBhcmVcblx0ICogdGhlIHNlcXVlbmNlIGluIHNvbWUgd2F5IHRvIGdldCBhIHNlcXVlbmNlR2VuZXJhdG9yIG9iamVjdCB3aGljaCB3aWxsIGJlIGFwcGVuZGVkXG5cdCAqIHRvIHByZXBhcmVkU2VxdWVuY2VzXG5cdCAqIEBwYXJhbSB7Kn0gc2VxT2JqIGluZm9ybWF0aW9uIHVzZWQgdG8gcHJlcGFyZSB0aGUgcmlnaHQgc2VxdWVuY2UsIHRoaXMgd2lsbCBjb250YWluIGFcblx0ICogc2VxdWVuY2UgSUQsIHRoZSB0eXBlIG9mIGlucHV0LCBhbmQgdGhlIGlucHV0IGl0c2VsZiAoc2VxdWVuY2UgbmFtZSwgYSBsaXN0LCBhbiBPRUlTIG51bWJlci4uZXRjKS5cblx0ICovXG5cdGNvbnN0IHJlY2VpdmVTZXF1ZW5jZSA9IGZ1bmN0aW9uIChzZXFPYmopIHtcblx0XHRpZiAoKHNlcU9iai5JRCAmJiBzZXFPYmouaW5wdXRUeXBlICYmIHNlcU9iai5pbnB1dFZhbHVlICYmIHNlcU9iai5wYXJhbWV0ZXJzKSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJPbmUgb3IgbW9yZSB1bmRlZmluZWQgbW9kdWxlIHByb3BlcnRpZXMgcmVjZWl2ZWQgaW4gTlNjb3JlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBXZSB3aWxsIHByb2Nlc3MgZGlmZmVyZW50IGlucHV0cyBpbiBkaWZmZXJlbnQgd2F5c1xuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJidWlsdEluXCIpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdCA9IFZhbGlkYXRpb24uYnVpbHRJbihzZXFPYmopXG5cdFx0XHRcdGlmKCB2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5sZW5ndGggIT0gMCl7XG5cdFx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbIHNlcU9iai5JRCBdID0gbnVsbDtcblx0XHRcdFx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdC5lcnJvcnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc29sZS5sb2codmFsaWRhdGlvblJlc3VsdClcblx0XHRcdFx0c2VxT2JqLnBhcmFtZXRlcnMgPSB2YWxpZGF0aW9uUmVzdWx0LnBhcnNlZEZpZWxkc1xuXHRcdFx0XHRjb25zb2xlLmxvZyhzZXFPYmopXG5cdFx0XHRcdHByZXBhcmVkU2VxdWVuY2VzW3NlcU9iai5JRF0gPSBCdWlsdEluTmFtZVRvU2VxKHNlcU9iai5JRCwgc2VxT2JqLmlucHV0VmFsdWUsIHNlcU9iai5wYXJhbWV0ZXJzKVxuXHRcdFx0fVxuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJPRUlTXCIpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdCA9IFZhbGlkYXRpb24ub2Vpcyggc2VxT2JqIClcblx0XHRcdFx0aWYoIHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLmxlbmd0aCAhPSAwKXtcblx0XHRcdFx0XHRwcmVwYXJlZFNlcXVlbmNlc1sgc2VxT2JqLklEIF0gPSBudWxsO1xuXHRcdFx0XHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0LmVycm9ycztcblx0XHRcdFx0fVxuXHRcdFx0XHRwcmVwYXJlZFNlcXVlbmNlc1tzZXFPYmouSURdID0gT0VJU1RvU2VxKHNlcU9iai5JRCwgc2VxT2JqLmlucHV0VmFsdWUpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJsaXN0XCIpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdCA9IFZhbGlkYXRpb24ubGlzdCggc2VxT2JqIClcblx0XHRcdFx0aWYoIHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLmxlbmd0aCAhPSAwKXtcblx0XHRcdFx0XHRwcmVwYXJlZFNlcXVlbmNlc1sgc2VxT2JqLklEIF0gPSBudWxsO1xuXHRcdFx0XHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0LmVycm9ycztcblx0XHRcdFx0fVxuXHRcdFx0XHRwcmVwYXJlZFNlcXVlbmNlc1tzZXFPYmouSURdID0gTGlzdFRvU2VxKHNlcU9iai5JRCwgc2VxT2JqLmlucHV0VmFsdWUpO1xuXG5cdFx0XHR9XG5cdFx0XHRpZiAoc2VxT2JqLmlucHV0VHlwZSA9PSBcImNvZGVcIikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlXG5cdH1cblx0LyoqXG5cdCAqIFdlIGluaXRpYWxpemUgdGhlIGRyYXdpbmcgcHJvY2Vzc2luZy4gRmlyc3Qgd2UgY2FsY3VsYXRlIHRoZSBkaW1lbnNpb25zIG9mIGVhY2ggc2tldGNoXG5cdCAqIHRoZW4gd2UgcGFpciB1cCBzZXF1ZW5jZXMgYW5kIGRyYXdpbmcgbW9kdWxlcywgYW5kIGZpbmFsbHkgd2UgcGFzcyB0aGVtIHRvIGdlbmVyYXRlUDVcblx0ICogd2hpY2ggYWN0dWFsbHkgaW5zdGFudGlhdGVzIGRyYXdpbmcgbW9kdWxlcyBhbmQgYmVnaW5zIGRyYXdpbmcuXG5cdCAqIFxuXHQgKiBAcGFyYW0geyp9IHNlcVZpelBhaXJzIGEgbGlzdCBvZiBwYWlycyB3aGVyZSBlYWNoIHBhaXIgY29udGFpbnMgYW4gSUQgb2YgYSBzZXF1ZW5jZVxuXHQgKiBhbmQgYW4gSUQgb2YgYSBkcmF3aW5nIHRvb2wsIHRoaXMgbGV0cyB1cyBrbm93IHRvIHBhc3Mgd2hpY2ggc2VxdWVuY2UgdG8gd2hpY2hcblx0ICogZHJhd2luZyB0b29sLlxuXHQgKi9cblx0Y29uc3QgYmVnaW4gPSBmdW5jdGlvbiAoc2VxVml6UGFpcnMpIHtcblx0XHRoaWRlTG9nKClcblx0XHRcblx0XHQvL0ZpZ3VyaW5nIG91dCBsYXlvdXRcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0bGV0IHRvdGFsV2lkdGggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzQXJlYScpLm9mZnNldFdpZHRoO1xuXHRcdGxldCB0b3RhbEhlaWdodCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXNBcmVhJykub2Zmc2V0SGVpZ2h0O1xuXHRcdGxldCBjYW52YXNDb3VudCA9IHNlcVZpelBhaXJzLmxlbmd0aFxuXHRcdGxldCBncmlkU2l6ZSA9IE1hdGguY2VpbChNYXRoLnNxcnQoY2FudmFzQ291bnQpKTtcblx0XHRsZXQgaW5kaXZpZHVhbFdpZHRoID0gdG90YWxXaWR0aCAvIGdyaWRTaXplIC0gMjBcblx0XHRsZXQgaW5kaXZpZHVhbEhlaWdodCA9IHRvdGFsSGVpZ2h0IC8gZ3JpZFNpemVcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0XHRmb3IgKGxldCBwYWlyIG9mIHNlcVZpelBhaXJzKSB7XG5cdFx0XHRsZXQgY3VycmVudFNlcSA9IHByZXBhcmVkU2VxdWVuY2VzW3BhaXJbXCJzZXFJRFwiXV07XG5cdFx0XHRsZXQgY3VycmVudFRvb2wgPSBwcmVwYXJlZFRvb2xzW3BhaXJbXCJ0b29sSURcIl1dO1xuXHRcdFx0aWYgKGN1cnJlbnRTZXEgJiYgY3VycmVudFRvb2wgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJ1bmRlZmluZWQgSUQgZm9yIHRvb2wgb3Igc2VxdWVuY2VcIik7XG5cdFx0XHR9XG5cdFx0XHRsaXZlU2tldGNoZXMucHVzaChnZW5lcmF0ZVA1KGN1cnJlbnRUb29sWydtb2R1bGUnXVtcInZpelwiXSwgY3VycmVudFRvb2xbJ2NvbmZpZyddLCBjdXJyZW50U2VxLCBsaXZlU2tldGNoZXMubGVuZ3RoLCBpbmRpdmlkdWFsV2lkdGgsIGluZGl2aWR1YWxIZWlnaHQpKTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCBjbGVhciA9IGZ1bmN0aW9uICgpIHtcblx0XHRzaG93TG9nKClcblx0XHRpZiAobGl2ZVNrZXRjaGVzLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGl2ZVNrZXRjaGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGxpdmVTa2V0Y2hlc1tpXS5yZW1vdmUoKSAvL2RlbGV0ZSBjYW52YXMgZWxlbWVudFxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGNvbnN0IHBhdXNlID0gZnVuY3Rpb24gKCkge1xuXHRcdGxpdmVTa2V0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChza2V0Y2gpIHtcblx0XHRcdHNrZXRjaC5ub0xvb3AoKTtcblx0XHR9KVxuXHR9XG5cblx0Y29uc3QgcmVzdW1lID0gZnVuY3Rpb24gKCkge1xuXHRcdGxpdmVTa2V0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChza2V0Y2gpIHtcblx0XHRcdHNrZXRjaC5sb29wKClcblx0XHR9KVxuXHR9XG5cblx0Y29uc3Qgc3RlcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRsaXZlU2tldGNoZXMuZm9yRWFjaChmdW5jdGlvbiAoc2tldGNoKSB7XG5cdFx0XHRza2V0Y2gucmVkcmF3KCk7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0cmVjZWl2ZVNlcXVlbmNlOiByZWNlaXZlU2VxdWVuY2UsXG5cdFx0cmVjZWl2ZU1vZHVsZTogcmVjZWl2ZU1vZHVsZSxcblx0XHRsaXZlU2tldGNoZXM6IGxpdmVTa2V0Y2hlcyxcblx0XHRwcmVwYXJlZFNlcXVlbmNlczogcHJlcGFyZWRTZXF1ZW5jZXMsXG5cdFx0cHJlcGFyZWRUb29sczogcHJlcGFyZWRUb29scyxcblx0XHRtb2R1bGVzOiBtb2R1bGVzLFxuXHRcdHZhbGlkT0VJUzogdmFsaWRPRUlTLFxuXHRcdEJ1aWx0SW5TZXFzOiBCdWlsdEluU2Vxcyxcblx0XHRiZWdpbjogYmVnaW4sXG5cdFx0cGF1c2U6IHBhdXNlLFxuXHRcdHJlc3VtZTogcmVzdW1lLFxuXHRcdHN0ZXA6IHN0ZXAsXG5cdFx0Y2xlYXI6IGNsZWFyLFxuXHR9XG59KClcblxuY29uc3QgVmFsaWRhdGlvbiA9IGZ1bmN0aW9uKCl7XG5cblx0XG5cdGNvbnN0IGxpc3RFcnJvciA9IGZ1bmN0aW9uKCB0aXRsZSApe1xuXHRcdGxldCBtc2cgPSBcImNhbid0IHBhcnNlIHRoZSBsaXN0LCBwbGVhc2UgcGFzcyBudW1iZXJzIHNlcGVyYXRlZCBieSBjb21tYXMgKGV4YW1wbGU6IDEsMiwzKVwiXG5cdFx0aWYoIHRpdGxlICE9IHVuZGVmaW5lZCApe1xuXHRcdFx0bXNnID0gdGl0bGUgKyBcIjogXCIgKyBtc2dcblx0XHR9XG5cdFx0cmV0dXJuIG1zZ1xuXHR9XG5cdFxuXHRjb25zdCByZXF1aXJlZEVycm9yID0gZnVuY3Rpb24odGl0bGUpe1xuXHRcdHJldHVybiBgJHt0aXRsZX06IHRoaXMgaXMgYSByZXF1aXJlZCB2YWx1ZSwgZG9uJ3QgbGVhdmUgaXQgZW1wdHkhYFxuXHR9XG5cblx0Y29uc3QgdHlwZUVycm9yID0gZnVuY3Rpb24odGl0bGUsIHZhbHVlLCBleHBlY3RlZFR5cGUpe1xuXHRcdHJldHVybiBgJHt0aXRsZX06ICR7dmFsdWV9IGlzIGEgJHt0eXBlb2YodmFsdWUpfSwgZXhwZWN0ZWQgYSAke2V4cGVjdGVkVHlwZX0uIGBcblx0fVxuXG5cdGNvbnN0IG9laXNFcnJvciA9IGZ1bmN0aW9uKGNvZGUpe1xuXHRcdHJldHVybiBgJHtjb2RlfTogRWl0aGVyIGFuIGludmFsaWQgT0VJUyBjb2RlIG9yIG5vdCBkZWZpbmVkIGJ5IHNhZ2UhYFxuXHR9XG5cbiAgICBjb25zdCBidWlsdEluID0gZnVuY3Rpb24oIHNlcU9iaiApe1xuXHRcdGxldCBzY2hlbWEgPSBCdWlsdEluU2Vxc1tzZXFPYmouaW5wdXRWYWx1ZV0ucGFyYW1zU2NoZW1hO1xuXHRcdGxldCByZWNlaXZlZFBhcmFtcyA9IHNlcU9iai5wYXJhbWV0ZXJzO1xuXHRcdFxuXHRcdGxldCB2YWxpZGF0aW9uUmVzdWx0ID0ge1xuXHRcdFx0cGFyc2VkRmllbGRzOiB7fSxcblx0XHRcdGVycm9yczogW11cblx0XHR9XG5cdFx0T2JqZWN0LmtleXMocmVjZWl2ZWRQYXJhbXMpLmZvckVhY2goXG5cdFx0XHQoIHBhcmFtZXRlciApID0+IHsgXG5cdFx0XHRcdHZhbGlkYXRlRnJvbVNjaGVtYSggc2NoZW1hLCBwYXJhbWV0ZXIsIHJlY2VpdmVkUGFyYW1zW3BhcmFtZXRlcl0sICB2YWxpZGF0aW9uUmVzdWx0IClcblx0XHRcdCB9XG5cdFx0KVxuXHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0XG5cdH1cblxuXHRjb25zdCBvZWlzID0gZnVuY3Rpb24oIHNlcU9iaiApe1xuXHRcdGxldCB2YWxpZGF0aW9uUmVzdWx0ID0ge1xuXHRcdFx0cGFyc2VkRmllbGRzOiB7fSxcblx0XHRcdGVycm9yczogW11cblx0XHR9XG5cdFx0c2VxT2JqLmlucHV0VmFsdWUgPSBzZXFPYmouaW5wdXRWYWx1ZS50cmltKCk7XG5cdFx0bGV0IG9laXNDb2RlID0gc2VxT2JqLmlucHV0VmFsdWU7XG5cdFx0aWYoICFWQUxJRE9FSVMuaW5jbHVkZXMob2Vpc0NvZGUpICl7XG5cdFx0XHR2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5wdXNoKG9laXNFcnJvcihvZWlzQ29kZSkpO1xuXHRcdH1cblx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdFxuXHR9XG5cblx0Y29uc3QgbGlzdCA9IGZ1bmN0aW9uKCBzZXFPYmogKXtcblx0XHRsZXQgdmFsaWRhdGlvblJlc3VsdCA9IHtcblx0XHRcdHBhcnNlZEZpZWxkczoge30sXG5cdFx0XHRlcnJvcnM6IFtdXG5cdFx0fVxuXHRcdHRyeXtcblx0XHRcdHNlcU9iai5pbnB1dFZhbHVlID0gSlNPTi5wYXJzZSggc2VxT2JqLmlucHV0VmFsdWUgKVxuXHRcdH1cblx0XHRjYXRjaHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2goIGxpc3RFcnJvcigpIClcblx0XHR9XG5cdFx0cmV0dXJuIHZhbGlkYXRpb25SZXN1bHRcblx0fVxuXG5cdGNvbnN0IF9tb2R1bGUgPSBmdW5jdGlvbiggbW9kdWxlT2JqICl7XG5cdFx0bGV0IHNjaGVtYSA9IE1PRFVMRVNbbW9kdWxlT2JqLm1vZHVsZUtleV0uY29uZmlnU2NoZW1hO1xuXHRcdGxldCByZWNlaXZlZENvbmZpZyA9IG1vZHVsZU9iai5jb25maWc7XG5cdFx0XG5cdFx0bGV0IHZhbGlkYXRpb25SZXN1bHQgPSB7XG5cdFx0XHRwYXJzZWRGaWVsZHM6IHt9LFxuXHRcdFx0ZXJyb3JzOiBbXVxuXHRcdH1cblxuXHRcdE9iamVjdC5rZXlzKHJlY2VpdmVkQ29uZmlnKS5mb3JFYWNoKFxuXHRcdFx0KCBjb25maWdGaWVsZCApID0+IHsgXG5cdFx0XHRcdHZhbGlkYXRlRnJvbVNjaGVtYSggc2NoZW1hLCBjb25maWdGaWVsZCwgcmVjZWl2ZWRDb25maWdbY29uZmlnRmllbGRdLCB2YWxpZGF0aW9uUmVzdWx0IClcblx0XHRcdCB9XG5cdFx0KVxuXHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0XG5cdH1cblxuXHRjb25zdCB2YWxpZGF0ZUZyb21TY2hlbWEgPSBmdW5jdGlvbiggc2NoZW1hLCBmaWVsZCwgdmFsdWUsIHZhbGlkYXRpb25SZXN1bHQgKXtcblx0XHRsZXQgdGl0bGUgPSBzY2hlbWFbZmllbGRdLnRpdGxlO1xuXHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXHRcdGlmKCB0eXBlb2YoaW5wdXQpID09IFwic3RyaW5nXCIgKXtcblx0XHRcdHZhciBpbnB1dCA9IHZhbHVlLnRyaW0oKTtcblx0XHR9XG5cdFx0ZWxzZXtcblx0XHRcdHZhciBpbnB1dCA9IHZhbHVlO1xuXHRcdH1cblx0XHRsZXQgZXhwZWN0ZWRUeXBlID0gc2NoZW1hW2ZpZWxkXS50eXBlO1xuXHRcdGxldCByZXF1aXJlZCA9IChzY2hlbWFbZmllbGRdLnJlcXVpcmVkICE9PSB1bmRlZmluZWQpID8gc2NoZW1hW2ZpZWxkXS5yZXF1aXJlZCA6IGZhbHNlO1xuXHRcdGxldCBmb3JtYXQgPSAoc2NoZW1hW2ZpZWxkXS5mb3JtYXQgIT09IHVuZGVmaW5lZCApID8gc2NoZW1hW2ZpZWxkXS5mb3JtYXQgOiBmYWxzZTtcblx0XHRsZXQgaXNFbXB0eSA9ICggaW5wdXQgPT09ICcnIClcblx0XHRjb25zb2xlLmxvZyh2YWxpZGF0aW9uUmVzdWx0KVxuXHRcdGlmKCByZXF1aXJlZCAmJiBpc0VtcHR5ICl7XG5cdFx0XHR2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5wdXNoKCByZXF1aXJlZEVycm9yKHRpdGxlKSApXG5cdFx0fVxuXHRcdGlmKCBpc0VtcHR5ICl7XG5cdFx0XHRwYXJzZWQgPSBudWxsO1xuXHRcdH0gXG5cdFx0aWYoICFpc0VtcHR5ICYmIChleHBlY3RlZFR5cGUgPT0gXCJudW1iZXJcIiApKXtcblx0XHRcdHBhcnNlZCA9IHBhcnNlSW50KGlucHV0KVxuXHRcdFx0aWYoIHBhcnNlZCAhPSBwYXJzZWQpeyAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDI2MTkzOC93aGF0LWlzLXRoZS1kaWZmZXJlbmNlLWJldHdlZW4tbmFuLW5hbi1hbmQtbmFuLW5hblxuXHRcdFx0XHR2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5wdXNoKCB0eXBlRXJyb3IodGl0bGUsIGlucHV0LCBleHBlY3RlZFR5cGUpIClcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoICFpc0VtcHR5ICYmIChleHBlY3RlZFR5cGUgPT0gXCJzdHJpbmdcIikpe1xuXHRcdFx0cGFyc2VkID0gaW5wdXRcblx0XHR9XG5cdFx0aWYoICFpc0VtcHR5ICYmIChleHBlY3RlZFR5cGUgPT0gXCJib29sZWFuXCIpKXtcblx0XHRcdGlmKCBpbnB1dCA9PSAnMScpe1xuXHRcdFx0XHRwYXJzZWQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZXtcblx0XHRcdFx0cGFyc2VkID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKCBmb3JtYXQgJiYgKGZvcm1hdCA9PSBcImxpc3RcIiApKXtcblx0XHRcdHRyeXtcblx0XHRcdFx0cGFyc2VkID0gSlNPTi5wYXJzZSggXCJbXCIgKyBpbnB1dCArIFwiXVwiIClcblx0XHRcdH1cblx0XHRcdGNhdGNoe1xuXHRcdFx0XHR2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5wdXNoKCBsaXN0RXJyb3IoIHRpdGxlICkgKVxuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiggcGFyc2VkICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQucGFyc2VkRmllbGRzWyBmaWVsZCBdID0gcGFyc2VkXG5cdFx0fVxuXHR9XG5cbiAgICByZXR1cm57XG5cdFx0YnVpbHRJbjogYnVpbHRJbixcblx0XHRvZWlzOiBvZWlzLFxuXHRcdGxpc3Q6IGxpc3QsXG5cdFx0bW9kdWxlOiBfbW9kdWxlXG4gICAgfVxufSgpXG5cblxuXG5jb25zdCBMb2dQYW5lbCA9IGZ1bmN0aW9uKCl7XG5cdGxvZ0dyZWVuID0gZnVuY3Rpb24obGluZSl7XG5cdFx0JChcIiNpbm5lckxvZ0FyZWFcIikuYXBwZW5kKCBgPHAgc3R5bGU9XCJjb2xvcjojMDBmZjAwXCI+JHtsaW5lfTwvcD48YnI+YCApO1xuXHR9XG5cdGxvZ1JlZCA9IGZ1bmN0aW9uKGxpbmUpe1xuXHRcdCQoXCIjaW5uZXJMb2dBcmVhXCIpLmFwcGVuZCggYDxwIHN0eWxlPVwiY29sb3I6cmVkXCI+JHtsaW5lfTwvcD48YnI+YCApO1xuXHR9XG5cdGNsZWFybG9nID0gZnVuY3Rpb24oKXtcblx0XHQkKFwiI2lubmVyTG9nQXJlYVwiKS5lbXB0eSgpO1xuXHR9XG5cdGhpZGVMb2cgPSBmdW5jdGlvbigpe1xuXHRcdCQoXCIjbG9nQXJlYVwiKS5jc3MoJ2Rpc3BsYXknLCdub25lJyk7XG5cdH1cblx0c2hvd0xvZyA9IGZ1bmN0aW9uKCl7XG5cdFx0JChcIiNsb2dBcmVhXCIpLmNzcygnZGlzcGxheScsJ2Jsb2NrJyk7XG5cdH1cblx0cmV0dXJuIHtcblx0XHRsb2dHcmVlbjogbG9nR3JlZW4sXG5cdFx0bG9nUmVkOiBsb2dSZWQsXG5cdFx0Y2xlYXJsb2c6IGNsZWFybG9nLFxuXHRcdGhpZGVMb2c6IGhpZGVMb2csXG5cdFx0c2hvd0xvZzogc2hvd0xvZyxcblx0fVxufSgpXG53aW5kb3cuTlNjb3JlID0gTlNjb3JlXG53aW5kb3cuTG9nUGFuZWwgPSBMb2dQYW5lbCIsIi8qXG4gICAgdmFyIGxpc3Q9WzIsIDMsIDUsIDcsIDExLCAxMywgMTcsIDE5LCAyMywgMjksIDMxLCAzNywgNDEsIDQzLCA0NywgNTMsIDU5LCA2MSwgNjcsIDcxLCA3MywgNzksIDgzLCA4OSwgOTcsIDEwMSwgMTAzLCAxMDcsIDEwOSwgMTEzLCAxMjcsIDEzMSwgMTM3LCAxMzksIDE0OSwgMTUxLCAxNTcsIDE2MywgMTY3LCAxNzMsIDE3OSwgMTgxLCAxOTEsIDE5MywgMTk3LCAxOTksIDIxMSwgMjIzLCAyMjcsIDIyOSwgMjMzLCAyMzksIDI0MSwgMjUxLCAyNTcsIDI2MywgMjY5LCAyNzEsIDI3NywgMjgxLCAyODMsIDI5MywgMzA3LCAzMTEsIDMxMywgMzE3LCAzMzEsIDMzNywgMzQ3LCAzNDksIDM1MywgMzU5LCAzNjcsIDM3MywgMzc5LCAzODMsIDM4OSwgMzk3LCA0MDEsIDQwOSwgNDE5LCA0MjEsIDQzMSwgNDMzLCA0MzksIDQ0MywgNDQ5LCA0NTcsIDQ2MSwgNDYzLCA0NjcsIDQ3OSwgNDg3LCA0OTEsIDQ5OSwgNTAzLCA1MDksIDUyMSwgNTIzLCA1NDEsIDU0NywgNTU3LCA1NjMsIDU2OSwgNTcxLCA1NzcsIDU4NywgNTkzLCA1OTksIDYwMSwgNjA3LCA2MTMsIDYxNywgNjE5LCA2MzEsIDY0MSwgNjQzLCA2NDcsIDY1MywgNjU5LCA2NjEsIDY3MywgNjc3LCA2ODMsIDY5MSwgNzAxLCA3MDksIDcxOSwgNzI3LCA3MzMsIDczOSwgNzQzLCA3NTEsIDc1NywgNzYxLCA3NjksIDc3MywgNzg3LCA3OTcsIDgwOSwgODExLCA4MjEsIDgyMywgODI3LCA4MjksIDgzOSwgODUzLCA4NTcsIDg1OSwgODYzLCA4NzcsIDg4MSwgODgzLCA4ODcsIDkwNywgOTExLCA5MTksIDkyOSwgOTM3LCA5NDEsIDk0NywgOTUzLCA5NjcsIDk3MSwgOTc3LCA5ODMsIDk5MSwgOTk3LCAxMDA5LCAxMDEzLCAxMDE5LCAxMDIxLCAxMDMxLCAxMDMzLCAxMDM5LCAxMDQ5LCAxMDUxLCAxMDYxLCAxMDYzLCAxMDY5LCAxMDg3LCAxMDkxLCAxMDkzLCAxMDk3LCAxMTAzLCAxMTA5LCAxMTE3LCAxMTIzLCAxMTI5LCAxMTUxLCAxMTUzLCAxMTYzLCAxMTcxLCAxMTgxLCAxMTg3LCAxMTkzLCAxMjAxLCAxMjEzLCAxMjE3LCAxMjIzXTtcblxuKi9cblxuY2xhc3MgVklaX0RpZmZlcmVuY2VzIHtcblx0Y29uc3RydWN0b3Ioc2VxLCBza2V0Y2gsIGNvbmZpZykge1xuXG5cdFx0dGhpcy5uID0gY29uZmlnLm47ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL24gaXMgbnVtYmVyIG9mIHRlcm1zIG9mIHRvcCBzZXF1ZW5jZVxuXHRcdHRoaXMubGV2ZWxzID0gY29uZmlnLkxldmVsczsgICAgICAgICAgICAgICAgICAgICAgICAgLy9sZXZlbHMgaXMgbnVtYmVyIG9mIGxheWVycyBvZiB0aGUgcHlyYW1pZC90cmFwZXpvaWQgY3JlYXRlZCBieSB3cml0aW5nIHRoZSBkaWZmZXJlbmNlcy5cblx0XHR0aGlzLnNlcSA9IHNlcTtcblx0XHR0aGlzLnNrZXRjaCA9IHNrZXRjaDtcblx0fVxuXG5cdGRyYXdEaWZmZXJlbmNlcyhuLCBsZXZlbHMsIHNlcXVlbmNlKSB7XG5cblx0XHQvL2NoYW5nZWQgYmFja2dyb3VuZCBjb2xvciB0byBncmV5IHNpbmNlIHlvdSBjYW4ndCBzZWUgd2hhdCdzIGdvaW5nIG9uXG5cdFx0dGhpcy5za2V0Y2guYmFja2dyb3VuZCggJ2JsYWNrJyApXG5cblx0XHRuID0gTWF0aC5taW4obiwgc2VxdWVuY2UubGVuZ3RoKTtcblx0XHRsZXZlbHMgPSBNYXRoLm1pbihsZXZlbHMsIG4gLSAxKTtcblx0XHRsZXQgZm9udCwgZm9udFNpemUgPSAyMDtcblx0XHR0aGlzLnNrZXRjaC50ZXh0Rm9udChcIkFyaWFsXCIpO1xuXHRcdHRoaXMuc2tldGNoLnRleHRTaXplKGZvbnRTaXplKTtcblx0XHR0aGlzLnNrZXRjaC50ZXh0U3R5bGUodGhpcy5za2V0Y2guQk9MRClcblx0XHRsZXQgeERlbHRhID0gNTA7XG5cdFx0bGV0IHlEZWx0YSA9IDUwO1xuXHRcdGxldCBmaXJzdFggPSAzMDtcblx0XHRsZXQgZmlyc3RZID0gMzA7XG5cdFx0dGhpcy5za2V0Y2guY29sb3JNb2RlKHRoaXMuc2tldGNoLkhTQiwgMjU1KTtcblx0XHRsZXQgbXlDb2xvciA9IHRoaXMuc2tldGNoLmNvbG9yKDEwMCwgMjU1LCAxNTApO1xuXHRcdGxldCBodWU7XG5cdFx0XG5cdFx0bGV0IHdvcmtpbmdTZXF1ZW5jZSA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm47IGkrKykge1xuXHRcdFx0Y29uc29sZS5sb2coXCJpblwiKVxuXHRcdFx0d29ya2luZ1NlcXVlbmNlLnB1c2goc2VxdWVuY2UuZ2V0RWxlbWVudChpKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy93b3JraW5nU2VxdWVuY2UgY2FubmliYWxpemVzIGZpcnN0IG4gZWxlbWVudHMgb2Ygc2VxdWVuY2UuXG5cdFx0fVxuXG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGV2ZWxzOyBpKyspIHtcblx0XHRcdGh1ZSA9IChpICogMjU1IC8gNikgJSAyNTU7XG5cdFx0XHRteUNvbG9yID0gdGhpcy5za2V0Y2guY29sb3IoaHVlLCAxNTAsIDIwMCk7XG5cdFx0XHR0aGlzLnNrZXRjaC5maWxsKG15Q29sb3IpO1xuXHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCB3b3JraW5nU2VxdWVuY2UubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0dGhpcy5za2V0Y2gudGV4dCh3b3JraW5nU2VxdWVuY2Vbal0sIGZpcnN0WCArIGogKiB4RGVsdGEsIGZpcnN0WSArIGkgKiB5RGVsdGEpOyAgICAgICAgIC8vRHJhd3MgYW5kIHVwZGF0ZXMgd29ya2luZ1NlcXVlbmNlIHNpbXVsdGFuZW91c2x5LlxuXHRcdFx0XHRpZiAoaiA8IHdvcmtpbmdTZXF1ZW5jZS5sZW5ndGggLSAxKSB7XG5cdFx0XHRcdFx0d29ya2luZ1NlcXVlbmNlW2pdID0gd29ya2luZ1NlcXVlbmNlW2ogKyAxXSAtIHdvcmtpbmdTZXF1ZW5jZVtqXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR3b3JraW5nU2VxdWVuY2UubGVuZ3RoID0gd29ya2luZ1NlcXVlbmNlLmxlbmd0aCAtIDE7ICAgICAgICAgICAgICAgICAgICAgIC8vUmVtb3ZlcyBsYXN0IGVsZW1lbnQuXG5cdFx0XHRmaXJzdFggPSBmaXJzdFggKyAoMSAvIDIpICogeERlbHRhOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL01vdmVzIGxpbmUgZm9yd2FyZCBoYWxmIGZvciBweXJhbWlkIHNoYXBlLlxuXG5cdFx0fVxuXG5cdH1cblxuXHRzZXR1cCgpIHtcblx0fVxuXHRkcmF3KCkge1xuXHRcdHRoaXMuZHJhd0RpZmZlcmVuY2VzKHRoaXMubiwgdGhpcy5sZXZlbHMsIHRoaXMuc2VxKTtcblx0XHR0aGlzLnNrZXRjaC5ub0xvb3AoKTtcblx0fVxufVxuXG5cblxuY29uc3QgU0NIRU1BX0RpZmZlcmVuY2VzID0ge1xuXHRuOiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0bGU6ICdOJyxcblx0XHRkZXNjcmlwdGlvbjogJ051bWJlciBvZiBlbGVtZW50cycsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcblx0TGV2ZWxzOiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0bGU6ICdMZXZlbHMnLFxuXHRcdGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIGxldmVscycsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcbn1cblxuY29uc3QgTU9EVUxFX0RpZmZlcmVuY2VzID0ge1xuXHR2aXo6IFZJWl9EaWZmZXJlbmNlcyxcblx0bmFtZTogXCJEaWZmZXJlbmNlc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0Y29uZmlnU2NoZW1hOiBTQ0hFTUFfRGlmZmVyZW5jZXNcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9EaWZmZXJlbmNlcyIsIlxuXG4vL0FuIGV4YW1wbGUgbW9kdWxlXG5cblxuY2xhc3MgVklaX01vZEZpbGwge1xuXHRjb25zdHJ1Y3RvcihzZXEsIHNrZXRjaCwgY29uZmlnKSB7XG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2hcblx0XHR0aGlzLnNlcSA9IHNlcVxuICAgICAgICB0aGlzLm1vZERpbWVuc2lvbiA9IGNvbmZpZy5tb2REaW1lbnNpb25cblx0XHR0aGlzLmkgPSAwO1xuXHR9XG5cblx0ZHJhd05ldyhudW0sIHNlcSkge1xuXHRcdGxldCBibGFjayA9IHRoaXMuc2tldGNoLmNvbG9yKDApO1xuXHRcdHRoaXMuc2tldGNoLmZpbGwoYmxhY2spO1xuXHRcdGxldCBpO1xuXHRcdGxldCBqO1xuXHRcdGZvciAobGV0IG1vZCA9IDE7IG1vZCA8PSB0aGlzLm1vZERpbWVuc2lvbjsgbW9kKyspIHtcblx0XHRcdGkgPSBzZXEuZ2V0RWxlbWVudChudW0pICUgbW9kO1xuXHRcdFx0aiA9IG1vZCAtIDE7XG5cdFx0XHR0aGlzLnNrZXRjaC5yZWN0KGogKiB0aGlzLnJlY3RXaWR0aCwgdGhpcy5za2V0Y2guaGVpZ2h0IC0gKGkgKyAxKSAqIHRoaXMucmVjdEhlaWdodCwgdGhpcy5yZWN0V2lkdGgsIHRoaXMucmVjdEhlaWdodCk7XG5cdFx0fVxuXG5cdH1cblxuXHRzZXR1cCgpIHtcblx0XHR0aGlzLnJlY3RXaWR0aCA9IHRoaXMuc2tldGNoLndpZHRoIC8gdGhpcy5tb2REaW1lbnNpb247XG5cdFx0dGhpcy5yZWN0SGVpZ2h0ID0gdGhpcy5za2V0Y2guaGVpZ2h0IC8gdGhpcy5tb2REaW1lbnNpb247XG5cdFx0dGhpcy5za2V0Y2gubm9TdHJva2UoKTtcblx0fVxuXG5cdGRyYXcoKSB7XG5cdFx0dGhpcy5kcmF3TmV3KHRoaXMuaSwgdGhpcy5zZXEpO1xuXHRcdHRoaXMuaSsrO1xuXHRcdGlmIChpID09IDEwMDApIHtcblx0XHRcdHRoaXMuc2tldGNoLm5vTG9vcCgpO1xuXHRcdH1cblx0fVxuXG59XG5cbmNvbnN0IFNDSEVNQV9Nb2RGaWxsID0ge1xuICAgIG1vZERpbWVuc2lvbjoge1xuICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICB0aXRsZTogXCJNb2QgZGltZW5zaW9uXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlwiLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgIH1cbn1cblxuXG5jb25zdCBNT0RVTEVfTW9kRmlsbCA9IHtcblx0dml6OiBWSVpfTW9kRmlsbCxcblx0bmFtZTogXCJNb2QgRmlsbFwiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0Y29uZmlnU2NoZW1hOiBTQ0hFTUFfTW9kRmlsbFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9Nb2RGaWxsIiwiY2xhc3MgVklaX3NoaWZ0Q29tcGFyZXtcblx0Y29uc3RydWN0b3Ioc2VxLCBza2V0Y2gsIGNvbmZpZyl7XG5cdCAgICAvL1NrZXRjaCBpcyB5b3VyIGNhbnZhc1xuXHQgICAgLy9jb25maWcgaXMgdGhlIHBhcmFtZXRlcnMgeW91IGV4cGVjdFxuXHQgICAgLy9zZXEgaXMgdGhlIHNlcXVlbmNlIHlvdSBhcmUgZHJhd2luZ1xuXHRcdHRoaXMuc2tldGNoID0gc2tldGNoO1xuXHRcdHRoaXMuc2VxID0gc2VxO1xuXHRcdHRoaXMuTU9EID0gMlxuXHRcdC8vIFNldCB1cCB0aGUgaW1hZ2Ugb25jZS5cblx0fVxuXG5cdFxuXHRzZXR1cCgpIHtcblx0XHRjb25zb2xlLmxvZyh0aGlzLnNrZXRjaC5oZWlnaHQsIHRoaXMuc2tldGNoLndpZHRoKTtcblx0XHR0aGlzLmltZyA9IHRoaXMuc2tldGNoLmNyZWF0ZUltYWdlKHRoaXMuc2tldGNoLndpZHRoLCB0aGlzLnNrZXRjaC5oZWlnaHQpO1xuXHRcdHRoaXMuaW1nLmxvYWRQaXhlbHMoKTsgLy8gRW5hYmxlcyBwaXhlbC1sZXZlbCBlZGl0aW5nLlxuXHR9XG5cblx0Y2xpcChhLCBtaW4sIG1heClcblx0e1xuXHQgICAgaWYgKGEgPCBtaW4pXG5cdFx0e1xuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoYSA+IG1heClcblx0XHR7XG5cdFx0ICAgIHJldHVybiBtYXg7XG5cdFx0fVxuXHRcdHJldHVybiBhO1xuXHR9XG5cdFxuXG5cdGRyYXcoKXtcdFx0Ly9UaGlzIHdpbGwgYmUgY2FsbGVkIGV2ZXJ5dGltZSB0byBkcmF3XG5cdCAgICAvLyBFbnN1cmUgbW91c2UgY29vcmRpbmF0ZXMgYXJlIHNhbmUuXG5cdFx0Ly8gTW91c2UgY29vcmRpbmF0ZXMgbG9vayB0aGV5J3JlIGZsb2F0cyBieSBkZWZhdWx0LlxuXHRcdFxuXHRcdGxldCBkID0gdGhpcy5za2V0Y2gucGl4ZWxEZW5zaXR5KClcblx0XHRsZXQgbXggPSB0aGlzLmNsaXAoTWF0aC5yb3VuZCh0aGlzLnNrZXRjaC5tb3VzZVgpLCAwLCB0aGlzLnNrZXRjaC53aWR0aCk7XG5cdFx0bGV0IG15ID0gdGhpcy5jbGlwKE1hdGgucm91bmQodGhpcy5za2V0Y2gubW91c2VZKSwgMCwgdGhpcy5za2V0Y2guaGVpZ2h0KTtcblx0XHRpZiAodGhpcy5za2V0Y2gua2V5ID09ICdBcnJvd1VwJykge1xuXHRcdFx0dGhpcy5NT0QgKz0gMVxuXHRcdFx0dGhpcy5za2V0Y2gua2V5ID0gbnVsbFxuXHRcdFx0Y29uc29sZS5sb2coXCJVUCBQUkVTU0VELCBORVcgTU9EOiBcIiArIHRoaXMuTU9EKVxuXHRcdH1cblx0XHRlbHNlIGlmKHRoaXMuc2tldGNoLmtleSA9PSAnQXJyb3dEb3duJyl7XG5cdFx0XHR0aGlzLk1PRCAtPSAxXG5cdFx0XHR0aGlzLnNrZXRjaC5rZXkgPSBudWxsXG5cdFx0XHRjb25zb2xlLmxvZyhcIkRPV04gUFJFU1NFRCwgTkVXIE1PRDogXCIgKyB0aGlzLk1PRClcblx0XHR9XG5cdFx0ZWxzZSBpZih0aGlzLnNrZXRjaC5rZXkgPT0gJ0Fycm93UmlnaHQnKXtcblx0XHRcdGNvbnNvbGUubG9nKGNvbnNvbGUubG9nKFwiTVg6IFwiICsgbXggKyBcIiBNWTogXCIgKyBteSkpXG5cdFx0fVxuXHRcdC8vIFdyaXRlIHRvIGltYWdlLCB0aGVuIHRvIHNjcmVlbiBmb3Igc3BlZWQuXG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5za2V0Y2gud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB0aGlzLnNrZXRjaC5oZWlnaHQ7IHkrKykge1xuXHRcdFx0XHRmb3IoIGxldCBpID0gMDsgaSA8IGQ7IGkgKyspe1xuXHRcdFx0XHRcdGZvciggbGV0IGogPSAwOyBqIDwgZDsgaisrKXtcblx0XHRcdFx0XHRcdGxldCBpbmRleCA9IDQgKiAoKHkgKiBkICsgaikgKiB0aGlzLnNrZXRjaC53aWR0aCAqIGQgKyAoeCAqIGQgKyBpKSk7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5zZXEuZ2V0RWxlbWVudCh4KSAlICh0aGlzLk1PRCkgPT0gdGhpcy5zZXEuZ2V0RWxlbWVudCh5KSAlICh0aGlzLk1PRCkpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4XSA9IDI1NTtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgMV0gPSAyNTU7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDJdID0gMjU1O1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAzXSA9IDI1NTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleF0gPSAwO1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAxXSA9IDA7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDJdID0gMDtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgM10gPSAyNTU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG4gICAgICAgICAgICB9XG5cdFx0fVxuICAgICAgICBcbiAgICAgICAgdGhpcy5pbWcudXBkYXRlUGl4ZWxzKCk7IC8vIENvcGllcyBvdXIgZWRpdGVkIHBpeGVscyB0byB0aGUgaW1hZ2UuXG4gICAgICAgIFxuICAgICAgICB0aGlzLnNrZXRjaC5pbWFnZSh0aGlzLmltZywgMCwgMCk7IC8vIERpc3BsYXkgaW1hZ2UgdG8gc2NyZWVuLnRoaXMuc2tldGNoLmxpbmUoNTAsNTAsMTAwLDEwMCk7XG5cdH1cbn1cblxuXG5jb25zdCBNT0RVTEVfU2hpZnRDb21wYXJlID0ge1xuXHR2aXo6IFZJWl9zaGlmdENvbXBhcmUsXG5cdG5hbWU6IFwiU2hpZnQgQ29tcGFyZVwiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0Y29uZmlnU2NoZW1hOiB7fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9TaGlmdENvbXBhcmU7IiwiY2xhc3MgVklaX1R1cnRsZSB7XG5cdGNvbnN0cnVjdG9yKHNlcSwgc2tldGNoLCBjb25maWcpIHtcblx0XHR2YXIgZG9tYWluID0gY29uZmlnWydkb21haW4nXVxuXHRcdHZhciByYW5nZSA9IGNvbmZpZ1sncmFuZ2UnXVxuXHRcdHRoaXMucm90TWFwID0ge31cblx0XHRmb3IobGV0IGkgPSAwOyBpIDwgZG9tYWluLmxlbmd0aDsgaSsrKXtcblx0XHRcdHRoaXMucm90TWFwW2RvbWFpbltpXV0gPSAoTWF0aC5QSS8xODApKnJhbmdlW2ldXG5cdFx0fVxuXHRcdHRoaXMuc3RlcFNpemUgPSBjb25maWcuc3RlcFNpemU7XG5cdFx0dGhpcy5iZ0NvbG9yID0gY29uZmlnLmJnQ29sb3I7XG5cdFx0dGhpcy5zdHJva2VDb2xvciA9IGNvbmZpZy5zdHJva2VDb2xvcjtcblx0XHR0aGlzLnN0cm9rZVdpZHRoID0gY29uZmlnLnN0cm9rZVdlaWdodFxuXHRcdHRoaXMuc2VxID0gc2VxO1xuXHRcdHRoaXMuY3VycmVudEluZGV4ID0gMDtcblx0XHR0aGlzLm9yaWVudGF0aW9uID0gMDtcblx0XHR0aGlzLnNrZXRjaCA9IHNrZXRjaDtcblx0XHRpZihjb25maWcuc3RhcnRpbmdYICE9IFwiXCIpe1xuXHRcdFx0dGhpcy5YID0gY29uZmlnLnN0YXJ0aW5nWFxuXHRcdFx0dGhpcy5ZID0gY29uZmlnLnN0YXJ0aW5nWVxuXHRcdH1cblx0XHRlbHNle1xuXHRcdFx0dGhpcy5YID0gbnVsbDtcblx0XHRcdHRoaXMuWSA9IG51bGw7XG5cdFx0fVxuXG5cdH1cblx0c3RlcERyYXcoKSB7XG5cdFx0bGV0IG9sZFggPSB0aGlzLlg7XG5cdFx0bGV0IG9sZFkgPSB0aGlzLlk7XG5cdFx0bGV0IGN1cnJFbGVtZW50ID0gdGhpcy5zZXEuZ2V0RWxlbWVudCh0aGlzLmN1cnJlbnRJbmRleCsrKTtcblx0XHRsZXQgYW5nbGUgPSB0aGlzLnJvdE1hcFsgY3VyckVsZW1lbnQgXTtcblx0XHRpZihhbmdsZSA9PSB1bmRlZmluZWQpe1xuXHRcdFx0dGhyb3cgKCdhbmdsZSB1bmRlZmluZWQgZm9yIGVsZW1lbnQ6ICcgKyBjdXJyRWxlbWVudClcblx0XHR9XG5cdFx0dGhpcy5vcmllbnRhdGlvbiA9ICh0aGlzLm9yaWVudGF0aW9uICsgYW5nbGUpO1xuXHRcdHRoaXMuWCArPSB0aGlzLnN0ZXBTaXplICogTWF0aC5jb3ModGhpcy5vcmllbnRhdGlvbik7XG5cdFx0dGhpcy5ZICs9IHRoaXMuc3RlcFNpemUgKiBNYXRoLnNpbih0aGlzLm9yaWVudGF0aW9uKTtcblx0XHR0aGlzLnNrZXRjaC5saW5lKG9sZFgsIG9sZFksIHRoaXMuWCwgdGhpcy5ZKTtcblx0fVxuXHRzZXR1cCgpIHtcblx0XHR0aGlzLlggPSB0aGlzLnNrZXRjaC53aWR0aCAvIDI7XG5cdFx0dGhpcy5ZID0gdGhpcy5za2V0Y2guaGVpZ2h0IC8gMjtcblx0XHR0aGlzLnNrZXRjaC5iYWNrZ3JvdW5kKHRoaXMuYmdDb2xvcik7XG5cdFx0dGhpcy5za2V0Y2guc3Ryb2tlKHRoaXMuc3Ryb2tlQ29sb3IpO1xuXHRcdHRoaXMuc2tldGNoLnN0cm9rZVdlaWdodCh0aGlzLnN0cm9rZVdpZHRoKVxuXHR9XG5cdGRyYXcoKSB7XG5cdFx0dGhpcy5zdGVwRHJhdygpO1xuXHR9XG59XG5cblxuY29uc3QgU0NIRU1BX1R1cnRsZSA9IHtcblx0ZG9tYWluOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdTZXF1ZW5jZSBEb21haW4nLFxuXHRcdGRlc2NyaXB0aW9uOiAnQ29tbWEgc2VwZXJhdGVkIG51bWJlcnMnLFxuXHRcdGZvcm1hdDonbGlzdCcsXG5cdFx0ZGVmYXVsdDogXCIwLDEsMiwzLDRcIixcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRyYW5nZToge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdHRpdGxlOiAnQW5nbGVzJyxcblx0XHRkZWZhdWx0OiBcIjMwLDQ1LDYwLDkwLDEyMFwiLFxuXHRcdGZvcm1hdDonbGlzdCcsXG5cdFx0ZGVzY3JpcHRpb246ICdDb21tYSBzZXBlcmF0ZWQgbnVtYmVycycsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcblx0c3RlcFNpemU6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ1N0ZXAgU2l6ZScsXG5cdFx0ZGVmYXVsdDogMjAsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcblx0c3Ryb2tlV2VpZ2h0OiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0bGU6ICdTdHJva2UgV2lkdGgnLFxuXHRcdGRlZmF1bHQ6IDUsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcblx0c3RhcnRpbmdYOiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0ZTogJ1ggc3RhcnQnXG5cdH0sXG5cdHN0YXJ0aW5nWToge1xuXHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdHRpdGU6ICdZIHN0YXJ0J1xuXHR9LFxuXHRiZ0NvbG9yOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdCYWNrZ3JvdW5kIENvbG9yJyxcblx0XHRmb3JtYXQ6ICdjb2xvcicsXG5cdFx0ZGVmYXVsdDogXCIjNjY2NjY2XCIsXG5cdFx0cmVxdWlyZWQ6IGZhbHNlXG5cdH0sXG5cdHN0cm9rZUNvbG9yOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdTdHJva2UgQ29sb3InLFxuXHRcdGZvcm1hdDogJ2NvbG9yJyxcblx0XHRkZWZhdWx0OiAnI2ZmMDAwMCcsXG5cdFx0cmVxdWlyZWQ6IGZhbHNlXG5cdH0sXG5cdHRlc3RUaGluZzoge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdHRpdGxlOiAnaGVsbG8nLFxuXHRcdGZvcmFtdDogJ2xpc3QnXG5cdH1cbn1cblxuY29uc3QgTU9EVUxFX1R1cnRsZSA9IHtcblx0dml6OiBWSVpfVHVydGxlLFxuXHRuYW1lOiBcIlR1cnRsZVwiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0Y29uZmlnU2NoZW1hOiBTQ0hFTUFfVHVydGxlXG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNT0RVTEVfVHVydGxlIiwiLy9BZGQgYW4gaW1wb3J0IGxpbmUgaGVyZSBmb3IgbmV3IG1vZHVsZXNcblxuXG4vL0FkZCBuZXcgbW9kdWxlcyB0byB0aGlzIGNvbnN0YW50LlxuY29uc3QgTU9EVUxFUyA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFU1xuXG5NT0RVTEVTW1wiVHVydGxlXCJdID0gcmVxdWlyZSgnLi9tb2R1bGVUdXJ0bGUuanMnKVxuTU9EVUxFU1tcIlNoaWZ0Q29tcGFyZVwiXSA9IHJlcXVpcmUoJy4vbW9kdWxlU2hpZnRDb21wYXJlLmpzJylcbk1PRFVMRVNbXCJEaWZmZXJlbmNlc1wiXSA9IHJlcXVpcmUoJy4vbW9kdWxlRGlmZmVyZW5jZXMuanMnKVxuTU9EVUxFU1tcIk1vZEZpbGxcIl0gPSByZXF1aXJlKCcuL21vZHVsZU1vZEZpbGwuanMnKSIsIlxuU0VRX2xpbmVhclJlY3VycmVuY2UgPSByZXF1aXJlKCcuL3NlcXVlbmNlTGluUmVjLmpzJylcblxuZnVuY3Rpb24gR0VOX2ZpYm9uYWNjaSh7XG4gICAgbVxufSkge1xuICAgIHJldHVybiBTRVFfbGluZWFyUmVjdXJyZW5jZS5nZW5lcmF0b3Ioe1xuICAgICAgICBjb2VmZmljaWVudExpc3Q6IFsxLCAxXSxcbiAgICAgICAgc2VlZExpc3Q6IFsxLCAxXSxcbiAgICAgICAgbVxuICAgIH0pO1xufVxuXG5jb25zdCBTQ0hFTUFfRmlib25hY2NpPSB7XG4gICAgbToge1xuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgdGl0bGU6ICdNb2QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0EgbnVtYmVyIHRvIG1vZCB0aGUgc2VxdWVuY2UgYnkgYnknLFxuICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICB9XG59XG5cblxuY29uc3QgU0VRX2ZpYm9uYWNjaSA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9maWJvbmFjY2ksXG5cdG5hbWU6IFwiRmlib25hY2NpXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRwYXJhbXNTY2hlbWE6IFNDSEVNQV9GaWJvbmFjY2lcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTRVFfZmlib25hY2NpIiwiXG5cbmZ1bmN0aW9uIEdFTl9saW5lYXJSZWN1cnJlbmNlKHtcbiAgICBjb2VmZmljaWVudExpc3QsXG4gICAgc2VlZExpc3QsXG4gICAgbVxufSkge1xuICAgIGlmIChjb2VmZmljaWVudExpc3QubGVuZ3RoICE9IHNlZWRMaXN0Lmxlbmd0aCkge1xuICAgICAgICAvL051bWJlciBvZiBzZWVkcyBzaG91bGQgbWF0Y2ggdGhlIG51bWJlciBvZiBjb2VmZmljaWVudHNcbiAgICAgICAgY29uc29sZS5sb2coXCJudW1iZXIgb2YgY29lZmZpY2llbnRzIG5vdCBlcXVhbCB0byBudW1iZXIgb2Ygc2VlZHMgXCIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbGV0IGsgPSBjb2VmZmljaWVudExpc3QubGVuZ3RoO1xuICAgIGlmIChtICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb2VmZmljaWVudExpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvZWZmaWNpZW50TGlzdFtpXSA9IGNvZWZmaWNpZW50TGlzdFtpXSAlIG07XG4gICAgICAgICAgICBzZWVkTGlzdFtpXSA9IHNlZWRMaXN0W2ldICUgbTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJpY0xpblJlYyA9IGZ1bmN0aW9uIChuLCBjYWNoZSkge1xuICAgICAgICAgICAgaWYoIG4gPCBzZWVkTGlzdC5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGNhY2hlW25dID0gc2VlZExpc3Rbbl1cbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVbbl0gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gY2FjaGUubGVuZ3RoOyBpIDw9IG47IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1bSArPSBjYWNoZVtpIC0gaiAtIDFdICogY29lZmZpY2llbnRMaXN0W2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWNoZVtpXSA9IHN1bSAlIG07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVbbl07XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZ2VuZXJpY0xpblJlYyA9IGZ1bmN0aW9uIChuLCBjYWNoZSkge1xuICAgICAgICAgICAgaWYoIG4gPCBzZWVkTGlzdC5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGNhY2hlW25dID0gc2VlZExpc3Rbbl1cbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVbbl0gXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBjYWNoZS5sZW5ndGg7IGkgPD0gbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtICs9IGNhY2hlW2kgLSBqIC0gMV0gKiBjb2VmZmljaWVudExpc3Rbal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhY2hlW2ldID0gc3VtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlW25dO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBnZW5lcmljTGluUmVjXG59XG5cbmNvbnN0IFNDSEVNQV9saW5lYXJSZWN1cnJlbmNlID0ge1xuICAgIGNvZWZmaWNpZW50TGlzdDoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgdGl0bGU6ICdDb2VmZmljaWVudHMgbGlzdCcsXG4gICAgICAgIGZvcm1hdDonbGlzdCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tbWEgc2VwZXJhdGVkIG51bWJlcnMnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgIH0sXG4gICAgc2VlZExpc3Q6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIHRpdGxlOiAnU2VlZCBsaXN0JyxcbiAgICAgICAgZm9ybWF0OidsaXN0JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDb21tYSBzZXBlcmF0ZWQgbnVtYmVycycsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgfSxcbiAgICBtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICB0aXRsZTogJ01vZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBudW1iZXIgdG8gbW9kIHRoZSBzZXF1ZW5jZSBieSBieScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn1cblxuXG5jb25zdCBTRVFfbGluZWFyUmVjdXJyZW5jZSA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9saW5lYXJSZWN1cnJlbmNlLFxuXHRuYW1lOiBcIkxpbmVhciBSZWN1cnJlbmNlXCIsXG5cdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRwYXJhbXNTY2hlbWE6IFNDSEVNQV9saW5lYXJSZWN1cnJlbmNlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX2xpbmVhclJlY3VycmVuY2UiLCJcbmNvbnN0IFNFUV9saW5lYXJSZWN1cnJlbmNlID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUxpblJlYy5qcycpXG5cbmZ1bmN0aW9uIEdFTl9MdWNhcyh7XG4gICAgbVxufSkge1xuICAgIHJldHVybiBTRVFfbGluZWFyUmVjdXJyZW5jZS5nZW5lcmF0b3Ioe1xuICAgICAgICBjb2VmZmljaWVudExpc3Q6IFsxLCAxXSxcbiAgICAgICAgc2VlZExpc3Q6IFsyLCAxXSxcbiAgICAgICAgbVxuICAgIH0pO1xufVxuXG5jb25zdCBTQ0hFTUFfTHVjYXM9IHtcbiAgICBtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICB0aXRsZTogJ01vZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBudW1iZXIgdG8gbW9kIHRoZSBzZXF1ZW5jZSBieSBieScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn1cblxuXG5jb25zdCBTRVFfTHVjYXMgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fTHVjYXMsXG5cdG5hbWU6IFwiTHVjYXNcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdHBhcmFtc1NjaGVtYTogU0NIRU1BX0x1Y2FzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX0x1Y2FzIiwiXG5cbmZ1bmN0aW9uIEdFTl9OYXR1cmFscyh7XG4gICAgaW5jbHVkZXplcm9cbn0pe1xuICAgIGlmKGluY2x1ZGV6ZXJvKXtcbiAgICAgICAgcmV0dXJuICggKG4pID0+IG4gKVxuICAgIH1cbiAgICBlbHNle1xuICAgICAgICByZXR1cm4gKCAobikgPT4gbiArIDEgKVxuICAgIH1cbn1cblxuY29uc3QgU0NIRU1BX05hdHVyYWxzPSB7XG4gICAgaW5jbHVkZXplcm86IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICB0aXRsZTogJ0luY2x1ZGUgemVybycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcbiAgICAgICAgZGVmYXVsdDogJ2ZhbHNlJyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufVxuXG5cbmNvbnN0IFNFUV9OYXR1cmFscyA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9OYXR1cmFscyxcblx0bmFtZTogXCJOYXR1cmFsc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfTmF0dXJhbHNcbn1cblxuLy8gZXhwb3J0IGRlZmF1bHQgU0VRX05hdHVyYWxzXG5tb2R1bGUuZXhwb3J0cyA9IFNFUV9OYXR1cmFscyIsIlxuXG5mdW5jdGlvbiBHRU5fUHJpbWVzKCkge1xuICAgIGNvbnN0IHByaW1lcyA9IGZ1bmN0aW9uIChuLCBjYWNoZSkge1xuICAgICAgICBpZihjYWNoZS5sZW5ndGggPT0gMCl7XG4gICAgICAgICAgICBjYWNoZS5wdXNoKDIpXG4gICAgICAgICAgICBjYWNoZS5wdXNoKDMpXG4gICAgICAgICAgICBjYWNoZS5wdXNoKDUpXG4gICAgICAgIH1cbiAgICAgICAgbGV0IGkgPSBjYWNoZVtjYWNoZS5sZW5ndGggLSAxXSArIDFcbiAgICAgICAgbGV0IGsgPSAwXG4gICAgICAgIHdoaWxlIChjYWNoZS5sZW5ndGggPD0gbikge1xuICAgICAgICAgICAgbGV0IGlzUHJpbWUgPSB0cnVlXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNhY2hlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgJSBjYWNoZVtqXSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJpbWUgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc1ByaW1lKSB7XG4gICAgICAgICAgICAgICAgY2FjaGUucHVzaChpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWNoZVtuXVxuICAgIH1cbiAgICByZXR1cm4gcHJpbWVzXG59XG5cblxuY29uc3QgU0NIRU1BX1ByaW1lcz0ge1xuICAgIG06IHtcbiAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgIHRpdGxlOiAnTW9kJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBIG51bWJlciB0byBtb2QgdGhlIHNlcXVlbmNlIGJ5JyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufVxuXG5cbmNvbnN0IFNFUV9QcmltZXMgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fUHJpbWVzLFxuXHRuYW1lOiBcIlByaW1lc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0cGFyYW1zU2NoZW1hOiBTQ0hFTUFfUHJpbWVzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX1ByaW1lcyIsIi8qKlxuICpcbiAqIEBjbGFzcyBTZXF1ZW5jZUdlbmVyYXRvclxuICovXG5jbGFzcyBTZXF1ZW5jZUdlbmVyYXRvciB7XG4gICAgLyoqXG4gICAgICpDcmVhdGVzIGFuIGluc3RhbmNlIG9mIFNlcXVlbmNlR2VuZXJhdG9yLlxuICAgICAqIEBwYXJhbSB7Kn0gZ2VuZXJhdG9yIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIG5hdHVyYWwgbnVtYmVyIGFuZCByZXR1cm5zIGEgbnVtYmVyLCBpdCBjYW4gb3B0aW9uYWxseSB0YWtlIHRoZSBjYWNoZSBhcyBhIHNlY29uZCBhcmd1bWVudFxuICAgICAqIEBwYXJhbSB7Kn0gSUQgdGhlIElEIG9mIHRoZSBzZXF1ZW5jZVxuICAgICAqIEBtZW1iZXJvZiBTZXF1ZW5jZUdlbmVyYXRvclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKElELCBnZW5lcmF0b3IpIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgIHRoaXMuSUQgPSBJRDtcbiAgICAgICAgdGhpcy5jYWNoZSA9IFtdO1xuICAgICAgICB0aGlzLm5ld1NpemUgPSAxO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBpZiB3ZSBuZWVkIHRvIGdldCB0aGUgbnRoIGVsZW1lbnQgYW5kIGl0J3Mgbm90IHByZXNlbnQgaW5cbiAgICAgKiBpbiB0aGUgY2FjaGUsIHRoZW4gd2UgZWl0aGVyIGRvdWJsZSB0aGUgc2l6ZSwgb3IgdGhlIFxuICAgICAqIG5ldyBzaXplIGJlY29tZXMgbisxXG4gICAgICogQHBhcmFtIHsqfSBuIFxuICAgICAqIEBtZW1iZXJvZiBTZXF1ZW5jZUdlbmVyYXRvclxuICAgICAqL1xuICAgIHJlc2l6ZUNhY2hlKG4pIHtcbiAgICAgICAgdGhpcy5uZXdTaXplID0gdGhpcy5jYWNoZS5sZW5ndGggKiAyO1xuICAgICAgICBpZiAobiArIDEgPiB0aGlzLm5ld1NpemUpIHtcbiAgICAgICAgICAgIHRoaXMubmV3U2l6ZSA9IG4gKyAxO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBvcHVsYXRlcyB0aGUgY2FjaGUgdXAgdW50aWwgdGhlIGN1cnJlbnQgbmV3U2l6ZVxuICAgICAqIHRoaXMgaXMgY2FsbGVkIGFmdGVyIHJlc2l6ZUNhY2hlXG4gICAgICogQG1lbWJlcm9mIFNlcXVlbmNlR2VuZXJhdG9yXG4gICAgICovXG4gICAgZmlsbENhY2hlKCkge1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5jYWNoZS5sZW5ndGg7IGkgPCB0aGlzLm5ld1NpemU7IGkrKykge1xuICAgICAgICAgICAgLy90aGUgZ2VuZXJhdG9yIGlzIGdpdmVuIHRoZSBjYWNoZSBzaW5jZSBpdCB3b3VsZCBtYWtlIGNvbXB1dGF0aW9uIG1vcmUgZWZmaWNpZW50IHNvbWV0aW1lc1xuICAgICAgICAgICAgLy9idXQgdGhlIGdlbmVyYXRvciBkb2Vzbid0IG5lY2Vzc2FyaWx5IG5lZWQgdG8gdGFrZSBtb3JlIHRoYW4gb25lIGFyZ3VtZW50LlxuICAgICAgICAgICAgdGhpcy5jYWNoZVtpXSA9IHRoaXMuZ2VuZXJhdG9yKGksIHRoaXMuY2FjaGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBlbGVtZW50IGlzIHdoYXQgdGhlIGRyYXdpbmcgdG9vbHMgd2lsbCBiZSBjYWxsaW5nLCBpdCByZXRyaWV2ZXNcbiAgICAgKiB0aGUgbnRoIGVsZW1lbnQgb2YgdGhlIHNlcXVlbmNlIGJ5IGVpdGhlciBnZXR0aW5nIGl0IGZyb20gdGhlIGNhY2hlXG4gICAgICogb3IgaWYgaXNuJ3QgcHJlc2VudCwgYnkgYnVpbGRpbmcgdGhlIGNhY2hlIGFuZCB0aGVuIGdldHRpbmcgaXRcbiAgICAgKiBAcGFyYW0geyp9IG4gdGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBzZXF1ZW5jZSB3ZSB3YW50XG4gICAgICogQHJldHVybnMgYSBudW1iZXJcbiAgICAgKiBAbWVtYmVyb2YgU2VxdWVuY2VHZW5lcmF0b3JcbiAgICAgKi9cbiAgICBnZXRFbGVtZW50KG4pIHtcbiAgICAgICAgaWYgKHRoaXMuY2FjaGVbbl0gIT0gdW5kZWZpbmVkIHx8IHRoaXMuZmluaXRlKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImNhY2hlIGhpdFwiKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImNhY2hlIG1pc3NcIilcbiAgICAgICAgICAgIHRoaXMucmVzaXplQ2FjaGUobik7XG4gICAgICAgICAgICB0aGlzLmZpbGxDYWNoZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVbbl07XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuLyoqXG4gKlxuICpcbiAqIEBwYXJhbSB7Kn0gY29kZSBhcmJpdHJhcnkgc2FnZSBjb2RlIHRvIGJlIGV4ZWN1dGVkIG9uIGFsZXBoXG4gKiBAcmV0dXJucyBhamF4IHJlc3BvbnNlIG9iamVjdFxuICovXG5mdW5jdGlvbiBzYWdlRXhlY3V0ZShjb2RlKSB7XG4gICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgYXN5bmM6IGZhbHNlLFxuICAgICAgICB1cmw6ICdodHRwOi8vYWxlcGguc2FnZW1hdGgub3JnL3NlcnZpY2UnLFxuICAgICAgICBkYXRhOiBcImNvZGU9XCIgKyBjb2RlXG4gICAgfSlcbn1cblxuLyoqXG4gKlxuICpcbiAqIEBwYXJhbSB7Kn0gY29kZSBhcmJpdHJhcnkgc2FnZSBjb2RlIHRvIGJlIGV4ZWN1dGVkIG9uIGFsZXBoXG4gKiBAcmV0dXJucyBhamF4IHJlc3BvbnNlIG9iamVjdFxuICovXG5hc3luYyBmdW5jdGlvbiBzYWdlRXhlY3V0ZUFzeW5jKGNvZGUpIHtcbiAgICByZXR1cm4gYXdhaXQgJC5hamF4KHtcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICB1cmw6ICdodHRwOi8vYWxlcGguc2FnZW1hdGgub3JnL3NlcnZpY2UnLFxuICAgICAgICBkYXRhOiBcImNvZGU9XCIgKyBjb2RlXG4gICAgfSlcbn1cblxuXG5jbGFzcyBPRUlTU2VxdWVuY2VHZW5lcmF0b3Ige1xuICAgIGNvbnN0cnVjdG9yKElELCBPRUlTKSB7XG4gICAgICAgIHRoaXMuT0VJUyA9IE9FSVM7XG4gICAgICAgIHRoaXMuSUQgPSBJRDtcbiAgICAgICAgdGhpcy5jYWNoZSA9IFtdO1xuICAgICAgICB0aGlzLm5ld1NpemUgPSAxO1xuICAgICAgICB0aGlzLnByZWZpbGxDYWNoZSgpXG4gICAgfVxuICAgIG9laXNGZXRjaChuKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRmV0Y2hpbmcuLlwiKVxuICAgICAgICBsZXQgY29kZSA9IGBwcmludChzbG9hbmUuJHt0aGlzLk9FSVN9Lmxpc3QoJHtufSkpYDtcbiAgICAgICAgbGV0IHJlc3AgPSBzYWdlRXhlY3V0ZShjb2RlKTtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmVzcC5yZXNwb25zZUpTT04uc3Rkb3V0KVxuICAgIH1cbiAgICBhc3luYyBwcmVmaWxsQ2FjaGUoKSB7XG4gICAgICAgIHRoaXMucmVzaXplQ2FjaGUoMzAwMCk7XG4gICAgICAgIGxldCBjb2RlID0gYHByaW50KHNsb2FuZS4ke3RoaXMuT0VJU30ubGlzdCgke3RoaXMubmV3U2l6ZX0pKWA7XG4gICAgICAgIGxldCByZXNwID0gYXdhaXQgc2FnZUV4ZWN1dGVBc3luYyhjb2RlKTtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcClcbiAgICAgICAgdGhpcy5jYWNoZSA9IHRoaXMuY2FjaGUuY29uY2F0KEpTT04ucGFyc2UocmVzcC5zdGRvdXQpKVxuICAgIH1cbiAgICByZXNpemVDYWNoZShuKSB7XG4gICAgICAgIHRoaXMubmV3U2l6ZSA9IHRoaXMuY2FjaGUubGVuZ3RoICogMjtcbiAgICAgICAgaWYgKG4gKyAxID4gdGhpcy5uZXdTaXplKSB7XG4gICAgICAgICAgICB0aGlzLm5ld1NpemUgPSBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmaWxsQ2FjaGUoKSB7XG4gICAgICAgIGxldCBuZXdMaXN0ID0gdGhpcy5vZWlzRmV0Y2godGhpcy5uZXdTaXplKTtcbiAgICAgICAgdGhpcy5jYWNoZSA9IHRoaXMuY2FjaGUuY29uY2F0KG5ld0xpc3QpO1xuICAgIH1cbiAgICBnZXRFbGVtZW50KG4pIHtcbiAgICAgICAgaWYgKHRoaXMuY2FjaGVbbl0gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVtuXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVzaXplQ2FjaGUoKTtcbiAgICAgICAgICAgIHRoaXMuZmlsbENhY2hlKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVtuXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gQnVpbHRJbk5hbWVUb1NlcShJRCwgc2VxTmFtZSwgc2VxUGFyYW1zKXtcbiAgICBsZXQgZ2VuZXJhdG9yID0gQnVpbHRJblNlcXNbc2VxTmFtZV0uZ2VuZXJhdG9yKHNlcVBhcmFtcylcbiAgICByZXR1cm4gbmV3IFNlcXVlbmNlR2VuZXJhdG9yKElELCBnZW5lcmF0b3IpXG59XG5cblxuZnVuY3Rpb24gTGlzdFRvU2VxKElELCBsaXN0KSB7XG4gICAgbGV0IGxpc3RHZW5lcmF0b3IgPSBmdW5jdGlvbiAobikge1xuICAgICAgICByZXR1cm4gbGlzdFtuXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTZXF1ZW5jZUdlbmVyYXRvcihJRCwgbGlzdEdlbmVyYXRvcik7XG59XG5cbmZ1bmN0aW9uIE9FSVNUb1NlcShJRCwgT0VJUykge1xuICAgIHJldHVybiBuZXcgT0VJU1NlcXVlbmNlR2VuZXJhdG9yKElELCBPRUlTKTtcbn1cblxuXG5jb25zdCBCdWlsdEluU2VxcyA9IHt9XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ0J1aWx0SW5OYW1lVG9TZXEnOiBCdWlsdEluTmFtZVRvU2VxLFxuICAgICdMaXN0VG9TZXEnOiBMaXN0VG9TZXEsXG4gICAgJ09FSVNUb1NlcSc6IE9FSVNUb1NlcSxcbiAgICAnQnVpbHRJblNlcXMnOiBCdWlsdEluU2Vxc1xufVxuXG5cbkJ1aWx0SW5TZXFzW1wiRmlib25hY2NpXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUZpYm9uYWNjaS5qcycpXG5CdWlsdEluU2Vxc1tcIkx1Y2FzXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUx1Y2FzLmpzJylcbkJ1aWx0SW5TZXFzW1wiUHJpbWVzXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZVByaW1lcy5qcycpXG5CdWlsdEluU2Vxc1tcIk5hdHVyYWxzXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZU5hdHVyYWxzLmpzJylcbkJ1aWx0SW5TZXFzW1wiTGluUmVjXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUxpblJlYy5qcycpXG5CdWlsdEluU2Vxc1snUHJpbWVzJ10gPSByZXF1aXJlKCcuL3NlcXVlbmNlUHJpbWVzLmpzJylcbiIsIm1vZHVsZS5leHBvcnRzID0gW1wiQTAwMDAwMVwiLCBcIkEwMDAwMjdcIiwgXCJBMDAwMDA0XCIsIFwiQTAwMDAwNVwiLCBcIkEwMDAwMDhcIiwgXCJBMDAwMDA5XCIsIFwiQTAwMDc5NlwiLCBcIkEwMDM0MThcIiwgXCJBMDA3MzE4XCIsIFwiQTAwODI3NVwiLCBcIkEwMDgyNzdcIiwgXCJBMDQ5MzEwXCIsIFwiQTAwMDAxMFwiLCBcIkEwMDAwMDdcIiwgXCJBMDA1ODQzXCIsIFwiQTAwMDAzNVwiLCBcIkEwMDAxNjlcIiwgXCJBMDAwMjcyXCIsIFwiQTAwMDMxMlwiLCBcIkEwMDE0NzdcIiwgXCJBMDA0NTI2XCIsIFwiQTAwMDMyNlwiLCBcIkEwMDIzNzhcIiwgXCJBMDAyNjIwXCIsIFwiQTAwNTQwOFwiLCBcIkEwMDAwMTJcIiwgXCJBMDAwMTIwXCIsIFwiQTAxMDA2MFwiLCBcIkEwMDAwNjlcIiwgXCJBMDAxOTY5XCIsIFwiQTAwMDI5MFwiLCBcIkEwMDAyMjVcIiwgXCJBMDAwMDE1XCIsIFwiQTAwMDAxNlwiLCBcIkEwMDAwMzJcIiwgXCJBMDA0MDg2XCIsIFwiQTAwMjExM1wiLCBcIkEwMDAwMzBcIiwgXCJBMDAwMDQwXCIsIFwiQTAwMjgwOFwiLCBcIkEwMTgyNTJcIiwgXCJBMDAwMDQzXCIsIFwiQTAwMDY2OFwiLCBcIkEwMDAzOTZcIiwgXCJBMDA1MTAwXCIsIFwiQTAwNTEwMVwiLCBcIkEwMDIxMTBcIiwgXCJBMDAwNzIwXCIsIFwiQTA2NDU1M1wiLCBcIkEwMDEwNTVcIiwgXCJBMDA2NTMwXCIsIFwiQTAwMDk2MVwiLCBcIkEwMDUxMTdcIiwgXCJBMDIwNjM5XCIsIFwiQTAwMDA0MVwiLCBcIkEwMDAwNDVcIiwgXCJBMDAwMTA4XCIsIFwiQTAwMTAwNlwiLCBcIkEwMDAwNzlcIiwgXCJBMDAwNTc4XCIsIFwiQTAwMDI0NFwiLCBcIkEwMDAzMDJcIiwgXCJBMDAwNTgzXCIsIFwiQTAwMDE0MlwiLCBcIkEwMDAwODVcIiwgXCJBMDAxMTg5XCIsIFwiQTAwMDY3MFwiLCBcIkEwMDYzMThcIiwgXCJBMDAwMTY1XCIsIFwiQTAwMTE0N1wiLCBcIkEwMDY4ODJcIiwgXCJBMDAwOTg0XCIsIFwiQTAwMTQwNVwiLCBcIkEwMDAyOTJcIiwgXCJBMDAwMzMwXCIsIFwiQTAwMDE1M1wiLCBcIkEwMDAyNTVcIiwgXCJBMDAwMjYxXCIsIFwiQTAwMTkwOVwiLCBcIkEwMDE5MTBcIiwgXCJBMDkwMDEwXCIsIFwiQTA1NTc5MFwiLCBcIkEwOTAwMTJcIiwgXCJBMDkwMDEzXCIsIFwiQTA5MDAxNFwiLCBcIkEwOTAwMTVcIiwgXCJBMDkwMDE2XCIsIFwiQTAwMDE2NlwiLCBcIkEwMDAyMDNcIiwgXCJBMDAxMTU3XCIsIFwiQTAwODY4M1wiLCBcIkEwMDAyMDRcIiwgXCJBMDAwMjE3XCIsIFwiQTAwMDEyNFwiLCBcIkEwMDIyNzVcIiwgXCJBMDAxMTEwXCIsIFwiQTA1MTk1OVwiLCBcIkEwMDEyMjFcIiwgXCJBMDAxMjIyXCIsIFwiQTA0NjY2MFwiLCBcIkEwMDEyMjdcIiwgXCJBMDAxMzU4XCIsIFwiQTAwMTY5NFwiLCBcIkEwMDE4MzZcIiwgXCJBMDAxOTA2XCIsIFwiQTAwMTMzM1wiLCBcIkEwMDEwNDVcIiwgXCJBMDAwMTI5XCIsIFwiQTAwMTEwOVwiLCBcIkEwMTU1MjFcIiwgXCJBMDE1NTIzXCIsIFwiQTAxNTUzMFwiLCBcIkEwMTU1MzFcIiwgXCJBMDE1NTUxXCIsIFwiQTA4MjQxMVwiLCBcIkEwODMxMDNcIiwgXCJBMDgzMTA0XCIsIFwiQTA4MzEwNVwiLCBcIkEwODMyMTZcIiwgXCJBMDYxMDg0XCIsIFwiQTAwMDIxM1wiLCBcIkEwMDAwNzNcIiwgXCJBMDc5OTIyXCIsIFwiQTA3OTkyM1wiLCBcIkExMDk4MTRcIiwgXCJBMTExNzc0XCIsIFwiQTExMTc3NVwiLCBcIkExMTE3ODdcIiwgXCJBMDAwMTEwXCIsIFwiQTAwMDU4N1wiLCBcIkEwMDAxMDBcIl1cbiJdfQ==
