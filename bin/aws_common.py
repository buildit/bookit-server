#!/usr/bin/env python

import json
import subprocess


def validate_ssm_parameter(aws_json, param_name):
    invalids = aws_json['InvalidParameters']
    filtered = [invalid for invalid in invalids if invalid == param_name]
    if len(filtered) != 0:
        raise Exception("Amazon doesn't recognize parameter " + param_name)


def aws_get_ssm_parameter(param_name):
    aws_call = 'aws ssm get-parameters --names %(parameter)s --with-decryption' % {'parameter': param_name}
    response = subprocess.Popen(aws_call, shell=True, stdout=subprocess.PIPE).stdout.read()
    return json.loads(response)


def set_aws_ssm_parameter(param_object):
    aws_call_template = 'aws ssm put-parameter --name %(parameter)s --value %(value)s %(overwrite)s --type SecureString'
    aws_call = aws_call_template % param_object
    return subprocess.Popen(aws_call, shell=True, stdout=subprocess.PIPE).stdout.read()


def get_ssm_param_value(aws_json, param_name):
    parameters = aws_json['Parameters']
    return [parameter['Value'] for parameter in parameters if parameter['Name'] == param_name][0]


def extract_aws_ssm_parameter(arg_namespace):
    cli_params = vars(arg_namespace)
    return cli_params.get('parameter', 'UNDEFINED')


