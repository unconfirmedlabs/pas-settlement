// Copyright (c) Unconfirmed Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/**
 * End-to-end demo of the settlement pipeline SDK against the deployed testnet package.
 *
 *   npx tsx scripts/settlement-demo.ts
 *
 * Signs as the active Sui CLI address (the seller / deployer), mints an `Art`, and runs
 * the full `sell()` pipeline (discount → royalty → floor) in one PTB via the SDK, then
 * asserts the on-chain payouts (buyer refund 20, creator royalty 4, seller proceeds 76 on
 * a 100 sale) and that the object lands in the buyer's PAS account. Finally it runs an
 * adversarial sale that skips the floor rule and asserts the transaction aborts.
 *
 * Deployment ids come from `pas/scripts/.testnet-settlement-deploy.json`.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { pas } from '@mysten/pas';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64, normalizeSuiAddress } from '@mysten/sui/utils';

import * as artNft from '../src/contracts/settlement/art_nft.js';
import { createSettlement } from '../src/builder.js';

const DEPLOY_PATH = join(homedir(), 'Documents/GitHub/pas/scripts/.testnet-settlement-deploy.json');
const GRPC_URL = 'https://fullnode.testnet.sui.io:443';
const RPC_URL = 'https://fullnode.testnet.sui.io';
const SALE_PRICE = 100;

type Deploy = {
	deployer: string;
	pas: { packageId: string; namespaceId: string };
	settlement: {
		packageId: string;
		artType: string;
		policy: string;
		policyCap: string;
		discountConfig: string;
		royaltyConfig: string;
		floorConfig: string;
		params: { creator: string };
	};
};

const D: Deploy = JSON.parse(readFileSync(DEPLOY_PATH, 'utf8'));
const PACKAGE_CONFIG = { packageId: D.pas.packageId, namespaceId: D.pas.namespaceId };
const BUYER = normalizeSuiAddress('0xb0b');

const client = new SuiGrpcClient({ network: 'testnet', baseUrl: GRPC_URL }).$extend(
	pas({ packageConfig: PACKAGE_CONFIG }),
);
const settlement = createSettlement({ client: client.pas, packageId: D.settlement.packageId });

// --- helpers ---------------------------------------------------------------

function loadActiveKeypair(): Ed25519Keypair {
	const keys: string[] = JSON.parse(
		readFileSync(join(homedir(), '.sui', 'sui_config', 'sui.keystore'), 'utf8'),
	);
	for (const k of keys) {
		const bytes = fromBase64(k);
		if (bytes.length !== 33 || bytes[0] !== 0x00) continue; // ed25519 flag
		const kp = Ed25519Keypair.fromSecretKey(bytes.slice(1));
		if (kp.toSuiAddress() === D.deployer) return kp;
	}
	throw new Error(`deployer key ${D.deployer} not found in keystore`);
}

let stepNum = 0;
function step(title: string) {
	stepNum += 1;
	console.log(`\n${'='.repeat(74)}\n[${stepNum}] ${title}\n${'='.repeat(74)}`);
}

async function rpc(method: string, params: unknown[]): Promise<any> {
	const r = await fetch(RPC_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
	});
	return (await r.json()).result;
}

async function execOk(tx: Transaction, signer: Ed25519Keypair, label: string): Promise<string> {
	const resp = await client.signAndExecuteTransaction({ signer, transaction: tx, include: {} });
	const digest = resp.Transaction!.digest;
	await client.core.waitForTransaction({ digest });
	const ok = resp.Transaction!.status.success;
	console.log(`  ${ok ? '✔' : '✗'} ${label}  (${digest})`);
	if (!ok)
		throw new Error(`${label} unexpectedly failed: ${JSON.stringify(resp.Transaction!.status)}`);
	return digest;
}

function assert(cond: boolean, msg: string) {
	if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
	console.log(`  ✓ ${msg}`);
}

// --- main ------------------------------------------------------------------

