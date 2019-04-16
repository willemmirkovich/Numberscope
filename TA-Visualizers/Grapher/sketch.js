//let regression= import('regression-js-master/src/regression.js');

let xMin=-10;
let xMax=500;
let yMin=-10;
let yMax=500;

let adjustedData=[];
let seq=[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347];
class coordinate
{
	constructor(X,Y)
	{
		this.x=X;
		this.y=Y;
	}
}


/*function drawLinearBox() {
	rect(540,20,40,40);
}

function drawPolyBox() {
	rect(600,20,40,40);
}

function drawExpBox()
{
	rect(540,70,40,40);
}

function drawLogBox() {
	rect(600,70,40,40);
}
*/

function adjustX(x)
{
   return map(x,xMin,xMax,0,width);
}

function adjustY(y)
{
   return map(y,yMin,yMax,height,0);
}

function unAdjustX(x)
{
  return map(x,0,width,xMin,xMax);
}

function unAdjustY(y)
{
  return  map(y,height,0,yMin,yMax);
}

function drawCurve(f)
{
	fill(0);
	let X;
	let newX;
	let newY;
	let y;
    for(let x=0; x<width; x++)
    {
  
    	newX=unAdjustX(x);
    	newY=f(newX)[1];
    	y=adjustY(newY);
    	ellipse(x,y,3,3);
    }
}

function setup() {
	createCanvas(640,640);
	background(255);
	fill(100);
	line(0,adjustY(0),width,adjustY(0),0);
	line(adjustX(0),0,adjustX(0),height);
	let data = [];
	var options=new Object;
	options.precision=10;
	for(let x=0; x<seq.length;x++)
	{
		let point =[];
	    let adjustedPoint=[];
		//rect(adjustX(x+1),adjustY(seq[x]),2,2);
		point[0]=x+1;
		point[1]=seq[x];
		data.push(point);
		adjustedPoint[0]=adjustX(point[0]);
		adjustedPoint[1]=adjustY(point[1]);
		adjustedData.push(adjustedPoint);
	}
	var regressionType="linear";
	let order=4;
	let myMethods;
	if(regressionType=="linear")
	{
		myMethods=methods.linear(data,options);
	}
    else if (regressionType=="exponential")
    {
    	myMethods=methods.exponential(data,options);
    	console.log(myMethods.string);
    }
    else if (regressionType=="logarithmic")
    {
    	myMethods=methods.logarithmic(data,options);
    }
    else if (regressionType=="power")
    {
    	myMethods=methods.power(data,options);
    }
    else if (regressionType=="polynomial")
    {
    	options.order=order;
    	myMethods=methods.polynomial(data,options);
    }
	let regression=myMethods.predict;
	drawCurve(regression);
	/*drawLinearBox();
	drawPolyBox();
	drawExpBox();
	drawLogBox();
*/

	
	//frameRate(30);
	//var index=49;	
  // put setup code here
}
//var index=0;
function draw() {

	for(let x=0; x<adjustedData.length; x++)
	{
       rect(adjustedData[x][0],adjustedData[x][1],2,2);
	}
	
	//(100,100,50,50);
	
	/*drawPolynomialBox();
	drawExponentialBox();
	drawLogarithmicBox();*/
	}



/*function mousePressed() {
	//ellipse(200,200,20,20);
	fill(255,0,0);
	if(540<mouseX&& mouseX<590&& 20<mouseY && mouseY<60) 
	{
          drawLinearBox();
    }

    if(600<mouseX && mouseX<640&& 20<mouseY && mouseY<60)
    {
    	drawPolyBox();
    }
 
    if(540<mouseX&& mouseX<590&& 70<mouseY && mouseY<110) {

    	drawExpBox();
    }

    if(600<mouseX && mouseX<640&&70<mouseY && mouseY<110) {
    	drawLogBox();
    }
}

function mouseReleased()
{
	fill(100);
	drawLinearBox();
	drawPolyBox();
	drawExpBox();
	drawLogBox();
}

*/
