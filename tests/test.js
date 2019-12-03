let expect = chai.expect;

describe("Modules", function () {

    Object.keys(NScore.modules).forEach(function (mKey) {

        const m = NScore.modules[mKey];

        describe(`${mKey}`, function () {

            it('has a name', function (done) {
                chai.expect(m).to.have.property("name");
                chai.expect(m.name).to.be.a("string");
                done();
            })

            it('has a schema', function (done) {
                chai.expect(m).to.have.property("configSchema");
                chai.expect(m.configSchema).to.be.a("Object");
                done();
            })

            it('has a viz class that is properly structured', function (done) {
                chai.expect(m).to.have.property("viz");
                chai.expect(m.viz).to.be.a("function");
                chai.expect(m.viz.prototype).to.have.property('draw')
                chai.expect(m.viz.prototype).to.have.property('setup')
                chai.expect(m.viz.prototype).to.have.property('constructor')
                chai.expect(m.viz.prototype.constructor, 'incorrect number of arguments').to.have.length(3)
                done();
            })

            it('correctly uses this.sketch instead of global p5', function (done) {
                let hits = checkSourceP5(m.viz.toString());
                hits.forEach(function (hit) {
                    chai.expect(hit.is, `[${hit.loc.start.line} lines below class definition]`).to.equal(hit.shouldBe);
                })
                done()
            })

            it('correctly uses getElement method instead of []', function (done) {
                let hits = checkSourceSeq(m.viz.toString());
                hits.forEach(function (hit) {
                    chai.expect(hit.is, `[${hit.loc.start.line} lines below class definition]`).to.equal(hit.shouldBe);
                })
                done()
            })
        })
    })
})