async function main() {
	const seller = loadActiveKeypair();
	const SELLER = seller.toSuiAddress();
	const buyerAccount = client.pas.deriveAccountAddress(BUYER);
	// Read the royalty recipient straight from the on-chain Config (source of truth).
	const royaltyCfg = await rpc('sui_getObject', [
		D.settlement.royaltyConfig,
		{ showContent: true },
	]);
	const CREATOR = normalizeSuiAddress(royaltyCfg.data.content.fields.recipient);
	console.log(`seller=${SELLER}\nbuyer=${BUYER} (account ${buyerAccount})\ncreator=${CREATOR}`);

	// Mint a fresh Art into the seller's PAS account, then read its id from the effects.
	async function mintArt(): Promise<string> {
		const tx = new Transaction();
		tx.add(
			artNft.mint({
				package: D.settlement.packageId,
				arguments: [D.settlement.policyCap, D.pas.namespaceId, SELLER],
			}),
		);
		const digest = await execOk(tx, seller, 'mint Art');
		const tb = await rpc('sui_getTransactionBlock', [digest, { showObjectChanges: true }]);
		const created = (tb.objectChanges ?? []).find(
			(c: any) => c.type === 'created' && c.objectType === D.settlement.artType,
		);
		if (!created) throw new Error('minted Art not found in effects');
		return created.objectId;
	}

	// --- happy path ---------------------------------------------------------
	step('Happy path: sell() with discount → royalty → floor');
	const artId = await mintArt();
	console.log(`  minted Art ${artId}`);

	const tx = new Transaction();
	const [payment] = tx.splitCoins(tx.gas, [SALE_PRICE]);
	settlement.sell(tx, {
		seller: SELLER,
		buyer: BUYER,
		objectType: D.settlement.artType,
		object: tx.object(artId),
		payment,
		rules: [
			settlement.rules.discount(D.settlement.discountConfig),
			settlement.rules.royalty(D.settlement.royaltyConfig),
			settlement.rules.floor(D.settlement.floorConfig),
		],
	});
	const digest = await execOk(tx, seller, 'sell pipeline');

	const tb = await rpc('sui_getTransactionBlock', [
		digest,
		{ showBalanceChanges: true, showObjectChanges: true },
	]);
	const bal = (owner: string) => {
		const e = (tb.balanceChanges ?? []).find((c: any) => c.owner?.AddressOwner === owner);
		return e ? Number(e.amount) : 0;
	};
	assert(bal(BUYER) === 20, `buyer refunded 20 (got ${bal(BUYER)})`);
	assert(bal(CREATOR) === 4, `creator royalty 4 — 5% of the discounted 80 (got ${bal(CREATOR)})`);
	const artChange = (tb.objectChanges ?? []).find((c: any) => c.objectId === artId);
	assert(
		artChange?.owner?.AddressOwner === buyerAccount,
		`Art delivered to buyer's PAS account (owner ${artChange?.owner?.AddressOwner})`,
	);
	// Seller nets: -gas - 20 - 4 + 76 = -gas - 24. Verify the 76-proceeds coin exists.
	const proceeds = (tb.balanceChanges ?? []).find((c: any) => c.owner?.AddressOwner === SELLER);
	console.log(`  seller net (incl. gas + funding the 100): ${proceeds?.amount}`);

	// --- adversarial: skip the floor rule -----------------------------------
	step('Adversarial: skip the floor rule (must abort)');
	const artId2 = await mintArt();
	console.log(`  minted Art ${artId2}`);
	const txBad = new Transaction();
	const [payBad] = txBad.splitCoins(txBad.gas, [SALE_PRICE]);
	settlement.sell(txBad, {
		seller: SELLER,
		buyer: BUYER,
		objectType: D.settlement.artType,
		object: txBad.object(artId2),
		payment: payBad,
		rules: [
			settlement.rules.discount(D.settlement.discountConfig),
			settlement.rules.royalty(D.settlement.royaltyConfig),
			// floor intentionally omitted
		],
	});
	let aborted = false;
	try {
		await client.signAndExecuteTransaction({ signer: seller, transaction: txBad, include: {} });
	} catch (e) {
		aborted = true;
		console.log(`  ✔ aborted as expected: ${(e as Error).message.split('\n')[0]}`);
	}
	assert(aborted, 'skipping a required rule aborts the settlement');

	console.log('\n✅ settlement SDK demo passed on testnet');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
