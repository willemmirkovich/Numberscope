class coordinate
{
	constructor(X,Y){
		this.x=X;
		this.y=Y;
	}
}

class SpiralModule {
	constructor(config,seq,sketch)
	{
	this.config=config
	this.sketch=sketch
	this.seq=seq
	}


   makeVectors(n)
	{ 
  var pi = 3.1415926;
  let vectors = [];
  for (a=0; a<=n; a++)
  {
    var x= cos(2*pi*a/n);
    var y= sin(2*pi*a/n);
    var coord = new coordinate(x,y);
    vectors[a]=coord;
  	}
  return vectors
}

  polygon(x, y, radius, npoints) {
  var angle = (TWO_PI)/ npoints;
  this.sketch.beginShape();
  for (var a = .5*angle; a < TWO_PI+.5*angle; a += angle) {
    var sx = x + cos(a) * radius;
    var sy = y + sin(a) * radius;
    this.sketch.vertex(sx, sy);
  }
  this.sketch.endShape(CLOSE);
}

  onSequence(seq)
	{
   // var list=[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223];
  for(let q=0; q<list.length; q++) {
  
    if(seq[q]==n)
    {
      return true;
    }

    }
  return false;
}

	makeHexList(Layers,index) 
{
	var pi=3.1415926;
	let coord = new coordinate (0,0);
	let List = [];
	let index=0;
	List[0]=coord;
	let vectors=makeVectors(6);
	for (let layer=1; layer<=Layers; layer++)
	{
		coord=new coordinate(0,0);
		coord.x=List[index].x+1;
		coord.y=List[index].y;
		List[index+1]=coord;       //Steps out to next layer.
		index++;
		for (let a=1; a<layer; a++)   //Partial limb
		{
			coord = new coordinate (0,0);
			coord.x=List[index].x+vectors[1].x;
			coord.y=List[index].y+vectors[1].y;
			List[index+1]=coord;
			index++;
		}
		for (let a=2; a<7; a++)     //Finishes layer
		{
			for (let c=0; c<layer; c++)
			{
			coord=new coordinate (0,0);
			coord.x=List[index].x+vectors[a].x;
			coord.y=List[index].y+vectors[a].y;
			List[index+1]=coord;
			index++;
			}
		}

	}
	return List;
}

	makeSquareList(Layers,index) 
{
	var pi=3.1415926;
	let coord = new coordinate (0,0);
	let List = [];
	let index=0;
	List[0]=coord;
	let vectors=makeVectors(4);
	for (let layer=1; layer<=Layers; layer++)
	{
		coord=new coordinate(0,0);
		coord.x=List[index].x+1;
		coord.y=List[index].y;
		List[index+1]=coord;       //Steps out to next layer.
		index++;
		for (let a=1; a<2*layer; a++)   //Partial limb
		{
			coord = new coordinate (0,0);
			coord.x=List[index].x+vectors[1].x;
			coord.y=List[index].y+vectors[1].y;
			List[index+1]=coord;
			index++;
		}
		for (let a=2; a<=4; a++)     //Finishes layer
		{
			for (let c=0; c<2*layer; c++)
			{
			coord=new coordinate (0,0);
			coord.x=List[index].x+vectors[a].x;
			coord.y=List[index].y+vectors[a].y;
			List[index+1]=coord;
			index++;
			}
		}

	}
	return List;
}


	makeTriList(Layers,index) 
{
	var pi=3.1415926;
	let vectors=makeVectors(3);
	let coord = new coordinate (0,0);
	let List = [];
	List[0]=coord;
	let index=0;
	Steps=3*Layers;
	for(let step=0; step<Steps; step++)
	{
		for(let a=0; a<=step; a++)
		{
			let coord=new coordinate(0,0);
			coord.x=List[index].x+vectors[step%3].x;
			coord.y=List[index].y+vectors[step%3].y;
			List[index+1]=coord;
		}

	}
	return List;
}

 makeSacksList(Layers,index)
{
	var pi = 3.1415926
	steps=Layers**2;
	let List=[];
	for(let step=0; step<=steps; step++)
	{
		let r=Math.sqrt(step);
		let theta=2*pi*r;
		let x=r*cos(theta);
		let y= r* sin(theta);
		let coord = new coordinate(x,y);
		List[step]=coord;
	}
	return List;
}

	setup() {
	setFrameRate(5);
	this.index=0;
	Index=0;
	backGroundColor=color(0,25,0);
	initialColor=color(50,255,0);
	finalColor=color(0,170,0);
	transitionFrames=10.0;
	myList=makeHexList(20);
	this.sketch.fill(backGroundColor);
	for (let a=0; a<myList.length; a++)
	{
		coord=new coordinate(300+10*myList[a].x,250+10*myList[a].y);
		polygon(coord.x,coord.y,6,6);
	}
}


	draw() {
theList=[1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987];
for(let b=0; b<this.seq.length; b++)
	{
		if(b<=Index)
		{	
			let framesSince=Index-b;
			let inter=(transitionFrames-framesSince)/transitionFrames;
			let theColor=lerpColor(finalColor,initialColor,inter)
			this.sketch.fill(theColor);
		}
		else
		{
			fill(backGroundColor);
		}
		coord=new coordinate(300+10*myList[this.seq[b]].x,250+10*myList[this.seq[b]].y);
		polygon(coord.x,coord.y,6,6);
	}

Index++;
	if(Index==myList.length)
	{
		this.sketch.noLoop();
	}

	
}

}