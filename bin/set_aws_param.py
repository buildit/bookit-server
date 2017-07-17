#!/usr/bin/env python

import argparse
from aws_common import set_aws_ssm_parameter

# aws ssm put-parameter --name a_name --value "a value" --type SecureString


def parse_args():
    parser = argparse.ArgumentParser(description='Set AWS SSM parameters')
    parser.add_argument('parameter', help='The parameter to set')
    parser.add_argument('value', help='The value of the parameter')
    parser.add_argument('-o', action='store_true', help='Add this option to overwrite an existing parameter')

    return parser.parse_args()


def extract_cli_aws_params(arg_namespace):
    cli_params = vars(arg_namespace)

    return {
        'parameter': cli_params.get('parameter', 'UNDEFINED'),
        'value': cli_params.get('value', 'UNDEFINED'),
        'overwrite': '--overwrite' if cli_params.get('o') else ''
    }


if __name__ == '__main__':
    args = parse_args()
    param_to_set = extract_cli_aws_params(args)
    set_aws_ssm_parameter(param_to_set)
