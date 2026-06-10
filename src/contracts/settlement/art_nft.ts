/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

/**
 * Demo NFT whose policy stacks three rules in a maker-chosen order: discount →
 * royalty → floor. The order is set by the sequence of `add` calls, and
 * `request::resolve` enforces a sale satisfies them in exactly that order.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = 'settlement::art_nft';
export const ART_NFT = new MoveStruct({
	name: `${$moduleName}::ART_NFT`,
	fields: {
		dummy_field: bcs.bool(),
	},
});
export const Art = new MoveStruct({
	name: `${$moduleName}::Art`,
	fields: {
		id: bcs.Address,
	},
});
export interface SetupArguments {
	namespace: RawTransactionArgument<string>;
	publisher: RawTransactionArgument<string>;
	discountBp: RawTransactionArgument<number>;
	royaltyBp: RawTransactionArgument<number>;
	creator: RawTransactionArgument<string>;
	floorMin: RawTransactionArgument<number | bigint>;
}
export interface SetupOptions {
	package?: string;
	arguments:
		| SetupArguments
		| [
				namespace: RawTransactionArgument<string>,
				publisher: RawTransactionArgument<string>,
				discountBp: RawTransactionArgument<number>,
				royaltyBp: RawTransactionArgument<number>,
				creator: RawTransactionArgument<string>,
				floorMin: RawTransactionArgument<number | bigint>,
		  ];
}
export function setup(options: SetupOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, null, 'u16', 'u16', 'address', 'u64'] satisfies (string | null)[];
	const parameterNames = [
		'namespace',
		'publisher',
		'discountBp',
		'royaltyBp',
		'creator',
		'floorMin',
	];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'art_nft',
			function: 'setup',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		});
}
export interface MintArguments {
	Cap: RawTransactionArgument<string>;
	namespace: RawTransactionArgument<string>;
	recipient: RawTransactionArgument<string>;
}
export interface MintOptions {
	package?: string;
	arguments:
		| MintArguments
		| [
				Cap: RawTransactionArgument<string>,
				namespace: RawTransactionArgument<string>,
				recipient: RawTransactionArgument<string>,
		  ];
}
export function mint(options: MintOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, null, 'address'] satisfies (string | null)[];
	const parameterNames = ['Cap', 'namespace', 'recipient'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'art_nft',
			function: 'mint',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		});
}
