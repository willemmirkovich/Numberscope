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