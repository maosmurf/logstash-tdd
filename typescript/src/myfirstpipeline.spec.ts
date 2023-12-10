import {expect} from "chai";
import {Pipeline} from "./docker/pipeline";

describe('myfirstpipeline', function () {

    const serviceName = this.fullTitle();
    let pipeline: Pipeline;

    before('start container', async function () {
        this.timeout(60000);
        (pipeline = await Pipeline.forService(serviceName));
    });

    after('down after', async function () {
        this.timeout(20000);
        await pipeline?.close();
    });

    it('rename field venue to name', async function () {
        const input = {
            venue: 'SoCraTes',
        };
        const event = await pipeline.transform(input);
        expect(event).to.deep.include({
            name: 'SoCraTes',
        });
    });

});
