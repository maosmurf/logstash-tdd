import Dockerode from 'dockerode';

export const docker = new Dockerode();

export const LOGSTASH_IMAGE = 'docker.elastic.co/logstash/logstash:8.11.1';
