/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

/**
 * Royalty rule: routes `bp` basis points of the _current_ (possibly discounted)
 * price to the creator.
 */

import {
	MoveTuple,
	MoveStruct,
	normalizeMoveArguments,
	type RawTransactionArgument,
} from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
const $moduleName = 'settlement::royalty';
export const Royalty = new MoveTuple({ name: `${$moduleName}::Royalty`, fields: [bcs.bool()] });
export const Config = new MoveStruct({
	name: `${$moduleName}::Config<phantom T>`,
	fields: {
		id: bcs.Address,
		bp: bcs.u16(),
		recipient: bcs.Address,
	},
});
export interface AddArguments {
	policy: RawTransactionArgument<string>;
	cap: RawTransactionArgument<string>;
	bp: RawTransactionArgument<number>;
	recipient: RawTransactionArgument<string>;
}
export interface AddOptions {
	package?: string;
	arguments:
		| AddArguments
		| [
				policy: RawTransactionArgument<string>,
				cap: RawTransactionArgument<string>,
				bp: RawTransactionArgument<number>,
				recipient: RawTransactionArgument<string>,
		  ];
	typeArguments: [string];
}
export function add(options: AddOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, null, 'u16', 'address'] satisfies (string | null)[];
	const parameterNames = ['policy', 'cap', 'bp', 'recipient'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'royalty',
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
			module: 'royalty',
			function: 'apply',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
