import {config} from 'chai';
import {ensureImage} from "./docker/image";

// disable truncating
config.truncateThreshold = 0;

export async function mochaGlobalSetup() {
    await ensureImage();
}
