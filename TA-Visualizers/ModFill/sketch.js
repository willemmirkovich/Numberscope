var rectWidth;
var rectHeight;
var arcRadius;
var length;
var matrix=[];
var primes=[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223];


function thickArc(x,y,r1,r2,theta1,theta2)
{
  noFill();
  for (let r=r1; r<r2; r++)
  {
  	arc(x,y,r,r,theta1,theta2);
  }
}


function createMatrix(length)
{
  let black=color(0);
  let white = color(255);
  fill(white);
  for(let i=0; i<length; i++)
  {
  	var column=[];
  	for (let j=0; j<length; j++)
  	{
  		//if(i<j) column.push(white);
  		//else column.push(black);
  		column.push(white);
  		//rect(j*rectWidth,height-(i+1)*rectHeight,rectWidth,rectHeight);

  	}
  	matrix.push(column);
  }
}

function drawNew(num,seq,length,type)
{	colorMode(HSB);
	let black=color(0);
	fill(black);
	let i;
	let j;
	for(let mod=1; mod<=length; mod++)
	{
		i=seq[num]%mod;
		j=mod-1;
		if(brightness(matrix[i][j])>=10)
		{
		matrix[i][j]=color(hue(matrix[i][j]),saturation(matrix[i][j]),brightness(matrix[i][j])-10);
		}
		
			if(type=="bar")
			{
				fill(matrix[i][j]);
				noStroke();
				rect(j*rectWidth,height-(i+1)*rectHeight,rectWidth,rectHeight);
			}

			else if (type=="pie")
			{
				stroke(matrix[i][j]);
				thickArc(320,320,j*arcRadius,(j+1)*arcRadius,2*3.14159*i/mod,2*3.14159*(i+1)/mod);
			}
		
	}

}

/*function updateMatrix(num,seq) {
	let black=color(0);
	let i;
	for(let mod=1; mod<=matrix.length; mod++)
	{
		i=seq[num]%mod;
		matrix[i][mod-1]=black;
	}
}

function drawMatrix() {

	for(let i=0; i<matrix.length; i++) {
		for(let j=0; j<matrix[i].length; j++) {
			fill(matrix[i][j]);
			rect(j*rectWidth,height-(i+1)*rectHeight,rectWidth,rectHeight);
		}
	}
}*/

function setup() {
    length=150;
    fill(0);
	createCanvas(640,640);
	rectWidth=width/length;
	rectHeight=height/length;
	arcRadius=width/(length);
	createMatrix(length);
	console.log(width);

	//frameRate(10);
	//var index=49;	
  // put setup code here
}
//var index=0;
var counter=0;
function draw() {
	drawNew(counter,primes,length,"pie");
	counter++;
	if(counter>=primes.length)
	{
		//drawMatrix();
		noLoop();
	}
}
	
