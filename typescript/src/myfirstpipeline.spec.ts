import {Container, ContainerInspectInfo} from "dockerode";
import {containerForService, readEvent} from "./docker.container";
import {expect} from "chai";
import {v4} from 'uuid';
import {post} from "./http";

describe('myfirstpipeline', function () {

    const serviceName = this.fullTitle();
    let container: Container;
    let info: ContainerInspectInfo;
    let url;

    before('start container', async function () {
        this.timeout(60000);
        ({container, info} = await containerForService(serviceName));
        url = `http://127.0.0.1:${info.NetworkSettings.Ports['8080/tcp'][0].HostPort}`;
    });

    after('down after', async function () {
        this.timeout(20000);
        if (process.env.CI) {
            await container?.stop();
        }
    });

    it('rename field venue to name', async function () {
        const id = v4();
        const input = {
            id,
            venue: 'SoCraTes',
        };
        await post(url, input);
        const event = await readEvent(container, id);
        expect(event).to.deep.include({
            id,
            name: 'SoCraTes',
        });
    });

});
