import {config} from 'chai';
import {LOGSTASH_IMAGE} from "./docker";
import {ensureImage} from "./docker.image";

// disable truncating
config.truncateThreshold = 0;

export async function mochaGlobalSetup() {
    await ensureImage(LOGSTASH_IMAGE);
}
