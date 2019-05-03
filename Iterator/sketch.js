var edgePoints=[];
let fibs=[];
let mod;
function fib(n){
	let y=[];
	y.push(BigInt(1));
	y.push(BigInt(1));
	let size;
	let next;
	for(let a=0; a<n-1; a++)
	{
		size=y.length;
		next=y[size-2]+y[size-1];
		y.push(next);
	}
	return y;
}
function makeDots()
{
for(let a=0; a<mod; a++)
	{	 let edgePoint=new Object;
		 edgePoint.x=300+200*cos(2*PI*a/mod);
		 edgePoint.y=300+200*sin(2*PI*a/mod);
		 edgePoints[a]=edgePoint;
		 ellipse(edgePoints[a].x,height-edgePoints[a].y,4,4);
	}
}
function drawIterates(seq,start)
{
	let point=start;
	let newPoint;
for(let a=0;a<mod;a++)
    {
    	newPoint=(seq[point])%mod;
    	//newPoint=Math.pow(a,3)%mod;
        line(edgePoints[a].x,height-edgePoints[a].y,edgePoints[newPoint].x,height-edgePoints[newPoint].y);
    	point=newPoint;
    }
}
function drawCorrespondence(seq)
{
	let newPoint;
	for(let a=0;a<mod;a++)
    {
    	newPoint=seq[a]%mod;
        line(edgePoints[a].x,height-edgePoints[a].y,edgePoints[newPoint].x,height-edgePoints[newPoint].y);
    }
}

function drawShiftingCorrespondence(seq1,seq2,t)
{
	let point1;
	let point2;
	let point
	for(let a=0;a<mod;a++)
    {
    	//newPoint=Number(fibs[a]+BigInt(0))%mod;
    	point1=seq1[a]%mod;
    	point2=seq2[a]%mod;
    	point.x=(1-t)*point1.x+t*point2.x;
    	point2.y=(1-t)*point1.y+t*point2.y;
        line(edgePoints[a].x,height-edgePoints[a].y,edgePoints[newPoint].x,height-edgePoints[newPoint].y);
    	//point=newPoint;
    }
}
function drawSeq(seq)
{

	let point=Number(seq[0]%BigInt(mod));
	let newPoint;
for(let a=1;a<seq.length;a++)
    {
    	newPoint=Number(seq[a]%BigInt(mod));
    	//newPoint=Math.pow(a,3)%mod;
        line(edgePoints[point].x,height-edgePoints[point].y,edgePoints[newPoint].x,height-edgePoints[newPoint].y);
    	point=newPoint;
    }
}
function setup()
{
	createCanvas(640,640);
	fill(0);
	setFrameRate(4);
t=0;
}
mod=2;
//let i=0;
function draw() 
{//i++;
	//if(i>100){i=i-64;}
	if(t>1){t=t-1;}
	background(255);
    mod=mod%40+1;
    makeDots();
    fibs=fib(4*mod);
	//let point=1;
	//let newPoint;
	drawSeq(fibs);
	//drawShiftingCorrespondence(seq1,seq2,t);
   /* for(let a=0;a<mod;a++)
    {
    	//newPoint=Number(fibs[a]+BigInt(0))%mod;
    	newPoint=Math.pow(a,3)%mod;
        line(edgePoints[a].x,height-edgePoints[a].y,edgePoints[newPoint].x,height-edgePoints[newPoint].y);
    	//point=newPoint;
   }*/ 
    t+=.05;
}