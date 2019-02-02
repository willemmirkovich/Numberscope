
function makeHexList(Layers) 
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

function makeSquareList(Layers) 
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


function makeTriList(Layers) 
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
			index++;
		}

	}
	return List;
}