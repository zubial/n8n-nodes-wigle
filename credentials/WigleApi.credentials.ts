import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class WigleApi implements ICredentialType {
	name = 'wigleApi';

	displayName = 'Wigle API';

	properties: INodeProperties[] = [
		{
			displayName: 'Api Key',
			name: 'api_key',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];
}
