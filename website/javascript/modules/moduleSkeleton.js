

//An example module


class Empty_VIZ{
	/**
	 *Creates an instance of Empty_MODULE.
	 * @param {*} config parameters passed by the user and defined by schema
	 * @param {*} seq SequenceGenerator object that provides elements via getElement(i)
	 * @param {*} sketch the p5 sketch you draw on
	 * @memberof Empty_MODULE
	 */
	constructor(seq, sketch, config){
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