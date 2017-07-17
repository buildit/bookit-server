#!/usr/bin/env python

import argparse
from aws_common import aws_get_ssm_parameter, validate_ssm_parameter, get_ssm_param_value


# docker run -p 8888:8888 -e "USE_CLOUD=true" -e "CLOUD_CONFIG=test" -e "TEST_SECRET=`./fetch_aws_param.py TEST_SECRET`" bookitserver


def parse_args():
    parser = argparse.ArgumentParser(description='Parse AWS parameters')
    parser.add_argument('parameter', help='The parameter to extract')

    return parser.parse_args()


def extract_cli_aws_parameter(arg_namespace):
    cli_params = vars(arg_namespace)
    return cli_params.get('parameter', 'UNDEFINED')


if __name__ == '__main__':
    args = parse_args()
    param_to_fetch = extract_cli_aws_parameter(args)
    aws_response = aws_get_ssm_parameter(param_to_fetch)

    validate_ssm_parameter(aws_response, param_to_fetch)
    print(get_ssm_param_value(aws_response, param_to_fetch))
