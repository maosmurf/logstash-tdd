import {config} from 'chai';
import * as Dockerode from 'dockerode';
import {ensureImage} from './docker.image';

// disable truncating
config.truncateThreshold = 0;

/**
 * @see https://mochajs.org/#global-fixtures
 */

export const docker = new Dockerode();

export const LOGSTASH_IMAGE = 'docker.elastic.co/logstash/logstash:8.9.2';

export async function mochaGlobalSetup() {
    await ensureImage(LOGSTASH_IMAGE);
}
