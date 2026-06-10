/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

/**
 * Floor-price rule: a check-only rule that asserts the (post-discount) price is at
 * least `min`. It threads no value — it just inspects and stamps its receipt.
 */

import {
	MoveTuple,
	MoveStruct,
	normalizeMoveArguments,
	type RawTransactionArgument,
} from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
const $moduleName = 'settlement::floor';
export const Floor = new MoveTuple({ name: `${$moduleName}::Floor`, fields: [bcs.bool()] });
export const Config = new MoveStruct({
	name: `${$moduleName}::Config<phantom T>`,
	fields: {
		id: bcs.Address,
		min: bcs.u64(),
	},
});
export interface AddArguments {
	policy: RawTransactionArgument<string>;
	cap: RawTransactionArgument<string>;
	min: RawTransactionArgument<number | bigint>;
}
export interface AddOptions {
	package?: string;
	arguments:
		| AddArguments
		| [
				policy: RawTransactionArgument<string>,
				cap: RawTransactionArgument<string>,
				min: RawTransactionArgument<number | bigint>,
		  ];
	typeArguments: [string];
}
export function add(options: AddOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, null, 'u64'] satisfies (string | null)[];
	const parameterNames = ['policy', 'cap', 'min'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'floor',
			function: 'add',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface ApplyArguments {
	s: TransactionArgument;
	config: RawTransactionArgument<string>;
}
export interface ApplyOptions {
	package?: string;
	arguments: ApplyArguments | [s: TransactionArgument, config: RawTransactionArgument<string>];
	typeArguments: [string];
}
export function apply(options: ApplyOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, null] satisfies (string | null)[];
	const parameterNames = ['s', 'config'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'floor',
			function: 'apply',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
