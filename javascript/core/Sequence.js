


/**
 * The BuiltInSeqs holds functions that return SequenceGenerator to common sequences
 */
const BuiltInSeqsGenerators = function () {

    /**
     *  Generates linear recurrence
     *
     * @param {*} ID the ID of the sequence
     * @param {*} coefficientList a list of coefficients for the linear recurrence
     * @param {*} seedList the initial values for the recurrence
     * @param {*} m mod
     * @returns returns a linear SequenceGenerator
     */
    function linearRecurrence({ID,coefficientList,seedList,m}) {
        console.log("ID: " + ID + " | coefList: " + coefficientList);
        if (coefficientList.length != seedList.length) {
            //Number of seeds should match the number of coefficients
            console.log("number of coefficients not equal to number of seeds ");
            return null;
        }
        let k = coefficientList.length;
        if (m != "") {
            for (let i = 0; i < coefficientList.length; i++) {
                coefficientList[i] = coefficientList[i] % m;
                seedList[i] = seedList[i] % m;
            }
            var genericLinRec = function (n, cache) {
                for (let i = cache.length; i <= n; i++) {
                    let sum = 0;
                    for (let j = 0; j < k; j++) {
                        sum += cache[i - j - 1] * coefficientList[j];
                    }
                    cache[i] = sum % m;
                }
                return cache[n];
            }
        } else {
            var genericLinRec = function (n, cache) {
                for (let i = cache.length; i <= n; i++) {
                    let sum = 0;
                    for (let j = 0; j < k; j++) {
                        sum += cache[i - j - 1] * coefficientList[j];
                    }
                    cache[i] = sum;
                }
                return cache[n];
            }
        }
        var sg = new SequenceGenerator(ID, genericLinRec);
        sg.cache = seedList;
        return sg;
    }
    



    /**
     * Returns a generator to the fibonacci sequence
     *
     * @param {*} ID the ID of the sequence
     * @param {*} m mod
     * @returns returns a fibonacci SequenceGenerator
     */
    function fibonacci({ID,m}) {
        return linearRecurrence({
            ID: ID,
            coefficientList: [1, 1],
            seedList: [1, 1],
            m
        });
    }

    /**
     * Returns a generator to the lucas sequence
     *
     * @param {*} ID the ID of the sequence
     * @param {*} m mod
     * @returns returns a lucas SequenceGenerator
     */
    function lucas({ID, m}) {
        return linearRecurrence({
            ID: ID,
            coefficientList: [1, 1],
            seedList: [2, 1],
            m
        });
    }


    /**
     * Returns a generator to the primes sequence
     *
     * @param {*} ID the ID of the sequence
     * @returns returns a primes SequenceGenerator
     */
    function primeNumbers({ID}) {
        const primes = function (n, cache) {
            let i = cache[cache.length - 1] + 1
            let k = 0
            while (cache.length <= n) {
                let isPrime = true
                for (let j = 0; j < cache.length; j++) {
                    if (i % cache[j] == 0) {
                        isPrime = false
                        break
                    }
                }
                if (isPrime) {
                    cache.push(i)
                }
                i++;
            }
            return cache[cache.length - 1]
        }
        let sg = new SequenceGenerator(ID, primes);
        sg.cache = [2, 3, 5]
        return sg
    }


    // This return allows the object to expose the above functions
    // new functions defined above should be passed in the returned object below    
    return {
        linRec:linearRecurrence,
        fibonacci: fibonacci,
        lucas: lucas,
        primes: primeNumbers,
        naturals: function(ID){return new SequenceGenerator(ID, (n)=>n)}
    }
}()



const BuiltInSeqsParams = function() {
    const linearRecurrence = {
        coefficientList: {
            type: 'string',
            title: 'Coefficients list',
            description: 'Comma seperated numbers',
            required: true
        },
        seedList: {
            type: 'string',
            title: 'Seed list',
            description: 'Comma seperated numbers',
            required: true
        },
        m: {
            type: 'number',
            title: 'Mod',
            description: 'A number to mod the sequence by by',
            required: false
        }
    }

    const justaskmod = {
        m: {
            type: 'number',
            title: 'Mod',
            description: 'A number to mod by',
            required: false
        }
    }

    const naturals = {
        includezero: {
            type: 'boolean',
            title: 'Include Zero',
            required: false
        }
    }
    
    return {
        linRec: linearRecurrence,
        naturals: naturals,
        fibonacci: justaskmod,
        lucas: justaskmod,
        primes: justaskmod
    }
}()


