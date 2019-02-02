class coordinate
{
	constructor(X,Y){
		this.x=X;
		this.y=Y;
	}
}

function polygon(x, y, radius, npoints) {
  var angle = (TWO_PI)/ npoints;
  beginShape();
  for (var a = .5; a < TWO_PI+.5; a += angle) {
    var sx = x + cos(a) * radius;
    var sy = y + sin(a) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}
function onSequence(n)
{
    var list=[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223];
	for(let q=0; q<list.length; q++) {
	
		if(list[q]==n)
		{
			return true;
		}

    }
	return false;
}

function makeVectors(n)
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

function makeList(Layers) 
{
	var pi=3.1415926;
	var coord = new coordinate (0,0);
	let List = [];
	index=0;
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



function setup() {
	createCanvas(640,640);
	fill(0);
	setFrameRate(30);
  // put setup code here
}

function draw() {
		
    myList=makeList(20);
	//ellipse(100,100+Index,70,50);
	for (a=0; a<myList.length; a++)
	{
		if (a==0)
		{
			fill(0);
		}
		else if (onSequence(a))
		{
			fill(255,0,0);
		}
		else
		{
			fill (0,255,0);
		}
		coord=new coordinate(300+10*myList[a].x,250+10*myList[a].y);
		polygon(coord.x,coord.y,5,6);
	}
}