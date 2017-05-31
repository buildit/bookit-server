import {GraphAPIParameters} from '../../model/EnvironmentConfig';

import {creds as romanCreds} from './roman/credentials';
import {creds as contosoCreds} from './contoso/credentials';
import {creds as testCreds} from './test/credentials';

export const roman: GraphAPIParameters = romanCreds;
export const contoso: GraphAPIParameters = contosoCreds;
export const test: GraphAPIParameters = testCreds;
