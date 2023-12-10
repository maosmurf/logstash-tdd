import { Container, ContainerCreateOptions, ContainerInfo, ContainerInspectInfo } from 'dockerode';
import retry from 'async-await-retry';
import { IncomingMessage } from 'http';
import streamToString from 'stream-to-string';
import { extract as tarExtract } from 'tar-stream';
import {v4} from "uuid";
import { docker, LOGSTASH_IMAGE } from './docker';

export type ContainerSuite = {
  container: Container,
  url: string,
}

const createContainerOpts: (serviceName: string) => ContainerCreateOptions = (serviceName) => ({
  name: `logstash-tdd-${serviceName}`,
  Image: LOGSTASH_IMAGE,
  ExposedPorts: {
    '8080/tcp': {},
  },
  Healthcheck: {
    Test: ['CMD-SHELL', 'curl -fs 127.0.0.1:9600 || exit -1'],
  },
  HostConfig: {
    AutoRemove: true,
    Mounts: [
      {
        Type: 'bind',
        Source: `${__dirname}/../../logstash/config`,
        Target: '/usr/share/logstash/config',
        ReadOnly: true,
      },
      {
        Type: 'bind',
        Source: `${__dirname}/../../logstash/pipelines`,
        Target: '/usr/share/logstash/pipelines',
        ReadOnly: true,
      },
    ],
    PortBindings: {
      '8080/tcp': [{ 'HostPort': '' }],
    },
  },
  Labels: {
    'logstashtdd.testcase': serviceName,
  },
  Env: [
    `PIPELINE_UNDER_TEST=${serviceName}`,
  ],
});

export const containerForService = async (serviceName: string) => {

  /**
   * @see https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/ContainerList
   */
  const existingContainerInfo: ContainerInfo | undefined = (await docker.listContainers({
    filters: JSON.stringify({
      ancestor: [LOGSTASH_IMAGE],
      status: ['running'],
      health: ['healthy'],
      label: [
        `logstashtdd.testcase=${serviceName}`,
      ],
    }),
  })).pop();
  let container: Container;

  if (existingContainerInfo) {
    container = docker.getContainer(existingContainerInfo.Id);
  } else {
    /**
     * @see https://docs.docker.com/engine/api/v1.37/#tag/Container/operation/ContainerCreate
     */
    container = await docker.createContainer(createContainerOpts(serviceName));
    await container.start();
  }

  const info: ContainerInspectInfo = await retry(() => {
    return new Promise((resolve, reject) => {
      container.inspect((err, info) => {
        if (err) {
          console.error(err);
        }
        if (info.State.Health.Status == 'starting') {
          console.debug(`starting ${info.Name.substring(1)}`);
          reject(info);
        } else {
          resolve(info);
        }
      });
    });
  }, null, {
    retriesMax: 60,
    interval: 1000,
    exponential: false,
  });

  console.log(`using ${info.Name.substring(1)} with ports ${JSON.stringify(info.NetworkSettings.Ports)}`);

  const url = `http://127.0.0.1:${info.NetworkSettings.Ports['8080/tcp'][0].HostPort}`;

  return {
    container,
    url,
  };
};

const getArchive = async (container: Container, path: string) =>
  retry(() =>
    new Promise((resolve, reject) => {
      /**
       * @see https://docs.docker.com/engine/api/v1.37/#operation/ContainerArchive
       */
      container.getArchive({
        path: path,
      }, (err, stream) => {
        if (stream) {
          resolve(stream);
        } else {
          reject(err);
        }
      });
    }), null, {
    interval: 0,
    retriesMax: 100,
  });

const extractArchive = (archiveResponse: IncomingMessage) => new Promise<Map<string, string>>((resolve) => {
  const extract = tarExtract({});
  const entries = new Map<string, string>();
  extract.on('entry', (header, stream, next) => {
    streamToString(stream).then((content: string) => {
      entries.set(header.name, content);
      stream.resume();
    });
    stream.on('end', () => next());
  });
  extract.on('finish', () => resolve(entries));
  archiveResponse.pipe(extract);
});

export const transform = async (suite: ContainerSuite, body: object) => {
  const id = v4();
  await send(suite, {
    id,
    ...body,
  });
  return await readEvent(suite, id);
}

const send = (suite: ContainerSuite, body: object) => fetch(suite.url, {
  method: 'POST', body: JSON.stringify(body),
});

const readEvent = async (suite: ContainerSuite, id: string, parse: boolean = true) => {
  const filename = `test_${id}.json`;
  const msg: IncomingMessage = await getArchive(suite.container, `/tmp/${filename}`);
  const files = await extractArchive(msg);
  const file = files.get(filename);
  return parse ? JSON.parse(file) : file;
};

export const close = async (suite: ContainerSuite) => {
  if (process.env.CI) {
    await suite?.container.stop();
  }
};
