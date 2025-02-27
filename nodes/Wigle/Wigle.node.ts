import {
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	IExecuteFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType, NodeOperationError,
} from 'n8n-workflow';
import { IHttpRequestOptions } from 'n8n-workflow/dist/Interfaces';

export class Wigle implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WiGLE',
		name: 'wigle',
		icon: 'file:WigleLogo.svg',
		group: ['output'],
		version: 1,
		triggerPanel: false,
		description: 'Search network',
		subtitle: '={{$parameter["operation"]}}',
		defaults: {
			name: 'WiGLE',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				displayName: 'WiGLE API',
				name: 'wigleApi',
				required: true,
				testedBy: 'wigleConnectionTest',
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				required: true,
				options: [
					{
						name: 'Search WiFi Network',
						value: 'search_network',
						action: 'Search wifi network',
						description: 'Search wifi network (using wigle.net)',
					},
				],
				default: 'search_network',
				noDataExpression: true,
			},
			{
				displayName: 'Search by SSID',
				name: 'query_ssid',
				type: 'string',
				default: 'LIVEBOX',
				description: 'Add a filter on SSID (% _ supported)',
			},
			{
				displayName: 'Search by BSSID',
				name: 'query_bssid',
				type: 'string',
				default: '',
				description: 'Add a filter on BSSID (eg 0A:2C:EF)',
			},
			{
				displayName: 'Filter By Geo',
				name: 'filter_geo',
				type: 'boolean',
				default: false,
				description: 'Add a filter by geolocation',
			},
			{
				displayName: 'Latitude',
				name: 'query_lat',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						filter_geo: [true],
					},
				},
			},
			{
				displayName: 'Longitude',
				name: 'query_lon',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						filter_geo: [true],
					},
				},
			},
			{
				displayName: 'Radius (Km)',
				name: 'query_radius',
				type: 'number',
				default: 0.1,
				displayOptions: {
					show: {
						filter_geo: [true],
					},
				},
			},
			{
				displayName: 'Filter By Location',
				name: 'filter_location',
				type: 'boolean',
				default: false,
				description: 'Add a filter by geolocation',
			},
			{
				displayName: 'Road',
				name: 'query_road',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						filter_location: [true],
					},
				},
			},
			{
				displayName: 'City',
				name: 'query_city',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						filter_location: [true],
					},
				},
			},
			{
				displayName: 'Region',
				name: 'query_region',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						filter_location: [true],
					},
				},
			},
			{
				displayName: 'Postal Code',
				name: 'query_postalcode',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						filter_location: [true],
					},
				},
			},
			{
				displayName: 'Country',
				name: 'query_country',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						filter_location: [true],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Results per Page',
						name: 'results_per_page',
						type: 'number',
						default: 25,
						description: 'The number of results per page',
					},
					{
						displayName: 'Put Results in Field',
						name: 'results_field',
						type: 'string',
						default: 'wigle',
						description: 'The name of the output field to put the data in',
					},
				],
			},
		],
	};

	methods = {
		credentialTest: {
			async wigleConnectionTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data;

				const httpOptions: IHttpRequestOptions = {
					method: 'GET',
					url: `https://api.wigle.net/api/v2/profile/user`,
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Basic ${credentials!.api_key}`,
					},
					json: true,
				};

				try {
					console.log(this.helpers.request(httpOptions));
				} catch (error) {
					return {
						status: 'Error',
						message: error,
					};
				}

				return {
					status: 'OK',
					message: 'Connection successful!',
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let item: INodeExecutionData;
		const returnItems: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			item = { ...items[itemIndex] };
			const newItem: INodeExecutionData = {
				json: item.json,
				pairedItem: {
					item: itemIndex,
				},
			};

			// Parameters & Options
			const operation = this.getNodeParameter('operation', itemIndex);
			const query_ssid = this.getNodeParameter('query_ssid', itemIndex) as string;
			const query_bssid = this.getNodeParameter('query_bssid', itemIndex) as string;

			const filter_geo = this.getNodeParameter('filter_geo', itemIndex) as boolean;
			const filter_location = this.getNodeParameter('filter_location', itemIndex) as boolean;

			const options = this.getNodeParameter('options', itemIndex);

			const results_per_page = options.results_per_page ? (options.results_per_page as number) : 25;
			const results_field = options.result_field ? (options.results_field as string) : 'wigle';

			const credentials = await this.getCredentials('wigleApi');

			if (operation == 'search_network') {
				let query: IDataObject = {};
				if (query_ssid) {
					query['ssidlike'] = query_ssid;
				}

				if (query_bssid) {
					query['netid'] = query_bssid;
				}

				if (filter_geo) {
					const query_lat = this.getNodeParameter('query_lat', itemIndex) as number;
					const query_lon = this.getNodeParameter('query_lon', itemIndex) as number;
					const query_radius = this.getNodeParameter('query_radius', itemIndex) as number;

					query['latrange1'] = query_lat - query_radius / 111;
					query['latrange2'] = query_lat + query_radius / 111;
					query['longrange1'] =
						query_lon - query_radius / (111 * Math.cos((query_lat * Math.PI) / 180));
					query['longrange2'] =
						query_lon + query_radius / (111 * Math.cos((query_lat * Math.PI) / 180));
				}

				if (filter_location) {
					const query_road = this.getNodeParameter('query_road', itemIndex) as string;
					const query_city = this.getNodeParameter('query_city', itemIndex) as string;
					const query_region = this.getNodeParameter('query_region', itemIndex) as string;
					const query_postalcode = this.getNodeParameter('query_postalcode', itemIndex) as string;
					const query_country = this.getNodeParameter('query_country', itemIndex) as string;

					if (query_road !== '') query['road'] = query_road;
					if (query_city !== '') query['city'] = query_city;
					if (query_region !== '') query['region'] = query_region;
					if (query_postalcode !== '') query['postalCode'] = query_postalcode;
					if (query_country !== '') query['country'] = query_country;
				}

				query['resultsPerPage'] = results_per_page;

				const httpOptions: IHttpRequestOptions = {
					method: 'GET',
					url: `https://api.wigle.net/api/v2/network/search`,
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Basic ${credentials!.api_key}`,
					},
					qs: query,
					json: true,
				};

				//console.log(httpOptions);

				try {
					let response = await this.helpers.httpRequest(httpOptions);
					newItem.json[results_field] = response.results;
				} catch (error) {
					if (error.response.status === 400) {
						throw new NodeOperationError(this.getNode(),'Request error.');
					} else if (error.response.status === 402) {
						throw new NodeOperationError(this.getNode(),'Insufficient balance for commercial query.');
					} else if (error.response.status === 410) {
						throw new NodeOperationError(this.getNode(),'Query Failed.');
					} else if (error.response.status === 429) {
						throw new NodeOperationError(this.getNode(),'Too many queries today.');
					} else {
						throw new NodeOperationError(this.getNode(),'Unknown error occurred.');
					}
				}
			}

			returnItems.push(newItem);
		}

		return [returnItems];
	}
}
