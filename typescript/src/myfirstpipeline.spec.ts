import {expect} from "chai";
import {close, containerForService, ContainerSuite, transform} from "./docker.container";

describe('myfirstpipeline', function () {

    const serviceName = this.fullTitle();
    let suite: ContainerSuite;

    before('start container', async function () {
        this.timeout(60000);
        (suite = await containerForService(serviceName));
    });

    after('down after', async function () {
        this.timeout(20000);
        await close(suite);
    });

    it('rename field venue to name', async function () {
        const input = {
            venue: 'SoCraTes',
        };
        const event = await transform(suite, input);
        expect(event).to.deep.include({
            name: 'SoCraTes',
        });
    });

});
