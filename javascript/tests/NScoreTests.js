




describe(" [ NSCORE TESTS ]", function(){
    NScore = window.NScore    
    describe("---MODULES---", function(){
        
        beforeEach(function(){
            NScore.preparedSequences = [];
            NScore.preparedTools = [];
            NScore.liveSketches = [];
        });

        it("is checking modules exist and are loaded properly", function(){
            console.log(NScore.modules);
            expect(Object.keys(NScore.modules).length).not.toBe(0);
            expect(NScore.modules['turtle'].name).toBe('Turtle_MODULE');
            expect(NScore.modules['shiftCompare'].name).toBe('ShiftCompare_MODULE');
            //should automate this
        })

    })
})