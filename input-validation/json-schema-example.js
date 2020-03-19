const Ajv = require('ajv');
const yaml = require('js-yaml');

const validateRequiredBody = async (requiredSchema, requestBody) => {
    let errors = []
    const ajv = new Ajv({allErrors: true});
    const openapi = await getApiDoc();
    const refSchema = await dereferenceApiDoc(openapi);
    const combinedSchema = await combineSchemas(requiredSchema, refSchema);
    ajv.validate(combinedSchema, requestBody);
    if (ajv.errors) {
        ajv.errors.forEach((error) => {
            const dataPath = error.dataPath ? error.dataPath : 'root';
            errors.push({
                key: dataPath,
                message: error.message,
            })
        });
    }
    return errors;
}

const getApiDoc = async () => {
    return await yaml.safeLoad(fs.readFileSync('openapi.yml', 'utf8'));
}

const dereferenceApiDoc = async (openapi) => {
    const parser = await RefParser.dereference(openapi);
    return parser;
}

const combineSchemas = async (requiredSchema, refSchema) => {
    const combinedSchema = {};
    const definition = refSchema.components.schemas[requiredSchema];
    const jsonSchemas = definition.allOf ? definition.allOf : [definition];
    jsonSchemas.forEach((jsonSchema) => {
        Object.assign(combinedSchema, jsonSchema);
    });
    combinedSchema.additionalProperties = false;
    return combinedSchema;
}

const validateRequest = async (requiredBody, requestBody) => {
    const results = await validateRequiredBody(params.requiredBody, requestBody);
    return Promise.resolve(results);
}

module.exports = {validateRequest};

/*
    // example usage:
    let requestBody = {
        test_id:'test_id',
        object_key:{
            string_key: 'test'
        },
        array_number: [1],
        array_objects: [{
            array_string_key: 'string',
            array_number_key: 3
        }]
    }
    await validateRequest('v1-test-request', requestBody);
*/
