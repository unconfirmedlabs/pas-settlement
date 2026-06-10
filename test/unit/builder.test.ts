// Copyright (c) Unconfirmed Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { PASClient } from '@mysten/pas';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { describe, expect, it, vi } from 'vitest';

import { createSettlement } from '../../src/builder.js';

const PKG = normalizeSuiAddress('0x5e7');
const ART = `${normalizeSuiAddress('0xa27')}::art_nft::Art`;
const SELLER = normalizeSuiAddress('0x5e11e7');
const BUYER = normalizeSuiAddress('0xb0b');
const DISCOUNT = normalizeSuiAddress('0xd15');
const ROYALTY = normalizeSuiAddress('0x817');
const FLOOR = normalizeSuiAddress('0xf10');
const DERIVED_POLICY = normalizeSuiAddress('0x901');

// A stub PAS client — `beginSendObject` is exercised on real testnet in the demo; here we
// only assert the settlement builder calls it correctly and emits the right tail. Using a
// stub (and a type-only PASClient import) keeps this unit free of @mysten/pas at runtime.
function makeSdk() {
	const beginSendObject = vi.fn(
		(_opts: { from: string; to: string; objectType: string; object: unknown }) =>
			(tx: Transaction) =>
				tx.object(normalizeSuiAddress('0x9e0')),
	);
	const deriveObjectPolicyAddress = vi.fn((_objectType: string) => DERIVED_POLICY);
	const client = { call: { beginSendObject }, deriveObjectPolicyAddress } as unknown as PASClient;
	return {
		sdk: createSettlement({ client, packageId: PKG }),
		beginSendObject,
		deriveObjectPolicyAddress,
	};
}

type Call = { pkg: string; module: string; fn: string; types?: readonly string[] };

function moveCalls(tx: Transaction): Call[] {
	return tx
		.getData()
		.commands.filter((c) => c.$kind === 'MoveCall')
		.map((c) => {
			const mc = (c as Extract<typeof c, { $kind: 'MoveCall' }>).MoveCall;
			return { pkg: mc.package, module: mc.module, fn: mc.function, types: mc.typeArguments };
		});
}

describe('settlement builder — sell()', () => {
	it('emits begin → discount → royalty → floor → finalize in the maker order', () => {
		const { sdk, beginSendObject, deriveObjectPolicyAddress } = makeSdk();
		const tx = new Transaction();
		const object = tx.object(normalizeSuiAddress('0xabc'));

		sdk.sell(tx, {
			seller: SELLER,
			buyer: BUYER,
			objectType: ART,
			object,
			payment: tx.object(normalizeSuiAddress('0xc01')),
			rules: [sdk.rules.discount(DISCOUNT), sdk.rules.royalty(ROYALTY), sdk.rules.floor(FLOOR)],
		});

		// The send front-half is delegated to the core primitive...
		expect(beginSendObject).toHaveBeenCalledOnce();
		expect(beginSendObject.mock.calls[0][0]).toMatchObject({
			from: SELLER,
			to: BUYER,
			objectType: ART,
			object,
		});
		// ...and the policy defaults to the derived object policy.
		expect(deriveObjectPolicyAddress).toHaveBeenCalledWith(ART);

		// The settlement tail is concrete move calls, in the maker's order.
		expect(moveCalls(tx)).toEqual([
			{ pkg: PKG, module: 'settlement', fn: 'begin', types: [ART] },
			{ pkg: PKG, module: 'discount', fn: 'apply', types: [ART] },
			{ pkg: PKG, module: 'royalty', fn: 'apply', types: [ART] },
			{ pkg: PKG, module: 'floor', fn: 'apply', types: [ART] },
			{ pkg: PKG, module: 'settlement', fn: 'finalize', types: [ART] },
		]);
	});

	it('preserves the caller-supplied rule order (royalty before discount)', () => {
		const { sdk } = makeSdk();
		const tx = new Transaction();

		sdk.sell(tx, {
			seller: SELLER,
			buyer: BUYER,
			objectType: ART,
			object: tx.object(normalizeSuiAddress('0xabc')),
			payment: tx.object(normalizeSuiAddress('0xc01')),
			rules: [sdk.rules.royalty(ROYALTY), sdk.rules.discount(DISCOUNT)],
		});

		expect(moveCalls(tx).map((c) => `${c.module}::${c.fn}`)).toEqual([
			'settlement::begin',
			'royalty::apply',
			'discount::apply',
			'settlement::finalize',
		]);
	});

	it('uses an explicit policy when provided (no derivation)', () => {
		const { sdk, deriveObjectPolicyAddress } = makeSdk();
		const tx = new Transaction();

		sdk.sell(tx, {
			seller: SELLER,
			buyer: BUYER,
			objectType: ART,
			object: tx.object(normalizeSuiAddress('0xabc')),
			payment: tx.object(normalizeSuiAddress('0xc01')),
			rules: [sdk.rules.floor(FLOOR)],
			policy: normalizeSuiAddress('0xexplicit'),
		});

		expect(deriveObjectPolicyAddress).not.toHaveBeenCalled();
	});

	it('low-level begin/finalize + rule descriptors thread a settlement', () => {
		const { sdk } = makeSdk();
		const tx = new Transaction();

		const request = tx.object(normalizeSuiAddress('0xdead'));
		let s = sdk.begin(tx, {
			request,
			payment: tx.object(normalizeSuiAddress('0xc01')),
			buyer: BUYER,
			objectType: ART,
		});
		s = sdk.rules.floor(FLOOR).apply(tx, s, ART);
		sdk.finalize(tx, { settlement: s, policy: normalizeSuiAddress('0x9011c7'), objectType: ART });

		expect(moveCalls(tx).map((c) => `${c.module}::${c.fn}`)).toEqual([
			'settlement::begin',
			'floor::apply',
			'settlement::finalize',
		]);
	});
});
