import boto3


class SSMInterface:

    def __init__(self):
        self.client = boto3.client('ssm')

    def upload(self, **kwargs):
        response = self.client.put_parameter(
            Name=kwargs['name'],
            Value=kwargs['value'],
            Type='SecureString',
            Overwrite=kwargs['overwrite'],
        )
        return response

    def download(self, **kwargs):
        response = self.client.get_parameter(
            Name=kwargs['name'],
            WithDecryption=True
        )
        return response

'''
    # example usage:

    ssm = SSMInterface()
    ssm.upload(name='/some/key', value='test', overwrite=True)
    ssm.download(name='/some/key', decryption=True)
'''
