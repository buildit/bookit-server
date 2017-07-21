#!/usr/bin/env python

import json
import argparse
import subprocess


# aws ssm put-parameter --name a_name --value "a value" --type SecureString
def parse_args():
    parser = argparse.ArgumentParser(description='Set AWS SSM parameters')
    parser.add_argument('parameter', help='The parameter to set')
    # parser.add_argument('-o', action='store_true', help='Add this option to overwrite an existing parameter')

    return parser.parse_args()


def extract_aws_params(arg_namespace):
    cli_params = vars(arg_namespace)
    return cli_params.get('parameter', 'UNDEFINED')


def get_aws_instance_identity():
    identity_curl = 'curl http://169.254.169.254/latest/dynamic/instance-identity/document'
    _identity = subprocess.Popen(identity_curl, shell=True, stdout=subprocess.PIPE).stdout.read()
    return json.loads(_identity)


def get_test_identity():
    with open('identity_response.txt', 'r') as response:
        _identity = response.read()
        return json.loads(_identity)


if __name__ == '__main__':
    args = parse_args()
    parameter = extract_aws_params(args)
    identity = get_aws_instance_identity()
    print(identity[parameter])
