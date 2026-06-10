// Copyright (c) Unconfirmed Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { SuiCodegenConfig } from '@mysten/codegen';

// Generates typed bindings for the app-layer `settlement` Move example and its PAS
// dependency closure (so cross-package type references resolve to sibling generated
// files), following the monorepo convention of generating the full dep closure.
const config: SuiCodegenConfig = {
	output: './src/contracts',
	packages: [
		{
			package: 'settlement',
			path: '../../pas/packages/examples/settlement',
		},
		{
			package: '@mysten/pas',
			path: '../../pas/packages/pas',
		},
		{
			package: '@mysten/ptb',
			path: '../../pas/packages/ptb',
		},
		{
			package: '0x0000000000000000000000000000000000000000000000000000000000000002',
			packageName: 'sui',
			network: 'testnet',
			generate: {
				modules: ['dynamic_field'],
			},
		},
	],
};

export default config;
