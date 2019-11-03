

//An example module


class Empty_VIZ{
	/**
	 *Creates an instance of Empty_MODULE.
	 * @param {*} config this will hold an 
	 * @param {*} seq
	 * @param {*} sketch
	 * @memberof Empty_MODULE
	 */
	constructor(config, seq, sketch){
	this.width = sketch.width
	this.height = sketch.height
	}
	setup(){	
		//will be called once
	}
	draw(){		
		//you should probably call seq.getElement(n) here
	}
}

Empty_SCHEMA = {
	
}


const Empty_MODULE = {
	viz: Empty_VIZ,
	name: "",
	description: "",
	configSchema: Empty_SCHEMA
}

export default Empty_MODULE