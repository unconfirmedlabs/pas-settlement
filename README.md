# @unconfirmed/pas-settlement

A composable **settlement-pipeline** SDK built on [`@mysten/pas`](https://www.npmjs.com/package/@mysten/pas)
(the Sui Permissioned Assets Standard).

A settlement threads an in-flight PAS transfer request and the buyer's payment through an ordered
chain of app-defined rules — each takes its cut / adjusts the price and stamps a receipt — then
finalizes, delivering the object to the buyer's PAS account. The rule order is enforced on-chain:
`finalize` aborts unless the receipts match the order the policy maker registered.

This is a full-stack package: the **Move contracts** (`move/` — `settlement` / `discount` / `royalty`
/ `floor` / `art_nft`, depending only on [`pas`](https://github.com/MystenLabs/pas)) **and** the
TypeScript SDK (generated bindings + a fluent builder) that drives them. The pipeline rides on PAS's
`add_required_approval` receipt primitive; everything payment- and economics-specific lives here, not
in pas core.

### Layout

```
move/   # the settlement Move package (settlement + discount/royalty/floor rules + art_nft demo)
src/    # the TypeScript SDK (builder + generated contract bindings)
scripts/settlement-demo.ts  # end-to-end testnet demo
deployment.testnet.json     # deployed testnet ids the demo reads
```

## Install

```bash
bun add @unconfirmed/pas-settlement @mysten/pas @mysten/sui
```

## Usage

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';
import { pas } from '@mysten/pas';
import { createSettlement } from '@unconfirmed/pas-settlement';

const client = new SuiGrpcClient({ network: 'testnet' }).$extend(pas());
const settlement = createSettlement({ client: client.pas, packageId: SETTLEMENT_PACKAGE_ID });

const tx = new Transaction();
const [payment] = tx.splitCoins(tx.gas, [price]);

// One-shot: beginSendObject → begin → rules (in the maker's order) → finalize.
settlement.sell(tx, {
	seller,
	buyer,
	objectType: ART_TYPE,
	object: tx.object(artId),
	payment,
	rules: [
		settlement.rules.discount(discountConfigId),
		settlement.rules.royalty(royaltyConfigId),
		settlement.rules.floor(floorConfigId),
	],
	// policy defaults to client.pas.deriveObjectPolicyAddress(objectType)
});

// ... sign and execute
```

The low-level steps (`settlement.begin`, `settlement.rules.*(...).apply`, `settlement.finalize`) are
also exported for callers that build the pipeline by hand.

The front half of the send — resolving accounts, minting the `Auth`, and producing the transfer
request — is delegated to `client.pas.call.beginSendObject` (the `@mysten/pas` custom-resolution
primitive), so the in-flight request is threaded through the rules and resolved by `finalize`.

## Development

This package targets the published `@mysten/pas` **≥ 0.2.0** (the first release that includes the
`beginSendObject` primitive). Until that version is on npm, develop against a local build of
`@mysten/pas` — e.g. produce a tarball from a local `ts-sdks` checkout and add it:

```bash
# from a local clone of mystenlabs/ts-sdks, on a branch that has beginSendObject:
pnpm --filter @mysten/pas build
pnpm --filter @mysten/pas pack --pack-destination /path/to/pas-settlement/vendor   # vendor/ is gitignored
cd /path/to/pas-settlement && bun add --dev ./vendor/mysten-pas-*.tgz
```

(The tarball declares `@mysten/sui` as a peer, so there's a single `@mysten/sui` instance — required
for `Transaction` building to work.)

The Move package in `move/` depends on `pas` via a git dependency (pointed at the fork carrying
object support for now; repoint to `MystenLabs/pas` once it lands upstream):

```bash
cd move && sui move test --build-env testnet
```

- `bun run typecheck` — type-check `src` (needs `@mysten/pas` resolvable; see above)
- `bun run test` — unit tests (the builder's command sequence; no `@mysten/pas` runtime needed)
- `bun run build` — bundle with tsdown
- `bun run codegen` — regenerate `src/contracts` from `move/` (needs `@mysten/codegen`, and a sibling
  `pas` checkout for the dependency bindings)

`scripts/settlement-demo.ts` runs the full pipeline end-to-end on testnet against the ids in
`deployment.testnet.json`.

## License

Apache-2.0 — Unconfirmed Labs, Inc.
