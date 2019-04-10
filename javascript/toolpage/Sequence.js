


export const BuiltInSeqs = function () {
    function linearRecurrence({
        ID: ID,
        coefficientList: coefficientList,
        seedList: seedList,
        m: m
    }) {
        if (coefficientList.length != seedList.length) {
            //error here
            console.log("number of coefficients not equal to number of seeds ");
            return;
        }
        let k = coefficientList.length;
        if (m != null) {
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
        var sg = new SequenceGenerator(genericLinRec, ID);
        sg.cache = seedList;
        return sg;
    }

    function fibonacci({
        ID: ID,
        m: m
    }) {
        return linearRecurrence({
            ID: ID,
            coefficientList: [1, 1],
            seedList: [1, 1],
            m: m
        });
    }

    function lucas({
        ID: ID,
        m: m
    }) {
        return linearRecurrence({
            ID: ID,
            coefficientList: [1, 1],
            seedList: [2, 1],
            m: m
        });
    }


    function primeNumbers({
        ID: ID
    }) {
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
        let sg = new SequenceGenerator(primes, ID);
        sg.cache = [2, 3, 5]
        return sg
    }
    return {
        linRec: linearRecurrence,
        fibonacci: fibonacci,
        lucas: lucas,
        primes: primeNumbers,
        naturals: function(ID){return new SequenceGenerator((n)=>n, ID)}
    }
}()

export class SequenceGenerator {
    constructor(generator, ID) {
        this.computeElement = generator;
        this.ID = ID;
        this.cache = [];
        this.newSize = 1;
    }
    resizeCache(n){
        this.newSize = this.cache.length * 2;
        if (n + 1 > this.newSize) {
            this.newSize = n + 1;
        }
    }
    fillCache() {
        for (let i = this.cache.length; i < this.newSize; i++) {
            this.cache[i] = this.computeElement(i, this.cache);
        }
    }
    getElement(n) {
        if (this.cache[n] != undefined) {
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

export class AsyncSequenceGenerator {
    constructor(generator, ID) {
        this.computeElement = generator;
        this.ID = ID;
        this.cache = [];
        this.newSize = 1;
    }
    resizeCache(n) {
    }
    fillCache() {
    }
    async getElement(n) {
        if (this.cache[n] != undefined) {
            return this.cache[n];
        } else {
            this.resizeCache(n);
            this.fillCache();
            await this.computeElement
        }
    }
}
