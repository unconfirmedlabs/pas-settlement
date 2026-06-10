/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { type BcsType } from '@mysten/sui/bcs';
import { MoveStruct } from '../../../utils/index.js';
import * as vec_set from '../sui/vec_set.js';
import * as type_name from '../std/type_name.js';
const $moduleName = 'pas::request';
/** A base request type. Examples: `Request<SendFunds<T>>` `Request<UnlockFunds<T>>` */
export function Request<K extends BcsType<any>>(...typeParameters: [K]) {
	return new MoveStruct({
		name: `${$moduleName}::Request<${typeParameters[0].name as K['name']}>`,
		fields: {
			/** The collected approvals for this request */
			approvals: vec_set.VecSet(type_name.TypeName),
			data: typeParameters[0],
		},
	});
}
