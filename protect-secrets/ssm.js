const AWS = require('aws-sdk');
const ssm = new AWS.SSM();

const upload = async (param) => {
    await ssm.putParameter(param).promise();
    return Promise.resolve(true);
};

const download = async (paramName) => {
    try {
        const result = await ssm.getParameter({Name: paramName,WithDecryption: true}).promise();
        if (result) {
            return result.Parameter.Value;
        }
    } catch (error) {
        return error;
    }
};

module.exports = {upload, download};
