/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

/**
 * Discount rule: lowers the working price by `bp` basis points and refunds that
 * amount to the buyer. Registered before the royalty so the royalty computes off
 * the discounted price — the data dependency that motivates the threaded pipeline.
 */

import {
	MoveTuple,
	MoveStruct,
	normalizeMoveArguments,
	type RawTransactionArgument,
} from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
const $moduleName = 'settlement::discount';
export const Discount = new MoveTuple({ name: `${$moduleName}::Discount`, fields: [bcs.bool()] });
export const Config = new MoveStruct({
	name: `${$moduleName}::Config<phantom T>`,
	fields: {
		id: bcs.Address,
		bp: bcs.u16(),
	},
});
export interface AddArguments {
	policy: RawTransactionArgument<string>;
	cap: RawTransactionArgument<string>;
	bp: RawTransactionArgument<number>;
}
export interface AddOptions {
	package?: string;
	arguments:
		| AddArguments
		| [
				policy: RawTransactionArgument<string>,
				cap: RawTransactionArgument<string>,
				bp: RawTransactionArgument<number>,
		  ];
	typeArguments: [string];
}
export function add(options: AddOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, null, 'u16'] satisfies (string | null)[];
	const parameterNames = ['policy', 'cap', 'bp'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'discount',
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
			module: 'discount',
			function: 'apply',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
