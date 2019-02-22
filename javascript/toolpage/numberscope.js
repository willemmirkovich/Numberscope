


//This object holds our builtInSequences (m is the mod)
BuiltInSeqs = function(){
    function linearRecurrence({ID:ID, coefficientList:coefficientList, seedList:seedList, m:m}){
		if(coefficientList.length != seedList.length){
			//error here
			console.log("numberof coefficients not equal to number of seeds ");
			return;
		}
		let k = coefficientList.length;
		if(m != null){
			for(let i = 0; i < coefficientList.length; i++){
				coefficientList[i] = coefficientList[i] % m;
				seedList[i] = seedList[i] % m;
			}
			genericLinRec = function(n, cache){
				for(let i = cache.length; i<= n; i++){
					let sum = 0;
					for(j = 0; j < k; j++){
						sum += cache[i - j -1]*coefficientList[j];
					}
					cache[i] = sum % m;
				}
				return cache[n];
			}
		}
		else{
			genericLinRec = function(n, cache){
				for(let i = cache.length; i<= n; i++){
					let sum = 0;
					for(j = 0; j < k; j++){
						sum += cache[i - j -1]*coefficientList[j];
					}
					cache[i] = sum;
				}
				return cache[n];
			}
		}
		sg = new SequenceGenerator(genericLinRec, ID);
		sg.cache = seedList;
		return sg;
	}

	function fibonacci({ID: ID, m: m}){
		return linearRecurrence({ID: ID, coefficientList: [1,1], seedList: [1,1], m: m});
	}

	function lucas({ID: ID, m: m}){
		return linearRecurrence({ID: ID, coefficientList: [1,1], seedList: [2,1], m: m});
	}

    return{
        linRec: linearRecurrence,
        fibonacci: fibonacci,
        lucas: lucas
    }
}()



class SequenceGenerator{
	constructor(generator, ID){
		this.computeElement = generator;
		this.ID = ID;
		this.cache = [];
	}
	getElement(n){
		if(this.cache[n] != undefined){
			// console.log("cache hit")
			return this.cache[n];
		}
		else{
			// console.log("cache miss")
			let newCacheSize = 1 + this.cache.length*2;
			if(n >= newCacheSize){
				newCacheSize = n;
			}
			for(let i = this.cache.length; i <= newCacheSize*2; i++){
				this.cache[i] = this.computeElement(i, this.cache);
			}
			return this.cache[n];
		}
	}

}

NScore = function(){
	var modules = {}
	const moduleDirBase = "./javascript/modules/"
	loadjs([moduleDirBase + "turtle.js", moduleDirBase + "moduleSkeleton.js"], 'modules');
	loadjs.ready('modules', function() {
		modules['turtle'] = Turtle_MODULE;
		modules['exampleModule'] = Example_MODULE;
	});

	generateP5 = function(moduleClass, config, seq, divID, width, height){

	    //Create canvas element here
	    console.log("divID: " + divID)
	    var div = document.createElement('div');
	    //The style of the canvases will be "canvasClass"
	    div.className = "canvasClass"
	    div.id = "liveCanvas" + divID
	    console.log(document.getElementById("canvasArea"))
	    document.getElementById("canvasArea").appendChild(div);
	    //-------------------------------------------
	    //Create P5js instance
	    let myp5 = new p5( function( sketch ) {
	    let moduleInstance = new moduleClass(config, seq, sketch)
	    sketch.setup = function() {
	        sketch.createCanvas(width,height);
	        moduleInstance.setup();
	    };

	    sketch.draw = function() {
	        moduleInstance.draw()
	    }
	    }, div.id);
	    return myp5;
	}

	var preparedSequences = [];
	var preparedTools = [];
	var liveSketches = [];

	receiveModule = function(moduleObj){
		if( (moduleObj.ID && moduleObj.moduleName && moduleObj.config && modules[moduleObj.moduleName]) == undefined){
			console.error("One or more undefined module properties received in NScore");
		}
		else{
			preparedTools[moduleObj.ID] = {module: modules[moduleObj.moduleName], config: moduleObj.config, ID: moduleObj.ID};
		}
	}
	receiveSequence = function(seqObj){
		if( (seqObj.ID && seqObj.inputType && seqObj.inputValue && seqObj.parameters) == undefined){
			console.error("One or more undefined module properties received in NScore");
		}
		else{
		    if(seqObj.inputType == "builtIn"){		
				if(BuiltInSeqs[seqObj.inputValue] == undefined){
					console.error("undefined or unimplemented sequence: " + seqObj.inputValue);
				}
				else{
					seqObj.parameters['ID'] = seqObj.ID;
					preparedSequences[seqObj.ID] = BuiltInSeqs[seqObj.inputValue](seqObj.parameters);
				}
		    }
		    if(seqObj.inputType == "OEIS"){
		      console.error("Not Implemented");
		    }
		    if(seqObj.inputType == "list"){
		      console.error("Not Implemented");
		    }
		    if(seqObj.inputType == "code"){
		      console.error("Not Implemented");
		    }
		}
	}

	beginDraw = function(seqVizPairs){
		//Determining each canvas gets
	    var width = document.getElementById('canvasArea').offsetWidth;
	    var height = document.getElementById('canvasArea').offsetHeight;
	    width = width/seqVizPairs.length;

		for(let pair of seqVizPairs){
			let currentSeq = preparedSequences[pair["seqID"]];
			let currentTool = preparedTools[pair["toolID"]];
			if(currentSeq && currentTool == undefined){
				console.error("undefined ID for tool or sequence: " + JSON.parse(JSON.stringify(pair)));
			}
			liveSketches.push(generateP5(currentTool['module'], currentTool['config'], currentSeq, liveSketches.length, width, height));
		}
	}

	clearCanvasArea = function(){
		if( liveSketches.length == 0){
			return;
		}
		else{
			for(let i = 0; i<liveSketches.length; i++)
			{
				liveSketches[i].remove() //delete canvas element
			}
		}
	}
	return{
		receiveSequence: receiveSequence,
		receiveModule: receiveModule,
		beginDraw: beginDraw,
		clearCanvasArea: clearCanvasArea,
		liveSketches: liveSketches,
		preparedSequences: preparedSequences,
		preparedTools: preparedTools
	}
}()

myconfig = {
    rotMap: {0: -10, 1: 30, 2: 60, 3:180},
    stepSize: 65,
    bgColor: 'blue',
    height: 500,
    width: 500
}


// NScore.prepareTool("Turtle",{
//     rotMap: {0: -10, 1: 30, 2: 60},
//     stepSize: 20,
//     bgColor: 'grey',
//     height: 200,
//     width: 200
// },1)

// NScore.prepBNsequence("fibonacciMod",[3],1)