import simplejson as json
import jsonref
from jsonschema import Draft7Validator
import yaml


class RequestValidator:

    def validate_request(self, **kwargs):
        event = self.EventClient.request
        return self._required_body(kwargs['required_body'], event.get('body'))

    def _required_body(self, schema, request_body):
        if not isinstance(request_body, dict):
            self.ResponseClient.set_error('message', 'request body is not valid JSON')
        else:
            self._check_body_for_errors(schema, request_body)

    def _check_body_for_errors(self, schema, request):
        errors = []
        json_schema = self._get_combined_schema(schema)
        schema_validator = Draft7Validator(json_schema)
        for schema_error in sorted(schema_validator.iter_errors(request), key=str):
            path = '.'.join(str(path) for path in schema_error.path)
            key = path if path else 'root'
            errors.append({
                "key": key,
                "message": schema_error.message
            })
        return errors

    def _get_combined_schema(self, schema):
        combined_schema = {}
        swagger = self._get_api_doc()
        definitions = jsonref.loads(json.dumps(swagger))['components']['schemas']
        definition_schema = definitions[schema]
        json_schemas = definition_schema['allOf'] if definition_schema.get('allOf') else [definition_schema]
        for json_schema in json_schemas:
            combined_schema.update(json_schema)
        combined_schema['additionalProperties'] = False
        return combined_schema

    def _get_api_doc(self):
        with open('openapi.yml') as api_doc:
            return yaml.load(api_doc, Loader=yaml.FullLoader)


'''
    # example usage:
    requestBody = {
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
    validator = RequestValidator()
    errors = validator.validate_request(required_body='v1-test-request', body=requestBody)
'''
