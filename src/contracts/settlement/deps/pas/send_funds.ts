/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { type BcsType, bcs } from '@mysten/sui/bcs';
import { MoveStruct } from '../../../utils/index.js';
const $moduleName = 'pas::send_funds';
/**
 * A transfer request that is generated once a send funds request is initialized.
 *
 * A hot potato that is issued when a transfer is initiated. It can only be
 * resolved by presenting a witness `U` that is the witness of `Policy<T>`
 *
 * This enables the `resolve` function of each smart contract to be flexible and
 * implement its own mechanisms for validation. The individual resolution module
 * can:
 *
 * - Check whitelists/blacklists
 * - Enforce holding periods
 * - Collect fees
 * - Emit regulatory events
 * - Handle dividends/distributions
 * - Implement any jurisdiction-specific rules
 */
export function SendFunds<T extends BcsType<any>>(...typeParameters: [T]) {
	return new MoveStruct({
		name: `${$moduleName}::SendFunds<${typeParameters[0].name as T['name']}>`,
		fields: {
			/** `sender` is the wallet OR object address, NOT the account address */
			sender: bcs.Address,
			/** `recipient` is the wallet OR object address, NOT the account address */
			recipient: bcs.Address,
			/** The ID of the account the funds are coming from */
			sender_account_id: bcs.Address,
			/** The ID of the account the funds are going to */
			recipient_account_id: bcs.Address,
			/** The balance being transferred */
			funds: typeParameters[0],
		},
	});
}
