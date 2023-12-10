import {v4} from "uuid";
import {TestContainer} from "./container";

export class Pipeline {

    static forService: (serviceName: string) => Promise<Pipeline> = async (serviceName) => {
        const container = await TestContainer.getOrCreate(serviceName);
        return new Pipeline(container);
    }

    private constructor(private readonly container: TestContainer) {
    }

    async transform(event: object) {
        const id = v4();
        await this.container.sendEvent({
            id,
            ...event,
        });
        return await this.container.readEvent(id);
    }

    async close() {
        if (process.env.CI) {
            await this.container.stop();
        }
    };

}
