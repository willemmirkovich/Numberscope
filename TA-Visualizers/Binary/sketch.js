function binaryRep(num,bin)
{
  bin.push(num%BigInt(2));
  num=(num-num%BigInt(2))/BigInt(2);
  if(num!=BigInt(0))
  {
  	return binaryRep(num,bin);
  }
  else
  {
  	return bin;
  }
}
function fib(n){
	let y=[];
	y.push(BigInt(1));
	y.push(BigInt(1));
	let size;
	let next;
	for(let a=0; a<n-2; a++)
	{
		size=y.length;
		next=y[size-2]+y[size-1];
		y.push(next);
	}
	return y;
}
function setup() {
	createCanvas(850,850);
	fill(100);
	noStroke();
	var length=500;
	let white=255;;
	let black=0;
	var seq=fib(500);
	//[1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229, 832040, 1346269, 2178309, 3524578, 5702887, 9227465, 14930352, 24157817, 39088169, 63245986, 102334155];
	for(let a=0; a<length && a<seq.length; a++)
	{
		let bin=[];
		bin=binaryRep(seq[a],bin);
		for(b=0; b<bin.length; b++)
		{
			if(bin[b]==0)
			{
				fill(white);
				stroke(255,255,255);
			}
			else if(bin[b]==1)
			{
				fill(black);
				stroke(0,0,0);
			}
			rect(a/length*width,height-(b+1)/length*height,width/length,height/length);
		}
	}
	
}

function draw() {

}

