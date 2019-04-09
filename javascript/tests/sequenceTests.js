import {
    SequenceGenerator,
    BuiltInSeqs
} from '../toolpage/Sequence.js'


describe("[ SEQUENCE SUITE ]", function(){

    describe("---GENERAL SEQUENCE FUNCTIONS SUITE---", function () {

        var sg = null;

        beforeEach(function () {
            sg = new SequenceGenerator((n) => n, 0);
        })

        it('is testing class construction', function () {
            expect(sg.constructor.name).toBe('SequenceGenerator');
        });

        // spyOn(sg, 'resizeCache');
        // spyOn(sg, 'fillCacheUntil');
        // spyOn(sg, 'getElement');

        it('is testing cache resizing with (n > newSize)', function(){
            sg.resizeCache(10);
            expect(sg.newSize).toBe(11);
        })

        it('is testing sequence class computation for a single element', function () {
            let input = 5;
            let output = sg.computeElement(input);
            let correct = 5;
            // expect(sg.computeElement).toHaveBeenCalledWith(5);
            expect(output).toBe(correct);
        })

        it('is testing that cache updates correctly', function () {
            let correctCache = [0,1,2,3,4,5,6,7,8,9,10]
            sg.resizeCache(10);
            sg.fillCache();
            let gotCache = sg.cache
            expect(JSON.stringify(correctCache)).toBe(JSON.stringify(gotCache))
        })

        it('is testing that getElement updates cache correctly and returns correct value', function(){
            // spyOn(sg, 'fillCache')
            let tempCorrectVal = 5;
            let tempCorrectCache = [0,1,2,3,4,5]
            let gottenValue = sg.getElement(5);
            let gottenCache = sg.cache
            expect(JSON.stringify(gottenCache)).toBe(JSON.stringify(tempCorrectCache));
            expect(gottenValue).toBe(tempCorrectVal);

            let correctCache = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
            let correctValue = 10
            let finalGottenValue = sg.getElement(10);
            let finalGottenCache = sg.cache;
            expect(JSON.stringify(finalGottenCache), JSON.stringify(correctCache))
            expect(finalGottenValue).toBe(correctValue);
        })


        it('is testing that cache is updating the correctly after several calls to getElement', function(){
            sg.getElement(1); // [0,1] call
            sg.getElement(2); // [0,1,2,3] call
            sg.getElement(3); // [0,1,2,3]
            sg.getElement(4); // [0,1,2,3,4,5,6,7] call
            sg.getElement(5); // [0,1,2,3,4,5,6,7]
            sg.getElement(10) // [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] call
            expect(JSON.stringify(sg.cache)).toBe(JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]))
        })
    });

    describe("---BUILT IN SUITE: NATURALS---", function(){
        var naturals = null;
        beforeEach(function(){
            naturals = BuiltInSeqs.naturals(0);
            }
        )

        it("is testing that the 200th element is 200", function(){
            let input = 200;
            let output = naturals.getElement(200);
            let correct = 200;
            expect(output).toBe(correct);
        })

    })

});


