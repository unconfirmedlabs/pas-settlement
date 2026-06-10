/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

/**
 * A composable "settlement pipeline" for PAS object transfers — an app-layer
 * convention built on the receipt primitive (`policy::add_required_approval` +
 * `request::resolve`), NOT part of the framework.
 *
 * A `Settlement` is a hot potato that threads the in-flight transfer request, the
 * buyer's payment, and a working `price` through a chain of rules. Each rule reads
 * the previous rule's output, takes its cut / adjusts the price, and stamps its
 * receipt — so order-dependent economics (a discount feeding a royalty) hold by
 * construction. Because it has no abilities, it cannot be dropped or stored: the
 * pipeline must run to `finalize` in a single transaction.
 *
 * The object being moved is read-only and _bound inside the request_ — rules read
 * it via `object()`, so there is nothing to substitute.
 */

import { type BcsType, bcs } from '@mysten/sui/bcs';
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { type Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import * as request from './deps/pas/request.js';
import * as send_funds from './deps/pas/send_funds.js';
import * as coin from './deps/sui/coin.js';
const $moduleName = 'settlement::settlement';
/**
 * Threaded through a sale's rules. No `key`/`store`/`drop` → must be `finalize`d.
 * (The `Coin` field is fine here — this is a transient hot potato, never stored.)
 */
export function Settlement<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::Settlement<${typeParameters[0].name as T['name']}>`,
		fields: {
			request: request.Request(send_funds.SendFunds(typeParameters[0])),
			payment: coin.Coin,
			price: bcs.u64(),
			buyer: bcs.Address,
			seller: bcs.Address,
		},
	});
}
export interface BeginArguments {
	request: TransactionArgument;
	payment: RawTransactionArgument<string>;
	buyer: RawTransactionArgument<string>;
}
export interface BeginOptions {
	package?: string;
	arguments:
		| BeginArguments
		| [
				request: TransactionArgument,
				payment: RawTransactionArgument<string>,
				buyer: RawTransactionArgument<string>,
		  ];
	typeArguments: [string];
}
/** Begin a settlement around a transfer `request` and the buyer's `payment`. */
export function begin(options: BeginOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, null, 'address'] satisfies (string | null)[];
	const parameterNames = ['request', 'payment', 'buyer'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'settlement',
			function: 'begin',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface PriceArguments {
	s: TransactionArgument;
}
export interface PriceOptions {
	package?: string;
	arguments: PriceArguments | [s: TransactionArgument];
	typeArguments: [string];
}
export function price(options: PriceOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['s'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'settlement',
			function: 'price',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface BuyerArguments {
	s: TransactionArgument;
}
export interface BuyerOptions {
	package?: string;
	arguments: BuyerArguments | [s: TransactionArgument];
	typeArguments: [string];
}
export function buyer(options: BuyerOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['s'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'settlement',
			function: 'buyer',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface SellerArguments {
	s: TransactionArgument;
}
export interface SellerOptions {
	package?: string;
	arguments: SellerArguments | [s: TransactionArgument];
	typeArguments: [string];
}
export function seller(options: SellerOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['s'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'settlement',
			function: 'seller',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface ObjectArguments {
	s: TransactionArgument;
}
export interface ObjectOptions {
	package?: string;
	arguments: ObjectArguments | [s: TransactionArgument];
	typeArguments: [string];
}
/** The object being transferred, read-only — bound in the request, so unswappable. */
export function object(options: ObjectOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null] satisfies (string | null)[];
	const parameterNames = ['s'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'settlement',
			function: 'object',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface ReducePriceArguments {
	s: TransactionArgument;
	by: RawTransactionArgument<number | bigint>;
}
export interface ReducePriceOptions {
	package?: string;
	arguments:
		| ReducePriceArguments
		| [s: TransactionArgument, by: RawTransactionArgument<number | bigint>];
	typeArguments: [string];
}
/** Lower the working price downstream rules compute against (e.g. a discount). */
export function reducePrice(options: ReducePriceOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, 'u64'] satisfies (string | null)[];
	const parameterNames = ['s', 'by'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'settlement',
			function: 'reduce_price',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface TakeArguments {
	s: TransactionArgument;
	amount: RawTransactionArgument<number | bigint>;
}
export interface TakeOptions {
	package?: string;
	arguments:
		| TakeArguments
		| [s: TransactionArgument, amount: RawTransactionArgument<number | bigint>];
	typeArguments: [string];
}
/** Split `amount` out of the payment for a rule to route (royalty cut, refund, …). */
export function take(options: TakeOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, 'u64'] satisfies (string | null)[];
	const parameterNames = ['s', 'amount'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'settlement',
			function: 'take',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface ApproveArguments<W extends BcsType<any>> {
	s: TransactionArgument;
	witness: RawTransactionArgument<W>;
}
export interface ApproveOptions<W extends BcsType<any>> {
	package?: string;
	arguments: ApproveArguments<W> | [s: TransactionArgument, witness: RawTransactionArgument<W>];
	typeArguments: [string, string];
}
/**
 * Stamp a rule's receipt. Only the rule's defining module can construct `W`, so a
 * rule can only ever attest to itself.
 */
export function approve<W extends BcsType<any>>(options: ApproveOptions<W>) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, `${options.typeArguments[1]}`] satisfies (string | null)[];
	const parameterNames = ['s', 'witness'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'settlement',
			function: 'approve',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
export interface FinalizeArguments {
	s: TransactionArgument;
	policy: RawTransactionArgument<string>;
}
export interface FinalizeOptions {
	package?: string;
	arguments: FinalizeArguments | [s: TransactionArgument, policy: RawTransactionArgument<string>];
	typeArguments: [string];
}
/**
 * Finalize: the remaining payment goes to the seller, then the request resolves —
 * which checks every required rule's receipt is present, in the maker's order, and
 * delivers the object to the buyer's account.
 */
export function finalize(options: FinalizeOptions) {
	const packageAddress = options.package ?? 'settlement';
	const argumentsTypes = [null, null] satisfies (string | null)[];
	const parameterNames = ['s', 'policy'];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'settlement',
			function: 'finalize',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
			typeArguments: options.typeArguments,
		});
}
