function generateMultiplicativeGroup(generator,modulus) {
	list=[];
	let at=generator
	for(let i=0; at!=1; at=(at*generator)%modulus,i++) {

		list[i]=at;
		
	}
	list.push(1);
		return list;
}

function generateAdditiveGroup(generator,modulus) {
	list=[];
	let at = generator;
	for(let i=0; at!=0;at=(at+generator)%modulus,i++)
	{
		list[i]=at;
	}
	list.push(0);
	return list;
}


function mod(data,modulus) {
	let newData =[];
	for(let i=0; i<data.length; i++)
	{
		newData[i]=data[i]%modulus;
	}
	return newData;
}

function distribution(data,modulus) {
	let dist=[];
	for (let value=0; value<modulus; value++) 
	{
		valueCounter=0;
		for (i=0; i<data.length; i++) {
			if(value==data[i])
			{
				valueCounter++;
			}
		}
		dist[value]=valueCounter;
	}
	return dist;
}

function newOrder(indices,Data) {
	let data=[];
	for (let i=0; i<indices.length; i++)
	{
		data[i]=Data[indices[i]];
	}
	return data;
}
