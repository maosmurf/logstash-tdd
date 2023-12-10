import {docker, LOGSTASH_IMAGE} from './docker';

export const ensureImage = async (repoTag: string) => {
    const image = await docker.listImages({
        filters: JSON.stringify({
            reference: [LOGSTASH_IMAGE],
        }),
    });
    if (image.length) {
        return;
    }
    console.log(`pull image ${repoTag}`);
    const pullStream = await docker.pull(repoTag);
    await new Promise((resolve, reject) => {
        docker.modem.followProgress(pullStream, (err, res) => err ? reject(err) : resolve(res));
    });
};