export const BuiltInSeqs = {
    linRec: {
        name: "Linear Recurrence", 
        generator: BuiltInSeqsGenerators['linRec'], 
        params: BuiltInSeqsParams['linRec']
    },
    fibonacci: {
        name: "Fibonacci", 
        generator: BuiltInSeqsGenerators['fibonacci'],
        params: BuiltInSeqsParams['fibonacci']
    },
    lucas: {
        name: "Lucas", 
        generator: BuiltInSeqsGenerators['lucas'],
        params: BuiltInSeqsParams['lucas']
    },
    primes: {
        name: "Primes", 
        generator: BuiltInSeqsGenerators['primes'],
        params: BuiltInSeqsParams['primes']
    },
    naturals: {
        name: "Naturals", 
        generator: BuiltInSeqsGenerators['naturals'],
        params: BuiltInSeqsParams['naturals']
    }
}


export function ListToSeq( ID, list ){
        let listGenerator = function( n ){
            return list[n];
        }
        return new SequenceGenerator( ID, listGenerator );
}

export function OEISToSeq(ID, OEIS){
    return new OEISSequenceGenerator( ID, OEIS );
}




/**
 *
 * @class SequenceGenerator
 */
class SequenceGenerator {
    /**
     *Creates an instance of SequenceGenerator.
     * @param {*} generator a function that takes a natural number and returns a number, it can optionally take the cache as a second argument
     * @param {*} ID the ID of the sequence
     * @memberof SequenceGenerator
     */
    constructor(ID, generator) {
        this.generator = generator;
        this.ID = ID;
        this.cache = [];
        this.newSize = 1;
        this.finite = false;
    }
    /**
     * if we need to get the nth element and it's not present in
     * in the cache, then we either double the size, or the 
     * new size becomes n+1
     * @param {*} n 
     * @memberof SequenceGenerator
     */
    resizeCache(n){
        this.newSize = this.cache.length * 2;
        if (n + 1 > this.newSize) {
            this.newSize = n + 1;
        }
    }
    /**
     * Populates the cache up until the current newSize
     * this is called after resizeCache
     * @memberof SequenceGenerator
     */
    fillCache() {
        for (let i = this.cache.length; i < this.newSize; i++) {
            //the generator is given the cache since it would make computation more efficient sometimes
            //but the generator doesn't necessarily need to take more than one argument.
            this.cache[i] = this.generator(i, this.cache);
        }
    }
    /**
     * Get element is what the drawing tools will be calling, it retrieves
     * the nth element of the sequence by either getting it from the cache
     * or if isn't present, by building the cache and then getting it
     * @param {*} n the index of the element in the sequence we want
     * @returns a number
     * @memberof SequenceGenerator
     */
    getElement(n) {
        if (this.cache[n] != undefined || this.finite) {
            // console.log("cache hit")
            return this.cache[n];
        } else {
            // console.log("cache miss")
            this.resizeCache(n);
            this.fillCache();
            return this.cache[n];
        }
    }
}


/**
 *
 *
 * @param {*} code arbitrary sage code to be executed on aleph
 * @returns ajax response object
 */
function sageExecute( code ){
    return $.ajax({
        type: 'POST',
        async: false, 
        url: 'http://aleph.sagemath.org/service', 
        data: "code=" + code
    })
}

async function sageExecuteAsync( code ){
    return await $.ajax({
        type: 'POST', 
        url: 'http://aleph.sagemath.org/service', 
        data: "code=" + code
    })
}


class OEISSequenceGenerator {
        constructor(ID, OEIS) {
            this.OEIS = OEIS;
            this.ID = ID;
            this.cache = [];
            this.newSize = 1;
            this.prefillCache()
        }
        oeisFetch( n ){
            let code = `print(sloane.${this.OEIS}.list(${n}))`;
            let resp = sageExecute( code );
            return JSON.parse( resp.responseJSON.stdout )
        }
        async prefillCache(){
            this.resizeCache( 3000 );
            let code = `print(sloane.${this.OEIS}.list(${this.newSize}))`;
            let resp = await sageExecuteAsync( code );
            console.log(resp)
            this.cache = this.cache.concat(JSON.parse( resp.stdout ))
        } 
        resizeCache(n) {
            this.newSize = this.cache.length * 2;
            if (n + 1 > this.newSize) {
                this.newSize = n + 1;
            }
        }      
        fillCache() {
            let newList = this.oeisFetch( this.newSize );
            this.cache = this.cache.concat( newList );
        }
        getElement(n) {
            if( this.cache[n] != undefined){
                return this.cache[n];
            }
            else{
                this.resizeCache();
                this.fillCache();
                return this.cache[n];
            }
        }
    }