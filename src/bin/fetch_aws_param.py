#!/usr/bin/env python3

import json
import argparse
import subprocess


# docker run -p 8888:8888 -e "USE_CLOUD=true" -e "CLOUD_CONFIG=test" -e "TEST_SECRET=`./fetch_aws_param.py TEST_SECRET`" bookitserver

def parse_args():
    parser = argparse.ArgumentParser(description='Parse AWS parameters')
    parser.add_argument('parameter', help='The parameter to extract')

    return parser.parse_args()


def extract_aws_param(arg_namespace):
    cli_params = vars(arg_namespace)
    return cli_params.get('parameter', 'UNDEFINED')


def call_aws(param_name):
    aws_call = 'aws ssm get-parameters --names %(parameter)s --with-decryption' % {'parameter': param_name}
    response = subprocess.Popen(aws_call, shell=True, stdout=subprocess.PIPE).stdout.read()
    return json.loads(response)


def validate_param(aws_json, param_name):
    invalids = aws_json['InvalidParameters']
    filtered = [invalid for invalid in invalids if invalid == param_name]
    if len(filtered) != 0:
        raise Exception("Amazon doesn't recognize parameter " + param_name)


def get_param_value(aws_json, param_name):
    parameters = aws_json['Parameters']
    return [parameter['Value'] for parameter in parameters if parameter['Name'] == param_name][0]


if __name__ == '__main__':
    args = parse_args()
    param_to_fetch = extract_aws_param(args)
    aws_response = call_aws(param_to_fetch)

    validate_param(aws_response, param_to_fetch)
    print(get_param_value(aws_response, param_to_fetch))
