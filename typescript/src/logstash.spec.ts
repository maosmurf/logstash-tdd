import {Container, ContainerInspectInfo} from "dockerode";
import {containerForService} from "./docker.container";
import {expect} from "chai";

describe('pipeline', function () {

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

    it('yay', async function () {
        expect(true).to.true;
    });

});
