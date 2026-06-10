// Copyright (c) Unconfirmed Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { PASClient } from '@mysten/pas';
import type {
	Transaction,
	TransactionArgument,
	TransactionObjectArgument,
	TransactionResult,
} from '@mysten/sui/transactions';

import * as discountRule from './contracts/settlement/discount.js';
import * as floorRule from './contracts/settlement/floor.js';
import * as royaltyRule from './contracts/settlement/royalty.js';
import * as settlementMod from './contracts/settlement/settlement.js';

/** A `Coin<SUI>` the buyer pays with — a transaction object argument or an object id. */
export type Payment = TransactionObjectArgument | string;

export interface SettlementConfig {
	/**
	 * The PAS client (the `.pas` namespace of a `SuiClient.$extend(pas(...))`). Provides
	 * `beginSendObject` (the raw-request primitive the pipeline threads) and object-policy
	 * derivation.
	 */
	client: PASClient;
	/** The deployed `settlement` Move package id. */
	packageId: string;
}

/**
 * A single rule applied to the in-flight `Settlement`, in the maker's order. Each rule
 * reads the previous rule's output, takes its cut / adjusts the price, stamps its receipt,
 * and returns the threaded settlement. The order of the `rules` array MUST match the order
 * the policy maker registered the approvals, or `finalize` aborts.
 */
export interface SettlementRule {
	/** The rule module — for ordering clarity / diagnostics. */
	readonly kind: 'discount' | 'royalty' | 'floor';
	/** Append this rule's `apply` call, threading `settlement` through it. */
	apply(tx: Transaction, settlement: TransactionArgument, objectType: string): TransactionResult;
}

export interface BeginOptions {
	/** The in-flight transfer request (from `client.call.beginSendObject`). */
	request: TransactionArgument;
	/** The buyer's `Coin<SUI>` payment. */
	payment: Payment;
	/** The buyer's address. */
	buyer: string;
	/** The full type of the object being sold (e.g. "0xabc::art_nft::Art"). */
	objectType: string;
}

export interface FinalizeOptions {
	/** The threaded settlement after all rules have run. */
	settlement: TransactionArgument;
	/** The `Policy<T>` id for the object type. */
	policy: string;
	/** The full type of the object being sold. */
	objectType: string;
}

export interface SellOptions {
	/** Seller's address (owner of the source account holding the object). */
	seller: string;
	/** Buyer's address — the object is delivered to the buyer's PAS account. */
	buyer: string;
	/** The full type of the object being sold. */
	objectType: string;
	/** The object to sell, as a receiving argument: `tx.object(id)` or `tx.receivingRef(ref)`. */
	object: TransactionObjectArgument;
	/** The buyer's `Coin<SUI>` payment. */
	payment: Payment;
	/** The pipeline rules, in the maker's registered order. */
	rules: SettlementRule[];
	/** The `Policy<T>` id. Defaults to `client.deriveObjectPolicyAddress(objectType)`. */
	policy?: string;
}

/**
 * A fluent builder for the app-layer **settlement pipeline** — a composable convention on
 * top of the PAS receipt primitive. Thread a transfer request and the buyer's payment
 * through ordered rules (discount → royalty → floor), each taking its cut, then `finalize`
 * to deliver the object and pay out.
 *
 * Use {@link createSettlement} to construct one bound to a deployed `settlement` package.
 */
export function createSettlement({ client, packageId }: SettlementConfig) {
	/** Begin a settlement around a transfer `request` and the buyer's `payment`. */
	function begin(tx: Transaction, { request, payment, buyer, objectType }: BeginOptions) {
		return tx.add(
			settlementMod.begin({
				package: packageId,
				arguments: [request, payment, buyer],
				typeArguments: [objectType],
			}),
		);
	}

	/** Finalize: pay the seller, resolve the request (checks receipts), deliver the object. */
	function finalize(tx: Transaction, { settlement, policy, objectType }: FinalizeOptions) {
		return tx.add(
			settlementMod.finalize({
				package: packageId,
				arguments: [settlement, policy],
				typeArguments: [objectType],
			}),
		);
	}

	function ruleApply(
		mod: { apply: typeof discountRule.apply },
		kind: SettlementRule['kind'],
		config: string,
	): SettlementRule {
		return {
			kind,
			apply: (tx, settlement, objectType) =>
				tx.add(
					mod.apply({
						package: packageId,
						arguments: [settlement, config],
						typeArguments: [objectType],
					}),
				),
		};
	}

	/** Rule descriptors. Compose them, in the maker's order, into {@link sell}. */
	const rules = {
		/** A discount that lowers the working price and refunds the buyer. */
		discount: (config: string) => ruleApply(discountRule, 'discount', config),
		/** A royalty that pays a recipient a percentage of the (current) price. */
		royalty: (config: string) => ruleApply(royaltyRule, 'royalty', config),
		/** A floor check that asserts the price is at least a minimum. */
		floor: (config: string) => ruleApply(floorRule, 'floor', config),
	};

	/**
	 * Build the full sale in one call: `beginSendObject` → `begin` → each rule in order →
	 * `finalize`. The object is delivered to the buyer's PAS account on `finalize`.
	 */
	function sell(tx: Transaction, options: SellOptions) {
		const { seller, buyer, objectType, object, payment, policy } = options;
		const request = tx.add(
			client.call.beginSendObject({ from: seller, to: buyer, objectType, object }),
		);
		let settlement: TransactionArgument = begin(tx, { request, payment, buyer, objectType });
		for (const rule of options.rules) {
			settlement = rule.apply(tx, settlement, objectType);
		}
		return finalize(tx, {
			settlement,
			policy: policy ?? client.deriveObjectPolicyAddress(objectType),
			objectType,
		});
	}

	return { begin, finalize, rules, sell };
}

export type SettlementBuilder = ReturnType<typeof createSettlement>;
