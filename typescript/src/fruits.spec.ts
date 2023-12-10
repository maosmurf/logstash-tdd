import {expect, use as chaiUse} from "chai";
import jsonSchema from "chai-json-schema";
import {JsonSchema} from "tv4";
import {Pipeline} from "./docker/pipeline";
import * as fs from "fs";
import path from "path";

chaiUse(jsonSchema);

describe('fruits', function () {

    const serviceName = this.fullTitle();
    let pipeline: Pipeline;

    before('start container', async function () {
        this.timeout(60000);
        (pipeline = await Pipeline.forService(serviceName));
    });

    after('down after', async function () {
        this.timeout(20000);
        await pipeline?.close();
    });

    it('fixtures', async function () {
        const fixtures = fs.readdirSync('../fixtures', {
            withFileTypes: true,
        }).filter(item => !item.isDirectory()).map(entry => entry.name);

        const fruitSchema: JsonSchema = {
            title: 'Yummies',
            type: 'object',
            required: ['color'],
            properties: {
                color: {
                    type: 'string'
                },
                name: {
                    type: 'string'
                },
            }
        }

        describe('should match schema', function () {
            fixtures.forEach(fixture => {
                it(path.basename(fixture), async function () {
                    const source = require(`${__dirname}/../../fixtures/${fixture}`);
                    const fruit = await pipeline.transform(source);
                    expect(fruit).to.be.jsonSchema(fruitSchema);
                });
            });
        })
    });

});
