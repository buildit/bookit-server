#!/usr/bin/env python3

import json
import argparse
import subprocess


# aws ssm put-parameter --name a_name --value "a value" --type SecureString
def parse_args():
    parser = argparse.ArgumentParser(description='Set AWS SSM parameters')
    parser.add_argument('parameter', help='The parameter to set')
    parser.add_argument('value', help='The value of the parameter')
    parser.add_argument('-o', action='store_true', help='Add this option to overwrite an existing parameter')

    return parser.parse_args()


def extract_aws_params(arg_namespace):
    cli_params = vars(arg_namespace)

    return {
        'parameter': cli_params.get('parameter', 'UNDEFINED'),
        'value': cli_params.get('value', 'UNDEFINED'),
        'overwrite': '--overwrite' if cli_params.get('o') else ''
    }


def set_aws_param(param_object):
    aws_call_template = 'aws ssm put-parameter --name %(parameter)s --value %(value)s %(overwrite)s --type SecureString'
    aws_call = aws_call_template % param_object
    return subprocess.Popen(aws_call, shell=True, stdout=subprocess.PIPE).stdout.read()


if __name__ == '__main__':
    args = parse_args()
    param_to_set = extract_aws_params(args)
    set_aws_param(param_to_set)
