import Dockerode from "dockerode";

export const LOGSTASH_IMAGE = 'docker.elastic.co/logstash/logstash:8.11.1';

export const ensureImage = async () => {
    const docker = new Dockerode();

    const image = await docker.listImages({
        filters: JSON.stringify({
            reference: [LOGSTASH_IMAGE],
        }),
    });
    if (image.length) {
        return;
    }
    console.log(`pull image ${LOGSTASH_IMAGE}`);
    const pullStream = await docker.pull(LOGSTASH_IMAGE);
    await new Promise((resolve, reject) => {
        docker.modem.followProgress(pullStream, (err, res) => err ? reject(err) : resolve(res));
    });
};
